import * as yaml from 'js-yaml';
import { FoodEntrySchema, WeightEntrySchema, DailySummarySchema, ExerciseEntrySchema } from './schemas';
import type { FoodEntry, WeightEntry, DailySummary, ExerciseEntry, VaultEntry } from './schemas';

/* ------------------------------------------------------------------ */
/* Front-matter extraction                                              */
/* ------------------------------------------------------------------ */

const YAML_BLOCK_RE = /^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n/;

export function extractFrontmatter(text: string): Record<string, unknown> | null {
  const match = text.match(YAML_BLOCK_RE);
  if (!match) return null;
  try {
    const parsed = yaml.load(match[1]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch (err) {
    console.warn('[extractFrontmatter] YAML parse error:', err instanceof Error ? err.message : String(err));
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

export function parseExerciseEntry(data: Record<string, unknown>): ExerciseEntry | null {
  const result = ExerciseEntrySchema.safeParse(data);
  return result.success ? result.data : null;
}

/* ------------------------------------------------------------------ */
/* Auto-dispatch parser by entry_type                                 */
/* ------------------------------------------------------------------ */

function normalizeFields(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };

  // Accept 'food' as shorthand for 'food_entry'
  if (out.entry_type === 'food') {
    out.entry_type = 'food_entry';
  }

  // Alias old field names to canonical ones
  if (out.calories !== undefined && out.estimated_calories === undefined) {
    out.estimated_calories = out.calories;
  }
  if (out.food_name !== undefined) {
    out.items = out.items ?? out.food_name;
  }

  // Bridge `entry_time` + `entry_date` → `logged_at` (newer manual entries)
  if (out.logged_at === undefined && out.entry_date && out.entry_time) {
    let t = String(out.entry_time);
    // YAML parsers may parse unquoted hh:mm as base-60 integers (e.g. 17:30 → 1050)
    if (typeof out.entry_time === 'number') {
      const hours = Math.floor(out.entry_time / 60);
      const minutes = out.entry_time % 60;
      t = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    const d = String(out.entry_date);
    out.logged_at = `${d}T${t.length === 5 ? t + ':00' : t}`;
  }

  // Bridge `logged_by` → `source` (newer manual entries)
  if (out.source === undefined && out.logged_by !== undefined) {
    out.source = out.logged_by;
  }

  // Bridge `hermes_confidence` → `confidence` when confidence is absent
  if (out.confidence === undefined && out.hermes_confidence !== undefined) {
    out.confidence = out.hermes_confidence;
  }

  // Fill required fields with sensible defaults when absent
  if (out.meal_type === undefined) {
    out.meal_type = '';
  }
  if (out.source === undefined) {
    out.source = '';
  }
  if (out.confidence === undefined) {
    out.confidence = 0;
  }
  if (out.needs_review === undefined) {
    out.needs_review = false;
  }
  if (out.review_status === undefined) {
    out.review_status = 'pending';
  }
  if (out.user_confirmed === undefined) {
    out.user_confirmed = false;
  }

  return out;
}

export function parseVaultEntry(data: Record<string, unknown>): VaultEntry | null {
  const entryType = data.entry_type;
  if (entryType === 'food' || entryType === 'food_entry') {
    return parseFoodEntry(normalizeFields(data));
  }
  if (entryType === 'weight_entry') return parseWeightEntry(data);
  if (entryType === 'daily_summary') return parseDailySummary(data);
  if (entryType === 'exercise_entry') return parseExerciseEntry(data);
/* ------------------------------------------------------------------ */
/* Attachment extraction from Markdown body                            */
/* ------------------------------------------------------------------ */

export function extractAttachmentsFromBody(text: string): string[] {
  const frontmatterEnd = text.search(/^---\s*\n/m);
  const bodyStart = frontmatterEnd >= 0 ? text.indexOf('---', frontmatterEnd + 3) + 3 : 0;
  const body = text.slice(bodyStart);

  const attachments: string[] = [];
  const seen = new Set<string>();

  // Obsidian wiki-style: ![[filename.jpg]]
  const wikiRe = /!\[\[([^[\]\n]+)]]/g;
  let match: RegExpExecArray | null;
  while ((match = wikiRe.exec(body)) !== null) {
    const path = match[1].trim();
    if (!seen.has(path)) {
      seen.add(path);
      attachments.push(path);
    }
  }

  // Standard markdown: ![](path) or ![alt](path)
  const mdRe = /!\[[^\]]*]\(([^)\s]+)\)/g;
  while ((match = mdRe.exec(body)) !== null) {
    const path = match[1].trim();
    if (!seen.has(path)) {
      seen.add(path);
      attachments.push(path);
    }
  }

  return attachments;
}

/* ------------------------------------------------------------------ */
/* Vault file parsing                                                  */
/* ------------------------------------------------------------------ */

export function parseVaultFile(name: string, text: string): VaultEntry | null {
  const frontmatter = extractFrontmatter(text);
  if (!frontmatter) return null;
  const entry = parseVaultEntry(frontmatter);
  if (!entry) return null;

  // For food entries, scan body for image attachments
  if (entry.entry_type === 'food_entry' && entry) {
    const attachments = extractAttachmentsFromBody(text);
    if (attachments.length > 0) {
      return { ...entry, attachments } as VaultEntry;
    }
  }

  return entry;
}
