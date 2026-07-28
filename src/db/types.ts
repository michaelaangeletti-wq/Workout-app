export type BodyPart =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings-glutes'
  | 'calves'
  | 'core'

export const BODY_PARTS: { id: BodyPart; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings-glutes', label: 'Hamstrings & Glutes' },
  { id: 'calves', label: 'Calves' },
  { id: 'core', label: 'Core' },
]

export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight'

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
}

// Sensible starting points (lb) when an exercise has no logged history yet.
export const EQUIPMENT_DEFAULT_WEIGHT: Record<EquipmentType, number> = {
  barbell: 45,
  dumbbell: 10,
  machine: 20,
  cable: 20,
  bodyweight: 0,
}

export interface Exercise {
  id?: number
  name: string
  bodyPart: BodyPart
  equipmentType: EquipmentType
  repRangeMin: number
  repRangeMax: number
  weightIncrement: number // stored in lb, the app's canonical unit
  targetSets: number
  isFavorite: boolean
  isCustom: boolean
  sortOrder: number
  startingWeight?: number // lb; only used before any history exists
}

export interface Session {
  id?: number
  date: string // ISO timestamp, session start
  bodyParts: BodyPart[] // one or more — a routine can span several
  label: string // display name at the time: a routine's name, or a single body part's label
  routineId?: number // set when started from a saved routine; absent for manual/ad-hoc sessions
  completedAt?: string
}

export interface Routine {
  id?: number
  name: string
  bodyParts: BodyPart[]
  sortOrder: number
}

export interface SetEntry {
  id?: number
  sessionId: number
  exerciseId: number
  setNumber: number
  weight: number // lb, canonical
  reps: number
  rpe?: number
  loggedAt: string
}

export type Units = 'lb' | 'kg'

export interface AppSettings {
  id: 'settings' // singleton row
  units: Units
  onboardingComplete: boolean
  weeklySchedule: (number | null)[] // 7 slots, Sun–Sat; each a routines.id or null (rest day)
}
