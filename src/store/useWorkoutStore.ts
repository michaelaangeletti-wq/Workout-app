import { create } from 'zustand'
import type { BodyPart } from '../db/types'

export interface PlanItem {
  exerciseId: number
  exerciseName: string
  targetWeight: number // lb
  targetReps: number
  targetSets: number
  weightIncrement: number
  reason: string
}

// Ephemeral state for a workout currently in progress. Nothing here is
// persisted directly — each set gets written to Dexie as it's logged. The
// weight/rep targets are frozen here at the moment the session starts (from
// the recommendation engine's output on the Today screen) so that logging a
// set doesn't shift the target for the rest of the exercise.
interface WorkoutState {
  sessionId: number | null
  bodyPart: BodyPart | null
  plan: PlanItem[]
  currentExerciseIndex: number
  currentSetNumber: number
  startSession: (sessionId: number, bodyPart: BodyPart, plan: PlanItem[]) => void
  advanceSet: () => void
  advanceExercise: () => void
  endSession: () => void
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  sessionId: null,
  bodyPart: null,
  plan: [],
  currentExerciseIndex: 0,
  currentSetNumber: 1,

  startSession: (sessionId, bodyPart, plan) =>
    set({ sessionId, bodyPart, plan, currentExerciseIndex: 0, currentSetNumber: 1 }),

  advanceSet: () => set({ currentSetNumber: get().currentSetNumber + 1 }),

  advanceExercise: () =>
    set({ currentExerciseIndex: get().currentExerciseIndex + 1, currentSetNumber: 1 }),

  endSession: () =>
    set({ sessionId: null, bodyPart: null, plan: [], currentExerciseIndex: 0, currentSetNumber: 1 }),
}))
