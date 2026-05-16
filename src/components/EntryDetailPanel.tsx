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
import { Check, ExternalLink, Loader2, Pencil } from 'lucide-react';
import { useTargets } from '@/lib/targets-context';
import { useState } from 'react';
import { SheetFooter } from '@/components/ui/sheet';

const CONFIRM_ERRORS: Record<string, string> = {
  'no-handle': 'No vault connected.',
  'no-file':   'File not found in vault.',
  'no-write':  'Write permission denied — reconnect the vault.',
  'patch-fail':'Could not update file.',
};

interface Props {
  entry: FoodEntry | null;
  open: boolean;
  onClose: () => void;
  onConfirm?: (id: string) => Promise<string>;
  onEdit?: (id: string) => void;
}

function NutritionRow({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  if (value == null || Number.isNaN(value)) return null;
  return (
    <div className="flex justify-between items-center py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">
        {formatNumber(value, typeof value === 'number' && value % 1 !== 0 ? 1 : 0)}{' '}
        <span className="text-muted-foreground font-normal">{unit}</span>
      </span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

export function EntryDetailPanel({ entry, open, onClose, onConfirm, onEdit }: Props) {
  const { vaultName } = useTargets();
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  if (!entry) return null;

  const needsAction = entry.needs_review || (!entry.user_confirmed && Number(entry.confidence ?? 0) < 0.8);

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setConfirming(true);
    setConfirmError('');
    const result = await onConfirm(entry.id);
    setConfirming(false);
    if (result === 'ok') {
      onClose();
    } else {
      setConfirmError(CONFIRM_ERRORS[result] ?? 'Unknown error.');
    }
  };

  const displayedConfidence = entry.hermes_confidence ?? entry.confidence ?? 0;
  const confidenceLabel = displayedConfidence >= 0.9 ? 'High' : displayedConfidence >= 0.7 ? 'Medium' : displayedConfidence > 0 ? 'Low' : 'Unknown';
  const confidenceVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
    displayedConfidence >= 0.9 ? 'default' : displayedConfidence >= 0.7 ? 'secondary' : displayedConfidence > 0 ? 'destructive' : 'outline';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto px-6">
        <SheetHeader className="pb-4 pt-1">
          <SheetTitle className="text-lg capitalize">{entry.meal_type || 'Entry'}</SheetTitle>
          <SheetDescription className="text-sm">
            {formatDateTime(entry.logged_at || entry.entry_date)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 pb-8">
          {/* Items */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Items</h3>
            <ul className="space-y-2">
              {entry.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          {/* Nutrition */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Nutrition</h3>
            <div className="divide-y divide-border/60">
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
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Metadata</h3>
            <div className="divide-y divide-border/60">
              <MetaRow label="Entry type" value={entry.entry_type} />
              <MetaRow label="Date" value={entry.entry_date} />
              <MetaRow label="Source" value={entry.source} />
              <MetaRow label="Channel" value={entry.source_channel} />
              <MetaRow label="Location" value={entry.location} />
              <MetaRow label="Mood" value={entry.mood} />
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex justify-between items-start gap-4 py-2">
                  <span className="text-sm text-muted-foreground shrink-0">Tags</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {entry.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-2">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {entry.notes && (
                <div className="py-3">
                  <span className="text-sm text-muted-foreground block mb-2">Notes</span>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{entry.notes}</p>
                </div>
              )}
            </div>
          </section>

          {entry.source_file && (
            <>
              <Separator />
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Source file</h3>
                <p className="text-xs text-muted-foreground break-all mb-3 leading-relaxed">{entry.source_file}</p>
                {vaultName ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
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
                  <p className="text-[11px] text-muted-foreground">Set vault name in ⚙ Settings to enable Obsidian links.</p>
                )}
              </section>
            </>
          )}

          <Separator />

          {/* Confidence + Review */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Confidence &amp; Review</h3>
            <div className="divide-y divide-border/60">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <Badge variant={confidenceVariant} className="text-xs">
                  {confidenceLabel} ({formatNumber(displayedConfidence, 2)})
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={entry.user_confirmed ? 'secondary' : entry.needs_review ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {entry.user_confirmed ? 'Confirmed' : entry.needs_review ? 'Needs review' : (entry.review_status || 'Confirmed')}
                </Badge>
              </div>
              {entry.reviewed_by && (
                <MetaRow label="Reviewed by" value={entry.reviewed_by} />
              )}
              {entry.reviewed_at && (
                <MetaRow label="Reviewed at" value={entry.reviewed_at} />
              )}
            </div>
          </section>
        </div>

        {(onConfirm || onEdit) && needsAction && (
          <SheetFooter className="gap-2 pt-4 pb-2 border-t px-0 sticky bottom-0 bg-popover">
            {confirmError && (
              <p className="text-xs text-destructive w-full">{confirmError}</p>
            )}
            <div className="flex gap-2 w-full">
              {onEdit && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { onClose(); onEdit(entry.id); }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
              {onConfirm && (
                <Button
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming
                    ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    : <Check className="h-3.5 w-3.5 mr-1.5" />}
                  {confirming ? 'Confirming…' : 'Confirm entry'}
                </Button>
              )}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
