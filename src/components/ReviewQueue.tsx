'use client';

import { AlertCircle } from 'lucide-react';
import type { FoodEntry } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';

interface Props {
  entries: FoodEntry[];
}

export function ReviewQueue({ entries }: Props) {
  const reviewItems = entries.filter((e) => e.needs_review);

  if (reviewItems.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Review queue</h3>
        <p className="text-sm text-slate-500">No entries need review. All clear.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Review queue ({reviewItems.length})
        </h3>
      </div>
      <div className="space-y-3">
        {reviewItems.slice(0, 10).map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {entry.items.join(', ')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(entry.entry_date)} · {formatTime(entry.logged_at)} · {entry.meal_type}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {entry.estimated_calories} kcal · confidence {Math.round(entry.confidence * 100)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
