'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailySummary } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

interface Props {
  summaries: DailySummary[];
  range: RangeValue;
  height?: number;
}

const weightConfig = {
  weight: {
    label: 'Weight (kg)',
    color: 'hsl(var(--chart-2))',
  },
};

const caloriesConfig = {
  calories: {
    label: 'Calories',
    color: 'hsl(var(--chart-1))',
  },
};

export function WeightTrendChart({ summaries, range, height = 260 }: Props) {
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

    return filtered
      .filter((s) => s.weight_kg != null)
      .map((s) => ({
        date: new Date(s.entry_date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        }),
        weight: Number(s.weight_kg),
      }));
  }, [summaries, range]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed" style={{ height }}>
        <p className="text-sm text-muted-foreground">No weight data for selected range.</p>
      </div>
    );
  }

  // Auto-scale Y-axis with padding
  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const pad = Math.max((maxW - minW) * 0.2, 1);
  const yDomain = [Math.floor(minW - pad), Math.ceil(maxW + pad)];

  return (
    <ChartContainer config={weightConfig} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
            domain={yDomain}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            width={50}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight (kg)"
            stroke="var(--color-weight)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: 'var(--color-weight)', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function CaloriesTrendChart({ summaries, range, height = 260 }: Props) {
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
    }));
  }, [summaries, range]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed" style={{ height }}>
        <p className="text-sm text-muted-foreground">No calorie data for selected range.</p>
      </div>
    );
  }

  const calories = data.map((d) => d.calories);
  const maxC = Math.max(...calories);
  const yMax = Math.ceil(maxC * 1.15);

  return (
    <ChartContainer config={caloriesConfig} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
            domain={[0, yMax]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            width={50}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="calories"
            name="Calories"
            stroke="var(--color-calories)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--color-calories)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
