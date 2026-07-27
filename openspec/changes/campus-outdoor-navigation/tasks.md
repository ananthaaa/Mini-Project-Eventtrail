## 1. Graph Data Preparation

- [x] 1.1 Create the GeoJSON campus path network file
- [x] 1.2 Write a script to convert the GeoJSON nodes and edges into an adjacency list (JSON format)
- [x] 1.3 Create an AWS SDK seed script to bulk-insert `PathNodes` and `PathEdges` into DynamoDB

## 2. Map Engine Migration (Mapbox)

- [x] 2.1 Install and configure Mapbox GL / React Mapbox dependencies in the UI project
- [x] 2.2 Create a reusable Mapbox base map component utilizing custom style `mapbox://styles/ananthakrishnanaca/cms0kbfy500o901qk07sm6tdc`

## 3. Pathfinding Logic

- [x] 3.1 Implement API calls to fetch `PathNodes` and `PathEdges` from DynamoDB on application load
- [x] 3.2 Construct the bidirectional adjacency list client-side using the fetched data
- [x] 3.3 Implement the Haversine heuristic function for distance calculation
- [x] 3.4 Implement the client-side A* pathfinding algorithm

## 4. Full Campus Map Page (Dedicated Outdoor Navigation)

- [x] 4.1 Create the dedicated Full Campus Map page (`/campus-map` or dedicated routing view) with Mapbox GL
- [x] 4.2 Create a Mapbox vector layer component (`RouteLayer`) to render A* computed shortest paths dynamically
- [x] 4.3 Integrate UI controls (start and destination selectors) on the Full Campus Map page to trigger A* pathfinding and handle unreachable/edge cases

## 5. Student Event Map Page

- [x] 5.1 Create the dedicated Student Event Map page for students to explore campus events
- [x] 5.2 Fetch admin-marked events from backend/state and render them as interactive Mapbox markers
- [x] 5.3 Implement interactive event modal/popover when a student clicks an event marker to display event info
