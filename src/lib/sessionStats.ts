import { db } from '../db/db'
import { BODY_PARTS } from '../db/types'
import type { BodyPart } from '../db/types'

// A commonly-cited weekly landmark for continued growth; used only to scale
// the muscle map's 0-100% fill, not as prescriptive advice. Easy to retune.
const WEEKLY_SET_TARGET = 12

export interface SessionStats {
  durationSeconds: number
  volume: number // lb, sum of weight x reps across the session
  prExerciseIds: number[] // exercises where this session beat every prior session's best
}

export async function getSessionStats(sessionId: number): Promise<SessionStats> {
  const [session, sets] = await Promise.all([
    db.sessions.get(sessionId),
    db.setEntries.where('sessionId').equals(sessionId).toArray(),
  ])

  const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
  const durationSeconds =
    session?.completedAt && session.date
      ? Math.max(0, (new Date(session.completedAt).getTime() - new Date(session.date).getTime()) / 1000)
      : 0

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))]
  const prExerciseIds: number[] = []
  for (const exerciseId of exerciseIds) {
    const thisSessionMax = Math.max(...sets.filter((s) => s.exerciseId === exerciseId).map((s) => s.weight))
    const priorSets = await db.setEntries
      .where('exerciseId')
      .equals(exerciseId)
      .and((s) => s.sessionId !== sessionId)
      .toArray()
    if (priorSets.length === 0) continue // first time on an exercise isn't a PR over a prior best
    const priorMax = Math.max(...priorSets.map((s) => s.weight))
    if (thisSessionMax > priorMax) prExerciseIds.push(exerciseId)
  }

  return { durationSeconds, volume, prExerciseIds }
}

export async function getWeeklyActivation(referenceDate: Date = new Date()): Promise<Record<BodyPart, number>> {
  const start = startOfWeek(referenceDate)
  const end = addDays(start, 7)

  const [sessions, exercises] = await Promise.all([db.sessions.toArray(), db.exercises.toArray()])
  const exerciseBodyPart = new Map(exercises.map((e) => [e.id!, e.bodyPart]))

  const weekSessionIds = new Set(
    sessions.filter((s) => inRange(new Date(s.date), start, end)).map((s) => s.id!),
  )

  const counts = Object.fromEntries(BODY_PARTS.map((bp) => [bp.id, 0])) as Record<BodyPart, number>
  if (weekSessionIds.size > 0) {
    const allSets = await db.setEntries.toArray()
    for (const set of allSets) {
      if (!weekSessionIds.has(set.sessionId)) continue
      const bodyPart = exerciseBodyPart.get(set.exerciseId)
      if (bodyPart) counts[bodyPart] += 1
    }
  }

  const activation = {} as Record<BodyPart, number>
  for (const bp of BODY_PARTS) {
    activation[bp.id] = Math.min(100, Math.round((counts[bp.id] / WEEKLY_SET_TARGET) * 100))
  }
  return activation
}

export interface StreakDay {
  date: string
  hasSession: boolean
  isToday: boolean
}

export async function getWeekStreak(referenceDate: Date = new Date()): Promise<StreakDay[]> {
  const start = startOfWeek(referenceDate)
  const todayKey = dateKey(new Date())
  const sessions = await db.sessions.toArray()
  const completedDateKeys = new Set(
    sessions.filter((s) => s.completedAt).map((s) => dateKey(new Date(s.date))),
  )

  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i)
    const key = dateKey(d)
    return { date: d.toISOString(), hasSession: completedDateKeys.has(key), isToday: key === todayKey }
  })
}

export interface PreviousSessionSummary {
  volume: number
  durationSeconds: number
  date: string
}

// "Last time you did this" — matched by label (routine name, or body part
// label for a manual session), so it's comparing like-for-like.
export async function getPreviousSessionSummary(label: string): Promise<PreviousSessionSummary | null> {
  const sessions = await db.sessions.toArray()
  const last = sessions
    .filter((s) => s.label === label && s.completedAt)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  if (!last) return null

  const stats = await getSessionStats(last.id!)
  return { volume: stats.volume, durationSeconds: stats.durationSeconds, date: last.date }
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - copy.getDay())
  return copy
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function inRange(d: Date, start: Date, end: Date): boolean {
  return d >= start && d < end
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
