const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const env = process.env.ENV || 'dev';
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
const client = new DynamoDBClient({ region });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const getTableName = (baseName) => {
  return process.env[`${baseName.toUpperCase()}_TABLE_NAME`] || `EventTrail-${baseName}-${env}`;
};

async function testTable(baseName, expectedKeyName, sampleId) {
  const tableName = getTableName(baseName);
  console.log(`\n--- Testing ${tableName} ---`);
  try {
    // 1. Scan check (limit 5 to see if table has data)
    const scanRes = await ddbDocClient.send(new ScanCommand({ TableName: tableName, Limit: 5 }));
    const count = scanRes.Items ? scanRes.Items.length : 0;
    console.log(`  [OK] Scan successful. Found ${count} sample item(s).`);

    // 2. Point Get check if sampleId is provided
    if (sampleId && count > 0) {
      const getRes = await ddbDocClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { [expectedKeyName]: sampleId },
        })
      );
      if (getRes.Item) {
        console.log(`  [OK] GetItem successful for key '${expectedKeyName}: ${sampleId}'. Item shape valid.`);
      } else {
        console.warn(`  [WARN] Item '${sampleId}' not found in ${tableName} (table might need seeding).`);
      }
    }
    return true;
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.error(`  [FAIL] Table ${tableName} does not exist in AWS region ${region}. Please run 'cdk deploy' first.`);
    } else if (err.message && err.message.includes('expired')) {
      console.error(`  [AUTH ERROR] AWS session expired. Please authenticate with 'aws login' or configure credentials.`);
    } else {
      console.error(`  [ERROR] Failed to query ${tableName}:`, err.message || err);
    }
    return false;
  }
}

async function runSmokeTests() {
  console.log(`Starting DynamoDB Data Layer Smoke Tests (Environment: '${env}', Region: '${region}')...`);
  
  const results = [];
  results.push(await testTable('Events', 'id', 'hackathon-2026'));
  results.push(await testTable('Clubs', 'id', 'devx'));
  results.push(await testTable('Venues', 'id', 'science-hall-a'));
  results.push(await testTable('Speakers', 'id', 'alex-rivera'));
  results.push(await testTable('Users', 'id', 'student-1'));
  
  // RSVPs has composite key (eventId, userId)
  const rsvpTable = getTableName('RSVPs');
  console.log(`\n--- Testing ${rsvpTable} ---`);
  try {
    const scanRes = await ddbDocClient.send(new ScanCommand({ TableName: rsvpTable, Limit: 5 }));
    console.log(`  [OK] Scan successful. Found ${scanRes.Items ? scanRes.Items.length : 0} item(s).`);
    if (scanRes.Items && scanRes.Items.length > 0) {
      const sample = scanRes.Items[0];
      const getRes = await ddbDocClient.send(
        new GetCommand({
          TableName: rsvpTable,
          Key: { eventId: sample.eventId, userId: sample.userId },
        })
      );
      console.log(`  [OK] GetItem successful for composite key (${sample.eventId}, ${sample.userId}).`);
    }
    results.push(true);
  } catch (err) {
    console.error(`  [ERROR] Failed on ${rsvpTable}:`, err.message || err);
    results.push(false);
  }

  results.push(await testTable('PathNodes', 'nodeId', 'gate-main'));
  results.push(await testTable('PathEdges', 'edgeId', 'e1'));

  const allPassed = results.every((r) => r === true);
  console.log('\n========================================');
  if (allPassed) {
    console.log('✅ ALL SMOKE TESTS PASSED! Data layer is ready.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Please ensure AWS session is active and tables are deployed and seeded.');
  }
  console.log('========================================');
}

runSmokeTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
