import { getDistanceMeters } from './bearing';

// Sample ASIET campus walkway nodes [lng, lat] for offline pathfinding
export const CAMPUS_WALKWAY_NODES = [
  { id: 'gate', coord: [76.2144, 10.5270], neighbors: ['main-block', 'canteen'] },
  { id: 'main-block', coord: [76.2148, 10.5273], neighbors: ['gate', 'lib-junction', 'cs-block'] },
  { id: 'canteen', coord: [76.2140, 10.5272], neighbors: ['gate', 'pg-block'] },
  { id: 'lib-junction', coord: [76.2152, 10.5275], neighbors: ['main-block', 'library', 'auditorium'] },
  { id: 'cs-block', coord: [76.2150, 10.5278], neighbors: ['main-block', 'auditorium'] },
  { id: 'pg-block', coord: [76.2138, 10.5276], neighbors: ['canteen', 'library'] },
  { id: 'library', coord: [76.2149, 10.5279], neighbors: ['lib-junction', 'pg-block', 'sports-ground'] },
  { id: 'auditorium', coord: [76.2155, 10.5277], neighbors: ['lib-junction', 'cs-block', 'sports-ground'] },
  { id: 'sports-ground', coord: [76.2153, 10.5283], neighbors: ['library', 'auditorium'] }
];

/**
 * Find the closest graph node to a given [lng, lat] coordinate
 */
function findClosestNode(coord) {
  let closest = CAMPUS_WALKWAY_NODES[0];
  let minDist = Infinity;
  for (const node of CAMPUS_WALKWAY_NODES) {
    const dist = getDistanceMeters(coord, node.coord);
    if (dist < minDist) {
      minDist = dist;
      closest = node;
    }
  }
  return closest;
}

/**
 * Run A* pathfinding over the campus walkway graph
 * Returns GeoJSON LineString feature of [lng, lat] points
 */
export function runAStar(networkGeoJSON, startCoord, destCoord) {
  if (!startCoord || !destCoord) return null;

  const startNode = findClosestNode(startCoord);
  const endNode = findClosestNode(destCoord);

  // If start and dest map to the same node, just connect direct line
  if (startNode.id === endNode.id) {
    return {
      type: 'Feature',
      properties: { distance: Math.round(getDistanceMeters(startCoord, destCoord)) },
      geometry: {
        type: 'LineString',
        coordinates: [startCoord, destCoord]
      }
    };
  }

  // A* open and closed sets
  const openSet = new Set([startNode.id]);
  const cameFrom = {};
  
  const gScore = {};
  const fScore = {};
  
  CAMPUS_WALKWAY_NODES.forEach(n => {
    gScore[n.id] = Infinity;
    fScore[n.id] = Infinity;
  });

  gScore[startNode.id] = 0;
  fScore[startNode.id] = getDistanceMeters(startNode.coord, endNode.coord);

  const nodeMap = new Map(CAMPUS_WALKWAY_NODES.map(n => [n.id, n]));

  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let currentId = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      if (fScore[id] < lowestF) {
        lowestF = fScore[id];
        currentId = id;
      }
    }

    if (currentId === endNode.id) {
      // Reconstruct path
      const pathNodes = [currentId];
      let curr = currentId;
      while (cameFrom[curr]) {
        curr = cameFrom[curr];
        pathNodes.unshift(curr);
      }

      const coordinates = [
        startCoord,
        ...pathNodes.map(id => nodeMap.get(id).coord),
        destCoord
      ];

      // Remove duplicate consecutive coords
      const cleanCoords = coordinates.filter((pt, idx) => 
        idx === 0 || pt[0] !== coordinates[idx-1][0] || pt[1] !== coordinates[idx-1][1]
      );

      let totalDist = 0;
      for (let i = 0; i < cleanCoords.length - 1; i++) {
        totalDist += getDistanceMeters(cleanCoords[i], cleanCoords[i+1]);
      }

      return {
        type: 'Feature',
        properties: { distance: Math.round(totalDist) },
        geometry: {
          type: 'LineString',
          coordinates: cleanCoords
        }
      };
    }

    openSet.delete(currentId);
    const currNode = nodeMap.get(currentId);

    for (const neighborId of currNode.neighbors) {
      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) continue;

      const tentativeG = gScore[currentId] + getDistanceMeters(currNode.coord, neighborNode.coord);
      if (tentativeG < gScore[neighborId]) {
        cameFrom[neighborId] = currentId;
        gScore[neighborId] = tentativeG;
        fScore[neighborId] = tentativeG + getDistanceMeters(neighborNode.coord, endNode.coord);
        openSet.add(neighborId);
      }
    }
  }

  // Fallback direct line if graph is disconnected
  return {
    type: 'Feature',
    properties: { distance: Math.round(getDistanceMeters(startCoord, destCoord)) },
    geometry: {
      type: 'LineString',
      coordinates: [startCoord, destCoord]
    }
  };
}
