import type { DailySummary, WeightEntry } from './types';

/* ------------------------------------------------------------------ */
/* On-pace projection — extrapolate today's intake to end of day      */
/* ------------------------------------------------------------------ */

/**
 * Project today's end-of-day total based on current intake.
 * Uses a linear extrapolation weighted by waking hours (6am–11pm = 17h).
 * Returns null when it's too early to project meaningfully (before 9am).
 */
export function projectEndOfDay(currentValue: number, now: Date = new Date()): number | null {
  const hour = now.getHours() + now.getMinutes() / 60;
  // Define "active intake window" — most people eat between 7am and 9pm
  const startHour = 7;
  const endHour = 21;
  if (hour < 9) return null; // too early to project
  if (hour >= endHour) return Math.round(currentValue);
  const elapsedFrac = (hour - startHour) / (endHour - startHour);
  if (elapsedFrac <= 0) return null;
  return Math.round(currentValue / elapsedFrac);
}

/* ------------------------------------------------------------------ */
/* Weight trajectory — linear regression on recent weights            */
/* ------------------------------------------------------------------ */

export interface WeightTrajectory {
  /** kg per day (negative = losing) */
  slopeKgPerDay: number;
  /** Predicted days to reach target weight, or null if not converging */
  daysToTarget: number | null;
  /** Predicted date target reached, or null */
  etaDate: string | null;
  /** R² goodness-of-fit (0-1) */
  rSquared: number;
  /** Number of points used */
  sampleSize: number;
}

export function computeWeightTrajectory(
  weights: WeightEntry[],
  targetKg: number,
  windowDays = 30,
): WeightTrajectory | null {
  if (weights.length < 3) return null;

  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const points = weights
    .filter((w) => new Date(w.entry_date + 'T00:00:00').getTime() >= cutoff)
    .map((w) => ({
      t: new Date(w.entry_date + 'T00:00:00').getTime() / (24 * 60 * 60 * 1000), // days since epoch
      y: w.weight_kg,
    }));
  if (points.length < 3) return null;

  // Linear regression: y = m*t + b
  const n = points.length;
  const sumT = points.reduce((a, p) => a + p.t, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumTT = points.reduce((a, p) => a + p.t * p.t, 0);
  const sumTY = points.reduce((a, p) => a + p.t * p.y, 0);
  const denom = n * sumTT - sumT * sumT;
  if (denom === 0) return null;

  const slope = (n * sumTY - sumT * sumY) / denom;
  const intercept = (sumY - slope * sumT) / n;

  // R²
  const meanY = sumY / n;
  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const predicted = slope * p.t + intercept;
    ssRes += Math.pow(p.y - predicted, 2);
    ssTot += Math.pow(p.y - meanY, 2);
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  // Project to target
  const todayT = Date.now() / (24 * 60 * 60 * 1000);
  const currentWeight = slope * todayT + intercept;
  let daysToTarget: number | null = null;
  let etaDate: string | null = null;

  // Need slope going the right direction to converge
  const needToLose = currentWeight > targetKg;
  const convergent = (needToLose && slope < 0) || (!needToLose && slope > 0);
  if (convergent && Math.abs(slope) > 0.001) {
    daysToTarget = Math.ceil((targetKg - currentWeight) / slope);
    if (daysToTarget > 0 && daysToTarget < 365 * 5) {
      const etaMs = (todayT + daysToTarget) * 24 * 60 * 60 * 1000;
      etaDate = new Date(etaMs).toISOString().split('T')[0];
    } else {
      daysToTarget = null;
    }
  }

  return {
    slopeKgPerDay: slope,
    daysToTarget,
    etaDate,
    rSquared,
    sampleSize: n,
  };
}

/* ------------------------------------------------------------------ */
/* Streaks — consecutive days hitting a target                        */
/* ------------------------------------------------------------------ */

export type StreakKey = 'calories' | 'protein' | 'fluids';

export function computeStreak(
  summaries: DailySummary[],
  metric: StreakKey,
  targets: { calories_kcal: number; protein_g: number; fluids_ml: number },
): number {
  const todayStr = new Date().toISOString().split('T')[0];
  // Sort descending and skip today (in progress)
  const sorted = [...summaries]
    .filter((s) => s.entry_date !== todayStr)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date));

  let streak = 0;
  for (const s of sorted) {
    let value: number | undefined;
    let target: number;
    let lowerIsBetter = false;
    switch (metric) {
      case 'calories':
        value = s.total_calories;
        target = targets.calories_kcal;
        lowerIsBetter = true; // under target = hit
        break;
      case 'protein':
        value = s.protein_g;
        target = targets.protein_g;
        break;
      case 'fluids':
        value = s.fluids_ml;
        target = targets.fluids_ml;
        break;
    }
    if (value == null || value === 0) break;
    const hit = lowerIsBetter ? value <= target * 1.05 : value >= target * 0.95;
    if (hit) streak++;
    else break;
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/* Weekday patterns — average per day-of-week                          */
/* ------------------------------------------------------------------ */

export interface WeekdayStat {
  /** 0 = Sunday, 1 = Monday … 6 = Saturday */
  dayOfWeek: number;
  label: string;
  avgCalories: number;
  avgProtein: number;
  avgFluids: number;
  sampleSize: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function computeWeekdayPatterns(summaries: DailySummary[], windowDays = 60): WeekdayStat[] {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const buckets: Array<{ cals: number[]; protein: number[]; fluids: number[] }> = Array.from(
    { length: 7 },
    () => ({ cals: [], protein: [], fluids: [] }),
  );

  for (const s of summaries) {
    const t = new Date(s.entry_date + 'T00:00:00').getTime();
    if (t < cutoff) continue;
    const dow = new Date(t).getDay();
    if (s.total_calories && s.total_calories > 0) buckets[dow].cals.push(s.total_calories);
    if (s.protein_g && s.protein_g > 0) buckets[dow].protein.push(s.protein_g);
    if (s.fluids_ml && s.fluids_ml > 0) buckets[dow].fluids.push(s.fluids_ml);
  }

  const avg = (arr: number[]) => (arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length);

  // Return Mon-first ordering, more natural for UK locale
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((dow) => ({
    dayOfWeek: dow,
    label: DAYS[dow],
    avgCalories: Math.round(avg(buckets[dow].cals)),
    avgProtein: Math.round(avg(buckets[dow].protein)),
    avgFluids: Math.round(avg(buckets[dow].fluids)),
    sampleSize: buckets[dow].cals.length,
  }));
}
