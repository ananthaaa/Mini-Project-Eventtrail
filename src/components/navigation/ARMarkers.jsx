import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { useNavigationStore } from '../../store/navigationStore';
import { MapPin, Sparkles } from 'lucide-react';

export function ARMarkers() {
  const destination = useNavigationStore((s) => s.destination);
  const routeData = useNavigationStore((s) => s.routeData);
  const viewMode = useNavigationStore((s) => s.viewMode);

  if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
    return null;
  }

  const isAR = viewMode === 'ar-simulation';
  const distance = routeData?.distance || 0;

  return (
    <Marker
      longitude={destination.lng}
      latitude={destination.lat}
      anchor="bottom"
      offset={[0, isAR ? -20 : -10]}
    >
      {isAR ? (
        /* Floating Holographic AR Destination Beacon */
        <div className="flex flex-col items-center animate-bounce">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00f5d4]/90 border-2 border-black shadow-[3px_3px_0px_0px_#000] text-black font-black text-xs tracking-wider uppercase backdrop-blur-md">
            <Sparkles className="w-4 h-4 fill-black" />
            <span>{destination.name || 'Venue'}</span>
            <span className="bg-black text-[#00f5d4] px-1.5 py-0.5 rounded text-[10px]">
              {distance}m
            </span>
          </div>
          {/* Beacon pillar laser */}
          <div className="w-1 h-12 bg-gradient-to-b from-[#00f5d4] to-transparent animate-pulse" />
          <div className="w-6 h-2 rounded-full bg-[#00f5d4]/50 blur-sm -mt-1" />
        </div>
      ) : (
        /* Standard Didasko 2D/3D Destination Pin */
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="px-2.5 py-1 bg-secondary-mint border-2 border-black shadow-[2px_2px_0px_0px_#000] text-black font-bold text-xs rounded mb-1 whitespace-nowrap">
            {destination.name || 'Venue'}
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-yellow border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center">
            <MapPin className="w-5 h-5 text-black fill-black" />
          </div>
        </div>
      )}
    </Marker>
  );
}
