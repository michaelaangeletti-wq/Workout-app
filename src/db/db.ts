import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, BodyPart, Exercise, Routine, Session, SetEntry } from './types'
import { BODY_PARTS } from './types'
import { buildDefaultCatalog } from './catalog'

const EMPTY_WEEK_SCHEDULE: (number | null)[] = [null, null, null, null, null, null, null]

class LiftPlanDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  sessions!: EntityTable<Session, 'id'>
  setEntries!: EntityTable<SetEntry, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  routines!: EntityTable<Routine, 'id'>

  constructor() {
    super('lift-plan')
    this.version(1).stores({
      exercises: '++id, bodyPart, isFavorite, sortOrder',
      sessions: '++id, date, bodyPart',
      setEntries: '++id, sessionId, exerciseId, [exerciseId+sessionId]',
      settings: 'id',
    })

    // v2: sessions move from a single bodyPart to bodyParts[] + a display
    // label, so a session can span a whole routine (e.g. "Push" = chest +
    // shoulders + triceps) instead of just one body part. Also adds the
    // routines table and a weeklySchedule on settings.
    this.version(2)
      .stores({
        exercises: '++id, bodyPart, isFavorite, sortOrder',
        sessions: '++id, date',
        setEntries: '++id, sessionId, exerciseId, [exerciseId+sessionId]',
        settings: 'id',
        routines: '++id, sortOrder',
      })
      .upgrade(async (tx) => {
        const bodyPartLabel = new Map(BODY_PARTS.map((bp) => [bp.id, bp.label]))
        await tx
          .table('sessions')
          .toCollection()
          .modify((session: Session & { bodyPart?: BodyPart }) => {
            const legacyBodyPart = session.bodyPart
            if (legacyBodyPart && !session.bodyParts) {
              session.bodyParts = [legacyBodyPart]
              session.label = bodyPartLabel.get(legacyBodyPart) ?? legacyBodyPart
            }
            delete session.bodyPart
          })
        await tx
          .table('settings')
          .toCollection()
          .modify((s: AppSettings) => {
            if (!s.weeklySchedule) s.weeklySchedule = [...EMPTY_WEEK_SCHEDULE]
          })
      })
  }
}

export const db = new LiftPlanDB()

// Runs once, the first time the app is ever opened on this device: seeds the
// default exercise catalog and the singleton settings row.
export async function ensureSeeded() {
  const settings = await db.settings.get('settings')
  if (!settings) {
    await db.settings.put({
      id: 'settings',
      units: 'lb',
      onboardingComplete: false,
      weeklySchedule: [...EMPTY_WEEK_SCHEDULE],
    })
  }
  const count = await db.exercises.count()
  if (count === 0) {
    await db.exercises.bulkAdd(buildDefaultCatalog())
  }
}

// Most recent completed session's sets for a given exercise, sorted by set number.
export async function getLastSessionSets(exerciseId: number): Promise<SetEntry[]> {
  const allSets = await db.setEntries.where('exerciseId').equals(exerciseId).toArray()
  if (allSets.length === 0) return []
  const lastSessionId = allSets.reduce((max, s) => Math.max(max, s.sessionId), -Infinity)
  return allSets
    .filter((s) => s.sessionId === lastSessionId)
    .sort((a, b) => a.setNumber - b.setNumber)
}
