# Campus Navigation — Architecture & Build Guide

This document serves as the canonical reference for EventTrail's outdoor and indoor campus navigation system. It combines the graph network pathfinding architecture with the progressive 4-mode camera navigation build guide.

---

## Part 1: GeoJSON Path Network + Client-Side A* Routing

**Method: Digitized walkway graph with client-side A* pathfinding**

This replaces a plain image-overlay map with a real routable path network, so EventTrail / CampusPulse can compute actual shortest walking routes between any two campus points instead of drawing straight lines or pre-baked paths.

### 1. Overview

Instead of just showing a campus image on top of Leaflet/MapLibre, the navigation engine:
1. Traces the real walkways of campus as a graph of connected points (nodes + edges).
2. Stores that graph in DynamoDB (`PathNodes` and `PathEdges`).
3. Runs A* pathfinding in React to compute the shortest route between any two nodes.
4. Renders the result as a map polyline or 3D extrusion layer.

This keeps pathfinding entirely client-side — no external routing server needed.

### 2. Step 1: Get a Georeferenced Base Image or OSM Basemap

**Option A — Manual screenshot (works for any campus)**
1. Take or source a top-down image of your campus (satellite screenshot, campus map PDF, or drone shot).
2. Identify the lat/lng of at least two known corners (use Google Maps — right-click a point → coordinates).
3. Overlay in map engine using bounding coordinates.

**Option B — Use OpenStreetMap directly (recommended)**
If campus is mapped on OSM, read real building outlines and lat/lng straight from OSM tiles or Overpass Turbo API:
```javascript
// Example tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 21,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

### 3. Step 2: Trace the Walkway Network as GeoJSON
1. Use [geojson.io](https://geojson.io) or QGIS.
2. Place Point features at every gate/entrance, junction, and building entrance.
3. Draw LineString features between connected points.
4. Export as `campus-paths.geojson`. Each point becomes a **node**, each line segment becomes an **edge**.

### 4. Step 3: Graph Structure & DynamoDB Schema

**PathNodes Table**
| nodeId (PK) | lat | lng | type | label |
|---|---|---|---|---|
| gate-main | 8.5241 | 76.9366 | entrance | Main Gate |
| junction-library | 8.5245 | 76.9370 | junction | — |
| entrance-cs-block | 8.5249 | 76.9374 | building | CS Block |

**PathEdges Table**
| edgeId (PK) | fromNode | toNode | distance |
|---|---|---|---|
| e1 | gate-main | junction-library | 42.3 |
| e2 | junction-library | entrance-cs-block | 30.1 |

### 5. Step 4: Client-Side A* Algorithm
On load, fetch nodes and edges to build an adjacency list in React, then execute A* using Haversine distance as the heuristic:
```javascript
function haversine(a, b) {
  const R = 6371000; // meters
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180, lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}
```

### 6. Step 5: Geofence Handoff (Indoor/Outdoor)
- Building entrance nodes (e.g., `entrance-cs-block`) double as bridge points into the indoor SVG floor plan graph.
- When outdoor A* reaches a building entrance node and user GPS enters that building geofence, switch rendering to the indoor navigation component.

---

## Part 2: Progressive 4-Mode Navigation Module Build Guide

**Target:** EventTrail / CampusPulse student web app
**Route:** `#/student/navigate/:eventId`
**Engine:** MapLibre GL JS (open-source, supports 3D fill-extrusion, free camera options, fog, and custom styles).

### 1. The Four View Modes (Single Map Instance)

| Mode | Camera | Purpose |
|---|---|---|
| **2D Map** | pitch 0° | Idle state, browse destination pins |
| **Route Overview** | pitch 45° | See the full walking route |
| **Turn-by-Turn** | pitch 60°, 3D buildings | Step-by-step directions while walking |
| **AR Simulation** | pitch 85°, eye-level | First-person immersive view near arrival |

### 2. Component Structure
```
src/
  pages/student/
    NavigateToVenue.tsx        # route/page wrapper
  components/navigation/
    CampusMap.tsx               # single map instance, camera modes
    RouteLayer.tsx               # renders the A* path as a line/corridor
    BuildingLayer.tsx             # 3D buildings, holographic in AR mode
    UserLocationMarker.tsx        # live GPS marker, rotates with heading
    ARMarkers.tsx                  # floating destination markers in AR mode
    TurnByTurnPanel.tsx              # step instructions
    ModeToggle.tsx                     # 2D / Overview / Turn-by-turn / AR switch
  hooks/
    useLiveLocation.ts            # watchPosition + heading
    useSnapToPath.ts               # snaps raw GPS to nearest path point
    useTurnByTurnSteps.ts           # derives steps from A* route geometry
  store/
    navigationStore.ts             # viewMode, route, live position state
```

### 3. Key Implementation Details

#### Live GPS & Path Snapping
Raw mobile GPS has a ~5–15m error variance. Rather than showing a marker jittering off-path, snap raw GPS coordinates to the nearest point on the computed A* line using Turf.js:
```ts
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
const snapped = nearestPointOnLine(routeLine, rawGpsPoint);
```

#### Re-routing on Drift
On every GPS update, compute distance from the planned path. If drift exceeds tolerance (~12–15m), re-run A* from the current position to destination.

#### AR Simulation Mode Setup
```ts
// Eye-level camera (~1.7m above ground)
const position = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 1.7);
const cam = map.getFreeCameraOptions();
cam.position = position;
cam.setPitchBearing(85, map.getBearing());
map.setFreeCameraOptions(cam);

// Holographic 3D buildings
map.setPaintProperty("3d-buildings", "fill-extrusion-emissive-strength", 1.0);

// Atmospheric fog styling
map.setFog({
  range: [1.5, 10],
  "horizon-blend": 0.06,
  color: "#0d1b2a",
  "high-color": "#1a3a5c",
  "space-color": "#000814",
  "star-intensity": 0.12,
});
```

### 4. Rollout & Testing Checklist
- [ ] Confirm GPS accuracy on physical campus grounds to calibrate snap-to-path tolerance.
- [ ] Test iOS Safari `DeviceOrientationEvent.requestPermission()` user-gesture requirement.
- [ ] Verify HTTPS context enforcement (required for geolocation and orientation APIs).
- [ ] Validate re-routing trigger when walking off-path.
- [ ] Check battery consumption during continuous `watchPosition` and throttle map camera easing to 1–2s intervals.
