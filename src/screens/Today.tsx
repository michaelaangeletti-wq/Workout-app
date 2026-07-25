import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getLastSessionSets } from '../db/db'
import { BODY_PARTS } from '../db/types'
import type { BodyPart, Exercise } from '../db/types'
import { recommendNextSession, type Recommendation } from '../lib/recommendation'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { lbToDisplay } from '../lib/units'
import { useSettings } from '../db/useSettings'

interface Row {
  exercise: Exercise
  recommendation: Recommendation
}

export function Today() {
  const navigate = useNavigate()
  const settings = useSettings()
  const startSession = useWorkoutStore((s) => s.startSession)

  const allExercises = useLiveQuery(() => db.exercises.toArray())
  const favoritesByBodyPart = groupFavorites(allExercises)
  const availableBodyParts = BODY_PARTS.filter((bp) => favoritesByBodyPart[bp.id]?.length)

  const [selected, setSelected] = useState<BodyPart | null>(null)
  useEffect(() => {
    if (!selected && availableBodyParts.length > 0) setSelected(availableBodyParts[0].id)
  }, [availableBodyParts.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useLiveQuery(async (): Promise<Row[]> => {
    if (!selected) return []
    const favs = favoritesByBodyPart[selected] ?? []
    return Promise.all(
      favs.map(async (exercise) => {
        const lastSets = await getLastSessionSets(exercise.id!)
        return { exercise, recommendation: recommendNextSession(exercise, lastSets) }
      }),
    )
  }, [selected, allExercises])

  if (allExercises === undefined || !settings) {
    return null
  }

  if (availableBodyParts.length === 0) {
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
    const sessionId = await db.sessions.add({ date: new Date().toISOString(), bodyPart: selected })
    startSession(
      sessionId as number,
      selected,
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

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {availableBodyParts.map((bp) => (
          <button
            key={bp.id}
            type="button"
            onClick={() => setSelected(bp.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              selected === bp.id ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {bp.label}
          </button>
        ))}
      </div>

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
