import type { DailySummary } from './types';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

export interface TrendResult {
  direction: 'up' | 'down' | 'stable';
  delta: number;
  deltaPct?: number;
  startValue: number;
  endValue: number;
  startDate: string;
  endDate: string;
  hasData: boolean;
}

export interface CombinedTrendSummary {
  weightTrend: TrendResult;
  calorieTrend: TrendResult;
  sugarTrend: TrendResult;
  proteinTrend: TrendResult;
  weightPhrase: string;
  caloriePhrase: string;
  combinedPhrase: string;
}

/**
 * Fill in missing calendar days between first and last date.
 * For any day not present in `summaries`, returns a placeholder with
 * entry_date set and all metric fields undefined.
 */
export function fillMissingDays(summaries: DailySummary[]): DailySummary[] {
  if (summaries.length === 0) return summaries;

  const map = new Map<string, DailySummary>();
  for (const s of summaries) {
    map.set(s.entry_date, s);
  }

  const dates = Array.from(map.keys()).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];

  const result: DailySummary[] = [];
  const d = new Date(first + 'T00:00:00');
  const end = new Date(last + 'T00:00:00');

  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    if (map.has(iso)) {
      result.push(map.get(iso)!);
    } else {
      result.push({
        id: `gap-${iso}`,
        entry_type: 'daily_summary',
        entry_date: iso,
        intake_complete: false,
        source: 'gap',
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return result;
}

export function filterAndSort(
  summaries: DailySummary[],
  range: RangeValue,
  now: Date = new Date(),
): DailySummary[] {
  if (range === 'all') {
    return [...summaries].sort(
      (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    );
  }
  const days = parseInt(range, 10);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return summaries
    .filter((s) => new Date(s.entry_date) >= cutoff)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
}

export function computeTrend(
  summaries: DailySummary[],
  field: 'total_calories' | 'weight_kg' | 'sugar_g' | 'protein_g',
  range: RangeValue,
  stableThreshold?: number,
  now?: Date,
): TrendResult {
  const sorted = filterAndSort(summaries, range, now);
  const values = sorted
    .map((s) => s[field])
    .filter((v): v is number => v != null && !Number.isNaN(v));

  if (values.length < 2) {
    return {
      direction: 'stable',
      delta: 0,
      startValue: 0,
      endValue: 0,
      startDate: '',
      endDate: '',
      hasData: false,
    };
  }

  const startValue = values[0];
  const endValue = values[values.length - 1];
  const delta = endValue - startValue;

  let threshold: number;
  if (stableThreshold != null) {
    threshold = stableThreshold;
  } else if (field === 'weight_kg') {
    threshold = 0.2;
  } else if (field === 'total_calories') {
    threshold = 100;
  } else if (field === 'sugar_g') {
    threshold = 5;
  } else if (field === 'protein_g') {
    threshold = 5;
  } else {
    threshold = 1;
  }

  const direction =
    Math.abs(delta) < threshold ? 'stable' : delta > 0 ? 'up' : 'down';

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const deltaPct = avg !== 0 ? (delta / avg) * 100 : undefined;

  return {
    direction,
    delta,
    deltaPct,
    startValue,
    endValue,
    startDate: sorted[0].entry_date,
    endDate: sorted[sorted.length - 1].entry_date,
    hasData: true,
  };
}

function trendPhrase(fieldLabel: string, trend: TrendResult, rangeLabel: string): string {
  if (!trend.hasData) return `${fieldLabel}: insufficient data`;

  const absDelta = Math.abs(trend.delta);
  const pctStr = trend.deltaPct != null
    ? ` (${Math.abs(trend.deltaPct).toFixed(0)}%)`
    : '';

  switch (trend.direction) {
    case 'up':
      return `${fieldLabel} trending up ${rangeLabel} (+${absDelta.toFixed(1)}${fieldLabel === 'Calories' || fieldLabel === 'Sugar' || fieldLabel === 'Protein' ? '' : absDelta >= 1 ? absDelta.toFixed(1) : absDelta.toFixed(2)}${fieldLabel === 'Weight' ? ' kg' : fieldLabel === 'Calories' ? ' kcal' : ' g'})${pctStr}`;
    case 'down':
      return `${fieldLabel} trending down ${rangeLabel} (-${absDelta.toFixed(1)}${fieldLabel === 'Weight' ? ' kg' : fieldLabel === 'Calories' ? ' kcal' : ' g'})${pctStr}`;
    default:
      return `${fieldLabel} stable ${rangeLabel}`;
  }
}

export function buildTrendSummary(
  summaries: DailySummary[],
  range: RangeValue,
  now?: Date,
): CombinedTrendSummary {
  const weightTrend = computeTrend(summaries, 'weight_kg', range, undefined, now);
  const calorieTrend = computeTrend(summaries, 'total_calories', range, undefined, now);
  const sugarTrend = computeTrend(summaries, 'sugar_g', range, undefined, now);
  const proteinTrend = computeTrend(summaries, 'protein_g', range, undefined, now);

  const rangeLabel = range === 'all' ? 'overall' : `${range}-day`;

  const weightPhrase = trendPhrase('Weight', weightTrend, rangeLabel);
  const caloriePhrase = trendPhrase('Calories', calorieTrend, rangeLabel);

  const parts: string[] = [];
  if (weightTrend.hasData) parts.push(weightPhrase);
  if (calorieTrend.hasData) parts.push(caloriePhrase);

  const combinedPhrase = parts.length > 0
    ? `${range === '7' ? 'This week' : range === '30' ? 'This month' : 'Trend'}: ${parts.join('; ')}.`
    : 'No trend data available for selected range.';

  return {
    weightTrend,
    calorieTrend,
    sugarTrend,
    proteinTrend,
    weightPhrase,
    caloriePhrase,
    combinedPhrase,
  };
}
