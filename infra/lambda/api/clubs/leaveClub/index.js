const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

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
        body: JSON.stringify({ error: 'Unauthorized' })
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

    await docClient.send(new DeleteCommand({
      TableName: MEMBERSHIPS_TABLE,
      Key: {
        PK: userId,
        SK: clubId
      }
    }));

    // Decrement club member count if CLUBS_TABLE is available
    if (CLUBS_TABLE) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: CLUBS_TABLE,
          Key: { id: clubId },
          UpdateExpression: 'SET memberCount = if_not_exists(memberCount, :one) - :dec',
          ConditionExpression: 'memberCount > :zero',
          ExpressionAttributeValues: {
            ':one': 1,
            ':dec': 1,
            ':zero': 0
          }
        }));
      } catch (countErr) {
        console.warn('Could not decrement club memberCount:', countErr.message);
      }
    }

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
