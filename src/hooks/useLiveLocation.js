import { useEffect } from 'react';
import { useNavigationStore } from '../store/navigationStore';

/**
 * Hook to watch GPS position and device orientation for campus navigation
 */
export function useLiveLocation(enabled = true) {
  const setLiveLocation = useNavigationStore((s) => s.setLiveLocation);
  const setHeading = useNavigationStore((s) => s.setHeading);

  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.heading || 0
        );
      },
      (err) => {
        console.warn("Geolocation watchPosition error:", err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, setLiveLocation]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleOrientation = (e) => {
      if (e.alpha !== null && e.alpha !== undefined) {
        // e.alpha represents compass heading on supported devices
        setHeading(e.alpha);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation);
    // Fallback to standard deviceorientation if absolute is unavailable
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled, setHeading]);
}

/**
 * Request iOS Safari DeviceOrientation permission.
 * MUST be called directly inside a user gesture handler (e.g., button click).
 */
export async function requestOrientationPermission() {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        console.log("iOS Safari DeviceOrientation permission granted.");
        return true;
      } else {
        console.warn("iOS Safari DeviceOrientation permission denied.");
        return false;
      }
    } catch (err) {
      console.error("Error requesting DeviceOrientation permission:", err);
      return false;
    }
  }
  return true; // Non-iOS devices grant permission automatically
}
