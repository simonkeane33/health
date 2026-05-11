import { describe, it, expect } from 'vitest';
import { parseVaultFile, parseVaultEntry } from '@/lib/parser';

const sampleDailySummary = `---
entry_type: daily_summary
id: ds-001
entry_date: "2026-05-01"
total_calories: 2100
protein_g: 120
fluids_ml: 2600
weight_kg: 82.5
bmi: 26.1
body_fat_pct: 25.0
muscle_mass_pct: 71.3
bone_mass_pct: 3.7
body_water_pct: 52.0
food_entries: 3
source: manual
---
Food eaten today...
`;

const sampleFoodEntry = `---
entry_type: food_entry
id: food-001
entry_date: "2026-05-01"
logged_at: "2026-05-01T08:30:00Z"
meal_type: breakfast
source: manual
items:
  - scrambled eggs
  - toast
estimated_calories: 450
confidence: 0.85
needs_review: false
review_status: pending
---
`;

const sampleWeightEntry = `---
entry_type: weight_entry
id: weight-001
entry_date: "2026-05-01"
logged_at: "2026-05-01T07:00:00Z"
weight_kg: 82.5
body_fat_pct: 25.0
muscle_mass_pct: 71.3
bone_mass_pct: 3.7
body_water_pct: 52.0
height_cm: 178
source: withings
confidence: 0.95
needs_review: false
---
`;

describe('parseVaultFile', () => {
  it('parses a daily summary markdown file', () => {
    const entry = parseVaultFile('2026-05-01.md', sampleDailySummary);
    expect(entry).not.toBeNull();
    expect(entry!.entry_type).toBe('daily_summary');
    expect(entry!.entry_date).toBe('2026-05-01');
    if (entry && entry.entry_type === 'daily_summary') {
      expect(entry.total_calories).toBe(2100);
      expect(entry.weight_kg).toBe(82.5);
      expect(entry.bmi).toBe(26.1);
      expect(entry.body_fat_pct).toBe(25.0);
      expect(entry.muscle_mass_pct).toBe(71.3);
      expect(entry.bone_mass_pct).toBe(3.7);
      expect(entry.body_water_pct).toBe(52.0);
    }
  });

  it('parses a food entry markdown file', () => {
    const entry = parseVaultFile('food-001.md', sampleFoodEntry);
    expect(entry).not.toBeNull();
    expect(entry!.entry_type).toBe('food_entry');
    if (entry && entry.entry_type === 'food_entry') {
      expect(entry.items).toContain('scrambled eggs');
      expect(entry.estimated_calories).toBe(450);
    }
  });

  it('parses a weight entry markdown file', () => {
    const entry = parseVaultFile('weight-001.md', sampleWeightEntry);
    expect(entry).not.toBeNull();
    expect(entry!.entry_type).toBe('weight_entry');
    if (entry && entry.entry_type === 'weight_entry') {
      expect(entry.weight_kg).toBe(82.5);
      expect(entry.body_fat_pct).toBe(25.0);
      expect(entry.muscle_mass_pct).toBe(71.3);
      expect(entry.bone_mass_pct).toBe(3.7);
      expect(entry.body_water_pct).toBe(52.0);
      expect(entry.height_cm).toBe(178);
    }
  });

  it('returns null for files without frontmatter', () => {
    const entry = parseVaultFile('note.md', 'Just some plain text without YAML front matter.');
    expect(entry).toBeNull();
  });
});

describe('parseVaultEntry dispatch', () => {
  it('returns null for unknown entry_type', () => {
    const result = parseVaultEntry({ entry_type: 'unknown_thing' });
    expect(result).toBeNull();
  });
});
