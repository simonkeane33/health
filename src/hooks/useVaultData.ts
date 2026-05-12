'use client';

import { useState, useCallback } from 'react';
import { parseVaultFile, extractFrontmatter, parseTargetsConfig } from '@/lib/parser';
import type { DailyTargets } from '@/lib/targets';
import { aggregateDailySummaries } from '@/lib/aggregator';
import type { FoodEntry, WeightEntry, DailySummary, ExerciseEntry } from '@/lib/schemas';
import type { VaultData } from '@/lib/types';

export type { VaultData };

export interface LoadProgress {
  processed: number;
  total: number;
  phase: 'reading' | 'parsing';
}

/* ------------------------------------------------------------------ */
/* Directory walker for File System Access API                         */
/* ------------------------------------------------------------------ */

async function* walkDirectory(
  handle: FileSystemDirectoryHandle,
  path = '',
): AsyncGenerator<{ relativePath: string; getFile: () => Promise<File> }> {
  // @ts-expect-error — FileSystemDirectoryHandle async iteration is in the spec
  for await (const [name, child] of handle) {
    const fullPath = path ? `${path}/${name}` : name;
    if (child.kind === 'file') {
      if (name.endsWith('.md') || name.endsWith('.markdown')) {
        yield {
          relativePath: fullPath,
          getFile: () => (child as FileSystemFileHandle).getFile(),
        };
      }
    } else if (child.kind === 'directory') {
      yield* walkDirectory(child as FileSystemDirectoryHandle, fullPath);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Core processing (shared by both load paths)                        */
/* ------------------------------------------------------------------ */

type FileSource = Array<{ relativePath: string; getText: () => Promise<string> }>;

async function parseFileSources(
  sources: FileSource,
  onProgress: (p: LoadProgress) => void,
): Promise<VaultData> {
  const foodEntries: FoodEntry[] = [];
  const weightEntries: WeightEntry[] = [];
  const dailySummaries: DailySummary[] = [];
  const exerciseEntries: ExerciseEntry[] = [];
  let vaultTargets: Partial<DailyTargets> | undefined;

  const total = sources.length;
  onProgress({ processed: 0, total, phase: 'parsing' });

  for (let i = 0; i < sources.length; i++) {
    const { relativePath, getText } = sources[i];
    const text = await getText();

    const fm = extractFrontmatter(text);
    if (fm?.entry_type === 'config') {
      const parsed = parseTargetsConfig(text);
      if (parsed) vaultTargets = { ...vaultTargets, ...parsed };
    } else {
      const entry = parseVaultFile(relativePath, text);
      if (entry) {
        if (entry.entry_type === 'food_entry') foodEntries.push(entry);
        else if (entry.entry_type === 'weight_entry') weightEntries.push(entry);
        else if (entry.entry_type === 'daily_summary') dailySummaries.push(entry);
        else if (entry.entry_type === 'exercise_entry') exerciseEntries.push(entry);
      }
    }

    // Yield to the render pipeline every 50 files so the progress bar updates
    if (i % 50 === 49 || i === sources.length - 1) {
      onProgress({ processed: i + 1, total, phase: 'parsing' });
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }

  const sortByDate = (a: { entry_date: string }, b: { entry_date: string }) =>
    b.entry_date.localeCompare(a.entry_date);

  foodEntries.sort(sortByDate);
  weightEntries.sort(sortByDate);
  exerciseEntries.sort(sortByDate);

  const mergedSummaries = aggregateDailySummaries(foodEntries, weightEntries, dailySummaries);

  return {
    foodEntries,
    weightEntries,
    dailySummaries: mergedSummaries,
    exerciseEntries,
    allEntries: [...foodEntries, ...weightEntries, ...mergedSummaries, ...exerciseEntries],
    vaultTargets,
  };
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useVaultData() {
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LoadProgress | null>(null);

  /** Whether the File System Access API is available (Chrome / Edge) */
  const supportsDirectoryPicker =
    typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  /** Open a native OS folder picker — no scary "upload X files" dialog */
  const openDirectoryPicker = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) return;
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      // @ts-expect-error — showDirectoryPicker is in the spec but may lag in TS types
      const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'read' });

      // Collect all .md handles first so we know the total
      setProgress({ processed: 0, total: 0, phase: 'reading' });
      const sources: FileSource = [];
      for await (const item of walkDirectory(dirHandle)) {
        sources.push({ relativePath: item.relativePath, getText: async () => (await item.getFile()).text() });
        if (sources.length % 100 === 0) {
          setProgress({ processed: 0, total: sources.length, phase: 'reading' });
          await new Promise<void>((r) => setTimeout(r, 0));
        }
      }

      const result = await parseFileSources(sources, setProgress);
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User dismissed the picker — not an error
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to read vault directory');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  /** Fallback: accept a FileList from a <input type="file"> */
  const loadFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const sources: FileSource = Array.from(files)
        .filter((f) => f.name.endsWith('.md') || f.name.endsWith('.markdown'))
        .map((f) => ({
          relativePath: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
          getText: () => f.text(),
        }));

      const result = await parseFileSources(sources, setProgress);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault files');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  const clearData = useCallback(() => setData(null), []);

  return {
    data,
    loading,
    error,
    progress,
    supportsDirectoryPicker,
    openDirectoryPicker,
    loadFiles,
    clearData,
  };
}
