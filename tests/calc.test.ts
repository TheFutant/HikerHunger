import { describe, expect, it } from 'vitest';
import { calculateFoodMetrics, tripDays, caloriesPerDay, calorieTargetTier, dayWaterPlan } from '@/lib/calc';
import type { FoodItem } from '@/lib/types';

const item = (overrides: Partial<FoodItem>): FoodItem => ({
  id: '1',
  name: 'Item',
  category: 'snack',
  weight_g: 100,
  calories: 400,
  packaging_weight_g: 10,
  water_ml_needed: 0,
  quantity: 1,
  satisfaction_1_5: 3,
  ...overrides,
});

describe('calculateFoodMetrics', () => {
  it('returns expected totals and calories per ounce', () => {
    const metrics = calculateFoodMetrics([
      item({ id: '1', name: 'Oats', category: 'breakfast', weight_g: 100, calories: 390, packaging_weight_g: 12, water_ml_needed: 250 }),
      item({ id: '2', name: 'Noodles', category: 'dinner', weight_g: 120, calories: 480, packaging_weight_g: 8, water_ml_needed: 400 }),
    ]);

    expect(metrics.totalFoodWeightG).toBe(220);
    expect(metrics.totalCalories).toBe(870);
    expect(metrics.packagingWasteG).toBe(20);
    expect(metrics.totalMealWaterMl).toBe(650);
    expect(metrics.caloriesPerOunce).toBeCloseTo(112.11, 2);
  });

  it('sums macronutrients and honors quantity', () => {
    const metrics = calculateFoodMetrics([
      item({ id: '1', protein_g: 20, carbs_g: 30, fat_g: 10, quantity: 2 }),
      item({ id: '2', protein_g: 5, carbs_g: 15, fat_g: 3 }),
    ]);

    expect(metrics.totalProteinG).toBe(45);
    expect(metrics.totalCarbsG).toBe(75);
    expect(metrics.totalFatG).toBe(23);
  });

  it('treats missing macros as zero', () => {
    const metrics = calculateFoodMetrics([item({ id: '1' })]);
    expect(metrics.totalProteinG).toBe(0);
    expect(metrics.totalCarbsG).toBe(0);
    expect(metrics.totalFatG).toBe(0);
  });
});

describe('tripDays', () => {
  it('counts inclusive days', () => {
    expect(tripDays('2026-08-01', '2026-08-03')).toBe(3);
    expect(tripDays('2026-08-01', '2026-08-01')).toBe(1);
  });

  it('returns 0 for missing or invalid ranges', () => {
    expect(tripDays('', '2026-08-03')).toBe(0);
    expect(tripDays('2026-08-05', '2026-08-01')).toBe(0);
    expect(tripDays('not-a-date', '2026-08-01')).toBe(0);
  });
});

describe('calorieTargetTier', () => {
  it('flags days well under target', () => {
    expect(calorieTargetTier(2000, 3000)).toBe('under');
    expect(calorieTargetTier(2699, 3000)).toBe('under');
  });

  it('accepts days near target', () => {
    expect(calorieTargetTier(2700, 3000)).toBe('good');
    expect(calorieTargetTier(3000, 3000)).toBe('good');
    expect(calorieTargetTier(3450, 3000)).toBe('good');
  });

  it('flags days well over target', () => {
    expect(calorieTargetTier(3451, 3000)).toBe('over');
  });

  it('treats a non-positive target as always good', () => {
    expect(calorieTargetTier(2000, 0)).toBe('good');
  });
});

describe('dayWaterPlan', () => {
  it('combines meal and drinking water and rounds liters to 0.1', () => {
    const plan = dayWaterPlan(650, 3000);
    expect(plan.totalMl).toBe(3650);
    expect(plan.totalLiters).toBe(3.7);
    expect(plan.mealMl).toBe(650);
    expect(plan.drinkingMl).toBe(3000);
  });

  it('handles zero inputs', () => {
    expect(dayWaterPlan(0, 0)).toEqual({ mealMl: 0, drinkingMl: 0, totalMl: 0, totalLiters: 0 });
  });
});

describe('caloriesPerDay', () => {
  it('divides calories across days', () => {
    expect(caloriesPerDay(6000, 3)).toBe(2000);
  });

  it('returns null when day count is unknown', () => {
    expect(caloriesPerDay(6000, 0)).toBeNull();
  });
});
