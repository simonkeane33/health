'use client';

import { useState } from 'react';
import type { FoodEntry } from '@/lib/types';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { EntryDetailPanel } from '@/components/EntryDetailPanel';

const LOW_CONFIDENCE_THRESHOLD = 0.8;

interface Props {
  entries: FoodEntry[];
  limit?: number;
  onReviewChange?: (id: string, confirmed: boolean) => void;
}

function EmptyState({ title, body, icon: Icon }: { title: string; body: string; icon?: typeof UtensilsCrossed }) {
  const IconComp = Icon ?? UtensilsCrossed;
  return (
    <div className="flex flex-col gap-3 py-10 text-muted-foreground">
      <div className="w-14 h-14 rounded-[18px] grid place-items-center bg-accent text-primary shadow-[inset_0_0_0_1px_var(--border)]">
        <IconComp className="w-5 h-5" />
      </div>
      <div>
        <strong className="text-foreground block mb-0.5">{title}</strong>
        <span className="text-sm">{body}</span>
      </div>
    </div>
  );
}

export function RecentEntries({ entries, onReviewChange }: Props) {
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todays = [...entries]
    .filter((e) => e.entry_date === today)
    .sort((a, b) => new Date(b.logged_at || b.entry_date).getTime() - new Date(a.logged_at || a.entry_date).getTime());

  const displayed = showLowConfidence
    ? todays.filter((e) => Number(e.confidence) < LOW_CONFIDENCE_THRESHOLD)
    : todays;

  const lowCount = todays.filter((e) => Number(e.confidence) < LOW_CONFIDENCE_THRESHOLD).length;

  const handleRowClick = (entry: FoodEntry) => {
    setSelectedEntry(entry);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedEntry(null);
  };

  const header = (
    <CardHeader className="pb-0 flex flex-row items-start justify-between gap-3">
      <div>
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">{'Today\'s entries'}</div>
        <CardTitle className="text-lg">Meals and drinks today</CardTitle>
      </div>
      {lowCount > 0 && (
        <Toggle
          size="sm"
          variant="outline"
          pressed={showLowConfidence}
          onPressedChange={setShowLowConfidence}
          className="shrink-0"
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-destructive" />
          Low confidence
          <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 min-w-4">
            {lowCount}
          </Badge>
        </Toggle>
      )}
    </CardHeader>
  );

  if (todays.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">{'Today\'s entries'}</div>
          <CardTitle className="text-lg mb-4">Meals and drinks today</CardTitle>
          <EmptyState title="No entries today" body="Log a meal or drink to see it here." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent className="overflow-auto">
        {displayed.length === 0 && showLowConfidence ? (
          <EmptyState
            icon={AlertTriangle}
            title="All caught up!"
            body="No low-confidence entries today. Every item is above the 0.8 threshold."
          />
        ) : (
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
              {displayed.map((entry) => (
                <tr
                  key={entry.id}
                  className="cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => handleRowClick(entry)}
                >
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
                    ) : Number(entry.confidence) < LOW_CONFIDENCE_THRESHOLD ? (
                      <Badge variant="outline" className="text-destructive border-destructive/30">Low confidence</Badge>
                    ) : (
                      <Badge variant="secondary">Confirmed</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
      <EntryDetailPanel
        entry={selectedEntry}
        open={panelOpen}
        onClose={handleClosePanel}
      />
    </Card>
  );
}
