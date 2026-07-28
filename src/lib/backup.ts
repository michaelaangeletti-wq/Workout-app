import { db } from '../db/db'
import { BODY_PARTS } from '../db/types'
import type { AppSettings, BodyPart, Session } from '../db/types'

const EMPTY_WEEK_SCHEDULE: (number | null)[] = [null, null, null, null, null, null, null]

interface BackupFile {
  version: 1 | 2
  exportedAt: string
  exercises: unknown[]
  sessions: unknown[]
  setEntries: unknown[]
  settings: unknown[]
  routines?: unknown[]
}

export async function exportBackup(): Promise<void> {
  const [exercises, sessions, setEntries, settings, routines] = await Promise.all([
    db.exercises.toArray(),
    db.sessions.toArray(),
    db.setEntries.toArray(),
    db.settings.toArray(),
    db.routines.toArray(),
  ])

  const payload: BackupFile = {
    version: 2,
    exportedAt: new Date().toISOString(),
    exercises,
    sessions,
    setEntries,
    settings,
    routines,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `lift-plan-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const payload = JSON.parse(text) as BackupFile

  if (![1, 2].includes(payload.version) || !Array.isArray(payload.exercises)) {
    throw new Error('This file does not look like a Lift Plan backup.')
  }

  const bodyPartLabel = new Map(BODY_PARTS.map((bp) => [bp.id, bp.label]))
  const sessions = (payload.sessions as (Session & { bodyPart?: BodyPart })[]).map((session) => {
    if (session.bodyParts) return session
    const legacy = session.bodyPart
    return {
      ...session,
      bodyParts: legacy ? [legacy] : [],
      label: legacy ? (bodyPartLabel.get(legacy) ?? legacy) : 'Workout',
    }
  })
  const settings = (payload.settings as AppSettings[]).map((s) => ({
    ...s,
    weeklySchedule: s.weeklySchedule ?? [...EMPTY_WEEK_SCHEDULE],
  }))
  const routines = payload.routines ?? []

  await db.transaction('rw', db.exercises, db.sessions, db.setEntries, db.settings, db.routines, async () => {
    await Promise.all([
      db.exercises.clear(),
      db.sessions.clear(),
      db.setEntries.clear(),
      db.settings.clear(),
      db.routines.clear(),
    ])
    await db.exercises.bulkAdd(payload.exercises as never[])
    await db.sessions.bulkAdd(sessions as never[])
    await db.setEntries.bulkAdd(payload.setEntries as never[])
    await db.settings.bulkAdd(settings as never[])
    await db.routines.bulkAdd(routines as never[])
  })
}
