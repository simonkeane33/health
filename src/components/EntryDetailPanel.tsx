'use client';

import type { FoodEntry } from '@/lib/types';
import { formatDateTime, formatNumber } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useTargets } from '@/lib/targets-context';

interface Props {
  entry: FoodEntry | null;
  open: boolean;
  onClose: () => void;
}

function NutritionRow({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  if (value == null || Number.isNaN(value)) return null;
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">
        {formatNumber(value, typeof value === 'number' && value % 1 !== 0 ? 1 : 0)} <span className="text-muted-foreground font-normal">{unit}</span>
      </span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function EntryDetailPanel({ entry, open, onClose }: Props) {
  const { vaultName } = useTargets();
  if (!entry) return null;

  const displayedConfidence = entry.hermes_confidence ?? entry.confidence ?? 0;
  const confidenceLabel = displayedConfidence >= 0.9 ? 'High' : displayedConfidence >= 0.7 ? 'Medium' : displayedConfidence > 0 ? 'Low' : 'Unknown';
  const confidenceVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
    displayedConfidence >= 0.9 ? 'default' : displayedConfidence >= 0.7 ? 'secondary' : displayedConfidence > 0 ? 'destructive' : 'outline';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">{entry.meal_type || 'Entry'}</SheetTitle>
          <SheetDescription>
            {formatDateTime(entry.logged_at || entry.entry_date)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Items */}
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Items</h3>
            <ul className="list-disc list-inside space-y-0.5 text-sm">
              {entry.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <Separator />

          {/* Nutrition */}
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Nutrition</h3>
            <div className="divide-y divide-border">
              <NutritionRow label="Calories" value={entry.estimated_calories} unit="kcal" />
              <NutritionRow label="Protein" value={entry.protein_g} unit="g" />
              <NutritionRow label="Carbs" value={entry.carbs_g} unit="g" />
              <NutritionRow label="Fat" value={entry.fat_g} unit="g" />
              <NutritionRow label="Fiber" value={entry.fiber_g} unit="g" />
              <NutritionRow label="Sugar" value={entry.sugar_g} unit="g" />
              <NutritionRow label="Fluids" value={entry.fluids_ml} unit="ml" />
              <NutritionRow label="Alcohol" value={entry.alcohol_units} unit="units" />
            </div>
          </section>

          <Separator />

          {/* Metadata */}
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Metadata</h3>
            <MetaRow label="Entry type" value={entry.entry_type} />
            <MetaRow label="Date" value={entry.entry_date} />
            <MetaRow label="Source" value={entry.source} />
            <MetaRow label="Channel" value={entry.source_channel} />
            <MetaRow label="Location" value={entry.location} />
            <MetaRow label="Mood" value={entry.mood} />
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex justify-between items-start py-1 gap-2">
                <span className="text-sm text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {entry.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            {entry.notes && (
              <div className="py-1">
                <span className="text-sm text-muted-foreground block mb-1">Notes</span>
                <p className="text-sm whitespace-pre-line">{entry.notes}</p>
              </div>
            )}
          </section>

          {entry.source_file && (
            <>
              <Separator />
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Source file</h3>
                <p className="text-xs text-muted-foreground break-all mb-2">{entry.source_file}</p>
                {vaultName ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                  >
                    <a
                      href={`obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(entry.source_file)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in Obsidian
                    </a>
                  </Button>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Set vault name in ⚙ Settings to enable Obsidian links.</p>
                )}
              </section>
            </>
          )}

          <Separator />

          {/* Confidence + Review */}
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Confidence &amp; Review</h3>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">Confidence</span>
              <Badge variant={confidenceVariant} className="text-xs">
                {confidenceLabel} ({formatNumber(displayedConfidence, 2)})
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={entry.needs_review ? 'destructive' : 'secondary'} className="text-xs">
                {entry.needs_review ? 'Needs review' : entry.review_status}
              </Badge>
            </div>
            {entry.reviewed_by && (
              <MetaRow label="Reviewed by" value={entry.reviewed_by} />
            )}
            {entry.reviewed_at && (
              <MetaRow label="Reviewed at" value={entry.reviewed_at} />
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
