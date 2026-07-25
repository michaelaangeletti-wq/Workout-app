import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { BODY_PARTS, EQUIPMENT_DEFAULT_WEIGHT, EQUIPMENT_LABELS } from '../db/types'
import type { BodyPart, EquipmentType, Exercise } from '../db/types'

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'body-parts' | number>('body-parts')
  const [selectedParts, setSelectedParts] = useState<BodyPart[]>([])

  if (step === 'body-parts') {
    return (
      <PickBodyParts
        selected={selectedParts}
        onToggle={(bp) =>
          setSelectedParts((prev) =>
            prev.includes(bp) ? prev.filter((p) => p !== bp) : [...prev, bp],
          )
        }
        onNext={() => setStep(0)}
      />
    )
  }

  const bodyPart = selectedParts[step]
  const isLast = step === selectedParts.length - 1

  return (
    <PickExercises
      bodyPart={bodyPart}
      stepLabel={`${step + 1} of ${selectedParts.length}`}
      onBack={() => (step === 0 ? setStep('body-parts') : setStep(step - 1))}
      onNext={async () => {
        if (isLast) {
          await db.settings.update('settings', { onboardingComplete: true })
          onComplete()
        } else {
          setStep(step + 1)
        }
      }}
      nextLabel={isLast ? 'Finish' : 'Next'}
    />
  )
}

function PickBodyParts({
  selected,
  onToggle,
  onNext,
}: {
  selected: BodyPart[]
  onToggle: (bp: BodyPart) => void
  onNext: () => void
}) {
  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-8">
      <h1 className="text-2xl font-bold text-slate-50">Which body parts do you train?</h1>
      <p className="mt-1 text-sm text-slate-400">Pick as many as you like — you can change this later in Settings.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {BODY_PARTS.map((bp) => {
          const isOn = selected.includes(bp.id)
          return (
            <button
              key={bp.id}
              type="button"
              onClick={() => onToggle(bp.id)}
              className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${
                isOn
                  ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                  : 'border-slate-800 bg-slate-900 text-slate-300'
              }`}
            >
              {bp.label}
            </button>
          )
        })}
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={onNext}
          className="w-full rounded-2xl bg-sky-600 py-4 text-base font-semibold text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

function PickExercises({
  bodyPart,
  stepLabel,
  onBack,
  onNext,
  nextLabel,
}: {
  bodyPart: BodyPart
  stepLabel: string
  onBack: () => void
  onNext: () => void
  nextLabel: string
}) {
  const exercises = useLiveQuery(
    () => db.exercises.where('bodyPart').equals(bodyPart).sortBy('sortOrder'),
    [bodyPart],
  )
  const favoriteCount = useMemo(
    () => exercises?.filter((e) => e.isFavorite).length ?? 0,
    [exercises],
  )
  const [showCustomForm, setShowCustomForm] = useState(false)

  const bodyPartLabel = BODY_PARTS.find((bp) => bp.id === bodyPart)?.label ?? bodyPart

  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-8">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-sm text-slate-400">
          ← Back
        </button>
        <span className="text-xs text-slate-500">{stepLabel}</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-slate-50">Favorite {bodyPartLabel} exercises</h1>
      <p className="mt-1 text-sm text-slate-400">Tap to mark your go-to lifts. You'll get a recommended weight for each.</p>

      <div className="mt-5 flex flex-col gap-2">
        {exercises?.map((ex) => (
          <ExerciseRow key={ex.id} exercise={ex} />
        ))}
      </div>

      {showCustomForm ? (
        <CustomExerciseForm bodyPart={bodyPart} onDone={() => setShowCustomForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowCustomForm(true)}
          className="mt-3 rounded-2xl border border-dashed border-slate-700 py-3 text-sm font-medium text-slate-400"
        >
          + Add a custom exercise
        </button>
      )}

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-2xl bg-sky-600 py-4 text-base font-semibold text-white"
        >
          {nextLabel}
          {favoriteCount > 0 ? ` (${favoriteCount} picked)` : ''}
        </button>
      </div>
    </div>
  )
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const toggleFavorite = () =>
    db.exercises.update(exercise.id!, { isFavorite: !exercise.isFavorite })

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        exercise.isFavorite ? 'border-sky-500 bg-sky-500/10' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <button type="button" onClick={toggleFavorite} className="flex-1 text-left">
        <div className={`text-sm font-semibold ${exercise.isFavorite ? 'text-sky-300' : 'text-slate-200'}`}>
          {exercise.name}
        </div>
        <div className="text-xs text-slate-500">{EQUIPMENT_LABELS[exercise.equipmentType]}</div>
      </button>

      {exercise.isFavorite && (
        <StartingWeightInput exercise={exercise} />
      )}
    </div>
  )
}

function StartingWeightInput({ exercise }: { exercise: Exercise }) {
  const defaultWeight = exercise.startingWeight ?? EQUIPMENT_DEFAULT_WEIGHT[exercise.equipmentType]
  return (
    <label className="ml-3 flex items-center gap-1 text-xs text-slate-400">
      Start
      <input
        type="number"
        inputMode="decimal"
        defaultValue={defaultWeight}
        onBlur={(e) => {
          const v = Number(e.target.value)
          if (!Number.isNaN(v)) db.exercises.update(exercise.id!, { startingWeight: v })
        }}
        className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-center text-slate-200"
      />
      lb
    </label>
  )
}

function CustomExerciseForm({ bodyPart, onDone }: { bodyPart: BodyPart; onDone: () => void }) {
  const [name, setName] = useState('')
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('dumbbell')

  const save = async () => {
    if (!name.trim()) return
    await db.exercises.add({
      name: name.trim(),
      bodyPart,
      equipmentType,
      repRangeMin: 8,
      repRangeMax: 12,
      weightIncrement: equipmentType === 'barbell' ? 5 : equipmentType === 'machine' ? 10 : 5,
      targetSets: 3,
      isFavorite: true,
      isCustom: true,
      sortOrder: 999,
    })
    onDone()
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <input
        autoFocus
        placeholder="Exercise name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      />
      <select
        value={equipmentType}
        onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      >
        {Object.entries(EQUIPMENT_LABELS).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onDone} className="flex-1 rounded-lg py-2 text-sm text-slate-400">
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="flex-1 rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white"
        >
          Add
        </button>
      </div>
    </div>
  )
}
