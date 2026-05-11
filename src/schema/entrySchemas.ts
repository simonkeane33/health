import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Food entry                                                          */
/* ------------------------------------------------------------------ */

export const foodEntrySchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'drink']),
  items: z.string().min(1, 'At least one item required'),
  estimated_calories: z.string().optional(),
  protein_g: z.string().optional(),
  carbs_g: z.string().optional(),
  fat_g: z.string().optional(),
  fiber_g: z.string().optional(),
  sugar_g: z.string().optional(),
  fluids_ml: z.string().optional(),
  alcohol_units: z.string().optional(),
  confidence: z.number().min(0).max(1),
  needs_review: z.boolean(),
  notes: z.string().optional(),
});

export type FoodEntryFormData = z.infer<typeof foodEntrySchema>;

/* ------------------------------------------------------------------ */
/* Weight entry                                                        */
/* ------------------------------------------------------------------ */

export const weightEntrySchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  weight_kg: z.string()
    .min(1, 'Weight is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    }),
  time_period: z.enum(['morning', 'evening']),
  fasted: z.boolean(),
  body_fat_pct: z.string().optional(),
  muscle_mass_pct: z.string().optional(),
  bone_mass_pct: z.string().optional(),
  body_water_pct: z.string().optional(),
  height_cm: z.string().optional(),
  bmi: z.string().optional(),
  notes: z.string().optional(),
});

export type WeightEntryFormData = z.infer<typeof weightEntrySchema>;
