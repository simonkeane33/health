'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { parseVaultFile, extractFrontmatter, parseTargetsConfig } from '@/lib/parser';
import type { DailyTargets } from '@/lib/targets';
import { aggregateDailySummaries } from '@/lib/aggregator';
import type { FoodEntry, WeightEntry, DailySummary, ExerciseEntry } from '@/lib/schemas';
import type { VaultData } from '@/lib/types';
import { saveVaultHandle, loadVaultHandle, clearVaultHandle } from '@/lib/vault-store';

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
  /** Name of the last-used vault folder, shown in the reconnect prompt */
  const [savedVaultName, setSavedVaultName] = useState<string | null>(null);
  /** 'needs-reconnect' = handle exists but permission needs a user gesture */
  const [reconnectNeeded, setReconnectNeeded] = useState(false);
  const savedHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  const supportsDirectoryPicker =
    typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  /* ── Core: load from a directory handle ── */
  const loadFromHandle = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    setLoading(true);
    setError(null);
    setProgress(null);
    setReconnectNeeded(false);

    try {
      setProgress({ processed: 0, total: 0, phase: 'reading' });
      const sources: FileSource = [];
      for await (const item of walkDirectory(dirHandle)) {
        sources.push({
          relativePath: item.relativePath,
          getText: async () => (await item.getFile()).text(),
        });
        if (sources.length % 100 === 0) {
          setProgress({ processed: 0, total: sources.length, phase: 'reading' });
          await new Promise<void>((r) => setTimeout(r, 0));
        }
      }

      const result = await parseFileSources(sources, setProgress);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read vault directory');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  /* ── On mount: restore saved handle and auto-load if permission held ── */
  useEffect(() => {
    if (!supportsDirectoryPicker) return;

    loadVaultHandle().then(async (handle) => {
      if (!handle) return;
      savedHandleRef.current = handle;
      setSavedVaultName(handle.name);

      // @ts-expect-error — queryPermission is in the WICG spec
      const perm = await handle.queryPermission({ mode: 'read' });
      if (perm === 'granted') {
        // Permission still held from this session — load silently
        await loadFromHandle(handle);
      } else {
        // Permission lapsed (e.g. browser restarted) — need a user gesture
        setReconnectNeeded(true);
      }
    }).catch(() => { /* IndexedDB unavailable — no-op */ });
  }, [supportsDirectoryPicker, loadFromHandle]);

  /* ── Reconnect: re-request permission for the saved handle ── */
  const reconnect = useCallback(async () => {
    const handle = savedHandleRef.current;
    if (!handle) return;

    try {
      // @ts-expect-error — requestPermission is in the WICG spec
      const perm = await handle.requestPermission({ mode: 'read' });
      if (perm === 'granted') {
        await loadFromHandle(handle);
      } else {
        setReconnectNeeded(true);
      }
    } catch {
      setReconnectNeeded(true);
    }
  }, [loadFromHandle]);

  /* ── Refresh: re-read the vault from the saved handle (no picker needed) ── */
  const refresh = useCallback(async () => {
    const handle = savedHandleRef.current;
    if (!handle || loading) return;
    await loadFromHandle(handle);
  }, [loadFromHandle, loading]);

  // Note: previously refreshed on window focus; removed because it triggered
  // a full re-scan every time the tab regained focus. Use the manual refresh
  // button in the header instead.

  /* ── Open folder picker and save the chosen handle ── */
  const openDirectoryPicker = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) return;
    setError(null);

    try {
      // @ts-expect-error — showDirectoryPicker may lag in TS types
      const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'read' });
      savedHandleRef.current = dirHandle;
      setSavedVaultName(dirHandle.name);
      setReconnectNeeded(false);
      await saveVaultHandle(dirHandle);
      await loadFromHandle(dirHandle);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to read vault directory');
    }
  }, [loadFromHandle]);

  /* ── Fallback: accept a FileList from <input type="file"> ── */
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

  const clearData = useCallback(async () => {
    setData(null);
    setReconnectNeeded(false);
    setSavedVaultName(null);
    savedHandleRef.current = null;
    await clearVaultHandle();
  }, []);

  return {
    data,
    loading,
    error,
    progress,
    supportsDirectoryPicker,
    savedVaultName,
    reconnectNeeded,
    reconnect,
    refresh,
    openDirectoryPicker,
    loadFiles,
    clearData,
  };
}
