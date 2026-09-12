import type { Coordinates, NearbyService, SchoolsInformation } from "./types";
import { haversineMiles } from "./geo";

interface NcesFeature {
  attributes: { SCH_NAME?: string; LATCOD?: number; LONCOD?: number };
}

/**
 * Nearest public school at a given SCHOOL_LEVEL ("Elementary", "Middle",
 * "High") from the NCES EDGE "Public School Administrative Data 2024-25"
 * layer. Free, keyless. Searches a 10-mile radius; the ArcGIS query filters
 * by radius but doesn't sort by distance, so candidates are re-ranked here
 * with haversineMiles.
 */
async function getNearestSchoolByLevel(
  coords: Coordinates,
  schoolLevel: "Elementary" | "Middle" | "High",
  label: string
): Promise<NearbyService> {
  const url = new URL(
    "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_ADMINDATA_PUBLICSCH_2425/MapServer/1/query"
  );
  url.searchParams.set("geometry", `${coords.lng},${coords.lat}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("distance", "10");
  url.searchParams.set("units", "esriSRUnit_StatuteMile");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("where", `SCHOOL_LEVEL='${schoolLevel}'`);
  url.searchParams.set("outFields", "SCH_NAME,LATCOD,LONCOD");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");

  const fallback: NearbyService = { name: null, label, distanceMiles: null, status: "available" };

  try {
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`NCES EDGE responded ${response.status}`);
    const data = (await response.json()) as { features?: NcesFeature[] };

    if (!data.features || data.features.length === 0) {
      return fallback;
    }

    let nearest: { name: string | null; distanceMiles: number } | null = null;
    for (const feature of data.features) {
      const { SCH_NAME, LATCOD, LONCOD } = feature.attributes;
      if (LATCOD == null || LONCOD == null) continue;
      const distanceMiles = haversineMiles(coords, { lat: LATCOD, lng: LONCOD });
      if (!nearest || distanceMiles < nearest.distanceMiles) {
        nearest = { name: SCH_NAME ?? null, distanceMiles };
      }
    }

    if (!nearest) return fallback;

    return {
      name: nearest.name,
      label,
      distanceMiles: Number(nearest.distanceMiles.toFixed(1)),
      status: "available",
    };
  } catch {
    return { ...fallback, status: "unavailable" };
  }
}

/**
 * Special education program data has no known free, keyless, nationwide
 * source (NCES EDGE covers enrollment/demographics, not program
 * offerings) — left as an intentional "Coming Soon", not a failed
 * integration.
 */
export async function getSchoolInformation(coords: Coordinates): Promise<SchoolsInformation> {
  const [nearestElementarySchool, nearestMiddleSchool, nearestHighSchool] = await Promise.all([
    getNearestSchoolByLevel(coords, "Elementary", "Elementary School"),
    getNearestSchoolByLevel(coords, "Middle", "Middle School"),
    getNearestSchoolByLevel(coords, "High", "High School"),
  ]);

  return {
    nearestElementarySchool,
    nearestMiddleSchool,
    nearestHighSchool,
    specialEducation: { status: "coming_soon" },
  };
}
