'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import yaml from 'js-yaml';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

function nowLocalInputs() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
}

function makeId(prefix: string, date: string) {
  return `${prefix}-${date}-${Date.now().toString(36)}`;
}

function optionalNum(val: string | undefined): number | undefined {
  if (!val || val.trim() === '') return undefined;
  const n = parseFloat(val);
  return Number.isNaN(n) ? undefined : n;
}

export default function WeightEntryForm() {
  const { date, time } = nowLocalInputs();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<WeightEntryFormData>({
    resolver: zodResolver(weightEntrySchema),
    defaultValues: {
      entry_date: date,
      entry_time: time,
      weight_kg: '',
      time_period: 'morning',
      fasted: false,
      fat_mass_pct: '',
      muscle_mass_pct: '',
      bone_mass_pct: '',
      body_water_pct: '',
      height_cm: '',
      notes: '',
    },
  });

  const onSubmit = useCallback(
    (data: WeightEntryFormData) => {
      const loggedAt = new Date(`${data.entry_date}T${data.entry_time}`).toISOString();
      const weightNum = parseFloat(data.weight_kg);
      const fatMass = optionalNum(data.fat_mass_pct);
      const muscleMass = optionalNum(data.muscle_mass_pct);
      const boneMass = optionalNum(data.bone_mass_pct);
      const bodyWater = optionalNum(data.body_water_pct);
      const heightCm = optionalNum(data.height_cm);

      const frontmatter: Record<string, unknown> = {
        id: makeId('weight', data.entry_date),
        entry_type: 'weight_entry',
        logged_at: loggedAt,
        entry_date: data.entry_date,
        weight_kg: weightNum,
        source: 'hermes',
        source_channel: 'health_dashboard',
        fasted: data.fasted,
        time_period: data.time_period,
        confidence: 1.0,
        tags: ['health', 'weight'],
      };

      if (fatMass !== undefined) frontmatter.fat_mass_pct = fatMass;
      if (muscleMass !== undefined) frontmatter.muscle_mass_pct = muscleMass;
      if (boneMass !== undefined) frontmatter.bone_mass_pct = boneMass;
      if (bodyWater !== undefined) frontmatter.body_water_pct = bodyWater;
      if (heightCm !== undefined) frontmatter.height_cm = heightCm;
      if (data.notes) frontmatter.notes = data.notes;

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

      form.reset({
        entry_date: nowLocalInputs().date,
        entry_time: nowLocalInputs().time,
        time_period: 'morning',
        fasted: false,
        weight_kg: '',
        fat_mass_pct: '',
        muscle_mass_pct: '',
        bone_mass_pct: '',
        body_water_pct: '',
        height_cm: '',
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

        {/* Weight */}
        <FormField
          control={form.control}
          name="weight_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Weight (kg)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 77.40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Period + Fasted */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="time_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Period</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fasted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-7">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-xs text-muted-foreground font-normal cursor-pointer">
                  Fasted
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Body Composition — optional */}
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Body Composition</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fat_mass_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Fat Mass %</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g. 25.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="muscle_mass_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Muscle Mass %</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g. 71.3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bone_mass_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Bone Mass %</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g. 3.7" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body_water_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Body Water %</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g. 52.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Height (for BMI) */}
        <FormField
          control={form.control}
          name="height_cm"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Height (cm) — optional, for BMI</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="e.g. 178" {...field} />
              </FormControl>
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
                <Input placeholder="optional" {...field} />
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
