import React, { useRef, useEffect, useState, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import campusData from '../../data/asiet-campus.json';

// ASIET Campus center [lng, lat]
export const ASIET_CAMPUS_CENTER = [76.4302, 10.1780];

// Strictly bounded to the ASIET Campus compound — restricts panning outside campus
export const ASIET_CAMPUS_BOUNDS = [
  [76.4250, 10.1730], // Southwest [lng, lat]
  [76.4355, 10.1830], // Northeast [lng, lat]
];

/**
 * Strict ASIET Campus Map Style
 * ONLY renders ASIET campus compound features:
 * - Clean campus ground (#e8ddd5)
 * - Campus boundary land (#d4d3bc)
 * - Internal campus walking roads
 * - Strictly filtered 3D ASIET campus buildings (all non-campus buildings/shops/houses completely excluded)
 */
export const ASIET_MAP_STYLE = {
  version: 8,
  sources: {
    campus: {
      type: 'geojson',
      data: campusData,
    },
    'outdoor-route': {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
  },
  layers: [
    {
      id: 'ground',
      type: 'background',
      paint: {
        'background-color': '#e8ddd5',
      },
    },
    {
      id: 'land',
      type: 'fill',
      source: 'campus',
      filter: ['==', 'kind', 'land'],
      paint: {
        'fill-color': '#d4d3bc',
        'fill-opacity': 0.65,
      },
    },
    {
      id: 'ground-pitch',
      type: 'fill',
      source: 'campus',
      filter: ['==', 'kind', 'ground'],
      paint: {
        'fill-color': '#b8db9c',
        'fill-opacity': 0.85,
      },
    },
    {
      id: 'ground-pitch-outline',
      type: 'line',
      source: 'campus',
      filter: ['==', 'kind', 'ground'],
      paint: {
        'line-color': '#7fa868',
        'line-width': 2.5,
      },
    },
    {
      id: 'road-edge',
      type: 'line',
      source: 'campus',
      filter: ['==', 'kind', 'road'],
      paint: {
        'line-color': '#cdc2b1',
        'line-width': 12,
      },
    },
    {
      id: 'roads',
      type: 'line',
      source: 'campus',
      filter: ['==', 'kind', 'road'],
      paint: {
        'line-color': '#f7f3e8',
        'line-width': 8,
      },
    },
    {
      id: 'buildings',
      type: 'fill-extrusion',
      source: 'campus',
      filter: ['==', 'kind', 'building'],
      paint: {
        'fill-extrusion-color': [
          'match',
          ['get', 'name'],
          'Adi Shankara Institute Of Engineering And Technology B.Tech Block', '#e9c758',
          'Asiet Mechanical Block', '#eac95f',
          'Asiet mba Block', '#eed073',
          'Asiet pg Block', '#e2be4b',
          'ASIET CIVIL BLOCK', '#e5c353',
          'Asiet Smithy and Foundry Workshop', '#deb83f',
          'CTF Lab', '#f0d47e',
          '#e9c758'
        ],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-opacity': 0.95,
      },
    },
    {
      id: 'outdoor-route-casing',
      type: 'line',
      source: 'outdoor-route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#000000',
        'line-width': 10,
        'line-opacity': 0.95,
      },
    },
    {
      id: 'outdoor-route-line',
      type: 'line',
      source: 'outdoor-route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#FF5A1F',
        'line-width': 6,
        'line-opacity': 1,
      },
    },
  ],
};

export const MapContext = createContext({ map: null });
export const useMap = () => useContext(MapContext);
export const LngLatBounds = maplibregl.LngLatBounds;

