# Sense — Housing Accessibility Insights

Sense helps families evaluate how accessible a home's surrounding environment is before
scheduling a tour or purchasing a home. Rather than reducing a neighborhood to a single
"accessibility score," Sense surfaces several categories of publicly available geographic
information with evidence, so families can make their own informed decisions.

This is an MVP: it only analyzes public geographic data. There is no Zillow integration, AI
image analysis, authentication, accounts, or saved searches yet.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- Leaflet + OpenStreetMap tiles (embedded map) — free, no API key

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys or environment variables are needed — every data source below is free and keyless.
`.env.local.example` is kept as a placeholder in case a future data source needs credentials.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page + report view (single-page flow)
│   └── api/report/route.ts   # POST { address } → full AccessibilityReport JSON
├── components/
│   ├── SearchBar.tsx, PropertyMap.tsx, Logo.tsx, ReportCard.tsx, ...
│   └── cards/                # NoiseCard, HazardsCard, AccessCard, SchoolsCard, NotesCard
└── lib/
    ├── types.ts              # Shared report/data types
    ├── geo.ts                # haversineMiles() and nearest-point-on-polyline helpers
    ├── overpass.ts           # Shared OpenStreetMap Overpass API client
    ├── geocoding.ts          # getCoordinates(address) — Nominatim
    ├── noise.ts              # getNoiseInformation() — Overpass (rail/highway/airport)
    ├── hazards.ts            # getNaturalHazardsInformation() — USGS + FEMA + USFS
    ├── services.ts           # getNearbyServices() — Overpass (hospital/park/pharmacy/transit)
    ├── schools.ts            # getSchoolInformation() — NCES EDGE
    └── report.ts             # buildAccessibilityReport() — composes the above
```

Each data-source helper returns structured JSON matching the shapes in `lib/types.ts` and is
intentionally isolated so any one of them can be swapped or upgraded independently without
touching the UI or the other helpers.

## Data Sources

Every integration below is free and requires no API key. All are live government or OpenStreetMap
services, not mock data. Distances are straight-line (haversine), not walking/driving distance,
unless noted otherwise.

### Address → coordinates: Nominatim (OpenStreetMap)

- **File:** `src/lib/geocoding.ts`
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Attribution / rate limits:** Nominatim's usage policy asks for a descriptive `User-Agent`
  (set here) and roughly ≤1 request/second — comfortably enough for this app's single
  geocode-per-report pattern. See [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/).
- **Limitations:** Geocoding quality depends on how an address is written; ambiguous or informal
  addresses may resolve to the wrong location or fail.

**Address typeahead** — `src/app/api/suggest/route.ts` proxies the same Nominatim `/search`
endpoint (server-side, so the required `User-Agent` header is always sent and the client can't
bypass rate limiting) with `limit=5`, returning candidate addresses as the user types in either
`SearchBar`. The client (`src/components/SearchBar.tsx`) debounces input by 300ms and only queries
once at least 3 characters are typed, to stay well under Nominatim's ~1 req/sec usage policy.
Selecting a suggestion (via click or arrow keys + Enter) fills the field with its full
`display_name`; typing past a stale request is handled by aborting superseded fetches. If a
suggestion request fails or times out, the dropdown just stays empty — the user can still type a
full address and press Analyze. Both this endpoint and `geocoding.ts` pass `countrycodes=us` and
`accept-language=en` — every other data source in this app (FEMA, USGS, USFS, NCES) only covers
the US, so a non-US or non-English result is never useful here and, left unbiased, Nominatim will
happily match a bare number against an unrelated place abroad. Suggestions are also filtered to
results with a `house_number` in Nominatim's structured address (via `addressdetails=1`) so the
dropdown only offers specific home/building addresses, not bare streets, neighborhoods, or hamlets
that happen to match — a pure landmark name with no street number (e.g. "Golden Gate Bridge") won't
appear in the dropdown as a result, though it can still be typed in full and submitted directly.

### Noise Environment: OpenStreetMap via Overpass API

- **Files:** `src/lib/noise.ts`, `src/lib/overpass.ts`
- **Endpoints (raced, first success wins):** `https://overpass.kumi.systems/api/interpreter`,
  `https://overpass-api.de/api/interpreter`
