'use client';

import type { VaultData } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { Utensils, Scale } from 'lucide-react';

interface Props {
  data: VaultData;
  limit?: number;
}

export function RecentEntries({ data, limit = 15 }: Props) {
  const combined = [
    ...data.foodEntries.map((e) => ({ ...e, kind: 'food' as const })),
    ...data.weightEntries.map((e) => ({ ...e, kind: 'weight' as const })),
  ]
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .slice(0, limit);

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent entries</h3>
      <div className="space-y-3">
        {combined.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              {entry.kind === 'food' ? (
                <Utensils className="w-4 h-4 text-slate-500" />
              ) : (
                <Scale className="w-4 h-4 text-teal-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 truncate">
                {entry.kind === 'food'
                  ? (entry as any).items.join(', ')
                  : `${(entry as any).weight_kg} kg`}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(entry.entry_date)} · {formatTime(entry.logged_at)}
              </p>
            </div>
            <div className="text-xs font-medium text-slate-600 shrink-0">
              {entry.kind === 'food'
                ? `${(entry as any).estimated_calories} kcal`
                : (entry as any).weight_kg.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
