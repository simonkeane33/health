'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { FolderOpen, RefreshCw, ChevronLeft, ChevronRight, Clock, CalendarIcon } from 'lucide-react';
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
import { WeeklyAdherenceCard } from '@/components/WeeklyAdherenceCard';
import { TrendInsightStrip } from '@/components/TrendInsightStrip';
import { CoachFeedbackCard } from '@/components/CoachFeedbackCard';
import { MealTypeChart } from '@/components/MealTypeChart';
import { WeekdayPatternsCard } from '@/components/WeekdayPatternsCard';
import { SectionNav } from '@/components/SectionNav';
import { TargetsSheet } from '@/components/TargetsSheet';
import { TargetsProvider, useTargets } from '@/lib/targets-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DEFAULT_TARGETS } from '@/lib/targets';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EntryEditSheet } from '@/components/EntryEditSheet';
import type { FoodEntry } from '@/lib/types';

type RangeValue = '7' | '14' | '30' | '90' | '365' | 'all';

/** Always returns YYYY-MM-DD in the user's local timezone — never UTC. */
function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Time machine date selector                                          */
/* ------------------------------------------------------------------ */

function DateMachine({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const todayStr = localDateStr();
  const isToday = value === todayStr;
  const [open, setOpen] = useState(false);

  const selectedDay = new Date(value + 'T00:00:00');
  const today = new Date(); // use actual now — react-day-picker compares by day

  const shift = (days: number) => {
    const d = new Date(value + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const next = localDateStr(d);
    if (next <= todayStr) onChange(next);
  };

  const formatted = selectedDay.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex items-center gap-1.5">
      <Clock className={`w-3.5 h-3.5 shrink-0 ${isToday ? 'text-muted-foreground' : 'text-primary'}`} />
      <span className={`text-xs font-medium ${isToday ? 'text-muted-foreground' : 'text-primary'}`}>
        {isToday ? 'Today' : 'Time machine'}
      </span>

      <div className="flex items-center gap-0.5 ml-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => shift(-1)}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 px-2.5 text-xs font-medium gap-1.5 ${
                isToday ? '' : 'border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <CalendarIcon className="w-3 h-3 shrink-0" />
              {formatted}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={(day) => {
                if (day) {
                  const str = localDateStr(day);
                  if (str <= todayStr) {
                    onChange(str);
                    setOpen(false);
                  }
                }
              }}
              disabled={{ after: today }}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => shift(1)}
          disabled={isToday}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={() => onChange(todayStr)}
        >
          Back to today
        </Button>
      )}
    </div>
  );
}

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
  return (
    <TargetsProvider>
      <HomeInner />
    </TargetsProvider>
  );
}

