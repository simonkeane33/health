import { promises as fs } from 'fs';
import * as path from 'path';
import { parseVaultFile } from './parser';
import type { VaultEntry, FoodEntry, WeightEntry, DailySummary } from './schemas';

export interface VaultReadResult {
  foodEntries: FoodEntry[];
  weightEntries: WeightEntry[];
  dailySummaries: DailySummary[];
  allEntries: VaultEntry[];
  errors: string[];
}

/**
 * Read all .md files from a directory on the local file system.
 * Suitable for local dev server-side rendering or API routes.
 */
export async function readVaultDir(dirPath: string): Promise<VaultReadResult> {
  const foodEntries: FoodEntry[] = [];
  const weightEntries: WeightEntry[] = [];
  const dailySummaries: DailySummary[] = [];
  const errors: string[] = [];

  let files: string[];
  try {
    files = await fs.readdir(dirPath);
  } catch (err) {
    return {
      foodEntries,
      weightEntries,
      dailySummaries,
      allEntries: [],
      errors: [`Failed to read directory: ${dirPath}`],
    };
  }

  const mdFiles = files.filter((f) => f.endsWith('.md') || f.endsWith('.markdown'));

  for (const fileName of mdFiles) {
    const filePath = path.join(dirPath, fileName);
    try {
      const text = await fs.readFile(filePath, 'utf-8');
      const entry = parseVaultFile(fileName, text);
      if (!entry) continue;

      if (entry.entry_type === 'food_entry') foodEntries.push(entry);
      else if (entry.entry_type === 'weight_entry') weightEntries.push(entry);
      else if (entry.entry_type === 'daily_summary') dailySummaries.push(entry);
    } catch (err) {
      errors.push(`Failed to read ${fileName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

    foodEntries.sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));
    weightEntries.sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));
    dailySummaries.sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));

  return {
    foodEntries,
    weightEntries,
    dailySummaries,
    allEntries: [...foodEntries, ...weightEntries, ...dailySummaries],
    errors,
  };
}
