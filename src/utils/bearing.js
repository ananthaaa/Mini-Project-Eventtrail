import bearing from "@turf/bearing";
import { point } from "@turf/helpers";

/**
 * Calculate bearing between two [lng, lat] coordinates
 */
export function getBearing(startCoord, endCoord) {
  if (!startCoord || !endCoord) return 0;
  const pt1 = point(startCoord);
  const pt2 = point(endCoord);
  return bearing(pt1, pt2);
}

/**
 * Calculate haversine distance in meters between two [lng, lat] coordinates
 */
export function getDistanceMeters(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
