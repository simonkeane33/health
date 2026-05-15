'use client';

import React, { useState } from 'react';
import type { DailySummary } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';
import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTargets } from '@/lib/targets-context';
import type { DailyTargets } from '@/lib/targets';

type Limit = 7 | 14 | 30 | 0;

const LIMITS: { label: string; value: Limit }[] = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
  { label: 'All', value: 0 },
];

/** Plain stat — no target */
function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[52px]">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

/** Stat with target — shows coloured value + mini bar + target label */
function TargetStatCell({
  label,
  actual,
  target,
  format,
  lowerIsBetter = false,
}: {
  label: string;
  actual: number;
  target: number;
  format: (v: number) => string;
  lowerIsBetter?: boolean;
}) {
  const ratio = Math.round((actual / target) * 100); // uncapped — used for colour logic
  const barPct = Math.min(100, ratio);               // capped at 100 — used for bar width only

  // Colour logic mirrors KpiGrid's TargetBar
  let valueColor: string;
  let barColor: string;
  if (lowerIsBetter) {
    // under/near target = green, slightly over = amber, significantly over = red
    if (ratio <= 100) { valueColor = 'text-emerald-500'; barColor = 'bg-emerald-500'; }
    else if (ratio <= 115) { valueColor = 'text-amber-400'; barColor = 'bg-amber-400'; }
    else { valueColor = 'text-destructive'; barColor = 'bg-destructive'; }
  } else {
    // at/above target = green, close = amber, well under = red
    if (ratio >= 95) { valueColor = 'text-emerald-500'; barColor = 'bg-emerald-500'; }
    else if (ratio >= 75) { valueColor = 'text-amber-400'; barColor = 'bg-amber-400'; }
    else { valueColor = 'text-destructive'; barColor = 'bg-destructive'; }
  }

  return (
    <div className="flex flex-col gap-1 min-w-[64px]">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueColor}`}>{format(actual)}</span>
      {/* Mini progress bar */}
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">of {format(target)}</span>
    </div>
  );
}

function DetailRow({ day, targets }: { day: DailySummary; targets: DailyTargets }) {
  const hasBodyComp = day.bmi != null || day.body_fat_pct != null || day.muscle_mass_pct != null || day.body_water_pct != null;

  return (
    <tr className="bg-muted/20">
      <td colSpan={10} className="px-4 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Nutrition group */}
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Nutrition</p>
            <div className="flex flex-wrap gap-x-5 gap-y-4">
              {day.total_calories != null && day.total_calories > 0 && (
                <TargetStatCell label="Calories" actual={day.total_calories} target={targets.calories_kcal}
                  format={(v) => `${formatNumber(v, 0)} kcal`} lowerIsBetter />
              )}
              {day.protein_g != null && day.protein_g > 0 && (
                <TargetStatCell label="Protein" actual={day.protein_g} target={targets.protein_g}
                  format={(v) => `${formatNumber(v, 0)} g`} />
              )}
              {day.carbs_g != null && day.carbs_g > 0 && (
                <TargetStatCell label="Carbs" actual={day.carbs_g} target={targets.carbs_g}
                  format={(v) => `${formatNumber(v, 0)} g`} lowerIsBetter />
              )}
              {day.fluids_ml != null && day.fluids_ml > 0 && (
                <TargetStatCell label="Fluids" actual={day.fluids_ml} target={targets.fluids_ml}
                  format={(v) => `${formatNumber(v, 0)} ml`} />
              )}
              {/* No targets for fat / fiber / sugar — plain cells */}
              {day.fat_g != null && day.fat_g > 0 && <StatCell label="Fat" value={`${formatNumber(day.fat_g, 0)} g`} />}
              {day.fiber_g != null && day.fiber_g > 0 && <StatCell label="Fiber" value={`${formatNumber(day.fiber_g, 0)} g`} />}
              {day.sugar_g != null && day.sugar_g > 0 && <StatCell label="Sugar" value={`${formatNumber(day.sugar_g, 0)} g`} />}
              {day.alcohol_units != null && day.alcohol_units > 0 && <StatCell label="Alcohol" value={`${formatNumber(day.alcohol_units, 1)} u`} />}
              {day.food_entries != null && <StatCell label="Entries" value={String(day.food_entries)} />}
            </div>
          </div>

          {/* Body composition group */}
          {hasBodyComp && (
            <div className="flex flex-col gap-2 sm:border-l sm:border-border sm:pl-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Body composition</p>
              <div className="flex flex-wrap gap-x-5 gap-y-4">
                {day.bmi != null && <StatCell label="BMI" value={formatNumber(day.bmi, 1)} />}
                {day.body_fat_pct != null && <StatCell label="Fat" value={`${formatNumber(day.body_fat_pct, 1)}%`} />}
                {day.muscle_mass_pct != null && <StatCell label="Muscle" value={`${formatNumber(day.muscle_mass_pct, 1)}%`} />}
                {day.body_water_pct != null && <StatCell label="Water" value={`${formatNumber(day.body_water_pct, 1)}%`} />}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

interface Props {
  entries: DailySummary[];
}

export function DailySummaries({ entries }: Props) {
  const { targets } = useTargets();
  const [limit, setLimit] = useState<Limit>(7);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-0">
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Daily summaries</div>
          <CardTitle className="text-lg">Last tracked days</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No daily summaries yet"
            body="Daily rollups will appear here once entries are loaded."
          />
        </CardContent>
      </Card>
    );
  }

  const sorted = [...entries].sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
  const days = limit === 0 ? sorted : sorted.slice(0, limit);

  const hasBodyComp = days.some(
    (d) => d.body_fat_pct != null || d.muscle_mass_pct != null || d.bmi != null
  );

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <Card>
      <CardHeader className="pb-0 flex flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Daily summaries</div>
          <CardTitle className="text-lg">Last tracked days</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {LIMITS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setLimit(value)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border ${
                limit === value
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-3 -mx-0.5 px-0.5">
        <table className="w-full min-w-[400px] text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-5 border-b border-border" />
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Day</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Calories</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Weight</th>
              {hasBodyComp && (
                <>
                  <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">BMI</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Fat%</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Water%</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const isExpanded = expandedId === day.id;
              const hasDetail = day.protein_g != null || day.fluids_ml != null || day.food_entries != null;
              return (
                <React.Fragment key={day.id}>
                  <tr
                    key={`${day.id}-main`}
                    onClick={() => hasDetail && toggleRow(day.id)}
                    className={`transition-colors ${hasDetail ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  >
                    <td className="py-3 pl-2 border-b border-border text-muted-foreground">
                      {hasDetail ? (
                        isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                      ) : null}
                    </td>
                    <td className="py-3 px-2 border-b border-border whitespace-nowrap">
                      {day.entry_date === new Date().toISOString().split('T')[0] ? (
                        <span>
                          <span className="font-semibold text-primary">Today</span>
                          <span className="text-muted-foreground"> · {formatDate(day.entry_date)}</span>
                        </span>
                      ) : (
                        formatDate(day.entry_date)
                      )}
                    </td>
                    <td className="py-3 px-2 border-b border-border">
                      {(day.total_calories ?? 0) > 0 ? (
                        <>
                          <strong className="tabular-nums">{formatNumber(day.total_calories ?? 0, 0)}</strong>{' '}
                          <span className="text-muted-foreground">kcal</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-2 border-b border-border">
                      {day.weight_kg != null ? (
                        <>
                          <strong className="tabular-nums">{formatNumber(day.weight_kg, 1)}</strong>{' '}
                          <span className="text-muted-foreground">kg</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    {hasBodyComp && (
                      <>
                        <td className="py-3 px-2 border-b border-border">
                          {day.bmi != null ? <span className="tabular-nums">{formatNumber(day.bmi, 1)}</span> : '—'}
                        </td>
                        <td className="py-3 px-2 border-b border-border">
                          {day.body_fat_pct != null ? <span className="tabular-nums">{formatNumber(day.body_fat_pct, 1)}%</span> : '—'}
                        </td>
                        <td className="py-3 px-2 border-b border-border">
                          {day.body_water_pct != null ? <span className="tabular-nums">{formatNumber(day.body_water_pct, 1)}%</span> : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                  {isExpanded && <DetailRow key={`${day.id}-detail`} day={day} targets={targets} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 py-10 text-muted-foreground">
      <div className="w-14 h-14 rounded-[18px] grid place-items-center bg-accent text-primary shadow-[inset_0_0_0_1px_var(--border)]">
        <CalendarDays className="w-5 h-5" />
      </div>
      <div>
        <strong className="text-foreground block mb-0.5">{title}</strong>
        <span className="text-sm">{body}</span>
      </div>
    </div>
  );
}
