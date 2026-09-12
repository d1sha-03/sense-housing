import type { Coordinates, FaultLineInformation, HazardAssessment, NaturalHazardsInformation, RiskLevel } from "./types";
import { nearestPointOnPolylineMiles } from "./geo";

function riskFromFaultDistance(distanceMiles: number): RiskLevel {
  if (distanceMiles < 1) return "high";
  if (distanceMiles < 5) return "moderate";
  return "low";
}

interface QfaultsFeature {
  attributes: { fault_name: string | null };
  geometry?: { paths: number[][][] };
}

/**
 * Nearest-fault-line data from the USGS Quaternary Fault and Fold Database
 * ("National Database" layer). Free, keyless, no rate limit documented.
 * Searches a 75-mile radius and returns the closest mapped fault trace.
 */
async function getFaultInformation(coords: Coordinates): Promise<FaultLineInformation> {
  const url = new URL("https://earthquake.usgs.gov/arcgis/rest/services/haz/Qfaults/MapServer/21/query");
  url.searchParams.set("geometry", `${coords.lng},${coords.lat}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("distance", "75");
  url.searchParams.set("units", "esriSRUnit_StatuteMile");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "fault_name");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("f", "json");

  try {
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`USGS Qfaults responded ${response.status}`);
    const data = (await response.json()) as { features?: QfaultsFeature[] };

    if (!data.features || data.features.length === 0) {
      return { label: "Nearest Fault Line", faultName: null, distanceMiles: null, status: "available", risk: "low" };
    }

    let nearestDistance = Infinity;
    let nearestName: string | null = null;
    for (const feature of data.features) {
      if (!feature.geometry?.paths) continue;
      const distance = nearestPointOnPolylineMiles(coords, feature.geometry.paths);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestName = feature.attributes.fault_name;
      }
    }

    if (!Number.isFinite(nearestDistance)) {
      return { label: "Nearest Fault Line", faultName: null, distanceMiles: null, status: "available", risk: "low" };
    }

    const distanceMiles = Number(nearestDistance.toFixed(1));
    return {
      label: "Nearest Fault Line",
      faultName: nearestName,
      distanceMiles,
      status: "available",
      risk: riskFromFaultDistance(distanceMiles),
    };
  } catch {
    return { label: "Nearest Fault Line", faultName: null, distanceMiles: null, status: "unavailable", risk: "low" };
  }
}

interface FemaFeature {
  attributes: { FLD_ZONE?: string; ZONE_SUBTY?: string; SFHA_TF?: string };
}

/**
 * Flood-zone risk from FEMA's National Flood Hazard Layer (NFHL), "Flood
 * Hazard Zones" layer. Free, keyless. Coverage is FEMA-mapped areas only —
 * some rural/unmapped counties return no feature, which is reported as
 * low risk with a note rather than as a failure.
 */
async function getFloodInformation(coords: Coordinates): Promise<HazardAssessment> {
  const url = new URL("https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query");
  url.searchParams.set("geometry", `${coords.lng},${coords.lat}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "FLD_ZONE,ZONE_SUBTY,SFHA_TF");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");

  try {
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`FEMA NFHL responded ${response.status}`);
    const data = (await response.json()) as { features?: FemaFeature[] };

    if (!data.features || data.features.length === 0) {
      return {
        label: "Flood Zone",
        status: "available",
        risk: "low",
        detail: "No FEMA-mapped flood zone found at this location.",
      };
    }

    const zone = data.features[0].attributes;
    const inSfha = zone.SFHA_TF === "T";
    const risk: RiskLevel = inSfha ? "high" : zone.FLD_ZONE === "X" ? "low" : "moderate";

    return {
      label: "Flood Zone",
      status: "available",
      risk,
      detail: `FEMA flood zone ${zone.FLD_ZONE ?? "unknown"}${zone.ZONE_SUBTY ? ` (${zone.ZONE_SUBTY})` : ""}`,
    };
  } catch {
    return { label: "Flood Zone", status: "unavailable" };
  }
}

const WHP_LABELS: Record<number, string> = {
  1: "Very Low",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Very High",
};

/**
 * Wildfire risk from the USFS Wildfire Hazard Potential (WHP) raster
 * dataset. Free, keyless. NOTE: as of this integration, the current
 * post-migration USFS endpoint (imagery.geoplatform.gov/iipp) reliably
 * returns "NoData" for pixel identify requests across tested locations —
 * a known upstream service gap, not a bug here. When that happens this
 * degrades to status: "unavailable" instead of fabricating a risk level.
 */
async function getWildfireInformation(coords: Coordinates): Promise<HazardAssessment> {
  const url = new URL(
    "https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_WildfireHazardPotential/ImageServer/identify"
  );
  url.searchParams.set("geometry", `${coords.lng},${coords.lat}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("sr", "4326");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");

  try {
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`USFS WHP responded ${response.status}`);
    const data = (await response.json()) as { value?: string };

    const pixelValue = Number(data.value);
    if (!data.value || data.value === "NoData" || Number.isNaN(pixelValue)) {
      return { label: "Wildfire Hazard", status: "unavailable" };
    }

    const risk: RiskLevel = pixelValue >= 4 ? "high" : pixelValue === 3 ? "moderate" : "low";

    return {
      label: "Wildfire Hazard",
      status: "available",
      risk,
      detail: `USFS Wildfire Hazard Potential: ${WHP_LABELS[pixelValue] ?? "Unknown"}`,
    };
  } catch {
    return { label: "Wildfire Hazard", status: "unavailable" };
  }
}

export async function getNaturalHazardsInformation(coords: Coordinates): Promise<NaturalHazardsInformation> {
  const [faultLine, flood, wildfire] = await Promise.all([
    getFaultInformation(coords),
    getFloodInformation(coords),
    getWildfireInformation(coords),
  ]);

  return { faultLine, flood, wildfire };
}
