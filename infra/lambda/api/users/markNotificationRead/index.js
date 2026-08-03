const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const userId = claims.sub;
    
    // The notification ID actually comes in as the sort key. It contains a # character which needs to be URL encoded if passed in URL.
    // However, it's safer to pass it in the body since it contains timestamps and #.
    const body = JSON.parse(event.body || '{}');
    const { notificationId } = body; 

    if (!notificationId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing notificationId in body' }) };
    }

    await docClient.send(new UpdateCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: {
        PK: userId,
        SK: notificationId
      },
      UpdateExpression: 'set #read = :read',
      ExpressionAttributeNames: {
        '#read': 'read'
      },
      ExpressionAttributeValues: {
        ':read': true
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error updating notification:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
