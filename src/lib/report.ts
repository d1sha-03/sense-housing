import { getCoordinates } from "./geocoding";
import { getNoiseInformation } from "./noise";
import { getNaturalHazardsInformation } from "./hazards";
import { getNearbyServices } from "./services";
import { getSchoolInformation } from "./schools";
import type { AccessibilityReport } from "./types";

const DISCLAIMER =
  "This report is based on publicly available geographic information and should not replace an in-person accessibility evaluation.";

/**
 * Builds a full accessibility report for an address. Composes the
 * individual data-source helpers so each can be swapped for a real
 * integration independently later.
 */
export async function buildAccessibilityReport(address: string): Promise<AccessibilityReport> {
  const geocoded = await getCoordinates(address);

  const [noise, naturalHazards, neighborhoodAccess, schools] = await Promise.all([
    getNoiseInformation(geocoded),
    getNaturalHazardsInformation(geocoded),
    getNearbyServices(geocoded),
    getSchoolInformation(geocoded),
  ]);

  return {
    address: geocoded,
    noise,
    naturalHazards,
    neighborhoodAccess,
    schools,
    notes: { disclaimer: DISCLAIMER },
  };
}
