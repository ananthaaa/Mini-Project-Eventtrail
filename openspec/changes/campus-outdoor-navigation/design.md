## Context

The CampusPulse app requires an outdoor navigation system and interactive event mapping. The current implementation relies on a plain image-overlay map with hardcoded straight-line paths. This is inefficient, non-scalable, and doesn't provide true shortest path navigation along real walkways. We are migrating to a digitized walkway graph using a GeoJSON path network and client-side A* routing over Mapbox (using custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc`). Additionally, we are introducing two dedicated map page views: a Full Campus Map page for outdoor navigation and routing, and a Student Event Map page for discovering admin-marked campus events.

## Goals / Non-Goals

**Goals:**
- Render an accurate, scalable campus map using Mapbox with custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc`.
- Create a dedicated **Full Campus Map Page** for comprehensive outdoor navigation and routing across campus.
- Create a dedicated **Student Event Map Page** where students can discover admin-marked events plotted as interactive map markers and view event info interactively.
- Define a GeoJSON network of nodes (entrances/junctions) and edges (walkways).
- Persist the path network data in DynamoDB for dynamic retrieval.
- Compute the shortest path between two points on the client-side using the A* algorithm.
- Render the computed path dynamically as a vector layer/polyline on the Mapbox map.
- Establish bridge points for future indoor geofence handoff.

**Non-Goals:**
- Server-side routing computations (e.g. pgRouting or a dedicated routing server).
- Implementing the indoor navigation geofencing system in this change (only preparing bridge points).

## Decisions

- **Client-Side A\***: We chose to perform A* pathfinding on the client (React) rather than a routing server. **Rationale**: A campus graph is small enough to load into memory client-side. This saves server costs, reduces latency for route calculations, and allows seamless integration with future indoor graphs on the device.
- **Mapbox GL vs OpenStreetMap/Leaflet**: We chose Mapbox with custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc` rather than standard OpenStreetMap/Leaflet tiles. **Rationale**: Mapbox GL provides hardware-accelerated vector rendering, smooth animations, and a tailored visual identity through the custom style. Vector maps also allow superior layering of GeoJSON routing paths and interactive event markers.
- **Separate Views for Navigation vs. Student Event Discovery**: We decided to create two dedicated map pages (Full Campus Map and Student Event Map) instead of cluttering a single map view. **Rationale**: Separating routing/navigation from event exploration reduces cognitive load for students and ensures a clean UI layout tailored to each task (e.g., A* pathfinder controls vs. event filtering and detail cards).
- **Graph Storage**: The node and edge data will be stored in DynamoDB tables (`PathNodes` and `PathEdges`). **Rationale**: DynamoDB provides fast, scalable read performance when fetching the entire graph on application load.

## Risks / Trade-offs

- **[Risk] Missing Edges in Graph** → A* will silently fail to route if two areas aren't connected. **Mitigation**: Implement an admin-only debug view to visualize nodes and edges and ensure graph connectivity. Walk the campus or simulate paths to test.
- **[Risk] Mapbox GL Token & WebGL Support** → Mapbox GL requires a valid access token and a WebGL-compatible browser. **Mitigation**: Ensure the access token is securely configured in environment variables and provide fallback error messaging if WebGL initialization fails on legacy devices.
- **[Trade-off] Client-side memory** → The client must download the entire graph on load. Since a campus graph is typically small (hundreds of nodes/edges), the memory and download payload overhead is negligible compared to full city graphs.
