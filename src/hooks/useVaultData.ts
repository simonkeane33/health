'use client';

import { useState, useCallback } from 'react';
import { parseVaultFile } from '@/lib/parser';
import { aggregateDailySummaries } from '@/lib/aggregator';
import type { FoodEntry, WeightEntry, DailySummary, VaultEntry } from '@/lib/schemas';

export interface VaultData {
  foodEntries: FoodEntry[];
  weightEntries: WeightEntry[];
  dailySummaries: DailySummary[];
  allEntries: VaultEntry[];
}

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

      for (const file of mdFiles) {
        const text = await file.text();
        const entry = parseVaultFile(file.name, text);
        if (!entry) continue;

        if (entry.entry_type === 'food_entry') foodEntries.push(entry);
        else if (entry.entry_type === 'weight_entry') weightEntries.push(entry);
        else if (entry.entry_type === 'daily_summary') dailySummaries.push(entry);
      }

      const sortByDate = (a: { entry_date: string }, b: { entry_date: string }) =>
        b.entry_date.localeCompare(a.entry_date);

      foodEntries.sort(sortByDate);
      weightEntries.sort(sortByDate);

      const mergedSummaries = aggregateDailySummaries(foodEntries, weightEntries, dailySummaries);

      setData({
        foodEntries,
        weightEntries,
        dailySummaries: mergedSummaries,
        allEntries: [...foodEntries, ...weightEntries, ...mergedSummaries],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault files');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, loadFiles };
}
