import type { Coordinates } from "./types";

const EARTH_RADIUS_MILES = 3958.8;

/** Great-circle distance between two coordinates, in miles. */
export function haversineMiles(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/**
 * Minimum distance from a point to any vertex across one or more polylines
 * (an ArcGIS `paths` array of `[lng, lat]` pairs, as returned by the USGS
 * Qfaults service). This samples vertices rather than true point-to-segment
 * distance, which is accurate enough at the ~mile precision this app
 * reports and avoids pulling in a full geometry library.
 */
export function nearestPointOnPolylineMiles(point: Coordinates, paths: number[][][]): number {
  let min = Infinity;
  for (const path of paths) {
    for (const [lng, lat] of path) {
      const d = haversineMiles(point, { lat, lng });
      if (d < min) min = d;
    }
  }
  return min;
}
