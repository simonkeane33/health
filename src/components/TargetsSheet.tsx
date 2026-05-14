'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useTargets } from '@/lib/targets-context';
import type { DailyTargets } from '@/lib/targets';

interface TargetFieldProps {
  id: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function TargetField({ id, label, unit, value, min, max, step, onChange }: TargetFieldProps) {
  // Local string buffer so the user can freely type without being snapped back mid-edit
  const [raw, setRaw] = useState(String(value));

  // Keep in sync when the parent value changes (e.g. slider moves, reset)
  useEffect(() => { setRaw(String(value)); }, [value]);

  function commit(str: string) {
    const n = parseFloat(str);
    if (!Number.isNaN(n)) {
      const clamped = Math.min(max, Math.max(min, n));
      onChange(clamped);
      setRaw(String(clamped));
    } else {
      // Revert to last good value on gibberish
      setRaw(String(value));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <div className="flex items-baseline gap-1.5">
          <Input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="h-8 w-24 text-right text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs text-muted-foreground w-6">{unit}</span>
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

export function TargetsSheet({ className }: { className?: string }) {
  const { targets, setTargets, vaultName, setVaultName } = useTargets();
  const [draft, setDraft] = useState<DailyTargets>(targets);
  const [draftVault, setDraftVault] = useState(vaultName);

  function field<K extends keyof DailyTargets>(key: K) {
    return (v: number) => setDraft((d) => ({ ...d, [key]: v }));
  }

  function handleOpen(open: boolean) {
    if (open) {
      setDraft(targets);
      setDraftVault(vaultName);
    }
  }

  function handleApply() {
    setTargets(draft);
    setVaultName(draftVault.trim());
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

      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col px-6 pt-6 pb-8 gap-0 overflow-y-auto">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-xl">Daily Targets</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-8 flex-1">
          {/* Vault name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="vault-name" className="text-sm font-medium">Obsidian vault name</Label>
            <Input
              id="vault-name"
              type="text"
              placeholder="e.g. my-vault"
              value={draftVault}
              onChange={(e) => setDraftVault(e.target.value)}
              className="h-10 text-sm"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Used to generate "Open in Obsidian" links on food entries.
            </p>
          </div>

          <div className="border-t border-border" />

          {/* Numeric targets */}
          <div className="flex flex-col gap-8">
            <TargetField
              id="target-calories"
              label="Calories"
              unit="kcal"
              min={800}
              max={4000}
              step={50}
              value={draft.calories_kcal}
              onChange={field('calories_kcal')}
            />
            <TargetField
              id="target-protein"
              label="Protein"
              unit="g"
              min={40}
              max={300}
              step={5}
              value={draft.protein_g}
              onChange={field('protein_g')}
            />
            <TargetField
              id="target-carbs"
              label="Carbs"
              unit="g"
              min={50}
              max={500}
              step={5}
              value={draft.carbs_g}
              onChange={field('carbs_g')}
            />
            <TargetField
              id="target-fluids"
              label="Fluids"
              unit="ml"
              min={500}
              max={5000}
              step={100}
              value={draft.fluids_ml}
              onChange={field('fluids_ml')}
            />
            <TargetField
              id="target-weight"
              label="Target weight"
              unit="kg"
              min={40}
              max={200}
              step={0.5}
              value={draft.weight_kg}
              onChange={field('weight_kg')}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-3 mt-10">
          <SheetClose asChild>
            <Button type="button" size="lg" className="w-full h-12 text-base" onClick={handleApply}>
              Apply
            </Button>
          </SheetClose>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Reset to defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
