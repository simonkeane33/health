import { describe, it, expect } from 'vitest';
import { buildMealBreakdown, dominantMealType, mealTypeColor, aggregateByMealType } from './mealBreakdown';
import type { FoodEntry } from './types';

function makeEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: '1',
    entry_type: 'food_entry',
    logged_at: '2024-01-01T08:00:00Z',
    entry_date: '2024-01-01',
    meal_type: 'Breakfast',
    source: 'test',
    items: ['Eggs'],
    estimated_calories: 300,
    protein_g: 20,
    carbs_g: 10,
    fat_g: 15,
    fiber_g: 2,
    sugar_g: 3,
    fluids_ml: 0,
    confidence: 1,
    needs_review: false,
    review_status: 'confirmed',
    user_confirmed: true,
    ...overrides,
  };
}

describe('buildMealBreakdown', () => {
  it('aggregates by meal type', () => {
    const entries = [
      makeEntry({ meal_type: 'Breakfast', estimated_calories: 300, protein_g: 20 }),
      makeEntry({ meal_type: 'Breakfast', estimated_calories: 200, protein_g: 10 }),
      makeEntry({ meal_type: 'Lunch', estimated_calories: 600, protein_g: 40 }),
    ];

    const result = buildMealBreakdown(entries);
    expect(result).toHaveLength(2);

    const breakfast = result.find((r) => r.type === 'Breakfast')!;
    expect(breakfast.count).toBe(2);
    expect(breakfast.calories).toBe(500);
    expect(breakfast.protein).toBe(30);

    const lunch = result.find((r) => r.type === 'Lunch')!;
    expect(lunch.count).toBe(1);
    expect(lunch.calories).toBe(600);
    expect(lunch.protein).toBe(40);
  });

  it('orders Breakfast, Lunch, Dinner, Snack, Drink then alphabetically', () => {
    const entries = [
      makeEntry({ meal_type: 'Snack' }),
      makeEntry({ meal_type: 'Lunch' }),
      makeEntry({ meal_type: 'Other' }),
      makeEntry({ meal_type: 'Breakfast' }),
      makeEntry({ meal_type: 'Dinner' }),
      makeEntry({ meal_type: 'Drink' }),
    ];

    const result = buildMealBreakdown(entries);
    expect(result.map((r) => r.type)).toEqual([
      'Breakfast',
      'Lunch',
      'Dinner',
      'Snack',
      'Drink',
      'Other',
    ]);
  });

  it('returns empty for no entries', () => {
    expect(buildMealBreakdown([])).toEqual([]);
  });

  it('groups empty meal_type as Other', () => {
    const entries = [makeEntry({ meal_type: '' }), makeEntry({ meal_type: '' })];
    const result = buildMealBreakdown(entries);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Other');
    expect(result[0].count).toBe(2);
  });

  it('sums optional fields safely', () => {
    const entries = [
      makeEntry({ meal_type: 'Lunch', protein_g: undefined, fat_g: undefined }),
      makeEntry({ meal_type: 'Lunch', protein_g: 10, fat_g: 5 }),
    ];

    const result = buildMealBreakdown(entries);
    const lunch = result[0];
    expect(lunch.protein).toBe(10);
    expect(lunch.fat).toBe(5);
  });
});

describe('dominantMealType', () => {
  it('returns the type with highest calories', () => {
    const breakdowns = [
      { type: 'Breakfast', count: 1, calories: 200, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, fluids: 0 },
      { type: 'Dinner', count: 1, calories: 800, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, fluids: 0 },
    ];
    expect(dominantMealType(breakdowns)).toBe('Dinner');
  });

  it('returns undefined for empty array', () => {
    expect(dominantMealType([])).toBeUndefined();
  });
});

describe('mealTypeColor', () => {
  it('returns hex for known types', () => {
    expect(mealTypeColor('Breakfast')).toBe('#f59e0b');
    expect(mealTypeColor('Lunch')).toBe('#10b981');
  });

  it('returns fallback for unknown type', () => {
    expect(mealTypeColor('Supper')).toBe('#a1a1aa');
  });
});

describe('aggregateByMealType', () => {
  it('aggregates across all entries when rangeDays is 0', () => {
    const entries = [
      makeEntry({ meal_type: 'Breakfast', estimated_calories: 300, protein_g: 20 }),
      makeEntry({ meal_type: 'Lunch', estimated_calories: 500, protein_g: 30 }),
    ];

    const result = aggregateByMealType(entries, 0);
    expect(result).toHaveProperty('Breakfast');
    expect(result).toHaveProperty('Lunch');
    expect(result['Breakfast'].calories).toBe(300);
    expect(result['Breakfast'].count).toBe(1);
  });

  it('filters by rangeDays', () => {
    const today = new Date().toISOString().split('T')[0];
    const old = new Date();
    old.setDate(old.getDate() - 60);
    const oldDate = old.toISOString().split('T')[0];

    const entries = [
      makeEntry({ meal_type: 'Breakfast', estimated_calories: 100, entry_date: today }),
      makeEntry({ meal_type: 'OldMeal', estimated_calories: 999, entry_date: oldDate }),
    ];

    const result = aggregateByMealType(entries, 30);
    expect(result).toHaveProperty('Breakfast');
    expect(result).not.toHaveProperty('OldMeal');
  });
});
