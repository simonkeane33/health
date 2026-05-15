'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailySummary } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { computeMacroPercentages } from '@/lib/aggregator';
import { Apple } from 'lucide-react';
import { useHasMounted } from '@/hooks/useHasMounted';

const COLORS = ['#34d399', '#fbbf24', '#a78bfa']; // protein, carbs, fat

function macroLabel(name: string) {
  switch (name) {
    case 'protein':
      return 'Protein';
    case 'carbs':
      return 'Carbs';
    case 'fat':
      return 'Fat';
    default:
      return name;
  }
}

export function DailyMacroCard({ summary }: { summary?: DailySummary }) {
  const mounted = useHasMounted();
  const data = useMemo(() => {
    if (!summary) return [];
    const pct = computeMacroPercentages(summary);
    return [
      { name: 'protein', grams: summary.protein_g ?? 0, pct: pct.protein_pct },
      { name: 'carbs', grams: summary.carbs_g ?? 0, pct: pct.carbs_pct },
      { name: 'fat', grams: summary.fat_g ?? 0, pct: pct.fat_pct },
    ];
  }, [summary]);

  const hasData = data.length > 0 && data.some((d) => d.grams > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Macro Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Apple className="h-8 w-8 opacity-30" />
            <p className="text-sm">No macro data for today.</p>
            <p className="text-[11px]">Macros appear once protein, carbs, or fat are logged.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Macro Composition</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0" style={{ width: 180, height: 180 }}>
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(_value: unknown, _name: unknown, props: unknown) => {
                      const p = props as { payload?: { grams?: number; pct?: number; name?: string } };
                      const grams = p?.payload?.grams ?? 0;
                      const pct = p?.payload?.pct ?? 0;
                      return [`${grams}g (${pct}%)`, macroLabel(p?.payload?.name ?? '')];
                    }}
                  />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="pct"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {data.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full rounded-full animate-pulse bg-muted/20" />
            )}
          </div>
          <div className="flex flex-col gap-2 text-xs w-full sm:w-auto">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-muted-foreground min-w-[3.5rem]">
                  {macroLabel(d.name)}
                </span>
                <span className="font-medium tabular-nums">
                  {d.grams}g ({d.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
