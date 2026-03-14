import type { FoodItem } from './types';

const GRAMS_PER_OUNCE = 28.3495;

export interface FoodMetrics {
  totalFoodWeightG: number;
  totalCalories: number;
  caloriesPerOunce: number;
  packagingWasteG: number;
  totalMealWaterMl: number;
}

export function calculateFoodMetrics(items: FoodItem[]): FoodMetrics {
  const totalFoodWeightG = items.reduce((sum, i) => sum + i.weight_g, 0);
  const totalCalories = items.reduce((sum, i) => sum + i.calories, 0);
  const packagingWasteG = items.reduce((sum, i) => sum + i.packaging_weight_g, 0);
  const totalMealWaterMl = items.reduce((sum, i) => sum + i.water_ml_needed, 0);
  const ounces = totalFoodWeightG / GRAMS_PER_OUNCE;

  return {
    totalFoodWeightG,
    totalCalories,
    caloriesPerOunce: ounces > 0 ? Number((totalCalories / ounces).toFixed(2)) : 0,
    packagingWasteG,
    totalMealWaterMl,
  };
}
