'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import type { DailySummary } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { prepareWeeklyMacros } from '@/lib/aggregator';

const COLORS = {
  protein: '#34d399',
  carbs: '#fbbf24',
  fat: '#a78bfa',
};

const NUTRIENTS = [
  { key: 'protein', label: 'Protein', color: COLORS.protein },
  { key: 'carbs', label: 'Carbs', color: COLORS.carbs },
  { key: 'fat', label: 'Fat', color: COLORS.fat },
];

type RangeValue = '7' | '14' | '30';
type ViewMode = 'grams' | 'percentage';

function RangeFilter({
  value,
  onChange,
}: {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(v as RangeValue)}>
      <SelectTrigger className="h-7 text-xs w-[100px] bg-background/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">7 days</SelectItem>
        <SelectItem value="14">14 days</SelectItem>
        <SelectItem value="30">30 days</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => onChange('grams')}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium transition-colors border ${
          value === 'grams'
            ? 'bg-primary/15 text-primary border-primary/30'
            : 'bg-muted text-muted-foreground border-border hover:text-foreground'
        }`}
      >
        Grams
      </button>
      <button
        onClick={() => onChange('percentage')}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium transition-colors border ${
          value === 'percentage'
            ? 'bg-primary/15 text-primary border-primary/30'
            : 'bg-muted text-muted-foreground border-border hover:text-foreground'
        }`}
      >
        %
      </button>
    </div>
  );
}

interface Props {
  summaries: DailySummary[];
  height?: number;
}

export function WeeklyMacroChart({ summaries, height = 260 }: Props) {
  const [range, setRange] = useState<RangeValue>('7');
  const [view, setView] = useState<ViewMode>('grams');

  const data = useMemo(() => {
    const points = prepareWeeklyMacros(summaries, Number(range));
    return points.map((p) => ({
      date: p.date,
      protein: view === 'grams' ? p.protein_g : p.protein_pct,
      carbs: view === 'grams' ? p.carbs_g : p.carbs_pct,
      fat: view === 'grams' ? p.fat_g : p.fat_pct,
    }));
  }, [summaries, range, view]);

  const unit = view === 'grams' ? 'g' : '%';
  const maxVal = useMemo(() => {
    if (data.length === 0) return 100;
    let m = 0;
    for (const d of data) {
      const stack = d.protein + d.carbs + d.fat;
      if (stack > m) m = stack;
    }
    return Math.max(1, Math.ceil(m * 1.1));
  }, [data]);

  const chartConfig = Object.fromEntries(
    NUTRIENTS.map((n) => [n.key, { label: `${n.label} (${unit})`, color: n.color }])
  );

  if (data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Macro Breakdown</CardTitle>
          </div>
          <RangeFilter value={range} onChange={setRange} />
        </CardHeader>
        <CardContent className="flex-1">
          <div
            className="flex items-center justify-center rounded-lg border border-dashed"
            style={{ height }}
          >
            <p className="text-sm text-muted-foreground">No macro data for selected range.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Macro Breakdown</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <RangeFilter value={range} onChange={setRange} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={chartConfig} style={{ height }} className="w-full aspect-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
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
                domain={[0, maxVal]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                width={44}
              />
              <Tooltip content={<ChartTooltipContent />} />
              {NUTRIENTS.map((n) => (
                <Bar
                  key={n.key}
                  dataKey={n.key}
                  name={`${n.label} (${unit})`}
                  fill={n.color}
                  stackId="macros"
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
