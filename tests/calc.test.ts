import { describe, expect, it } from 'vitest';
import { calculateFoodMetrics } from '@/lib/calc';

describe('calculateFoodMetrics', () => {
  it('returns expected totals and calories per ounce', () => {
    const metrics = calculateFoodMetrics([
      {
        id: '1',
        name: 'Oats',
        category: 'breakfast',
        weight_g: 100,
        calories: 390,
        packaging_weight_g: 12,
        water_ml_needed: 250,
        satisfaction_1_5: 4,
      },
      {
        id: '2',
        name: 'Noodles',
        category: 'dinner',
        weight_g: 120,
        calories: 480,
        packaging_weight_g: 8,
        water_ml_needed: 400,
        satisfaction_1_5: 5,
      },
    ]);

    expect(metrics.totalFoodWeightG).toBe(220);
    expect(metrics.totalCalories).toBe(870);
    expect(metrics.packagingWasteG).toBe(20);
    expect(metrics.totalMealWaterMl).toBe(650);
    expect(metrics.caloriesPerOunce).toBeCloseTo(112.11, 2);
    expect(metrics.caloriesPerOunce).toBeCloseTo(112.17, 2);
  });
});
