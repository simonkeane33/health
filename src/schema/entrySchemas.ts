import { z } from 'zod';

export const foodEntrySchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'drink']),
  items: z.string().min(1, 'At least one item required'),
  estimated_calories: z.coerce.number().min(0).optional(),
  protein_g: z.coerce.number().min(0).optional(),
  carbs_g: z.coerce.number().min(0).optional(),
  fat_g: z.coerce.number().min(0).optional(),
  fiber_g: z.coerce.number().min(0).optional(),
  sugar_g: z.coerce.number().min(0).optional(),
  fluids_ml: z.coerce.number().min(0).optional(),
  alcohol_units: z.coerce.number().min(0).optional(),
  confidence: z.coerce.number().min(0).max(1),
  needs_review: z.boolean(),
  notes: z.string().optional(),
});

export type FoodEntryFormData = z.infer<typeof foodEntrySchema>;

export const weightEntrySchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  weight_kg: z.coerce.number().positive('Weight must be positive'),
  time_period: z.enum(['morning', 'evening']),
  fasted: z.boolean(),
  notes: z.string().optional(),
});

export type WeightEntryFormData = z.infer<typeof weightEntrySchema>;
