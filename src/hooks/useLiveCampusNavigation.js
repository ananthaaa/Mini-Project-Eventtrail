import { useState, useEffect, useRef, useCallback } from 'react';
import {
  matchGpsToCampusPath,
  detectRouteDeviation,
  checkArrivalDetection,
  getClosestConnectedNode,
  calculateBearing,
  distanceMeters,
} from '../utils/gpsPathMatcher';
import { findPathAStar } from '../utils/pathfinding';

/**
 * Custom Hook for Live GPS Campus Navigation
 * 
 * Manages continuous geolocation watch, intelligent path snapping,
 * dynamic deviation detection, route recalculation, arrival detection,
 * error recovery, tab visibility changes, and clean teardown.
 */
export function useLiveCampusNavigation({
  active = false,
  nodes = null,
  edges = null,
  adjacency = null,
  destCoords = null,
  onRouteRecalculated = null,
  onArrival = null,
  arrivalRadius = 20,
}) {
  const [gpsStatus, setGpsStatus] = useState('idle');
  // 'idle' | 'acquiring' | 'active' | 'weak_signal' | 'permission_denied' | 'out_of_campus' | 'off_path' | 'unsupported'

  const [rawLocation, setRawLocation] = useState(null);
  const [snappedLocation, setSnappedLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [isArrived, setIsArrived] = useState(false);
  const [arrivalInfo, setArrivalInfo] = useState(null);
  const [recalculationNotice, setRecalculationNotice] = useState(null);

  // Internal tracking refs
  const watchIdRef = useRef(null);
  const lastMatchRef = useRef(null);
  const prevPositionRef = useRef(null);
  const deviationCountRef = useRef(0);
  const arrivalCountRef = useRef(0);
  const routeRecalcTimerRef = useRef(null);
  const consecutiveSwitchCountRef = useRef(0);
  const prevDestCoordsRef = useRef(null);

  // Helper to compute route coordinates from A* node path
  const buildRouteGeometry = useCallback((startPos, destPos, pathNodeIds) => {
    if (!nodes || !pathNodeIds || pathNodeIds.length === 0) return null;

    const coords = [];
    if (startPos) coords.push([startPos.lng, startPos.lat]);

    pathNodeIds.forEach((id) => {
      const node = nodes[id];
      if (node) coords.push([node.lng, node.lat]);
    });

    if (destPos) coords.push([destPos.lng, destPos.lat]);

    // Calculate total walking distance
    let totalDist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      totalDist += distanceMeters(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
    }

    const distRounded = Math.round(totalDist);
    const estMinutes = Math.max(1, Math.round(distRounded / 75)); // ~4.5 km/h walk

    return {
      pathNodeIds,
      coordinates: coords,
      distance: distRounded,
      minutes: estMinutes,
    };
  }, [nodes]);

  // Compute or recalculate A* route to destination
  const calculateRouteToDest = useCallback((startPos, isRecalculation = false) => {
    if (!startPos || !destCoords || !nodes || !adjacency) return null;

    const destNodeId = getClosestConnectedNode(destCoords.lat, destCoords.lng, nodes, adjacency);
    if (!destNodeId) {
      setWarningMessage('Unable to resolve a connected path node near destination.');
      return null;
    }

    // Determine entry node for start position
    let startNodeId = null;
    if (startPos.fromNode && startPos.toNode) {
      // Snapped to an edge: evaluate which endpoint yields shorter total route
      const pathA = findPathAStar(startPos.fromNode, destNodeId, adjacency, nodes);
      const pathB = findPathAStar(startPos.toNode, destNodeId, adjacency, nodes);

      const distA = pathA ? distanceMeters(startPos.lat, startPos.lng, nodes[startPos.fromNode].lat, nodes[startPos.fromNode].lng) : Infinity;
      const distB = pathB ? distanceMeters(startPos.lat, startPos.lng, nodes[startPos.toNode].lat, nodes[startPos.toNode].lng) : Infinity;

      if (distA <= distB && pathA) {
        startNodeId = startPos.fromNode;
      } else if (pathB) {
        startNodeId = startPos.toNode;
      } else {
        startNodeId = startPos.fromNode || startPos.toNode;
      }
    } else {
      startNodeId = getClosestConnectedNode(startPos.lat, startPos.lng, nodes, adjacency);
    }

    if (!startNodeId) {
      setWarningMessage('No nearby walkable path network found for current position.');
      return null;
    }

    const path = findPathAStar(startNodeId, destNodeId, adjacency, nodes);
    if (!path) {
      setWarningMessage('No verified paved path found to the destination venue.');
      return null;
    }

    const geom = buildRouteGeometry(
      { lat: startPos.lat, lng: startPos.lng },
      { lat: destCoords.lat, lng: destCoords.lng },
      path
    );

    if (geom) {
      setActiveRoute(path);
      setRouteCoordinates(geom.coordinates);
      setRouteDistance(geom.distance);
      setEstimatedMinutes(geom.minutes);
      setWarningMessage(null);

      if (isRecalculation) {
        setRecalculationNotice('Route recalculated based on your updated position.');
        if (routeRecalcTimerRef.current) clearTimeout(routeRecalcTimerRef.current);
        routeRecalcTimerRef.current = setTimeout(() => setRecalculationNotice(null), 4000);
        if (onRouteRecalculated) onRouteRecalculated(geom);
      }
    }

    return geom;
  }, [destCoords, nodes, adjacency, buildRouteGeometry, onRouteRecalculated]);

  // Main continuous Geolocation Watcher effect
  useEffect(() => {
    if (!active) {
      // Teardown when inactive
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsStatus('idle');
      setErrorMessage(null);
      setWarningMessage(null);
      lastMatchRef.current = null;
      deviationCountRef.current = 0;
      arrivalCountRef.current = 0;
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('unsupported');
      setErrorMessage('Geolocation API is not supported by your browser.');
      return;
    }

    setGpsStatus('acquiring');
    setErrorMessage(null);

    const handleSuccess = (position) => {
      const {
        latitude,
        longitude,
        accuracy: acc,
        heading: devHeading,
        speed: devSpeed,
      } = position.coords;

      const currentTimestamp = position.timestamp || Date.now();
      const reportedAccuracy = Math.round(acc);
      setAccuracy(reportedAccuracy);

      // 1. Heading calculation
      let resolvedHeading = devHeading;
      if ((resolvedHeading == null || isNaN(resolvedHeading)) && prevPositionRef.current) {
        const moveDist = distanceMeters(
          prevPositionRef.current.lat,
          prevPositionRef.current.lng,
          latitude,
          longitude
        );
        if (moveDist >= 2) {
          resolvedHeading = calculateBearing(
            prevPositionRef.current.lat,
            prevPositionRef.current.lng,
            latitude,
            longitude
          );
        } else {
          resolvedHeading = heading;
        }
      }

      if (resolvedHeading != null && !isNaN(resolvedHeading)) {
        setHeading(Math.round(resolvedHeading));
      }

      prevPositionRef.current = { lat: latitude, lng: longitude };
      setRawLocation({
        lat: latitude,
        lng: longitude,
        accuracy: reportedAccuracy,
        timestamp: currentTimestamp,
      });

      // 2. Weak signal check
      const weakSignal = reportedAccuracy > 50;

      // 3. Match GPS to campus path
      const match = matchGpsToCampusPath(
        {
          lat: latitude,
          lng: longitude,
          accuracy: reportedAccuracy,
          heading: resolvedHeading,
          speed: devSpeed,
          timestamp: currentTimestamp,
        },
        { nodes, edges, adjacency },
        {
          lastMatch: lastMatchRef.current,
          consecutiveSwitchCount: consecutiveSwitchCountRef.current,
        }
      );

      consecutiveSwitchCountRef.current = match.consecutiveSwitchCount || 0;

      if (match.status === 'out_of_campus') {
        setGpsStatus('out_of_campus');
        setSnappedLocation({
          lat: latitude,
          lng: longitude,
          isSnapped: false,
          accuracy: reportedAccuracy,
        });
        setWarningMessage('Your GPS position is outside ASIET campus bounds. Switched to raw view.');
        return;
      }

      if (match.status === 'off_path') {
        setGpsStatus('off_path');
        setSnappedLocation({
          lat: latitude,
          lng: longitude,
          isSnapped: false,
          accuracy: reportedAccuracy,
        });
        setWarningMessage(match.warning || 'Off mapped campus pathways.');
        return;
      }

      // Successful snap or smoothed path match
      const currentPos = {
        lat: match.estimatedLat,
        lng: match.estimatedLng,
        isSnapped: match.isSnapped,
        fromNode: match.fromNode,
        toNode: match.toNode,
        edgeId: match.edgeId,
        distanceToPath: match.distanceToPath,
        accuracy: reportedAccuracy,
      };

      lastMatchRef.current = match;
      setSnappedLocation(currentPos);
      setGpsStatus(weakSignal ? 'weak_signal' : 'active');
      setWarningMessage(weakSignal ? `Weak GPS accuracy (±${reportedAccuracy}m). Path snapping active.` : null);

      // 4. Route calculation / Dynamic Deviation Check
      if (!routeCoordinates || routeCoordinates.length === 0) {
        // Initial route setup
        calculateRouteToDest(currentPos, false);
      } else {
        // Check if student diverged meaningfully from recommended route
        const devCheck = detectRouteDeviation(currentPos, routeCoordinates, 20);
        if (devCheck.deviated) {
          deviationCountRef.current += 1;
          if (deviationCountRef.current >= 2) {
            // Consecutive confirmed deviation -> recalculate route
            deviationCountRef.current = 0;
            calculateRouteToDest(currentPos, true);
          }
        } else {
          deviationCountRef.current = 0;
          // Update remaining distance dynamically along path
          if (destCoords) {
            const remDist = distanceMeters(currentPos.lat, currentPos.lng, destCoords.lat, destCoords.lng);
            setRouteDistance(Math.round(remDist));
            setEstimatedMinutes(Math.max(1, Math.round(remDist / 75)));
          }
        }
      }

      // 5. Automatic Arrival Detection
      if (destCoords && !isArrived) {
        const arrCheck = checkArrivalDetection(
          { lat: currentPos.lat, lng: currentPos.lng, accuracy: reportedAccuracy },
          destCoords,
          {
            radius: arrivalRadius,
            maxAccuracy: 35,
            consecutiveRequired: 2,
            currentCount: arrivalCountRef.current,
          }
        );

        arrivalCountRef.current = arrCheck.count;
        if (arrCheck.isArrived) {
          setIsArrived(true);
          setArrivalInfo({
            distance: arrCheck.distance,
            message: arrCheck.message,
            timestamp: Date.now(),
          });
          if (onArrival) onArrival(arrCheck);
        }
      }
    };

    const handleError = (error) => {
      console.warn('Geolocation watcher notice:', error.code, error.message);
      if (error.code === 1) {
        // PERMISSION_DENIED
        setGpsStatus('permission_denied');
        setErrorMessage('Location permission was denied. Please allow location access in your browser or select your starting landmark manually.');
      } else if (error.code === 2) {
        // POSITION_UNAVAILABLE
        setGpsStatus('weak_signal');
        setWarningMessage('GPS position currently unavailable. Retrying signal acquisition...');
      } else if (error.code === 3) {
        // TIMEOUT
        setGpsStatus('weak_signal');
        setWarningMessage('Location request timed out. Searching for GPS signal...');
      }
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 2500,
    };

    try {
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
      watchIdRef.current = id;
    } catch (err) {
      setGpsStatus('unsupported');
      setErrorMessage(err.message || 'Failed to start geolocation tracking.');
    }

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden: suppress rapid recalculations
      } else {
        // Tab visible again: query fresh position
        if ('geolocation' in navigator && active) {
          navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (routeRecalcTimerRef.current) {
        clearTimeout(routeRecalcTimerRef.current);
      }
    };
  }, [active, nodes, edges, adjacency, destCoords, arrivalRadius, heading, routeCoordinates, isArrived, calculateRouteToDest, onArrival]);

  // Manual trigger to force recalculation if needed
  const manualRecalculate = useCallback(() => {
    if (snappedLocation) {
      calculateRouteToDest(snappedLocation, true);
    }
  }, [snappedLocation, calculateRouteToDest]);

  // Respond immediately when destCoords changes (e.g., student selects another event)
  useEffect(() => {
    if (
      destCoords &&
      (!prevDestCoordsRef.current ||
        prevDestCoordsRef.current.lat !== destCoords.lat ||
        prevDestCoordsRef.current.lng !== destCoords.lng)
    ) {
      prevDestCoordsRef.current = destCoords;
      setIsArrived(false);
      setArrivalInfo(null);
      arrivalCountRef.current = 0;
      deviationCountRef.current = 0;

      if (snappedLocation) {
        calculateRouteToDest(snappedLocation, false);
      } else {
        setRouteCoordinates([]);
        setActiveRoute(null);
      }
    }
  }, [destCoords, snappedLocation, calculateRouteToDest]);

  const resetArrival = useCallback(() => {
    setIsArrived(false);
    setArrivalInfo(null);
    arrivalCountRef.current = 0;
  }, []);

  return {
    gpsStatus,
    rawLocation,
    snappedLocation,
    heading,
    accuracy,
    errorMessage,
    warningMessage,
    activeRoute,
    routeCoordinates,
    routeDistance,
    estimatedMinutes,
    isArrived,
    arrivalInfo,
    recalculationNotice,
    manualRecalculate,
    resetArrival,
  };
}

export default useLiveCampusNavigation;
