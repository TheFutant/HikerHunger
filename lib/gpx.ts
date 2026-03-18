import type { RoutePoint, Trip, TripRoute, Waypoint } from './types';

function text(node: Element, tag: string): string {
  return node.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
}

function haversineKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function computeMeta(name: string, points: RoutePoint[]) {
  let distanceKm = 0;
  let elevationGainM = 0;

  for (let i = 1; i < points.length; i += 1) {
    distanceKm += haversineKm(points[i - 1], points[i]);
    const a = points[i - 1].ele;
    const b = points[i].ele;
    if (typeof a === 'number' && typeof b === 'number' && b > a) {
      elevationGainM += b - a;
    }
  }

  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const bounds =
    points.length > 0
      ? ([Math.min(...lats), Math.min(...lons), Math.max(...lats), Math.max(...lons)] as [number, number, number, number])
      : null;

  return {
    name,
    distanceKm: Number(distanceKm.toFixed(2)),
    pointCount: points.length,
    bounds,
    elevationGainM: Number(elevationGainM.toFixed(0)),
  };
}

export function parseGpx(xml: string): { routes: TripRoute[]; waypoints: Waypoint[] } {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');

  const parseError = doc.getElementsByTagName('parsererror')[0];
  if (parseError) {
    throw new Error('Invalid GPX file: ' + (parseError.textContent?.split('\n')[0] ?? 'parse error'));
  }

  const trks = Array.from(doc.getElementsByTagName('trk')).slice(0, 2);
  const routes: TripRoute[] = trks.map((trk, idx) => {
    const pts = Array.from(trk.getElementsByTagName('trkpt')).map((pt) => ({
      lat: Number(pt.getAttribute('lat')),
      lon: Number(pt.getAttribute('lon')),
      ele: pt.getElementsByTagName('ele')[0] ? Number(text(pt, 'ele')) : undefined,
    }));
    const name = text(trk, 'name') || `Day ${idx + 1}`;
    return {
      day: idx === 0 ? 1 : 2,
      points: pts,
      meta: computeMeta(name, pts),
    };
  });

  const waypoints: Waypoint[] = Array.from(doc.getElementsByTagName('wpt')).map((wpt, idx) => ({
    id: `wpt-${Date.now()}-${idx}`,
    name: text(wpt, 'name') || `Waypoint ${idx + 1}`,
    type: 'camp',
    lat: Number(wpt.getAttribute('lat')),
    lon: Number(wpt.getAttribute('lon')),
    notes: text(wpt, 'desc'),
  }));

  return { routes, waypoints };
}

export function tripToGpx(trip: Trip): string {
  const trkXml = trip.routes
    .map(
      (route) => `\n  <trk>\n    <name>${route.meta.name}</name>\n    <trkseg>${route.points
        .map(
          (p) =>
            `\n      <trkpt lat="${p.lat}" lon="${p.lon}">${typeof p.ele === 'number' ? `\n        <ele>${p.ele}</ele>` : ''}\n      </trkpt>`,
        )
        .join('')}\n    </trkseg>\n  </trk>`,
    )
    .join('');

  const wptXml = trip.waypoints
    .map(
      (w) =>
        `\n  <wpt lat="${w.lat}" lon="${w.lon}">\n    <name>${w.name}</name>\n    <desc>${w.notes ?? ''}</desc>\n  </wpt>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="HikerHunger" xmlns="http://www.topografix.com/GPX/1/1">${wptXml}${trkXml}\n</gpx>`;
}
