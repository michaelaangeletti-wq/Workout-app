import type { BodyPart, EquipmentType, Exercise } from './types'

// A default rep range and increment per equipment type, used to seed the
// catalog. Users can override any of this per-exercise during onboarding
// or later in Settings.
const DEFAULTS: Record<EquipmentType, { repMin: number; repMax: number; increment: number }> = {
  barbell: { repMin: 5, repMax: 8, increment: 5 },
  dumbbell: { repMin: 8, repMax: 12, increment: 5 },
  machine: { repMin: 8, repMax: 12, increment: 10 },
  cable: { repMin: 10, repMax: 15, increment: 5 },
  bodyweight: { repMin: 8, repMax: 15, increment: 5 },
}

type CatalogEntry = [name: string, equipmentType: EquipmentType]

const CATALOG: Record<BodyPart, CatalogEntry[]> = {
  chest: [
    ['Barbell Bench Press', 'barbell'],
    ['Incline Dumbbell Press', 'dumbbell'],
    ['Flat Dumbbell Press', 'dumbbell'],
    ['Cable Fly', 'cable'],
    ['Machine Chest Press', 'machine'],
    ['Push-Up', 'bodyweight'],
  ],
  back: [
    ['Deadlift', 'barbell'],
    ['Barbell Row', 'barbell'],
    ['Lat Pulldown', 'cable'],
    ['Seated Cable Row', 'cable'],
    ['Dumbbell Row', 'dumbbell'],
    ['Pull-Up', 'bodyweight'],
  ],
  shoulders: [
    ['Overhead Press', 'barbell'],
    ['Dumbbell Shoulder Press', 'dumbbell'],
    ['Lateral Raise', 'dumbbell'],
    ['Face Pull', 'cable'],
    ['Machine Shoulder Press', 'machine'],
  ],
  biceps: [
    ['Barbell Curl', 'barbell'],
    ['Dumbbell Curl', 'dumbbell'],
    ['Hammer Curl', 'dumbbell'],
    ['Cable Curl', 'cable'],
    ['Preacher Curl', 'machine'],
  ],
  triceps: [
    ['Close-Grip Bench Press', 'barbell'],
    ['Triceps Pushdown', 'cable'],
    ['Overhead Triceps Extension', 'dumbbell'],
    ['Skull Crusher', 'barbell'],
    ['Dip', 'bodyweight'],
  ],
  quads: [
    ['Back Squat', 'barbell'],
    ['Front Squat', 'barbell'],
    ['Leg Press', 'machine'],
    ['Leg Extension', 'machine'],
    ['Walking Lunge', 'dumbbell'],
  ],
  'hamstrings-glutes': [
    ['Romanian Deadlift', 'barbell'],
    ['Hip Thrust', 'barbell'],
    ['Leg Curl', 'machine'],
    ['Cable Pull-Through', 'cable'],
    ['Glute Bridge', 'bodyweight'],
  ],
  calves: [
    ['Standing Calf Raise', 'machine'],
    ['Seated Calf Raise', 'machine'],
    ['Dumbbell Calf Raise', 'dumbbell'],
  ],
  core: [
    ['Cable Crunch', 'cable'],
    ['Hanging Leg Raise', 'bodyweight'],
    ['Ab Wheel Rollout', 'bodyweight'],
    ['Weighted Russian Twist', 'dumbbell'],
    ['Plank', 'bodyweight'],
  ],
}

export function buildDefaultCatalog(): Omit<Exercise, 'id'>[] {
  const exercises: Omit<Exercise, 'id'>[] = []
  for (const bodyPart of Object.keys(CATALOG) as BodyPart[]) {
    CATALOG[bodyPart].forEach(([name, equipmentType], index) => {
      const d = DEFAULTS[equipmentType]
      exercises.push({
        name,
        bodyPart,
        equipmentType,
        repRangeMin: d.repMin,
        repRangeMax: d.repMax,
        weightIncrement: d.increment,
        targetSets: 3,
        isFavorite: false,
        isCustom: false,
        sortOrder: index,
      })
    })
  }
  return exercises
}