function HomeInner() {
  const { data, loading, error, progress, supportsDirectoryPicker, savedVaultName, reconnectNeeded, reconnect, refresh, openDirectoryPicker, loadFiles, clearData, confirmEntry, editEntry: editEntryFn } = useVaultData();
  const { setTargets } = useTargets();
  const [intakeRange, setIntakeRange] = useState<RangeValue>('30');
  const [weightRange, setWeightRange] = useState<RangeValue>('365');
  const [combinedRange, setCombinedRange] = useState<RangeValue>('30');
  const [selectedDate, setSelectedDate] = useState<string>(() => localDateStr());
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const handleConfirm = useCallback(async (id: string): Promise<string> => {
    return confirmEntry(id);
  }, [confirmEntry]);

  const handleEdit = useCallback((id: string) => {
    const entry = data?.foodEntries.find((e) => e.id === id) ?? null;
    setEditingEntry(entry);
    setEditSheetOpen(true);
  }, [data]);

  // Sync vault-parsed targets into context whenever data loads
  useEffect(() => {
    if (data?.vaultTargets) {
      setTargets({ ...DEFAULT_TARGETS, ...data.vaultTargets });
    }
  }, [data?.vaultTargets, setTargets]);

  const loadStatus = data
    ? `${data.foodEntries.length} food · ${data.weightEntries.length} weight · ${data.exerciseEntries.length} exercise · ${data.dailySummaries.length} days · ${data.feedbackEntries.length} feedback`
    : 'No notes loaded yet.';

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
          {data && !loading && (
            <DateMachine value={selectedDate} onChange={setSelectedDate} />
          )}

          {data && !loading && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Vault paired
            </Badge>
          )}

          {/* Hidden fallback input for browsers without showDirectoryPicker */}
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

          {reconnectNeeded ? (
            /* Permission lapsed after browser restart — one click to restore */
            <Button type="button" size="sm" onClick={reconnect} disabled={loading}>
              <FolderOpen className="mr-1 h-4 w-4" />
              Reconnect "{savedVaultName}"
            </Button>
          ) : !data && !loading ? (
            /* No vault loaded yet — show folder picker */
            <Button
              type="button"
              size="sm"
              onClick={() => supportsDirectoryPicker ? openDirectoryPicker() : inputRef.current?.click()}
            >
              <FolderOpen className="mr-1 h-4 w-4" />
              Select folder
            </Button>
          ) : null}

          {data && !loading && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={refresh}
                title="Re-scan vault for new entries"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={clearData}
                title="Disconnect vault"
              >
                <FolderOpen className="mr-1 h-4 w-4" />
                {savedVaultName ?? 'Vault'} ✕
              </Button>
            </>
          )}

          <TargetsSheet />
          <ThemeToggle className="h-8 w-8 rounded-lg border" size="sm" />
        </div>
      </header>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 shadow-xl w-80">
            {/* Spinner */}
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>

            {progress ? (
              <>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">
                    {progress.phase === 'reading' ? 'Reading vault…' : 'Parsing notes…'}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {progress.processed.toLocaleString()}
                    {progress.total > 0 && ` / ${progress.total.toLocaleString()}`} files
                  </p>
                </div>
                {progress.total > 0 && (
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-150"
                      style={{ width: `${Math.round((progress.processed / progress.total) * 100)}%` }}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Reading vault…</p>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {!data && !loading && (
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] items-end gap-6 p-6">
              <div className="space-y-4">
                <Badge variant="secondary">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />
                  {reconnectNeeded ? 'Vault disconnected' : 'Waiting for notes'}
                </Badge>
                <CardTitle className="text-2xl leading-tight">
                  Your food, weight and exercise, read straight from Obsidian.
                </CardTitle>
                <p className="text-muted-foreground">
                  {reconnectNeeded
                    ? `Click "Reconnect \\"${savedVaultName}\\"" above to restore access — no folder picking needed.`
                    : 'This dashboard parses your Markdown health notes in the browser, rolls them into daily summaries, and gives you a cleaner overview than raw vault browsing.'}
                </p>
              </div>
              <div className="text-xs text-muted-foreground self-center">
                {reconnectNeeded
                  ? 'Permission resets when the browser restarts. One click to restore.'
                  : 'Pick your Health folder to get started. Your choice is remembered.'}
              </div>
            </CardContent>
          </Card>
        )}
        {data && (
          <>
            <SectionNav />

            {/* Derive per-date slices for the time machine */}
            {(() => {
              const dayFoodEntries = data.foodEntries.filter((e) => e.entry_date === selectedDate);
              const dayExerciseEntries = data.exerciseEntries.filter((e) => e.entry_date === selectedDate);
              const daySummary = data.dailySummaries.find((s) => s.entry_date === selectedDate);
              const isToday = selectedDate === localDateStr();

              return (
                <>
                  {/* TODAY: KPIs, adherence, data health */}
                  <section id="today" className="flex flex-col gap-4 scroll-mt-20">
                    <KpiGrid data={data} selectedDate={selectedDate} />
                    <CoachFeedbackCard entries={data.feedbackEntries} selectedDate={selectedDate} />
                    <TrendInsightStrip summaries={data.dailySummaries} range={combinedRange} />
                    <WeeklyAdherenceCard summaries={data.dailySummaries} />
                    <BodyCompositionCard summaries={data.dailySummaries} />
                  </section>

                  {/* TRENDS: charts — always show full history */}
                  <section id="trends" className="flex flex-col gap-4 scroll-mt-20">
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
                  </section>

                  {/* ACTIVITY — filtered to selected date */}
                  <section id="activity" className="flex flex-col gap-4 scroll-mt-20">
                    <ExerciseCard entries={dayExerciseEntries} />
                  </section>

                  {/* ENTRIES — filtered to selected date */}
                  <section id="entries" className="flex flex-col gap-4 scroll-mt-20">
                    <RecentEntries entries={dayFoodEntries} onConfirm={handleConfirm} onEdit={handleEdit} />
                    <DailySummaries entries={data.dailySummaries} />
                  </section>

                  {/* PATTERNS — always full history */}
                  <section id="patterns" className="flex flex-col gap-4 scroll-mt-20">
                    <WeekdayPatternsCard summaries={data.dailySummaries} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <WeeklyMacroChart summaries={data.dailySummaries} />
                      <MealTypeChart entries={data.foodEntries} />
                    </div>
                  </section>

                  {/* REVIEW */}
                  <section id="review" className="flex flex-col gap-4 scroll-mt-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-4">
                        <ReviewQueue entries={isToday ? data.foodEntries : dayFoodEntries} onConfirm={handleConfirm} onEdit={handleEdit} />
                        <DailyMacroCard summary={daySummary} />
                        <FoodVsDrinkCard entries={dayFoodEntries} />
                        <FrequentFoods entries={data.foodEntries} />
                      </div>
                      <div className="flex flex-col gap-4">
                        <RecurringFoodsPanel entries={data.foodEntries} />
                        <RecurringDrinksPanel entries={data.foodEntries} />
                        <HighestCalorieItems entries={data.foodEntries} />
                      </div>
                    </div>
                  </section>
                </>
              );
            })()}

            {/* Footer info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground py-2">
              <span>Files stay on your device. Nothing is uploaded.</span>
              <span>{loadStatus}</span>
            </div>
          </>
        )}
        <EntryEditSheet
          entry={editingEntry}
          open={editSheetOpen}
          onClose={() => setEditSheetOpen(false)}
          onSave={async (id, patches) => editEntryFn(id, patches as Record<string, unknown>)}
        />
      </main>
    </div>
  );
}
