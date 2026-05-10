export interface WeightEntry {
  id: string;
  entry_type: 'weight_entry';
  logged_at: string;
  entry_date: string;
  weight_kg: number;
  fat_mass_kg?: number;
  bone_mass_kg?: number;
  muscle_mass_kg?: number;
  hydration_kg?: number;
  source: string;
  source_channel?: string;
  fasted?: boolean;
  time_period?: string;
  confidence: number;
  notes?: string;
}

export interface FoodEntry {
  id: string;
  entry_type: 'food_entry';
  logged_at: string;
  entry_date: string;
  meal_type: string;
  source: string;
  source_channel?: string;
  image?: string;
  items: string[];
  estimated_calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  fluids_ml?: number;
  alcohol_units?: number;
  confidence: number;
  needs_review: boolean;
  review_status: string;
  user_confirmed: boolean;
  correction_summary?: string;
  location?: string;
  mood?: string;
  notes?: string;
}

export interface DailySummary {
  id: string;
  entry_type: 'daily_summary';
  entry_date: string;
  weight_kg?: number;
  total_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  fluids_ml?: number;
  alcohol_units?: number;
  food_entries?: number;
  needs_review_count?: number;
  intake_complete: boolean;
  summary_generated_at?: string;
  source: string;
}

export type VaultEntry = WeightEntry | FoodEntry | DailySummary;

export interface VaultData {
  foodEntries: FoodEntry[];
  weightEntries: WeightEntry[];
  dailySummaries: DailySummary[];
  allEntries: VaultEntry[];
}
