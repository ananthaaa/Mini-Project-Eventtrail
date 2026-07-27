## 1. Setup & Dependencies

- [x] 1.1 Install required geospatial and state management packages (`maplibre-gl`, `react-map-gl`, `@turf/buffer`, `@turf/bearing`, `@turf/along`, `@turf/nearest-point-on-line`, `@turf/helpers`, `zustand`)
- [x] 1.2 Scaffold folder structure under `src/components/navigation/`, `src/hooks/`, `src/store/`, and `src/utils/`

## 2. State & Core Algorithms

- [x] 2.1 Implement `navigationStore.ts` using Zustand to manage viewMode (`2d-map`, `route-overview`, `turn-by-turn`, `ar-simulation`), live position, heading, and active route geometry
- [x] 2.2 Create `useLiveLocation.ts` hook utilizing `navigator.geolocation.watchPosition` and `deviceorientationabsolute` (including iOS Safari permission request handler)
- [x] 2.3 Create `useSnapToPath.ts` hook to snap raw mobile GPS coordinates to the nearest walkway LineString point using `@turf/nearest-point-on-line`
- [x] 2.4 Create `useTurnByTurnSteps.ts` to derive step instructions algorithmically from consecutive >25° bearing changes along the path network
- [x] 2.5 Implement drift detection and automatic re-routing when user deviation exceeds 15 meters from active path geometry

## 3. Map & Layer Components

- [x] 3.1 Create `CampusMap.tsx` supporting smooth camera transitions (`map.easeTo` and `FreeCameraOptions`) across the 4 view modes on a single instance
- [x] 3.2 Create `RouteLayer.tsx` to render the 2D path and 3D extruded neon corridor (`@turf/buffer`) in AR simulation mode
- [x] 3.3 Create `BuildingLayer.tsx` to render 3D building extrusions with holographic emissive styling in AR simulation mode
- [x] 3.4 Create `UserLocationMarker.tsx` and `ARMarkers.tsx` to display real-time GPS position, compass heading rotation, and floating destination pins

## 4. UI Chrome & Integration

- [x] 4.1 Create `ModeToggle.tsx` and `TurnByTurnPanel.tsx` wrapped in Didasko neo-brutalist styling (hard 2px black borders, offset box shadows, primary yellow/mint accents)
- [x] 4.2 Create `NavigateToVenue.tsx` page under `src/pages/student/` wired to route `#/student/navigate/:eventId` and connect event venue coordinates to `CampusMap`
- [x] 4.3 Integrate geofence handoff logic to unmount outdoor campus navigation and mount indoor SVG floor-plan guidance upon entering building radii
