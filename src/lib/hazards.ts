import type { Coordinates, FaultLineInformation, NaturalHazardsInformation, RiskLevel } from "./types";
import { randomInRange, seededRandom } from "./mockUtils";

const CALIFORNIA_FAULT_NAMES = [
  "Hayward Fault",
  "San Andreas Fault",
  "Calaveras Fault",
  "San Jacinto Fault",
  "Rodgers Creek Fault",
];

function riskFromDistance(distanceMiles: number): RiskLevel {
  if (distanceMiles < 1) return "high";
  if (distanceMiles < 5) return "moderate";
  return "low";
}

/**
 * Returns nearest-fault-line data for a location.
 * Mock data placeholder — will be replaced by a USGS fault-line dataset.
 */
export function getFaultInformation(coords: Coordinates): FaultLineInformation {
  const distanceMiles = Number(randomInRange(coords, "fault", 0.2, 12).toFixed(1));
  const faultName =
    CALIFORNIA_FAULT_NAMES[Math.floor(seededRandom(coords, "fault-name") * CALIFORNIA_FAULT_NAMES.length)];

  return {
    label: "Nearest Fault Line",
    faultName,
    distanceMiles,
    status: "available",
    risk: riskFromDistance(distanceMiles),
  };
}

export function getNaturalHazardsInformation(coords: Coordinates): NaturalHazardsInformation {
  return {
    faultLine: getFaultInformation(coords),
    flood: { status: "coming_soon" },
    wildfire: { status: "coming_soon" },
  };
}
