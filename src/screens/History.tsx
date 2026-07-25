import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Exercise, Session, SetEntry } from '../db/types'
import { useSettings } from '../db/useSettings'
import { lbToDisplay } from '../lib/units'
import { WeightTrendChart, type TrendPoint } from '../components/WeightTrendChart'

const MAX_CHART_POINTS = 20

interface SessionGroup {
  session: Session
  sets: SetEntry[]
}

export function History() {
  const settings = useSettings()
  const favorites = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return all.filter((e) => e.isFavorite).sort((a, b) => a.bodyPart.localeCompare(b.bodyPart) || a.sortOrder - b.sortOrder)
  })

  const [selectedId, setSelectedId] = useState<number | null>(null)
  useEffect(() => {
    if (selectedId === null && favorites && favorites.length > 0) {
      setSelectedId(favorites[0].id!)
    }
  }, [favorites, selectedId])

  const groups = useLiveQuery(async (): Promise<SessionGroup[]> => {
    if (!selectedId) return []
    const sets = await db.setEntries.where('exerciseId').equals(selectedId).toArray()
    if (sets.length === 0) return []
    const sessionIds = [...new Set(sets.map((s) => s.sessionId))]
    const sessions = await db.sessions.bulkGet(sessionIds)
    const sessionById = new Map(sessions.filter(Boolean).map((s) => [s!.id!, s!]))

    const bySession = new Map<number, SetEntry[]>()
    for (const s of sets) {
      if (!bySession.has(s.sessionId)) bySession.set(s.sessionId, [])
      bySession.get(s.sessionId)!.push(s)
    }

    return [...bySession.entries()]
      .map(([sessionId, sessionSets]) => ({
        session: sessionById.get(sessionId),
        sets: sessionSets.sort((a, b) => a.setNumber - b.setNumber),
      }))
      .filter((g): g is SessionGroup => Boolean(g.session))
      .sort((a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime())
  }, [selectedId])

  const units = settings?.units ?? 'lb'
  const chartPoints: TrendPoint[] = useMemo(() => {
    if (!groups) return []
    return [...groups]
      .sort((a, b) => new Date(a.session.date).getTime() - new Date(b.session.date).getTime())
      .slice(-MAX_CHART_POINTS)
      .map((g) => ({
        date: g.session.date,
        weight: lbToDisplay(Math.max(...g.sets.map((s) => s.weight)), units),
      }))
  }, [groups, units])

  if (!favorites || !settings) return null

  if (favorites.length === 0) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 px-6 text-center">
        <div className="text-4xl">📈</div>
        <h1 className="text-xl font-bold text-slate-50">No history yet</h1>
        <p className="text-sm text-slate-400">Log a session and it'll show up here.</p>
      </div>
    )
  }

  const selectedExercise: Exercise | undefined = favorites.find((f) => f.id === selectedId)

  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-24">
      <h1 className="text-2xl font-bold text-slate-50">History</h1>

      <select
        value={selectedId ?? ''}
        onChange={(e) => setSelectedId(Number(e.target.value))}
        className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100"
      >
        {favorites.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>

      {selectedExercise && groups && groups.length > 0 ? (
        <>
          <div className="mt-4">
            <WeightTrendChart points={chartPoints} unit={settings.units} />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {groups.map((g) => (
              <div key={g.session.id} className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                <div className="text-xs text-slate-500">{formatDate(g.session.date)}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {g.sets.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-sm font-medium tabular-nums text-slate-200"
                    >
                      {lbToDisplay(s.weight, settings.units)} {settings.units} × {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-8 text-center text-sm text-slate-500">No logged sessions for this exercise yet.</p>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
