'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useVaultData } from '@/hooks/useVaultData';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import { KpiGrid } from '@/components/KpiGrid';
import { CaloriesWeightChart } from '@/components/CaloriesWeightChart';
import { ReviewQueue } from '@/components/ReviewQueue';
import { RecentEntries } from '@/components/RecentEntries';
import { FrequentFoods } from '@/components/FrequentFoods';
import { DailySummaries } from '@/components/DailySummaries';
import { useTheme } from '@/components/ThemeProvider';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

export default function Home() {
  const { data, loading, error, loadFiles } = useVaultData();
  const { theme } = useTheme();
  const [range, setRange] = useState<RangeValue>('30');

  const loadStatus = data
    ? `${data.foodEntries.length} food, ${data.weightEntries.length} weight, ${data.dailySummaries.length} days`
    : 'No notes loaded yet.';

  const sidebarProps = {
    onPick: loadFiles,
    onClear: () => loadFiles(null),
    loadStatus,
    entryCount: data?.foodEntries.length,
    dayCount: data?.dailySummaries.length,
    range: String(range),
    onRangeChange: (v: string) => setRange(v as RangeValue),
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading vault data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-destructive font-medium">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] min-h-[100dvh]">
        <div className="hidden lg:block">
          <Sidebar {...sidebarProps} />
        </div>
        <main className="p-6 flex flex-col gap-6 min-w-0" id="main">
          <div className="flex items-center gap-3 lg:hidden">
            <MobileSidebar {...sidebarProps} />
            <span className="font-semibold">Health Vault</span>
          </div>
          <Card className="overflow-hidden bg-gradient-to-br from-primary/[6%] to-card">
            <CardContent className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-end gap-6 p-[clamp(1.25rem,2vw,2rem)]">
              <div className="space-y-4">
                <Badge variant="secondary" className="rounded-full bg-secondary/80 border border-border">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block mr-1"></span>
                  Waiting for notes
                </Badge>
                <CardTitle className="text-[clamp(1.5rem,1.2rem_+_1.25vw,2.25rem)] leading-tight m-0 block max-w-[16ch]">
                  Your intake and weight, read straight from Obsidian.
                </CardTitle>
                <p className="text-muted-foreground max-w-[58ch] m-0">
                  This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] min-h-[100dvh]">
      <div className="hidden lg:block">
        <Sidebar {...sidebarProps} />
      </div>
      <main className="gap-6 min-w-0 p-6 flex flex-col" id="main">
        <div className="flex items-center gap-3 lg:hidden">
          <MobileSidebar {...sidebarProps} />
          <span className="font-semibold">Health Vault</span>
        </div>

        {/* Hero */}
        <Card className="overflow-hidden bg-gradient-to-br from-primary/[6%] to-card border border-border ring-1 ring-foreground/5">
          <CardContent className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-end gap-6 p-[clamp(1.25rem,2vw,2rem)]">
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full bg-secondary/80 border border-border">
                <span className="w-2 h-2 rounded-full bg-primary inline-block mr-1"></span>
                Vault parsed successfully
              </Badge>
              <CardTitle className="text-[clamp(1.5rem,1.2rem_+_1.25vw,2.25rem)] leading-tight m-0 block max-w-[16ch]">
                Your intake and weight, read straight from Obsidian.
              </CardTitle>
              <p className="text-muted-foreground max-w-[58ch] m-0">
                This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Entries</div>
                <strong className="block text-[clamp(1.5rem,1.2rem_+_1.25vw,2.25rem)] tabular-nums">
                  {data.allEntries.length}
                </strong>
                <p className="text-muted-foreground">Food + weight + summaries</p>
              </div>
              <div>
                <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Coverage</div>
                <strong className="block text-[clamp(1.5rem,1.2rem_+_1.25vw,2.25rem)] tabular-nums">
                  {data.dailySummaries.length}
                </strong>
                <p className="text-muted-foreground">Tracked days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <KpiGrid data={data} />

        {/* Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardDescription className="text-xs font-medium tracking-wider uppercase">Trends</CardDescription>
              <CardTitle className="text-[clamp(1.125rem,1rem_+.75vw,1.5rem)] leading-[1.15]">Calories and weight</CardTitle>
            </div>
            <span className="text-muted-foreground text-sm">{range === 'all' ? 'All time' : range === '365' ? 'Last year' : `Last ${range} days`}</span>
          </CardHeader>
          <CardContent>
            <div className="relative h-80">
              <CaloriesWeightChart summaries={data.dailySummaries} range={range} theme={theme} />
            </div>
          </CardContent>
        </Card>

        {/* Content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] gap-4">
          <div className="flex flex-col gap-4 min-w-0">
            <RecentEntries entries={data.foodEntries} />
            <DailySummaries entries={data.dailySummaries} />
          </div>
          <div className="flex flex-col gap-4 min-w-0">
            <ReviewQueue entries={data.foodEntries} />
            <FrequentFoods entries={data.foodEntries} />
          </div>
        </div>
      </main>
    </div>
  );
}
