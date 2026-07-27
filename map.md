# Campus Outdoor Navigation — GeoJSON Path Network + Routing

**Method 2: Digitized walkway graph with client-side A\* pathfinding**

This replaces a plain image-overlay map with a real routable path network, so CampusPulse can compute actual shortest walking routes between any two campus points instead of drawing straight lines or pre-baked paths.

---

## Overview

Instead of just showing a campus image on top of Leaflet, you'll:
1. Trace the real walkways of your campus as a graph of connected points (nodes + edges)
2. Store that graph in DynamoDB
3. Run A* pathfinding in React to compute the shortest route between any two nodes
4. Render the result as a Leaflet polyline

This keeps everything client-side — no routing server needed.

---

## Step 1: Get a georeferenced base image

**Option A — Manual screenshot (works for any campus)**

1. Take or source a top-down image of your campus (satellite screenshot, campus map PDF, or drone shot).
2. Identify the lat/lng of at least two known corners (use Google Maps — right-click a point → coordinates).
3. In Leaflet, overlay it:

```javascript
const bounds = [[topLeftLat, topLeftLng], [bottomRightLat, bottomRightLng]];
L.imageOverlay('campus-map.png', bounds).addTo(map);
```

**Option B — Use OpenStreetMap directly (faster, and skips manual georeferencing)**

If your campus is already mapped on OSM, you can skip the screenshot step entirely and read real building outlines and lat/lng straight from OSM's data — no need to eyeball corner coordinates.

1. Go to `openstreetmap.org` and center the map on your campus. For example, ASIET Kalady sits at roughly `10.1782, 76.4305` — you can jump straight there with a URL like:
   `https://www.openstreetmap.org/?mlat=10.1782&mlon=76.4305#map=19/10.1782/76.4305`
2. Click **Export** in the top menu to grab a bounding box (min/max lat/lng) tightly around your campus — this gives you exact `bounds` for `L.imageOverlay` or, better, lets you skip the image overlay and use the OSM tile layer directly at high zoom:

```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 21,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
map.setView([10.1782, 76.4305], 19);
```

3. To check whether buildings/paths on your campus are already digitized in OSM (which would save you all of Step 2), query **Overpass Turbo** (`overpass-turbo.eu`):

```overpassql
[out:json];
(
  way["building"](10.176,76.428,10.180,76.433);
  way["highway"~"footway|path"](10.176,76.428,10.180,76.433);
);
out geom;
```

Replace the bounding box with your own campus's coordinates. If footpaths already exist as OSM ways, you can export them directly as GeoJSON from Overpass Turbo and skip straight to Step 3 — no manual tracing needed. If your campus's internal paths aren't mapped (common for smaller institutions), fall back to Option A + Step 2 below.

Either option gives you the same result: a georeferenced backdrop for the routing layer to sit on top of.

---

## Step 2: Trace the walkway network as GeoJSON

