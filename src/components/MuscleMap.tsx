import { BODY_PARTS } from '../db/types'
import type { BodyPart } from '../db/types'
import type { MuscleStatus } from '../lib/sessionStats'

interface MuscleMapProps {
  status: Record<BodyPart, MuscleStatus>
}

type Shape =
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }

// One hue, three steps: untrained recedes into the figure, secondary is a
// light tint, primary is the app's full accent. Same hue throughout, since
// this is an ordered scale (how directly a muscle was trained), not
// unrelated categories.
const STATUS_FILL: Record<MuscleStatus, string> = {
  none: '#334155', // slate-600 — visibly a body, but recedes under a trained zone
  secondary: '#7dd3fc', // sky-300 — light blue
  primary: '#0ea5e9', // sky-500 — dark blue
}

// An original, stylized figure — not an anatomical illustration — split into
// Lift Plan's 9 body-part zones. Adjacent shapes overlap on purpose (drawn
// in order, back to front) so the figure reads as one connected body instead
// of separate floating blocks. Front and back together cover all 9 zones,
// each exactly once.
const FRONT_ZONES: { bodyPart: BodyPart; shapes: Shape[] }[] = [
  { bodyPart: 'shoulders', shapes: [{ kind: 'rect', x: 40, y: 74, width: 120, height: 34, rx: 17 }] },
  { bodyPart: 'chest', shapes: [{ kind: 'rect', x: 66, y: 92, width: 68, height: 62, rx: 14 }] },
  {
    bodyPart: 'biceps',
    shapes: [
      { kind: 'rect', x: 32, y: 100, width: 30, height: 90, rx: 15 },
      { kind: 'rect', x: 138, y: 100, width: 30, height: 90, rx: 15 },
    ],
  },
  { bodyPart: 'core', shapes: [{ kind: 'rect', x: 70, y: 140, width: 60, height: 70, rx: 14 }] },
  {
    bodyPart: 'quads',
    shapes: [
      { kind: 'rect', x: 62, y: 200, width: 38, height: 110, rx: 18 },
      { kind: 'rect', x: 100, y: 200, width: 38, height: 110, rx: 18 },
    ],
  },
]

const FRONT_NEUTRAL: Shape[] = [
  { kind: 'ellipse', cx: 100, cy: 40, rx: 26, ry: 26 },
  { kind: 'rect', x: 88, y: 62, width: 24, height: 18, rx: 6 },
  { kind: 'rect', x: 28, y: 182, width: 26, height: 70, rx: 13 },
  { kind: 'rect', x: 146, y: 182, width: 26, height: 70, rx: 13 },
  { kind: 'ellipse', cx: 41, cy: 256, rx: 13, ry: 13 },
  { kind: 'ellipse', cx: 159, cy: 256, rx: 13, ry: 13 },
  { kind: 'rect', x: 66, y: 300, width: 32, height: 100, rx: 14 },
  { kind: 'rect', x: 102, y: 300, width: 32, height: 100, rx: 14 },
  { kind: 'ellipse', cx: 82, cy: 404, rx: 22, ry: 12 },
  { kind: 'ellipse', cx: 118, cy: 404, rx: 22, ry: 12 },
]

const BACK_ZONES: { bodyPart: BodyPart; shapes: Shape[] }[] = [
  {
    bodyPart: 'back',
    shapes: [
      { kind: 'rect', x: 40, y: 74, width: 120, height: 80, rx: 18 },
      { kind: 'rect', x: 66, y: 140, width: 68, height: 76, rx: 14 },
    ],
  },
  {
    bodyPart: 'triceps',
    shapes: [
      { kind: 'rect', x: 32, y: 100, width: 30, height: 90, rx: 15 },
      { kind: 'rect', x: 138, y: 100, width: 30, height: 90, rx: 15 },
    ],
  },
  { bodyPart: 'hamstrings-glutes', shapes: [{ kind: 'rect', x: 58, y: 200, width: 84, height: 120, rx: 20 }] },
  {
    bodyPart: 'calves',
    shapes: [
      { kind: 'rect', x: 66, y: 300, width: 32, height: 100, rx: 14 },
      { kind: 'rect', x: 102, y: 300, width: 32, height: 100, rx: 14 },
    ],
  },
]

const BACK_NEUTRAL: Shape[] = [
  { kind: 'ellipse', cx: 100, cy: 40, rx: 26, ry: 26 },
  { kind: 'rect', x: 88, y: 62, width: 24, height: 18, rx: 6 },
  { kind: 'rect', x: 28, y: 182, width: 26, height: 70, rx: 13 },
  { kind: 'rect', x: 146, y: 182, width: 26, height: 70, rx: 13 },
  { kind: 'ellipse', cx: 41, cy: 256, rx: 13, ry: 13 },
  { kind: 'ellipse', cx: 159, cy: 256, rx: 13, ry: 13 },
  { kind: 'ellipse', cx: 82, cy: 404, rx: 22, ry: 12 },
  { kind: 'ellipse', cx: 118, cy: 404, rx: 22, ry: 12 },
]

export function MuscleMap({ status }: MuscleMapProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">Muscles worked this week</span>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_FILL.primary }} />
            Primary
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_FILL.secondary }} />
            Secondary
          </span>
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-8">
        <Figure label="Front" zones={FRONT_ZONES} neutral={FRONT_NEUTRAL} status={status} />
        <Figure label="Back" zones={BACK_ZONES} neutral={BACK_NEUTRAL} status={status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
        {BODY_PARTS.map((bp) => (
          <div key={bp.id} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_FILL[status[bp.id]] }} />
            <span>{bp.label}</span>
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
  status,
}: {
  label: string
  zones: { bodyPart: BodyPart; shapes: Shape[] }[]
  neutral: Shape[]
  status: Record<BodyPart, MuscleStatus>
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 200 440" className="h-52 w-24">
        {neutral.map((shape, i) => (
          <ShapeEl key={`neutral-${i}`} shape={shape} fill={STATUS_FILL.none} />
        ))}
        {zones.map(({ bodyPart, shapes }) =>
          shapes.map((shape, i) => (
            <ShapeEl key={`${bodyPart}-${i}`} shape={shape} fill={STATUS_FILL[status[bodyPart]]} />
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
