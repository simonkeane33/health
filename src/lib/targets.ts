export interface DailyTargets {
  calories_kcal: number;
  protein_g: number;
  fluids_ml: number;
  weight_kg: number;
}

export const DEFAULT_TARGETS: DailyTargets = {
  calories_kcal: 2000,
  protein_g: 150,
  fluids_ml: 2500,
  weight_kg: 90,
};

export type TargetState = 'under' | 'on_track' | 'over';

export function getTargetState(actual: number, target: number, tolerance = 0.05): TargetState {
  const ratio = actual / target;
  if (ratio < 1 - tolerance) return 'under';
  if (ratio > 1 + tolerance) return 'over';
  return 'on_track';
}

export function formatVariance(actual: number, target: number, unit: string): string {
  const diff = actual - target;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${Math.round(diff)} ${unit} vs target`;
}
