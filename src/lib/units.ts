import type { Units } from '../db/types'

const LB_PER_KG = 2.20462

// All weights are stored canonically in lb. These helpers only affect display
// and input — converting on every read would drift over repeated round-trips.

export function lbToDisplay(lb: number, units: Units): number {
  if (units === 'lb') return round(lb, 1)
  return round(lb / LB_PER_KG, 1)
}

export function displayToLb(value: number, units: Units): number {
  if (units === 'lb') return value
  return value * LB_PER_KG
}

export function unitLabel(units: Units): string {
  return units
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
