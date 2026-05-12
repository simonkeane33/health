'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { VaultData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { computeWeeklyMetrics } from '@/lib/weeklyMetrics';

function Delta({ current, previous, unit }: { current: number; previous?: number; unit?: string }) {
  if (previous === undefined || previous === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const diff = current - previous;
  const pct = ((diff / previous) * 100).toFixed(1);
  const isDown = diff < 0;
  const Icon = isDown ? TrendingDown : diff > 0 ? TrendingUp : Minus;
  const colorClass = isDown ? 'text-emerald-600' : diff > 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <span className={`flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit ? ` ${unit}` : ''} ({pct}%)
    </span>
  );
}

function getBmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function WeeklyDelta({
  currentAvg,
  priorAvg,
  unit,
  invert = false,
}: {
  currentAvg: number | undefined;
  priorAvg: number | undefined;
  unit?: string;
  invert?: boolean;
}) {
  if (currentAvg === undefined || priorAvg === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const diff = currentAvg - priorAvg;
  const pct = ((diff / priorAvg) * 100).toFixed(1);
  const isDown = diff < 0;
  const beneficial = invert ? !isDown : isDown; // for weight, down is good; for calories, down is also good (lower intake)
  const Icon = isDown ? TrendingDown : diff > 0 ? TrendingUp : Minus;
  const colorClass = beneficial ? 'text-emerald-600' : diff !== 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <span className={`flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {diff > 0 ? '+' : ''}{diff.toFixed(2)}{unit ? ` ${unit}` : ''} ({pct}%)
    </span>
  );
}

export function KpiGrid({ data }: { data?: VaultData | null }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Latest weight', 'BMI', 'Calories today', 'Fluids today', 'Weekly weight', 'Weekly calories'].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">—</div>
              <span className="text-xs text-muted-foreground">No data</span>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const latestWeight = data.weightEntries[0];
  const prevWeight = data.weightEntries[1];
  const latestSummary = data.dailySummaries[0];
  const prevSummary = data.dailySummaries[1];

  const days = data.weightEntries.length;
  const weightTarget = 90;
  const weightCurrent = latestWeight?.weight_kg ?? 0;
  const weightRemaining = Math.max(0, weightCurrent - weightTarget);
  const bmiCurrent = latestSummary?.bmi;

  const weekly = computeWeeklyMetrics(data.dailySummaries);

  const items = [
    {
      label: 'Latest weight',
      value: weightCurrent > 0 ? `${weightCurrent.toFixed(1)} kg` : '—',
      delta: <Delta current={weightCurrent} previous={prevWeight?.weight_kg} unit="kg" />,
      sub: weightRemaining > 0 ? `${weightRemaining.toFixed(1)} kg above ${weightTarget} kg target · ${days} days` : `${days} days tracked`,
    },
    {
      label: 'Body mass index',
      value: (bmiCurrent ?? 0) > 0 ? (bmiCurrent as number).toFixed(1) : '—',
      delta: <Delta current={bmiCurrent ?? 0} previous={prevSummary?.bmi} />,
      sub: (bmiCurrent ?? 0) > 0 ? getBmiLabel(bmiCurrent as number) : '',
    },
    {
      label: 'Calories today',
      value: (latestSummary?.total_calories ?? 0) > 0 ? String(latestSummary!.total_calories) : '—',
      delta: <Delta current={latestSummary?.total_calories ?? 0} previous={prevSummary?.total_calories ?? 0} />,
      sub: latestSummary ? `${latestSummary.food_entries ?? 0} food entries` : 'No summary yet',
    },
    {
      label: 'Fluids today',
      value: (latestSummary?.fluids_ml ?? 0) > 0 ? `${latestSummary!.fluids_ml} ml` : '—',
      delta: <Delta current={latestSummary?.fluids_ml ?? 0} previous={prevSummary?.fluids_ml ?? 0} unit="ml" />,
      sub: (latestSummary?.fluids_ml ?? 0) > 0 ? 'Water, tea, coffee, other drinks' : '',
    },
    {
      label: 'Weekly weight',
      value: weekly.weight.currentAvg !== undefined ? `${weekly.weight.currentAvg.toFixed(1)} kg` : '—',
      delta: (
        <WeeklyDelta
          currentAvg={weekly.weight.currentAvg}
          priorAvg={weekly.weight.priorAvg}
          unit="kg"
        />
      ),
      sub:
        weekly.weight.currentAvg !== undefined
          ? `Week average vs previous week (${weekly.weight.currentDays} days)`
          : 'Not enough weight data for a weekly average',
    },
    {
      label: 'Weekly calories',
      value: weekly.calories.currentAvg !== undefined ? `${Math.round(weekly.calories.currentAvg)} kcal` : '—',
      delta: (
        <WeeklyDelta
          currentAvg={weekly.calories.currentAvg}
          priorAvg={weekly.calories.priorAvg}
          unit="kcal"
        />
      ),
      sub:
        weekly.calories.currentAvg !== undefined
          ? `Week average vs previous week (${weekly.calories.currentDays} days)`
          : 'Not enough calorie data for a weekly average',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(({ label, value, delta, sub }) => (
        <Card key={label}>
          <CardHeader>
            <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">{label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">{value}</div>
            {delta}
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
