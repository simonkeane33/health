/**
 * Produce a stable key for grouping recurring meal / drink entries.
 */
export function normalizeMealKey(items: string[], calories: number): string {
  const sorted = [...items].map((s) => s.trim().toLowerCase()).sort();
  return `${sorted.join(' + ')}|${Math.round(calories)}`;
}
