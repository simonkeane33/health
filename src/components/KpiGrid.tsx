'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { VaultData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { computeWeeklyMetrics } from '@/lib/weeklyMetrics';
import { getTargetState, formatVariance } from '@/lib/targets';
import { useTargets } from '@/lib/targets-context';

function WeeklyDelta({
  currentAvg,
  priorAvg,
  unit,
  lowerIsBetter = false,
}: {
  currentAvg: number | undefined;
  priorAvg: number | undefined;
  unit?: string;
  lowerIsBetter?: boolean;
}) {
  if (currentAvg === undefined || priorAvg === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const diff = currentAvg - priorAvg;
  if (diff === 0) return <span className="text-xs text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" /> No change</span>;
  const pct = ((Math.abs(diff) / priorAvg) * 100).toFixed(1);
  const isDown = diff < 0;
  const beneficial = lowerIsBetter ? isDown : !isDown;
  const Icon = isDown ? TrendingDown : TrendingUp;
  const colorClass = beneficial ? 'text-emerald-600' : 'text-destructive';
  return (
    <span className={`flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit ? ` ${unit}` : ''} ({pct}%)
    </span>
  );
}

function TargetBar({ actual, target }: { actual: number; target: number }) {
  const pct = Math.min(100, Math.round((actual / target) * 100));
  const state = getTargetState(actual, target);
  const barColor =
    state === 'over' ? 'bg-destructive' : state === 'on_track' ? 'bg-emerald-500' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

function getBmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function KpiGrid({ data }: { data?: VaultData | null }) {
  const { targets } = useTargets();

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
  const weightCurrent = latestWeight?.weight_kg ?? 0;
  const weightRemaining = Math.max(0, weightCurrent - targets.weight_kg);
  const bmiCurrent = latestSummary?.bmi;

  const caloriesToday = latestSummary?.total_calories ?? 0;
  const proteinToday = latestSummary?.protein_g ?? 0;
  const fluidToday = latestSummary?.fluids_ml ?? 0;

  const weekly = computeWeeklyMetrics(data.dailySummaries);

  const todaySummaryDate = latestSummary?.entry_date ?? '';
  const isToday = todaySummaryDate === new Date().toISOString().split('T')[0];
  const todayLabel = isToday ? 'today' : todaySummaryDate;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Weight */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">
            {weightCurrent > 0 ? `${weightCurrent.toFixed(1)} kg` : '—'}
          </div>
          {prevWeight?.weight_kg && weightCurrent > 0 && (
            <WeeklyDelta
              currentAvg={weightCurrent}
              priorAvg={prevWeight.weight_kg}
              unit="kg"
              lowerIsBetter
            />
          )}
          {weightCurrent > 0 && (
            <TargetBar actual={targets.weight_kg} target={weightCurrent} />
          )}
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">
              Target: {targets.weight_kg} kg
              {weightRemaining > 0 ? ` · ${weightRemaining.toFixed(1)} kg to go` : ' · ✓ At target'}
            </p>
            {(bmiCurrent ?? 0) > 0 && (
              <p className="text-[11px] text-muted-foreground">
                BMI {(bmiCurrent as number).toFixed(1)} · {getBmiLabel(bmiCurrent as number)} · {days} days tracked
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Calories {todayLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">
            {caloriesToday > 0 ? `${caloriesToday} kcal` : '—'}
          </div>
          {caloriesToday > 0 && (
            <>
              <p className="text-xs text-muted-foreground">{formatVariance(caloriesToday, targets.calories_kcal, 'kcal')}</p>
              <TargetBar actual={caloriesToday} target={targets.calories_kcal} />
            </>
          )}
          <p className="text-[11px] text-muted-foreground">
            Target: {targets.calories_kcal.toLocaleString()} kcal
            {latestSummary && ` · ${latestSummary.food_entries ?? 0} entries`}
          </p>
          {weekly.calories.currentAvg !== undefined && (
            <WeeklyDelta
              currentAvg={weekly.calories.currentAvg}
              priorAvg={weekly.calories.priorAvg}
              unit="kcal avg"
              lowerIsBetter={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Protein */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Protein {todayLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">
            {proteinToday > 0 ? `${Math.round(proteinToday)} g` : '—'}
          </div>
          {proteinToday > 0 && (
            <>
              <p className="text-xs text-muted-foreground">{formatVariance(proteinToday, targets.protein_g, 'g')}</p>
              <TargetBar actual={proteinToday} target={targets.protein_g} />
            </>
          )}
          <p className="text-[11px] text-muted-foreground">
            Target: {targets.protein_g} g
          </p>
          {(prevSummary?.protein_g ?? 0) > 0 && proteinToday > 0 && (
            <WeeklyDelta
              currentAvg={proteinToday}
              priorAvg={prevSummary!.protein_g}
              unit="g"
            />
          )}
        </CardContent>
      </Card>

      {/* Fluids */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Fluids {todayLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">
            {fluidToday > 0 ? `${fluidToday} ml` : '—'}
          </div>
          {fluidToday > 0 && (
            <>
              <p className="text-xs text-muted-foreground">{formatVariance(fluidToday, targets.fluids_ml, 'ml')}</p>
              <TargetBar actual={fluidToday} target={targets.fluids_ml} />
            </>
          )}
          <p className="text-[11px] text-muted-foreground">
            Target: {targets.fluids_ml.toLocaleString()} ml
          </p>
          {(prevSummary?.fluids_ml ?? 0) > 0 && fluidToday > 0 && (
            <WeeklyDelta
              currentAvg={fluidToday}
              priorAvg={prevSummary!.fluids_ml}
              unit="ml"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
