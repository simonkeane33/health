'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';

import { foodEntrySchema, type FoodEntryFormData } from '@/schema/entrySchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function FoodEntryForm() {
  const { date, time } = nowLocalInputs();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FoodEntryFormData>({
    resolver: zodResolver(foodEntrySchema) as any,
    defaultValues: {
      entry_date: date,
      entry_time: time,
      confidence: 0.8,
      needs_review: false,
      meal_type: 'snack',
    },
  });

  const confidence = watch('confidence');
  const needsReview = watch('needs_review');

  function onSubmit(data: FoodEntryFormData) {
    const loggedAt = new Date(`${data.entry_date}T${data.entry_time}`).toISOString();
    const items = data.items.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
    const frontmatter = {
      id: `food-${data.entry_date}-${uuidv4().slice(0, 8)}`,
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
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Date</label>
          <Input type="date" {...register('entry_date')} />
          {errors.entry_date && (
            <p className="text-xs text-destructive mt-1">{errors.entry_date.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Time</label>
          <Input type="time" {...register('entry_time')} />
          {errors.entry_time && (
            <p className="text-xs text-destructive mt-1">{errors.entry_time.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Meal type</label>
        <Select
          value={watch('meal_type')}
          onValueChange={(v) => setValue('meal_type', v as typeof MEAL_TYPES[number])}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent>
            {MEAL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.meal_type && (
          <p className="text-xs text-destructive mt-1">{errors.meal_type.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Items (one per line or comma-separated)</label>
        <Textarea {...register('items')} rows={3} placeholder="e.g. grilled chicken, rice, broccoli" />
        {errors.items && (
          <p className="text-xs text-destructive mt-1">{errors.items.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([
          'estimated_calories',
          'protein_g',
          'carbs_g',
          'fat_g',
          'fiber_g',
          'sugar_g',
          'fluids_ml',
          'alcohol_units',
        ] as const).map((field) => (
          <div key={field}>
            <label className="block text-xs font-medium mb-1 capitalize">
              {field.replace(/_/g, ' ')}
            </label>
            <Input type="number" step="0.1" {...register(field)} />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Confidence: {confidence?.toFixed(2)}
        </label>
        <Slider
          value={[confidence ?? 0.8]}
          onValueChange={([v]) => setValue('confidence', v)}
          min={0}
          max={1}
          step={0.05}
        />
        {errors.confidence && (
          <p className="text-xs text-destructive mt-1">{errors.confidence.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={needsReview}
          onCheckedChange={(checked) => setValue('needs_review', checked === true)}
        />
        <label className="text-xs">Needs review</label>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Notes</label>
        <Textarea {...register('notes')} rows={2} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Download .md entry</Button>
        {submitted && <span className="text-xs text-green-600">Downloaded!</span>}
      </div>
    </form>
  );
}