- **What it queries:** nearest `railway=rail`/`light_rail` (8 km radius), nearest
  `highway=motorway`/`trunk` (4 km radius), nearest `aeroway=aerodrome` (24 km radius). Each
  result surfaces the feature's real OSM `name` (e.g. "Lincoln Tunnel Expressway"), falling back to
  its `ref` route number (e.g. "I 78") when a highway has no `name` tag, and to no detail line at
  all when the feature is unnamed in OSM.
- **Attribution / rate limits:** © OpenStreetMap contributors, data available under the
  [Open Database License](https://www.openstreetmap.org/copyright). These are volunteer-run,
  shared public Overpass instances with fair-use limits — no published quota, but they can and
  do throttle, delay, or reject requests under heavy concurrent load or from an over-active
  client IP. Requests include a descriptive `User-Agent` as required by these mirrors' usage
  policies. To limit load, `overpass.ts` caps this app to 3 concurrent Overpass queries at a
  time and races both mirrors per query rather than hammering one after the other.
- **Known limitation (observed during development):** during heavy back-to-back testing of this
  integration, both public mirrors began intermittently timing out or refusing connections —
  standard fair-use throttling for free shared infrastructure. Normal, non-bulk usage (one report
  at a time) has not shown this issue.
- **Retry/backoff:** when both mirrors fail on a given query, `overpass.ts` retries the race up to
  3 times total with exponential backoff (900ms, then 1800ms) before giving up — most transient
  throttling clears within one retry. Only after all 3 attempts fail does the query settle into an
  **"unavailable"** result (see below) rather than fabricating a distance; the UI then shows "Live
  data temporarily unavailable — please try again in a moment" alongside the "Data Unavailable"
  badge for that row.
- **Coverage limitation:** distances reflect what's mapped in OpenStreetMap; sparsely-mapped rural
  areas may under-report nearby infrastructure.
- **Latency note:** a single report now fires 9 Overpass queries total (3 from Noise, 6 from
  Neighborhood Access), still capped at 3 concurrent via the semaphore in `overpass.ts`. Report
  generation typically takes 15–25 seconds end-to-end as a result — a deliberate trade-off for
  staying within the free public mirrors' fair-use limits rather than risking throttling. In the
  rare case where the mirrors are fully down, the retry/backoff above can add up to roughly 30
  extra seconds per query batch (worst case, all 3 batches failing all 3 attempts) before a report
  fully resolves to "Data Unavailable" — slower, but this only happens during an actual outage.

### Natural Hazards

Three independent sources feed this card — a fault-line lookup and two raster/polygon hazard
layers:

**Fault line — USGS Quaternary Fault and Fold Database**
- **File:** `src/lib/hazards.ts` (`getFaultInformation`)
- **Endpoint:** `https://earthquake.usgs.gov/arcgis/rest/services/haz/Qfaults/MapServer/21/query`
  (layer 21, "National Database")
- **What it does:** searches a 75-mile radius for mapped Quaternary fault traces and returns the
  closest one by real geometry (polyline vertex distance), with its official USGS name.
- **Attribution / rate limits:** public USGS ArcGIS REST service; no published rate limit, no key.
- **Limitations:** this dataset only maps faults with recent (Quaternary-period) activity
  evidence — it is not exhaustive of all seismic risk, and is far denser in the western U.S.
  (e.g. California) than elsewhere.

**Flood zone — FEMA National Flood Hazard Layer (NFHL)**
- **File:** `src/lib/hazards.ts` (`getFloodInformation`)
- **Endpoint:** `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`
  (layer 28, "Flood Hazard Zones")
- **What it does:** looks up the FEMA flood zone polygon containing the address point and reports
  the zone code (e.g. `AE`, `X`) and whether it falls in a FEMA Special Flood Hazard Area (SFHA).
- **Attribution / rate limits:** public FEMA ArcGIS REST service; no published rate limit, no key.
- **Limitations:** NFHL coverage is FEMA-mapped areas only. Areas without a published Flood
  Insurance Rate Map (common in some rural counties) return no feature — this is reported as low
  risk with an explanatory note, not as a failure, since "unmapped" is a real and different
  condition from "unavailable."

**Wildfire hazard — USFS Wildfire Hazard Potential (WHP)**
- **File:** `src/lib/hazards.ts` (`getWildfireInformation`)
- **Endpoint:** `https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_WildfireHazardPotential/ImageServer/identify`
  (the USFS's WHP layer was migrated to this IIPP-hosted endpoint; the older
  `apps.fs.usda.gov` host now returns 403).
- **Known limitation (unresolved, upstream):** at the time of this integration, `identify`
  requests against this endpoint reliably return `"value": "NoData"` for every tested
  coordinate — forested, urban, and wildland-urban-interface alike. This appears to be a gap in
  the currently deployed service, not a bug in this app's request format (the request is accepted
  and returns a well-formed response, just with no pixel value). The integration is implemented
  correctly per USFS's documented API and will start working automatically if/when USFS's service
  is fixed — until then it reports **`status: "unavailable"`** rather than guessing a risk level.

