import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { useNavigationStore } from '../../store/navigationStore';
import { Navigation } from 'lucide-react';

export function UserLocationMarker() {
  const snappedLocation = useNavigationStore((s) => s.snappedLocation);
  const heading = useNavigationStore((s) => s.heading);
  const viewMode = useNavigationStore((s) => s.viewMode);

  if (!snappedLocation || typeof snappedLocation.lat !== 'number' || typeof snappedLocation.lng !== 'number') {
    return null;
  }

  // In AR mode at eye level, hiding the user's own marker prevents camera occlusion
  if (viewMode === 'ar-simulation') {
    return null;
  }

  return (
    <Marker
      longitude={snappedLocation.lng}
      latitude={snappedLocation.lat}
      anchor="center"
      pitchAlignment="map"
      rotationAlignment="map"
    >
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Pulsing outer ring */}
        <div className="absolute w-8 h-8 rounded-full bg-primary-yellow/40 animate-ping" />
        
        {/* Directional compass arrow icon rotated by heading */}
        <div 
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary-yellow border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-transform duration-300"
          style={{ transform: `rotate(${heading || 0}deg)` }}
        >
          <Navigation className="w-5 h-5 text-black fill-black" />
        </div>
      </div>
    </Marker>
  );
}
