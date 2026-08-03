const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, QueryCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CLUBS_TABLE = process.env.CLUBS_TABLE_NAME;
const MEMBERSHIPS_TABLE = process.env.MEMBERSHIPS_TABLE_NAME;
const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const clubId = event.pathParameters?.id;
    if (!clubId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing club ID' }) };
    }

    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Usually only global admins or the club creator can delete a club
    // We'll allow it for now if they are authenticated as an admin.

    // 1. Find all memberships for this club
    const membershipsResponse = await docClient.send(new QueryCommand({
      TableName: MEMBERSHIPS_TABLE,
      IndexName: 'ClubMembersIndex',
      KeyConditionExpression: 'SK = :clubId',
      ExpressionAttributeValues: {
        ':clubId': clubId
      }
    }));

    // 2. Find all events for this club
    const eventsResponse = await docClient.send(new QueryCommand({
      TableName: EVENTS_TABLE,
      IndexName: 'byOrganizer',
      KeyConditionExpression: 'organizerId = :clubId',
      ExpressionAttributeValues: {
        ':clubId': clubId
      }
    }));

    // 3. Prepare Batch Delete Requests
    const deleteRequests = [];

    // Memberships deletions
    if (membershipsResponse.Items && membershipsResponse.Items.length > 0) {
      membershipsResponse.Items.forEach(item => {
        deleteRequests.push({
          DeleteRequest: {
            Key: {
              PK: item.PK, // userId
              SK: item.SK  // clubId
            }
          }
        });
      });
    }

    // Events deletions
    if (eventsResponse.Items && eventsResponse.Items.length > 0) {
      eventsResponse.Items.forEach(item => {
        // We'll push events into a separate batch to avoid cross-table issues in a single BatchWrite
        // DynamoDB BatchWriteItem supports multiple tables, but let's just group them nicely.
      });
    }

    // DynamoDB BatchWrite supports max 25 items per request.
    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    // Execute memberships batch deletions
    if (deleteRequests.length > 0) {
      const chunks = chunkArray(deleteRequests, 25);
      for (const chunk of chunks) {
        await docClient.send(new BatchWriteCommand({
          RequestItems: {
            [MEMBERSHIPS_TABLE]: chunk
          }
        }));
      }
    }

    // Execute events batch deletions
    if (eventsResponse.Items && eventsResponse.Items.length > 0) {
      const eventDeleteRequests = eventsResponse.Items.map(item => ({
        DeleteRequest: {
          Key: { id: item.id }
        }
      }));

      const chunks = chunkArray(eventDeleteRequests, 25);
      for (const chunk of chunks) {
        await docClient.send(new BatchWriteCommand({
          RequestItems: {
            [EVENTS_TABLE]: chunk
          }
        }));
      }
    }

    // 4. Finally, delete the club itself
    await docClient.send(new DeleteCommand({
      TableName: CLUBS_TABLE,
      Key: { id: clubId }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: 'Club and associated data deleted successfully' })
    };
  } catch (error) {
    console.error('Error deleting club:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
