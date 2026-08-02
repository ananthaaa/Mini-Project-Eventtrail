import { fetchPathNodes as apiFetchPathNodes, fetchPathEdges as apiFetchPathEdges } from './apiService';

export async function fetchPathNodes() {
  const nodesArr = await apiFetchPathNodes();
  // Ensure the format matches what findPathAStar expects. The mock returned an object where keys are node IDs.
  // The backend DynamoDB scan returns an array of nodes.
  const nodesObj = {};
  nodesArr.forEach(node => {
    nodesObj[node.nodeId] = { lat: node.lat, lng: node.lng };
  });
  return nodesObj;
}

export async function fetchPathEdges() {
  const edgesArr = await apiFetchPathEdges();
  // Ensure we map DynamoDB edges (with fromNode, toNode) correctly.
  return edgesArr;
}
