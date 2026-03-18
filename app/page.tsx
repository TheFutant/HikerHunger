'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { calculateFoodMetrics } from '@/lib/calc';
import { importTripJson, exportTripJson } from '@/lib/json';
import { parseGpx, tripToGpx } from '@/lib/gpx';
import { listTrips, saveTrip, deleteTrip } from '@/lib/db';
import type { FoodItem, Trip, Waypoint } from '@/lib/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type Tab = 'trips' | 'map' | 'food' | 'settings';

const emptyTrip = (): Trip => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    notes: '',
    routes: [],
    waypoints: [],
    foodItems: [],
    createdAt: now,
    updatedAt: now,
  };
};

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('trips');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [draft, setDraft] = useState<Trip>(emptyTrip());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    listTrips().then((items) => {
      setTrips(items);
      if (items[0]) {
        setSelectedTripId(items[0].id);
        setDraft(items[0]);
      }
    });

    const syncStatus = () => setIsOnline(navigator.onLine);
    syncStatus();
    window.addEventListener('online', syncStatus);
    window.addEventListener('offline', syncStatus);
    return () => {
      window.removeEventListener('online', syncStatus);
      window.removeEventListener('offline', syncStatus);
    };
  }, []);

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? null;
  const metrics = useMemo(() => calculateFoodMetrics(selectedTrip?.foodItems ?? []), [selectedTrip]);

  async function persist(trip: Trip) {
    const next = { ...trip, updatedAt: new Date().toISOString() };
    await saveTrip(next);
    const all = await listTrips();
    setTrips(all);
    setSelectedTripId(next.id);
    setDraft(next);
  }

  async function removeTrip() {
    if (!selectedTrip) return;
    if (!confirm(`Delete "${selectedTrip.name || 'Untitled trip'}"? This cannot be undone.`)) return;
    await deleteTrip(selectedTrip.id);
    const all = await listTrips();
    setTrips(all);
    const next = all[0] ?? null;
    setSelectedTripId(next?.id ?? '');
    setDraft(next ?? emptyTrip());
  }

  async function addFoodItem() {
    if (!selectedTrip) return;
    const item: FoodItem = {
      id: crypto.randomUUID(),
      name: 'New item',
      category: 'meal',
      weight_g: 100,
      calories: 400,
      packaging_weight_g: 10,
      water_ml_needed: 0,
      satisfaction_1_5: 3,
      notes: '',
    };
    await persist({ ...selectedTrip, foodItems: [...selectedTrip.foodItems, item] });
  }

  async function addWaypoint() {
    if (!selectedTrip) return;
    const wp: Waypoint = {
      id: crypto.randomUUID(),
      name: 'New waypoint',
      type: 'camp',
      lat: 37.77,
      lon: -122.42,
      notes: '',
    };
    await persist({ ...selectedTrip, waypoints: [...selectedTrip.waypoints, wp] });
  }

  async function onImportGpx(file: File) {
    if (!selectedTrip) return;
    const xml = await file.text();
    const parsed = parseGpx(xml);
    await persist({ ...selectedTrip, routes: parsed.routes, waypoints: parsed.waypoints });
    setTab('map');
  }

  function download(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-24 pt-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">HikerHunger</h1>
        <span
          className={`rounded-full px-2 py-1 text-xs ${isOnline ? 'bg-emerald-900 text-emerald-200' : 'bg-amber-900 text-amber-200'}`}
          aria-live="polite"
        >
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </header>

      {tab === 'trips' && (
        <section className="space-y-3">
          <button
            className="w-full bg-indigo-600 font-semibold"
            onClick={async () => {
              const t = emptyTrip();
              await persist(t);
            }}
          >
            Create trip
          </button>

          <label className="block">
            Select trip
            <select
              className="mt-1 w-full"
              value={selectedTripId}
              onChange={(e) => {
                setSelectedTripId(e.target.value);
                const match = trips.find((t) => t.id === e.target.value);
                if (match) setDraft(match);
              }}
            >
              <option value="">None</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name || 'Untitled trip'}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-2">
            <label>
              Name
              <input
                className="mt-1 w-full"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                aria-label="Trip name"
              />
            </label>
            <label>
              Location
              <input
                className="mt-1 w-full"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                aria-label="Trip location"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label>
                Start
                <input
                  type="date"
                  className="mt-1 w-full"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                />
              </label>
              <label>
                End
                <input
                  type="date"
                  className="mt-1 w-full"
                  value={draft.endDate}
                  onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                />
              </label>
            </div>
            <label>
              Notes
              <textarea
                className="mt-1 w-full"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={3}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="bg-emerald-700 font-semibold" onClick={() => persist(draft)}>
              Save trip details
            </button>
            <button className="bg-red-800 font-semibold" onClick={removeTrip} disabled={!selectedTrip}>
              Delete trip
            </button>
          </div>

          <label className="block">
            Import GPX
            <input
              type="file"
              accept=".gpx,application/gpx+xml"
              className="mt-1 w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportGpx(file);
              }}
            />
          </label>

          <button className="w-full" onClick={addWaypoint} disabled={!selectedTrip}>
            Add waypoint
          </button>
        </section>
      )}

      {tab === 'map' && (
        <section className="space-y-3">
          <MapView trip={selectedTrip} />
          {selectedTrip?.routes.map((r) => (
            <div key={r.day} className="rounded-lg border border-zinc-700 p-2 text-xs">
              <p className="font-semibold">{r.meta.name}</p>
              <p>
                {r.meta.distanceKm} km · {r.meta.pointCount} points · gain {r.meta.elevationGainM} m
              </p>
            </div>
          ))}
        </section>
      )}

      {tab === 'food' && (
        <section className="space-y-3">
          <button className="w-full bg-indigo-600 font-semibold" onClick={addFoodItem} disabled={!selectedTrip}>
            Add food item
          </button>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Food weight" value={`${metrics.totalFoodWeightG} g`} />
            <Stat label="Calories" value={`${metrics.totalCalories}`} />
            <Stat label="Cal/oz" value={`${metrics.caloriesPerOunce}`} />
            <Stat label="Packaging" value={`${metrics.packagingWasteG} g`} />
            <Stat label="Meal water" value={`${metrics.totalMealWaterMl} ml`} />
          </div>

          {selectedTrip?.foodItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-zinc-700 p-2 text-sm">
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-zinc-400">
                {item.category} · {item.weight_g}g · {item.calories} cal
              </p>
            </div>
          ))}
        </section>
      )}

      {tab === 'settings' && (
        <section className="space-y-3 text-sm">
          <button
            className="w-full"
            onClick={() => selectedTrip && download(`${selectedTrip.name || 'trip'}.json`, exportTripJson(selectedTrip), 'application/json')}
            disabled={!selectedTrip}
          >
            Export trip as JSON
          </button>
          <button
            className="w-full"
            onClick={() => selectedTrip && download(`${selectedTrip.name || 'trip'}.gpx`, tripToGpx(selectedTrip), 'application/gpx+xml')}
            disabled={!selectedTrip}
          >
            Export trip as GPX
          </button>
          <label className="block">
            Import trip JSON
            <input
              type="file"
              accept="application/json,.json"
              className="mt-1 w-full"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const trip = importTripJson(await file.text());
                await persist(trip);
              }}
            />
          </label>
        </section>
      )}

      <nav className="fixed inset-x-0 bottom-0 mx-auto grid w-full max-w-md grid-cols-4 border-t border-zinc-700 bg-zinc-900 p-2">
        <TabButton label="Trips" active={tab === 'trips'} onClick={() => setTab('trips')} />
        <TabButton label="Map" active={tab === 'map'} onClick={() => setTab('map')} />
        <TabButton label="Food/Water" active={tab === 'food'} onClick={() => setTab('food')} />
        <TabButton label="Settings" active={tab === 'settings'} onClick={() => setTab('settings')} />
      </nav>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-700 p-2">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`mx-1 rounded-lg px-2 py-2 text-xs font-semibold ${active ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
    >
      {label}
    </button>
  );
}
