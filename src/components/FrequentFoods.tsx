'use client';

import type { FoodEntry } from '@/lib/types';
import { Salad } from 'lucide-react';

interface Props {
  entries: FoodEntry[];
  limit?: number;
}

export function FrequentFoods({ entries, limit = 8 }: Props) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const item of entry.items) {
      const key = item.toLowerCase().trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <div className="panel">
        <div className="p-5">
          <div className="micro-label mb-1">Patterns</div>
          <h3 className="text-lg font-semibold tracking-tight mb-4">Frequent foods</h3>
          <div className="flex items-center gap-3 py-3">
            <div className="empty-illustration">
              <Salad className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-[#28251d] block mb-0.5">No recurring foods yet.</strong>
              <span className="text-sm text-[#68655f]">Keep tracking to see what shows up most.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="p-5 pb-0">
        <div className="micro-label mb-1">Patterns</div>
        <h3 className="text-lg font-semibold tracking-tight mb-4">Frequent foods</h3>
      </div>
      <div className="p-5 pt-0">
        <ul className="flex flex-col gap-2">
          {sorted.map(([name, count]) => (
            <li
              key={name}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#f3f0ec]"
            >
              <span className="text-sm text-[#28251d]">{name}</span>
              <strong className="text-sm tabular-nums text-[#28251d]">{count}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
