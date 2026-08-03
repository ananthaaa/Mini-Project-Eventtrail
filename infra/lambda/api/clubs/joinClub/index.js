const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const MEMBERSHIPS_TABLE = process.env.MEMBERSHIPS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const userId = claims.sub;
    const clubId = event.pathParameters?.id;

    if (!clubId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing club ID' }) };
    }

    const newMembership = {
      PK: userId,
      SK: clubId,
      role: 'member',
      status: 'active', // Tier 1: all join policies are treated as open
      notifyPreference: 'instant',
      joinedAt: Date.now()
    };

    await docClient.send(new PutCommand({
      TableName: MEMBERSHIPS_TABLE,
      Item: newMembership
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(newMembership)
    };
  } catch (error) {
    console.error('Error joining club:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
