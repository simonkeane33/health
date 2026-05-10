import yaml from 'js-yaml';
import type { VaultEntry, FoodEntry, WeightEntry, DailySummary } from './types';

export function parseVaultFile(name: string, text: string): VaultEntry | null {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return null;

  const frontmatter = match[1];

  let data: Record<string, unknown>;
  try {
    data = yaml.load(frontmatter) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (!data || typeof data !== 'object') return null;

  const entry_type = data.entry_type as string;

  if (entry_type === 'food_entry') {
    return {
      id: String(data.id || ''),
      entry_type: 'food_entry',
      logged_at: String(data.logged_at || ''),
      entry_date: String(data.entry_date || ''),
      meal_type: String(data.meal_type || ''),
      source: String(data.source || ''),
      source_channel: String(data.source_channel || ''),
      image: data.image ? String(data.image) : undefined,
      items: Array.isArray(data.items) ? data.items.map(String) : [],
      estimated_calories: Number(data.estimated_calories || 0),
      protein_g: data.protein_g !== undefined ? Number(data.protein_g) : undefined,
      carbs_g: data.carbs_g !== undefined ? Number(data.carbs_g) : undefined,
      fat_g: data.fat_g !== undefined ? Number(data.fat_g) : undefined,
      fiber_g: data.fiber_g !== undefined ? Number(data.fiber_g) : undefined,
      sugar_g: data.sugar_g !== undefined ? Number(data.sugar_g) : undefined,
      fluids_ml: data.fluids_ml !== undefined ? Number(data.fluids_ml) : undefined,
      alcohol_units: data.alcohol_units !== undefined ? Number(data.alcohol_units) : undefined,
      confidence: Number(data.confidence || 0),
      needs_review: Boolean(data.needs_review),
      review_status: String(data.review_status || 'pending'),
      user_confirmed: Boolean(data.user_confirmed),
      correction_summary: data.correction_summary ? String(data.correction_summary) : undefined,
      location: data.location ? String(data.location) : undefined,
      mood: data.mood ? String(data.mood) : undefined,
      notes: data.notes ? String(data.notes) : undefined,
    } satisfies FoodEntry;
  }

  if (entry_type === 'weight_entry') {
    return {
      id: String(data.id || ''),
      entry_type: 'weight_entry',
      logged_at: String(data.logged_at || ''),
      entry_date: String(data.entry_date || ''),
      weight_kg: Number(data.weight_kg || 0),
      fat_mass_kg: data.fat_mass_kg !== undefined ? Number(data.fat_mass_kg) : undefined,
      bone_mass_kg: data.bone_mass_kg !== undefined ? Number(data.bone_mass_kg) : undefined,
      muscle_mass_kg: data.muscle_mass_kg !== undefined ? Number(data.muscle_mass_kg) : undefined,
      hydration_kg: data.hydration_kg !== undefined ? Number(data.hydration_kg) : undefined,
      source: String(data.source || ''),
      source_channel: String(data.source_channel || ''),
      fasted: data.fasted !== undefined ? Boolean(data.fasted) : undefined,
      time_period: data.time_period ? String(data.time_period) : undefined,
      confidence: Number(data.confidence || 0),
      notes: data.notes ? String(data.notes) : undefined,
    } satisfies WeightEntry;
  }

  if (entry_type === 'daily_summary') {
    return {
      id: String(data.id || ''),
      entry_type: 'daily_summary',
      entry_date: String(data.entry_date || ''),
      weight_kg: data.weight_kg !== undefined ? Number(data.weight_kg) : undefined,
      total_calories: data.total_calories !== undefined ? Number(data.total_calories) : undefined,
      protein_g: data.protein_g !== undefined ? Number(data.protein_g) : undefined,
      carbs_g: data.carbs_g !== undefined ? Number(data.carbs_g) : undefined,
      fat_g: data.fat_g !== undefined ? Number(data.fat_g) : undefined,
      fiber_g: data.fiber_g !== undefined ? Number(data.fiber_g) : undefined,
      fluids_ml: data.fluids_ml !== undefined ? Number(data.fluids_ml) : undefined,
      alcohol_units: data.alcohol_units !== undefined ? Number(data.alcohol_units) : undefined,
      food_entries: data.food_entries !== undefined ? Number(data.food_entries) : undefined,
      needs_review_count: data.needs_review_count !== undefined ? Number(data.needs_review_count) : undefined,
      intake_complete: Boolean(data.intake_complete),
      summary_generated_at: data.summary_generated_at ? String(data.summary_generated_at) : undefined,
      source: String(data.source || ''),
    } satisfies DailySummary;
  }

  return null;
}
