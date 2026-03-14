'use client';

import { MapContainer, Marker, Polyline, TileLayer, Popup } from 'react-leaflet';
import type { Trip } from '@/lib/types';
import 'leaflet/dist/leaflet.css';

export default function MapView({ trip }: { trip: Trip | null }) {
  if (!trip) {
    return <p className="text-sm text-zinc-400">Create or select a trip to view map data.</p>;
  }

  const firstPoint = trip.routes.flatMap((r) => r.points)[0];
  const center: [number, number] = firstPoint ? [firstPoint.lat, firstPoint.lon] : [37.7749, -122.4194];

  return (
    <div className="h-[58vh] w-full overflow-hidden rounded-xl border border-zinc-700">
      <MapContainer center={center} zoom={11} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {trip.routes.map((route) => (
          <Polyline
            key={route.day}
            positions={route.points.map((p) => [p.lat, p.lon] as [number, number])}
            pathOptions={{ color: route.day === 1 ? '#22c55e' : '#38bdf8', weight: 4 }}
          />
        ))}

        {trip.waypoints.map((wpt) => (
          <Marker key={wpt.id} position={[wpt.lat, wpt.lon]}>
            <Popup>
              <div>
                <p className="font-semibold">{wpt.name}</p>
                <p className="text-xs uppercase">{wpt.type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
