import React, { useState, useEffect } from 'react';
import { Source, Layer, Marker, Popup, useMap, LngLatBounds } from './CampusMap';

export default function RouteLayer({ path, nodes, showBridgePoints = true }) {
  const [selectedBridge, setSelectedBridge] = useState(null);
  const { map } = useMap();

  // Mapbox GeoJSON line string expects coordinates in [lng, lat] format
  const coordinates = React.useMemo(() => {
    if (!nodes || !path) return [];
    return path.map(nodeId => {
      const node = nodes[nodeId];
      return node ? [node.lng, node.lat] : null;
    }).filter(Boolean);
  }, [nodes, path]);

  useEffect(() => {
    if (!map || coordinates.length < 2) return;
    try {
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      coordinates.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: { top: 90, bottom: 120, left: 90, right: 90 },
        maxZoom: 18.5,
        duration: 800,
      });
    } catch (_) {}
  }, [map, coordinates]);

  // Update built-in outdoor-route GeoJSON line source
  useEffect(() => {
    if (!map) return;

    const geojsonData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates.length > 1 ? coordinates : [],
      },
    };

    const updateRouteOnMap = () => {
      try {
        const source = map.getSource('outdoor-route');
        if (source) {
          source.setData(geojsonData);
          return true;
        }
      } catch (err) {
        console.warn('Error setting route GeoJSON:', err);
      }
      return false;
    };

    // Try applying immediately
    const applied = updateRouteOnMap();
    if (!applied) {
      const retryListener = () => {
        if (updateRouteOnMap()) {
          map.off('load', retryListener);
          map.off('styledata', retryListener);
          map.off('render', retryListener);
        }
      };
      map.on('load', retryListener);
      map.on('styledata', retryListener);
      map.on('render', retryListener);

      return () => {
        map.off('load', retryListener);
        map.off('styledata', retryListener);
        map.off('render', retryListener);
      };
    }
  }, [map, coordinates]);

  if (!nodes) return null;

  // Render bridge points (entrance nodes for geofence handoff hints)
  const bridgePoints = showBridgePoints 
    ? Object.entries(nodes)
        .filter(([id, node]) => (node.type === 'entrance' || node.type === 'building') && (node.isDestination || node.label))
        .map(([id, node]) => ({ id, ...node }))
    : [];

  return (
    <>
      {bridgePoints.map(bp => (
        <Marker 
          key={bp.id} 
          longitude={bp.lng} 
          latitude={bp.lat} 
          anchor="center"
          onClick={e => {
            e.originalEvent.stopPropagation();
            setSelectedBridge(bp);
          }}
        >
          <div 
            className="w-3 h-3 bg-[#FFDB58] border-2 border-black rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[1px_1px_0px_0px_#000]"
            title={bp.label || 'Building Entrance'}
          />
        </Marker>
      ))}
      {selectedBridge && (
        <Popup
          longitude={selectedBridge.lng}
          latitude={selectedBridge.lat}
          anchor="bottom"
          offset={12}
          onClose={() => setSelectedBridge(null)}
          className="neo-mapbox-popup"
          closeOnClick={false}
        >
          <div className="text-sm">
            <strong className="block font-black text-black text-base mb-1">{selectedBridge.label || 'Building Entrance'}</strong>
            <span className="text-xs font-bold uppercase tracking-wider text-black/70 bg-[#FDFD96] px-2 py-0.5 border border-black inline-block mt-1">Bridge Point</span>
            <p className="text-xs text-black mt-2">Handoff node for indoor navigation geofencing.</p>
          </div>
        </Popup>
      )}
    </>
  );
}
