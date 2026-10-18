import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Haversine formula to calculate the great-circle distance between two coordinates in meters.
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Calculates compass bearing (degrees 0-360) from point A to point B.
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const θ = Math.atan2(y, x);
  return ((((θ * 180) / Math.PI) + 360) % 360);
};

/**
 * Custom Hook: useCampusGeolocation
 * Manages live physical GPS vs. smooth presentation simulation mode with geofence triggers.
 */
export const useCampusGeolocation = ({
  startLat = 10.1768,
  startLng = 76.4290,
  destLat = 10.1788,
  destLng = 76.4320,
  geofenceRadius = 25,
  initialMode = 'live', // 'live' or 'simulation'
  onGeofenceReached = null,
} = {}) => {
  const [isLive, setIsLive] = useState(initialMode === 'live');
  const [currentLat, setCurrentLat] = useState(startLat);
  const [currentLng, setCurrentLng] = useState(startLng);
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt');
  const [simulationProgress, setSimulationProgress] = useState(0);

  const prevCoordRef = useRef({ lat: startLat, lng: startLng });
  const geofenceFiredRef = useRef(false);

  // Compute live distance to destination
  const distanceRemaining = haversineDistance(currentLat, currentLng, destLat, destLng);
  const isWithinGeofence = distanceRemaining <= geofenceRadius;

  // Check Permissions API if available
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => setPermissionState(result.state);
        })
        .catch(() => {});
    }
  }, []);

  // Handle Geofence trigger
  useEffect(() => {
    if (isWithinGeofence && !geofenceFiredRef.current) {
      geofenceFiredRef.current = true;
      if (onGeofenceReached) {
        onGeofenceReached({
          distance: distanceRemaining,
          lat: currentLat,
          lng: currentLng,
        });
      }
    } else if (!isWithinGeofence && distanceRemaining > geofenceRadius + 5) {
      // Reset if user walks outside the threshold with some hysteresis
      geofenceFiredRef.current = false;
    }
  }, [isWithinGeofence, distanceRemaining, geofenceRadius, onGeofenceReached, currentLat, currentLng]);

  // LIVE GPS MODE: navigator.geolocation.watchPosition
  useEffect(() => {
    if (!isLive) return;

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser. Switched to Simulation Mode.');
      setIsLive(false);
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude, heading: deviceHeading, accuracy: acc } = position.coords;

      let computedHeading = deviceHeading;
      if (computedHeading == null && prevCoordRef.current) {
        computedHeading = calculateBearing(
          prevCoordRef.current.lat,
          prevCoordRef.current.lng,
          latitude,
          longitude
        );
      }

      prevCoordRef.current = { lat: latitude, lng: longitude };
      setCurrentLat(latitude);
      setCurrentLng(longitude);
      setAccuracy(Math.round(acc));
      if (computedHeading != null && !isNaN(computedHeading)) {
        setHeading(Math.round(computedHeading));
      }
      setError(null);
    };

    const handleError = (err) => {
      let message = 'Unable to retrieve your location.';
      if (err.code === 1) {
        message = 'Location access was denied. Switched to Simulation Mode.';
        setIsLive(false);
      } else if (err.code === 2) {
        message = 'GPS position unavailable. Check your device settings.';
      } else if (err.code === 3) {
        message = 'Location request timed out. Retrying...';
      }
      setError(message);
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isLive]);

  // SIMULATION MODE: linear interpolation along trajectory
  const updateSimulationStep = useCallback(
    (stepPercent) => {
      const next = Math.max(0, Math.min(100, stepPercent));
      setSimulationProgress(next);

      const fraction = next / 100;
      const simLat = startLat + (destLat - startLat) * fraction;
      const simLng = startLng + (destLng - startLng) * fraction;

      const newHeading = calculateBearing(currentLat, currentLng, simLat, simLng);
      prevCoordRef.current = { lat: simLat, lng: simLng };
      setCurrentLat(simLat);
      setCurrentLng(simLng);
      if (!isNaN(newHeading) && (simLat !== currentLat || simLng !== currentLng)) {
        setHeading(Math.round(newHeading));
      }
    },
    [startLat, startLng, destLat, destLng, currentLat, currentLng]
  );

  const resetSimulation = useCallback(() => {
    geofenceFiredRef.current = false;
    setSimulationProgress(0);
    setCurrentLat(startLat);
    setCurrentLng(startLng);
  }, [startLat, startLng]);

  return {
    currentLat,
    currentLng,
    heading,
    accuracy,
    isLive,
    setIsLive,
    distanceRemaining,
    isWithinGeofence,
    simulationProgress,
    setSimulationProgress: updateSimulationStep,
    resetSimulation,
    error,
    permissionState,
  };
};

export default useCampusGeolocation;
