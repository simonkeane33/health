'use client';

import { useState, useEffect } from 'react';
import type { FoodEntry } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

type WriteResult = 'ok' | 'no-handle' | 'no-file' | 'no-write' | 'patch-fail';

interface Props {
  entry: FoodEntry | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, patches: Partial<FoodEntry>) => Promise<WriteResult>;
}

interface FormState {
  meal_type: string;
  estimated_calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  fiber_g: string;
  sugar_g: string;
  fluids_ml: string;
  needs_review: boolean;
  review_status: string;
  notes: string;
}

function toFormState(entry: FoodEntry): FormState {
  return {
    meal_type: entry.meal_type ?? 'other',
    estimated_calories: entry.estimated_calories != null ? String(entry.estimated_calories) : '',
    protein_g: entry.protein_g != null ? String(entry.protein_g) : '',
    carbs_g: entry.carbs_g != null ? String(entry.carbs_g) : '',
    fat_g: entry.fat_g != null ? String(entry.fat_g) : '',
    fiber_g: entry.fiber_g != null ? String(entry.fiber_g) : '',
    sugar_g: entry.sugar_g != null ? String(entry.sugar_g) : '',
    fluids_ml: entry.fluids_ml != null ? String(entry.fluids_ml) : '',
    needs_review: entry.needs_review ?? false,
    review_status: entry.review_status ?? 'pending',
    notes: entry.notes ?? '',
  };
}

const ERROR_MESSAGES: Record<WriteResult, string> = {
  ok: '',
  'no-handle': 'No vault folder is connected. Reconnect to save.',
  'no-file': 'Source file not found in the vault.',
  'no-write': 'Write permission denied. Try reconnecting the vault.',
  'patch-fail': 'Could not parse the file frontmatter.',
};

export function EntryEditSheet({ entry, open, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>('');

  // Re-initialise form state whenever the entry changes
  useEffect(() => {
    if (entry) {
      setForm(toFormState(entry));
      setSaveError('');
    }
  }, [entry]);

  if (!form || !entry) return null;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setSaveError('');
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError('');

    const patches: Partial<FoodEntry> = {
      meal_type: form.meal_type,
      estimated_calories: form.estimated_calories !== '' ? Number(form.estimated_calories) : 0,
      needs_review: form.needs_review,
      review_status: form.review_status,
      notes: form.notes || undefined,
    };

    const optNum = (v: string): number | undefined => v !== '' ? Number(v) : undefined;
    patches.protein_g = optNum(form.protein_g);
    patches.carbs_g = optNum(form.carbs_g);
    patches.fat_g = optNum(form.fat_g);
    patches.fiber_g = optNum(form.fiber_g);
    patches.sugar_g = optNum(form.sugar_g);
    patches.fluids_ml = optNum(form.fluids_ml);

    const result = await onSave(entry.id, patches);

    setSaving(false);
    if (result === 'ok') {
      onClose();
    } else {
      setSaveError(ERROR_MESSAGES[result] ?? 'Unknown error.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col px-6">
        <SheetHeader className="px-0 pb-2">
          <SheetTitle>Edit entry</SheetTitle>
          <p className="text-xs text-muted-foreground truncate">{entry.items.join(', ')}</p>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-6 py-4 px-0">
          {/* Details */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>

            <div className="grid gap-1.5">
              <Label htmlFor="entry_date">Date</Label>
              <Input id="entry_date" value={entry.entry_date} readOnly className="bg-muted/40 text-muted-foreground" />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="meal_type">Meal type</Label>
              <Select value={form.meal_type} onValueChange={(v) => setField('meal_type', v)}>
                <SelectTrigger id="meal_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="drink">Drink</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Items</Label>
              <div className="rounded-md border border-border bg-muted/40 p-2.5">
                {entry.items.length > 0 ? (
                  <ul className="flex flex-col gap-0.5">
                    {entry.items.map((item, i) => (
                      <li key={i} className="text-sm">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No items</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">Edit items in Obsidian</p>
              </div>
            </div>
          </section>

          {/* Nutrition */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nutrition</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="estimated_calories">Calories (kcal)</Label>
                <Input
                  id="estimated_calories"
                  type="number"
                  min={0}
                  value={form.estimated_calories}
                  onChange={(e) => setField('estimated_calories', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="protein_g">Protein (g)</Label>
                <Input
                  id="protein_g"
                  type="number"
                  min={0}
                  value={form.protein_g}
                  onChange={(e) => setField('protein_g', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="carbs_g">Carbs (g)</Label>
                <Input
                  id="carbs_g"
                  type="number"
                  min={0}
                  value={form.carbs_g}
                  onChange={(e) => setField('carbs_g', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fat_g">Fat (g)</Label>
                <Input
                  id="fat_g"
                  type="number"
                  min={0}
                  value={form.fat_g}
                  onChange={(e) => setField('fat_g', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fiber_g">Fiber (g)</Label>
                <Input
                  id="fiber_g"
                  type="number"
                  min={0}
                  value={form.fiber_g}
                  onChange={(e) => setField('fiber_g', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sugar_g">Sugar (g)</Label>
                <Input
                  id="sugar_g"
                  type="number"
                  min={0}
                  value={form.sugar_g}
                  onChange={(e) => setField('sugar_g', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5 col-span-2">
                <Label htmlFor="fluids_ml">Fluids (ml)</Label>
                <Input
                  id="fluids_ml"
                  type="number"
                  min={0}
                  value={form.fluids_ml}
                  onChange={(e) => setField('fluids_ml', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Review */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Review</h3>

            <div className="flex items-center gap-2">
              <Checkbox
                id="needs_review"
                checked={form.needs_review}
                onCheckedChange={(checked) => setField('needs_review', checked === true)}
              />
              <Label htmlFor="needs_review" className="cursor-pointer">Needs review</Label>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="review_status">Review status</Label>
              <Select value={form.review_status} onValueChange={(v) => setField('review_status', v)}>
                <SelectTrigger id="review_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="corrected">Corrected</SelectItem>
                  <SelectItem value="estimated">Estimated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Optional notes…"
              />
            </div>
          </section>
        </div>

        {saveError && (
          <p className="text-sm text-destructive pb-2">{saveError}</p>
        )}

        <SheetFooter className="gap-2 pt-4 pb-2 border-t px-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
