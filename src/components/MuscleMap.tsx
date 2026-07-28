import { BODY_PARTS } from '../db/types'
import type { BodyPart } from '../db/types'

interface MuscleMapProps {
  activation: Record<BodyPart, number>
}

type Shape =
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }

const NEUTRAL_FILL = '#1e293b' // slate-800 — reads as "unworked," recedes into the card
const FULL_FILL = [56, 189, 248] as const // sky-400, rgb

// An original, stylized block figure — not an anatomical illustration — split
// into Lift Plan's 9 body-part zones. Front and back together cover all 9,
// each exactly once.
const FRONT_ZONES: { bodyPart: BodyPart; shapes: Shape[] }[] = [
  {
    bodyPart: 'shoulders',
    shapes: [
      { kind: 'rect', x: 48, y: 64, width: 34, height: 26, rx: 13 },
      { kind: 'rect', x: 118, y: 64, width: 34, height: 26, rx: 13 },
    ],
  },
  { bodyPart: 'chest', shapes: [{ kind: 'rect', x: 76, y: 70, width: 48, height: 50, rx: 10 }] },
  {
    bodyPart: 'biceps',
    shapes: [
      { kind: 'rect', x: 30, y: 90, width: 22, height: 70, rx: 11 },
      { kind: 'rect', x: 148, y: 90, width: 22, height: 70, rx: 11 },
    ],
  },
  { bodyPart: 'core', shapes: [{ kind: 'rect', x: 78, y: 122, width: 44, height: 58, rx: 10 }] },
  {
    bodyPart: 'quads',
    shapes: [
      { kind: 'rect', x: 64, y: 182, width: 32, height: 90, rx: 14 },
      { kind: 'rect', x: 104, y: 182, width: 32, height: 90, rx: 14 },
    ],
  },
]

const FRONT_NEUTRAL: Shape[] = [
  { kind: 'ellipse', cx: 100, cy: 32, rx: 20, ry: 20 },
  { kind: 'rect', x: 92, y: 50, width: 16, height: 14, rx: 4 },
  { kind: 'rect', x: 26, y: 160, width: 20, height: 60, rx: 10 },
  { kind: 'rect', x: 154, y: 160, width: 20, height: 60, rx: 10 },
  { kind: 'ellipse', cx: 36, cy: 228, rx: 10, ry: 10 },
  { kind: 'ellipse', cx: 164, cy: 228, rx: 10, ry: 10 },
  { kind: 'rect', x: 66, y: 274, width: 28, height: 80, rx: 12 },
  { kind: 'rect', x: 106, y: 274, width: 28, height: 80, rx: 12 },
  { kind: 'ellipse', cx: 80, cy: 364, rx: 18, ry: 10 },
  { kind: 'ellipse', cx: 120, cy: 364, rx: 18, ry: 10 },
]

const BACK_ZONES: { bodyPart: BodyPart; shapes: Shape[] }[] = [
  { bodyPart: 'back', shapes: [{ kind: 'rect', x: 54, y: 64, width: 92, height: 90, rx: 16 }] },
  {
    bodyPart: 'triceps',
    shapes: [
      { kind: 'rect', x: 30, y: 90, width: 22, height: 70, rx: 11 },
      { kind: 'rect', x: 148, y: 90, width: 22, height: 70, rx: 11 },
    ],
  },
  { bodyPart: 'hamstrings-glutes', shapes: [{ kind: 'rect', x: 60, y: 156, width: 80, height: 110, rx: 18 }] },
  {
    bodyPart: 'calves',
    shapes: [
      { kind: 'rect', x: 66, y: 274, width: 28, height: 80, rx: 12 },
      { kind: 'rect', x: 106, y: 274, width: 28, height: 80, rx: 12 },
    ],
  },
]

const BACK_NEUTRAL: Shape[] = [
  { kind: 'ellipse', cx: 100, cy: 32, rx: 20, ry: 20 },
  { kind: 'rect', x: 92, y: 50, width: 16, height: 14, rx: 4 },
  { kind: 'rect', x: 26, y: 160, width: 20, height: 60, rx: 10 },
  { kind: 'rect', x: 154, y: 160, width: 20, height: 60, rx: 10 },
  { kind: 'ellipse', cx: 36, cy: 228, rx: 10, ry: 10 },
  { kind: 'ellipse', cx: 164, cy: 228, rx: 10, ry: 10 },
  { kind: 'ellipse', cx: 80, cy: 364, rx: 18, ry: 10 },
  { kind: 'ellipse', cx: 120, cy: 364, rx: 18, ry: 10 },
]

export function MuscleMap({ activation }: MuscleMapProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">Muscles worked this week</div>
      <div className="mt-2 flex justify-center gap-6">
        <Figure label="Front" zones={FRONT_ZONES} neutral={FRONT_NEUTRAL} activation={activation} />
        <Figure label="Back" zones={BACK_ZONES} neutral={BACK_NEUTRAL} activation={activation} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-1">
        {BODY_PARTS.map((bp) => (
          <div key={bp.id} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: fillFor(activation[bp.id]) }} />
            <span className="truncate">{bp.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Figure({
  label,
  zones,
  neutral,
  activation,
}: {
  label: string
  zones: { bodyPart: BodyPart; shapes: Shape[] }[]
  neutral: Shape[]
  activation: Record<BodyPart, number>
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 200 400" className="h-40 w-20">
        {neutral.map((shape, i) => (
          <ShapeEl key={`neutral-${i}`} shape={shape} fill={NEUTRAL_FILL} />
        ))}
        {zones.map(({ bodyPart, shapes }) =>
          shapes.map((shape, i) => (
            <ShapeEl key={`${bodyPart}-${i}`} shape={shape} fill={fillFor(activation[bodyPart])} />
          )),
        )}
      </svg>
      <span className="text-[10px] uppercase tracking-wide text-slate-600">{label}</span>
    </div>
  )
}

function ShapeEl({ shape, fill }: { shape: Shape; fill: string }) {
  if (shape.kind === 'rect') {
    return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} fill={fill} />
  }
  return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill={fill} />
}

function fillFor(activationPct: number | undefined): string {
  const pct = clamp((activationPct ?? 0) / 100, 0, 1)
  const neutral = hexToRgb(NEUTRAL_FILL)
  const r = Math.round(neutral[0] + (FULL_FILL[0] - neutral[0]) * pct)
  const g = Math.round(neutral[1] + (FULL_FILL[1] - neutral[1]) * pct)
  const b = Math.round(neutral[2] + (FULL_FILL[2] - neutral[2]) * pct)
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
