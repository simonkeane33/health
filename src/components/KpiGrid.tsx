'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { VaultData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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

export function KpiGrid({ data }: { data?: VaultData | null }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Latest weight', 'Calories today', 'Protein today', 'Fluids today'].map((label) => (
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

  const items = [
    {
      label: 'Latest weight',
      value: `${weightCurrent.toFixed(1)} kg`,
      delta: <Delta current={weightCurrent} previous={prevWeight?.weight_kg} unit="kg" />,
      sub: `${weightRemaining.toFixed(1)} kg to 90 kg target · ${days} days tracked`,
    },
    {
      label: 'BMI',
      value: bmiCurrent ? bmiCurrent.toFixed(1) : '—',
      delta: <Delta current={bmiCurrent ?? 0} previous={prevSummary?.bmi ?? undefined} />,
      sub: bmiCurrent ? (bmiCurrent < 18.5 ? 'Underweight' : bmiCurrent < 25 ? 'Healthy' : bmiCurrent < 30 ? 'Overweight' : 'Obese') : '',
    },
    {
      label: 'Calories today',
      value: latestSummary?.total_calories?.toString() ?? '—',
      delta: <Delta current={latestSummary?.total_calories ?? 0} previous={prevSummary?.total_calories ?? 0} />,
      sub: latestSummary ? `${latestSummary.food_entries ?? 0} entries` : 'No summary yet',
    },
    {
      label: 'Fluids today',
      value: latestSummary?.fluids_ml ? `${latestSummary.fluids_ml}ml` : '—',
      delta: <Delta current={latestSummary?.fluids_ml ?? 0} previous={prevSummary?.fluids_ml ?? 0} unit="ml" />,
      sub: '',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
