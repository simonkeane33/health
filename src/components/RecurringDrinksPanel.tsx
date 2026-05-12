'use client';

import type { FoodEntry } from '@/lib/types';
import { GlassWater } from 'lucide-react';
import { normalizeMealKey } from '@/lib/normalize';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Props {
  entries: FoodEntry[];
  limit?: number;
}

export function RecurringDrinksPanel({ entries, limit = 8 }: Props) {
  const drinkEntries = entries.filter((e) => (e.fluids_ml ?? 0) > 0 || e.meal_type === 'Drink');

  const groups = new Map<string, { key: string; count: number; items: string[]; fluids: number }>();
  for (const entry of drinkEntries) {
    const key = normalizeMealKey(entry.items, entry.fluids_ml ?? 0);
    if (!groups.has(key)) {
      groups.set(key, { key, count: 0, items: entry.items, fluids: entry.fluids_ml ?? 0 });
    }
    groups.get(key)!.count++;
  }

  const recurring = Array.from(groups.values())
    .filter((g) => g.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  if (recurring.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Repeat drinks</div>
          <CardTitle className="text-lg mb-4">Drinks you log often</CardTitle>
          <div className="flex items-center gap-3 py-3">
            <div className="w-14 h-14 rounded-[18px] grid place-items-center bg-accent text-primary shadow-[inset_0_0_0_1px_var(--border)]">
              <GlassWater className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-foreground block mb-0.5">No repeat drinks yet.</strong>
              <span className="text-sm text-muted-foreground">Drinks that appear more than once will show here.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Repeat drinks</div>
        <CardTitle className="text-lg">Drinks you log often</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {recurring.map((g) => (
            <li
              key={g.key}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-muted/50"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate capitalize">{g.items.join(', ')}</p>
                <p className="text-xs text-muted-foreground">{g.fluids} ml</p>
              </div>
              <strong className="text-sm tabular-nums text-foreground">{g.count}</strong>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
