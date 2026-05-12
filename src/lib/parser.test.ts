import { describe, it, expect, vi } from 'vitest';
import { parseVaultFile, parseVaultEntry, extractFrontmatter, parseTargetsConfig } from '@/lib/parser';

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

  it('parses a weight entry with notes containing colons', () => {
    const text = `---\nid: weight-2026-05-11-0850\nentry_type: weight_entry\nlogged_at: '2026-05-11T08:50:00'\nentry_date: '2026-05-11'\nweight_kg: 93.3\nbody_fat_pct: 25.0\nmuscle_mass_pct: 71.3\nbone_mass_pct: 3.7\nbody_water_pct: 52.0\nsource: withings\nconfidence: 1.0\nnotes: "Weighed in from Withings scale screenshot. Body composition: Fat 25.0%, Muscle 71.3%, Bone 3.7%, Water 52.0%. Fasted morning weigh-in."\n---\n\n# Weight entry\n`;
    const entry = parseVaultFile('weight-colons.md', text);
    expect(entry).not.toBeNull();
    expect(entry!.entry_type).toBe('weight_entry');
    if (entry && entry.entry_type === 'weight_entry') {
      expect(entry.weight_kg).toBe(93.3);
      expect(entry.notes).toContain('Body composition:');
    }
  });

  it('returns null for files with malformed YAML (unquoted colons in notes)', () => {
    const text = `---\nid: weight-2026-05-11-0850\nentry_type: weight_entry\nlogged_at: '2026-05-11T08:50:00'\nentry_date: '2026-05-11'\nweight_kg: 93.3\nnotes: Body composition: Fat 25.0%\n---\n\n# Weight entry\n`;
    const entry = parseVaultFile('weight-bad-yaml.md', text);
    expect(entry).toBeNull();
  });

  it('returns null for files without frontmatter', () => {
    const entry = parseVaultFile('note.md', 'Just some plain text without YAML front matter.');
    expect(entry).toBeNull();
  });
  it('parses a food entry with shorthand entry_type "food" and "calories" field', () => {
    const text = `---\nid: food-001\nentry_type: food\nentry_date: "2026-05-11"\nlogged_at: "2026-05-11T17:30:00"\nmeal_type: dinner\nfood_name: Chorizo linguine\ncalories: 693\nprotein_g: 27\ncarbs_g: 72\nfat_g: 33\nsource: manual\n---\n`;
    const entry = parseVaultFile('food-001.md', text);
    expect(entry).not.toBeNull();
    expect(entry!.entry_type).toBe('food_entry');
    if (entry && entry.entry_type === 'food_entry') {
      expect(entry.estimated_calories).toBe(693);
      expect(entry.protein_g).toBe(27);
      expect(entry.items).toContain('Chorizo linguine');
    }
  });
});

describe('parseVaultEntry dispatch', () => {
  it('returns null for unknown entry_type', () => {
    const result = parseVaultEntry({ entry_type: 'unknown_thing' });
    expect(result).toBeNull();
  });
});

