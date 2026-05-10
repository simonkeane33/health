'use client';

import { useState } from 'react';
import { useVaultData } from '@/hooks/useVaultData';
import { Sidebar } from '@/components/Sidebar';
import { KpiGrid } from '@/components/KpiGrid';
import { CaloriesWeightChart } from '@/components/CaloriesWeightChart';
import { ReviewQueue } from '@/components/ReviewQueue';
import { RecentEntries } from '@/components/RecentEntries';
import { FrequentFoods } from '@/components/FrequentFoods';
import { DailySummaries } from '@/components/DailySummaries';
import { VaultPicker } from '@/components/VaultPicker';
import { useTheme } from '@/components/ThemeProvider';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

export default function Home() {
  const { data, loading, error, loadFiles } = useVaultData();
  const { theme } = useTheme();
  const [range, setRange] = useState<RangeValue>('30');

  const loadStatus = data
    ? `${data.foodEntries.length} food, ${data.weightEntries.length} weight, ${data.dailySummaries.length} days`
    : 'No notes loaded yet.';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--hv-bg)' }}>
        <p className="subtle">Loading vault data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--hv-bg)' }}>
        <p style={{ color: 'var(--hv-error)' }}>Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-shell">
        <Sidebar
          onPick={loadFiles}
          onClear={() => loadFiles(null)}
          loadStatus={loadStatus}
          entryCount={undefined}
          dayCount={undefined}
          range={String(range)}
          onRangeChange={(v) => setRange(v as RangeValue)}
        />
        <main className="content" id="main">
          <section className="panel hero-card">
            <div className="hero-grid">
              <div>
                <div className="status-pill">
                  <span className="dot" style={{ background: 'var(--hv-teal)' }} />
                  <span>Waiting for notes</span>
                </div>
                <h2>Your intake and weight, read straight from Obsidian.</h2>
                <p>
                  This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4" />
            </div>
          </section>
          <VaultPicker onPick={loadFiles} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        onPick={loadFiles}
        onClear={() => loadFiles(null)}
        loadStatus={loadStatus}
        entryCount={data.foodEntries.length}
        dayCount={data.dailySummaries.length}
        range={String(range)}
        onRangeChange={(v) => setRange(v as RangeValue)}
      />
      <main className="content" id="main">
        {/* Hero */}
        <section className="panel hero-card">
          <div className="hero-grid">
            <div>
              <div className="status-pill">
                <span className="dot" style={{ background: 'var(--hv-teal)' }} />
                <span>Vault parsed successfully</span>
              </div>
              <h2>Your intake and weight, read straight from Obsidian.</h2>
              <p>
                This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="micro-label">Entries</div>
                <strong style={{ fontSize: 'var(--text-xl)', fontVariantNumeric: 'tabular-nums' }}>
                  {data.allEntries.length}
                </strong>
                <p className="subtle">Food + weight + summaries</p>
              </div>
              <div>
                <div className="micro-label">Coverage</div>
                <strong style={{ fontSize: 'var(--text-xl)', fontVariantNumeric: 'tabular-nums' }}>
                  {data.dailySummaries.length}
                </strong>
                <p className="subtle">Tracked days</p>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <KpiGrid data={data} />

        {/* Chart */}
        <section className="panel">
          <div className="card-head">
            <div>
              <div className="micro-label">Trends</div>
              <h2>Calories and weight</h2>
            </div>
            <div className="subtle">{range === '365' ? 'Last year' : `Last ${range} days`}</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap">
              <CaloriesWeightChart summaries={data.dailySummaries} range={range} theme={theme} />
            </div>
          </div>
        </section>

        {/* Content grid */}
        <div className="main-grid">
          <div className="stack">
            <RecentEntries entries={data.foodEntries} />
            <DailySummaries entries={data.dailySummaries} />
          </div>
          <div className="stack">
            <ReviewQueue entries={data.foodEntries} />
            <FrequentFoods entries={data.foodEntries} />
          </div>
        </div>
      </main>
    </div>
  );
}
