const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const MEMBERSHIPS_TABLE = process.env.MEMBERSHIPS_TABLE_NAME;
const CLUBS_TABLE = process.env.CLUBS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized: Log in required to join clubs' })
      };
    }
    const userId = claims.sub || claims.username;
    const clubId = event.pathParameters?.id;

    if (!clubId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing club ID' })
      };
    }

    const newMembership = {
      PK: userId,
      SK: clubId,
      role: 'member',
      status: 'active',
      notifyPreference: 'instant',
      joinedAt: Date.now()
    };

    await docClient.send(new PutCommand({
      TableName: MEMBERSHIPS_TABLE,
      Item: newMembership
    }));

    // Update club member count if CLUBS_TABLE is available
    if (CLUBS_TABLE) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: CLUBS_TABLE,
          Key: { id: clubId },
          UpdateExpression: 'SET memberCount = if_not_exists(memberCount, :zero) + :inc',
          ExpressionAttributeValues: {
            ':zero': 0,
            ':inc': 1
          }
        }));
      } catch (countErr) {
        console.warn('Could not increment club memberCount:', countErr.message);
      }
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ...newMembership, success: true })
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
