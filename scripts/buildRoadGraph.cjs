const fs = require('fs');
const path = require('path');

const campus = require('../src/data/asiet-campus.json');
const graph = require('../src/data/asiet-graph.json');

// Distance in meters between [lng, lat] coordinates
const dist = (a, b) => {
  const dLng = (a[0] - b[0]) * 109500;
  const dLat = (a[1] - b[1]) * 111320;
  return Math.hypot(dLng, dLat);
};

// Compute polygon centroid
const middle = (f) => {
  const coords = f.geometry.coordinates[0].slice(0, -1);
  return coords.reduce(
    (acc, p) => [acc[0] + p[0] / coords.length, acc[1] + p[1] / coords.length],
    [0, 0]
  );
};

// 1. Build Road Network Adjacency and Edges
const roadAdjacency = {};
const edges = [];
let edgeCounter = 1;

graph.paths.forEach((pathIds) => {
  for (let i = 0; i < pathIds.length - 1; i++) {
    const fromId = pathIds[i];
    const toId = pathIds[i + 1];
    const fromCoord = graph.nodes[fromId];
    const toCoord = graph.nodes[toId];

    if (!fromCoord || !toCoord) continue;

    const distance = Math.round(dist(fromCoord, toCoord) * 10) / 10;

    roadAdjacency[fromId] = roadAdjacency[fromId] || [];
    roadAdjacency[toId] = roadAdjacency[toId] || [];
    roadAdjacency[fromId].push({ node: toId, weight: distance });
    roadAdjacency[toId].push({ node: fromId, weight: distance });

    edges.push({
      edgeId: `road-e${edgeCounter++}`,
      from: fromId,
      to: toId,
      fromNode: fromId,
      toNode: toId,
      distance,
    });
  }
});

// Helper: Find nearest road node to a given [lng, lat] coordinate
const nearestRoadNode = (coord) => {
  let best = null;
  let minDist = Infinity;
  for (const id of Object.keys(roadAdjacency)) {
    const d = dist(coord, graph.nodes[id]);
    if (d < minDist) {
      minDist = d;
      best = id;
    }
  }
  return { nodeId: best, distance: minDist };
};

// 2. Add all raw road nodes from graph.json
const nodes = {};

for (const [id, [lng, lat]] of Object.entries(graph.nodes)) {
  nodes[id] = {
    nodeId: id,
    lat,
    lng,
    type: 'junction',
    label: `Road Waypoint ${id.slice(-4)}`,
  };
}

// 3. Define Key Campus Named Destinations
const campusPlaces = [
  {
    id: 'gate-main',
    label: 'Main Gate (College Road Entrance)',
    type: 'entrance',
    coord: [76.4291012, 10.177813],
    isDestination: true,
  },
  {
    id: 'btech-block',
    label: 'B.Tech Academic Block',
    type: 'building',
    campusBuildingId: '305732357',
    entranceCoord: [76.4305177, 10.1779085],
    isDestination: true,
  },
  {
    id: 'entrance-cs-block',
    label: 'CS Block (B.Tech Building)',
    type: 'building',
    campusBuildingId: '305732357',
    entranceCoord: [76.4305177, 10.1779085],
    isDestination: true,
  },
  {
    id: 'mech-block',
    label: 'Mechanical Engineering Block',
    type: 'building',
    campusBuildingId: '305732067',
    entranceCoord: [76.4310891, 10.1778689],
    isDestination: true,
  },
  {
    id: 'mba-block',
    label: 'MBA & Management Block',
    type: 'building',
    campusBuildingId: '305732124',
    entranceCoord: [76.4312174, 10.1780506],
    isDestination: true,
  },
  {
    id: 'civil-block',
    label: 'Civil Engineering Block',
    type: 'building',
    campusBuildingId: '1536581183',
    entranceCoord: [76.4292348, 10.1772779],
    isDestination: true,
  },
  {
    id: 'pg-block',
    label: 'PG Block & Research Labs',
    type: 'building',
    campusBuildingId: '305732053',
    entranceCoord: [76.4294329, 10.1775627],
    isDestination: true,
  },
  {
    id: 'entrance-science',
    label: 'Science Building Block B',
    type: 'building',
    campusBuildingId: '305732053',
    entranceCoord: [76.4294329, 10.1775627],
    isDestination: true,
  },
  {
    id: 'ctf-lab',
    label: 'CTF & Cyber Security Lab',
    type: 'building',
    campusBuildingId: '1536578643',
    entranceCoord: [76.4299571, 10.1775839],
    isDestination: true,
  },
  {
    id: 'workshop-block',
    label: 'Central Workshop & Smithy',
    type: 'building',
    campusBuildingId: '305732229',
    entranceCoord: [76.4310845, 10.1781502],
    isDestination: true,
  },
  {
    id: 'junction-library',
    label: 'Central Library Junction',
    type: 'junction',
    coord: [76.4299169, 10.1778451],
    isDestination: true,
  },
  {
    id: 'entrance-hub',
    label: 'Student Activity Hub',
    type: 'building',
    coord: [76.43004264, 10.17759638],
    entranceCoord: [76.4299571, 10.1775839],
    isDestination: true,
  },
  {
    id: 'union-cafe',
    label: 'Student Union Cafe & Canteen',
    type: 'building',
    coord: [76.4298325, 10.1774514],
    entranceCoord: [76.4298325, 10.1774514],
    isDestination: true,
  },
  {
    id: 'entrance-stadium',
    label: 'Campus Sports Ground & Basketball Court',
    type: 'facility',
    coord: [76.4305, 10.1777],
    entranceCoord: [76.430518, 10.1778688],
    isDestination: true,
  },
  {
    id: 'north-gate',
    label: 'North Campus College Road Gate',
    type: 'entrance',
    coord: [76.4289991, 10.179946],
    isDestination: true,
  },
  {
    id: 'isolated-node',
    label: 'North Research Annex (Disconnected)',
    type: 'building',
    coord: [76.435, 10.185],
    isDestination: true,
    disconnected: true,
  },
];

// Add each campus place to nodes and link to the closest road network node
campusPlaces.forEach((place) => {
  let coord = place.coord;
  if (!coord && place.campusBuildingId) {
    const f = campus.features.find((feat) => feat.properties.id === place.campusBuildingId);
    if (f) coord = middle(f);
  }

  if (!coord) return;

  nodes[place.id] = {
    nodeId: place.id,
    lat: coord[1],
    lng: coord[0],
    type: place.type,
    label: place.label,
    isDestination: true,
  };

  if (place.disconnected) return;

  const connectTarget = place.entranceCoord || coord;
  const nearest = nearestRoadNode(connectTarget);

  if (nearest.nodeId) {
    const distance = Math.max(2, Math.round(nearest.distance * 10) / 10);
    edges.push({
      edgeId: `entrance-e${edgeCounter++}`,
      from: place.id,
      to: nearest.nodeId,
      fromNode: place.id,
      toNode: nearest.nodeId,
      distance,
    });
  }
});

// Write to src/data/graph.json and public/graph.json
const outputPathSrc = path.resolve(__dirname, '../src/data/graph.json');
const outputPathPub = path.resolve(__dirname, '../public/graph.json');

const graphData = JSON.stringify({ nodes, edges }, null, 2);
fs.writeFileSync(outputPathSrc, graphData, 'utf-8');
fs.writeFileSync(outputPathPub, graphData, 'utf-8');

console.log(`Successfully compiled road network graph to ${outputPathSrc} and ${outputPathPub}`);
console.log(`Total nodes: ${Object.keys(nodes).length}, Total road edges: ${edges.length}`);
