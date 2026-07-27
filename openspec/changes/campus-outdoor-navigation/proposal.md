## Why

The current CampusPulse app relies on a static image-overlay map with manually hardcoded routes. This approach does not guarantee the shortest paths and fails to scale well when adding new buildings or dynamic routing constraints. By moving to a digitized walkway graph mapped over Mapbox (using custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc`) and utilizing client-side A* pathfinding, we can ensure dynamic and algorithmically sound path computation with high-performance rendering. Additionally, providing dedicated map views—such as a full campus navigation page and an interactive student event map for viewing admin-marked events—significantly improves campus navigation and student engagement. This change also prepares the system for seamless indoor/outdoor handoffs later on.

## What Changes

- Replace the plain image-overlay map with a Mapbox tile layer utilizing custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc`.
- Create a dedicated **Full Campus Map Page** for comprehensive outdoor navigation and routing across campus.
- Create a dedicated **Student Event Map Page** where students can see admin-marked events plotted on the map and view event info interactively.
- **BREAKING**: Move away from hardcoded straight-line path routing.
- Map the campus walkway network using GeoJSON (nodes for junctions/entrances, edges for paths).
- Parse the GeoJSON to build an adjacency list representing the campus graph.
- Store nodes and edges data in DynamoDB for retrieval by the client.
- Implement client-side A* pathfinding using a Haversine heuristic.
- Render the computed shortest path dynamically as a Mapbox layer/polyline.
- Establish bridge points (building entrances) for geofence handoff between outdoor and future indoor navigation systems.

## Capabilities

### New Capabilities
- `campus-map`: Renders outdoor campus base maps using Mapbox with custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc`. Covers a dedicated Full Campus Map page for navigation and a dedicated Student Event Map page displaying admin-marked events and their details.
- `outdoor-navigation`: Client-side A* pathfinding and GeoJSON path network layer to route users between any two points on campus on the Mapbox interface.

### Modified Capabilities
<!-- No existing capabilities to modify, this is a greenfield implementation in the specs context -->

## Impact

- **UI/Map**: Replace React Leaflet components with Mapbox GL / React Mapbox components configured with custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc`. Introduce two new dedicated page views: Full Campus Map and Student Event Map.
- **Backend/DB**: DynamoDB tables will be introduced to persist `PathNodes` and `PathEdges`. Admin-marked events will be queried and displayed on the student event map.
- **Client App**: The client will download the routing graph at load and compute routes on the fly rather than requesting fixed paths.
