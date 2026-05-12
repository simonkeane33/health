import type { DailySummary } from './types';

export interface WeeklyMetric {
  /** Average value for the current 7-day window */
  currentAvg: number | undefined;
  /** Average value for the prior 7-day window */
  priorAvg: number | undefined;
  /** Number of valid days in the current window */
  currentDays: number;
  /** Number of valid days in the prior window */
  priorDays: number;
  /** Delta = currentAvg - priorAvg (undefined if either side is missing) */
  delta: number | undefined;
}

function avgOrUndefined(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Compute weekly weight and calorie metrics by comparing the most recent
 * 7 daily summaries against the previous 7.
 *
 * Days without weight data are skipped for the weight average.
 * Days without food entries are skipped for the calorie average
 * (so unlogged days don't drag the average down).
 */
export function computeWeeklyMetrics(
  summaries: DailySummary[]
): { weight: WeeklyMetric; calories: WeeklyMetric } {
  // Summaries are assumed sorted by entry_date descending.
  const currentSlice = summaries.slice(0, 7);
  const priorSlice = summaries.slice(7, 14);

  const currentWeights = currentSlice
    .map((s) => s.weight_kg)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

  const priorWeights = priorSlice
    .map((s) => s.weight_kg)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

  const currentCals = currentSlice
    .filter((s) => (s.food_entries ?? 0) > 0 && typeof s.total_calories === 'number')
    .map((s) => s.total_calories!);

  const priorCals = priorSlice
    .filter((s) => (s.food_entries ?? 0) > 0 && typeof s.total_calories === 'number')
    .map((s) => s.total_calories!);

  const currentWeightAvg = avgOrUndefined(currentWeights);
  const priorWeightAvg = avgOrUndefined(priorWeights);

  const currentCalAvg = avgOrUndefined(currentCals);
  const priorCalAvg = avgOrUndefined(priorCals);

  return {
    weight: {
      currentAvg: currentWeightAvg,
      priorAvg: priorWeightAvg,
      currentDays: currentWeights.length,
      priorDays: priorWeights.length,
      delta:
        currentWeightAvg !== undefined && priorWeightAvg !== undefined
          ? currentWeightAvg - priorWeightAvg
          : undefined,
    },
    calories: {
      currentAvg: currentCalAvg,
      priorAvg: priorCalAvg,
      currentDays: currentCals.length,
      priorDays: priorCals.length,
      delta:
        currentCalAvg !== undefined && priorCalAvg !== undefined
          ? currentCalAvg - priorCalAvg
          : undefined,
    },
  };
}
