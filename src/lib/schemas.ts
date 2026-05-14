import { z } from 'zod';

/**
 * Pre-process YAML fields that may be empty strings or null.
 * js-yaml returns null for empty YAML fields; Obsidian vault notes also have
 * literally empty values (e.g. `total_calories:`).
 */
const optionalNumber = () =>
  z
    .union([z.number(), z.string(), z.null()])
    .transform((v) => {
      if (v === '' || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    })
    .optional();

const requiredString = () =>
  z
    .union([z.string(), z.number(), z.date(), z.null()])
    .transform((v) => {
      if (v == null) return '';
      if (v instanceof Date) return v.toISOString().split('T')[0];
      return String(v);
    });

const optionalString = () =>
  z.union([z.string(), z.null()])
    .transform((v) => (v === null || v === undefined ? undefined : String(v)))
    .optional();

const optionalBoolean = () =>
  z
    .union([z.boolean(), z.string(), z.null()])
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      if (v === null || v === undefined) return undefined;
      const s = String(v).toLowerCase().trim();
      if (s === 'true' || s === '1' || s === 'yes') return true;
      if (s === 'false' || s === '0' || s === 'no') return false;
      return undefined;
    })
    .optional();

const stringArray = () =>
  z
    .union([z.array(z.union([z.string(), z.number()])), z.string(), z.null()])
    .transform((v) => {
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === 'string') return v ? [v] : [];
      return [];
    });

/* ------------------------------------------------------------------ */
/* Entry schemas                                                       */
/* ------------------------------------------------------------------ */

export const FoodEntrySchema = z.object({
  id: requiredString(),
  entry_type: z.literal('food_entry'),
  logged_at: requiredString(),
  entry_date: requiredString(),
  meal_type: requiredString(),
  source: requiredString(),
  source_channel: optionalString(),
  // image can be a plain string path OR an array of {path, description} objects
  image: z.unknown().optional(),
  items: stringArray(),
  estimated_calories: optionalNumber().default(0),
  protein_g: optionalNumber(),
  carbs_g: optionalNumber(),
  fat_g: optionalNumber(),
  fiber_g: optionalNumber(),
  sugar_g: optionalNumber(),
  fluids_ml: optionalNumber(),
  alcohol_units: optionalNumber(),
  confidence: optionalNumber().default(0),
  needs_review: optionalBoolean().default(false),
  review_status: requiredString().default('pending'),
  user_confirmed: optionalBoolean().default(false),
  correction_summary: optionalString(),
  location: optionalString(),
  mood: optionalString(),
  notes: optionalString(),
  hermes_confidence: optionalNumber(),
  reviewed_by: optionalString(),
  reviewed_at: optionalString(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  source_file: optionalString(),
});

export const WeightEntrySchema = z.object({
  id: requiredString(),
  entry_type: z.literal('weight_entry'),
  logged_at: requiredString(),
  entry_date: requiredString(),
  weight_kg: optionalNumber().default(0),
  bmi: optionalNumber(),
  body_fat_pct: optionalNumber(),
  muscle_mass_pct: optionalNumber(),
  bone_mass_pct: optionalNumber(),
  body_water_pct: optionalNumber(),
  height_cm: optionalNumber(),
  source: requiredString(),
  source_channel: optionalString(),
  fasted: optionalBoolean(),
  time_period: optionalString(),
  confidence: optionalNumber().default(0),
  notes: optionalString(),
});

export const DailySummarySchema = z.object({
  id: requiredString(),
  entry_type: z.literal('daily_summary'),
  entry_date: requiredString(),
  weight_kg: optionalNumber(),
  bmi: optionalNumber(),
  body_fat_pct: optionalNumber(),
  muscle_mass_pct: optionalNumber(),
  bone_mass_pct: optionalNumber(),
  body_water_pct: optionalNumber(),
  total_calories: optionalNumber(),
  protein_g: optionalNumber(),
  carbs_g: optionalNumber(),
  fat_g: optionalNumber(),
  fiber_g: optionalNumber(),
  sugar_g: optionalNumber(),
  fluids_ml: optionalNumber(),
  alcohol_units: optionalNumber(),
  food_entries: optionalNumber(),
  needs_review_count: optionalNumber(),
  intake_complete: optionalBoolean().default(false),
  summary_generated_at: optionalString(),
  source: requiredString(),
});

export const ExerciseEntrySchema = z.object({
  id: requiredString(),
  entry_type: z.literal('exercise_entry'),
  logged_at: requiredString(),
  entry_date: requiredString(),
  activity_type: requiredString(),
  source: requiredString(),
  source_channel: optionalString(),
  distance_km: optionalNumber(),
  calories_burned: optionalNumber(),
  moving_time: optionalString(),
  elapsed_time: optionalString(),
  avg_hr: optionalNumber(),
  max_hr: optionalNumber(),
  total_ascent_m: optionalNumber(),
  total_descent_m: optionalNumber(),
  avg_speed: optionalNumber(),
  max_speed: optionalNumber(),
  course_or_route: optionalString(),
  needs_review: optionalBoolean().default(false),
  review_status: requiredString().default('pending'),
});

export const VaultEntrySchema = z.union([
  FoodEntrySchema,
  WeightEntrySchema,
  DailySummarySchema,
  ExerciseEntrySchema,
]);

export type FoodEntry = z.infer<typeof FoodEntrySchema>;
export type WeightEntry = z.infer<typeof WeightEntrySchema>;
export type DailySummary = z.infer<typeof DailySummarySchema>;
export type ExerciseEntry = z.infer<typeof ExerciseEntrySchema>;
export type VaultEntry = z.infer<typeof VaultEntrySchema>;
