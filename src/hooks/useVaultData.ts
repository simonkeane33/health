'use client';

import { useState, useCallback } from 'react';
import { parseVaultFile, extractFrontmatter, parseTargetsConfig } from '@/lib/parser';
import type { DailyTargets } from '@/lib/targets';
import { aggregateDailySummaries } from '@/lib/aggregator';
import type { FoodEntry, WeightEntry, DailySummary, ExerciseEntry } from '@/lib/schemas';
import type { VaultData } from '@/lib/types';

export type { VaultData };

export function useVaultData() {
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mdFiles = Array.from(files).filter(
        (f) => f.name.endsWith('.md') || f.name.endsWith('.markdown')
      );

      const foodEntries: FoodEntry[] = [];
      const weightEntries: WeightEntry[] = [];
      const dailySummaries: DailySummary[] = [];
      const exerciseEntries: ExerciseEntry[] = [];
      let vaultTargets: Partial<DailyTargets> | undefined;

      for (const file of mdFiles) {
        const text = await file.text();

        // Handle config files (e.g. targets.md) before the main parser
        const fm = extractFrontmatter(text);
        if (fm?.entry_type === 'config') {
          const parsed = parseTargetsConfig(text);
          if (parsed) vaultTargets = { ...vaultTargets, ...parsed };
          continue;
        }

        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        const entry = parseVaultFile(relativePath, text);
        if (!entry) continue;

        if (entry.entry_type === 'food_entry') foodEntries.push(entry);
        else if (entry.entry_type === 'weight_entry') weightEntries.push(entry);
        else if (entry.entry_type === 'daily_summary') dailySummaries.push(entry);
        else if (entry.entry_type === 'exercise_entry') exerciseEntries.push(entry);
      }

      const sortByDate = (a: { entry_date: string }, b: { entry_date: string }) =>
        b.entry_date.localeCompare(a.entry_date);

      foodEntries.sort(sortByDate);
      weightEntries.sort(sortByDate);
      exerciseEntries.sort(sortByDate);

      const mergedSummaries = aggregateDailySummaries(foodEntries, weightEntries, dailySummaries);

      setData({
        foodEntries,
        weightEntries,
        dailySummaries: mergedSummaries,
        exerciseEntries,
        allEntries: [...foodEntries, ...weightEntries, ...mergedSummaries, ...exerciseEntries],
        vaultTargets,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault files');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, loadFiles };
}
