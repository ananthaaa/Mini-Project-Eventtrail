import { fetchPathNodes as apiFetchPathNodes, fetchPathEdges as apiFetchPathEdges } from './apiService';
import roadGraph from '../data/graph.json';

export async function fetchPathNodes() {
  try {
    const nodesArr = await apiFetchPathNodes();
    // Only use API if it contains the full digitized road network (>50 nodes)
    if (Array.isArray(nodesArr) && nodesArr.length > 50) {
      const nodesObj = {};
      nodesArr.forEach(node => {
        nodesObj[node.nodeId] = { ...node };
      });
      return nodesObj;
    }
    // Authoritative digitized ASIET campus road network (290 nodes)
    return roadGraph.nodes;
  } catch (e) {
    console.warn('Graph nodes API unavailable, using verified road network:', e.message);
    return roadGraph.nodes;
  }
}

export async function fetchPathEdges() {
  try {
    const edgesArr = await apiFetchPathEdges();
    // Only use API if it contains the full digitized road network (>50 edges)
    if (Array.isArray(edgesArr) && edgesArr.length > 50) {
      return edgesArr;
    }
    // Authoritative digitized ASIET campus road network (108 road segments)
    return roadGraph.edges;
  } catch (e) {
    console.warn('Graph edges API unavailable, using verified road network:', e.message);
    return roadGraph.edges;
  }
}
