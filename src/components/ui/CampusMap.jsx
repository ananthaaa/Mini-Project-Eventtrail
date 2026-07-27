import React, { useRef, useCallback, useEffect } from 'react';
import Map, { NavigationControl } from 'react-map-gl/mapbox';

// Custom Mapbox style requested by user
const DEFAULT_MAP_STYLE = "mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc";

const DEFAULT_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

const CampusMap = ({ 
  children, 
  onLocationSelect, 
  center, 
  zoom, 
  style, 
  className,
  mapStyle = DEFAULT_MAP_STYLE,
  mapboxAccessToken = DEFAULT_TOKEN,
  interactive = true,
  showNavigation = true,
  ...props 
}) => {
  const mapRef = useRef(null);

  // Default center [lat, lng] in Leaflet was [10.1785, 76.4308].
  // Mapbox GL expects longitude (76.4308) and latitude (10.1785).
  const defaultLng = center ? center[1] : 76.4308;
  const defaultLat = center ? center[0] : 10.1785;
  const defaultZoom = zoom || 17;

  const handleClick = useCallback((e) => {
    if (onLocationSelect && e.lngLat) {
      onLocationSelect({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    }
  }, [onLocationSelect]);

  useEffect(() => {
    // Invalidate size on resize or mount for smooth rendering
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`relative w-full h-full neo-border overflow-hidden bg-[#F9F5F6] ${className || ''}`} 
      style={{ minHeight: '400px', ...style }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: defaultLng,
          latitude: defaultLat,
          zoom: defaultZoom
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxAccessToken}
        onClick={handleClick}
        interactive={interactive}
        attributionControl={true}
        {...props}
      >
        {showNavigation && <NavigationControl position="top-right" />}
        {children}
      </Map>
    </div>
  );
};

export default CampusMap;
