import type { Coordinates, NeighborhoodAccessInformation, NearbyService } from "./types";
import { randomInRange } from "./mockUtils";

/**
 * Returns nearest-amenity data for a location.
 * Mock data placeholder — will be replaced by Google Places Nearby Search
 * (or an equivalent POI dataset).
 */
export function getNearbyServices(coords: Coordinates): NeighborhoodAccessInformation {
  const hospital: NearbyService = {
    name: "Nearest Hospital",
    label: "Hospital",
    distanceMiles: Number(randomInRange(coords, "hospital", 0.5, 6).toFixed(1)),
    status: "available",
  };
  const park: NearbyService = {
    name: "Nearest Park",
    label: "Park",
    distanceMiles: Number(randomInRange(coords, "park", 0.1, 1.5).toFixed(1)),
    status: "available",
  };
  const pharmacy: NearbyService = {
    name: "Nearest Pharmacy",
    label: "Pharmacy",
    distanceMiles: Number(randomInRange(coords, "pharmacy", 0.1, 2).toFixed(1)),
    status: "available",
  };
  const transitStop: NearbyService = {
    name: "Nearest Transit Stop",
    label: "Transit Stop",
    distanceMiles: Number(randomInRange(coords, "transit", 0.05, 1).toFixed(1)),
    status: "available",
  };

  const summary =
    "These distances reflect straight-line proximity to common daily-need services. " +
    "Actual travel time may vary based on road access, sidewalks, and terrain.";

  return { hospital, park, pharmacy, transitStop, summary };
}
