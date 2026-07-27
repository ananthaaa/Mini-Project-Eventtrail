# Campus Navigation Module — Build Guide

**Target:** EventTrail / CampusPulse student web app
**Route:** `#/student/navigate/:eventId`
**Reference POC:** campus-navigation-poc (Mapbox GL single-instance camera-mode demo)

---

## 1. What we're building

A navigation module that takes a student from their current location to an event's venue, with four progressive view modes on a single map instance:

| Mode | Camera | Purpose |
|---|---|---|
| 2D Map | pitch 0° | Idle state, browse destination pins |
| Route Overview | pitch 45° | See the full walking route |
| Turn-by-Turn | pitch 60°, 3D buildings | Step-by-step directions while walking |
| AR Simulation | pitch 85°, eye-level | First-person immersive view near arrival |

This is **not** using Mapbox Directions API for routing — it uses your **own A\* engine over your GeoJSON campus path network**, since Mapbox/OSM doesn't know ASIET's internal footpaths. The map engine only handles rendering + camera, not pathfinding.

---

## 2. Engine decision

| Option | Cost | Notes |
|---|---|---|
| **MapLibre GL JS** (recommended) | Free, no token | Open-source Mapbox v1 fork. Supports `FreeCameraOptions`, `fill-extrusion`, fog, terrain — everything this module needs. |
| Mapbox GL JS | Free tier (50k loads/mo), then paid | Slightly better default styles/imagery, needs a token + billing account eventually. |

**Recommendation:** MapLibre GL JS. No cost, no token management, same APIs used in this guide.

```bash
npm install maplibre-gl react-map-gl @turf/buffer @turf/bearing @turf/along @turf/nearest-point-on-line @turf/helpers zustand
```

---

## 3. File structure to add

```
src/
  pages/student/
    NavigateToVenue.tsx        # new route/page
  components/navigation/
    CampusMap.tsx               # single map instance, camera modes
    RouteLayer.tsx               # renders the A* path as a line
    BuildingLayer.tsx             # 3D buildings, holographic in AR mode
    UserLocationMarker.tsx        # live GPS marker, rotates with heading
    ARMarkers.tsx                  # floating destination markers in AR mode
    TurnByTurnPanel.tsx              # step instructions (Didasko styled)
    ModeToggle.tsx                     # 2D / Overview / Turn-by-turn / AR switch
  hooks/
    useLiveLocation.ts            # watchPosition + heading
    useSnapToPath.ts               # snaps raw GPS to nearest path point
    useTurnByTurnSteps.ts           # derives steps from A* route geometry
  store/
    navigationStore.ts             # viewMode, route, live position state
  utils/
    bearing.ts                    # bearing + haversine (reuse from POC)
    fogConfig.ts                   # AR atmosphere config
```

---

## 4. Step-by-step build order

### Step 1 — Wire the destination
Pull venue lat/lng from your existing event data (RDS/DynamoDB) instead of a hardcoded constant. The "Navigate" button on an event card/detail modal routes to:
```
#/student/navigate/:eventId
```
`NavigateToVenue.tsx` fetches the event, extracts venue coordinates, and passes them into `CampusMap`.

### Step 2 — Get the route from your own A*
```ts
const route = runAStar(campusPathNetworkGeoJSON, startCoord, destCoord);
// route: GeoJSON LineString of [lng, lat] points
```
Feed this into `navigationStore` as `routeData.geometry`. This entirely replaces `useDirections.ts` from the POC.

