'use client';

import type { FoodEntry } from '@/lib/types';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { UtensilsCrossed } from 'lucide-react';

interface Props {
  entries: FoodEntry[];
  limit?: number;
  onReviewChange?: (id: string, confirmed: boolean) => void;
}

export function RecentEntries({ entries, limit = 8, onReviewChange }: Props) {
  const sorted = [...entries]
    .sort((a, b) => new Date(b.logged_at || b.entry_date).getTime() - new Date(a.logged_at || a.entry_date).getTime())
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <div className="panel">
        <div className="p-5">
          <div className="micro-label mb-1">Recent entries</div>
          <h3 className="text-lg font-semibold tracking-tight mb-4">Latest meals and drinks</h3>
          <EmptyState title="No entries yet" body="Load your Health folder or use the demo data to preview." />
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="p-5 pb-0">
        <div className="micro-label mb-1">Recent entries</div>
        <h3 className="text-lg font-semibold tracking-tight mb-4">Latest meals and drinks</h3>
      </div>
      <div className="p-5 pt-0 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">When</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Type</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Items</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Energy</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-[#68655f] font-medium py-2.5 px-2 border-b border-[rgba(40,37,29,0.12)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.id}>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d] whitespace-nowrap">
                  {formatDateTime(entry.logged_at || entry.entry_date)}
                </td>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d]">
                  {entry.meal_type || '—'}
                </td>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d]">
                  {entry.items.join(', ')}
                </td>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d]">
                  <strong className="tabular-nums">{formatNumber(entry.estimated_calories || 0, 0)}</strong>{' '}
                  <span className="text-[#68655f]">kcal</span>
                </td>
                <td className="py-3 px-2 border-b border-[rgba(40,37,29,0.08)] text-[#28251d]">
                  {entry.needs_review ? (
                    <span className="pill warn">Needs review</span>
                  ) : (
                    <span className="pill ok">Confirmed</span>
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
        <UtensilsCrossed className="w-5 h-5" />
      </div>
      <div>
        <strong className="text-[#28251d] block mb-0.5">{title}</strong>
        <span className="text-sm">{body}</span>
      </div>
    </div>
  );
}
