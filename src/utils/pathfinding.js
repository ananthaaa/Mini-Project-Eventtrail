export function haversineHeuristic(a, b, nodes) {
  const nodeA = nodes[a];
  const nodeB = nodes[b];
  if (!nodeA || !nodeB) return Infinity;
  
  const R = 6371000; // meters
  const dLat = (nodeB.lat - nodeA.lat) * Math.PI / 180;
  const dLng = (nodeB.lng - nodeA.lng) * Math.PI / 180;
  const lat1 = nodeA.lat * Math.PI / 180;
  const lat2 = nodeB.lat * Math.PI / 180;
  
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}

export function buildAdjacencyList(edges) {
  const adjacency = {};
  edges.forEach(({ fromNode, toNode, distance }) => {
    if (!adjacency[fromNode]) adjacency[fromNode] = [];
    if (!adjacency[toNode]) adjacency[toNode] = [];
    adjacency[fromNode].push({ node: toNode, weight: distance });
    adjacency[toNode].push({ node: fromNode, weight: distance }); // bidirectional
  });
  return adjacency;
}

export function findPathAStar(start, end, adjacency, nodes) {
  if (!start || !end || !nodes[start] || !nodes[end]) return null;

  const openSet = new Set([start]);
  const cameFrom = {};
  const gScore = { [start]: 0 };
  const fScore = { [start]: haversineHeuristic(start, end, nodes) };

  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let current = null;
    let lowestFScore = Infinity;
    
    for (const node of openSet) {
      const score = fScore[node] !== undefined ? fScore[node] : Infinity;
      if (score < lowestFScore) {
        lowestFScore = score;
        current = node;
      }
    }

    if (current === end) {
      const path = [current];
      while (cameFrom[current]) {
        current = cameFrom[current];
        path.unshift(current);
      }
      return path;
    }

    openSet.delete(current);
    
    const neighbors = adjacency[current] || [];
    for (const { node: neighbor, weight } of neighbors) {
      const tentativeG = gScore[current] + weight;
      
      const currentGNeighbor = gScore[neighbor] !== undefined ? gScore[neighbor] : Infinity;
      if (tentativeG < currentGNeighbor) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + haversineHeuristic(neighbor, end, nodes);
        openSet.add(neighbor);
      }
    }
  }
  
  return null; // no path found
}
