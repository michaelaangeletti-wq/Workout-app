import { db } from '../db/db'

interface BackupFile {
  version: 1
  exportedAt: string
  exercises: unknown[]
  sessions: unknown[]
  setEntries: unknown[]
  settings: unknown[]
}

export async function exportBackup(): Promise<void> {
  const [exercises, sessions, setEntries, settings] = await Promise.all([
    db.exercises.toArray(),
    db.sessions.toArray(),
    db.setEntries.toArray(),
    db.settings.toArray(),
  ])

  const payload: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    sessions,
    setEntries,
    settings,
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

  if (payload.version !== 1 || !Array.isArray(payload.exercises)) {
    throw new Error('This file does not look like a Lift Plan backup.')
  }

  await db.transaction('rw', db.exercises, db.sessions, db.setEntries, db.settings, async () => {
    await Promise.all([
      db.exercises.clear(),
      db.sessions.clear(),
      db.setEntries.clear(),
      db.settings.clear(),
    ])
    await db.exercises.bulkAdd(payload.exercises as never[])
    await db.sessions.bulkAdd(payload.sessions as never[])
    await db.setEntries.bulkAdd(payload.setEntries as never[])
    await db.settings.bulkAdd(payload.settings as never[])
  })
}
