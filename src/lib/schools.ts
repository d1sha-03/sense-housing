import type { Coordinates, SchoolsInformation } from "./types";
import { randomInRange } from "./mockUtils";

/**
 * Returns nearest-school data for a location.
 * Mock data placeholder — will be replaced by a school-district boundary
 * and GreatSchools-style data source.
 */
export function getSchoolInformation(coords: Coordinates): SchoolsInformation {
  return {
    nearestElementarySchool: {
      name: "Nearest Elementary School",
      label: "Elementary School",
      distanceMiles: Number(randomInRange(coords, "school", 0.2, 2.5).toFixed(1)),
      status: "available",
    },
    specialEducation: { status: "coming_soon" },
  };
}
