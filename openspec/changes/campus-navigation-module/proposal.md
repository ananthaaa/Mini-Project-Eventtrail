## Why

CampusPulse and EventTrail students need seamless, intuitive outdoor navigation from their real-time location to campus event venues. Traditional static maps or straight-line overlays fail to provide actionable walking guidance along real campus footpaths and lack immersive visual feedback during approach and arrival.

## What Changes

- Introduce a dedicated navigation route (`#/student/navigate/:eventId`) that guides students from their current GPS position to an event venue.
- Implement a 4-mode progressive camera architecture on a single map instance (2D Map at 0° pitch, Route Overview at 45° pitch, Turn-by-Turn directions at 60° pitch with 3D buildings, and AR Simulation at 85° eye-level pitch).
- Integrate client-side A* pathfinding over the campus GeoJSON walkway graph rather than external routing APIs, ensuring routes follow internal ASIET paths.
- Add live GPS location tracking (`watchPosition`) with automatic snapping to the nearest walkway point using `@turf/nearest-point-on-line`.
- Add device orientation tracking (`deviceorientationabsolute`) for real-time compass heading and camera rotation on mobile devices.
- Add automatic drift detection and re-routing when a user deviates >12-15m from the planned path.
- Add dynamic turn-by-turn instruction generation derived from route geometry bearing changes (>25° delta).
- Implement an AR Simulation arrival mode featuring eye-level camera positioning (1.7m), holographic emissive 3D buildings, 3D extruded neon paths, and custom atmospheric fog.
- Support seamless geofence handoff from outdoor navigation to existing indoor SVG floor-plan guidance when entering building radii.

## Capabilities

### New Capabilities
- `progressive-campus-navigation`: Single-instance map camera architecture supporting 2D Map, Route Overview, Turn-by-Turn, and AR Simulation modes.
- `client-side-pathfinding`: Custom A* routing engine computing shortest paths over the campus GeoJSON walkway network with live drift detection and re-routing.
- `live-location-tracking`: Real-time geolocation tracking with GPS path-snapping and device orientation compass heading.
- `ar-simulation-mode`: Immersive first-person arrival simulation with 3D extruded neon paths, holographic building rendering, and atmosphere styling.

### Modified Capabilities
- `<existing-name>`: None

## Impact

- **New Routes & Pages**: Adds `src/pages/student/NavigateToVenue.tsx` (or `.jsx`).
- **New Components**: Adds navigation UI components (`CampusMap`, `RouteLayer`, `BuildingLayer`, `UserLocationMarker`, `ARMarkers`, `TurnByTurnPanel`, `ModeToggle`).
- **Dependencies**: Adds lightweight geospatial and mapping helpers (`@turf/buffer`, `@turf/bearing`, `@turf/along`, `@turf/nearest-point-on-line`, `@turf/helpers`, `zustand`).
- **System Integration**: Connects with existing event/venue data stores and indoor navigation components (`VenueDirections`) without altering backend routing servers.
