import { useEffect, useRef, useState } from 'react'

interface RestTimerProps {
  seconds?: number
  onDone: () => void
  onSkip: () => void
}

const DEFAULT_SECONDS = 90
const ADJUST_STEP = 15

export function RestTimer({ seconds = DEFAULT_SECONDS, onDone, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (remaining <= 0) {
      playBeep()
      onDoneRef.current()
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tabular-nums text-sky-300">
          {mm}:{String(ss).padStart(2, '0')}
        </span>
        <span className="text-xs text-sky-400/80">Rest</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRemaining((r) => Math.max(0, r - ADJUST_STEP))}
          className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200"
          aria-label="Subtract 15 seconds"
        >
          −15
        </button>
        <button
          type="button"
          onClick={() => setRemaining((r) => r + ADJUST_STEP)}
          className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200"
          aria-label="Add 15 seconds"
        >
          +15
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Skip
        </button>
      </div>
    </div>
  )
}

function playBeep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.4)
    oscillator.onended = () => ctx.close()
  } catch {
    // Web Audio unavailable — the visual countdown reaching 0 is enough.
  }
}
