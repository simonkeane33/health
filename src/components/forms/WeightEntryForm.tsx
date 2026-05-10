'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';

import { weightEntrySchema, type WeightEntryFormData } from '@/schema/entrySchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function WeightEntryForm() {
  const { date, time } = nowLocalInputs();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<WeightEntryFormData>({
    resolver: zodResolver(weightEntrySchema) as any,
    defaultValues: {
      entry_date: date,
      entry_time: time,
      weight_kg: undefined,
      time_period: 'morning',
      fasted: false,
    },
  });

  const fasted = watch('fasted');

  function onSubmit(data: WeightEntryFormData) {
    const loggedAt = new Date(`${data.entry_date}T${data.entry_time}`).toISOString();
    const frontmatter = {
      id: `weight-${data.entry_date}-${uuidv4().slice(0, 8)}`,
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
        <label className="block text-xs font-medium mb-1">Weight (kg)</label>
        <Input type="number" step="0.01" {...register('weight_kg')} placeholder="e.g. 77.4" />
        {errors.weight_kg && (
          <p className="text-xs text-destructive mt-1">{errors.weight_kg.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Period</label>
          <Select
            value={watch('time_period')}
            onValueChange={(v) => setValue('time_period', v as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <Checkbox
            checked={fasted}
            onCheckedChange={(checked) => setValue('fasted', checked === true)}
          />
          <label className="text-xs font-medium">Fasted</label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Notes</label>
        <Input {...register('notes')} placeholder="optional" />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Download .md entry</Button>
        {submitted && <span className="text-xs text-green-600">Downloaded!</span>}
      </div>
    </form>
  );
}
