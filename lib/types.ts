export type WaypointType = 'trailhead' | 'water' | 'camp' | 'bailout';

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
  name: string;
  category: string;
  weight_g: number;
  calories: number;
  packaging_weight_g: number;
  water_ml_needed: number;
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
  routes: TripRoute[];
  waypoints: Waypoint[];
  foodItems: FoodItem[];
  createdAt: string;
  updatedAt: string;
}
