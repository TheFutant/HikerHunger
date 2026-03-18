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
}

export function calculateFoodMetrics(items: FoodItem[]): FoodMetrics {
  const qty = (i: FoodItem) => i.quantity ?? 1;
  const totalFoodWeightG = items.reduce((sum, i) => sum + i.weight_g * qty(i), 0);
  const totalCalories = items.reduce((sum, i) => sum + i.calories * qty(i), 0);
  const packagingWasteG = items.reduce((sum, i) => sum + i.packaging_weight_g * qty(i), 0);
  const totalMealWaterMl = items.reduce((sum, i) => sum + i.water_ml_needed * qty(i), 0);
  const ounces = totalFoodWeightG / GRAMS_PER_OUNCE;

  return {
    totalFoodWeightG,
    totalCalories,
    caloriesPerOunce: ounces > 0 ? Number((totalCalories / ounces).toFixed(2)) : 0,
    packagingWasteG,
    totalMealWaterMl,
  };
}
