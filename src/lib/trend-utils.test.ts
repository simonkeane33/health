import { describe, it, expect } from 'vitest';
import { fillMissingDays, computeTrend, buildTrendSummary, type TrendResult } from './trend-utils';
import type { DailySummary } from './types';

function makeDay(date: string, overrides: Partial<DailySummary> = {}): DailySummary {
  return {
    id: `day-${date}`,
    entry_type: 'daily_summary',
    entry_date: date,
    total_calories: overrides.total_calories ?? 0,
    protein_g: overrides.protein_g ?? 0,
    carbs_g: overrides.carbs_g ?? 0,
    fat_g: overrides.fat_g ?? 0,
    fiber_g: overrides.fiber_g ?? 0,
    sugar_g: overrides.sugar_g ?? 0,
    fluids_ml: overrides.fluids_ml ?? 0,
    alcohol_units: overrides.alcohol_units ?? 0,
    food_entries: overrides.food_entries ?? 0,
    needs_review_count: overrides.needs_review_count ?? 0,
    weight_kg: overrides.weight_kg,
    body_fat_pct: overrides.body_fat_pct,
    muscle_mass_pct: overrides.muscle_mass_pct,
    bone_mass_pct: overrides.bone_mass_pct,
    body_water_pct: overrides.body_water_pct,
    bmi: overrides.bmi,
    intake_complete: overrides.intake_complete ?? true,
    summary_generated_at: overrides.summary_generated_at,
    source: 'test',
  };
}

describe('fillMissingDays', () => {
  it('fills a single gap', () => {
    const days = [
      makeDay('2024-01-01', { total_calories: 2000 }),
      makeDay('2024-01-03', { total_calories: 2100 }),
    ];
    const filled = fillMissingDays(days);
    expect(filled.length).toBe(3);
    expect(filled[0].entry_date).toBe('2024-01-01');
    expect(filled[0].total_calories).toBe(2000);
    expect(filled[1].entry_date).toBe('2024-01-02');
    expect(filled[1].source).toBe('gap');
    expect(filled[2].entry_date).toBe('2024-01-03');
    expect(filled[2].total_calories).toBe(2100);
  });

  it('handles all missing days when only one day supplied', () => {
    const days = [makeDay('2024-01-05', { weight_kg: 80 })];
    const filled = fillMissingDays(days);
    expect(filled.length).toBe(1);
    expect(filled[0].entry_date).toBe('2024-01-05');
  });

  it('handles empty array', () => {
    expect(fillMissingDays([])).toEqual([]);
  });
});

describe('computeTrend', () => {
  it('detects weight trending down', () => {
    const now = new Date('2024-01-07');
    const days = [
      makeDay('2024-01-01', { weight_kg: 80 }),
      makeDay('2024-01-02', { weight_kg: 79.5 }),
      makeDay('2024-01-03', { weight_kg: 79 }),
    ];
    const trend = computeTrend(days, 'weight_kg', '7', undefined, now);
    expect(trend.direction).toBe('down');
    expect(trend.delta).toBeCloseTo(-1, 1);
    expect(trend.hasData).toBe(true);
  });

  it('detects calories trending up', () => {
    const now = new Date('2024-01-07');
    const days = [
      makeDay('2024-01-01', { total_calories: 2000 }),
      makeDay('2024-01-02', { total_calories: 2100 }),
      makeDay('2024-01-03', { total_calories: 2200 }),
    ];
    const trend = computeTrend(days, 'total_calories', '7', undefined, now);
    expect(trend.direction).toBe('up');
    expect(trend.delta).toBe(200);
  });

  it('returns stable when change is below threshold', () => {
    const now = new Date('2024-01-07');
    const days = [
      makeDay('2024-01-01', { weight_kg: 80 }),
      makeDay('2024-01-02', { weight_kg: 80.1 }),
    ];
    const trend = computeTrend(days, 'weight_kg', '7', undefined, now);
    expect(trend.direction).toBe('stable');
  });

  it('returns hasData false with <2 data points', () => {
    const now = new Date('2024-01-07');
    const days = [makeDay('2024-01-01', { weight_kg: 80 })];
    const trend = computeTrend(days, 'weight_kg', '7', undefined, now);
    expect(trend.hasData).toBe(false);
  });

  it('handles all zero calories as stable', () => {
    const now = new Date('2024-01-07');
    const days = [
      makeDay('2024-01-01', { total_calories: 0 }),
      makeDay('2024-01-02', { total_calories: 0 }),
      makeDay('2024-01-03', { total_calories: 0 }),
    ];
    const trend = computeTrend(days, 'total_calories', '7', undefined, now);
    expect(trend.direction).toBe('stable');
  });

  it('handles all missing calories as hasData false', () => {
    const now = new Date('2024-01-07');
    const days = [
      makeDay('2024-01-01', {}),
      makeDay('2024-01-02', {}),
    ];
    const trend = computeTrend(days, 'total_calories', '7', undefined, now);
    expect(trend.hasData).toBe(false);
  });
});

describe('buildTrendSummary', () => {
  it('builds combined phrase for weight down / calories up', () => {
    const now = new Date('2024-01-07');
    const days = [
      makeDay('2024-01-01', { weight_kg: 80, total_calories: 2000 }),
      makeDay('2024-01-02', { weight_kg: 79.5, total_calories: 2100 }),
      makeDay('2024-01-03', { weight_kg: 79, total_calories: 2200 }),
    ];
    const summary = buildTrendSummary(days, '7', now);
    expect(summary.weightTrend.direction).toBe('down');
    expect(summary.calorieTrend.direction).toBe('up');
    expect(summary.combinedPhrase).toContain('Weight trending down');
    expect(summary.combinedPhrase).toContain('Calories trending up');
  });

  it('mentions stable when within thresholds', () => {
    const now = new Date('2024-01-07');
    const days = [
      makeDay('2024-01-01', { weight_kg: 80, total_calories: 2000 }),
      makeDay('2024-01-02', { weight_kg: 80.05, total_calories: 2010 }),
    ];
    const summary = buildTrendSummary(days, '7', now);
    expect(summary.calorieTrend.direction).toBe('stable');
    expect(summary.weightTrend.direction).toBe('stable');
    expect(summary.combinedPhrase).toContain('stable');
  });

  it('handles all missing data gracefully', () => {
    const now = new Date('2024-01-07');
    const days = [makeDay('2024-01-01'), makeDay('2024-01-02')];
    const summary = buildTrendSummary(days, '7', now);
    expect(summary.combinedPhrase).toContain('No trend data available');
  });

  it('labels 30-day phrase correctly', () => {
    const now = new Date('2024-01-07');
    const days = [
      makeDay('2024-01-01', { weight_kg: 80 }),
      makeDay('2024-01-02', { weight_kg: 79 }),
    ];
    const summary = buildTrendSummary(days, '30', now);
    expect(summary.combinedPhrase).toContain('This month:');
  });
});
