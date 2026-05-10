import yaml from 'js-yaml';
import { z } from 'zod';
import {
  FoodEntrySchema,
  WeightEntrySchema,
  DailySummarySchema,
  type FoodEntry,
  type WeightEntry,
  type DailySummary,
  type VaultEntry,
} from './schemas';

/* ------------------------------------------------------------------ */
/* Front-matter extraction                                              */
/* ------------------------------------------------------------------ */

const YAML_BLOCK_RE = /^---\n([\s\S]*?)\n---\s*\n/;

export function extractFrontmatter(text: string): Record<string, unknown> | null {
  const match = text.match(YAML_BLOCK_RE);
  if (!match) return null;
  try {
    const parsed = yaml.load(match[1]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* silently ignore malformed YAML */
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Validate individual entry types                                    */
/* ------------------------------------------------------------------ */

export function parseFoodEntry(data: Record<string, unknown>): FoodEntry | null {
  const result = FoodEntrySchema.safeParse(data);
  return result.success ? result.data : null;
}

export function parseWeightEntry(data: Record<string, unknown>): WeightEntry | null {
  const result = WeightEntrySchema.safeParse(data);
  return result.success ? result.data : null;
}

export function parseDailySummary(data: Record<string, unknown>): DailySummary | null {
  const result = DailySummarySchema.safeParse(data);
  return result.success ? result.data : null;
}

/* ------------------------------------------------------------------ */
/* Auto-dispatch parser by entry_type                                 */
/* ------------------------------------------------------------------ */

export function parseVaultEntry(data: Record<string, unknown>): VaultEntry | null {
  const entryType = data.entry_type;
  if (entryType === 'food_entry') return parseFoodEntry(data);
  if (entryType === 'weight_entry') return parseWeightEntry(data);
  if (entryType === 'daily_summary') return parseDailySummary(data);
  return null;
}

/* ------------------------------------------------------------------ */
/* Parse a raw markdown file                                          */
/* ------------------------------------------------------------------ */

export function parseVaultFile(name: string, text: string): VaultEntry | null {
  const frontmatter = extractFrontmatter(text);
  if (!frontmatter) return null;
  return parseVaultEntry(frontmatter);
}
