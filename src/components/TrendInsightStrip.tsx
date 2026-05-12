'use client';

import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { DailySummary } from '@/lib/types';
import { buildTrendSummary } from '@/lib/trend-utils';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

interface Props {
  summaries: DailySummary[];
  range: RangeValue;
}

interface ChipProps {
  label: string;
  direction: 'up' | 'down' | 'stable';
  phrase: string;
  /** When true, "up" is bad (weight). When false, "down" is bad (calories under target). */
  upIsBad?: boolean;
}

function TrendChip({ label, direction, phrase, upIsBad = false }: ChipProps) {
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const colorClass =
    direction === 'stable'
      ? 'text-muted-foreground bg-muted border-border'
      : (upIsBad ? direction === 'up' : direction === 'down')
      ? 'text-destructive bg-destructive/10 border-destructive/20'
      : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';

  // Extract just the delta/stable portion for compact display
  const compactText = phrase
    .replace(/^(Weight|Calories|Protein|Sugar)\s+/i, '')
    .replace(/\s*(7-day|14-day|30-day|90-day|overall)\s*/i, ' ');

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${colorClass}`}>
      <span className="font-semibold text-[11px] tracking-wide">{label}</span>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="text-[11px]">{compactText}</span>
    </div>
  );
}

export function TrendInsightStrip({ summaries, range }: Props) {
  const summary = useMemo(() => buildTrendSummary(summaries, range), [summaries, range]);

  const hasAny = summary.weightTrend.hasData || summary.calorieTrend.hasData;
  if (!hasAny) return null;

  const rangeLabel = range === 'all' ? 'all time' : range === '7' ? 'this week' : range === '30' ? 'this month' : `${range} days`;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider shrink-0">
        Trend · {rangeLabel}
      </span>
      {summary.weightTrend.hasData && (
        <TrendChip
          label="Weight"
          direction={summary.weightTrend.direction}
          phrase={summary.weightPhrase}
          upIsBad
        />
      )}
      {summary.calorieTrend.hasData && (
        <TrendChip
          label="Calories"
          direction={summary.calorieTrend.direction}
          phrase={summary.caloriePhrase}
        />
      )}
      {summary.sugarTrend.hasData && (
        <TrendChip
          label="Sugar"
          direction={summary.sugarTrend.direction}
          phrase={summary.sugarTrend.direction === 'stable'
            ? 'Sugar stable'
            : `Sugar ${summary.sugarTrend.direction} ${Math.abs(summary.sugarTrend.delta).toFixed(0)} g`}
          upIsBad
        />
      )}
    </div>
  );
}
