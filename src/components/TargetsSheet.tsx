'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { useTargets } from '@/lib/targets-context';
import type { DailyTargets } from '@/lib/targets';

function TargetField({
  id,
  label,
  unit,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={0}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!Number.isNaN(n) && n >= 0) onChange(n);
          }}
          className="h-8 text-sm tabular-nums"
        />
        <span className="text-xs text-muted-foreground w-10 flex-shrink-0">{unit}</span>
      </div>
    </div>
  );
}

export function TargetsSheet({ className }: { className?: string }) {
  const { targets, setTargets } = useTargets();
  const [draft, setDraft] = useState<DailyTargets>(targets);

  function field<K extends keyof DailyTargets>(key: K) {
    return (v: number) => setDraft((d) => ({ ...d, [key]: v }));
  }

  function handleOpen(open: boolean) {
    if (open) setDraft(targets);
  }

  function handleApply() {
    setTargets(draft);
  }

  function handleReset() {
    import('@/lib/targets').then(({ DEFAULT_TARGETS }) => {
      setDraft(DEFAULT_TARGETS);
      setTargets(DEFAULT_TARGETS);
    });
  }

  return (
    <Sheet onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant="outline" className={className}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Edit targets</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 flex flex-col gap-6">
        <SheetHeader>
          <SheetTitle>Daily Targets</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <TargetField
            id="target-calories"
            label="Calories"
            unit="kcal"
            value={draft.calories_kcal}
            onChange={field('calories_kcal')}
          />
          <TargetField
            id="target-protein"
            label="Protein"
            unit="g"
            value={draft.protein_g}
            onChange={field('protein_g')}
          />
          <TargetField
            id="target-fluids"
            label="Fluids"
            unit="ml"
            value={draft.fluids_ml}
            onChange={field('fluids_ml')}
          />
          <TargetField
            id="target-weight"
            label="Target weight"
            unit="kg"
            value={draft.weight_kg}
            onChange={field('weight_kg')}
          />
        </div>

        <SheetFooter className="flex gap-2 mt-auto">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="flex-1">
            Reset defaults
          </Button>
          <SheetClose asChild>
            <Button type="button" size="sm" onClick={handleApply} className="flex-1">
              Apply
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
