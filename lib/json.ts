import type { Trip } from './types';

export function exportTripJson(trip: Trip): string {
  return JSON.stringify(trip, null, 2);
}

export function importTripJson(value: string): Trip {
  const parsed = JSON.parse(value) as Trip;
  if (!parsed.id || !parsed.name) {
    throw new Error('Invalid trip JSON payload.');
  }
  return parsed;
}
