interface WeightStepperProps {
  value: number
  step: number
  unitLabel: string
  onChange: (value: number) => void
}

export function WeightStepper({ value, step, unitLabel, onChange }: WeightStepperProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label={`Decrease by ${step}`}
        onClick={() => onChange(Math.max(0, round1(value - step)))}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-2xl font-semibold text-slate-100 active:bg-slate-700"
      >
        −
      </button>
      <div className="min-w-[7rem] text-center">
        <div className="text-4xl font-bold tabular-nums text-slate-50">{value}</div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{unitLabel}</div>
      </div>
      <button
        type="button"
        aria-label={`Increase by ${step}`}
        onClick={() => onChange(round1(value + step))}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-2xl font-semibold text-white active:bg-sky-500"
      >
        +
      </button>
    </div>
  )
}

function round1(v: number) {
  return Math.round(v * 10) / 10
}
