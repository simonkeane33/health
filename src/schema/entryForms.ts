import { z } from 'zod';

export const foodEntrySchema = z.object({
  id: z.string().default(() => `food-${Date.now()}`),
  entry_type: z.literal('food_entry'),
  logged_at: z.string().default(() => new Date().toISOString()),
  entry_date: z.string(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'drink']),
  source: z.literal('hermes').default('hermes'),
  source_channel: z.literal('manual').default('manual'),
  items: z.array(z.string().min(1)).min(1, 'At least one item is required'),
  estimated_calories: z.coerce.number().min(0),
  protein_g: z.coerce.number().min(0).optional(),
  carbs_g: z.coerce.number().min(0).optional(),
  fat_g: z.coerce.number().min(0).optional(),
  fiber_g: z.coerce.number().min(0).optional(),
  sugar_g: z.coerce.number().min(0).optional(),
  fluids_ml: z.coerce.number().min(0).optional(),
  alcohol_units: z.coerce.number().min(0).optional(),
  confidence: z.coerce.number().min(0).max(1).default(1),
  needs_review: z.boolean().default(false),
  review_status: z.literal('pending').default('pending'),
  user_confirmed: z.literal(false).default(false),
  notes: z.string().optional(),
});

export type FoodEntryFormData = z.infer<typeof foodEntrySchema>;

export const weightEntrySchema = z.object({
  id: z.string().default(() => `weight-${Date.now()}`),
  entry_type: z.literal('weight_entry'),
  logged_at: z.string().default(() => new Date().toISOString()),
  entry_date: z.string(),
  weight_kg: z.coerce.number().positive('Weight must be positive'),
  source: z.literal('hermes').default('hermes'),
  source_channel: z.literal('manual').default('manual'),
  fasted: z.boolean().default(false),
  time_period: z.enum(['morning', 'evening']).default('morning'),
  confidence: z.coerce.number().min(0).max(1).default(1),
  notes: z.string().optional(),
});

export type WeightEntryFormData = z.infer<typeof weightEntrySchema>;
