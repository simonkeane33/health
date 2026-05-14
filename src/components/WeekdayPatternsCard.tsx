'use client';

import { useMemo, useState } from 'react';
import type { DailySummary } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeWeekdayPatterns } from '@/lib/projections';
import { useTargets } from '@/lib/targets-context';

type Metric = 'calories' | 'protein' | 'fluids';

interface Props {
  summaries: DailySummary[];
}

export function WeekdayPatternsCard({ summaries }: Props) {
  const { targets } = useTargets();
  const [metric, setMetric] = useState<Metric>('calories');

  const stats = useMemo(() => computeWeekdayPatterns(summaries, 60), [summaries]);

  // Pick value + target per metric
  const config = {
    calories: { unit: 'kcal', target: targets.calories_kcal, valueOf: (s: typeof stats[0]) => s.avgCalories },
    protein: { unit: 'g', target: targets.protein_g, valueOf: (s: typeof stats[0]) => s.avgProtein },
    fluids: { unit: 'ml', target: targets.fluids_ml, valueOf: (s: typeof stats[0]) => s.avgFluids },
  }[metric];

  const values = stats.map(config.valueOf);
  const maxVal = Math.max(...values, config.target);
  // Highlight outliers
  const totalAvg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.filter((v) => v > 0).length);
  const sampleSizeTotal = stats.reduce((a, s) => a + s.sampleSize, 0);

  if (sampleSizeTotal < 14) {
    return null; // not enough data to show meaningful patterns
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardDescription>Last 60 days</CardDescription>
          <CardTitle>Weekday patterns</CardTitle>
        </div>
        <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <SelectTrigger className="h-7 text-xs w-[110px] bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="calories">Calories</SelectItem>
            <SelectItem value="protein">Protein</SelectItem>
            <SelectItem value="fluids">Fluids</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-32">
          {stats.map((s, i) => {
            const val = values[i];
            const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            const isHigh = val > totalAvg * 1.1 && val > 0;
            const isLow = val < totalAvg * 0.9 && val > 0;
            const barColor =
              metric === 'calories'
                ? isHigh ? 'bg-amber-400' : 'bg-primary/60'
                : isLow ? 'bg-amber-400' : 'bg-emerald-500/70';
            return (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex-1 w-full flex items-end relative">
                  <div
                    className={`w-full rounded-t-sm transition-all ${barColor}`}
                    style={{ height: `${heightPct}%` }}
                    title={`${s.label}: ${val.toLocaleString()} ${config.unit} (n=${s.sampleSize})`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
                <span className="text-[10px] font-medium tabular-nums">
                  {val > 0 ? val.toLocaleString() : '—'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Avg across all days: {Math.round(totalAvg).toLocaleString()} {config.unit}</span>
          <span>Target: {config.target.toLocaleString()} {config.unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}