// Normalize center coordinate to [lng, lat]
export const toLngLat = (coords) => {
  if (!coords) return ASIET_CAMPUS_CENTER;
  if (Array.isArray(coords)) {
    const c0 = Number(coords[0]);
    const c1 = Number(coords[1]);
    if (isNaN(c0) || isNaN(c1)) return ASIET_CAMPUS_CENTER;
    // If [lat, lng] format (lat ~10, lng ~76)
    if (c0 < c1) {
      return [c1, c0];
    }
    return [c0, c1];
  }
  if (coords.lng != null && coords.lat != null) {
    const lng = Number(coords.lng);
    const lat = Number(coords.lat);
    if (!isNaN(lng) && !isNaN(lat)) return [lng, lat];
  }
  return ASIET_CAMPUS_CENTER;
};

/**
 * CampusMap — Campus Area Only 3D/2D Map
 * Renders ONLY the ASIET campus compound, campus roads, and campus buildings from ASIET-Campus-Map.zip
 */
export const CampusMap = ({
  children,
  center,
  zoom = 17.8,
  onLocationSelect,
  className = '',
  style = {},
  interactive = true,
  showControls = true,
  initialPitch = 55,
  initialBearing = -25,
}) => {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [map, setMap] = useState(null);
  const [is3D, setIs3D] = useState(initialPitch > 0);

  const initialCenter = toLngLat(center);

  // Initialize MapLibre GL Map with Campus-Only style
  useEffect(() => {
    if (!containerRef.current) return;

    let mapInstance;
    try {
      mapInstance = new maplibregl.Map({
        container: containerRef.current,
        style: ASIET_MAP_STYLE,
        center: initialCenter,
        zoom,
        pitch: initialPitch,
        bearing: initialBearing,
        maxZoom: 22,
        minZoom: 14,
        interactive,
        attributionControl: false,
      });
    } catch (err) {
      console.error('Failed to construct MapLibre instance:', err);
      return;
    }

    mapInstance.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '<span style="font-size:9px">ASIET Campus Compound</span>',
      }),
      'bottom-right'
    );

    // Provide map instance to state immediately so controls and children can mount
    mapInstanceRef.current = mapInstance;
    setMap(mapInstance);

    const handleReady = () => {
      try {
        mapInstance.resize();
      } catch (_) {}
    };

    if (mapInstance.loaded() || mapInstance.isStyleLoaded()) {
      handleReady();
    } else {
      mapInstance.once('load', handleReady);
      mapInstance.once('styledata', handleReady);
    }

    mapInstance.on('error', (err) => {
      console.warn('MapLibre event notice:', err);
    });

    if (onLocationSelect) {
      mapInstance.on('click', (e) => {
        onLocationSelect({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
          lngLat: { lat: e.lngLat.lat, lng: e.lngLat.lng },
        });
      });
    }

    return () => {
      try {
        mapInstance.remove();
      } catch (_) {}
      mapInstanceRef.current = null;
      setMap(null);
    };
  }, []);

  // Sync center when props change
  useEffect(() => {
    if (!map || !center) return;
    const targetLngLat = toLngLat(center);
    map.easeTo({
      center: targetLngLat,
      zoom: zoom || map.getZoom(),
      duration: 800,
    });
  }, [map, JSON.stringify(center), zoom]);

  // Handle Resize with ResizeObserver & debounce fallback
  useEffect(() => {
    if (!map || !containerRef.current) return;

    map.resize();
    const timer = setTimeout(() => {
      map.resize();
    }, 250);

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        try {
          map.resize();
        } catch (_) {}
      });
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [map]);

  // Toggle 2D / 3D camera
  const handleToggleView = useCallback(() => {
    if (!map) return;
    const nextIs3D = !is3D;
    setIs3D(nextIs3D);
    map.easeTo({
      pitch: nextIs3D ? 55 : 0,
      bearing: nextIs3D ? -25 : 0,
      duration: 800,
    });
  }, [map, is3D]);

  // Reset to default campus view
  const handleResetCampus = useCallback(() => {
    if (!map) return;
    map.flyTo({
      center: ASIET_CAMPUS_CENTER,
      zoom: 17.8,
      pitch: is3D ? 55 : 0,
      bearing: is3D ? -25 : 0,
      duration: 1000,
    });
  }, [map, is3D]);

  return (
    <div
      className={`relative w-full h-full neo-border overflow-hidden bg-[#e8ddd5] ${className}`}
      style={{
        minHeight: style.minHeight || (className.includes('h-') ? '100%' : '380px'),
        ...style
      }}
    >
      <div ref={containerRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />

      {/* Floating 2D / 3D & Campus Controls (Neo-brutalist EventTrail Theme) */}
      {showControls && map && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetCampus}
            className="bg-white border-2 border-black px-2.5 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-yellow transition-colors cursor-pointer"
            title="Reset to campus center"
          >
            ⌂ Campus
          </button>
          <button
            type="button"
            onClick={handleToggleView}
            className="bg-pastel-yellow border-2 border-black px-2.5 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-mint transition-colors cursor-pointer"
            title="Toggle between 2D and 3D camera view"
          >
            {is3D ? '2D view' : '3D view'}
          </button>
        </div>
      )}

      <MapContext.Provider value={{ map }}>
        {map && children}
      </MapContext.Provider>
    </div>
  );
};

