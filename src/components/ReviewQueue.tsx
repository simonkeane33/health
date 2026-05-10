'use client';

import { useState } from 'react';
import { AlertCircle, Check, Pencil } from 'lucide-react';
import type { FoodEntry } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  entries: FoodEntry[];
  limit?: number;
  onConfirm?: (id: string) => void;
  onEdit?: (id: string) => void;
}

function NoItems() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-14 h-14 rounded-[18px] grid place-items-center bg-accent text-primary shadow-[inset_0_0_0_1px_var(--border)]">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <strong className="text-foreground block mb-0.5">Nothing in review</strong>
        <span className="text-sm text-muted-foreground">All current entries look settled.</span>
      </div>
    </div>
  );
}

function ReviewItem({
  entry,
  onConfirm,
  onEdit,
}: {
  entry: FoodEntry;
  onConfirm?: () => void;
  onEdit?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      onConfirm?.();
    }, 300);
  };

  return (
    <li className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {entry.items.join(', ')}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDateTime(entry.logged_at || entry.entry_date)} · confidence {Number(entry.confidence).toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {entry.estimated_calories} kcal · {entry.meal_type}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleConfirm}
          disabled={confirming}
          aria-label="Confirm entry"
          title="Confirm"
          className="h-7 w-7 rounded-full"
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onEdit}
          aria-label="Edit entry"
          title="Edit"
          className="h-7 w-7 rounded-full"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </li>
  );
}

export function ReviewQueue({ entries, limit = 6, onConfirm, onEdit }: Props) {
  const reviewItems = [...entries]
    .filter((e) => e.needs_review)
    .sort((a, b) => new Date(b.logged_at || b.entry_date).getTime() - new Date(a.logged_at || a.entry_date).getTime())
    .slice(0, limit);

  if (reviewItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Review</div>
          <CardTitle className="text-lg mb-4">Needs attention</CardTitle>
          <NoItems />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Review</div>
        <CardTitle className="text-lg">Needs attention</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {reviewItems.map((entry) => (
            <ReviewItem
              key={entry.id}
              entry={entry}
              onConfirm={() => onConfirm?.(entry.id)}
              onEdit={() => onEdit?.(entry.id)}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
