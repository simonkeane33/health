'use client';

import { useState } from 'react';
import { useVaultData } from '@/hooks/useVaultData';
import { VaultPicker } from '@/components/VaultPicker';
import { KpiGrid } from '@/components/KpiGrid';
import { WeightChart } from '@/components/WeightChart';
import { ReviewQueue } from '@/components/ReviewQueue';
import { RecentEntries } from '@/components/RecentEntries';
import { FrequentFoods } from '@/components/FrequentFoods';
import { DailySummaries } from '@/components/DailySummaries';

export default function Home() {
  const { data, loading, error, loadFiles } = useVaultData();
  const [range, setRange] = useState<'7' | '14' | '30' | '90' | '365' | 'all'>('all');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#68655f]">Loading vault data...</p>
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
          <h1 className="text-2xl font-semibold text-[#28251d]">Health Vault Dashboard</h1>
          <p className="text-[#68655f] mt-1">
            Load your Obsidian vault health data to see trends, review queues, and daily summaries.
          </p>
        </div>
        <VaultPicker onPick={loadFiles} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen" style={{ gridTemplateColumns: '300px minmax(0, 1fr)' }}>
        {/* Sidebar */}
        <aside className="border-r border-[rgba(40,37,29,0.12)] flex flex-col gap-6 p-6 bg-[color-mix(in_oklab,#f9f8f5_90%,#f7f6f2)]">
          <div className="flex items-center gap-3">
            <div
              className="w-[42px] h-[42px] rounded-[14px] grid place-items-center text-[#01696f]"
              style={{ background: 'var(--hv-surface-accent)', boxShadow: 'inset 0 0 0 1px var(--hv-border)' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3c2.5 0 4 1.5 4 3.5 0 1.4-.6 2.4-1.8 3.4 2.5.8 4.3 3 4.3 5.7 0 3.5-2.9 5.9-6.5 5.9S5.5 19.1 5.5 15.6c0-2.7 1.8-4.9 4.3-5.7C8.6 8.9 8 7.9 8 6.5 8 4.5 9.5 3 12 3Z" />
                <path d="M12 8.3v7.8" />
                <path d="M8.9 12.1H15" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#28251d] leading-tight">Health Vault</h1>
              <p className="text-sm text-[#68655f] mt-0.5">Browser dashboard for your Obsidian intake notes.</p>
            </div>
          </div>

          <div className="panel p-4 flex flex-col gap-4">
            <div>
              <div className="micro-label">Import</div>
              <h2 className="text-lg font-semibold text-[#28251d] mt-1">Load your vault notes</h2>
            </div>
            <div className="flex flex-col gap-2">
              <VaultPicker onPick={loadFiles} />
            </div>
            <div>
              <div className="micro-label">Status</div>
              <p className="text-sm text-[#68655f] mt-1">
                {data.foodEntries.length} food, {data.weightEntries.length} weight, {data.dailySummaries.length} days
              </p>
            </div>
          </div>

          <div className="panel p-4 flex flex-col gap-3">
            <div className="micro-label">Legend</div>
            <ul className="flex flex-col gap-2">
              <li className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f3f0ec]">
                <span className="flex items-center gap-2 text-sm text-[#28251d]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#01696f] shrink-0" /> Intake
                </span>
                <span className="text-xs text-[#68655f]">Calories</span>
              </li>
              <li className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f3f0ec]">
                <span className="flex items-center gap-2 text-sm text-[#28251d]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#437a22] shrink-0" /> Recovery
                </span>
                <span className="text-xs text-[#68655f]">Protein</span>
              </li>
              <li className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f3f0ec]">
                <span className="flex items-center gap-2 text-sm text-[#28251d]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#964219] shrink-0" /> Hydration
                </span>
                <span className="text-xs text-[#68655f]">Fluids</span>
              </li>
              <li className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f3f0ec]">
                <span className="flex items-center gap-2 text-sm text-[#28251d]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a12c7b] shrink-0" /> Review
                </span>
                <span className="text-xs text-[#68655f]">Uncertain</span>
              </li>
            </ul>
          </div>

          <div className="panel p-4 flex flex-col gap-3">
            <div className="micro-label">Controls</div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="w-full px-3 py-2.5 text-sm border border-[rgba(40,37,29,0.12)] rounded-lg text-[#28251d] bg-white cursor-pointer"
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
              className="w-full px-3 py-2.5 text-sm bg-[#f3f0ec] hover:bg-[#e8e5e1] text-[#28251d] rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="p-6 flex flex-col gap-6 min-w-0">
          {/* Hero */}
          <div
            className="panel p-6 gap-5"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in oklab, #01696f 9%, #f9f8f5) 0%, #f9f8f5 65%), #f9f8f5',
            }}
003e
            <div className="flex items-end gap-6">
              <div className="flex-1">
                <div className="status-pill">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#01696f] shrink-0" />
                  <span className="text-sm text-[#28251d]">{data.allEntries.length > 0 ? 'Vault parsed successfully' : 'Waiting for notes'}</span>
                </div>
                <h2 className="text-2xl font-semibold text-[#28251d] mt-3 leading-tight">
                  Your intake and weight, read straight from Obsidian.
                </h2>
                <p className="text-[#68655f] mt-2 max-w-xl text-sm leading-relaxed">
                  This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 min-w-[160px]">
                <div>
                  <div className="micro-label">Entries</div>
                  <strong className="text-2xl tabular-nums text-[#28251d]">{data.foodEntries.length}</strong>
                  <p className="text-xs text-[#68655f]">Food + drink</p>
                </div>
                <div>
                  <div className="micro-label">Coverage</div>
                  <strong className="text-2xl tabular-nums text-[#28251d]">{data.dailySummaries.length}</strong>
                  <p className="text-xs text-[#68655f]">Tracked days</p>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <KpiGrid data={data} />

          {/* Chart */}
          <div className="panel">
            <div className="p-5 flex items-start justify-between gap-4">
              <div>
                <div className="micro-label">Trends</div>
                <h2 className="text-lg font-semibold tracking-tight">Calories and weight</h2>
              </div>
              <div className="text-sm text-[#68655f]">
                {range === 'all' ? 'All time' : `Last ${range} days`}
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="h-[320px]">
                <WeightChart entries={data.weightEntries} range={range} />
              </div>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-[1.5fr_0.9fr] gap-4">
            <div className="flex flex-col gap-4">
              <RecentEntries entries={data.foodEntries} />
              <DailySummaries entries={data.dailySummaries} />
            </div>
            <div className="flex flex-col gap-4">
              <ReviewQueue entries={data.foodEntries} />
              <FrequentFoods entries={data.foodEntries} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
