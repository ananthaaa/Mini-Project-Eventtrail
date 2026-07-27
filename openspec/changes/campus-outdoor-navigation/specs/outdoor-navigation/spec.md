## ADDED Requirements

### Requirement: GeoJSON Graph Persistence
The system SHALL retrieve the outdoor navigation network (nodes and edges) from DynamoDB on application load to construct a routing graph.

#### Scenario: Client initializes outdoor navigation
- **WHEN** the application starts up
- **THEN** the client fetches `PathNodes` and `PathEdges` from DynamoDB
- **AND THEN** constructs a bidirectional adjacency list for pathfinding

### Requirement: Client-side A* Pathfinding
The system SHALL compute the shortest walking path between a start node and an end node locally on the client using the A* algorithm and a Haversine heuristic.

#### Scenario: User requests a route
- **WHEN** the user selects a start location and a destination location on the Full Campus Map page
- **THEN** the system runs the A* pathfinding algorithm on the adjacency list
- **AND THEN** returns a sequence of node IDs representing the shortest path

#### Scenario: Path is unreachable
- **WHEN** the user requests a route between two disconnected areas in the graph
- **THEN** the system returns a null path and notifies the user that no path was found

### Requirement: Route Rendering
The system SHALL render the computed shortest path on the map interface.

#### Scenario: Route is computed successfully
- **WHEN** the A* algorithm returns a valid path
- **THEN** the system renders a polyline layer on the Mapbox map connecting the nodes in the path sequence
