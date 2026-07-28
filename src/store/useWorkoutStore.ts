import { create } from 'zustand'

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
// persisted directly — each set gets written to Dexie as it's logged, and
// which sets are already done is derived live from Dexie rather than tracked
// here. The weight/rep targets are frozen at the moment the session starts
// (from the recommendation engine's output on the Today screen) so that
// logging a set doesn't shift the target for the rest of the exercise.
interface WorkoutState {
  sessionId: number | null
  label: string | null // routine name, or a single body part's label
  plan: PlanItem[]
  startSession: (sessionId: number, label: string, plan: PlanItem[]) => void
  endSession: () => void
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  sessionId: null,
  label: null,
  plan: [],

  startSession: (sessionId, label, plan) => set({ sessionId, label, plan }),

  endSession: () => set({ sessionId: null, label: null, plan: [] }),
}))
