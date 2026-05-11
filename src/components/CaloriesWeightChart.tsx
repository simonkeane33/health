'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
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

/* ── Palette shared with BodyCompositionCard ── */
const CALORIES_COLOR = '#22d3ee';       /* Tailwind cyan-400  */
const CALORIES_FILL_STOP = 'rgba(34,211,238,0.35)';
const WEIGHT_COLOR = '#818cf8';         /* Tailwind indigo-400 */
const WEIGHT_FILL_STOP = 'rgba(129,140,248,0.35)';

const weightConfig = {
  weight: {
    label: 'Weight (kg)',
    color: WEIGHT_COLOR,
  },
};

const caloriesConfig = {
  calories: {
    label: 'Calories',
    color: CALORIES_COLOR,
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
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={WEIGHT_FILL_STOP} />
              <stop offset="100%" stopColor={WEIGHT_FILL_STOP} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
          />
          <YAxis
            domain={yDomain}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
            width={50}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="weight"
            name="Weight (kg)"
            stroke={WEIGHT_COLOR}
            strokeWidth={3}
            fill="url(#weightFill)"
            dot={false}
            activeDot={{ r: 5, stroke: WEIGHT_COLOR, strokeWidth: 2, fill: '#000' }}
          />
        </AreaChart>
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
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="caloriesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CALORIES_FILL_STOP} />
              <stop offset="100%" stopColor={CALORIES_FILL_STOP} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
          />
          <YAxis
            domain={[0, yMax]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
            width={50}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="calories"
            name="Calories"
            stroke={CALORIES_COLOR}
            strokeWidth={3}
            fill="url(#caloriesFill)"
            dot={false}
            activeDot={{ r: 5, stroke: CALORIES_COLOR, strokeWidth: 2, fill: '#000' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
