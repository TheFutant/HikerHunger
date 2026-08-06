import type { FoodItem } from './types';

export const GRAMS_PER_OUNCE = 28.3495;

export function calPerOz(calories: number, weight_g: number): number {
  const oz = weight_g / GRAMS_PER_OUNCE;
  return oz > 0 ? Number((calories / oz).toFixed(1)) : 0;
}

/** ≥100 = great, ≥75 = ok, <75 = poor */
export function calPerOzTier(cpo: number): 'great' | 'ok' | 'poor' {
  if (cpo >= 100) return 'great';
  if (cpo >= 75) return 'ok';
  return 'poor';
}

export interface FoodMetrics {
  totalFoodWeightG: number;
  totalCalories: number;
  caloriesPerOunce: number;
  packagingWasteG: number;
  totalMealWaterMl: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
}

export function calculateFoodMetrics(items: FoodItem[]): FoodMetrics {
  const qty = (i: FoodItem) => i.quantity ?? 1;
  const sum = (pick: (i: FoodItem) => number) =>
    items.reduce((total, i) => total + pick(i) * qty(i), 0);

  const totalFoodWeightG = sum((i) => i.weight_g);
  const totalCalories = sum((i) => i.calories);
  const ounces = totalFoodWeightG / GRAMS_PER_OUNCE;

  return {
    totalFoodWeightG,
    totalCalories,
    caloriesPerOunce: ounces > 0 ? Number((totalCalories / ounces).toFixed(2)) : 0,
    packagingWasteG: sum((i) => i.packaging_weight_g),
    totalMealWaterMl: sum((i) => i.water_ml_needed),
    totalProteinG: sum((i) => i.protein_g ?? 0),
    totalCarbsG: sum((i) => i.carbs_g ?? 0),
    totalFatG: sum((i) => i.fat_g ?? 0),
  };
}

/**
 * Inclusive number of days a trip spans, from ISO date strings (YYYY-MM-DD).
 * Returns 0 when either date is missing/invalid, or when end precedes start.
 */
export function tripDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end - start) / msPerDay) + 1;
}

/** Whole calories per day, or null when the trip length is unknown. */
export function caloriesPerDay(totalCalories: number, days: number): number | null {
  if (days <= 0) return null;
  return Math.round(totalCalories / days);
}

/** Items that need hot water — conflicts on a no-stove (cold soak) trip. */
export function hotWaterItems(items: FoodItem[]): FoodItem[] {
  return items.filter((i) => i.prep === 'hot_water');
}

export interface DayWaterPlan {
  mealMl: number;
  drinkingMl: number;
  totalMl: number;
  /** Total rounded to 0.1 L; water weighs 1 kg/L, so this is also the carry weight in kg. */
  totalLiters: number;
}

/** Combine a day's meal water with the trip's daily drinking-water estimate. */
export function dayWaterPlan(mealMl: number, drinkingMl: number): DayWaterPlan {
  const totalMl = mealMl + drinkingMl;
  return { mealMl, drinkingMl, totalMl, totalLiters: Math.round(totalMl / 100) / 10 };
}

/**
 * How a day's planned calories compare to the daily target.
 * <90% = under, 90–115% = good, >115% = over.
 */
export function calorieTargetTier(calories: number, target: number): 'under' | 'good' | 'over' {
  if (target <= 0) return 'good';
  const ratio = calories / target;
  if (ratio < 0.9) return 'under';
  if (ratio > 1.15) return 'over';
  return 'good';
}
