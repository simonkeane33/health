'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailySummary } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui/chart';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

interface Props {
  summaries: DailySummary[];
  range: RangeValue;
}

const chartConfig = {
  calories: {
    label: 'Calories',
    color: 'hsl(var(--chart-1))',
  },
  weight: {
    label: 'Weight (kg)',
    color: 'hsl(var(--chart-2))',
  },
};

export function CaloriesWeightChart({ summaries, range }: Props) {
  const data = useMemo(() => {
    const filtered =
      range === 'all'
        ? [...summaries].sort(
            (a, b) =>
              new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
          )
        : (() => {
            const days = parseInt(range, 10);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            return summaries
              .filter((s) => new Date(s.entry_date) >= cutoff)
              .sort(
                (a, b) =>
                  new Date(a.entry_date).getTime() -
                  new Date(b.entry_date).getTime()
              );
          })();

    return filtered.map((s) => ({
      date: new Date(s.entry_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      }),
      calories: s.total_calories ?? 0,
      weight: s.weight_kg == null ? undefined : Number(s.weight_kg),
    }));
  }, [summaries, range]);

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No data available for the selected range.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            yAxisId="calories"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            label={{ value: 'kcal', position: 'insideLeft', offset: 0, angle: -90, fontSize: 10 }}
          />
          <YAxis
            yAxisId="weight"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            label={{ value: 'kg', position: 'insideRight', offset: 0, angle: -90, fontSize: 10 }}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Bar
            yAxisId="calories"
            dataKey="calories"
            name="Calories"
            fill="var(--color-calories)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            name="Weight (kg)"
            stroke="var(--color-weight)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-weight)' }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
