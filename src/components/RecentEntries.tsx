'use client';

import type { FoodEntry } from '@/lib/types';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { UtensilsCrossed } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  entries: FoodEntry[];
  limit?: number;
  onReviewChange?: (id: string, confirmed: boolean) => void;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 py-10 text-muted-foreground">
      <div className="w-14 h-14 rounded-[18px] grid place-items-center bg-accent text-primary shadow-[inset_0_0_0_1px_var(--border)]">
        <UtensilsCrossed className="w-5 h-5" />
      </div>
      <div>
        <strong className="text-foreground block mb-0.5">{title}</strong>
        <span className="text-sm">{body}</span>
      </div>
    </div>
  );
}

export function RecentEntries({ entries, onReviewChange }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const todays = [...entries]
    .filter((e) => e.entry_date === today)
    .sort((a, b) => new Date(b.logged_at || b.entry_date).getTime() - new Date(a.logged_at || a.entry_date).getTime());

  if (todays.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Today's entries</div>
          <CardTitle className="text-lg mb-4">Meals and drinks today</CardTitle>
          <EmptyState title="No entries today" body="Log a meal or drink to see it here." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Today's entries</div>
        <CardTitle className="text-lg">Meals and drinks today</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">When</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Type</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Items</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Energy</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-2.5 px-2 border-b border-border">Status</th>
            </tr>
          </thead>
          <tbody>
            {todays.map((entry) => (
              <tr key={entry.id}>
                <td className="py-3 px-2 border-b border-border whitespace-nowrap">
                  {formatDateTime(entry.logged_at || entry.entry_date)}
                </td>
                <td className="py-3 px-2 border-b border-border">
                  {entry.meal_type || '—'}
                </td>
                <td className="py-3 px-2 border-b border-border">
                  {entry.items.join(', ')}
                </td>
                <td className="py-3 px-2 border-b border-border">
                  <strong className="tabular-nums">{formatNumber(entry.estimated_calories || 0, 0)}</strong>{' '}
                  <span className="text-muted-foreground">kcal</span>
                </td>
                <td className="py-3 px-2 border-b border-border">
                  {entry.needs_review ? (
                    <Badge variant="destructive">Needs review</Badge>
                  ) : (
                    <Badge variant="secondary">Confirmed</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
