import React, { useState } from 'react';
import { Source, Layer, Marker, Popup } from 'react-map-gl/mapbox';

export default function RouteLayer({ path, nodes, showBridgePoints = true }) {
  const [selectedBridge, setSelectedBridge] = useState(null);
  if (!nodes) return null;

  // Mapbox GeoJSON line string expects coordinates in [lng, lat] format
  const coordinates = (path || []).map(nodeId => {
    const node = nodes[nodeId];
    return node ? [node.lng, node.lat] : null;
  }).filter(Boolean);

  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates
    }
  };

  const lineLayerStyle = {
    id: 'route-line-layer',
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#FF5A1F',
      'line-width': 5,
      'line-opacity': 0.9,
      'line-dasharray': [2, 2]
    }
  };

  // Render bridge points (entrance nodes for geofence handoff hints)
  const bridgePoints = showBridgePoints 
    ? Object.entries(nodes)
        .filter(([id, node]) => node.type === 'entrance' || node.type === 'building')
        .map(([id, node]) => ({ id, ...node }))
    : [];

  return (
    <>
      {coordinates.length > 1 && (
        <Source id="route-source" type="geojson" data={geojson}>
          <Layer {...lineLayerStyle} />
        </Source>
      )}
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
