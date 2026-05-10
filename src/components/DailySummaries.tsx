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
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Day</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Calories</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Protein</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Fluids</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Weight</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.id}>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d] whitespace-nowrap">
                  {day.entry_date
                    ? new Date(day.entry_date + 'T00:00:00').toLocaleDateString('en-GB', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d]">
                  <strong className="tabular-nums">{formatNumber(day.total_calories ?? 0, 0)}</strong>{' '}
                  <span className="text-[#68655f]">kcal</span>
                </td>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d]">
                  {formatNumber(day.protein_g ?? 0, 0)}{' '}
                  <span className="text-[#68655f]">g</span>
                </td>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d]">
                  {formatNumber(day.fluids_ml ?? 0, 0)}{' '}
                  <span className="text-[#68655f]">ml</span>
                </td>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d]">
                  {day.weight_kg != null ? (
                    <>
                      <strong className="tabular-nums">{formatNumber(day.weight_kg, 1)}</strong>{' '}
                      <span className="text-[#68655f]">kg</span>
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
    <div className="flex flex-col gap-3 py-10 text-[#68655f]">
      <div className="empty-illustration">
        <CalendarDays className="w-5 h-5" />
      </div>
      <div>
        <strong className="text-[#28251d] block mb-0.5">{title}</strong>
        <span className="text-sm">{body}</span>
      </div>
    </div>
  );
}
