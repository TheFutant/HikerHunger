import { openDB } from 'idb';
import type { Trip } from './types';

const DB_NAME = 'hikerhunger-db';
const STORE = 'trips';

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function listTrips(): Promise<Trip[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function saveTrip(trip: Trip): Promise<void> {
  const db = await getDb();
  await db.put(STORE, trip);
}
