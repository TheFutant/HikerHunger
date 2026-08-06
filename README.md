# HikerHunger

HikerHunger is a mobile-first web app for planning short backpacking trips with local/offline trip data, GPX import/export, map viewing, and food/water planning metrics.

## Tech stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Leaflet + react-leaflet for maps
- IndexedDB via `idb`
- Vitest for minimal logic tests

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`.

## Scripts
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run lint` - lint with Next ESLint config
- `npm run test` - run Vitest test suite

## MVP behavior implemented
- Trips create/edit/list with fields: name, location, start date, end date, notes.
- Trip-local storage of Day 1/Day 2 routes and waypoints.
- GPX import parses up to two tracks and all waypoints.
- Route metadata stores distance, point count, bounds, elevation gain.
- Export trip to JSON and GPX.
- Waypoint creation and map display.
- Food items and auto-calculation of:
  - total food weight
  - total calories
  - calories per day (from trip start/end dates)
  - calories per ounce
  - total protein, carbs, and fat
  - packaging waste
  - total meal water needed
- Optional per-item macronutrients (protein/carbs/fat), auto-filled from
  Open Food Facts when a barcode is scanned.
- Per-day meal planning: assign food items to trip days (derived from
  start/end dates) and view a day-by-day breakdown of calories, weight,
  macros, and meal water.
- Optional daily calorie target per trip, with each planned day colored
  under/good/over against the target (<90% under, 90–115% good, >115% over).
- Mobile-first single-column layout with bottom tab navigation (Trips, Map, Food/Water, Settings).
- Dark mode styling and online/offline indicator.

## Architecture notes
- `app/page.tsx` hosts the MVP UI and tab navigation.
- `lib/db.ts` handles IndexedDB read/write.
- `lib/gpx.ts` parses/exports GPX and computes route metadata.
- `lib/calc.ts` contains pure food metric calculations (tested).
- `components/MapView.tsx` provides Leaflet rendering client-side.

## Assumptions and defaults
- GPX import reads up to the first two `<trk>` entries as Day 1 and Day 2 routes.
- Waypoint type is defaulted to `camp` when imported from GPX unless later edited.
- Offline behavior in MVP means local data operations continue offline after initial app load. Full PWA caching/service worker is intentionally not added yet.
- Food item editing UI is intentionally minimal for MVP; users can add items and view calculated totals.

## Sample data
- Sample GPX: `samples/sample-route.gpx`
- Sample trip JSON: `samples/sample-trip.json`
