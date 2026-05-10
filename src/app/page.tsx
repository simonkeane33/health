'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useVaultData } from '@/hooks/useVaultData';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { KpiGrid } from '@/components/KpiGrid';
import { CaloriesWeightChart } from '@/components/CaloriesWeightChart';
import { ReviewQueue } from '@/components/ReviewQueue';
import { RecentEntries } from '@/components/RecentEntries';
import { FrequentFoods } from '@/components/FrequentFoods';
import { DailySummaries } from '@/components/DailySummaries';
import { ExerciseCard } from '@/components/ExerciseCard';
import { useTheme } from '@/components/ThemeProvider';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

export default function Home() {
  const { data, loading, error, loadFiles } = useVaultData();
  const { theme } = useTheme();
  const [range, setRange] = useState<RangeValue>('30');

  const loadStatus = data
    ? `${data.foodEntries.length} food, ${data.weightEntries.length} weight, ${data.exerciseEntries.length} exercise, ${data.dailySummaries.length} days`
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
      <div className="min-h-svh flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading vault data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <p className="text-destructive font-medium">Error: {error}</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar {...sidebarProps} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex flex-col gap-4">
              {!data ? (
                <Card>
                  <CardContent className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-end gap-6 p-6">
                    <div className="space-y-4">
                      <Badge variant="secondary">
                        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary"></span>
                        Waiting for notes
                      </Badge>
                      <CardTitle className="text-2xl leading-tight">
                        Your intake and weight, read straight from Obsidian.
                      </CardTitle>
                      <p className="text-muted-foreground">
                        This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-end gap-6 p-6">
                      <div className="space-y-4">
                        <Badge variant="secondary">
                          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary"></span>
                          Vault parsed successfully
                        </Badge>
                        <CardTitle className="text-2xl leading-tight">
                          Your intake and weight, read straight from Obsidian.
                        </CardTitle>
                        <p className="text-muted-foreground">
                          This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium uppercase text-muted-foreground">Entries</div>
                          <strong className="block text-2xl tabular-nums">{data.allEntries.length}</strong>
                          <p className="text-muted-foreground">Food + weight + summaries</p>
                        </div>
                        <div>
                          <div className="text-xs font-medium uppercase text-muted-foreground">Coverage</div>
                          <strong className="block text-2xl tabular-nums">{data.dailySummaries.length}</strong>
                          <p className="text-muted-foreground">Tracked days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <KpiGrid data={data} />

                  <ExerciseCard entries={data.exerciseEntries} />

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardDescription>Trends</CardDescription>
                        <CardTitle>Calories and weight</CardTitle>
                      </div>
                      <span className="text-muted-foreground text-sm">{range === 'all' ? 'All time' : range === '365' ? 'Last year' : `Last ${range} days`}</span>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-80">
                        <CaloriesWeightChart summaries={data.dailySummaries} range={range} theme={theme} />
                      </div>
                    </CardContent>
                  </Card>

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
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
