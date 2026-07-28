import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useWorkoutStore, type PlanItem } from '../store/useWorkoutStore'
import { useSettings } from '../db/useSettings'
import { RestTimer } from '../components/RestTimer'
import { getSessionStats, type SessionStats } from '../lib/sessionStats'
import { lbToDisplay, displayToLb } from '../lib/units'
import type { SetEntry, Units } from '../db/types'

interface Draft {
  weight: number
  reps: number
}

export function LogSet() {
  const navigate = useNavigate()
  const settings = useSettings()
  const { sessionId, plan, endSession } = useWorkoutStore()

  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [restTimerKey, setRestTimerKey] = useState<string | null>(null)
  const [finalStats, setFinalStats] = useState<SessionStats | null>(null)

  const loggedSets = useLiveQuery(
    () => (sessionId ? db.setEntries.where('sessionId').equals(sessionId).toArray() : Promise.resolve<SetEntry[]>([])),
    [sessionId],
  )

  useEffect(() => {
    if (!sessionId && !finalStats) {
      navigate('/', { replace: true })
    }
  }, [sessionId, finalStats, navigate])

  const loggedByKey = useMemo(() => {
    const map = new Map<string, SetEntry>()
    for (const s of loggedSets ?? []) map.set(keyFor(s.exerciseId, s.setNumber), s)
    return map
  }, [loggedSets])

  if (finalStats) {
    return (
      <CompletionScreen
        stats={finalStats}
        units={settings?.units ?? 'lb'}
        onDone={() => {
          endSession()
          navigate('/')
        }}
      />
    )
  }

  if (!sessionId || !settings || !loggedSets) return null

  const totalSets = plan.reduce((sum, item) => sum + item.targetSets, 0)
  const doneSets = loggedSets.length

  const logSet = async (item: PlanItem, setNumber: number, draft: Draft) => {
    await db.setEntries.add({
      sessionId,
      exerciseId: item.exerciseId,
      setNumber,
      weight: displayToLb(draft.weight, settings.units),
      reps: draft.reps,
      loggedAt: new Date().toISOString(),
    })
    if (setNumber < item.targetSets) {
      setRestTimerKey(keyFor(item.exerciseId, setNumber))
    }
  }

  const finishSession = async () => {
    await db.sessions.update(sessionId, { completedAt: new Date().toISOString() })
    const stats = await getSessionStats(sessionId)
    setFinalStats(stats)
  }

  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50">Log Workout</h1>
        <span className="text-xs text-slate-500">
          {doneSets} / {totalSets} sets
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {plan.map((item) => (
          <ExerciseCard
            key={item.exerciseId}
            item={item}
            units={settings.units}
            loggedByKey={loggedByKey}
            drafts={drafts}
            setDrafts={setDrafts}
            onLogSet={logSet}
            restTimerKey={restTimerKey}
            onRestDone={() => setRestTimerKey(null)}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-10 px-5 pb-3">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={finishSession}
            className="w-full rounded-2xl bg-sky-600 py-4 text-base font-semibold text-white shadow-lg shadow-sky-950/50"
          >
            Finish Session
          </button>
        </div>
      </div>
    </div>
  )
}

function ExerciseCard({
  item,
  units,
  loggedByKey,
  drafts,
  setDrafts,
  onLogSet,
  restTimerKey,
  onRestDone,
}: {
  item: PlanItem
  units: Units
  loggedByKey: Map<string, SetEntry>
  drafts: Record<string, Draft>
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, Draft>>>
  onLogSet: (item: PlanItem, setNumber: number, draft: Draft) => void
  restTimerKey: string | null
  onRestDone: () => void
}) {
  const targetWeightDisplay = lbToDisplay(item.targetWeight, units)
  const incrementDisplay = lbToDisplay(item.weightIncrement, units) || 1

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
      <div className="text-sm font-semibold text-slate-100">{item.exerciseName}</div>
      <div className="text-xs text-slate-500">{item.reason}</div>

      <div className="mt-3 flex flex-col gap-2">
        {Array.from({ length: item.targetSets }, (_, i) => i + 1).map((setNumber) => {
          const key = keyFor(item.exerciseId, setNumber)
          const logged = loggedByKey.get(key)

          if (logged) {
            return (
              <div key={key} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2">
                <span className="text-xs text-slate-500">Set {setNumber}</span>
                <span className="text-sm font-medium tabular-nums text-slate-200">
                  {lbToDisplay(logged.weight, units)} {units} × {logged.reps}
                </span>
                <span className="text-sky-400">✓</span>
              </div>
            )
          }

          // Prefill from the previous logged set's actual weight (what you
          // really used), falling back to the recommended target.
          const prevKey = keyFor(item.exerciseId, setNumber - 1)
          const prevLogged = loggedByKey.get(prevKey)
          const fallback: Draft = {
            weight: prevLogged ? lbToDisplay(prevLogged.weight, units) : targetWeightDisplay,
            reps: prevLogged ? prevLogged.reps : item.targetReps,
          }
          const draft = drafts[key] ?? fallback

          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2">
                <span className="w-10 shrink-0 text-xs text-slate-500">Set {setNumber}</span>
                <RowStepper
                  value={draft.weight}
                  step={incrementDisplay}
                  onChange={(weight) => setDrafts((d) => ({ ...d, [key]: { ...draft, weight } }))}
                />
                <span className="text-[10px] text-slate-500">{units}</span>
                <div className="mx-1 h-5 w-px bg-slate-700" />
                <RowStepper
                  value={draft.reps}
                  step={1}
                  onChange={(reps) => setDrafts((d) => ({ ...d, [key]: { ...draft, reps } }))}
                />
                <span className="text-[10px] text-slate-500">reps</span>
                <button
                  type="button"
                  onClick={() => onLogSet(item, setNumber, draft)}
                  className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-base font-bold text-white active:bg-sky-500"
                  aria-label={`Log set ${setNumber}`}
                >
                  ✓
                </button>
              </div>
              {restTimerKey === key && <RestTimer onDone={onRestDone} onSkip={onRestDone} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RowStepper({ value, step, onChange }: { value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, round1(value - step)))}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-sm font-bold text-slate-200"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums text-slate-100">{value}</span>
      <button
        type="button"
        onClick={() => onChange(round1(value + step))}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-sm font-bold text-slate-200"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}

function CompletionScreen({
  stats,
  units,
  onDone,
}: {
  stats: SessionStats
  units: Units
  onDone: () => void
}) {
  const minutes = Math.round(stats.durationSeconds / 60)
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">✅</div>
      <h1 className="text-2xl font-bold text-slate-50">Session logged</h1>
      <div className="mt-2 flex gap-6">
        <Stat value={`${minutes}m`} label="Time" />
        <Stat value={String(stats.prExerciseIds.length)} label="PRs" />
        <Stat value={formatVolume(lbToDisplay(stats.volume, units))} label={`${units} volume`} />
      </div>
      <p className="mt-2 text-sm text-slate-400">Nice work. Your next session's weights will update automatically.</p>
      <button
        type="button"
        onClick={onDone}
        className="mt-2 rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white"
      >
        Back to Today
      </button>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl font-bold tabular-nums text-sky-400">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
    </div>
  )
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(Math.round(v))
}

function keyFor(exerciseId: number, setNumber: number): string {
  return `${exerciseId}-${setNumber}`
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}
