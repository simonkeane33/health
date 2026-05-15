'use client';

import { TrendingDown, TrendingUp, Minus, Flame } from 'lucide-react';
import type { VaultData } from '@/lib/types';
import type { FoodEntry, WeightEntry } from '@/lib/schemas';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { computeWeeklyMetrics } from '@/lib/weeklyMetrics';
import { getTargetState, formatVariance } from '@/lib/targets';
import { useTargets } from '@/lib/targets-context';
import { projectEndOfDay, computeWeightTrajectory, computeStreak } from '@/lib/projections';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MEAL_ORDER = ['breakfast', 'snack', 'lunch', 'dinner', 'drink', 'other'];
const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  snack: 'Snack',
  lunch: 'Lunch',
  dinner: 'Dinner',
  drink: 'Drinks',
  other: 'Other',
};

/* ------------------------------------------------------------------ */
/* Sheet inner layout helpers                                          */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4 first:mt-0">
      {children}
    </p>
  );
}

function DataRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'positive' | 'negative' | 'neutral';
}) {
  const valueColor =
    highlight === 'positive'
      ? 'text-emerald-500'
      : highlight === 'negative'
      ? 'text-destructive'
      : 'text-foreground';

  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-medium tabular-nums ${valueColor}`}>{value}</span>
        {sub && <span className="text-xs text-muted-foreground ml-1.5">{sub}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Meal breakdown sheet content                                        */
/* ------------------------------------------------------------------ */

function MealBreakdownSheet({
  entries,
  field,
  unit,
  target,
  targetMode,
}: {
  entries: FoodEntry[];
  field: keyof FoodEntry;
  unit: string;
  target: number;
  targetMode: 'lower-ok' | 'higher-ok';
}) {
  const grouped = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    const key = MEAL_LABEL[e.meal_type] ? e.meal_type : 'other';
    const list = grouped.get(key) ?? [];
    list.push(e);
    grouped.set(key, list);
  }

  const orderedKeys = MEAL_ORDER.filter((k) => grouped.has(k));
  const total = entries.reduce((sum, e) => sum + (Number(e[field]) || 0), 0);
  const remaining = targetMode === 'higher-ok' ? target - total : target - total;
  const pct = Math.min(100, Math.round((total / target) * 100));

  const barColor =
    targetMode === 'higher-ok'
      ? pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-400' : 'bg-destructive'
      : total > target ? 'bg-destructive' : total > target * 0.85 ? 'bg-amber-400' : 'bg-emerald-500';

  if (total === 0) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Nothing logged yet today.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 px-4 pb-8 overflow-y-auto">
      {/* Summary bar */}
      <div className="py-4 border-b border-border">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-bold tabular-nums">
            {unit === 'kcal'
              ? Math.round(total).toLocaleString()
              : Math.round(total)}
            <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            of {unit === 'kcal' ? target.toLocaleString() : target} {unit} target
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-muted-foreground">{pct}% of target</span>
          <span className="text-xs text-muted-foreground">
            {remaining >= 0
              ? `${unit === 'kcal' ? Math.round(remaining).toLocaleString() : Math.round(remaining)} ${unit} remaining`
              : `${unit === 'kcal' ? Math.round(-remaining).toLocaleString() : Math.round(-remaining)} ${unit} over`}
          </span>
        </div>
      </div>

      {/* Per-meal breakdown */}
      {orderedKeys.map((key) => {
        const group = grouped.get(key)!;
        const groupTotal = group.reduce((sum, e) => sum + (Number(e[field]) || 0), 0);
        if (groupTotal === 0) return null;
        const groupPct = total > 0 ? Math.round((groupTotal / total) * 100) : 0;

        return (
          <div key={key} className="mt-5">
            <div className="flex items-baseline justify-between mb-2">
              <SectionTitle>{MEAL_LABEL[key]}</SectionTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {unit === 'kcal' ? Math.round(groupTotal).toLocaleString() : Math.round(groupTotal)} {unit}
                <span className="ml-1 opacity-60">({groupPct}%)</span>
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border/40">
              {group.map((e, i) => {
                const val = Number(e[field]) || 0;
                if (val === 0) return null;
                const label =
                  Array.isArray(e.items) && e.items.length > 0
                    ? e.items[0].replace(/\s*—.*$/, '').trim()
                    : e.meal_type;
                const itemPct = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-foreground flex-1 min-w-0 truncate">{label}</span>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-medium tabular-nums">
                        {unit === 'kcal' ? Math.round(val).toLocaleString() : Math.round(val)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">{unit}</span>
                      <span className="text-xs text-muted-foreground ml-1 opacity-60">({itemPct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Weight sheet content                                                */
/* ------------------------------------------------------------------ */

function WeightSheet({
  entries,
  target,
  trajectory,
}: {
  entries: WeightEntry[];
  target: number;
  trajectory: ReturnType<typeof computeWeightTrajectory>;
}) {
  const recent = entries.slice(0, 7);
  const latest = recent[0];

  if (!latest) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        No weight entries logged yet.
      </div>
    );
  }

  const toGo = Math.max(0, (latest.weight_kg ?? 0) - target);
  const trendPerWeek = trajectory?.slopeKgPerDay != null ? trajectory.slopeKgPerDay * 7 : null;
  const trendHighlight: 'positive' | 'negative' | 'neutral' =
    trendPerWeek == null ? 'neutral' : trendPerWeek < 0 ? 'positive' : 'negative';

  return (
    <div className="flex flex-col px-4 pb-8 overflow-y-auto">
      {/* Current summary */}
      <div className="py-4 border-b border-border">
        <div className="text-3xl font-bold tabular-nums mb-1">
          {latest.weight_kg?.toFixed(1)}
          <span className="text-base font-normal text-muted-foreground ml-1">kg</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {toGo > 0 ? `${toGo.toFixed(1)} kg to reach ${target} kg target` : `At or below ${target} kg target ✓`}
        </p>
      </div>

      {/* Body composition */}
      <div className="mt-5">
        <SectionTitle>Body composition</SectionTitle>
        {latest.bmi != null && (
          <DataRow
            label="BMI"
            value={latest.bmi.toFixed(1)}
            sub={latest.bmi < 25 ? 'healthy weight' : latest.bmi < 30 ? 'overweight' : 'obese'}
          />
        )}
        {latest.body_fat_pct != null && (
          <DataRow label="Body fat" value={`${latest.body_fat_pct.toFixed(1)}%`} />
        )}
        {latest.muscle_mass_pct != null && (
          <DataRow label="Muscle mass" value={`${latest.muscle_mass_pct.toFixed(1)}%`} />
        )}
        {latest.bone_mass_pct != null && (
          <DataRow label="Bone mass" value={`${latest.bone_mass_pct.toFixed(1)}%`} />
        )}
        {latest.body_water_pct != null && (
          <DataRow label="Body water" value={`${latest.body_water_pct.toFixed(1)}%`} />
        )}
      </div>

      {/* Trend */}
      {trendPerWeek != null && (
        <div className="mt-5">
          <SectionTitle>Trend</SectionTitle>
          <DataRow
            label="Weekly rate"
            value={`${trendPerWeek > 0 ? '+' : ''}${trendPerWeek.toFixed(2)} kg/wk`}
            highlight={trendHighlight}
          />
          {trajectory?.daysToTarget != null && (
            <DataRow
              label="ETA to target"
              value={`${trajectory.daysToTarget} day${trajectory.daysToTarget === 1 ? '' : 's'}`}
              highlight="positive"
            />
          )}
        </div>
      )}

      {/* History */}
      <div className="mt-5">
        <SectionTitle>Recent entries</SectionTitle>
        {recent.map((e, i) => (
          <DataRow
            key={i}
            label={e.entry_date}
            value={`${e.weight_kg?.toFixed(1)} kg`}
            sub={i === 0 ? 'latest' : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared sub-components                                               */
/* ------------------------------------------------------------------ */

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

function TargetBar({
  actual,
  target,
  mode = 'lower-ok',
}: {
  actual: number;
  target: number;
  mode?: 'lower-ok' | 'higher-ok';
}) {
  const pct = Math.min(100, Math.round((actual / target) * 100));
  let barColor: string;
  if (mode === 'higher-ok') {
    barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-400' : 'bg-destructive';
  } else {
    const state = getTargetState(actual, target);
    barColor = state === 'over' ? 'bg-destructive' : state === 'on_track' ? 'bg-emerald-500' : 'bg-amber-400';
  }
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

/* ------------------------------------------------------------------ */
/* Clickable card → Sheet wrapper                                      */
/* ------------------------------------------------------------------ */

function KpiCard({
  children,
  sheetTitle,
  sheetDescription,
  sheetContent,
}: {
  children: React.ReactNode;
  sheetTitle?: string;
  sheetDescription?: string;
  sheetContent?: React.ReactNode;
}) {
  if (!sheetContent) {
    return <Card>{children}</Card>;
  }
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Card className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/20">
          {children}
        </Card>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="px-4 pt-5 pb-4 border-b border-border">
          {sheetTitle && <SheetTitle>{sheetTitle}</SheetTitle>}
          {sheetDescription && <SheetDescription>{sheetDescription}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {sheetContent}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Main grid                                                           */
/* ------------------------------------------------------------------ */

export function KpiGrid({ data, selectedDate }: { data?: VaultData | null; selectedDate?: string }) {
  const { targets } = useTargets();

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {['Weight', 'Calories today', 'Protein today', 'Carbs today', 'Fluids today'].map((label) => (
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

  const todayDate = selectedDate ?? new Date().toISOString().split('T')[0];
  // Weight: find entry for selected date, or closest before it
  const latestWeight = data.weightEntries.find((e) => e.entry_date <= todayDate) ?? data.weightEntries[0];
  const prevWeight = data.weightEntries.find((e) => e.entry_date < (latestWeight?.entry_date ?? todayDate));
  const todaySummary = data.dailySummaries.find((s) => s.entry_date === todayDate);
  const prevSummary = data.dailySummaries.find((s) => s.entry_date < todayDate) ?? data.dailySummaries[1];
  const latestSummary = todaySummary ?? data.dailySummaries[0];

  const days = data.weightEntries.length;
  const weightCurrent = latestWeight?.weight_kg ?? 0;
  const weightRemaining = Math.max(0, weightCurrent - targets.weight_kg);
  const bmiCurrent = latestSummary?.bmi;

  const caloriesToday = todaySummary?.total_calories ?? 0;
  const proteinToday = todaySummary?.protein_g ?? 0;
  const carbsToday = todaySummary?.carbs_g ?? 0;
  const fluidToday = todaySummary?.fluids_ml ?? 0;
  const todayFoodEntries = (data.foodEntries ?? []).filter((e) => e.entry_date === todayDate);

  const weekly = computeWeeklyMetrics(data.dailySummaries);
  const projectedCalories = projectEndOfDay(caloriesToday);
  const projectedProtein = projectEndOfDay(proteinToday);
  const projectedFluids = projectEndOfDay(fluidToday);
  const trajectory = computeWeightTrajectory(data.weightEntries, targets.weight_kg);
  const calorieStreak = computeStreak(data.dailySummaries, 'calories', targets);
  const proteinStreak = computeStreak(data.dailySummaries, 'protein', targets);
  const fluidStreak = computeStreak(data.dailySummaries, 'fluids', targets);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

      {/* Weight */}
      <KpiCard
        sheetTitle="Weight"
        sheetDescription={`${weightCurrent.toFixed(1)} kg · ${weightRemaining > 0 ? `${weightRemaining.toFixed(1)} kg to target` : 'At target'}`}
        sheetContent={
          <WeightSheet entries={data.weightEntries} target={targets.weight_kg} trajectory={trajectory} />
        }
      >
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">
            {weightCurrent > 0 ? `${weightCurrent.toFixed(1)} kg` : '—'}
          </div>
          {prevWeight?.weight_kg && weightCurrent > 0 && (
            <WeeklyDelta currentAvg={weightCurrent} priorAvg={prevWeight.weight_kg} unit="kg" lowerIsBetter />
          )}
          {weightCurrent > 0 && (
            <TargetBar actual={targets.weight_kg} target={weightCurrent} />
          )}
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">
              Target: {targets.weight_kg} kg
              {weightRemaining > 0 ? ` · ${weightRemaining.toFixed(1)} kg to go` : ' · ✓ At target'}
            </p>
            {trajectory && trajectory.daysToTarget != null && (
              <p className="text-[11px] text-emerald-500/90 font-medium">
                ETA: {trajectory.daysToTarget} day{trajectory.daysToTarget === 1 ? '' : 's'}
                <span className="text-muted-foreground font-normal">
                  {' · '}{(trajectory.slopeKgPerDay * 7).toFixed(2)} kg/wk
                </span>
              </p>
            )}
            {(bmiCurrent ?? 0) > 0 && (
              <p className="text-[11px] text-muted-foreground">
                BMI {(bmiCurrent as number).toFixed(1)} · {getBmiLabel(bmiCurrent as number)} · {days} days tracked
              </p>
            )}
          </div>
        </CardContent>
      </KpiCard>

      {/* Calories */}
      <KpiCard
        sheetTitle="Calories today"
        sheetDescription={caloriesToday > 0 ? formatVariance(caloriesToday, targets.calories_kcal, 'kcal') : 'No food logged yet'}
        sheetContent={
          <MealBreakdownSheet
            entries={todayFoodEntries}
            field="estimated_calories"
            unit="kcal"
            target={targets.calories_kcal}
            targetMode="lower-ok"
          />
        }
      >
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Calories today
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
            {todaySummary && ` · ${todaySummary.food_entries ?? 0} entries`}
          </p>
          {projectedCalories != null && caloriesToday > 0 && (
            <p className="text-[11px] text-primary/80">Pace: ~{projectedCalories.toLocaleString()} kcal by midnight</p>
          )}
          {calorieStreak >= 2 && (
            <p className="text-[11px] text-emerald-500/90 flex items-center gap-1">
              <Flame className="w-3 h-3" />{calorieStreak}-day streak under target
            </p>
          )}
          {weekly.calories.currentAvg !== undefined && (
            <WeeklyDelta currentAvg={weekly.calories.currentAvg} priorAvg={weekly.calories.priorAvg} unit="kcal avg" lowerIsBetter={false} />
          )}
        </CardContent>
      </KpiCard>

      {/* Protein */}
      <KpiCard
        sheetTitle="Protein today"
        sheetDescription={proteinToday > 0 ? formatVariance(proteinToday, targets.protein_g, 'g') : 'No food logged yet'}
        sheetContent={
          <MealBreakdownSheet
            entries={todayFoodEntries}
            field="protein_g"
            unit="g"
            target={targets.protein_g}
            targetMode="higher-ok"
          />
        }
      >
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Protein today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">
            {proteinToday > 0 ? `${Math.round(proteinToday)} g` : '—'}
          </div>
          {proteinToday > 0 && (
            <>
              <p className="text-xs text-muted-foreground">{formatVariance(proteinToday, targets.protein_g, 'g')}</p>
              <TargetBar actual={proteinToday} target={targets.protein_g} mode="higher-ok" />
            </>
          )}
          <p className="text-[11px] text-muted-foreground">Target: {targets.protein_g} g</p>
          {projectedProtein != null && proteinToday > 0 && (
            <p className="text-[11px] text-primary/80">Pace: ~{projectedProtein} g by midnight</p>
          )}
          {proteinStreak >= 2 && (
            <p className="text-[11px] text-emerald-500/90 flex items-center gap-1">
              <Flame className="w-3 h-3" />{proteinStreak}-day streak hitting target
            </p>
          )}
          {(prevSummary?.protein_g ?? 0) > 0 && proteinToday > 0 && (
            <WeeklyDelta currentAvg={proteinToday} priorAvg={prevSummary!.protein_g} unit="g" />
          )}
        </CardContent>
      </KpiCard>

      {/* Carbs */}
      <KpiCard
        sheetTitle="Carbs today"
        sheetDescription={carbsToday > 0 ? formatVariance(carbsToday, targets.carbs_g, 'g') : 'No food logged yet'}
        sheetContent={
          <MealBreakdownSheet
            entries={todayFoodEntries}
            field="carbs_g"
            unit="g"
            target={targets.carbs_g}
            targetMode="lower-ok"
          />
        }
      >
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Carbs today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">
            {carbsToday > 0 ? `${Math.round(carbsToday)} g` : '—'}
          </div>
          {carbsToday > 0 && (
            <>
              <p className="text-xs text-muted-foreground">{formatVariance(carbsToday, targets.carbs_g, 'g')}</p>
              <TargetBar actual={carbsToday} target={targets.carbs_g} />
            </>
          )}
          {(prevSummary?.carbs_g ?? 0) > 0 && carbsToday > 0 && (
            <WeeklyDelta currentAvg={carbsToday} priorAvg={prevSummary!.carbs_g} unit="g" />
          )}
        </CardContent>
      </KpiCard>

      {/* Fluids */}
      <KpiCard
        sheetTitle="Fluids today"
        sheetDescription={fluidToday > 0 ? formatVariance(fluidToday, targets.fluids_ml, 'ml') : 'No fluids logged yet'}
        sheetContent={
          <MealBreakdownSheet
            entries={todayFoodEntries}
            field="fluids_ml"
            unit="ml"
            target={targets.fluids_ml}
            targetMode="higher-ok"
          />
        }
      >
        <CardHeader>
          <CardTitle className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Fluids today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <div className="text-[clamp(1.75rem,1.1rem_+_1.8vw,2.7rem)] font-bold tabular-nums tracking-tight">
            {fluidToday > 0 ? `${fluidToday} ml` : '—'}
          </div>
          {fluidToday > 0 && (
            <>
              <p className="text-xs text-muted-foreground">{formatVariance(fluidToday, targets.fluids_ml, 'ml')}</p>
              <TargetBar actual={fluidToday} target={targets.fluids_ml} mode="higher-ok" />
            </>
          )}
          <p className="text-[11px] text-muted-foreground">Target: {targets.fluids_ml.toLocaleString()} ml</p>
          {projectedFluids != null && fluidToday > 0 && (
            <p className="text-[11px] text-primary/80">Pace: ~{projectedFluids.toLocaleString()} ml by midnight</p>
          )}
          {fluidStreak >= 2 && (
            <p className="text-[11px] text-emerald-500/90 flex items-center gap-1">
              <Flame className="w-3 h-3" />{fluidStreak}-day streak hitting target
            </p>
          )}
          {(prevSummary?.fluids_ml ?? 0) > 0 && fluidToday > 0 && (
            <WeeklyDelta currentAvg={fluidToday} priorAvg={prevSummary!.fluids_ml} unit="ml" />
          )}
        </CardContent>
      </KpiCard>

    </div>
  );
}
