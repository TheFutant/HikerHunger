import { openDB } from 'idb';
import type { FoodItem, Trip } from './types';

const DB_NAME = 'hikerhunger-db';
const TRIPS_STORE = 'trips';
const FOOD_STORE = 'foodItems';

async function getDb() {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(TRIPS_STORE)) {
        db.createObjectStore(TRIPS_STORE, { keyPath: 'id' });
      }
      if (oldVersion < 2 && !db.objectStoreNames.contains(FOOD_STORE)) {
        db.createObjectStore(FOOD_STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function listTrips(): Promise<Trip[]> {
  const db = await getDb();
  return db.getAll(TRIPS_STORE);
}

export async function saveTrip(trip: Trip): Promise<void> {
  const db = await getDb();
  await db.put(TRIPS_STORE, trip);
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(TRIPS_STORE, id);
}

export async function listFoodItems(): Promise<FoodItem[]> {
  const db = await getDb();
  return db.getAll(FOOD_STORE);
}

export async function upsertFoodItem(item: FoodItem): Promise<void> {
  const db = await getDb();
  await db.put(FOOD_STORE, item);
}

export async function removeFoodItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(FOOD_STORE, id);
}
