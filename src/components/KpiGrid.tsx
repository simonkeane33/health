'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { VaultData } from '@/lib/types';

function Delta({ current, previous, unit }: { current: number; previous?: number; unit?: string }) {
  if (previous === undefined || previous === 0) {
    return <span className="delta text-[var(--hv-text-muted)]">—</span>;
  }
  const diff = current - previous;
  const pct = ((diff / previous) * 100).toFixed(1);
  const isDown = diff < 0;
  const Icon = isDown ? TrendingDown : diff > 0 ? TrendingUp : Minus;
  const colorVar = isDown ? 'var(--hv-success)' : diff > 0 ? 'var(--hv-error)' : 'var(--hv-text-muted)';

  return (
    <span className="delta flex items-center gap-1" style={{ color: colorVar }}>
      <Icon className="w-3 h-3" />
      {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit ? ` ${unit}` : ''} ({pct}%)
    </span>
  );
}

export function KpiGrid({ data }: { data?: VaultData | null }) {
  if (!data) {
    return (
      <div className="kpi-grid">
        {['Latest weight', 'Calories today', 'Protein today', 'Fluids today'].map((label) => (
          <div key={label} className="kpi panel">
            <span className="micro-label">{label}</span>
            <strong>—</strong>
            <span className="delta text-[var(--hv-text-muted)]">No data</span>
          </div>
        ))}
      </div>
    );
  }

  const latestWeight = data.weightEntries[0];
  const prevWeight = data.weightEntries[1];
  const latestSummary = data.dailySummaries[0];
  const prevSummary = data.dailySummaries[1];

  const days = data.weightEntries.length;
  const weightTarget = 90;
  const weightCurrent = latestWeight?.weight_kg ?? 0;
  const weightRemaining = Math.max(0, weightCurrent - weightTarget);

  return (
    <div className="kpi-grid">
      <div className="kpi panel">
        <span className="micro-label">Latest weight</span>
        <strong>{weightCurrent.toFixed(1)} kg</strong>
        <Delta current={weightCurrent} previous={prevWeight?.weight_kg} unit="kg" />
        <span className="subtle">{weightRemaining.toFixed(1)} kg to 90 kg target · {days} days tracked</span>
      </div>
      <div className="kpi panel">
        <span className="micro-label">Calories today</span>
        <strong>{latestSummary?.total_calories?.toString() ?? '—'}</strong>
        <Delta current={latestSummary?.total_calories ?? 0} previous={prevSummary?.total_calories ?? 0} />
        <span className="subtle">{latestSummary ? `${latestSummary.food_entries ?? 0} entries` : 'No summary yet'}</span>
      </div>
      <div className="kpi panel">
        <span className="micro-label">Protein today</span>
        <strong>{latestSummary?.protein_g ? `${latestSummary.protein_g}g` : '—'}</strong>
        <Delta current={latestSummary?.protein_g ?? 0} previous={prevSummary?.protein_g ?? 0} unit="g" />
      </div>
      <div className="kpi panel">
        <span className="micro-label">Fluids today</span>
        <strong>{latestSummary?.fluids_ml ? `${latestSummary.fluids_ml}ml` : '—'}</strong>
        <Delta current={latestSummary?.fluids_ml ?? 0} previous={prevSummary?.fluids_ml ?? 0} unit="ml" />
      </div>
    </div>
  );
}
