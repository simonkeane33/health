'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { VaultData } from '@/lib/types';

function Delta({ current, previous, unit }: { current: number; previous?: number; unit?: string }) {
  if (previous === undefined || previous === 0) {
    return <span className="text-slate-400 text-xs">—</span>;
  }
  const diff = current - previous;
  const pct = ((diff / previous) * 100).toFixed(1);
  const isDown = diff < 0;
  const Icon = isDown ? TrendingDown : diff > 0 ? TrendingUp : Minus;
  const color = isDown ? 'text-emerald-600' : diff > 0 ? 'text-rose-600' : 'text-slate-400';

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit ? ` ${unit}` : ''} ({pct}%)
    </span>
  );
}

export function KpiGrid({ data }: { data: VaultData }) {
  const latestWeight = data.weightEntries[0];
  const prevWeight = data.weightEntries[1];
  const latestSummary = data.dailySummaries[0];
  const prevSummary = data.dailySummaries[1];

  const days = data.weightEntries.length;
  const weightTarget = 90;
  const weightCurrent = latestWeight?.weight_kg ?? 0;
  const weightRemaining = Math.max(0, weightCurrent - weightTarget);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Latest weight"
        value={`${weightCurrent.toFixed(1)} kg`}
        delta={<Delta current={weightCurrent} previous={prevWeight?.weight_kg} unit="kg" />}
        sub={`${weightRemaining.toFixed(1)} kg to 90 kg target · ${days} days tracked`}
      />
      <KpiCard
        label="Calories today"
        value={latestSummary?.total_calories?.toString() ?? '—'}
        delta={<Delta current={latestSummary?.total_calories ?? 0} previous={prevSummary?.total_calories ?? 0} />}
        sub={latestSummary ? `${latestSummary.food_entries ?? 0} entries` : 'No summary yet'}
      />
      <KpiCard
        label="Protein today"
        value={latestSummary?.protein_g ? `${latestSummary.protein_g}g` : '—'}
        delta={<Delta current={latestSummary?.protein_g ?? 0} previous={prevSummary?.protein_g ?? 0} unit="g" />}
      />
      <KpiCard
        label="Fluids today"
        value={latestSummary?.fluids_ml ? `${latestSummary.fluids_ml}ml` : '—'}
        delta={<Delta current={latestSummary?.fluids_ml ?? 0} previous={prevSummary?.fluids_ml ?? 0} unit="ml" />}
      />
    </div>
  );
}

function KpiCard({ label, value, delta, sub }: {
  label: string;
  value: string;
  delta: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <div className="mt-1">{delta}</div>
      {sub && <p className="mt-2 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
