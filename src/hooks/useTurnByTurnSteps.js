import { useEffect } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { getBearing, getDistanceMeters } from '../utils/bearing';

/**
 * Helper function to algorithmically derive turn instructions from LineString coordinates
 */
export function deriveStepsFromLineString(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return [];
  }

  const steps = [];
  let currentDistance = 0;
  let prevBearing = null;

  // Initial step
  steps.push({
    id: 'step-0',
    instruction: 'Head straight along campus walkway',
    distance: 0,
    coordinate: coordinates[0],
    bearing: getBearing(coordinates[0], coordinates[1])
  });

  for (let i = 0; i < coordinates.length - 1; i++) {
    const ptA = coordinates[i];
    const ptB = coordinates[i + 1];
    const segDistance = getDistanceMeters(ptA, ptB);
    const segBearing = getBearing(ptA, ptB);
    currentDistance += segDistance;

    if (prevBearing !== null) {
      // Calculate angular delta between consecutive bearings
      let delta = segBearing - prevBearing;
      // Normalize delta to [-180, 180]
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      if (Math.abs(delta) > 25) {
        const turnDir = delta > 0 ? 'right' : 'left';
        steps.push({
          id: `step-${i}`,
          instruction: `Turn ${turnDir} after ${Math.round(currentDistance)} meters`,
          distance: Math.round(currentDistance),
          coordinate: ptB,
          bearing: segBearing,
          turn: turnDir
        });
        currentDistance = 0; // reset distance for next leg
      }
    }
    prevBearing = segBearing;
  }

  // Final arrival step
  steps.push({
    id: `step-final`,
    instruction: 'Arrive at destination venue',
    distance: Math.round(currentDistance),
    coordinate: coordinates[coordinates.length - 1],
    bearing: prevBearing || 0,
    isFinal: true
  });

  return steps;
}

/**
 * Hook to automatically derive steps whenever route geometry updates
 */
export function useTurnByTurnSteps() {
  const routeData = useNavigationStore((s) => s.routeData);
  const setRouteData = useNavigationStore((s) => s.setRouteData);

  useEffect(() => {
    if (!routeData || !routeData.geometry) return;

    let coords = null;
    if (routeData.geometry.type === 'LineString') {
      coords = routeData.geometry.coordinates;
    } else if (routeData.geometry.type === 'Feature' && routeData.geometry.geometry?.type === 'LineString') {
      coords = routeData.geometry.geometry.coordinates;
    }

    if (coords && coords.length >= 2) {
      const derivedSteps = deriveStepsFromLineString(coords);
      // Avoid infinite re-render loop if steps are unchanged
      if (JSON.stringify(derivedSteps) !== JSON.stringify(routeData.steps)) {
        setRouteData({
          ...routeData,
          steps: derivedSteps
        });
      }
    }
  }, [routeData, setRouteData]);
}