1. Go to [geojson.io](https://geojson.io).
2. Load your campus image as a reference (or just work over the satellite basemap if it's accurate enough).
3. Use the "Draw Point" tool to place a point at every:
   - Gate/entrance
   - Junction where two or more paths meet
   - Building entrance
4. Use the "Draw LineString" tool to trace the actual walkway between each pair of connected points.
5. Export as `campus-paths.geojson`.

Each point becomes a **node**, each line segment becomes an **edge**.

**Tip:** Keep node names meaningful now (`gate-main`, `junction-library`, `entrance-cs-block`) — you'll reference these as IDs later.

---

## Step 3: Convert GeoJSON into a graph structure

Write a small script (Node.js or Python) to parse the GeoJSON into an adjacency-list graph:

```javascript
// convertGeoJSON.js
const fs = require('fs');
const geojson = JSON.parse(fs.readFileSync('campus-paths.geojson'));

const nodes = {}; // { nodeId: { lat, lng } }
const edges = []; // { from, to, distance }

// Extract points as nodes
geojson.features
  .filter(f => f.geometry.type === 'Point')
  .forEach(f => {
    nodes[f.properties.id] = {
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0]
    };
  });

// Extract lines as edges, compute distance with haversine
function haversine(a, b) {
  const R = 6371000; // meters
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180, lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}

geojson.features
  .filter(f => f.geometry.type === 'LineString')
  .forEach(f => {
    const { from, to } = f.properties; // set these in geojson.io's property editor
    edges.push({ from, to, distance: haversine(nodes[from], nodes[to]) });
  });

fs.writeFileSync('graph.json', JSON.stringify({ nodes, edges }, null, 2));
```

Output: `graph.json` with all nodes and weighted edges ready to load.

---

## Step 4: Store the graph in DynamoDB

Two tables (or one table, two item types):

**PathNodes**
| nodeId (PK) | lat | lng | type | label |
|---|---|---|---|---|
| gate-main | 8.5241 | 76.9366 | entrance | Main Gate |
| junction-library | 8.5245 | 76.9370 | junction | — |
| entrance-cs-block | 8.5249 | 76.9374 | building | CS Block |

**PathEdges**
| edgeId (PK) | fromNode | toNode | distance |
|---|---|---|---|
| e1 | gate-main | junction-library | 42.3 |
| e2 | junction-library | entrance-cs-block | 30.1 |

Write a one-time seed script using the AWS SDK to bulk-insert from `graph.json` into these tables via Lambda or a local script with the DynamoDB client.

---

## Step 5: Fetch the graph in React

On app load (or cache it), pull both tables and reconstruct the adjacency list client-side:

```javascript
async function loadGraph() {
  const nodes = await fetchAllNodes(); // GET from API Gateway → Lambda → DynamoDB scan
  const edges = await fetchAllEdges();

  const adjacency = {};
  edges.forEach(({ fromNode, toNode, distance }) => {
    adjacency[fromNode] = adjacency[fromNode] || [];
    adjacency[toNode] = adjacency[toNode] || [];
    adjacency[fromNode].push({ node: toNode, weight: distance });
    adjacency[toNode].push({ node: fromNode, weight: distance }); // bidirectional
  });

  return { nodes, adjacency };
}
```

---

## Step 6: Implement A* pathfinding

```javascript
function haversineHeuristic(a, b, nodes) {
  // same haversine function as Step 3, used as A* heuristic
  return haversine(nodes[a], nodes[b]);
}

function findPath(start, end, adjacency, nodes) {
  const openSet = new Set([start]);
  const cameFrom = {};
  const gScore = { [start]: 0 };
  const fScore = { [start]: haversineHeuristic(start, end, nodes) };

  while (openSet.size > 0) {
    let current = [...openSet].reduce((a, b) => (fScore[a] ?? Infinity) < (fScore[b] ?? Infinity) ? a : b);

    if (current === end) {
      const path = [current];
      while (cameFrom[current]) {
        current = cameFrom[current];
        path.unshift(current);
      }
      return path;
    }

    openSet.delete(current);
    (adjacency[current] || []).forEach(({ node: neighbor, weight }) => {
      const tentativeG = gScore[current] + weight;
      if (tentativeG < (gScore[neighbor] ?? Infinity)) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + haversineHeuristic(neighbor, end, nodes);
        openSet.add(neighbor);
      }
    });
  }
  return null; // no path found
}
```

---

## Step 7: Render the route on Leaflet

```javascript
function RouteLayer({ path, nodes }) {
  const latlngs = path.map(nodeId => [nodes[nodeId].lat, nodes[nodeId].lng]);
  return <Polyline positions={latlngs} color="#2563eb" weight={4} />;
}
```

Trigger `findPath(startId, endId, adjacency, nodes)` whenever the user selects a destination, then pass the result into `RouteLayer`.

---

## Step 8: Connect to the geofence handoff (indoor/outdoor)

- Building entrance nodes (e.g. `entrance-cs-block`) double as the **bridge points** into your SVG indoor graph.
- When outdoor A* reaches a building-entrance node and the user's GPS enters that building's geofence, switch rendering to the indoor SVG system and continue A* on the indoor graph starting from that same entrance node ID.
- This is what lets you eventually merge both graphs into a single unified pathfinding system, as discussed earlier.

---

## Step 9: Test and refine

- Walk the actual campus (or simulate with `navigator.geolocation` mock coordinates) to check that traced paths match real walkways.
- Watch for missing edges (isolated nodes) — A* will silently fail to route if two areas aren't connected in your graph.
- Add a small admin-only debug view that renders all nodes/edges as markers so you can visually audit the graph.

---

## Why this is better than the plain image-overlay approach

| | Image overlay only | GeoJSON path network |
|---|---|---|
| Route between two points | Manual/hardcoded | Computed dynamically (A*) |
| Adding a new building | Redraw route manually | Add one node + edge |
| Shortest path | Not guaranteed | Guaranteed by algorithm |
| Reusable for indoor merge | No | Yes (same graph model) |

This is also a strong point to highlight in your project report/viva: it shows algorithmic depth (graph theory + A*) rather than just a static map display.
