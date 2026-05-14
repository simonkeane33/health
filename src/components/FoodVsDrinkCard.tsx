'use client';

import type { FoodEntry } from '@/lib/types';
import { Utensils, GlassWater } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  entries: FoodEntry[];
}

export function FoodVsDrinkCard({ entries }: Props) {
  let foodCount = 0;
  let drinkCount = 0;

  for (const entry of entries) {
    const mealType = (entry.meal_type ?? '').toLowerCase().trim();
    // Drink = explicit drink/beverage meal_type, OR has fluids but ~no solid food
    // (small fluids_ml accompanying a meal like soup or 10ml dressing isn't a "drink")
    const calories = entry.estimated_calories ?? 0;
    const fluidsHeavy = (entry.fluids_ml ?? 0) >= 100;
    const lowSolidCalsRatio = calories === 0 || (entry.fluids_ml ?? 0) / Math.max(calories, 1) > 1.5;
    const isDrink =
      mealType === 'drink' ||
      mealType === 'beverage' ||
      (fluidsHeavy && lowSolidCalsRatio);
    if (isDrink) drinkCount++;
    else foodCount++;
  }

  const total = foodCount + drinkCount;
  const foodPct = total > 0 ? (foodCount / total) * 100 : 0;
  const drinkPct = total > 0 ? (drinkCount / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Food vs drinks</div>
        <CardTitle className="text-lg">How many are food or drinks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary" className="gap-1">
            <Utensils className="w-3 h-3" />
            {foodCount}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <GlassWater className="w-3 h-3" />
            {drinkCount}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {total} entries
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${foodPct}%` }}
          />
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${drinkPct}%` }}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Food {foodPct.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1">
            Drinks {drinkPct.toFixed(0)}%
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
