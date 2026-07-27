import { useEffect, useRef } from 'react';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { point, feature, lineString } from '@turf/helpers';
import { useNavigationStore } from '../store/navigationStore';
import { runAStar } from '../utils/astar';
import { getDistanceMeters } from '../utils/bearing';

/**
 * Hook to detect GPS drift (>15m) and trigger A* re-routing automatically
 */
export function useDriftDetection() {
  const liveLocation = useNavigationStore((s) => s.liveLocation);
  const destination = useNavigationStore((s) => s.destination);
  const routeData = useNavigationStore((s) => s.routeData);
  const setRouteData = useNavigationStore((s) => s.setRouteData);
  
  // Throttle re-routing checks so we don't spam A* on every micro GPS tick
  const lastRerouteTime = useRef(0);

  useEffect(() => {
    if (!liveLocation || !destination || !routeData || !routeData.geometry) return;

    const now = Date.now();
    if (now - lastRerouteTime.current < 2000) return; // 2s throttle

    try {
      const rawPt = point([liveLocation.lng, liveLocation.lat]);
      let lineFeat = routeData.geometry;
      if (lineFeat.type === 'LineString') lineFeat = feature(lineFeat);
      else if (Array.isArray(lineFeat)) lineFeat = lineString(lineFeat);

      const snapped = nearestPointOnLine(lineFeat, rawPt);
      if (snapped && snapped.geometry && Array.isArray(snapped.geometry.coordinates)) {
        const [snappedLng, snappedLat] = snapped.geometry.coordinates;
        const driftMeters = getDistanceMeters(
          [liveLocation.lng, liveLocation.lat],
          [snappedLng, snappedLat]
        );

        // If drift exceeds 15 meters, re-run A* from current live location
        if (driftMeters > 15) {
          console.log(`Drift detected (${Math.round(driftMeters)}m > 15m). Re-routing...`);
          lastRerouteTime.current = now;
          const newRoute = runAStar(
            null, // uses internal campus walkway nodes graph
            [liveLocation.lng, liveLocation.lat],
            [destination.lng, destination.lat]
          );

          if (newRoute) {
            setRouteData({
              geometry: newRoute.geometry,
              steps: routeData.steps || [],
              distance: newRoute.properties.distance || 0
            });
          }
        }
      }
    } catch (err) {
      console.warn("Drift detection check failed:", err);
    }
  }, [liveLocation, destination, routeData, setRouteData]);
}
