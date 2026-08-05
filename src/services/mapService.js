import { fetchPathNodes as apiFetchPathNodes, fetchPathEdges as apiFetchPathEdges } from './apiService';
import fallbackGraph from '../data/graph.json';

export async function fetchPathNodes() {
  try {
    const nodesArr = await apiFetchPathNodes();
    if (Array.isArray(nodesArr) && nodesArr.length > 0) {
      const nodesObj = {};
      nodesArr.forEach(node => {
        // Copy all properties (including type, label) from the API response
        nodesObj[node.nodeId] = { ...node };
      });
      return nodesObj;
    }
    // Fallback: use local graph.json nodes
    return fallbackGraph.nodes;
  } catch (e) {
    console.warn('Graph nodes API failed, using fallback:', e.message);
    return fallbackGraph.nodes;
  }
}

export async function fetchPathEdges() {
  try {
    const edgesArr = await apiFetchPathEdges();
    if (Array.isArray(edgesArr) && edgesArr.length > 0) {
      return edgesArr;
    }
    return fallbackGraph.edges;
  } catch (e) {
    console.warn('Graph edges API failed, using fallback:', e.message);
    return fallbackGraph.edges;
  }
}
