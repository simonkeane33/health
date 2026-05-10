'use client';

import type { FoodEntry } from '@/lib/types';

interface Props {
  entries: FoodEntry[];
}

export function FrequentFoods({ entries }: Props) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const item of entry.items) {
      const key = item.toLowerCase().trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  if (sorted.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Frequent foods</h3>
        <p className="text-sm text-slate-500">No food data yet.</p>
      </div>
    );
  }

  const max = sorted[0][1];

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Frequent foods</h3>
      <div className="space-y-2">
        {sorted.map(([name, count]) => (
          <div key={name} className="flex items-center gap-3">
            <span className="text-sm text-slate-700 w-32 truncate">{name}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