describe('Edge cases — malformed or partial frontmatter', () => {
  it('returns null for completely missing frontmatter', () => {
    const text = 'Just some plain text without YAML front matter.';
    const entry = parseVaultFile('no-frontmatter.md', text);
    expect(entry).toBeNull();
  });

  it('returns null for broken YAML syntax (bad indentation)', () => {
    const text = `---
entry_type: food_entry
id: bad-001
entry_date: "2026-05-01"
  meal_type: breakfast
source: manual
---
`;
    const entry = parseVaultFile('bad-indent.md', text);
    expect(entry).toBeNull();
  });

  it('parses correctly when notes contain colons and are properly quoted', () => {
    const text = `---
entry_type: food_entry
id: colon-001
entry_date: "2026-05-01"
logged_at: "2026-05-01T12:00:00"
meal_type: lunch
source: manual
notes: "Lunch at Joe's Cafe: burger and fries"
items:
  - burger
  - fries
---
`;
    const entry = parseVaultFile('colons-quoted.md', text);
    expect(entry).not.toBeNull();
    if (entry && entry.entry_type === 'food_entry') {
      expect(entry.notes).toBe("Lunch at Joe's Cafe: burger and fries");
    }
  });

  it('returns null when notes contain colons and are unquoted', () => {
    const text = `---
entry_type: food_entry
id: colon-002
entry_date: "2026-05-01"
logged_at: "2026-05-01T12:00:00"
meal_type: lunch
source: manual
notes: Lunch at Joe's Cafe: burger and fries
items:
  - burger
---
`;
    const entry = parseVaultFile('colons-unquoted.md', text);
    expect(entry).toBeNull();
  });

  it('parses numeric strings into numbers', () => {
    const text = `---
entry_type: food_entry
id: numeric-001
entry_date: "2026-05-01"
logged_at: "2026-05-01T12:00:00"
meal_type: lunch
source: manual
estimated_calories: "450"
protein_g: "30"
carbs_g: "60"
fat_g: "15"
items:
  - sandwich
---
`;
    const entry = parseVaultFile('numeric-strings.md', text);
    expect(entry).not.toBeNull();
    if (entry && entry.entry_type === 'food_entry') {
      expect(entry.estimated_calories).toBe(450);
      expect(entry.protein_g).toBe(30);
      expect(entry.carbs_g).toBe(60);
      expect(entry.fat_g).toBe(15);
    }
  });

  it('provides sensible defaults for empty / missing required-ish fields', () => {
    const text = `---
entry_type: food_entry
id: empty-001
entry_date: "2026-05-01"
logged_at: "2026-05-01T12:00:00"
items:
  - apple
---
`;
    const entry = parseVaultFile('empty-fields.md', text);
    expect(entry).not.toBeNull();
    if (entry && entry.entry_type === 'food_entry') {
      expect(entry.meal_type).toBe('');
      expect(entry.source).toBe('');
      expect(entry.confidence).toBe(0);
      expect(entry.needs_review).toBe(false);
      expect(entry.review_status).toBe('pending');
      expect(entry.user_confirmed).toBe(false);
      expect(entry.estimated_calories).toBe(0);
    }
  });

  it('logs but does not crash for unknown entry_type values', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const text = `---
entry_type: mystery_type
id: unknown-001
entry_date: "2026-05-01"
source: manual
---
`;
    const entry = parseVaultFile('unknown-type.md', text);
    expect(entry).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    const calls = warnSpy.mock.calls.map((c) => c.join(' '));
    expect(calls.some((c) => c.includes('Unknown'))).toBe(true);
    warnSpy.mockRestore();
  });

  it('gracefully handles empty YAML mapping values', () => {
    const text = `---
entry_type: food_entry
id: empty-002
entry_date: "2026-05-01"
logged_at: "2026-05-01T12:00:00"
meal_type: lunch
source: manual
protein_g:
carbs_g:
fat_g:
items:
  - toast
---
`;
    const entry = parseVaultFile('empty-yaml-values.md', text);
    expect(entry).not.toBeNull();
    if (entry && entry.entry_type === 'food_entry') {
      expect(entry.protein_g).toBeUndefined();
      expect(entry.carbs_g).toBeUndefined();
      expect(entry.fat_g).toBeUndefined();
    }
  });

  it('gracefully handles empty string values for numeric fields', () => {
    const text = `---
entry_type: food_entry
id: empty-003
entry_date: "2026-05-01"
logged_at: "2026-05-01T12:00:00"
meal_type: lunch
source: manual
estimated_calories: ""
protein_g: ""
items:
  - toast
---
`;
    const entry = parseVaultFile('empty-string-numeric.md', text);
    expect(entry).not.toBeNull();
    if (entry && entry.entry_type === 'food_entry') {
      expect(entry.estimated_calories).toBe(0);
      expect(entry.protein_g).toBeUndefined();
    }
  });

  it('handles frontmatter with Windows-style line endings', () => {
    const text = `---\r\nentry_type: weight_entry\r\nid: win-001\r\nentry_date: "2026-05-01"\r\nlogged_at: "2026-05-01T07:00:00"\r\nweight_kg: 80\r\nsource: manual\r\n---\r\n`;
    const entry = parseVaultFile('windows.md', text);
    expect(entry).not.toBeNull();
    if (entry && entry.entry_type === 'weight_entry') {
      expect(entry.weight_kg).toBe(80);
    }
  });
});

describe('parseTargetsConfig', () => {
  const sampleTargetsFile = `---
id: health-targets
entry_type: config
created: 2026-05-11
source: hermes
---

## Active Targets

| Metric | Daily Target | Rationale |
|--------|-----------|-----------|
| **Calories** | **1,974 kcal** | TDEE lightly active at -500 kcal deficit |
| **Protein** | **150 g** | 1.6 g/kg body weight |
| **Fat** | **65 g** | ~30% of calories |
| **Fluids (water)** | **2,500 ml** | Active hydration goal |
`;

  it('extracts calories, protein, and fluids from active targets table', () => {
    const targets = parseTargetsConfig(sampleTargetsFile);
    expect(targets).not.toBeNull();
    expect(targets?.calories_kcal).toBe(1974);
    expect(targets?.protein_g).toBe(150);
    expect(targets?.fluids_ml).toBe(2500);
  });

  it('returns null for non-config entry_type', () => {
    const text = `---\nentry_type: food_entry\nid: x\n---\n| **Calories** | **2000 kcal** |\n`;
    expect(parseTargetsConfig(text)).toBeNull();
  });

  it('returns null when no target values found', () => {
    const text = `---\nentry_type: config\nid: health-targets\n---\n# No table here\n`;
    expect(parseTargetsConfig(text)).toBeNull();
  });

  it('handles optional weight target row', () => {
    const text = `---\nentry_type: config\nid: health-targets\n---\n| **Weight target** | **90 kg** |\n| **Calories** | **1,800 kcal** |\n`;
    const targets = parseTargetsConfig(text);
    expect(targets?.weight_kg).toBe(90);
    expect(targets?.calories_kcal).toBe(1800);
  });
});
