import type { GeocodedAddress } from "./types";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

export class GeocodingError extends Error {}

/**
 * Resolves a free-text address into coordinates via OpenStreetMap's
 * Nominatim search API. Free, keyless — but rate-limited (~1 req/sec) and
 * requires a descriptive User-Agent per Nominatim's usage policy.
 */
export async function getCoordinates(address: string): Promise<GeocodedAddress> {
  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Sense-Housing-Accessibility-MVP/1.0",
    },
  });

  if (!response.ok) {
    throw new GeocodingError(`Geocoding request failed with status ${response.status}`);
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new GeocodingError(`Could not find a location for "${address}".`);
  }

  const result = results[0];

  return {
    lat: Number(result.lat),
    lng: Number(result.lon),
    formattedAddress: result.display_name,
  };
}
