const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    
    // We get the user ID from the path, but verify it matches the token
    const pathUserId = event.pathParameters?.id;
    const tokenUserId = claims.sub;
    
    if (pathUserId !== tokenUserId) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Cannot access other users notifications' }) };
    }

    const { Items } = await docClient.send(new QueryCommand({
      TableName: NOTIFICATIONS_TABLE,
      KeyConditionExpression: 'PK = :userId',
      ExpressionAttributeValues: {
        ':userId': tokenUserId
      },
      ScanIndexForward: false // descending order (newest first)
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(Items || [])
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
