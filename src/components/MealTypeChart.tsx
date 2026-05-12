'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { FoodEntry } from '@/lib/types';
import { formatShortDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ── Meal type config ── */

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink', 'Other'] as const;
type MealType = typeof MEAL_TYPES[number];

const MEAL_COLORS: Record<MealType, string> = {
  Breakfast: '#fbbf24', // amber-400
  Lunch:     '#34d399', // emerald-400
  Dinner:    '#a78bfa', // violet-400
  Snack:     '#22d3ee', // cyan-400
  Drink:     '#60a5fa', // blue-400
  Other:     '#71717a', // zinc-500
};

function normalizeMealType(raw: string): MealType {
  const s = raw.trim().toLowerCase();
  if (s === 'breakfast') return 'Breakfast';
  if (s === 'lunch') return 'Lunch';
  if (s === 'dinner' || s === 'supper') return 'Dinner';
  if (s === 'snack' || s === 'snacks') return 'Snack';
  if (s === 'drink' || s === 'drinks' || s === 'beverage' || s === 'beverages') return 'Drink';
  return 'Other';
}

type MetricKey = 'calories' | 'protein';
type RangeValue = '7' | '14' | '30' | '90';

type DayData = { date: string } & Partial<Record<MealType, number>>;

function prepareData(entries: FoodEntry[], days: number, metric: MetricKey): DayData[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Group by date
  const byDate = new Map<string, Partial<Record<MealType, number>>>();

  for (const e of entries) {
    if (!e.entry_date) continue;
    const d = new Date(e.entry_date + 'T00:00:00');
    if (d < cutoff) continue;

    const type = normalizeMealType(e.meal_type || '');
    const value =
      metric === 'calories'
        ? e.estimated_calories ?? 0
        : e.protein_g ?? 0;

    if (!byDate.has(e.entry_date)) byDate.set(e.entry_date, {});
    const day = byDate.get(e.entry_date)!;
    day[type] = (day[type] ?? 0) + value;
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date: formatShortDate(date), ...vals }));
}

interface Props {
  entries: FoodEntry[];
  height?: number;
}

export function MealTypeChart({ entries, height = 260 }: Props) {
  const [range, setRange] = useState<RangeValue>('30');
  const [metric, setMetric] = useState<MetricKey>('calories');

  const data = useMemo(() => prepareData(entries, parseInt(range), metric), [entries, range, metric]);

  const unit = metric === 'calories' ? 'kcal' : 'g';
  const activeMealTypes = MEAL_TYPES.filter((t) =>
    data.some((d) => (d[t] ?? 0) > 0)
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardDescription>By meal type</CardDescription>
          <CardTitle>Intake breakdown</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
            <SelectTrigger className="h-7 text-xs w-[90px] bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calories">Calories</SelectItem>
              <SelectItem value="protein">Protein</SelectItem>
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v as RangeValue)}>
            <SelectTrigger className="h-7 text-xs w-[90px] bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length === 0 ? (
          <div
            className="flex items-center justify-center rounded-lg border border-dashed"
            style={{ height }}
          >
            <p className="text-sm text-muted-foreground">No entry data for selected range.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barSize={8}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                width={40}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => [`${Math.round(Number(value ?? 0))} ${unit}`, String(name)]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="square"
                iconSize={8}
              />
              {activeMealTypes.map((type) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="a"
                  fill={MEAL_COLORS[type]}
                  radius={type === activeMealTypes[activeMealTypes.length - 1] ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
