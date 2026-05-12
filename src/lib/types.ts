export interface WeightEntry {
  id: string;
  entry_type: 'weight_entry';
  logged_at: string;
  entry_date: string;
  weight_kg: number;
  body_fat_pct?: number;
  muscle_mass_pct?: number;
  bone_mass_pct?: number;
  body_water_pct?: number;
  height_cm?: number;
  bmi?: number;
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
  attachments?: string[];
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
  bmi?: number;
  body_fat_pct?: number;
  muscle_mass_pct?: number;
  bone_mass_pct?: number;
  body_water_pct?: number;
  total_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  fluids_ml?: number;
  alcohol_units?: number;
  food_entries?: number;
  needs_review_count?: number;
  intake_complete: boolean;
  summary_generated_at?: string;
  source: string;
}

export interface ExerciseEntry {
  id: string;
  entry_type: 'exercise_entry';
  logged_at: string;
  entry_date: string;
  activity_type: string;
  source: string;
  source_channel?: string;
  distance_km?: number;
  calories_burned?: number;
  moving_time?: string;
  elapsed_time?: string;
  avg_hr?: number;
  max_hr?: number;
  total_ascent_m?: number;
  total_descent_m?: number;
  avg_speed?: number;
  max_speed?: number;
  course_or_route?: string;
  needs_review: boolean;
  review_status: string;
}

export type VaultEntry = WeightEntry | FoodEntry | DailySummary | ExerciseEntry;

export interface VaultData {
  foodEntries: FoodEntry[];
  weightEntries: WeightEntry[];
  dailySummaries: DailySummary[];
  exerciseEntries: ExerciseEntry[];
  allEntries: VaultEntry[];
  imageMap: Record<string, string>;
}