### Neighborhood Access: OpenStreetMap via Overpass API

- **File:** `src/lib/services.ts` (shares `src/lib/overpass.ts` with the Noise integration —
  same endpoints, attribution, rate-limit behavior, and concurrency cap described above)
- **What it queries:** nearest `amenity=hospital` (15 km), `leisure=park` (3 km),
  `amenity=pharmacy` (3 km), nearest transit access point — `highway=bus_stop`,
  `railway=station`, or `railway=tram_stop` (2 km), nearest `shop=supermarket`/`shop=grocery`
  (3 km), and nearest `amenity=fuel` gas station (3 km).
- **Limitations:** same OSM coverage and shared-mirror caveats as the Noise integration above.
  Named features return their real OSM name (e.g. "Bryant Park", "H Mart"); unnamed features
  (e.g. an unnamed park polygon) show no detail line, just the category label.

### Schools: NCES EDGE (Education Demographic and Geographic Estimates)

- **File:** `src/lib/schools.ts`
- **Endpoint:** `https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_ADMINDATA_PUBLICSCH_2425/MapServer/1/query`
  ("Public School Administrative Data 2024–25")
- **What it does:** runs the same query three times in parallel, filtered to `SCHOOL_LEVEL`
  `'Elementary'`, `'Middle'`, and `'High'` respectively, then re-ranks each set of candidates by
  real haversine distance (the ArcGIS radius filter doesn't itself sort by distance). Each result
  includes the school's real name (e.g. "PS 116 Mary Lindley Murray").
- **Attribution / rate limits:** public NCES (U.S. Dept. of Education) ArcGIS REST service; no
  published rate limit, no key.
- **Limitations:** covers public schools only (no private/charter school data in this layer).
  "Special Education Information" has no known free, keyless, nationwide data source — NCES EDGE
  covers school locations and demographics, not program offerings — so it remains an intentional
  **"Coming Soon"**, not a failed integration.

## Result statuses, explained

Every distance/hazard field carries a `status` so the UI can distinguish three different
situations instead of collapsing them into one generic "no data":

- **`available`** — a real query ran successfully. `distanceMiles` (or `risk`/`detail` for
  hazards) reflects live data. Note this can still be `null`/absent if the source legitimately
  found nothing within its search radius — that's a real result, not a failure.
- **`unavailable`** — a real integration was attempted but failed (the upstream service was
  down, rate-limited, timed out, or — as with USFS WHP above — returned no usable data). Shown in
  the UI as a "Data Unavailable" badge.
- **`coming_soon`** — a feature that isn't built yet at all (currently only "Special Education
  Information"). Shown as a "Coming Soon" badge.

## Report Categories

Each report has five cards, shown without a combined "overall score":

1. **Noise Environment** — distance and name of nearest train tracks, highway, airport; risk indicator
2. **Natural Hazards** — nearest fault line, FEMA flood zone, USFS wildfire hazard
3. **Neighborhood Access** — nearest hospital, park, pharmacy, transit stop, grocery store, gas station
4. **Schools** — nearest elementary, middle, and high school; special education info ("Coming Soon")
5. **Sense Notes** — disclaimer that this is not a substitute for an in-person visit

## Roadmap (not in this MVP)

- Browser extension
- AI image analysis
- Personalized accessibility profiles
- Community accessibility reports
- Special education program data, if/when a free nationwide source becomes available
- Retry the USFS Wildfire Hazard Potential `identify` endpoint periodically in case upstream
  coverage is restored
