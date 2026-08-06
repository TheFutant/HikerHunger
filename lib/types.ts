export type WaypointType = 'trailhead' | 'water' | 'camp' | 'bailout';

/** How a food item is prepared: eaten as-is, rehydrated cold, or needs boiling water. */
export type PrepMethod = 'ready' | 'cold_soak' | 'hot_water';

export interface RoutePoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface RouteMeta {
  name: string;
  distanceKm: number;
  pointCount: number;
  bounds: [number, number, number, number] | null;
  elevationGainM: number;
}

export interface TripRoute {
  day: 1 | 2;
  points: RoutePoint[];
  meta: RouteMeta;
}

export interface Waypoint {
  id: string;
  name: string;
  type: WaypointType;
  lat: number;
  lon: number;
  notes?: string;
}

export interface FoodItem {
  id: string;
  tripId?: string;
  /** 1-based trip day this item is planned for; undefined = unassigned. */
  day?: number;
  name: string;
  category: string;
  weight_g: number;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  packaging_weight_g: number;
  water_ml_needed: number;
  /** undefined = unspecified (treated as ready to eat, never flagged). */
  prep?: PrepMethod;
  /** Cold-soak rehydration time in minutes; only meaningful when prep is 'cold_soak'. */
  soak_minutes?: number;
  quantity: number;
  satisfaction_1_5: number;
  notes?: string;
}

export interface Trip {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  notes: string;
  /** Target calories per person per day; undefined = no target set. */
  dailyCalorieTarget?: number;
  /** Estimated drinking water per person per day in ml (excludes meal water); undefined = not set. */
  dailyDrinkingWaterMl?: number;
  /** No-stove (cold soak) trip: items needing hot water are flagged as conflicts. */
  noStove?: boolean;
  routes: TripRoute[];
  waypoints: Waypoint[];
  foodItems: FoodItem[];
  createdAt: string;
  updatedAt: string;
}
