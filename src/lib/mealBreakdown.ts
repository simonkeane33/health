import type { FoodEntry } from './types';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Drink';

export interface MealBreakdown {
  type: MealType | string;
  count: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  fluids: number;
}

const MEAL_ORDER: (MealType | string)[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink'];

export function buildMealBreakdown(entries: FoodEntry[]): MealBreakdown[] {
  const map = new Map<string, MealBreakdown>();

  for (const entry of entries) {
    const type = entry.meal_type || 'Other';
    const existing = map.get(type);

    if (existing) {
      existing.count += 1;
      existing.calories += entry.estimated_calories || 0;
      existing.protein += entry.protein_g || 0;
      existing.carbs += entry.carbs_g || 0;
      existing.fat += entry.fat_g || 0;
      existing.fiber += entry.fiber_g || 0;
      existing.sugar += entry.sugar_g || 0;
      existing.fluids += entry.fluids_ml || 0;
    } else {
      map.set(type, {
        type,
        count: 1,
        calories: entry.estimated_calories || 0,
        protein: entry.protein_g || 0,
        carbs: entry.carbs_g || 0,
        fat: entry.fat_g || 0,
        fiber: entry.fiber_g || 0,
        sugar: entry.sugar_g || 0,
        fluids: entry.fluids_ml || 0,
      });
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) => {
    const idxA = MEAL_ORDER.indexOf(a.type);
    const idxB = MEAL_ORDER.indexOf(b.type);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.type.localeCompare(b.type);
  });

  return result;
}

export function dominantMealType(breakdowns: MealBreakdown[]): string | undefined {
  if (breakdowns.length === 0) return undefined;
  let max = breakdowns[0];
  for (const b of breakdowns) {
    if (b.calories > max.calories) max = b;
  }
  return max.type;
}

export function mealTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Breakfast: '#f59e0b',
    Lunch:     '#10b981',
    Dinner:    '#3b82f6',
    Snack:     '#f43f5e',
    Drink:     '#06b6d4',
  };
  return colors[type] || '#a1a1aa';
}

export function aggregateByMealType(
  entries: FoodEntry[],
  rangeDays: number = 0
): Record<string, { calories: number; protein: number; count: number }> {
  let filtered = entries;
  if (rangeDays > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);
    filtered = entries.filter((e) => new Date(e.entry_date) >= cutoff);
  }

  const out: Record<string, { calories: number; protein: number; count: number }> = {};
  for (const entry of filtered) {
    const type = entry.meal_type || 'Other';
    if (!out[type]) {
      out[type] = { calories: 0, protein: 0, count: 0 };
    }
    out[type].calories += entry.estimated_calories || 0;
    out[type].protein += entry.protein_g || 0;
    out[type].count += 1;
  }
  return out;
}
