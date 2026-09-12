import type { Coordinates } from "./types";
import { haversineMiles } from "./geo";

// Public Overpass instances are shared, volunteer-run mirrors of OpenStreetMap
// data — free and keyless, but individually flaky: either can be slow,
// rate-limited, or briefly unreachable. Rather than trying them one at a
// time (which pays a full timeout before falling back), every query races
// both mirrors with Promise.any and uses whichever answers first.
const OVERPASS_ENDPOINTS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"];

// Overpass mirrors require a descriptive User-Agent identifying the calling
// application; requests without one are rejected with a 429.
const USER_AGENT = "Sense-Housing-Accessibility-MVP/1.0 (+https://github.com/d1sha-03/sense-housing)";

const REQUEST_TIMEOUT_MS = 10000;

export class OverpassError extends Error {}

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// A single report fires several Overpass queries at once (rail, highway,
// airport, hospital, park, pharmacy, transit, grocery store, gas station),
// each racing two mirrors — up to 18 simultaneous outbound requests. Testing
// showed that firing all of them at once causes the free mirrors to
// rate-limit or drop requests, so all queries share a small concurrency
// limit here rather than each caller managing its own.
const MAX_CONCURRENT_QUERIES = 3;
let activeQueries = 0;
const queue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeQueries < MAX_CONCURRENT_QUERIES) {
    activeQueries++;
    return;
  }
  await new Promise<void>((resolve) => queue.push(resolve));
  activeQueries++;
}

function releaseSlot(): void {
  activeQueries--;
  const next = queue.shift();
  if (next) next();
}

async function fetchFromMirror(endpoint: string, query: string): Promise<{ elements: OverpassElement[] }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({ data: query }).toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Overpass mirror ${endpoint} responded ${response.status}`);
  }

  return response.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Both mirrors failing at once usually means shared-infrastructure throttling
// rather than a permanent outage, so it's worth a short wait and another try
// before giving up. Exponential backoff (900ms, 2400ms) between attempts
// gives the mirrors a moment to recover instead of hammering them again
// immediately.
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 900;

async function raceMirrorsWithRetry(query: string): Promise<{ elements: OverpassElement[] }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await Promise.any(OVERPASS_ENDPOINTS.map((endpoint) => fetchFromMirror(endpoint, query)));
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      }
    }
  }
  throw new OverpassError(`All Overpass mirrors failed after ${MAX_ATTEMPTS} attempts: ${String(lastError)}`);
}

/**
 * Queries OpenStreetMap (via the Overpass API) for the nearest node or way
 * matching any of `filters` (each a raw Overpass tag filter, e.g.
 * `"amenity=hospital"`) within `radiusMeters` of `coords`.
 *
 * Returns `null` when the query succeeds but nothing matches within the
 * radius (a real, informative result — OSM simply has no such feature that
 * close). Throws `OverpassError` when every mirror fails outright, so
 * callers can distinguish "nothing nearby" from "couldn't check."
 */
export async function findNearestOverpassElement(
  coords: Coordinates,
  filters: string[],
  radiusMeters: number
): Promise<{ distanceMiles: number; name: string | null } | null> {
  await acquireSlot();
  try {
    const around = `around:${radiusMeters},${coords.lat},${coords.lng}`;
    const clauses = filters.map((f) => `node(${around})[${f}];\nway(${around})[${f}];`).join("\n");
    const query = `[out:json][timeout:20];\n(\n${clauses}\n);\nout center 50;`;

    const data = await raceMirrorsWithRetry(query);

    if (!data.elements || data.elements.length === 0) {
      return null;
    }

    let nearest: { distanceMiles: number; name: string | null } | null = null;
    for (const el of data.elements) {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) continue;
      const distanceMiles = haversineMiles(coords, { lat, lng: lon });
      if (!nearest || distanceMiles < nearest.distanceMiles) {
        // Many highways (especially motorways/trunks) carry a route number
        // in `ref` (e.g. "I 78") instead of, or in addition to, a `name`.
        nearest = { distanceMiles, name: el.tags?.name ?? el.tags?.ref ?? null };
      }
    }
    return nearest;
  } finally {
    releaseSlot();
  }
}
