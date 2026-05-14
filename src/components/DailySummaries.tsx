'use client';

import React, { useState } from 'react';
import type { DailySummary } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';
import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Limit = 7 | 14 | 30 | 0;

const LIMITS: { label: string; value: Limit }[] = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
  { label: 'All', value: 0 },
];

function DetailRow({ day }: { day: DailySummary }) {
  return (
    <tr className="bg-muted/30">
      <td colSpan={10} className="px-4 py-3 border-b border-border">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-muted-foreground">
          {day.protein_g != null && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.protein_g, 0)} g</span> protein</span>
          )}
          {day.carbs_g != null && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.carbs_g, 0)} g</span> carbs</span>
          )}
          {day.fat_g != null && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.fat_g, 0)} g</span> fat</span>
          )}
          {day.fiber_g != null && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.fiber_g, 0)} g</span> fiber</span>
          )}
          {day.sugar_g != null && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.sugar_g, 0)} g</span> sugar</span>
          )}
          {day.fluids_ml != null && day.fluids_ml > 0 && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.fluids_ml, 0)} ml</span> fluids</span>
          )}
          {day.alcohol_units != null && day.alcohol_units > 0 && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.alcohol_units, 1)}</span> alcohol units</span>
          )}
          {day.food_entries != null && (
            <span><span className="text-foreground font-medium tabular-nums">{day.food_entries}</span> food entries</span>
          )}
          {day.bmi != null && (
            <span>BMI <span className="text-foreground font-medium tabular-nums">{formatNumber(day.bmi, 1)}</span></span>
          )}
          {day.body_fat_pct != null && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.body_fat_pct, 1)}%</span> body fat</span>
          )}
          {day.muscle_mass_pct != null && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.muscle_mass_pct, 1)}%</span> muscle</span>
          )}
          {day.body_water_pct != null && (
            <span><span className="text-foreground font-medium tabular-nums">{formatNumber(day.body_water_pct, 1)}%</span> water</span>
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
                  {isExpanded && <DetailRow key={`${day.id}-detail`} day={day} />}
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
