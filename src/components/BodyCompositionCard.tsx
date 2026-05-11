'use client';

import type { DailySummary } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Props {
  summaries: DailySummary[];
}

export function BodyCompositionCard({ summaries }: Props) {
  const latest = summaries[0];
  if (!latest) return null;

  const hasData = latest.weight_kg != null || latest.bmi != null || latest.body_fat_pct != null;
  if (!hasData) return null;

  const prev = summaries[1];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Body Composition</CardTitle>
          <p className="text-xs text-muted-foreground">Latest measurement</p>
        </div>
        {latest.entry_date && (
          <span className="text-xs text-muted-foreground">
            {new Date(latest.entry_date + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary metrics — the three components that total 100% and fill the bar */}
        {latest.body_fat_pct != null && latest.muscle_mass_pct != null && latest.bone_mass_pct != null && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Metric label="Fat Mass" value={latest.body_fat_pct} unit="%" decimals={1} prev={prev?.body_fat_pct} />
              <Metric label="Muscle Mass" value={latest.muscle_mass_pct} unit="%" decimals={1} prev={prev?.muscle_mass_pct} />
              <Metric label="Bone Mass" value={latest.bone_mass_pct} unit="%" decimals={1} prev={prev?.bone_mass_pct} />
            </div>

            {/* Segmented bar visualization */}
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full flex overflow-hidden">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${latest.body_fat_pct}%` }}
                />
                <div
                  className="h-full bg-indigo-400"
                  style={{ width: `${latest.muscle_mass_pct}%` }}
                />
                <div
                  className="h-full bg-indigo-700"
                  style={{ width: `${latest.bone_mass_pct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <LegendItem color="bg-cyan-400" label="Fat Mass" value={latest.body_fat_pct} />
                <LegendItem color="bg-indigo-400" label="Muscle Mass" value={latest.muscle_mass_pct} />
                <LegendItem color="bg-indigo-700" label="Bone Mass" value={latest.bone_mass_pct} />
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  unit,
  decimals = 1,
  prev,
}: {
  label: string;
  value?: number;
  unit: string;
  decimals?: number;
  prev?: number;
}) {
  if (value == null) {
    return (
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tabular-nums">—</p>
      </div>
    );
  }

  const diff = prev != null ? value - prev : undefined;

  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">
        {formatNumber(value, decimals)}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </p>
      {diff != null && (
        <span className={`text-xs ${diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {diff > 0 ? '+' : ''}{formatNumber(diff, decimals)} {unit}
        </span>
      )}
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
      {value != null && <span className="font-medium tabular-nums">{value.toFixed(1)}%</span>}
    </div>
  );
}
