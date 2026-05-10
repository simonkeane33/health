'use client';

import type { FoodEntry } from '@/lib/types';
import { Salad } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      <Card>
        <CardContent className="p-6">
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Patterns</div>
          <CardTitle className="text-lg mb-4">Frequent foods</CardTitle>
          <div className="flex items-center gap-3 py-3">
            <div className="w-14 h-14 rounded-[18px] grid place-items-center bg-accent text-primary shadow-[inset_0_0_0_1px_var(--border)]">
              <Salad className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-foreground block mb-0.5">No recurring foods yet.</strong>
              <span className="text-sm text-muted-foreground">Keep tracking to see what shows up most.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Patterns</div>
        <CardTitle className="text-lg">Frequent foods</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {sorted.map(([name, count]) => (
            <li
              key={name}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-muted/50"
            >
              <span className="text-sm text-foreground capitalize">{name}</span>
              <strong className="text-sm tabular-nums text-foreground">{count}</strong>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
