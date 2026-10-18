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
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const userId = claims.sub || claims.username;
    const eventId = event.pathParameters?.id;

    if (!eventId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing event ID' })
      };
    }

    // 1. Get the current RSVP status
    const getRes = await docClient.send(new GetCommand({
      TableName: RSVPS_TABLE,
      Key: { eventId, userId }
    }));

    if (!getRes.Item) {
      // Repeatable cancellation: already cancelled or not found
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'RSVP already cancelled or not found', cancelled: true })
      };
    }

    const currentStatus = getRes.Item.status;

    if (currentStatus === 'confirmed') {
      // 2. Transactionally delete confirmed RSVP and increment available seats
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
      // 3. Conditional delete for waitlisted RSVP to guard against race with promotion
      try {
        await docClient.send(new DeleteCommand({
          TableName: RSVPS_TABLE,
          Key: { eventId, userId },
          ConditionExpression: '#s = :waitlisted',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':waitlisted': 'waitlisted' }
        }));
      } catch (delError) {
        if (delError.name === 'ConditionalCheckFailedException') {
          // User was promoted concurrently from waitlist to confirmed!
          // Execute confirmed cancellation transaction so seat is cleanly restored
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
          throw delError;
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'RSVP cancelled successfully', cancelled: true })
    };

  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    if (error.name === 'TransactionCanceledException') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Conflict during RSVP cancellation. Please retry.' })
      };
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
