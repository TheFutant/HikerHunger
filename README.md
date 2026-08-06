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
- Cold soak / no-stove planning: optional per-item prep method (ready to
  eat, cold soak with soak time, needs hot water) shown as badges on food
  cards; trips can be marked no-stove, which flags any assigned item that
  needs hot water with a warning banner and a red card badge. Items with no
  prep method set are also flagged on no-stove trips ("prep? — verify")
  until their prep is confirmed.
- Water planning: optional daily drinking-water estimate per trip; each day
  shows combined water (meals + drinking) in liters with its carry weight,
  the trip totals include total water, and water-type waypoints are listed
  as refill sources on the Food/Water tab.
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
- The app is an installable PWA: `public/manifest.webmanifest` plus a service worker (`public/sw.js`) that precaches the app shell and caches same-origin static assets (stale-while-revalidate), so the app loads and works offline after the first visit. External requests (Open Food Facts, map tiles) are intentionally not cached. The service worker only registers in production builds.
- Food item editing UI is intentionally minimal for MVP; users can add items and view calculated totals.

## Deploying to Fly.io
The app is stateless (all user data lives in the browser's IndexedDB), so it
needs no volumes, secrets, or database. `Dockerfile` and `fly.toml` are
included; Next.js builds in `standalone` mode for a small runtime image.

```bash
fly launch --no-deploy   # first time only: registers the app, keeps fly.toml
fly deploy
```

If the app name `hikerhunger` is taken, change `app` in `fly.toml` (or let
`fly launch` pick a name). The config scales to zero when idle. After
deploying, open the HTTPS URL on your phone and use "Add to Home Screen" to
install it; it works offline after the first load.

## Sample data
- Sample GPX: `samples/sample-route.gpx`
- Sample trip JSON: `samples/sample-trip.json`
