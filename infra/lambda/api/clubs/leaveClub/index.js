const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

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

    await docClient.send(new DeleteCommand({
      TableName: MEMBERSHIPS_TABLE,
      Key: {
        PK: userId,
        SK: clubId
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: 'Left club successfully' })
    };
  } catch (error) {
    console.error('Error leaving club:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
