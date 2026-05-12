'use client';

import { useRef, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVaultData } from '@/hooks/useVaultData';
import { KpiGrid } from '@/components/KpiGrid';
import { WeightTrendChart, IntakeTrendChart, CombinedCaloriesWeightChart } from '@/components/CaloriesWeightChart';
import { ReviewQueue } from '@/components/ReviewQueue';
import { RecentEntries } from '@/components/RecentEntries';
import { FrequentFoods } from '@/components/FrequentFoods';
import { FoodVsDrinkCard } from '@/components/FoodVsDrinkCard';
import { RecurringFoodsPanel } from '@/components/RecurringFoodsPanel';
import { RecurringDrinksPanel } from '@/components/RecurringDrinksPanel';
import { HighestCalorieItems } from '@/components/HighestCalorieItems';
import { DailySummaries } from '@/components/DailySummaries';
import { ExerciseCard } from '@/components/ExerciseCard';
import { BodyCompositionCard } from '@/components/BodyCompositionCard';
import { DailyMacroCard } from '@/components/DailyMacroCard';
import { WeeklyMacroChart } from '@/components/WeeklyMacroChart';
import { DataHealthCard } from '@/components/DataHealthCard';
import { WeeklyAdherenceCard } from '@/components/WeeklyAdherenceCard';
import { ThemeToggle } from '@/components/ThemeToggle';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

function RangeFilter({
  value,
  onChange,
}: {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(v as RangeValue)}>
      <SelectTrigger className="h-7 text-xs w-[100px] bg-background/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">7 days</SelectItem>
        <SelectItem value="14">14 days</SelectItem>
        <SelectItem value="30">30 days</SelectItem>
        <SelectItem value="90">90 days</SelectItem>
        <SelectItem value="365">1 year</SelectItem>
        <SelectItem value="all">All time</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function Home() {
  const { data, loading, error, loadFiles } = useVaultData();
  const [intakeRange, setIntakeRange] = useState<RangeValue>('30');
  const [weightRange, setWeightRange] = useState<RangeValue>('30');
  const [combinedRange, setCombinedRange] = useState<RangeValue>('30');
  const inputRef = useRef<HTMLInputElement>(null);

  const loadStatus = data
    ? `${data.foodEntries.length} food · ${data.weightEntries.length} weight · ${data.exerciseEntries.length} exercise · ${data.dailySummaries.length} days`
    : 'No notes loaded yet.';

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
    <div className="min-h-svh bg-background">
      {/* Page header — vault controls + theme */}
      <header className="border-b px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-8 w-8">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c2.5 0 4 1.5 4 3.5 0 1.4-.6 2.4-1.8 3.4 2.5.8 4.3 3 4.3 5.7 0 3.5-2.9 5.9-6.5 5.9S5.5 19.1 5.5 15.6c0-2.7 1.8-4.9 4.3-5.7C8.6 8.9 8 7.9 8 6.5 8 4.5 9.5 3 12 3Z" />
              <path d="M12 8.3v7.8" />
              <path d="M8.9 12.1H15" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Health Vault</h1>
            <p className="text-[11px] text-muted-foreground">Health dashboard from your Obsidian notes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Vault paired
            </Badge>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".md,.markdown,text/markdown"
            className="hidden"
            onChange={(e) => loadFiles(e.target.files)}
            // @ts-expect-error — well-supported for folder selection
            webkitdirectory=""
            directory=""
          />
          <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>
            <FolderOpen className="mr-1 h-4 w-4" />
            Select folder
          </Button>

          {data && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => loadFiles(null)}
            >
              Clear
            </Button>
          )}

          <ThemeToggle className="h-8 w-8 rounded-lg border" size="sm" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {!data ? (
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-end gap-6 p-6">
              <div className="space-y-4">
                <Badge variant="secondary">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />
                  Waiting for notes
                </Badge>
                <CardTitle className="text-2xl leading-tight">
                  Your food, weight and exercise, read straight from Obsidian.
                </CardTitle>
                <p className="text-muted-foreground">
                  This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.
                </p>
              </div>
              <div className="text-xs text-muted-foreground self-center">
                Pick your Health folder to get started.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPIs */}
            <KpiGrid data={data} />

            {/* Data health */}
            <DataHealthCard data={data} />

            {/* Weekly adherence */}
            <WeeklyAdherenceCard summaries={data.dailySummaries} />

            {/* Body Composition */}
            <BodyCompositionCard summaries={data.dailySummaries} />

            {/* Combined Calories + Weight Trend — full width */}
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardDescription>Trend</CardDescription>
                  <CardTitle>Calories & Weight</CardTitle>
                </div>
                <RangeFilter value={combinedRange} onChange={setCombinedRange} />
              </CardHeader>
              <CardContent className="flex-1">
                <CombinedCaloriesWeightChart summaries={data.dailySummaries} range={combinedRange} />
              </CardContent>
            </Card>

            {/* Charts — side by side, each with its own range filter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardDescription>Intake</CardDescription>
                    <CardTitle>Calories</CardTitle>
                  </div>
                  <RangeFilter value={intakeRange} onChange={setIntakeRange} />
                </CardHeader>
                <CardContent className="flex-1">
                  <IntakeTrendChart summaries={data.dailySummaries} range={intakeRange} />
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardDescription>Trend</CardDescription>
                    <CardTitle>Weight</CardTitle>
                  </div>
                  <RangeFilter value={weightRange} onChange={setWeightRange} />
                </CardHeader>
                <CardContent className="flex-1">
                  <WeightTrendChart summaries={data.dailySummaries} range={weightRange} />
                </CardContent>
              </Card>
            </div>

            {/* Exercise — full width below chart */}
            <ExerciseCard entries={data.exerciseEntries} />

            {/* Tables section — full width, stacked vertically */}
            <div className="flex flex-col gap-4">
              <RecentEntries entries={data.foodEntries} />
              <DailySummaries entries={data.dailySummaries} />
            </div>

            {/* Weekly macro breakdown — full width */}
            <WeeklyMacroChart summaries={data.dailySummaries} />

            {/* Bottom row — Review, patterns, rankings, macros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                <ReviewQueue entries={data.foodEntries} />
                <DailyMacroCard summary={data.dailySummaries[0]} />
                <FoodVsDrinkCard entries={data.foodEntries} />
                <FrequentFoods entries={data.foodEntries} />
              </div>
              <div className="flex flex-col gap-4">
                <RecurringFoodsPanel entries={data.foodEntries} />
                <RecurringDrinksPanel entries={data.foodEntries} />
                <HighestCalorieItems entries={data.foodEntries} />
              </div>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground py-2">
              <span>Files stay on your device. Nothing is uploaded.</span>
              <span>{loadStatus}</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
