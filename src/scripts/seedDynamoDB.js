import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure the AWS SDK (Assumes standard environment variables or shared credentials file are set)
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function seedGraph() {
  const graphPath = path.join(__dirname, '../data/graph.json');
  if (!fs.existsSync(graphPath)) {
    console.error('graph.json not found! Please run convertGeoJSON.js first.');
    process.exit(1);
  }

  const { nodes, edges } = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  console.log('Seeding PathNodes...');
  for (const [nodeId, data] of Object.entries(nodes)) {
    try {
      await ddbDocClient.send(new PutCommand({
        TableName: 'PathNodes',
        Item: {
          nodeId,
          lat: data.lat,
          lng: data.lng,
          type: data.type || 'junction',
          label: data.label || ''
        }
      }));
      console.log(`Inserted node: ${nodeId}`);
    } catch (err) {
      console.error(`Error inserting node ${nodeId}:`, err);
    }
  }

  console.log('Seeding PathEdges...');
  let edgeIdCounter = 1;
  for (const edge of edges) {
    const edgeId = `e${edgeIdCounter++}`;
    try {
      await ddbDocClient.send(new PutCommand({
        TableName: 'PathEdges',
        Item: {
          edgeId,
          fromNode: edge.from,
          toNode: edge.to,
          distance: edge.distance
        }
      }));
      console.log(`Inserted edge: ${edgeId}`);
    } catch (err) {
      console.error(`Error inserting edge ${edgeId}:`, err);
    }
  }
  
  console.log('Seeding complete.');
}

// In a real environment, you'd run this script after ensuring tables exist.
seedGraph().catch(console.error);