/**
 * Marker — MapLibre GL Marker with React Portal for custom JSX elements
 * Renders a guaranteed visible Neo-brutalist pin if children is not provided.
 */
export const Marker = ({
  longitude,
  latitude,
  lng,
  lat,
  position,
  children,
  onClick,
  draggable = false,
  onDragEnd,
  anchor = 'center',
  title,
}) => {
  const { map } = useMap();
  const markerRef = useRef(null);
  const containerRef = useRef(document.createElement('div'));
  const [mounted, setMounted] = useState(false);

  // Normalize target longitude and latitude
  let targetLng = longitude != null ? Number(longitude) : (lng != null ? Number(lng) : null);
  let targetLat = latitude != null ? Number(latitude) : (lat != null ? Number(lat) : null);

  if ((targetLng == null || targetLat == null) && position) {
    const [normLng, normLat] = toLngLat(position);
    targetLng = normLng;
    targetLat = normLat;
  }

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!map || targetLng == null || targetLat == null || isNaN(targetLng) || isNaN(targetLat)) return;

    let marker;
    try {
      marker = new maplibregl.Marker({
        element: containerRef.current,
        draggable,
        anchor,
      })
        .setLngLat([targetLng, targetLat])
        .addTo(map);

      markerRef.current = marker;
      setMounted(true);

      const handleClick = (e) => {
        e.stopPropagation();
        e.originalEvent = e;
        if (onClickRef.current) {
          onClickRef.current(e);
        }
      };
      containerRef.current.style.cursor = draggable ? 'grab' : 'pointer';
      containerRef.current.addEventListener('click', handleClick);
      marker._handleClick = handleClick;

      if (onDragEnd) {
        marker.on('dragend', () => {
          const pos = marker.getLngLat();
          onDragEnd({
            lngLat: { lat: pos.lat, lng: pos.lng },
            lat: pos.lat,
            lng: pos.lng,
          });
        });
      }
    } catch (err) {
      console.warn('Marker initialization error:', err);
      return;
    }

    return () => {
      try {
        if (marker) {
          if (marker._handleClick) {
            containerRef.current.removeEventListener('click', marker._handleClick);
          }
          marker.remove();
        }
      } catch (_) {}
      markerRef.current = null;
      setMounted(false);
    };
  }, [map, draggable, anchor, targetLng, targetLat]);

  useEffect(() => {
    if (markerRef.current && targetLng != null && targetLat != null && !isNaN(targetLng) && !isNaN(targetLat)) {
      markerRef.current.setLngLat([targetLng, targetLat]);
    }
  }, [targetLng, targetLat]);

  // Guaranteed default pin if no custom children JSX is provided
  const defaultPin = (
    <div className="flex flex-col items-center group cursor-pointer" title={title || 'Location Pin'}>
      {title && (
        <div className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1 whitespace-nowrap max-w-[160px] truncate">
          {title}
        </div>
      )}
      <div className="w-7 h-7 bg-[#FF5A1F] border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-white text-xs font-black">
        📍
      </div>
    </div>
  );

  return mounted ? createPortal(children || defaultPin, containerRef.current) : null;
};

