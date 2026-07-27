import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const geojsonPath = path.join(__dirname, '../data/campus-paths.geojson');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

const nodes = {}; // { nodeId: { lat, lng } }
const edges = []; // { from, to, distance }

// Extract points as nodes
geojson.features
  .filter(f => f.geometry.type === 'Point')
  .forEach(f => {
    nodes[f.properties.id] = {
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      type: f.properties.type,
      label: f.properties.label
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
    const { from, to } = f.properties;
    edges.push({ from, to, distance: haversine(nodes[from], nodes[to]) });
  });

const outPath = path.join(__dirname, '../data/graph.json');
fs.writeFileSync(outPath, JSON.stringify({ nodes, edges }, null, 2));
console.log('Graph generated successfully at', outPath);
