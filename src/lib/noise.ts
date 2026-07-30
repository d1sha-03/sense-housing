import type { Coordinates, NoiseInformation, RiskLevel } from "./types";
import { randomInRange } from "./mockUtils";

function riskFromDistance(distanceMiles: number, thresholds: [number, number]): RiskLevel {
  const [highBelow, moderateBelow] = thresholds;
  if (distanceMiles < highBelow) return "high";
  if (distanceMiles < moderateBelow) return "moderate";
  return "low";
}

/**
 * Returns noise-environment data for a location.
 * Mock data placeholder — will be replaced by real transit/highway/airport
 * proximity data sources.
 */
export function getNoiseInformation(coords: Coordinates): NoiseInformation {
  const trainDistance = Number(randomInRange(coords, "train", 0.1, 5).toFixed(1));
  const highwayDistance = Number(randomInRange(coords, "highway", 0.1, 3).toFixed(1));
  const airportDistance = Number(randomInRange(coords, "airport", 1, 15).toFixed(1));

  const trainRisk = riskFromDistance(trainDistance, [0.3, 1]);
  const highwayRisk = riskFromDistance(highwayDistance, [0.25, 0.75]);
  const airportRisk = riskFromDistance(airportDistance, [3, 7]);

  const riskOrder: RiskLevel[] = ["low", "moderate", "high"];
  const overallRisk = [trainRisk, highwayRisk, airportRisk].reduce((worst, current) =>
    riskOrder.indexOf(current) > riskOrder.indexOf(worst) ? current : worst
  );

  const summary =
    overallRisk === "high"
      ? "This property is close to at least one major noise source. In-person visits at different times of day are recommended to assess real-world noise levels."
      : overallRisk === "moderate"
      ? "This property has some proximity to noise sources, but likely at a manageable distance. Consider visiting at peak traffic hours to confirm."
      : "This property appears to be reasonably distant from major noise sources based on available data.";

  return {
    nearestTrainTracks: { label: "Train Tracks", distanceMiles: trainDistance, status: "available" },
    nearestHighway: { label: "Highway", distanceMiles: highwayDistance, status: "available" },
    nearestAirport: { label: "Airport", distanceMiles: airportDistance, status: "available" },
    risk: overallRisk,
    summary,
  };
}
