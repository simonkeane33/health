'use client';

import { useState } from 'react';
import { useVaultData } from '@/hooks/useVaultData';
import { VaultPicker } from '@/components/VaultPicker';
import { KpiGrid } from '@/components/KpiGrid';
import { WeightChart } from '@/components/WeightChart';
import { ReviewQueue } from '@/components/ReviewQueue';
import { RecentEntries } from '@/components/RecentEntries';
import { FrequentFoods } from '@/components/FrequentFoods';

export default function Home() {
  const { data, loading, error, loadFiles } = useVaultData();
  const [range, setRange] = useState<'7' | '14' | '30' | '90' | '365' | 'all'>('all');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading vault data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-rose-600">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Health Vault Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Load your Obsidian vault health data to see trends, review queues, and daily summaries.
          </p>
        </div>
        <VaultPicker onPick={loadFiles} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Health Vault Dashboard</h1>
            <p className="text-slate-500 mt-1">
              {data.weightEntries.length} weight entries · {data.foodEntries.length} food entries · {data.dailySummaries.length} daily summaries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={() => loadFiles(null)}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* KPIs */}
        <KpiGrid data={data} />

        {/* Chart */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Weight trend</h3>
            <span className="text-xs text-slate-400">{range === 'all' ? 'All time' : `Last ${range} days`}</span>
          </div>
          <WeightChart entries={data.weightEntries} range={range} />
        </div>

        {/* Grid: Review + Recent + Frequent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ReviewQueue entries={data.foodEntries} />
          <RecentEntries data={data} />
          <FrequentFoods entries={data.foodEntries} />
        </div>
      </div>
    </div>
  );
}
