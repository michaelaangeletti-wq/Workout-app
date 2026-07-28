import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getLastSessionSets } from '../db/db'
import { BODY_PARTS } from '../db/types'
import type { BodyPart, Exercise } from '../db/types'
import { recommendNextSession, type Recommendation } from '../lib/recommendation'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { lbToDisplay } from '../lib/units'
import { useSettings } from '../db/useSettings'
import { getWeeklyMuscleStatus, getWeekStreak, getPreviousSessionSummary } from '../lib/sessionStats'
import { WeekStreak } from '../components/WeekStreak'
import { MuscleMap } from '../components/MuscleMap'

interface Row {
  exercise: Exercise
  recommendation: Recommendation
}

interface Option {
  key: string
  label: string
  bodyParts: BodyPart[]
  routineId?: number
}

export function Today() {
  const navigate = useNavigate()
  const settings = useSettings()
  const startSession = useWorkoutStore((s) => s.startSession)

  const allExercises = useLiveQuery(() => db.exercises.toArray())
  const routines = useLiveQuery(() => db.routines.orderBy('sortOrder').toArray())
  const muscleStatus = useLiveQuery(() => getWeeklyMuscleStatus())
  const streakDays = useLiveQuery(() => getWeekStreak())

  const favoritesByBodyPart = groupFavorites(allExercises)
  const hasRoutines = (routines?.length ?? 0) > 0

  const options: Option[] = useMemo(() => {
    const soloOptions: Option[] = BODY_PARTS.filter((bp) => favoritesByBodyPart[bp.id]?.length).map((bp) => ({
      key: `bp-${bp.id}`,
      label: bp.label,
      bodyParts: [bp.id],
    }))
    if (!hasRoutines) return soloOptions
    const routineOptions: Option[] = (routines ?? [])
      .filter((r) => r.bodyParts.some((bp) => favoritesByBodyPart[bp]?.length))
      .map((r) => ({ key: `routine-${r.id}`, label: r.name, bodyParts: r.bodyParts, routineId: r.id }))
    return [...routineOptions, ...soloOptions]
  }, [routines, hasRoutines, favoritesByBodyPart])

  const todayWeekday = new Date().getDay()
  const scheduledRoutineId = hasRoutines ? (settings?.weeklySchedule[todayWeekday] ?? null) : undefined
  const isRestDay = hasRoutines && scheduledRoutineId === null
  const scheduledOption = options.find((o) => o.routineId === scheduledRoutineId)

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  useEffect(() => {
    if (selectedKey !== null) return
    if (isRestDay) return
    if (scheduledOption) setSelectedKey(scheduledOption.key)
    else if (!hasRoutines && options.length > 0) setSelectedKey(options[0].key)
  }, [selectedKey, isRestDay, scheduledOption, hasRoutines, options])

  const selected = options.find((o) => o.key === selectedKey) ?? null

  const rows = useLiveQuery(async (): Promise<Row[]> => {
    if (!selected) return []
    const favs = selected.bodyParts.flatMap((bp) => favoritesByBodyPart[bp] ?? [])
    return Promise.all(
      favs.map(async (exercise) => {
        const lastSets = await getLastSessionSets(exercise.id!)
        return { exercise, recommendation: recommendNextSession(exercise, lastSets) }
      }),
    )
  }, [selected?.key, allExercises])

  const previousSummary = useLiveQuery(
    () => (selected ? getPreviousSessionSummary(selected.label) : Promise.resolve(null)),
    [selected?.label],
  )

  if (allExercises === undefined || !settings || !muscleStatus || !streakDays) {
    return null
  }

  if (options.length === 0) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">🏋️</div>
        <h1 className="text-xl font-bold text-slate-50">No favorite exercises yet</h1>
        <p className="text-sm text-slate-400">Pick a few in Settings and they'll show up here with a recommended weight.</p>
        <Link to="/settings" className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white">
          Go to Settings
        </Link>
      </div>
    )
  }

  const startWorkout = async () => {
    if (!selected || !rows) return
    const sessionId = await db.sessions.add({
      date: new Date().toISOString(),
      bodyParts: selected.bodyParts,
      label: selected.label,
      routineId: selected.routineId,
    })
    startSession(
      sessionId as number,
      selected.label,
      rows.map((r) => ({
        exerciseId: r.exercise.id!,
        exerciseName: r.exercise.name,
        targetWeight: r.recommendation.weight,
        targetReps: r.recommendation.targetReps,
        targetSets: r.exercise.targetSets,
        weightIncrement: r.exercise.weightIncrement,
        reason: r.recommendation.reason,
      })),
    )
    navigate('/log')
  }

  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-28">
      <h1 className="text-2xl font-bold text-slate-50">Today</h1>

      <div className="mt-4">
        <WeekStreak days={streakDays} />
      </div>

      <div className="mt-4">
        <MuscleMap status={muscleStatus} />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setSelectedKey(o.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              selectedKey === o.key ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {isRestDay && !selected ? (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-center">
          <div className="text-sm font-semibold text-slate-200">Rest day</div>
          <p className="mt-1 text-xs text-slate-500">Nothing scheduled today. Pick something above, or update your split.</p>
          <Link to="/routines" className="mt-2 inline-block text-xs font-semibold text-sky-400">
            Manage Routines →
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2.5">
            {rows?.map(({ exercise, recommendation }) => (
              <div key={exercise.id} className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                <div className="text-sm font-semibold text-slate-100">{exercise.name}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-sky-400">
                    {lbToDisplay(recommendation.weight, settings.units)} {settings.units}
                  </span>
                  <span className="text-sm text-slate-400">
                    × {recommendation.targetReps} reps × {exercise.targetSets} sets
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{recommendation.reason}</div>
              </div>
            ))}
          </div>

          {previousSummary && (
            <div className="mt-3 text-center text-xs text-slate-500">
              Last time: {formatVolume(lbToDisplay(previousSummary.volume, settings.units))} {settings.units} ·{' '}
              {Math.round(previousSummary.durationSeconds / 60)}m
            </div>
          )}

          <div className="fixed inset-x-0 bottom-16 z-10 px-5 pb-3">
            <div className="mx-auto max-w-md">
              <button
                type="button"
                onClick={startWorkout}
                disabled={!rows || rows.length === 0}
                className="w-full rounded-2xl bg-sky-600 py-4 text-base font-semibold text-white shadow-lg shadow-sky-950/50 disabled:opacity-40"
              >
                Start Session
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function groupFavorites(exercises: Exercise[] | undefined): Partial<Record<BodyPart, Exercise[]>> {
  const map: Partial<Record<BodyPart, Exercise[]>> = {}
  if (!exercises) return map
  for (const ex of exercises) {
    if (!ex.isFavorite) continue
    if (!map[ex.bodyPart]) map[ex.bodyPart] = []
    map[ex.bodyPart]!.push(ex)
  }
  for (const key of Object.keys(map)) {
    map[key as BodyPart]!.sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return map
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(Math.round(v))
}
