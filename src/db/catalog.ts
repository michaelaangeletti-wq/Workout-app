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

// [name, equipment, secondary/synergist muscles also worked]
type CatalogEntry = [name: string, equipmentType: EquipmentType, secondary?: BodyPart[]]

const CATALOG: Record<BodyPart, CatalogEntry[]> = {
  chest: [
    ['Barbell Bench Press', 'barbell', ['shoulders', 'triceps']],
    ['Incline Dumbbell Press', 'dumbbell', ['shoulders', 'triceps']],
    ['Flat Dumbbell Press', 'dumbbell', ['shoulders', 'triceps']],
    ['Cable Fly', 'cable', ['shoulders']],
    ['Machine Chest Press', 'machine', ['shoulders', 'triceps']],
    ['Push-Up', 'bodyweight', ['shoulders', 'triceps', 'core']],
  ],
  back: [
    ['Deadlift', 'barbell', ['hamstrings-glutes', 'core']],
    ['Barbell Row', 'barbell', ['biceps']],
    ['Lat Pulldown', 'cable', ['biceps']],
    ['Seated Cable Row', 'cable', ['biceps']],
    ['Dumbbell Row', 'dumbbell', ['biceps']],
    ['Pull-Up', 'bodyweight', ['biceps']],
  ],
  shoulders: [
    ['Overhead Press', 'barbell', ['triceps', 'core']],
    ['Dumbbell Shoulder Press', 'dumbbell', ['triceps']],
    ['Lateral Raise', 'dumbbell'],
    ['Face Pull', 'cable', ['back']],
    ['Machine Shoulder Press', 'machine', ['triceps']],
  ],
  biceps: [
    ['Barbell Curl', 'barbell'],
    ['Dumbbell Curl', 'dumbbell'],
    ['Hammer Curl', 'dumbbell'],
    ['Cable Curl', 'cable'],
    ['Preacher Curl', 'machine'],
  ],
  triceps: [
    ['Close-Grip Bench Press', 'barbell', ['chest', 'shoulders']],
    ['Triceps Pushdown', 'cable'],
    ['Overhead Triceps Extension', 'dumbbell'],
    ['Skull Crusher', 'barbell'],
    ['Dip', 'bodyweight', ['chest', 'shoulders']],
  ],
  quads: [
    ['Back Squat', 'barbell', ['hamstrings-glutes', 'core']],
    ['Front Squat', 'barbell', ['hamstrings-glutes', 'core']],
    ['Leg Press', 'machine', ['hamstrings-glutes']],
    ['Leg Extension', 'machine'],
    ['Walking Lunge', 'dumbbell', ['hamstrings-glutes', 'core']],
  ],
  'hamstrings-glutes': [
    ['Romanian Deadlift', 'barbell', ['back', 'core']],
    ['Hip Thrust', 'barbell', ['core']],
    ['Leg Curl', 'machine'],
    ['Cable Pull-Through', 'cable', ['back']],
    ['Glute Bridge', 'bodyweight', ['core']],
  ],
  calves: [
    ['Standing Calf Raise', 'machine'],
    ['Seated Calf Raise', 'machine'],
    ['Dumbbell Calf Raise', 'dumbbell'],
  ],
  core: [
    ['Cable Crunch', 'cable'],
    ['Hanging Leg Raise', 'bodyweight'],
    ['Ab Wheel Rollout', 'bodyweight', ['shoulders']],
    ['Weighted Russian Twist', 'dumbbell'],
    ['Plank', 'bodyweight', ['shoulders']],
  ],
}

// Used by the Dexie migration to backfill secondary muscles onto exercises
// that were seeded before this field existed, matching by name.
export function getDefaultSecondaryBodyParts(name: string): BodyPart[] {
  for (const bodyPart of Object.keys(CATALOG) as BodyPart[]) {
    const entry = CATALOG[bodyPart].find(([entryName]) => entryName === name)
    if (entry) return entry[2] ?? []
  }
  return []
}

export function buildDefaultCatalog(): Omit<Exercise, 'id'>[] {
  const exercises: Omit<Exercise, 'id'>[] = []
  for (const bodyPart of Object.keys(CATALOG) as BodyPart[]) {
    CATALOG[bodyPart].forEach(([name, equipmentType, secondary], index) => {
      const d = DEFAULTS[equipmentType]
      exercises.push({
        name,
        bodyPart,
        secondaryBodyParts: secondary ?? [],
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
