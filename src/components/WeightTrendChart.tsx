import { useRef, useState } from 'react'

export interface TrendPoint {
  date: string // ISO
  weight: number // already converted to display units
}

interface WeightTrendChartProps {
  points: TrendPoint[]
  unit: string
}

const WIDTH = 300
const HEIGHT = 170
const PAD_LEFT = 34
const PAD_RIGHT = 14
const PAD_TOP = 20
const PAD_BOTTOM = 22
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM

// A single accent hue (the app's existing sky-400) is correct here: this is a
// one-series chart, so there's no categorical palette to assign — identity is
// already carried by the card title, and sky-400 clears >=3:1 contrast on the
// slate-900 card surface it sits on.
const LINE_COLOR = '#38bdf8'
const GRID_COLOR = '#2c3548' // one step off the slate-900 card surface
const AXIS_TEXT = '#64748b' // slate-500, muted ink
const CROSSHAIR_COLOR = '#475569'

export function WeightTrendChart({ points, unit }: WeightTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (points.length < 2) {
    // A one-point "line" is a stat tile in disguise — show the number instead.
    const only = points[0]
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
        <div className="text-xs uppercase tracking-wide text-slate-500">Weight over time</div>
        <div className="mt-1 text-3xl font-semibold text-slate-50">
          {only ? `${only.weight} ${unit}` : '—'}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">Log one more session to see a trend.</div>
      </div>
    )
  }

  const weights = points.map((p) => p.weight)
  const { min, max, step } = niceTicks(Math.min(...weights), Math.max(...weights))
  const yTicks: number[] = []
  for (let v = min; v <= max + step / 2; v += step) yTicks.push(round1(v))

  const xAt = (i: number) => PAD_LEFT + (points.length === 1 ? 0 : (i / (points.length - 1)) * PLOT_W)
  const yAt = (w: number) => PAD_TOP + PLOT_H - ((w - min) / (max - min || 1)) * PLOT_H

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.weight)}`).join(' ')

  const xLabelIndices = pickXLabelIndices(points.length)
  const last = points[points.length - 1]
  const active = activeIndex !== null ? points[activeIndex] : null

  const updateFromClientX = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relX = ((clientX - rect.left) / rect.width) * WIDTH
    const ratio = clamp((relX - PAD_LEFT) / PLOT_W, 0, 1)
    const idx = Math.round(ratio * (points.length - 1))
    setActiveIndex(clamp(idx, 0, points.length - 1))
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
      <div className="flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-500">Weight over time</div>
        <div className="text-xs text-slate-500">{unit}</div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-1 w-full touch-none select-none"
        role="img"
        aria-label={`Weight trend from ${points[0].weight} to ${last.weight} ${unit}`}
        onPointerDown={(e) => updateFromClientX(e.clientX)}
        onPointerMove={(e) => {
          if (e.buttons === 0 && e.pointerType === 'mouse') return
          if (e.pressure === 0 && e.pointerType !== 'mouse') return
          updateFromClientX(e.clientX)
        }}
        onPointerUp={() => setActiveIndex(null)}
        onPointerLeave={() => setActiveIndex(null)}
      >
        {/* Gridlines + y-axis ticks */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke={GRID_COLOR}
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 6} y={yAt(t)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill={AXIS_TEXT}>
              {t}
            </text>
          </g>
        ))}

        {/* X-axis date labels */}
        {xLabelIndices.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={HEIGHT - 4}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            fontSize={9}
            fill={AXIS_TEXT}
          >
            {shortDate(points[i].date)}
          </text>
        ))}

        {/* Crosshair (touch/drag only) */}
        {active && activeIndex !== null && (
          <line
            x1={xAt(activeIndex)}
            x2={xAt(activeIndex)}
            y1={PAD_TOP}
            y2={PAD_TOP + PLOT_H}
            stroke={CROSSHAIR_COLOR}
            strokeWidth={1}
          />
        )}

        {/* The line */}
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* End marker: ring in the surface color so it stays legible where it meets the line */}
        <circle cx={xAt(points.length - 1)} cy={yAt(last.weight)} r={4} fill={LINE_COLOR} stroke="#0f172a" strokeWidth={2} />
        <text x={xAt(points.length - 1)} y={yAt(last.weight) - 10} textAnchor="end" fontSize={10} fontWeight={600} fill="#f1f5f9">
          {last.weight}
        </text>

        {/* Active touch point */}
        {active && activeIndex !== null && (
          <circle cx={xAt(activeIndex)} cy={yAt(active.weight)} r={4} fill={LINE_COLOR} stroke="#0f172a" strokeWidth={2} />
        )}

        {/* Invisible full-plot hit area so drags register anywhere, not just on the line */}
        <rect x={PAD_LEFT} y={0} width={PLOT_W} height={HEIGHT} fill="transparent" />
      </svg>

      {active && activeIndex !== null && (
        <div className="mt-1 flex items-center justify-center gap-2 text-xs">
          <span className="text-slate-500">{formatFullDate(active.date)}</span>
          <span className="font-semibold tabular-nums text-slate-100">
            {active.weight} {unit}
          </span>
        </div>
      )}
    </div>
  )
}

function niceTicks(min: number, max: number): { min: number; max: number; step: number } {
  if (min === max) {
    return { min: min - 5, max: max + 5, step: 5 }
  }
  const range = max - min
  const roughStep = range / 3
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const candidates = [1, 2, 2.5, 5, 10]
  const normalized = roughStep / magnitude
  const step = (candidates.find((c) => c >= normalized) ?? 10) * magnitude
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  return { min: niceMin, max: niceMax, step }
}

function pickXLabelIndices(count: number): number[] {
  if (count <= 4) return points_range(count)
  const middle = Math.floor((count - 1) / 2)
  return [...new Set([0, middle, count - 1])].sort((a, b) => a - b)
}

function points_range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}
