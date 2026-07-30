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
  /** "Coming Soon" style sources set this instead of a distance. */
  status?: "available" | "coming_soon";
}

export interface NoiseInformation {
  nearestTrainTracks: DistanceMeasurement;
  nearestHighway: DistanceMeasurement;
  nearestAirport: DistanceMeasurement;
  risk: RiskLevel;
  summary: string;
}

export interface FaultLineInformation extends DistanceMeasurement {
  faultName: string | null;
  risk: RiskLevel;
}

export interface NaturalHazardsInformation {
  faultLine: FaultLineInformation;
  flood: { status: "coming_soon" };
  wildfire: { status: "coming_soon" };
}

export interface NearbyService extends DistanceMeasurement {
  name: string;
}

export interface NeighborhoodAccessInformation {
  hospital: NearbyService;
  park: NearbyService;
  pharmacy: NearbyService;
  transitStop: NearbyService;
  summary: string;
}

export interface SchoolsInformation {
  nearestElementarySchool: NearbyService;
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
