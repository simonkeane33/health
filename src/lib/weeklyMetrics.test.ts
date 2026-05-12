import { describe, it, expect } from 'vitest';
import { computeWeeklyMetrics } from './weeklyMetrics';
import type { DailySummary } from './types';

function makeSummary(overrides: Partial<DailySummary> & { entry_date: string }): DailySummary {
  return {
    id: `day-${overrides.entry_date}`,
    entry_type: 'daily_summary',
    entry_date: overrides.entry_date,
    source: 'test',
    intake_complete: true,
    ...overrides,
  };
}

describe('computeWeeklyMetrics', () => {
  it('returns undefined averages when no data', () => {
    const result = computeWeeklyMetrics([]);
    expect(result.weight.currentAvg).toBeUndefined();
    expect(result.weight.priorAvg).toBeUndefined();
    expect(result.weight.delta).toBeUndefined();
    expect(result.calories.currentAvg).toBeUndefined();
    expect(result.calories.priorAvg).toBeUndefined();
    expect(result.calories.delta).toBeUndefined();
  });

  it('computes current week weight avg from last 7 days', () => {
    const summaries: DailySummary[] = [
      makeSummary({ entry_date: '2026-05-12', weight_kg: 91.0 }),
      makeSummary({ entry_date: '2026-05-11', weight_kg: 91.2 }),
      makeSummary({ entry_date: '2026-05-10', weight_kg: 91.1 }),
      makeSummary({ entry_date: '2026-05-09', weight_kg: 91.3 }),
      makeSummary({ entry_date: '2026-05-08', weight_kg: 91.4 }),
      makeSummary({ entry_date: '2026-05-07', weight_kg: 91.5 }),
      makeSummary({ entry_date: '2026-05-06', weight_kg: 91.6 }),
      makeSummary({ entry_date: '2026-05-05', weight_kg: 92.0 }),
      makeSummary({ entry_date: '2026-05-04', weight_kg: 92.2 }),
    ];
    const result = computeWeeklyMetrics(summaries);
    expect(result.weight.currentAvg).toBeCloseTo((91.0 + 91.2 + 91.1 + 91.3 + 91.4 + 91.5 + 91.6) / 7, 5);
    expect(result.weight.priorAvg).toBeCloseTo((92.0 + 92.2) / 2, 5);
    expect(result.weight.delta).toBeCloseTo(result.weight.currentAvg! - result.weight.priorAvg!, 5);
  });

  it('computes current week calorie avg ignoring days with no food entries', () => {
    const summaries: DailySummary[] = [
      makeSummary({ entry_date: '2026-05-12', total_calories: 2000, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-11', total_calories: 2100, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-10', total_calories: 1900, food_entries: 2 }),
      makeSummary({ entry_date: '2026-05-09', total_calories: 2200, food_entries: 4 }),
      makeSummary({ entry_date: '2026-05-08', total_calories: 2000, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-07', total_calories: 1800, food_entries: 2 }),
      makeSummary({ entry_date: '2026-05-06', total_calories: 2300, food_entries: 4 }),
      makeSummary({ entry_date: '2026-05-05', total_calories: 2100, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-04', total_calories: 2200, food_entries: 3 }),
    ];
    const result = computeWeeklyMetrics(summaries);
    expect(result.calories.currentAvg).toBeCloseTo(
      (2000 + 2100 + 1900 + 2200 + 2000 + 1800 + 2300) / 7,
      5
    );
    expect(result.calories.priorAvg).toBeCloseTo((2100 + 2200) / 2, 5);
  });

  it('skips days missing weight data when averaging', () => {
    const summaries: DailySummary[] = [
      makeSummary({ entry_date: '2026-05-12', weight_kg: 91.0 }),
      makeSummary({ entry_date: '2026-05-11' }),
      makeSummary({ entry_date: '2026-05-10', weight_kg: 91.2 }),
      makeSummary({ entry_date: '2026-05-09' }),
      makeSummary({ entry_date: '2026-05-08', weight_kg: 91.4 }),
      makeSummary({ entry_date: '2026-05-07' }),
      makeSummary({ entry_date: '2026-05-06', weight_kg: 91.6 }),
      makeSummary({ entry_date: '2026-05-05', weight_kg: 92.0 }),
      makeSummary({ entry_date: '2026-05-04', weight_kg: 92.2 }),
      makeSummary({ entry_date: '2026-05-03', weight_kg: 92.3 }),
    ];
    const result = computeWeeklyMetrics(summaries);
    // current week has 4 valid weight days
    expect(result.weight.currentAvg).toBeCloseTo((91.0 + 91.2 + 91.4 + 91.6) / 4, 5);
    // prior week has 3 valid weight days
    expect(result.weight.priorAvg).toBeCloseTo((92.0 + 92.2 + 92.3) / 3, 5);
    expect(result.weight.currentDays).toBe(4);
    expect(result.weight.priorDays).toBe(3);
  });

  it('skips days missing food entries when averaging calories', () => {
    const summaries: DailySummary[] = [
      makeSummary({ entry_date: '2026-05-12', total_calories: 2000, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-11' }),
      makeSummary({ entry_date: '2026-05-10', total_calories: 1900, food_entries: 2 }),
      makeSummary({ entry_date: '2026-05-09' }),
      makeSummary({ entry_date: '2026-05-08', total_calories: 2100, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-07' }),
      makeSummary({ entry_date: '2026-05-06', total_calories: 2300, food_entries: 4 }),
      makeSummary({ entry_date: '2026-05-05', total_calories: 2100, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-04', total_calories: 2200, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-03', total_calories: 2250, food_entries: 3 }),
    ];
    const result = computeWeeklyMetrics(summaries);
    // current week has 4 valid calorie days
    expect(result.calories.currentAvg).toBeCloseTo((2000 + 1900 + 2100 + 2300) / 4, 5);
    // prior week has 3 valid calorie days
    expect(result.calories.priorAvg).toBeCloseTo((2100 + 2200 + 2250) / 3, 5);
    expect(result.calories.currentDays).toBe(4);
    expect(result.calories.priorDays).toBe(3);
  });

  it('returns undefined delta when prior week has no data', () => {
    const summaries: DailySummary[] = [
      makeSummary({ entry_date: '2026-05-12', weight_kg: 91.0, total_calories: 2000, food_entries: 3 }),
      makeSummary({ entry_date: '2026-05-11', weight_kg: 91.2, total_calories: 2100, food_entries: 3 }),
    ];
    const result = computeWeeklyMetrics(summaries);
    expect(result.weight.currentAvg).toBeDefined();
    expect(result.weight.priorAvg).toBeUndefined();
    expect(result.weight.delta).toBeUndefined();
    expect(result.calories.currentAvg).toBeDefined();
    expect(result.calories.priorAvg).toBeUndefined();
    expect(result.calories.delta).toBeUndefined();
  });
});
