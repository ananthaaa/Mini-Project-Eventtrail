import graphData from '../data/graph.json';

// Simulating API calls to fetch from DynamoDB on application load
export async function fetchPathNodes() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(graphData.nodes);
    }, 300);
  });
}

export async function fetchPathEdges() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mappedEdges = graphData.edges.map((e, idx) => ({
        edgeId: `e${idx + 1}`,
        fromNode: e.from,
        toNode: e.to,
        distance: e.distance,
      }));
      resolve(mappedEdges);
    }, 300);
  });
}
