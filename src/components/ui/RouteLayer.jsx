import React, { useState, useEffect, useMemo } from 'react';
import { Marker, Popup, useMap } from './CampusMap';
import roadGraph from '../../data/graph.json';

export default function RouteLayer({
  path,
  nodes,
  coordinates: propCoordinates,
  showBridgePoints = false,
  autoFitBounds = false,
}) {
  const [selectedBridge, setSelectedBridge] = useState(null);
  const { map } = useMap();

  const activeNodes = nodes || roadGraph.nodes;

  // Mapbox GeoJSON line string expects coordinates in [lng, lat] format
  const coordinates = useMemo(() => {
    if (propCoordinates && propCoordinates.length > 0) {
      // Normalize if passed in [[lat, lng]] format
      return propCoordinates.map((coord) => {
        if (!coord) return null;
        if (Array.isArray(coord)) {
          // If [lat, lng] format (lat ~10, lng ~76)
          if (coord[0] < coord[1]) return [coord[1], coord[0]];
          return [coord[0], coord[1]];
        }
        if (coord.lng != null && coord.lat != null) return [coord.lng, coord.lat];
        return null;
      }).filter(Boolean);
    }

    if (path && Array.isArray(path) && activeNodes) {
      return path
        .map((nodeId) => {
          const node = activeNodes[nodeId];
          return node ? [node.lng, node.lat] : null;
        })
        .filter(Boolean);
    }

    return [];
  }, [path, activeNodes, propCoordinates]);

  // Optionally fit bounds if requested
  useEffect(() => {
    if (!map || !autoFitBounds || coordinates.length < 2) return;
    try {
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      coordinates.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: { top: 70, bottom: 90, left: 70, right: 70 },
        maxZoom: 18.5,
        duration: 800,
      });
    } catch (_) {}
  }, [map, coordinates, autoFitBounds]);

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

  if (!showBridgePoints || !activeNodes) return null;

  // Render bridge points (entrance nodes for geofence handoff hints)
  const bridgePoints = Object.entries(activeNodes)
    .filter(([id, node]) => (node.type === 'entrance' || node.type === 'building') && (node.isDestination || node.label))
    .map(([id, node]) => ({ id, ...node }));

  return (
    <>
      {bridgePoints.map((bp) => (
        <Marker
          key={bp.id}
          longitude={bp.lng}
          latitude={bp.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedBridge(bp);
          }}
        >
          <div className="w-3.5 h-3.5 bg-accent-yellow border-2 border-black rounded-full shadow-[1px_1px_0px_0px_#000] hover:scale-125 transition-transform cursor-pointer" />
        </Marker>
      ))}

      {selectedBridge && (
        <Popup
          longitude={selectedBridge.lng}
          latitude={selectedBridge.lat}
          anchor="top"
          onClose={() => setSelectedBridge(null)}
          offset={10}
        >
          <div className="p-1 font-body text-xs">
            <h4 className="font-display font-black uppercase text-sm mb-1">{selectedBridge.label}</h4>
            <p className="text-black/70 mb-2">Campus Waypoint Node ({selectedBridge.id})</p>
          </div>
        </Popup>
      )}
    </>
  );
}
