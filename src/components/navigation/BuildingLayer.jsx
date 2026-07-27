import React from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useNavigationStore } from '../../store/navigationStore';

// Standalone ASIET campus 3D building footprints for reliable rendering
const ASIET_BUILDINGS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Main Block', height: 25, base_height: 0, id: 'main-block' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.2146, 10.5272],
          [76.2150, 10.5272],
          [76.2150, 10.5274],
          [76.2146, 10.5274],
          [76.2146, 10.5272]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Library & Auditorium Block', height: 20, base_height: 0, id: 'library' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.2148, 10.5277],
          [76.2156, 10.5277],
          [76.2156, 10.5280],
          [76.2148, 10.5280],
          [76.2148, 10.5277]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'CS & IT Department', height: 18, base_height: 0, id: 'cs-block' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.2148, 10.5275],
          [76.2152, 10.5275],
          [76.2152, 10.5277],
          [76.2148, 10.5277],
          [76.2148, 10.5275]
        ]]
      }
    }
  ]
};

export function BuildingLayer() {
  const viewMode = useNavigationStore((s) => s.viewMode);
  const isAR = viewMode === 'ar-simulation';

  return (
    <Source id="asiet-3d-buildings-source" type="geojson" data={ASIET_BUILDINGS_GEOJSON}>
      <Layer
        id="3d-buildings-layer"
        type="fill-extrusion"
        paint={{
          'fill-extrusion-color': isAR ? '#00f5d4' : '#e5e5e5', // Holographic mint in AR, neutral gray otherwise
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'base_height'],
          'fill-extrusion-opacity': isAR ? 0.7 : 0.85,
        }}
      />
    </Source>
  );
}
