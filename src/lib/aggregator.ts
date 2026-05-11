import type { FoodEntry, WeightEntry, DailySummary } from './schemas';

export interface AggregatedDay {
  entry_date: string;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  fluids_ml: number;
  alcohol_units: number;
  food_entries: number;
  needs_review_count: number;
  weight_kg?: number;
  fat_mass_pct?: number;
  muscle_mass_pct?: number;
  bone_mass_pct?: number;
  body_water_pct?: number;
  bmi?: number;
  intake_complete: boolean;
}

function sum(items: FoodEntry[], field: keyof FoodEntry): number {
  return items.reduce((acc, item) => {
    const v = item[field];
    return acc + (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
  }, 0);
}

export function aggregateDailySummaries(
  foodEntries: FoodEntry[],
  weightEntries: WeightEntry[],
  dailySummaries: DailySummary[]
): DailySummary[] {
  const byDate = new Map<string, AggregatedDay>();

  // Seed from explicit daily_summary notes
  for (const note of dailySummaries) {
    if (!note.entry_date) continue;
    byDate.set(note.entry_date, {
      entry_date: note.entry_date,
      total_calories: note.total_calories ?? 0,
      protein_g: note.protein_g ?? 0,
      carbs_g: note.carbs_g ?? 0,
      fat_g: note.fat_g ?? 0,
      fiber_g: note.fiber_g ?? 0,
      fluids_ml: note.fluids_ml ?? 0,
      alcohol_units: note.alcohol_units ?? 0,
      food_entries: note.food_entries ?? 0,
      needs_review_count: note.needs_review_count ?? 0,
      weight_kg: note.weight_kg ?? undefined,
      intake_complete: note.intake_complete ?? false,
    });
  }

  // Group food entries by date
  const foodByDate = new Map<string, FoodEntry[]>();
  for (const entry of foodEntries) {
    const date = entry.entry_date;
    if (!date) continue;
    const list = foodByDate.get(date);
    if (list) {
      list.push(entry);
    } else {
      foodByDate.set(date, [entry]);
    }
  }

  // Group weight entries by date
  const weightByDate = new Map<string, WeightEntry[]>();
  for (const entry of weightEntries) {
    const date = entry.entry_date;
    if (!date) continue;
    const list = weightByDate.get(date);
    if (list) {
      list.push(entry);
    } else {
      weightByDate.set(date, [entry]);
    }
  }

  const allDates = new Set<string>([
    ...Array.from(byDate.keys()),
    ...Array.from(foodByDate.keys()),
    ...Array.from(weightByDate.keys()),
  ]);

  for (const date of Array.from(allDates)) {
    const foods = foodByDate.get(date) ?? [];
    const weights = (weightByDate.get(date) ?? []).sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    );

    const latestWeight = weights[0];
    const bmi = latestWeight?.weight_kg && latestWeight?.height_cm
      ? latestWeight.weight_kg / Math.pow(latestWeight.height_cm / 100, 2)
      : undefined;

    const computed: AggregatedDay = {
      entry_date: date,
      total_calories: sum(foods, 'estimated_calories'),
      protein_g: sum(foods, 'protein_g'),
      carbs_g: sum(foods, 'carbs_g'),
      fat_g: sum(foods, 'fat_g'),
      fiber_g: sum(foods, 'fiber_g'),
      fluids_ml: sum(foods, 'fluids_ml'),
      alcohol_units: sum(foods, 'alcohol_units'),
      food_entries: foods.length,
      needs_review_count: foods.filter((f) => f.needs_review === true).length,
      weight_kg: latestWeight?.weight_kg,
      fat_mass_pct: latestWeight?.fat_mass_pct,
      muscle_mass_pct: latestWeight?.muscle_mass_pct,
      bone_mass_pct: latestWeight?.bone_mass_pct,
      body_water_pct: latestWeight?.body_water_pct,
      bmi,
      intake_complete: foods.length > 0 && foods.every((f) => f.needs_review !== true),
    };

    const existing = byDate.get(date);
    if (existing) {
      byDate.set(date, {
        ...computed,
        // Explicit summary values take precedence over computed
        total_calories: existing.total_calories || computed.total_calories,
        protein_g: existing.protein_g || computed.protein_g,
        carbs_g: existing.carbs_g || computed.carbs_g,
        fat_g: existing.fat_g || computed.fat_g,
        fiber_g: existing.fiber_g || computed.fiber_g,
        fluids_ml: existing.fluids_ml || computed.fluids_ml,
        alcohol_units: existing.alcohol_units || computed.alcohol_units,
        food_entries: existing.food_entries || computed.food_entries,
        needs_review_count: existing.needs_review_count || computed.needs_review_count,
        weight_kg: existing.weight_kg ?? computed.weight_kg,
        fat_mass_pct: existing.fat_mass_pct ?? computed.fat_mass_pct,
        muscle_mass_pct: existing.muscle_mass_pct ?? computed.muscle_mass_pct,
        bone_mass_pct: existing.bone_mass_pct ?? computed.bone_mass_pct,
        body_water_pct: existing.body_water_pct ?? computed.body_water_pct,
        bmi: existing.bmi ?? computed.bmi,
        intake_complete: existing.intake_complete || computed.intake_complete,
      });
    } else {
      byDate.set(date, computed);
    }
  }

  const result = Array.from(byDate.values());
  result.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  return result.map(normalizeToDailySummary);
}

function normalizeToDailySummary(day: AggregatedDay): DailySummary {
  return {
    id: `day-${day.entry_date}`,
    entry_type: 'daily_summary',
    entry_date: day.entry_date,
    total_calories: day.total_calories,
    protein_g: day.protein_g,
    carbs_g: day.carbs_g,
    fat_g: day.fat_g,
    fiber_g: day.fiber_g,
    fluids_ml: day.fluids_ml,
    alcohol_units: day.alcohol_units,
    food_entries: day.food_entries,
    needs_review_count: day.needs_review_count,
    intake_complete: day.intake_complete,
    weight_kg: day.weight_kg,
    fat_mass_pct: day.fat_mass_pct,
    muscle_mass_pct: day.muscle_mass_pct,
    bone_mass_pct: day.bone_mass_pct,
    body_water_pct: day.body_water_pct,
    bmi: day.bmi,
    source: 'computed',
  };
}
