import type { Coordinates, NearbyService, NeighborhoodAccessInformation } from "./types";
import { findNearestOverpassElement, OverpassError } from "./overpass";

async function nearestService(
  coords: Coordinates,
  label: string,
  filters: string[],
  radiusMeters: number
): Promise<NearbyService> {
  try {
    const found = await findNearestOverpassElement(coords, filters, radiusMeters);
    if (!found) {
      return { name: null, label, distanceMiles: null, status: "available" };
    }
    return {
      name: found.name,
      label,
      distanceMiles: Number(found.distanceMiles.toFixed(1)),
      status: "available",
    };
  } catch (err) {
    if (err instanceof OverpassError) {
      return { name: null, label, distanceMiles: null, status: "unavailable" };
    }
    throw err;
  }
}

/**
 * Nearest-amenity data sourced live from OpenStreetMap via the Overpass
 * API (see src/lib/overpass.ts). Distances are straight-line proximity,
 * not walking or driving distance. Coverage depends on how thoroughly a
 * region has been mapped in OSM.
 */
export async function getNearbyServices(coords: Coordinates): Promise<NeighborhoodAccessInformation> {
  const [hospital, park, pharmacy, transitStop, groceryStore, gasStation] = await Promise.all([
    nearestService(coords, "Hospital", ["amenity=hospital"], 15000),
    nearestService(coords, "Park", ["leisure=park"], 3000),
    nearestService(coords, "Pharmacy", ["amenity=pharmacy"], 3000),
    nearestService(coords, "Transit Stop", ["highway=bus_stop", "railway=station", "railway=tram_stop"], 2000),
    nearestService(coords, "Grocery Store", ["shop=supermarket", "shop=grocery"], 3000),
    nearestService(coords, "Gas Station", ["amenity=fuel"], 3000),
  ]);

  const summary =
    "These distances reflect straight-line proximity to common daily-need services, sourced live from " +
    "OpenStreetMap. Actual travel time may vary based on road access, sidewalks, and terrain.";

  return { hospital, park, pharmacy, transitStop, groceryStore, gasStation, summary };
}
