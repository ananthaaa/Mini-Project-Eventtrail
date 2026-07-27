import { useEffect } from 'react';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { point, lineString, feature } from '@turf/helpers';
import { useNavigationStore } from '../store/navigationStore';

/**
 * Hook to snap raw mobile GPS coordinates to the active route LineString geometry
 */
export function useSnapToPath() {
  const liveLocation = useNavigationStore((s) => s.liveLocation);
  const routeData = useNavigationStore((s) => s.routeData);
  const setSnappedLocation = useNavigationStore((s) => s.setSnappedLocation);

  useEffect(() => {
    if (!liveLocation) return;

    if (!routeData || !routeData.geometry) {
      // No active route line, fallback snapped location to raw GPS
      setSnappedLocation(liveLocation.lat, liveLocation.lng);
      return;
    }

    try {
      const rawPt = point([liveLocation.lng, liveLocation.lat]);
      let lineFeat = routeData.geometry;
      
      // Ensure geometry is wrapped in a Turf Feature if it is a bare geometry
      if (lineFeat.type === 'LineString') {
        lineFeat = feature(lineFeat);
      } else if (lineFeat.type === 'Feature' && lineFeat.geometry?.type === 'LineString') {
        // already valid feature
      } else if (Array.isArray(lineFeat)) {
        lineFeat = lineString(lineFeat);
      } else {
        setSnappedLocation(liveLocation.lat, liveLocation.lng);
        return;
      }

      const snapped = nearestPointOnLine(lineFeat, rawPt);
      if (snapped && snapped.geometry && Array.isArray(snapped.geometry.coordinates)) {
        const [snappedLng, snappedLat] = snapped.geometry.coordinates;
        setSnappedLocation(snappedLat, snappedLng);
      } else {
        setSnappedLocation(liveLocation.lat, liveLocation.lng);
      }
    } catch (err) {
      console.warn("Error in useSnapToPath:", err);
      setSnappedLocation(liveLocation.lat, liveLocation.lng);
    }
  }, [liveLocation, routeData, setSnappedLocation]);
}
