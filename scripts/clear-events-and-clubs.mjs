import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
const client = new DynamoDBClient({ region });
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function clearTable(tableName, keyFields) {
  console.log(`\nScanning ${tableName} for items to delete...`);
  try {
    const scanResult = await ddbDocClient.send(new ScanCommand({ TableName: tableName }));
    const items = scanResult.Items || [];
    console.log(`Found ${items.length} items in ${tableName}.`);

    if (items.length === 0) return;

    let deleted = 0;
    for (const item of items) {
      const key = {};
      for (const field of keyFields) {
        key[field] = item[field];
      }
      await ddbDocClient.send(new DeleteCommand({
        TableName: tableName,
        Key: key
      }));
      deleted++;
    }
    console.log(`Successfully deleted ${deleted} items from ${tableName}.`);
  } catch (err) {
    console.error(`Error clearing ${tableName}:`, err.message || err);
  }
}

async function main() {
  console.log('--- Clearing EventTrail Events, Clubs, and RSVPs ---');
  await clearTable('EventTrail-Events-dev', ['id']);
  await clearTable('EventTrail-Clubs-dev', ['id']);
  await clearTable('EventTrail-RSVPs-dev', ['eventId', 'userId']);
  await clearTable('EventTrail-Memberships-dev', ['PK', 'SK']);
  await clearTable('EventTrail-Notifications-dev', ['PK', 'SK']);
  console.log('\n--- Finished clearing all events and clubs! Ready for clean start. ---');
}

main().catch(console.error);
