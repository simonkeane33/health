'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import yaml from 'js-yaml';
import { foodEntrySchema, type FoodEntryFormData } from '@/schema/entrySchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'] as const;

function nowLocalInputs() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
}

function makeId(prefix: string, date: string) {
  return `${prefix}-${date}-${Date.now().toString(36)}`;
}

export default function FoodEntryForm() {
  const { date, time } = nowLocalInputs();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FoodEntryFormData>({
    resolver: zodResolver(foodEntrySchema) as any,
    defaultValues: {
      entry_date: date,
      entry_time: time,
      confidence: 0.8,
      needs_review: false,
      meal_type: 'snack',
      items: '',
    },
  });

  const onSubmit = useCallback(
    (data: FoodEntryFormData) => {
      const loggedAt = new Date(`${data.entry_date}T${data.entry_time}`).toISOString();
      const items = data.items
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);

      const frontmatter = {
        id: makeId('food', data.entry_date),
        entry_type: 'food_entry',
        logged_at: loggedAt,
        entry_date: data.entry_date,
        meal_type: data.meal_type,
        source: 'hermes',
        source_channel: 'health_dashboard',
        items,
        estimated_calories: data.estimated_calories ?? undefined,
        protein_g: data.protein_g ?? undefined,
        carbs_g: data.carbs_g ?? undefined,
        fat_g: data.fat_g ?? undefined,
        fiber_g: data.fiber_g ?? undefined,
        sugar_g: data.sugar_g ?? undefined,
        fluids_ml: data.fluids_ml ?? undefined,
        alcohol_units: data.alcohol_units ?? undefined,
        confidence: data.confidence,
        needs_review: data.needs_review,
        review_status: data.needs_review ? 'pending' : 'confirmed',
        user_confirmed: !data.needs_review,
        notes: data.notes ?? undefined,
        tags: ['health', 'intake', 'food'],
      };

      const md = `---\n${yaml.dump(frontmatter, { noRefs: true, lineWidth: -1 }).trim()}\n---\n\n# Food entry\n\n## Agent summary\n\n${items.join(', ')}\n\n## User correction\n\n## Raw extraction\n`;

      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.entry_date}-${data.meal_type}.md`;
      a.click();
      URL.revokeObjectURL(url);

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);

      reset({
        entry_date: date,
        entry_time: time,
        confidence: 0.8,
        needs_review: false,
        meal_type: 'snack',
        items: '',
      });
    },
    [date, time, reset]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entry_date" className="text-xs text-[#68655f]">
            Date
          </Label>
          <Input id="entry_date" type="date" {...register('entry_date')} />
          {errors.entry_date && (
            <p className="text-xs text-destructive">{errors.entry_date.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entry_time" className="text-xs text-[#68655f]">
            Time
          </Label>
          <Input id="entry_time" type="time" {...register('entry_time')} />
          {errors.entry_time && (
            <p className="text-xs text-destructive">{errors.entry_time.message}</p>
          )}
        </div>
      </div>

      {/* Meal type */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-[#68655f]">Meal type</Label>
        <Controller
          name="meal_type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="meal_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.meal_type && (
          <p className="text-xs text-destructive">{errors.meal_type.message}</p>
        )}
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="items" className="text-xs text-[#68655f]">
          Items (one per line or comma-separated)
        </Label>
        <Textarea
          id="items"
          rows={3}
          placeholder="e.g. grilled chicken, rice, broccoli"
          {...register('items')}
        />
        {errors.items && (
          <p className="text-xs text-destructive">{errors.items.message}</p>
        )}
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            'estimated_calories',
            'protein_g',
            'carbs_g',
            'fat_g',
            'fiber_g',
            'sugar_g',
            'fluids_ml',
            'alcohol_units',
          ] as const
        ).map((field) => (
          <div key={field} className="flex flex-col gap-1.5">
            <Label htmlFor={field} className="text-xs text-[#68655f] capitalize">
              {field.replace(/_/g, ' ')}
            </Label>
            <Input
              id={field}
              type="number"
              step="0.1"
              placeholder="0"
              {...register(field)}
            />
          </div>
        ))}
      </div>

      {/* Confidence slider */}
      <div className="flex flex-col gap-2">
        <Controller
          name="confidence"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-[#68655f]">
                Confidence: {(field.value ?? 0.8).toFixed(2)}
              </Label>
              <Slider
                value={[field.value ?? 0.8]}
                onValueChange={([v]) => field.onChange(v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          )}
        />
        {errors.confidence && (
          <p className="text-xs text-destructive">{errors.confidence.message}</p>
        )}
      </div>

      {/* Needs review */}
      <div className="flex items-center gap-2">
        <Controller
          name="needs_review"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="needs_review"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="needs_review" className="text-xs text-[#68655f] cursor-pointer">
          Needs review
        </Label>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes" className="text-xs text-[#68655f]">
          Notes
        </Label>
        <Textarea id="notes" rows={2} placeholder="optional" {...register('notes')} />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" className="bg-[#01696f] hover:bg-[#014d52]">
          Download .md entry
        </Button>
        {submitted && <span className="text-xs text-[#01696f]">Downloaded!</span>}
      </div>
    </form>
  );
}
