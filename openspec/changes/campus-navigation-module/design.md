## Context

The EventTrail application currently features basic outdoor map widgets using Mapbox GL, but lacks progressive walking navigation from a student's real-time GPS location to specific event venues. The build guide (`map (1).md`) defines a single-instance camera architecture with 4 view modes, client-side A* pathfinding over an internal GeoJSON walkway graph, GPS path-snapping, and an immersive AR simulation mode near arrival.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated navigation view (`#/student/navigate/:eventId`) that connects live GPS tracking with event destination coordinates.
- Maintain a single map instance (`CampusMap`) that smoothly transitions between 4 view modes using camera interpolation (`map.easeTo` / `FreeCameraOptions`).
- Execute client-side A* routing over the campus walkway graph and re-route automatically when drift exceeds 12-15 meters.
- Derive step-by-step turn instructions algorithmically from route geometry bearing changes (>25° delta).
- Implement an AR Simulation arrival experience with eye-level camera height (1.7m), holographic 3D buildings, 3D extruded neon paths (`@turf/buffer`), and atmospheric fog.
- Automatically hand off to existing indoor SVG navigation when entering a building geofence radius.

**Non-Goals:**
- Using third-party routing APIs (e.g., Mapbox Directions API or Google Directions API) for campus footpaths.
- Indoor GPS or Wi-Fi positioning (rely on existing indoor navigation mechanisms once inside).
- Changing backend routing servers or databases (all pathfinding runs client-side).

## Decisions

- **Map Engine vs Library Choice**: Use `maplibre-gl` (with `react-map-gl/maplibre`) as recommended in the build guide, or continue using `react-map-gl/mapbox` if Mapbox tokens and styles are already established and required by other modules. **Rationale**: Both libraries share identical FreeCameraOptions, 3D building extrusion, and fog APIs. To maintain compatibility with existing Mapbox tokens and neo-brutalist custom styles, we can wrap the single instance to support the required 3D/AR features cleanly.
- **Client-Side A* vs Server Routing**: Store the campus walkway network as a GeoJSON LineString/Point graph and compute shortest paths in a Zustand store (`navigationStore.ts`). **Rationale**: Campus paths are not mapped accurately on public routing servers. Local A* execution is instantaneous (<5ms) and works offline once the graph is loaded.
- **Path Snapping with Turf.js**: Raw mobile GPS accuracy (~5-15m) causes erratic jumping. We use `@turf/nearest-point-on-line` to project the user's raw coordinate onto the planned route LineString before rendering the marker.
- **Algorithm-Derived Turn-by-Turn Steps**: Walk the route LineString using `@turf/along` and `@turf/bearing`. A consecutive bearing change greater than 25° emits a turn instruction (e.g., "Turn left in 15 meters").
- **UI Styling in Didasko Aesthetic**: While the map surface renders standard map tiles, all surrounding navigation chrome (mode toggles, turn panels, ETA cards) must use hard 2px black borders, offset box shadows (`shadow-[2px_2px_0px_0px_#000]`), and primary yellow/mint accents.

## Risks / Trade-offs

- [iOS Safari Device Orientation Permission] → Silently fails without explicit user interaction. **Mitigation**: Request `DeviceOrientationEvent.requestPermission()` inside a direct user tap handler (such as clicking the "Start Navigation" button).
- [GPS Accuracy & Battery Drain] → High-accuracy continuous `watchPosition` and camera animations can drain mobile battery and cause jitter. **Mitigation**: Throttle camera re-centering updates to 1-2 second intervals and set path-snapping tolerance based on field testing.
- [HTTPS Requirement] → Geolocation and orientation APIs require secure origins. **Mitigation**: Ensure production deployments (Vercel/CloudFront) enforce HTTPS and use secure tunnels (e.g., ngrok or vite --host with SSL certs) during mobile LAN testing.
