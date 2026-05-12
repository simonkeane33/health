'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailySummary } from '@/lib/types';
import { formatShortDate } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui/chart';

/* ── Shared colour palette ── */
const COLORS = {
  calories:   { color: '#22d3ee', label: 'Calories' },  // cyan-400
  sugar_g:    { color: '#f472b6', label: 'Sugar (g)' }, // pink-400
  protein_g:  { color: '#34d399', label: 'Protein (g)' },// emerald-400
  carbs_g:    { color: '#fbbf24', label: 'Carbs (g)' }, // amber-400
  fat_g:      { color: '#a78bfa', label: 'Fat (g)' },   // violet-400
  fiber_g:    { color: '#fb923c', label: 'Fiber (g)' }, // orange-400
  weight:     { color: '#818cf8', label: 'Weight (kg)' },// indigo-400
};

type NutrientKey = 'calories' | 'sugar_g' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g';
type MetricKey   = NutrientKey | 'weight';

function gradientId(key: MetricKey) {
  return `${key}Fill`;
}

/* ── Data preparation ── */
export type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

function filterAndSort(summaries: DailySummary[], range: RangeValue) {
  if (range === 'all') {
    return [...summaries].sort(
      (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    );
  }
  const days = parseInt(range, 10);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return summaries
    .filter((s) => new Date(s.entry_date) >= cutoff)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
}

/* ── Multi-line Intake Chart with nutrient toggle filters ── */

interface IntakeChartProps {
  summaries: DailySummary[];
  range: RangeValue;
  height?: number;
}

const INTAKE_KEYS: NutrientKey[] = ['calories', 'sugar_g', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'];

function defaultActive(summaries: DailySummary[]): Set<NutrientKey> {
  const has = (k: keyof DailySummary) => summaries.some((s) => typeof s[k] === 'number' && (s[k] as number) > 0);
  const out: NutrientKey[] = [];
  if (has('total_calories')) out.push('calories');
  if (has('sugar_g')) out.push('sugar_g');
  if (has('protein_g')) out.push('protein_g');
  if (has('carbs_g')) out.push('carbs_g');
  if (has('fat_g')) out.push('fat_g');
  if (has('fiber_g')) out.push('fiber_g');
  // Fallback: at least show calories if nothing else exists
  if (out.length === 0) out.push('calories');
  return new Set(out);
}

export function IntakeTrendChart({ summaries, range, height = 260 }: IntakeChartProps) {
  const [active, setActive] = useState<Set<NutrientKey>>(() => defaultActive(summaries));

  const data = useMemo(() => {
    return filterAndSort(summaries, range).map((s) => ({
      date: formatShortDate(s.entry_date),
      calories: s.total_calories ?? 0,
      sugar_g: s.sugar_g ?? 0,
      protein_g: s.protein_g ?? 0,
      carbs_g: s.carbs_g ?? 0,
      fat_g: s.fat_g ?? 0,
      fiber_g: s.fiber_g ?? 0,
    }));
  }, [summaries, range]);

  // ── derive visible range for dual axes ──
  const visible = Array.from(active);
  const calorieVisible = visible.includes('calories');
  const gramVisible = visible.some((k) => k !== 'calories');

  const calorieMax = useMemo(() => {
    if (!calorieVisible) return 100;
    const vals = data.map((d) => d.calories);
    return Math.max(1, Math.ceil(Math.max(...vals) * 1.1));
  }, [data, calorieVisible]);

  const gramMax = useMemo(() => {
    if (!gramVisible) return 100;
    const vals: number[] = [];
    for (const k of visible) {
      if (k === 'calories') continue;
      vals.push(...data.map((d) => d[k]));
    }
    return Math.max(1, Math.ceil(Math.max(...vals) * 1.1));
  }, [data, gramVisible, visible]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed" style={{ height }}>
        <p className="text-sm text-muted-foreground">No intake data for selected range.</p>
      </div>
    );
  }

  // Build chart config for tooltip/legend
  const chartConfig = Object.fromEntries(
    INTAKE_KEYS.map((k) => [k, { label: COLORS[k].label, color: COLORS[k].color }])
  );

  const toggle = (key: NutrientKey) => {
    const next = new Set(active);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    setActive(next);
  };

  const showAll = () => setActive(new Set(INTAKE_KEYS));

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {INTAKE_KEYS.map((key) => {
          const isActive = active.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border ${
                isActive
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border hover:text-foreground'
              }`}
              style={
                isActive
                  ? { color: COLORS[key].color, borderColor: `${COLORS[key].color}44`, backgroundColor: `${COLORS[key].color}15` }
                  : undefined
              }
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: COLORS[key].color }}
              />
              {COLORS[key].label}
            </button>
          );
        })}
        <button
          onClick={showAll}
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border bg-muted text-muted-foreground border-border hover:text-foreground"
        >
          Show All
        </button>
      </div>

      <ChartContainer config={chartConfig} style={{ height }} className="w-full aspect-auto">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: gramVisible ? 16 : 4, left: calorieVisible ? 4 : 16, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
            />
            {calorieVisible && (
              <YAxis
                yAxisId="cal"
                domain={[0, calorieMax]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                width={44}
              />
            )}
            {gramVisible && (
              <YAxis
                yAxisId="grams"
                orientation="right"
                domain={[0, gramMax]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                width={40}
              />
            )}
            <Tooltip content={<ChartTooltipContent />} />

            {visible.map((key) => {
              const yId = key === 'calories' ? 'cal' : 'grams';
              const color = COLORS[key].color;
              return (
                <Line
                  key={key}
                  yAxisId={yId}
                  type="monotone"
                  dataKey={key}
                  name={COLORS[key].label}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#000' }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

/* ── Weight Trend Chart (unchanged API) ── */

interface Props {
  summaries: DailySummary[];
  range: RangeValue;
  height?: number;
}

export function WeightTrendChart({ summaries, range, height = 260 }: Props) {
  const data = useMemo(() => {
    return filterAndSort(summaries, range)
      .filter((s) => s.weight_kg != null)
      .map((s) => ({
        date: formatShortDate(s.entry_date),
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

  const weightConfig = {
    weight: { label: 'Weight (kg)', color: COLORS.weight.color },
  };

  return (
    <ChartContainer config={weightConfig} style={{ height }} className="w-full aspect-auto">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight (kg)"
            stroke={COLORS.weight.color}
            strokeWidth={3}
            fill="none"
            dot={false}
            activeDot={{ r: 5, stroke: COLORS.weight.color, strokeWidth: 2, fill: '#000' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

/* ── Back-compat export for any callers still using CaloriesTrendChart ── */
export function CaloriesTrendChart({ summaries, range, height = 260 }: Props) {
  const [active, setActive] = useState<Set<NutrientKey>>(new Set(['calories']));
  return (
    <IntakeTrendChart
      summaries={summaries}
      range={range}
      height={height}
    />
  );
}

/* ── Combined Calories + Weight Trend Chart with dual axes and trend summary ── */

interface CombinedTrendProps {
  summaries: DailySummary[];
  range: RangeValue;
  height?: number;
}

export function CombinedCaloriesWeightChart({ summaries, range, height = 260 }: CombinedTrendProps) {
  const { data, trendText } = useMemo(() => {
    const filtered = filterAndSort(summaries, range);

    // Build aligned data: one row per day that has at least one metric
    const map = new Map<string, { date: string; calories: number | null; weight: number | null }>();
    for (const s of filtered) {
      const d = s.entry_date;
      if (!map.has(d)) {
        map.set(d, { date: formatShortDate(d), calories: null, weight: null });
      }
      const row = map.get(d)!;
      if (typeof s.total_calories === 'number' && s.total_calories > 0) {
        row.calories = s.total_calories;
      }
      if (typeof s.weight_kg === 'number' && s.weight_kg > 0) {
        row.weight = Number(s.weight_kg);
      }
    }
    const chartData = Array.from(map.values());

    // Weight trend summary
    const weights = chartData.map((d) => d.weight).filter((v): v is number => v !== null);
    let trend = '';
    if (weights.length >= 2) {
      const first = weights[0];
      const last = weights[weights.length - 1];
      const delta = last - first;
      const abs = Math.abs(delta).toFixed(1);
      const dir = delta < 0 ? 'down' : 'up';
      const dayCount = chartData.length;
      trend = `Weight ${dir} ${abs} kg over ${dayCount} day${dayCount !== 1 ? 's' : ''}`;
    } else if (weights.length === 1) {
      trend = `Single weight entry (${weights[0]} kg)`;
    } else {
      trend = 'No weight data';
    }

    return { data: chartData, trendText: trend };
  }, [summaries, range]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed" style={{ height }}>
        <p className="text-sm text-muted-foreground">No data for selected range.</p>
      </div>
    );
  }

  const calorieValues = data
    .map((d) => d.calories)
    .filter((v): v is number => v !== null);
  const weightValues = data
    .map((d) => d.weight)
    .filter((v): v is number => v !== null);

  const calorieMax = calorieValues.length ? Math.max(1, Math.ceil(Math.max(...calorieValues) * 1.1)) : 100;
  const calorieMin = calorieValues.length ? Math.max(0, Math.floor(Math.min(...calorieValues) * 0.95)) : 0;

  const weightMax = weightValues.length ? Math.ceil(Math.max(...weightValues) * 1.02) : 100;
  const weightMin = weightValues.length ? Math.floor(Math.min(...weightValues) * 0.98) : 0;

  const combinedConfig = {
    calories: { label: 'Calories (kcal)', color: COLORS.calories.color },
    weight: { label: 'Weight (kg)', color: COLORS.weight.color },
  };

  const hasCalories = calorieValues.length > 0;
  const hasWeight = weightValues.length > 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      {trendText && (
        <p className="text-xs text-muted-foreground leading-relaxed">{trendText}</p>
      )}
      <ChartContainer config={combinedConfig} style={{ height }} className="w-full aspect-auto">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
            />
            {hasCalories && (
              <YAxis
                yAxisId="cal"
                domain={[calorieMin, calorieMax]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                width={50}
              />
            )}
            {hasWeight && (
              <YAxis
                yAxisId="wgt"
                orientation="right"
                domain={[weightMin, weightMax]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                width={46}
              />
            )}
            <Tooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            {hasCalories && (
              <Line
                yAxisId="cal"
                type="monotone"
                dataKey="calories"
                name="Calories"
                stroke={COLORS.calories.color}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 4, stroke: COLORS.calories.color, strokeWidth: 2, fill: '#000' }}
              />
            )}
            {hasWeight && (
              <Line
                yAxisId="wgt"
                type="monotone"
                dataKey="weight"
                name="Weight (kg)"
                stroke={COLORS.weight.color}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 4, stroke: COLORS.weight.color, strokeWidth: 2, fill: '#000' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
