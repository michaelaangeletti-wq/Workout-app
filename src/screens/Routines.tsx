import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { BODY_PARTS } from '../db/types'
import type { BodyPart, Routine } from '../db/types'
import { useSettings } from '../db/useSettings'

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function Routines() {
  const settings = useSettings()
  const routines = useLiveQuery(() => db.routines.orderBy('sortOrder').toArray())
  const [showNewForm, setShowNewForm] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (!settings || !routines) return null

  const setScheduleDay = (dayIndex: number, routineId: number | null) => {
    const next = [...settings.weeklySchedule]
    next[dayIndex] = routineId
    db.settings.update('settings', { weeklySchedule: next })
  }

  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-24">
      <Link to="/settings" className="text-sm text-slate-400">
        ← Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-50">Routines</h1>
      <p className="mt-1 text-sm text-slate-400">
        Group body parts into a named day (Push, Legs, "Arnold"...), then assign each to a day of the week.
      </p>

      <section className="mt-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your Routines</h2>
        <div className="mt-2 flex flex-col gap-2">
          {routines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              expanded={expandedId === r.id}
              onToggle={() => setExpandedId(expandedId === r.id ? null : r.id!)}
            />
          ))}
        </div>

        {showNewForm ? (
          <NewRoutineForm sortOrder={routines.length} onDone={() => setShowNewForm(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="mt-2 w-full rounded-2xl border border-dashed border-slate-700 py-3 text-sm font-medium text-slate-400"
          >
            + New Routine
          </button>
        )}

        <Link
          to="/routines/suggested"
          className="mt-3 block rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-sky-400"
        >
          Browse suggested splits →
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weekly Schedule</h2>
        <div className="mt-2 flex flex-col gap-2">
          {WEEKDAY_NAMES.map((name, i) => (
            <div key={name} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5">
              <span className="text-sm text-slate-200">{name}</span>
              <select
                value={settings.weeklySchedule[i] ?? ''}
                onChange={(e) => setScheduleDay(i, e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200"
              >
                <option value="">Rest day</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function RoutineCard({
  routine,
  expanded,
  onToggle,
}: {
  routine: Routine
  expanded: boolean
  onToggle: () => void
}) {
  const [name, setName] = useState(routine.name)
  const [bodyParts, setBodyParts] = useState<BodyPart[]>(routine.bodyParts)

  const toggleBodyPart = (bp: BodyPart) => {
    const next = bodyParts.includes(bp) ? bodyParts.filter((b) => b !== bp) : [...bodyParts, bp]
    setBodyParts(next)
    db.routines.update(routine.id!, { bodyParts: next })
  }

  const save = () => {
    if (name.trim()) db.routines.update(routine.id!, { name: name.trim() })
  }

  const remove = async () => {
    await db.routines.delete(routine.id!)
    const settings = await db.settings.get('settings')
    if (settings) {
      const next = settings.weeklySchedule.map((id) => (id === routine.id ? null : id))
      await db.settings.update('settings', { weeklySchedule: next })
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3">
        <div className="text-left">
          <div className="text-sm font-semibold text-slate-100">{routine.name}</div>
          <div className="text-xs text-slate-500">
            {routine.bodyParts.map((bp) => BODY_PARTS.find((b) => b.id === bp)?.label).join(', ') || 'No body parts yet'}
          </div>
        </div>
        <span className="text-xs text-slate-500">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-4 py-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {BODY_PARTS.map((bp) => (
              <button
                key={bp.id}
                type="button"
                onClick={() => toggleBodyPart(bp.id)}
                className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium ${
                  bodyParts.includes(bp.id) ? 'bg-sky-500/15 text-sky-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {bp.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={remove} className="mt-3 text-xs font-medium text-red-400">
            Delete routine
          </button>
        </div>
      )}
    </div>
  )
}

function NewRoutineForm({ sortOrder, onDone }: { sortOrder: number; onDone: () => void }) {
  const [name, setName] = useState('')
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])

  const toggleBodyPart = (bp: BodyPart) => {
    setBodyParts((prev) => (prev.includes(bp) ? prev.filter((b) => b !== bp) : [...prev, bp]))
  }

  const save = async () => {
    if (!name.trim() || bodyParts.length === 0) return
    await db.routines.add({ name: name.trim(), bodyParts, sortOrder })
    onDone()
  }

  return (
    <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <input
        autoFocus
        placeholder="Routine name (e.g. Push)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      />
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {BODY_PARTS.map((bp) => (
          <button
            key={bp.id}
            type="button"
            onClick={() => toggleBodyPart(bp.id)}
            className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium ${
              bodyParts.includes(bp.id) ? 'bg-sky-500/15 text-sky-300' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {bp.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onDone} className="flex-1 rounded-lg py-2 text-sm text-slate-400">
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!name.trim() || bodyParts.length === 0}
          className="flex-1 rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  )
}
