import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import buffer from '@turf/buffer';
import { feature, lineString } from '@turf/helpers';
import { useNavigationStore } from '../../store/navigationStore';

export function RouteLayer() {
  const routeData = useNavigationStore((s) => s.routeData);
  const viewMode = useNavigationStore((s) => s.viewMode);

  const { lineFeature, corridorFeature } = useMemo(() => {
    if (!routeData || !routeData.geometry) return { lineFeature: null, corridorFeature: null };
    
    let feat = routeData.geometry;
    if (feat.type === 'LineString') feat = feature(feat);
    else if (Array.isArray(feat)) feat = lineString(feat);

    let corridor = null;
    if (viewMode === 'ar-simulation') {
      try {
        corridor = buffer(feat, 2, { units: 'meters' });
      } catch (err) {
        console.warn("Buffer calculation error for AR neon corridor:", err);
      }
    }
    return { lineFeature: feat, corridorFeature: corridor };
  }, [routeData, viewMode]);

  if (!lineFeature) return null;

  return (
    <>
      {/* 2D Line Glow/Casing Layer (Didasko Peach/Yellow theme) */}
      <Source id="route-line-source" type="geojson" data={lineFeature}>
        <Layer
          id="route-line-casing"
          type="line"
          paint={{
            'line-color': '#ffbe0b', // Primary Yellow casing
            'line-width': 10,
            'line-opacity': 0.9,
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
        <Layer
          id="route-line-core"
          type="line"
          paint={{
            'line-color': '#000000', // Hard black core
            'line-width': 5,
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
      </Source>

      {/* 3D Extruded Neon Path in AR Simulation mode */}
      {viewMode === 'ar-simulation' && corridorFeature && (
        <Source id="route-corridor-source" type="geojson" data={corridorFeature}>
          <Layer
            id="route-corridor-extrusion"
            type="fill-extrusion"
            paint={{
              'fill-extrusion-color': '#00f5d4', // Secondary Mint / Neon
              'fill-extrusion-height': 0.4,
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.85,
            }}
          />
        </Source>
      )}
    </>
  );
}
