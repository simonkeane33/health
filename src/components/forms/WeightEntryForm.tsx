'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import yaml from 'js-yaml';
import { weightEntrySchema, type WeightEntryFormData } from '@/schema/entrySchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function nowLocalInputs() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
}

function makeId(prefix: string, date: string) {
  return `${prefix}-${date}-${Date.now().toString(36)}`;
}

export default function WeightEntryForm() {
  const { date, time } = nowLocalInputs();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WeightEntryFormData>({
    resolver: zodResolver(weightEntrySchema),
    defaultValues: {
      entry_date: date,
      entry_time: time,
      weight_kg: undefined,
      time_period: 'morning',
      fasted: false,
      notes: '',
    },
  });

  const onSubmit = useCallback(
    (data: WeightEntryFormData) => {
      const loggedAt = new Date(`${data.entry_date}T${data.entry_time}`).toISOString();

      const frontmatter = {
        id: makeId('weight', data.entry_date),
        entry_type: 'weight_entry',
        logged_at: loggedAt,
        entry_date: data.entry_date,
        weight_kg: data.weight_kg,
        source: 'hermes',
        source_channel: 'health_dashboard',
        fasted: data.fasted,
        time_period: data.time_period,
        confidence: 1.0,
        notes: data.notes || undefined,
        tags: ['health', 'weight'],
      };

      const md = `---\n${yaml.dump(frontmatter, { noRefs: true, lineWidth: -1 }).trim()}\n---\n\n# Weight entry — ${data.entry_date}\n\nWeight: **${data.weight_kg} kg**\n`;

      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.entry_date}-${data.time_period}-weight.md`;
      a.click();
      URL.revokeObjectURL(url);

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);

      reset({
        entry_date: date,
        entry_time: time,
        time_period: 'morning',
        fasted: false,
        weight_kg: undefined,
        notes: '',
      });
    },
    [date, time, reset]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="w_entry_date" className="text-xs text-[#68655f]">
            Date
          </Label>
          <Input id="w_entry_date" type="date" {...register('entry_date')} />
          {errors.entry_date && (
            <p className="text-xs text-destructive">{errors.entry_date.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="w_entry_time" className="text-xs text-[#68655f]">
            Time
          </Label>
          <Input id="w_entry_time" type="time" {...register('entry_time')} />
          {errors.entry_time && (
            <p className="text-xs text-destructive">{errors.entry_time.message}</p>
          )}
        </div>
      </div>

      {/* Weight */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weight_kg" className="text-xs text-[#68655f]">Weight (kg)</Label>
        <Input
          id="weight_kg"
          type="number"
          step="0.01"
          placeholder="e.g. 77.40"
          {...register('weight_kg')}
        />
        {errors.weight_kg && (
          <p className="text-xs text-destructive">{errors.weight_kg.message}</p>
        )}
      </div>

      {/* Period + Fasted */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-[#68655f]">Period</Label>
          <Controller
            name="time_period"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="w_time_period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-center gap-2 mt-5">
          <Controller
            name="fasted"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="w_fasted"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="w_fasted" className="text-xs text-[#68655f] cursor-pointer">Fasted</Label>
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="w_notes" className="text-xs text-[#68655f]">Notes</Label>
        <Input
          id="w_notes"
          placeholder="optional"
          {...register('notes')}
        />
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
