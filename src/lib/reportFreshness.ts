import type { AccessibilityReport } from "./types";

function isUnavailable(entry: { status?: string }): boolean {
  return entry.status === "unavailable";
}

/**
 * True when any live data source in the report failed outright (as opposed
 * to succeeding with "nothing found"). These failures are usually transient
 * — a flaky Overpass mirror, a timed-out USGS/FEMA query — so a report like
 * this should neither be served from cache nor written to it; doing either
 * would keep repeating the same gap long after the source recovers.
 */
export function hasUnavailableData(report: AccessibilityReport): boolean {
  const { noise, naturalHazards, neighborhoodAccess, schools } = report;

  return [
    noise.nearestTrainTracks,
    noise.nearestHighway,
    noise.nearestAirport,
    naturalHazards.faultLine,
    naturalHazards.flood,
    naturalHazards.wildfire,
    neighborhoodAccess.hospital,
    neighborhoodAccess.park,
    neighborhoodAccess.pharmacy,
    neighborhoodAccess.transitStop,
    neighborhoodAccess.groceryStore,
    neighborhoodAccess.gasStation,
    schools.nearestElementarySchool,
    schools.nearestMiddleSchool,
    schools.nearestHighSchool,
  ].some(isUnavailable);
}
