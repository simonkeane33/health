import * as yaml from 'js-yaml';
import { FoodEntrySchema, WeightEntrySchema, DailySummarySchema, ExerciseEntrySchema } from './schemas';
import type { FoodEntry, WeightEntry, DailySummary, ExerciseEntry, VaultEntry } from './schemas';
import type { DailyTargets } from './targets';

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

/**
 * Normalize alt body-composition field names that newer Hermes versions emit.
 * `muscle_pct` → `muscle_mass_pct` etc.
 */
function normalizeBodyCompFields(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  const aliases: Array<[from: string, to: string]> = [
    ['muscle_pct', 'muscle_mass_pct'],
    ['bone_pct', 'bone_mass_pct'],
    ['water_pct', 'body_water_pct'],
  ];
  for (const [from, to] of aliases) {
    if (out[to] === undefined && out[from] !== undefined) out[to] = out[from];
  }
  return out;
}

/**
 * Normalize Hermes-generated exercise field names → canonical schema names.
 * e.g. heart_rate_avg → avg_hr, duration_min → moving_time (HH:MM:SS)
 */
function normalizeExerciseFields(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  // HR field name differences between Hermes output and schema
  if (out.avg_hr === undefined && out.heart_rate_avg !== undefined) out.avg_hr = out.heart_rate_avg;
  if (out.max_hr === undefined && out.heart_rate_max !== undefined) out.max_hr = out.heart_rate_max;
  // Convert duration_min (number) → moving_time (HH:MM:SS string)
  if (out.moving_time === undefined && typeof out.duration_min === 'number') {
    const totalSeconds = Math.round((out.duration_min as number) * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    out.moving_time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return out;
}

/**
 * Normalize alt total_X_g daily-summary field names → canonical X_g.
 */
function normalizeDailySummaryFields(data: Record<string, unknown>): Record<string, unknown> {
  const out = normalizeBodyCompFields(data);
  const aliases: Array<[from: string, to: string]> = [
    ['total_protein_g', 'protein_g'],
    ['total_carbs_g', 'carbs_g'],
    ['total_fat_g', 'fat_g'],
    ['total_fiber_g', 'fiber_g'],
    ['total_sugar_g', 'sugar_g'],
    ['total_fluids_ml', 'fluids_ml'],
    ['total_alcohol_units', 'alcohol_units'],
  ];
  for (const [from, to] of aliases) {
    if (out[to] === undefined && out[from] !== undefined) out[to] = out[from];
  }
  return out;
}

export function parseVaultEntry(data: Record<string, unknown>): VaultEntry | null {
  const entryType = data.entry_type;
  if (entryType === 'food' || entryType === 'food_entry') {
    return parseFoodEntry(normalizeFields(data));
  }
  if (entryType === 'weight_entry') return parseWeightEntry(normalizeBodyCompFields(data));
  if (entryType === 'daily_summary') return parseDailySummary(normalizeDailySummaryFields(data));
  if (entryType === 'exercise_entry') return parseExerciseEntry(normalizeExerciseFields(data));
  console.warn('[parseVaultEntry] Unknown entry_type:', entryType);
  return null;
}

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
/* Config / targets parsing                                           */
/* ------------------------------------------------------------------ */

/**
 * Parse daily targets from a vault config file whose frontmatter has
 * entry_type: config (e.g. Config/targets.md).
 *
 * Extracts values from the "## Active Targets" markdown table using
 * patterns like: | **Calories** | **1,974 kcal** |
 */
export function parseTargetsConfig(text: string): Partial<DailyTargets> | null {
  const frontmatter = extractFrontmatter(text);
  if (frontmatter?.entry_type !== 'config') return null;

  const result: Partial<DailyTargets> = {};

  function extractNum(pattern: RegExp): number | undefined {
    const m = text.match(pattern);
    if (!m) return undefined;
    const n = parseFloat(m[1].replace(/,/g, ''));
    return Number.isNaN(n) ? undefined : n;
  }

  // | **Calories** | **1,974 kcal** |
  const cal = extractNum(/\|\s*\*{1,2}Calories\*{1,2}\s*\|\s*\*{1,2}([\d,]+)\s*kcal\*{1,2}/i);
  if (cal != null) result.calories_kcal = cal;

  // | **Protein** | **150 g** |
  const protein = extractNum(/\|\s*\*{1,2}Protein\*{1,2}\s*\|\s*\*{1,2}([\d,]+)\s*g\*{1,2}/i);
  if (protein != null) result.protein_g = protein;

  // | **Carbs** | **165 g** |
  const carbs = extractNum(/\|\s*\*{1,2}Carbs\*{1,2}\s*\|\s*\*{1,2}([\d,]+)\s*g\*{1,2}/i);
  if (carbs != null) result.carbs_g = carbs;

  // | **Fluids (water)** | **2,500 ml** | — also matches plain "Fluids"
  const fluids = extractNum(/\|\s*\*{1,2}Fluids[^|]*\|\s*\*{1,2}([\d,]+)\s*ml\*{1,2}/i);
  if (fluids != null) result.fluids_ml = fluids;

  // Optional: | **Weight target** | **90 kg** | (not in current file but future-safe)
  const weight = extractNum(/\|\s*\*{1,2}Weight\s*target\*{1,2}\s*\|\s*\*{1,2}([\d.]+)\s*kg\*{1,2}/i);
  if (weight != null) result.weight_kg = weight;

  return Object.keys(result).length > 0 ? result : null;
}

/* ------------------------------------------------------------------ */
/* Vault file parsing                                                  */
/* ------------------------------------------------------------------ */

export function parseVaultFile(name: string, text: string): VaultEntry | null {
  const frontmatter = extractFrontmatter(text);
  if (!frontmatter) return null;
  const entry = parseVaultEntry(frontmatter);
  if (!entry) return null;

  // For food entries, stamp source_file and collect image attachments
  if (entry.entry_type === 'food_entry') {
    const bodyAttachments = extractAttachmentsFromBody(text);

    // Also pull paths from frontmatter `image` field (array of {path, description} objects)
    const fmImage = frontmatter.image;
    const frontmatterPaths: string[] = Array.isArray(fmImage)
      ? fmImage.flatMap((item) =>
          item && typeof item === 'object' && 'path' in item && typeof (item as Record<string, unknown>).path === 'string'
            ? [(item as Record<string, unknown>).path as string]
            : [],
        )
      : typeof fmImage === 'string' && fmImage
        ? [fmImage]
        : [];

    const allAttachments = [...new Set([...bodyAttachments, ...frontmatterPaths])];

    return {
      ...entry,
      source_file: name,
      ...(allAttachments.length > 0 ? { attachments: allAttachments } : {}),
    } as VaultEntry;
  }

  return entry;
}
