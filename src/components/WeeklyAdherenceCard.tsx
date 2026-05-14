'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { DailySummary } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTargets } from '@/lib/targets-context';

interface Props {
  summaries: DailySummary[];
  days?: number;
}

interface MetricRow {
  label: string;
  unit: string;
  target: number;
  values: (number | undefined)[];
  lowerIsBetter?: boolean;
}

/**
 * Returns:
 *   true  = target was hit
 *   false = target was missed (and the day is complete)
 *   null  = unknown — either no value yet, or it's today and target isn't hit yet (so still in play)
 */
function hitTarget(
  value: number | undefined,
  target: number,
  lowerIsBetter = false,
  isToday = false,
): boolean | null {
  if (value == null || value === 0) return null;
  const hit = lowerIsBetter ? value <= target * 1.05 : value >= target * 0.95;
  // For today, don't fail until the day is over — show neutral if not yet hit
  if (!hit && isToday) return null;
  return hit;
}

function DayDot({ hit, isToday }: { hit: boolean | null; isToday: boolean }) {
  if (hit === null) {
    return (
      <span
        className={`inline-block h-5 w-5 rounded-full ${
          isToday ? 'bg-primary/10 border border-primary/40' : 'bg-muted border border-border'
        }`}
        title={isToday ? 'In progress — target not yet hit' : 'No data'}
      />
    );
  }
  if (hit) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
  }
  return <XCircle className="h-5 w-5 text-destructive/70 flex-shrink-0" />;
}

export function WeeklyAdherenceCard({ summaries, days = 7 }: Props) {
  const { targets } = useTargets();
  const { rows, dateLabels, todayFlags } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sorted = [...summaries]
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
      .slice(0, days)
      .reverse();

    const labels = sorted.map((s) => {
      const d = new Date(s.entry_date + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
    });
    const todayFlags = sorted.map((s) => s.entry_date === todayStr);

    const metrics: MetricRow[] = [
      {
        label: 'Calories',
        unit: 'kcal',
        target: targets.calories_kcal,
        values: sorted.map((s) => s.total_calories),
      },
      {
        label: 'Protein',
        unit: 'g',
        target: targets.protein_g,
        values: sorted.map((s) => s.protein_g),
      },
      {
        label: 'Fluids',
        unit: 'ml',
        target: targets.fluids_ml,
        values: sorted.map((s) => s.fluids_ml),
      },
    ];

    return { rows: metrics, dateLabels: labels, todayFlags };
  }, [summaries, days, targets]);

  if (summaries.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Last {days} days</CardDescription>
        <CardTitle>Target Adherence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[340px] text-sm">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-medium text-muted-foreground pb-2 pr-4 w-24">Metric</th>
                {dateLabels.map((label) => (
                  <th key={label} className="text-center text-[11px] font-medium text-muted-foreground pb-2 px-1 min-w-[40px]">
                    {label}
                  </th>
                ))}
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 pl-4 w-16">Hit rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const hits = row.values.map((v, i) => hitTarget(v, row.target, row.lowerIsBetter, todayFlags[i]));
                // Exclude today from the hit-rate calc — it's still in progress
                const completed = hits.filter((h, i) => h !== null && !todayFlags[i]);
                const passed = completed.filter(Boolean).length;
                const pct = completed.length > 0 ? Math.round((passed / completed.length) * 100) : null;
                const pctColor =
                  pct == null
                    ? 'text-muted-foreground'
                    : pct >= 80
                    ? 'text-emerald-500'
                    : pct >= 50
                    ? 'text-amber-400'
                    : 'text-destructive';

                return (
                  <tr key={row.label}>
                    <td className="py-2 pr-4">
                      <div className="font-medium leading-tight">{row.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        ≥{row.target.toLocaleString()} {row.unit}
                      </div>
                    </td>
                    {hits.map((hit, i) => (
                      <td key={i} className="py-2 px-1 text-center">
                        <div className="flex justify-center">
                          <DayDot hit={hit} isToday={todayFlags[i]} />
                        </div>
                      </td>
                    ))}
                    <td className={`py-2 pl-4 text-right font-semibold tabular-nums ${pctColor}`}>
                      {pct != null ? `${pct}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
