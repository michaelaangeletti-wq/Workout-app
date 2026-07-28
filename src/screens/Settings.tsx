import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { BODY_PARTS, EQUIPMENT_LABELS, EQUIPMENT_DEFAULT_WEIGHT } from '../db/types'
import type { BodyPart, EquipmentType, Exercise, Units } from '../db/types'
import { useSettings } from '../db/useSettings'
import { exportBackup, importBackup } from '../lib/backup'

export function Settings() {
  const settings = useSettings()
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const [openBodyPart, setOpenBodyPart] = useState<BodyPart | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!settings || !exercises) return null

  const setUnits = (units: Units) => db.settings.update('settings', { units })

  const handleImportFile = async (file: File) => {
    setImporting(true)
    setImportMessage(null)
    try {
      await importBackup(file)
      setImportMessage('Backup restored.')
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-28">
      <h1 className="text-2xl font-bold text-slate-50">Settings</h1>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Units</h2>
        <div className="mt-2 flex gap-2">
          {(['lb', 'kg'] as Units[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnits(u)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold ${
                settings.units === u
                  ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              {u === 'lb' ? 'Pounds (lb)' : 'Kilograms (kg)'}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your Exercises</h2>
        <div className="mt-2 flex flex-col gap-2">
          {BODY_PARTS.map((bp) => {
            const inThisPart = exercises.filter((e) => e.bodyPart === bp.id)
            const favCount = inThisPart.filter((e) => e.isFavorite).length
            return (
              <div key={bp.id} className="rounded-2xl border border-slate-800 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setOpenBodyPart(openBodyPart === bp.id ? null : bp.id)}
                  className="flex w-full items-center justify-between px-4 py-3"
                >
                  <span className="text-sm font-semibold text-slate-100">{bp.label}</span>
                  <span className="text-xs text-slate-500">
                    {favCount} picked {openBodyPart === bp.id ? '▲' : '▼'}
                  </span>
                </button>
                {openBodyPart === bp.id && (
                  <BodyPartEditor bodyPart={bp.id} exercises={inThisPart} />
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Backup</h2>
        <p className="mt-1 text-xs text-slate-500">
          Your data lives only on this phone. Export a backup occasionally so you don't lose it if you switch devices.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => exportBackup()}
            className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white"
          >
            Export Backup
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-semibold text-slate-200 disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import Backup'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImportFile(file)
              e.target.value = ''
            }}
          />
        </div>
        {importMessage && <p className="mt-2 text-xs text-slate-400">{importMessage}</p>}
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <Link
          to="/routines"
          className="block rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200"
        >
          Manage Routines & Weekly Schedule →
        </Link>
        <Link
          to="/install-help"
          className="block rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200"
        >
          How to install this app on your iPhone →
        </Link>
      </section>
    </div>
  )
}

function BodyPartEditor({ bodyPart, exercises }: { bodyPart: BodyPart; exercises: Exercise[] }) {
  const favorites = exercises.filter((e) => e.isFavorite).sort((a, b) => a.sortOrder - b.sortOrder)
  const rest = exercises.filter((e) => !e.isFavorite)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const move = async (exercise: Exercise, direction: -1 | 1) => {
    const idx = favorites.findIndex((f) => f.id === exercise.id)
    const swapWith = favorites[idx + direction]
    if (!swapWith) return
    await db.exercises.update(exercise.id!, { sortOrder: swapWith.sortOrder })
    await db.exercises.update(swapWith.id!, { sortOrder: exercise.sortOrder })
  }

  return (
    <div className="border-t border-slate-800 px-4 py-3">
      {favorites.length === 0 && <p className="text-xs text-slate-500">No favorites picked yet.</p>}
      <div className="flex flex-col gap-2">
        {favorites.map((ex, idx) => (
          <div key={ex.id} className="rounded-xl border border-sky-500/40 bg-sky-500/5 px-3 py-2">
            <div className="flex items-center justify-between">
              <button type="button" className="flex-1 text-left" onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id!)}>
                <div className="text-sm font-semibold text-sky-300">{ex.name}</div>
                <div className="text-xs text-slate-500">
                  {EQUIPMENT_LABELS[ex.equipmentType]} · {ex.repRangeMin}-{ex.repRangeMax} reps · +{ex.weightIncrement} lb · {ex.targetSets} sets
                </div>
              </button>
              <div className="flex items-center gap-1">
                <button type="button" disabled={idx === 0} onClick={() => move(ex, -1)} className="px-1 text-slate-400 disabled:opacity-20">
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === favorites.length - 1}
                  onClick={() => move(ex, 1)}
                  className="px-1 text-slate-400 disabled:opacity-20"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => db.exercises.update(ex.id!, { isFavorite: false })}
                  className="ml-1 px-1 text-xs text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
            {expandedId === ex.id && <ExerciseFieldsEditor exercise={ex} />}
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <>
          <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Add more</div>
          <div className="mt-1 flex flex-col gap-1.5">
            {rest.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => db.exercises.update(ex.id!, { isFavorite: true })}
                className="rounded-xl border border-slate-800 px-3 py-2 text-left text-sm text-slate-300"
              >
                + {ex.name}
              </button>
            ))}
          </div>
        </>
      )}

      {showCustomForm ? (
        <CustomExerciseForm bodyPart={bodyPart} onDone={() => setShowCustomForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowCustomForm(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-slate-700 py-2 text-xs font-medium text-slate-400"
        >
          + Add a custom exercise
        </button>
      )}
    </div>
  )
}

function ExerciseFieldsEditor({ exercise }: { exercise: Exercise }) {
  const update = (patch: Partial<Exercise>) => db.exercises.update(exercise.id!, patch)
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-sky-500/20 pt-2 text-xs">
      <Field label="Rep min" value={exercise.repRangeMin} onChange={(v) => update({ repRangeMin: v })} />
      <Field label="Rep max" value={exercise.repRangeMax} onChange={(v) => update({ repRangeMax: v })} />
      <Field label="Weight step (lb)" value={exercise.weightIncrement} onChange={(v) => update({ weightIncrement: v })} />
      <Field label="Sets" value={exercise.targetSets} onChange={(v) => update({ targetSets: v })} />
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-0.5 text-slate-500">
      {label}
      <input
        type="number"
        inputMode="decimal"
        defaultValue={value}
        onBlur={(e) => {
          const v = Number(e.target.value)
          if (!Number.isNaN(v)) onChange(v)
        }}
        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
      />
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
      startingWeight: EQUIPMENT_DEFAULT_WEIGHT[equipmentType],
    })
    onDone()
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
      <input
        autoFocus
        placeholder="Exercise name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      />
      <select
        value={equipmentType}
        onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      >
        {Object.entries(EQUIPMENT_LABELS).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onDone} className="flex-1 rounded-lg py-2 text-sm text-slate-400">
          Cancel
        </button>
        <button type="button" onClick={save} className="flex-1 rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white">
          Add
        </button>
      </div>
    </div>
  )
}
