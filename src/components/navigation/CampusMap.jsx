import React, { useEffect } from 'react';
import Map, { useMap } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigationStore } from '../../store/navigationStore';
import { RouteLayer } from './RouteLayer';
import { BuildingLayer } from './BuildingLayer';
import { UserLocationMarker } from './UserLocationMarker';
import { ARMarkers } from './ARMarkers';
import { AR_FOG_CONFIG } from '../../utils/fogConfig';

// OpenStreetMap style compatible with MapLibre (no tokens required)
const OPENMAPTILES_STYLE = 'https://demotiles.maplibre.org/style.json';

// Polyfill maplibregl.Map so that transform.center is always available for react-map-gl v8
const patchedMapLib = {
  ...maplibregl,
  Map: class extends (maplibregl.Map || maplibregl.default.Map) {
    constructor(...args) {
      super(...args);
      if (this.transform && !('center' in this.transform)) {
        Object.defineProperty(Object.getPrototypeOf(this.transform), 'center', {
          get: () => this.getCenter(),
          configurable: true
        });
      }
    }
  }
};

function CameraController() {
  const { current: map } = useMap();
  const viewMode = useNavigationStore((s) => s.viewMode);
  const snappedLocation = useNavigationStore((s) => s.snappedLocation);
  const destination = useNavigationStore((s) => s.destination);
  const heading = useNavigationStore((s) => s.heading);
  const routeData = useNavigationStore((s) => s.routeData);

  useEffect(() => {
    if (!map) return;
    const nativeMap = map.getMap ? map.getMap() : map;
    if (nativeMap && nativeMap.transform && !('center' in nativeMap.transform)) {
      Object.defineProperty(Object.getPrototypeOf(nativeMap.transform), 'center', {
        get: () => nativeMap.getCenter(),
        configurable: true
      });
    }

    if (viewMode === '2d-map') {
      if (map.setFog) map.setFog(null);
      map.easeTo({
        center: [snappedLocation.lng, snappedLocation.lat],
        pitch: 0,
        zoom: 16,
        bearing: 0,
        duration: 1200
      });
    } else if (viewMode === 'route-overview') {
      if (map.setFog) map.setFog(null);
      if (destination && snappedLocation) {
        const minLng = Math.min(snappedLocation.lng, destination.lng);
        const maxLng = Math.max(snappedLocation.lng, destination.lng);
        const minLat = Math.min(snappedLocation.lat, destination.lat);
        const maxLat = Math.max(snappedLocation.lat, destination.lat);

        map.fitBounds([
          [minLng, minLat],
          [maxLng, maxLat]
        ], {
          pitch: 45,
          padding: 80,
          duration: 1500
        });
      }
    } else if (viewMode === 'turn-by-turn') {
      if (map.setFog) map.setFog(null);
      map.easeTo({
        center: [snappedLocation.lng, snappedLocation.lat],
        pitch: 60,
        zoom: 18.5,
        bearing: heading || 0,
        duration: 800
      });
    } else if (viewMode === 'ar-simulation') {
      try {
        if (map.setFog) map.setFog(AR_FOG_CONFIG);
        
        // Eye-level camera height (1.7 meters in Mercator coordinate system)
        const pos = maplibregl.MercatorCoordinate.fromLngLat(
          [snappedLocation.lng, snappedLocation.lat],
          1.7
        );
        const cam = map.getFreeCameraOptions();
        if (cam) {
          cam.position = pos;
          cam.setPitchBearing(85, heading || map.getBearing());
          map.setFreeCameraOptions(cam);
        } else {
          map.easeTo({
            center: [snappedLocation.lng, snappedLocation.lat],
            pitch: 85,
            zoom: 20,
            bearing: heading || 0,
            duration: 800
          });
        }
      } catch (err) {
        console.warn("FreeCameraOptions fallback in AR mode:", err);
        map.easeTo({
          center: [snappedLocation.lng, snappedLocation.lat],
          pitch: 85,
          zoom: 20,
          bearing: heading || 0,
          duration: 800
        });
      }
    }
  }, [map, viewMode, destination, snappedLocation, heading, routeData]);

  return null;
}

export function CampusMap() {
  const snappedLocation = useNavigationStore((s) => s.snappedLocation);

  return (
    <div className="relative w-full h-full bg-[#000814] overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_#000]">
      <Map
        initialViewState={{
          longitude: snappedLocation?.lng || 76.2144,
          latitude: snappedLocation?.lat || 10.5270,
          zoom: 16,
          pitch: 0,
          bearing: 0
        }}
        mapLib={patchedMapLib}
        mapStyle={OPENMAPTILES_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <CameraController />
        <BuildingLayer />
        <RouteLayer />
        <UserLocationMarker />
        <ARMarkers />
      </Map>
    </div>
  );
}
