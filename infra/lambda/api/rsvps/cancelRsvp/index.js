const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;
const RSVPS_TABLE = process.env.RSVPS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const userId = claims.sub;
    const eventId = event.pathParameters?.id;

    if (!eventId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing event ID' }) };
    }

    // 1. Get the current RSVP status
    const getRes = await docClient.send(new GetCommand({
      TableName: RSVPS_TABLE,
      Key: { eventId, userId }
    }));

    if (!getRes.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: 'RSVP not found' }) };
    }

    const currentStatus = getRes.Item.status;

    if (currentStatus === 'confirmed') {
      // 2. Transactionally delete RSVP and increment seats
      await docClient.send(new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: RSVPS_TABLE,
              Key: { eventId, userId },
              ConditionExpression: '#s = :confirmed',
              ExpressionAttributeNames: { '#s': 'status' },
              ExpressionAttributeValues: { ':confirmed': 'confirmed' }
            }
          },
          {
            Update: {
              TableName: EVENTS_TABLE,
              Key: { id: eventId },
              UpdateExpression: 'SET seatsAvailable = seatsAvailable + :inc',
              ExpressionAttributeValues: { ':inc': 1 }
            }
          }
        ]
      }));
    } else {
      // 3. Just delete the waitlisted RSVP
      await docClient.send(new DeleteCommand({
        TableName: RSVPS_TABLE,
        Key: { eventId, userId }
      }));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'RSVP cancelled successfully' })
    };

  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    if (error.name === 'TransactionCanceledException') {
        return {
            statusCode: 409,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Conflict cancelling RSVP' })
        };
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
