import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { useSettings } from '../db/useSettings'
import { WeightStepper } from '../components/WeightStepper'
import { lbToDisplay, displayToLb } from '../lib/units'

export function LogSet() {
  const navigate = useNavigate()
  const settings = useSettings()
  const {
    sessionId,
    plan,
    currentExerciseIndex,
    currentSetNumber,
    advanceSet,
    advanceExercise,
    endSession,
  } = useWorkoutStore()

  const item = plan[currentExerciseIndex]
  const [weightDisplay, setWeightDisplay] = useState(0)
  const [reps, setReps] = useState(0)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      navigate('/', { replace: true })
    }
  }, [sessionId, navigate])

  useEffect(() => {
    if (item && settings) {
      setWeightDisplay(lbToDisplay(item.targetWeight, settings.units))
      setReps(item.targetReps)
    }
  }, [currentExerciseIndex, item, settings])

  if (!sessionId || !item || !settings) return null

  const isLastSet = currentSetNumber >= item.targetSets
  const isLastExercise = currentExerciseIndex >= plan.length - 1
  const incrementDisplay = lbToDisplay(item.weightIncrement, settings.units) || 1

  const logSet = async () => {
    await db.setEntries.add({
      sessionId,
      exerciseId: item.exerciseId,
      setNumber: currentSetNumber,
      weight: displayToLb(weightDisplay, settings.units),
      reps,
      loggedAt: new Date().toISOString(),
    })

    if (!isLastSet) {
      advanceSet()
      return
    }

    if (!isLastExercise) {
      advanceExercise()
      return
    }

    await db.sessions.update(sessionId, { completedAt: new Date().toISOString() })
    setComplete(true)
  }

  if (complete) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold text-slate-50">Session logged</h1>
        <p className="text-sm text-slate-400">Nice work. Your next session's weights will update automatically.</p>
        <button
          type="button"
          onClick={() => {
            endSession()
            navigate('/')
          }}
          className="mt-2 rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Back to Today
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-10">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Exercise {currentExerciseIndex + 1} of {plan.length}
        </span>
        <span>
          Set {currentSetNumber} of {item.targetSets}
        </span>
      </div>

      <h1 className="mt-2 text-2xl font-bold text-slate-50">{item.exerciseName}</h1>
      <p className="mt-1 text-sm text-slate-400">{item.reason}</p>

      <div className="mt-10">
        <div className="text-center text-xs uppercase tracking-wide text-slate-500">Weight</div>
        <div className="mt-3">
          <WeightStepper
            value={weightDisplay}
            step={incrementDisplay}
            unitLabel={settings.units}
            onChange={setWeightDisplay}
          />
        </div>
      </div>

      <div className="mt-10">
        <div className="text-center text-xs uppercase tracking-wide text-slate-500">Reps</div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setReps((r) => Math.max(0, r - 1))}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-2xl font-semibold text-slate-100 active:bg-slate-700"
          >
            −
          </button>
          <div className="min-w-[5rem] text-center text-4xl font-bold tabular-nums text-slate-50">{reps}</div>
          <button
            type="button"
            onClick={() => setReps((r) => r + 1)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-2xl font-semibold text-white active:bg-sky-500"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={logSet}
          className="w-full rounded-2xl bg-sky-600 py-4 text-base font-semibold text-white"
        >
          {isLastSet && isLastExercise ? 'Log Set & Finish' : 'Log Set'}
        </button>
      </div>
    </div>
  )
}
