import type { Coordinates, NearbyService, NoiseInformation, RiskLevel } from "./types";
import { findNearestOverpassElement, OverpassError } from "./overpass";

function riskFromDistance(distanceMiles: number, thresholds: [number, number]): RiskLevel {
  const [highBelow, moderateBelow] = thresholds;
  if (distanceMiles < highBelow) return "high";
  if (distanceMiles < moderateBelow) return "moderate";
  return "low";
}

async function assess(
  coords: Coordinates,
  label: string,
  filters: string[],
  radiusMeters: number,
  thresholds: [number, number]
): Promise<{ measurement: NearbyService; risk: RiskLevel }> {
  try {
    const found = await findNearestOverpassElement(coords, filters, radiusMeters);
    if (!found) {
      // Nothing matched within the radius — treat as low risk rather than
      // claiming a specific distance we don't have.
      return { measurement: { label, name: null, distanceMiles: null, status: "available" }, risk: "low" };
    }
    const distanceMiles = Number(found.distanceMiles.toFixed(1));
    return {
      measurement: { label, name: found.name, distanceMiles, status: "available" },
      risk: riskFromDistance(distanceMiles, thresholds),
    };
  } catch (err) {
    if (err instanceof OverpassError) {
      return { measurement: { label, name: null, distanceMiles: null, status: "unavailable" }, risk: "low" };
    }
    throw err;
  }
}

/**
 * Noise-environment data sourced live from OpenStreetMap via the Overpass
 * API (see src/lib/overpass.ts). Distances are straight-line to the
 * nearest matching OSM feature within a per-category search radius —
 * not measured or modeled noise levels. See README.md for source details
 * and known limitations (OSM coverage varies by region).
 */
export async function getNoiseInformation(coords: Coordinates): Promise<NoiseInformation> {
  const [train, highway, airport] = await Promise.all([
    assess(coords, "Train Tracks", ["railway=rail", "railway=light_rail"], 8000, [0.3, 1]),
    assess(coords, "Highway", ["highway=motorway", "highway=trunk"], 4000, [0.25, 0.75]),
    assess(coords, "Airport", ["aeroway=aerodrome"], 24000, [3, 7]),
  ]);

  const riskOrder: RiskLevel[] = ["low", "moderate", "high"];
  const overallRisk = [train.risk, highway.risk, airport.risk].reduce((worst, current) =>
    riskOrder.indexOf(current) > riskOrder.indexOf(worst) ? current : worst
  );

  const summary =
    overallRisk === "high"
      ? "This property is close to at least one major noise source. In-person visits at different times of day are recommended to assess real-world noise levels."
      : overallRisk === "moderate"
      ? "This property has some proximity to noise sources, but likely at a manageable distance. Consider visiting at peak traffic hours to confirm."
      : "This property appears to be reasonably distant from major noise sources based on available data.";

  return {
    nearestTrainTracks: train.measurement,
    nearestHighway: highway.measurement,
    nearestAirport: airport.measurement,
    risk: overallRisk,
    summary,
  };
}
