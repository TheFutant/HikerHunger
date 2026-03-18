'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateFoodMetrics } from '@/lib/calc';
import { importTripJson, exportTripJson } from '@/lib/json';
import { parseGpx, tripToGpx } from '@/lib/gpx';
import { listTrips, saveTrip, deleteTrip } from '@/lib/db';
import type { FoodItem, Trip, Waypoint, WaypointType } from '@/lib/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type Tab = 'trips' | 'map' | 'food' | 'settings';

const WAYPOINT_TYPES: WaypointType[] = ['trailhead', 'water', 'camp', 'bailout'];

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
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodDraft, setFoodDraft] = useState<FoodItem | null>(null);
  const [editingWaypointId, setEditingWaypointId] = useState<string | null>(null);
  const [waypointDraft, setWaypointDraft] = useState<Waypoint | null>(null);

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

  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 4000);
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
    const updated = { ...selectedTrip, foodItems: [...selectedTrip.foodItems, item] };
    await persist(updated);
    setEditingFoodId(item.id);
    setFoodDraft(item);
  }

  async function saveFoodItem() {
    if (!selectedTrip || !foodDraft) return;
    const foodItems = selectedTrip.foodItems.map((f) => (f.id === foodDraft.id ? foodDraft : f));
    await persist({ ...selectedTrip, foodItems });
    setEditingFoodId(null);
    setFoodDraft(null);
  }

  async function deleteFoodItem(id: string) {
    if (!selectedTrip) return;
    const foodItems = selectedTrip.foodItems.filter((f) => f.id !== id);
    await persist({ ...selectedTrip, foodItems });
    setEditingFoodId(null);
    setFoodDraft(null);
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
    const updated = { ...selectedTrip, waypoints: [...selectedTrip.waypoints, wp] };
    await persist(updated);
    setEditingWaypointId(wp.id);
    setWaypointDraft(wp);
  }

  async function saveWaypoint() {
    if (!selectedTrip || !waypointDraft) return;
    const waypoints = selectedTrip.waypoints.map((w) => (w.id === waypointDraft.id ? waypointDraft : w));
    await persist({ ...selectedTrip, waypoints });
    setEditingWaypointId(null);
    setWaypointDraft(null);
  }

  async function deleteWaypoint(id: string) {
    if (!selectedTrip) return;
    const waypoints = selectedTrip.waypoints.filter((w) => w.id !== id);
    await persist({ ...selectedTrip, waypoints });
    setEditingWaypointId(null);
    setWaypointDraft(null);
  }

  async function onImportGpx(file: File) {
    if (!selectedTrip) return;
    try {
      const xml = await file.text();
      const parsed = parseGpx(xml);
      await persist({ ...selectedTrip, routes: parsed.routes, waypoints: parsed.waypoints });
      showToast('GPX imported successfully.');
      setTab('map');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to import GPX.', true);
    }
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
            <button
              className="bg-emerald-700 font-semibold"
              onClick={() => {
                if (!draft.name.trim()) {
                  showToast('Trip name is required.', true);
                  return;
                }
                if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
                  showToast('End date cannot be before start date.', true);
                  return;
                }
                persist(draft);
              }}
            >
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Waypoints</span>
              <button className="px-3 py-1 text-xs" onClick={addWaypoint} disabled={!selectedTrip}>
                + Add
              </button>
            </div>
            {selectedTrip && selectedTrip.waypoints.length === 0 && (
              <p className="text-xs text-zinc-500">No waypoints yet. Add one or import a GPX file.</p>
            )}
            {selectedTrip?.waypoints.map((wp) =>
              editingWaypointId === wp.id && waypointDraft ? (
                <div key={wp.id} className="space-y-2 rounded-lg border border-indigo-600 p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      Name
                      <input
                        className="mt-1 w-full"
                        value={waypointDraft.name}
                        onChange={(e) => setWaypointDraft({ ...waypointDraft, name: e.target.value })}
                      />
                    </label>
                    <label>
                      Type
                      <select
                        className="mt-1 w-full"
                        value={waypointDraft.type}
                        onChange={(e) => setWaypointDraft({ ...waypointDraft, type: e.target.value as WaypointType })}
                      >
                        {WAYPOINT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Lat
                      <input
                        type="number"
                        step="any"
                        className="mt-1 w-full"
                        value={waypointDraft.lat}
                        onChange={(e) => setWaypointDraft({ ...waypointDraft, lat: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      Lon
                      <input
                        type="number"
                        step="any"
                        className="mt-1 w-full"
                        value={waypointDraft.lon}
                        onChange={(e) => setWaypointDraft({ ...waypointDraft, lon: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <label>
                    Notes
                    <input
                      className="mt-1 w-full"
                      value={waypointDraft.notes ?? ''}
                      onChange={(e) => setWaypointDraft({ ...waypointDraft, notes: e.target.value })}
                    />
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="bg-emerald-700 text-xs" onClick={saveWaypoint}>Save</button>
                    <button className="text-xs" onClick={() => { setEditingWaypointId(null); setWaypointDraft(null); }}>Cancel</button>
                    <button className="bg-red-800 text-xs" onClick={() => deleteWaypoint(wp.id)}>Delete</button>
                  </div>
                </div>
              ) : (
                <button
                  key={wp.id}
                  className="w-full rounded-lg border border-zinc-700 p-2 text-left text-sm"
                  onClick={() => { setEditingWaypointId(wp.id); setWaypointDraft(wp); }}
                >
                  <p className="font-semibold">{wp.name}</p>
                  <p className="text-xs text-zinc-400">{wp.type} · {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}</p>
                </button>
              )
            )}
          </div>
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

          {selectedTrip && selectedTrip.foodItems.length === 0 && (
            <p className="text-xs text-zinc-500">No food items yet. Add one to start planning.</p>
          )}
          {selectedTrip?.foodItems.map((item) =>
            editingFoodId === item.id && foodDraft ? (
              <div key={item.id} className="space-y-2 rounded-lg border border-indigo-600 p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-2">
                    Name
                    <input
                      className="mt-1 w-full"
                      value={foodDraft.name}
                      onChange={(e) => setFoodDraft({ ...foodDraft, name: e.target.value })}
                    />
                  </label>
                  <label>
                    Category
                    <input
                      className="mt-1 w-full"
                      value={foodDraft.category}
                      onChange={(e) => setFoodDraft({ ...foodDraft, category: e.target.value })}
                    />
                  </label>
                  <label>
                    Satisfaction (1–5)
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="mt-1 w-full"
                      value={foodDraft.satisfaction_1_5}
                      onChange={(e) => setFoodDraft({ ...foodDraft, satisfaction_1_5: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Weight (g)
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full"
                      value={foodDraft.weight_g}
                      onChange={(e) => setFoodDraft({ ...foodDraft, weight_g: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Calories
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full"
                      value={foodDraft.calories}
                      onChange={(e) => setFoodDraft({ ...foodDraft, calories: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Packaging (g)
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full"
                      value={foodDraft.packaging_weight_g}
                      onChange={(e) => setFoodDraft({ ...foodDraft, packaging_weight_g: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Water needed (ml)
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full"
                      value={foodDraft.water_ml_needed}
                      onChange={(e) => setFoodDraft({ ...foodDraft, water_ml_needed: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <label>
                  Notes
                  <input
                    className="mt-1 w-full"
                    value={foodDraft.notes ?? ''}
                    onChange={(e) => setFoodDraft({ ...foodDraft, notes: e.target.value })}
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-emerald-700 text-xs" onClick={saveFoodItem}>Save</button>
                  <button className="text-xs" onClick={() => { setEditingFoodId(null); setFoodDraft(null); }}>Cancel</button>
                  <button className="bg-red-800 text-xs" onClick={() => deleteFoodItem(item.id)}>Delete</button>
                </div>
              </div>
            ) : (
              <button
                key={item.id}
                className="w-full rounded-lg border border-zinc-700 p-2 text-left text-sm"
                onClick={() => { setEditingFoodId(item.id); setFoodDraft(item); }}
              >
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-zinc-400">
                  {item.category} · {item.weight_g}g · {item.calories} cal
                </p>
              </button>
            )
          )}
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
                try {
                  const trip = importTripJson(await file.text());
                  await persist(trip);
                  showToast('Trip imported successfully.');
                } catch (e) {
                  showToast(e instanceof Error ? e.message : 'Failed to import trip JSON.', true);
                }
              }}
            />
          </label>
        </section>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.error ? 'bg-red-800 text-red-100' : 'bg-emerald-800 text-emerald-100'}`}
        >
          {toast.message}
        </div>
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