### Step 3 — Live location instead of a fixed start
```ts
navigator.geolocation.watchPosition(
  (pos) => setLiveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.heading),
  onError,
  { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
);
```
Requires HTTPS (Vercel/CloudFront covers this; plain HTTP LAN testing won't work).

### Step 4 — Snap to path
Raw phone GPS is ~5–15m accurate — often the width of a footpath. Snap the displayed marker to the nearest point on your path network rather than trusting the raw dot:
```ts
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
const snapped = nearestPointOnLine(routeLine, rawGpsPoint);
```

### Step 5 — Heading / compass
```ts
window.addEventListener("deviceorientationabsolute", (e) => setHeading(e.alpha));
```
⚠️ iOS Safari requires an explicit permission prompt triggered by a user tap:
```ts
await DeviceOrientationEvent.requestPermission();
```

### Step 6 — Re-routing on drift
On every position update, check distance from the planned path. If drift > ~12–15m, re-run A* from the new position and update `routeData`.

### Step 7 — Turn-by-turn step generation
Since there's no Directions API, derive steps yourself from the route LineString:
```ts
import { along, bearing } from "@turf/turf";
// Walk the line in fixed intervals, compare consecutive bearings.
// Bearing change > ~25° => emit a turn instruction (left/right).
```

### Step 8 — Camera modes
One `useEffect` watching `viewMode`, calling `map.easeTo({...})` per mode — same pattern as the POC's `CampusMap.tsx`:
```ts
if (viewMode === "2d-map")        map.easeTo({ pitch: 0,  zoom: 15 });
if (viewMode === "route-overview") fitRouteBounds(map, dest); // pitch 45
if (viewMode === "turn-by-turn")   map.easeTo({ pitch: 60, zoom: 18, bearing: firstStepBearing });
if (viewMode === "ar-simulation")  map.easeTo({ pitch: 85, zoom: 20 }); // + FreeCameraOptions below
```

### Step 9 — AR simulation mode
```ts
// Eye-level camera (1.7m)
const position = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 1.7);
const cam = map.getFreeCameraOptions();
cam.position = position;
cam.setPitchBearing(85, map.getBearing());
map.setFreeCameraOptions(cam);

// Holographic buildings
map.setPaintProperty("3d-buildings", "fill-extrusion-emissive-strength", 1.0);

// 3D neon path
import buffer from "@turf/buffer";
const corridor = buffer(routeLine, 2, { units: "meters" });
// render `corridor` as a fill-extrusion layer

// Atmosphere
map.setFog({
  range: [1.5, 10],
  "horizon-blend": 0.06,
  color: "#0d1b2a",
  "high-color": "#1a3a5c",
  "space-color": "#000814",
  "star-intensity": 0.12,
});
```

### Step 10 — Look-around controls
Pointer-drag on desktop (built into MapLibre), `deviceorientationabsolute` to rotate the camera bearing on mobile.

### Step 11 — Geofence handoff to indoor nav
Reuse your existing geofence logic: when the live (snapped) position enters a building's geofence radius, unmount `CampusMap` and mount your existing SVG floor-plan `VenueDirections` component. This module never tries to do indoor GPS — that's already solved elsewhere in your app.

### Step 12 — Style the UI chrome, not the map surface
The map tiles themselves render as a normal map — you can't neobrutalist-ify tile rendering. Wrap the **surrounding UI** (distance/ETA card, mode toggle, turn-by-turn instruction bar, destination search sheet) in your existing Didasko components: hard 2px black borders, offset drop shadows, no border-radius, Primary Yellow / Secondary Mint / Tertiary Peach accents — so it reads as part of EventTrail rather than a bolted-on demo.

---

## 5. Testing checklist before rollout

- [ ] Confirm actual GPS accuracy walking around real ASIET grounds (do this before polishing any UI — it determines your snap-to-path tolerance)
- [ ] Test iOS Safari's `DeviceOrientationEvent.requestPermission()` flow specifically — this silently fails without a user gesture
- [ ] Verify HTTPS is enforced (geolocation + orientation both require a secure context)
- [ ] Test re-routing behavior when deliberately walking off the suggested path
- [ ] Battery check: continuous `watchPosition` + rendering — throttle camera re-centers to ~1–2s intervals rather than every GPS tick
- [ ] Verify geofence handoff into indoor nav triggers correctly at building entrances

---

## 6. What NOT to reuse from the POC as-is

- `useDirections.ts` — replace entirely with your A* output
- `COLLEGE_GATE` fixed start point — replace with live GPS
- Mapbox token/billing — use MapLibre instead, no token needed
