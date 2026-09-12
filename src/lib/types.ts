// Shared domain types for Sense accessibility reports.
// Keeping these in one place lets every data source (mock or real API)
// agree on the same shape, so swapping a mock for a live integration
// later doesn't require touching the UI layer.

export type RiskLevel = "low" | "moderate" | "high";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodedAddress extends Coordinates {
  formattedAddress: string;
}

export interface DistanceMeasurement {
  label: string;
  distanceMiles: number | null;
  /**
   * "coming_soon": feature intentionally not built yet.
   * "unavailable": a real integration was attempted but failed or has no
   * coverage for this location (e.g. an upstream API outage or data gap).
   * Omitted/"available": a real result, though distanceMiles may still be
   * null if the source found nothing within its search radius.
   */
  status?: "available" | "coming_soon" | "unavailable";
}

export interface NearbyService extends DistanceMeasurement {
  /**
   * The specific named feature found (e.g. "FDR Drive", "Mount Sinai
   * Hospital"). Null when a match was found but OSM/the source has no name
   * for it (common for unnamed park polygons, minor roads, etc.) — the UI
   * falls back to the generic category label in that case.
   */
  name: string | null;
}

export interface NoiseInformation {
  nearestTrainTracks: NearbyService;
  nearestHighway: NearbyService;
  nearestAirport: NearbyService;
  risk: RiskLevel;
  summary: string;
}

export interface FaultLineInformation extends DistanceMeasurement {
  faultName: string | null;
  risk: RiskLevel;
}

export interface HazardAssessment {
  label: string;
  status: "available" | "unavailable";
  risk?: RiskLevel;
  /** Human-readable context, e.g. a FEMA flood zone code or WHP class. */
  detail?: string;
}

export interface NaturalHazardsInformation {
  faultLine: FaultLineInformation;
  flood: HazardAssessment;
  wildfire: HazardAssessment;
}

export interface NeighborhoodAccessInformation {
  hospital: NearbyService;
  park: NearbyService;
  pharmacy: NearbyService;
  transitStop: NearbyService;
  groceryStore: NearbyService;
  gasStation: NearbyService;
  summary: string;
}

export interface SchoolsInformation {
  nearestElementarySchool: NearbyService;
  nearestMiddleSchool: NearbyService;
  nearestHighSchool: NearbyService;
  specialEducation: { status: "coming_soon" };
}

export interface AccessibilityReport {
  address: GeocodedAddress;
  noise: NoiseInformation;
  naturalHazards: NaturalHazardsInformation;
  neighborhoodAccess: NeighborhoodAccessInformation;
  schools: SchoolsInformation;
  notes: {
    disclaimer: string;
  };
}
