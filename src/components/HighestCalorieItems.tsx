'use client';

import type { FoodEntry } from '@/lib/types';
import { Flame } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Props {
  entries: FoodEntry[];
  limit?: number;
}

export function HighestCalorieItems({ entries, limit = 10 }: Props) {
  const sorted = [...entries]
    .sort((a, b) => b.estimated_calories - a.estimated_calories)
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Rankings</div>
          <CardTitle className="text-lg mb-4">Highest-calorie entries</CardTitle>
          <div className="flex items-center gap-3 py-3">
            <div className="w-14 h-14 rounded-[18px] grid place-items-center bg-accent text-primary shadow-[inset_0_0_0_1px_var(--border)]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-foreground block mb-0.5">No entries yet.</strong>
              <span className="text-sm text-muted-foreground">Log some meals to see the highest-calorie ones.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Rankings</div>
        <CardTitle className="text-lg">Highest-calorie entries</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {sorted.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate capitalize">{entry.items.join(', ')}</p>
                <p className="text-xs text-muted-foreground">{entry.meal_type} · {formatDateTime(entry.entry_date)}</p>
              </div>
              <strong className="text-sm tabular-nums text-foreground shrink-0">
                {entry.estimated_calories} kcal
              </strong>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
