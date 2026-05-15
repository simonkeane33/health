import type { FoodEntry, WeightEntry, DailySummary } from './schemas';

export interface AggregatedDay {
  entry_date: string;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  fluids_ml: number;
  alcohol_units: number;
  food_entries: number;
  needs_review_count: number;
  weight_kg?: number;
  body_fat_pct?: number;
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
      sugar_g: note.sugar_g ?? 0,
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
    const bmi = latestWeight?.bmi ?? (
      latestWeight?.weight_kg && latestWeight?.height_cm
        ? latestWeight.weight_kg / Math.pow(latestWeight.height_cm / 100, 2)
        : undefined
    );

    const computed: AggregatedDay = {
      entry_date: date,
      total_calories: sum(foods, 'estimated_calories'),
      protein_g: sum(foods, 'protein_g'),
      carbs_g: sum(foods, 'carbs_g'),
      fat_g: sum(foods, 'fat_g'),
      fiber_g: sum(foods, 'fiber_g'),
      sugar_g: sum(foods, 'sugar_g'),
      fluids_ml: sum(foods, 'fluids_ml'),
      alcohol_units: sum(foods, 'alcohol_units'),
      food_entries: foods.length,
      needs_review_count: foods.filter((f) => f.needs_review === true).length,
      weight_kg: latestWeight?.weight_kg,
      body_fat_pct: latestWeight?.body_fat_pct,
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
        // Prefer the daily_summary note values when they are non-zero — the note
        // is the authoritative rollup written by Hermes after reviewing all entries.
        // Fall back to the computed sum from individual food_entry files only when
        // the daily_summary has no value (e.g. older notes missing a field).
        total_calories: existing.total_calories || computed.total_calories,
        protein_g: existing.protein_g || computed.protein_g,
        carbs_g: existing.carbs_g || computed.carbs_g,
        fat_g: existing.fat_g || computed.fat_g,
        fiber_g: existing.fiber_g || computed.fiber_g,
        sugar_g: existing.sugar_g || computed.sugar_g,
        fluids_ml: existing.fluids_ml || computed.fluids_ml,
        alcohol_units: existing.alcohol_units || computed.alcohol_units,
        food_entries: computed.food_entries || existing.food_entries,
        needs_review_count: computed.needs_review_count || existing.needs_review_count,
        weight_kg: existing.weight_kg ?? computed.weight_kg,
        body_fat_pct: existing.body_fat_pct ?? computed.body_fat_pct,
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
    sugar_g: day.sugar_g,
    fluids_ml: day.fluids_ml,
    alcohol_units: day.alcohol_units,
    food_entries: day.food_entries,
    needs_review_count: day.needs_review_count,
    intake_complete: day.intake_complete,
    weight_kg: day.weight_kg,
    body_fat_pct: day.body_fat_pct,
    muscle_mass_pct: day.muscle_mass_pct,
    bone_mass_pct: day.bone_mass_pct,
    body_water_pct: day.body_water_pct,
    bmi: day.bmi,
    source: 'computed',
  };
}

export function computeMacroPercentages(summary: DailySummary): {
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
} {
  const protein = (summary.protein_g ?? 0) * 4;
  const carbs = (summary.carbs_g ?? 0) * 4;
  const fat = (summary.fat_g ?? 0) * 9;
  const total = protein + carbs + fat;
  if (total === 0) return { protein_pct: 0, carbs_pct: 0, fat_pct: 0 };
  return {
    protein_pct: Math.round((protein / total) * 100),
    carbs_pct: Math.round((carbs / total) * 100),
    fat_pct: Math.round((fat / total) * 100),
  };
}

export interface WeeklyMacroPoint {
  date: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

export function prepareWeeklyMacros(
  summaries: DailySummary[],
  days: number,
): WeeklyMacroPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return [...summaries]
    .filter((s) => new Date(s.entry_date + 'T00:00:00') >= cutoff)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map((s) => {
      const protein_g = s.protein_g ?? 0;
      const carbs_g = s.carbs_g ?? 0;
      const fat_g = s.fat_g ?? 0;
      const cals = protein_g * 4 + carbs_g * 4 + fat_g * 9;
      return {
        date: s.entry_date.slice(5),
        protein_g,
        carbs_g,
        fat_g,
        protein_pct: cals > 0 ? Math.round((protein_g * 4 / cals) * 100) : 0,
        carbs_pct: cals > 0 ? Math.round((carbs_g * 4 / cals) * 100) : 0,
        fat_pct: cals > 0 ? Math.round((fat_g * 9 / cals) * 100) : 0,
      };
    });
}