/**
 * Popup — MapLibre GL Popup with Neo-brutalist styling
 */
export const Popup = ({
  longitude,
  latitude,
  lng,
  lat,
  position,
  children,
  onClose,
  offset = 15,
  anchor,
  className = '',
}) => {
  const { map } = useMap();
  const popupRef = useRef(null);
  const containerRef = useRef(document.createElement('div'));
  const [mounted, setMounted] = useState(false);

  const targetLng = longitude != null ? longitude : (lng != null ? lng : (position ? position[1] : null));
  const targetLat = latitude != null ? latitude : (lat != null ? lat : (position ? position[0] : null));

  useEffect(() => {
    if (!map || targetLng == null || targetLat == null) return;

    const popup = new maplibregl.Popup({
      offset,
      anchor,
      closeButton: true,
      closeOnClick: false,
      className: `neo-mapbox-popup ${className}`,
    })
      .setLngLat([targetLng, targetLat])
      .setDOMContent(containerRef.current)
      .addTo(map);

    popupRef.current = popup;
    setMounted(true);

    popup.on('close', () => {
      if (onClose) onClose();
    });

    return () => {
      popup.remove();
      popupRef.current = null;
      setMounted(false);
    };
  }, [map, offset, anchor]);

  useEffect(() => {
    if (popupRef.current && targetLng != null && targetLat != null) {
      popupRef.current.setLngLat([targetLng, targetLat]);
    }
  }, [targetLng, targetLat]);

  return mounted && children ? createPortal(children, containerRef.current) : null;
};

/**
 * Source & Layer compatibility wrappers for GeoJSON layers
 */
export const SourceContext = createContext(null);

export const Source = ({ id, type = 'geojson', data, children }) => {
  const { map } = useMap();
  const [sourceReady, setSourceReady] = useState(false);

  useEffect(() => {
    if (!map || !id || !data) return;

    const applySource = () => {
      try {
        const existing = map.getSource(id);
        if (existing) {
          existing.setData(data);
          setSourceReady(true);
        } else {
          map.addSource(id, { type, data });
          setSourceReady(true);
        }
      } catch (err) {
        console.warn('Error configuring source:', err);
      }
    };

    if (map.isStyleLoaded()) {
      applySource();
    } else {
      map.once('styledata', applySource);
    }

    return () => {
      map.off('styledata', applySource);
      try {
        const style = map.getStyle();
        if (style && style.layers) {
          style.layers.forEach((l) => {
            if (l.source === id) {
              try { map.removeLayer(l.id); } catch (_) {}
            }
          });
        }
        if (map.getSource(id)) {
          map.removeSource(id);
        }
      } catch (_) {}
    };
  }, [map, id, JSON.stringify(data)]);

  return (
    <SourceContext.Provider value={id}>
      {sourceReady ? children : null}
    </SourceContext.Provider>
  );
};

export const Layer = ({ id, type = 'line', source, layout = {}, paint = {} }) => {
  const { map } = useMap();
  const parentSource = useContext(SourceContext);
  const targetSource = source || parentSource || 'route';

  useEffect(() => {
    if (!map || !id || !targetSource) return;

    const applyLayer = () => {
      try {
        if (!map.getSource(targetSource)) return;
        if (!map.getLayer(id)) {
          map.addLayer({
            id,
            type,
            source: targetSource,
            layout,
            paint,
          });
        }
      } catch (err) {
        console.warn('Error adding layer:', err);
      }
    };

    if (map.isStyleLoaded()) {
      applyLayer();
    } else {
      map.once('styledata', applyLayer);
    }

    return () => {
      map.off('styledata', applyLayer);
      try {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      } catch (_) {}
    };
  }, [map, id, targetSource, type, JSON.stringify(paint), JSON.stringify(layout)]);

  return null;
};

export const NavigationControl = () => null;

export default CampusMap;
