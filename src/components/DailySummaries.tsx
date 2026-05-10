'use client';

import type { DailySummary } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

interface Props {
  entries: DailySummary[];
  limit?: number;
}

export function DailySummaries({ entries, limit = 7 }: Props) {
  if (entries.length === 0) {
    return (
      <div className="panel">
        <div className="p-5 pb-0">
          <div className="micro-label mb-1">Daily summaries</div>
          <h3 className="text-lg font-semibold tracking-tight mb-4">Last tracked days</h3>
        </div>
        <div className="p-5 pt-0">
          <EmptyState
            title="No daily summaries yet"
            body="Daily rollups will appear here once entries are loaded."
          />
        </div>
      </div>
    );
  }

  const days = [...entries]
    .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    .slice(0, limit);

  return (
    <div className="panel">
      <div className="p-5 pb-0">
        <div className="micro-label mb-1">Daily summaries</div>
        <h3 className="text-lg font-semibold tracking-tight mb-4">Last tracked days</h3>
      </div>
      <div className="p-5 pt-0 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--hv-text-muted)] font-medium py-2.5 px-2 border-b border-[var(--hv-border)]">Day</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--hv-text-muted)] font-medium py-2.5 px-2 border-b border-[var(--hv-border)]">Calories</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--hv-text-muted)] font-medium py-2.5 px-2 border-b border-[var(--hv-border)]">Protein</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--hv-text-muted)] font-medium py-2.5 px-2 border-b border-[var(--hv-border)]">Fluids</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[var(--hv-text-muted)] font-medium py-2.5 px-2 border-b border-[var(--hv-border)]">Weight</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.id}>
                <td className="py-3 px-2 border-b border-[var(--hv-border)] text-[var(--hv-text)] whitespace-nowrap">
                  {day.entry_date
                    ? new Date(day.entry_date + 'T00:00:00').toLocaleDateString('en-GB', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="py-3 px-2 border-b border-[var(--hv-border)] text-[var(--hv-text)]">
                  <strong className="tabular-nums">{formatNumber(day.total_calories ?? 0, 0)}</strong>{' '}
                  <span className="text-[var(--hv-text-muted)]">kcal</span>
                </td>
                <td className="py-3 px-2 border-b border-[var(--hv-border)] text-[var(--hv-text)]">
                  {formatNumber(day.protein_g ?? 0, 0)}{' '}
                  <span className="text-[var(--hv-text-muted)]">g</span>
                </td>
                <td className="py-3 px-2 border-b border-[var(--hv-border)] text-[var(--hv-text)]">
                  {formatNumber(day.fluids_ml ?? 0, 0)}{' '}
                  <span className="text-[var(--hv-text-muted)]">ml</span>
                </td>
                <td className="py-3 px-2 border-b border-[var(--hv-border)] text-[var(--hv-text)]">
                  {day.weight_kg != null ? (
                    <>
                      <strong className="tabular-nums">{formatNumber(day.weight_kg, 1)}</strong>{' '}
                      <span className="text-[var(--hv-text-muted)]">kg</span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 py-10 text-[var(--hv-text-muted)]">
      <div className="empty-illustration">
        <CalendarDays className="w-5 h-5" />
      </div>
      <div>
        <strong className="text-[var(--hv-text)] block mb-0.5">{title}</strong>
        <span className="text-sm">{body}</span>
      </div>
    </div>
  );
}
