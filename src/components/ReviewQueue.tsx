'use client';

import { useState } from 'react';
import { AlertCircle, Check, Pencil } from 'lucide-react';
import type { FoodEntry } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

interface Props {
  entries: FoodEntry[];
  limit?: number;
  onConfirm?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function ReviewQueue({ entries, limit = 6, onConfirm, onEdit }: Props) {
  const reviewItems = [...entries]
    .filter((e) => e.needs_review)
    .sort((a, b) => new Date(b.logged_at || b.entry_date).getTime() - new Date(a.logged_at || a.entry_date).getTime())
    .slice(0, limit);

  if (reviewItems.length === 0) {
    return (
      <div className="panel">
        <div className="p-5">
          <div className="micro-label mb-1">Review</div>
          <h3 className="text-lg font-semibold tracking-tight mb-4">Needs attention</h3>
          <NoItems />
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="p-5 pb-0">
        <div className="micro-label mb-1">Review</div>
        <h3 className="text-lg font-semibold tracking-tight mb-4">Needs attention</h3>
      </div>
      <div className="p-5 pt-0">
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
    <li className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(150,66,25,0.06)] border border-[rgba(150,66,25,0.10)]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#28251d] truncate">
          {entry.items.join(', ')}
        </p>
        <p className="text-xs text-[#9a9891] mt-0.5">
          {formatDateTime(entry.logged_at || entry.entry_date)} · confidence {Number(entry.confidence).toFixed(2)}
        </p>
        <p className="text-xs text-[#9a9891] mt-0.5">
          {entry.estimated_calories} kcal · {entry.meal_type}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="pill ok cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Confirm entry"
          title="Confirm"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onEdit}
          className="pill warn cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Edit entry"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

function NoItems() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="empty-illustration">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <strong className="text-[#28251d] block mb-0.5">Nothing in review</strong>
        <span className="text-sm text-[#68655f]">All current entries look settled.</span>
      </div>
    </div>
  );
}
