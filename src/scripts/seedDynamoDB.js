import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.ENV || 'dev';
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
const client = new DynamoDBClient({ region });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const getTableName = (baseName) => {
  return process.env[`${baseName.toUpperCase()}_TABLE_NAME`] || `EventTrail-${baseName}-${env}`;
};

async function seedTable(tableName, items, idKey = 'id') {
  console.log(`\n--- Seeding ${tableName} (${items.length} items) ---`);
  let successCount = 0;
  const chunkSize = 20;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (item) => {
        try {
          await ddbDocClient.send(
            new PutCommand({
              TableName: tableName,
              Item: item,
            })
          );
          successCount++;
        } catch (err) {
          console.error(`  [ERROR] Failed to insert into ${tableName}:`, err.message || err);
        }
      })
    );
  }
  console.log(`Completed ${tableName}: ${successCount}/${items.length} successful.`);
}

async function runSeed() {
  console.log(`Starting bulk DynamoDB seed for environment: '${env}' in region: '${region}'...`);
  const dataDir = path.resolve(__dirname, '../data');

  // 1. Seed Events
  if (fs.existsSync(path.join(dataDir, 'events.json'))) {
    const events = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf-8'));
    await seedTable(getTableName('Events'), events, 'id');
  }

  // 2. Seed Clubs
  if (fs.existsSync(path.join(dataDir, 'clubs.json'))) {
    const clubs = JSON.parse(fs.readFileSync(path.join(dataDir, 'clubs.json'), 'utf-8'));
    await seedTable(getTableName('Clubs'), clubs, 'id');
  }

  // 3. Seed Venues
  if (fs.existsSync(path.join(dataDir, 'venues.json'))) {
    const venues = JSON.parse(fs.readFileSync(path.join(dataDir, 'venues.json'), 'utf-8'));
    await seedTable(getTableName('Venues'), venues, 'id');
  }

  // 4. Seed Speakers
  if (fs.existsSync(path.join(dataDir, 'speakers.json'))) {
    const speakers = JSON.parse(fs.readFileSync(path.join(dataDir, 'speakers.json'), 'utf-8'));
    await seedTable(getTableName('Speakers'), speakers, 'id');
  }

  // 5. Seed Users & 6. Derive RSVPs
  if (fs.existsSync(path.join(dataDir, 'users.json'))) {
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'));
    await seedTable(getTableName('Users'), users, 'id');

    const rsvpItems = [];
    let seatCounter = 1;
    for (const user of users) {
      if (Array.isArray(user.rsvps)) {
        for (const eventId of user.rsvps) {
          rsvpItems.push({
            eventId,
            userId: user.id,
            status: 'confirmed',
            seatNumber: seatCounter++,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    if (rsvpItems.length > 0) {
      await seedTable(getTableName('RSVPs'), rsvpItems, 'eventId');
    }
  }

  // 7a & 7b. Seed PathNodes and PathEdges
  if (fs.existsSync(path.join(dataDir, 'graph.json'))) {
    const graph = JSON.parse(fs.readFileSync(path.join(dataDir, 'graph.json'), 'utf-8'));
    
    // PathNodes
    const nodeItems = Object.entries(graph.nodes || {}).map(([nodeId, data]) => ({
      nodeId,
      lat: data.lat,
      lng: data.lng,
      type: data.type || 'junction',
      label: data.label || '',
    }));
    await seedTable(getTableName('PathNodes'), nodeItems, 'nodeId');

    // PathEdges
    let edgeCounter = 1;
    const edgeItems = (graph.edges || []).map((edge) => ({
      edgeId: `e${edgeCounter++}`,
      fromNode: edge.from,
      toNode: edge.to,
      distance: edge.distance,
    }));
    await seedTable(getTableName('PathEdges'), edgeItems, 'edgeId');
  }

  console.log('\n========================================');
  console.log('All 7 DynamoDB tables seeding attempt complete!');
  console.log('========================================');
}

runSeed().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
