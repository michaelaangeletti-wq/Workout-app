import { EQUIPMENT_DEFAULT_WEIGHT } from '../db/types'
import type { Exercise, SetEntry } from '../db/types'

export type RecommendationKind = 'starting' | 'increase' | 'deload' | 'hold'

export interface Recommendation {
  kind: RecommendationKind
  weight: number // lb
  targetReps: number
  reason: string
}

/**
 * Decides what weight and rep target to prescribe for an exercise's next
 * session, using a double-progression scheme against its most recent
 * logged session:
 *
 *  - No history yet          -> use the exercise's starting weight (or an
 *                                equipment-type default), aim for the
 *                                bottom of the rep range.
 *  - Every set hit the top   -> add one weight increment, reset to the
 *    of the rep range           bottom of the rep range.
 *  - Any set fell below the  -> back off one increment (simple deload
 *    bottom of the rep range    safety net), aim for the bottom again.
 *  - Otherwise                -> hold the weight, aim for one more rep
 *                                than last time (capped at the top of
 *                                the range) before adding weight.
 */
export function recommendNextSession(
  exercise: Exercise,
  lastSessionSets: SetEntry[],
): Recommendation {
  const { repRangeMin, repRangeMax, weightIncrement, equipmentType } = exercise

  if (lastSessionSets.length === 0) {
    const weight = exercise.startingWeight ?? EQUIPMENT_DEFAULT_WEIGHT[equipmentType]
    return {
      kind: 'starting',
      weight,
      targetReps: repRangeMin,
      reason: 'No history yet for this exercise — starting weight.',
    }
  }

  const lastWeight = lastSessionSets[0].weight
  const allHitTop = lastSessionSets.every((s) => s.reps >= repRangeMax)
  const anyBelowBottom = lastSessionSets.some((s) => s.reps < repRangeMin)

  if (allHitTop) {
    return {
      kind: 'increase',
      weight: lastWeight + weightIncrement,
      targetReps: repRangeMin,
      reason: `You hit ${repRangeMax}+ reps on every set last time — adding ${weightIncrement} lb.`,
    }
  }

  if (anyBelowBottom) {
    const weight = Math.max(0, lastWeight - weightIncrement)
    return {
      kind: 'deload',
      weight,
      targetReps: repRangeMin,
      reason: `You missed ${repRangeMin} reps on a set last time — backing off ${weightIncrement} lb.`,
    }
  }

  const bestReps = Math.max(...lastSessionSets.map((s) => s.reps))
  const targetReps = Math.min(repRangeMax, bestReps + 1)
  return {
    kind: 'hold',
    weight: lastWeight,
    targetReps,
    reason: `Hold the weight — aim for ${targetReps} reps before adding weight.`,
  }
}
