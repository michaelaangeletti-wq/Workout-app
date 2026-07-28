import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import { BODY_PARTS } from '../db/types'
import type { BodyPart } from '../db/types'

interface DayType {
  name: string
  bodyParts: BodyPart[]
}

interface Template {
  id: string
  name: string
  description: string
  dayTypes: DayType[]
  // Index into dayTypes for each weekday (Sun..Sat), or null for a rest day.
  weekMap: (number | null)[]
}

const TEMPLATES: Template[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: 'Classic 6-day split, each day type twice a week.',
    dayTypes: [
      { name: 'Push', bodyParts: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull', bodyParts: ['back', 'biceps'] },
      { name: 'Legs', bodyParts: ['quads', 'hamstrings-glutes', 'calves', 'core'] },
    ],
    weekMap: [null, 0, 1, 2, 0, 1, 2],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    description: '4 days a week, alternating upper and lower body.',
    dayTypes: [
      { name: 'Upper', bodyParts: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { name: 'Lower', bodyParts: ['quads', 'hamstrings-glutes', 'calves', 'core'] },
    ],
    weekMap: [null, 0, 1, null, 0, 1, null],
  },
  {
    id: 'arnold',
    name: 'Arnold Split',
    description: 'Chest & back, shoulders & arms, legs — each twice a week.',
    dayTypes: [
      { name: 'Chest & Back', bodyParts: ['chest', 'back'] },
      { name: 'Shoulders & Arms', bodyParts: ['shoulders', 'biceps', 'triceps'] },
      { name: 'Legs', bodyParts: ['quads', 'hamstrings-glutes', 'calves', 'core'] },
    ],
    weekMap: [null, 0, 1, 2, 0, 1, 2],
  },
  {
    id: 'bro-split',
    name: 'Bro Split',
    description: 'One body part per day, 5 days a week.',
    dayTypes: [
      { name: 'Chest', bodyParts: ['chest'] },
      { name: 'Back', bodyParts: ['back'] },
      { name: 'Shoulders', bodyParts: ['shoulders'] },
      { name: 'Legs & Core', bodyParts: ['quads', 'hamstrings-glutes', 'calves', 'core'] },
      { name: 'Arms', bodyParts: ['biceps', 'triceps'] },
    ],
    weekMap: [null, 0, 1, 2, 3, 4, null],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    description: 'All body parts, 3 non-consecutive days a week.',
    dayTypes: [{ name: 'Full Body', bodyParts: [...BODY_PARTS.map((bp) => bp.id)] }],
    weekMap: [null, 0, null, 0, null, 0, null],
  },
]

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'R', 'F', 'S']

export function SuggestedRoutines() {
  const navigate = useNavigate()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const adopt = async (template: Template) => {
    const routineIds = await Promise.all(
      template.dayTypes.map((dt, i) => db.routines.add({ name: dt.name, bodyParts: dt.bodyParts, sortOrder: i })),
    )
    const weeklySchedule = template.weekMap.map((idx) => (idx === null ? null : (routineIds[idx] as number)))
    await db.settings.update('settings', { weeklySchedule })
    navigate('/routines')
  }

  return (
    <div className="flex min-h-svh flex-col px-5 pt-14 pb-24">
      <Link to="/routines" className="text-sm text-slate-400">
        ← Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-50">You should try this</h1>
      <p className="mt-1 text-sm text-slate-400">
        Common weekly splits, ready to go. Adopting one replaces your current routines and schedule.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <div className="text-sm font-semibold text-slate-100">{t.name}</div>
            <div className="mt-0.5 text-xs text-slate-500">{t.description}</div>

            <div className="mt-3 flex justify-between">
              {t.weekMap.map((idx, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-600">{WEEKDAY_LETTERS[i]}</span>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold ${
                      idx === null ? 'bg-slate-800 text-slate-600' : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {idx === null ? '—' : t.dayTypes[idx].name[0]}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => (confirmingId === t.id ? adopt(t) : setConfirmingId(t.id))}
              className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold ${
                confirmingId === t.id ? 'bg-amber-500 text-slate-950' : 'bg-sky-600 text-white'
              }`}
            >
              {confirmingId === t.id ? 'Tap again to replace your schedule' : 'Use this'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
