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
- Nominatim (address → coordinates) — free, no API key

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

No API keys or environment variables are needed — the map and geocoding both run on free,
keyless OpenStreetMap services. `.env.local.example` is kept as a placeholder for future data
sources that may need credentials.

> Nominatim (the geocoding service) asks that usage stay light — roughly one request per
> second — which is more than enough for an MVP demo. If this ever needs to scale up, swap
> `getCoordinates` in `src/lib/geocoding.ts` for a paid provider (Google, Mapbox, LocationIQ).

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
    ├── geocoding.ts          # getCoordinates(address) — real Nominatim call, no key needed
    ├── noise.ts               # getNoiseInformation() — mock data
    ├── hazards.ts             # getFaultInformation() — mock data; flood/wildfire coming soon
    ├── services.ts            # getNearbyServices() — mock data
    ├── schools.ts             # getSchoolInformation() — mock data
    └── report.ts              # buildAccessibilityReport() — composes the above
```

Each data-source helper (`getNoiseInformation`, `getFaultInformation`, `getNearbyServices`,
`getSchoolInformation`) returns structured JSON matching the shapes in `lib/types.ts` and is
currently backed by deterministic mock data. They're intentionally isolated so any one of them
can be swapped for a real data source (e.g. USGS fault data, Google Places, GTFS transit data)
without touching the UI.

## Report Categories

Each report has five cards, shown without a combined "overall score":

1. **Noise Environment** — distance to train tracks, highway, airport; risk indicator
2. **Natural Hazards** — nearest fault line (implemented); flood and wildfire ("Coming Soon")
3. **Neighborhood Access** — nearest hospital, park, pharmacy, transit stop
4. **Schools** — nearest elementary school; special education info ("Coming Soon")
5. **Sense Notes** — disclaimer that this is not a substitute for an in-person visit

## Roadmap (not in this MVP)

- Browser extension
- AI image analysis
- Personalized accessibility profiles
- Community accessibility reports
- Real data sources for flood, wildfire, and special education information
