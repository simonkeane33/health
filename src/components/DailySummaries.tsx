'use client';

import type { DailySummary } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Props {
  entries: DailySummary[];
  limit?: number;
}

export function DailySummaries({ entries, limit = 7 }: Props) {
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

  const days = [...entries]
    .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    .slice(0, limit);

  const hasBodyComp = days.some(
    (d) => d.body_fat_pct != null || d.muscle_mass_pct != null || d.bmi != null
  );

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Daily summaries</div>
        <CardTitle className="text-lg">Last tracked days</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
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
            {days.map((day) => (
              <tr key={day.id}>
                <td className="py-3 px-2 border-b border-border whitespace-nowrap">
                  {day.entry_date
                    ? new Date(day.entry_date + 'T00:00:00').toLocaleDateString('en-GB', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="py-3 px-2 border-b border-border">
                  <strong className="tabular-nums">{formatNumber(day.total_calories ?? 0, 0)}</strong>{' '}
                  <span className="text-muted-foreground">kcal</span>
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
            ))}
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
