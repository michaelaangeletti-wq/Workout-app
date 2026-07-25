import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, Exercise, Session, SetEntry } from './types'
import { buildDefaultCatalog } from './catalog'

class LiftPlanDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  sessions!: EntityTable<Session, 'id'>
  setEntries!: EntityTable<SetEntry, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('lift-plan')
    this.version(1).stores({
      exercises: '++id, bodyPart, isFavorite, sortOrder',
      sessions: '++id, date, bodyPart',
      setEntries: '++id, sessionId, exerciseId, [exerciseId+sessionId]',
      settings: 'id',
    })
  }
}

export const db = new LiftPlanDB()

// Runs once, the first time the app is ever opened on this device: seeds the
// default exercise catalog and the singleton settings row.
export async function ensureSeeded() {
  const settings = await db.settings.get('settings')
  if (!settings) {
    await db.settings.put({ id: 'settings', units: 'lb', onboardingComplete: false })
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
