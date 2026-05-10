'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import yaml from 'js-yaml';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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

function toFrontmatterNumber(val: string | number | null | undefined): number | undefined {
  if (val === '' || val === undefined || val === null) return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : Number(val);
  return Number.isNaN(num) ? undefined : num;
}

const NUMERIC_FIELDS = [
  'estimated_calories',
  'protein_g',
  'carbs_g',
  'fat_g',
  'fiber_g',
  'sugar_g',
  'fluids_ml',
  'alcohol_units',
] as const;

export default function FoodEntryForm() {
  const { date, time } = nowLocalInputs();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FoodEntryFormData>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: {
      entry_date: date,
      entry_time: time,
      meal_type: 'snack',
      items: '',
      confidence: 0.8,
      needs_review: false,
      notes: '',
    },
  });

  const onSubmit = useCallback(
    (data: FoodEntryFormData) => {
      const loggedAt = new Date(`${data.entry_date}T${data.entry_time}`).toISOString();
      const items = data.items
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);

      const frontmatter: Record<string, unknown> = {
        id: makeId('food', data.entry_date),
        entry_type: 'food_entry',
        logged_at: loggedAt,
        entry_date: data.entry_date,
        meal_type: data.meal_type,
        source: 'hermes',
        source_channel: 'health_dashboard',
        items,
        confidence: data.confidence,
        needs_review: data.needs_review,
        review_status: data.needs_review ? 'pending' : 'confirmed',
        user_confirmed: !data.needs_review,
        tags: ['health', 'intake', 'food'],
      };

      for (const key of NUMERIC_FIELDS) {
        const raw = data[key as keyof FoodEntryFormData];
        const num = toFrontmatterNumber(raw as string | number | null | undefined);
        if (num !== undefined && num !== null) {
          frontmatter[key] = num;
        }
      }

      if (data.notes) {
        frontmatter.notes = data.notes;
      }

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

      form.reset({
        entry_date: nowLocalInputs().date,
        entry_time: nowLocalInputs().time,
        meal_type: 'snack',
        items: '',
        confidence: 0.8,
        needs_review: false,
        notes: '',
      });
    },
    [form]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entry_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Meal type */}
        <FormField
          control={form.control}
          name="meal_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Meal type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MEAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Items */}
        <FormField
          control={form.control}
          name="items"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                Items (one per line or comma-separated)
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="e.g. grilled chicken, rice, broccoli"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3">
          {NUMERIC_FIELDS.map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control}
              name={fieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground capitalize">
                    {fieldName.replace(/_/g, ' ')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        {/* Confidence slider */}
        <FormField
          control={form.control}
          name="confidence"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel className="text-xs text-muted-foreground">
                Confidence: {(field.value ?? 0.8).toFixed(2)}
              </FormLabel>
              <FormControl>
                <Slider
                  value={[field.value ?? 0.8]}
                  onValueChange={([v]) => field.onChange(v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Needs review */}
        <FormField
          control={form.control}
          name="needs_review"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-xs text-muted-foreground font-normal cursor-pointer">
                Needs review
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Notes</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="optional"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit">
            Download .md entry
          </Button>
          {submitted && (
            <span className="text-xs text-[#01696f]">Downloaded!</span>
          )}
        </div>
      </form>
    </Form>
  );
}
