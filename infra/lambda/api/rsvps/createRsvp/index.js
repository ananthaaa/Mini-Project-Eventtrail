const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, TransactWriteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

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

    const userId = claims.sub; // Cognito User ID
    const eventId = event.pathParameters?.id;

    if (!eventId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing event ID' }) };
    }

    const now = new Date().toISOString();

    // Try transactional seat decrement
    try {
      await docClient.send(new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: EVENTS_TABLE,
              Key: { id: eventId },
              UpdateExpression: 'SET seatsAvailable = seatsAvailable - :dec',
              ConditionExpression: 'seatsAvailable > :min',
              ExpressionAttributeValues: {
                ':dec': 1,
                ':min': 0,
              },
            }
          },
          {
            Put: {
              TableName: RSVPS_TABLE,
              Item: {
                eventId,
                userId,
                status: 'confirmed',
                createdAt: now,
              },
              ConditionExpression: 'attribute_not_exists(eventId) AND attribute_not_exists(userId)',
            }
          }
        ]
      }));

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'RSVP confirmed', status: 'confirmed' })
      };

    } catch (txError) {
      // Check if it's a condition check failure (meaning no seats available or already RSVP'd)
      if (txError.name === 'TransactionCanceledException') {
        const cancellationReasons = txError.CancellationReasons || [];
        // Reasons correspond to the items in TransactItems array.
        // Index 0 is the Event table Update (seats > 0).
        // Index 1 is the RSVPs table Put (not already RSVP'd).
        
        if (cancellationReasons[1] && cancellationReasons[1].Code === 'ConditionalCheckFailed') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'You have already RSVPed or Waitlisted for this event' })
            };
        }

        if (cancellationReasons[0] && cancellationReasons[0].Code === 'ConditionalCheckFailed') {
            // Seats are full -> Waitlist path
            const waitlistPosition = Date.now();
            await docClient.send(new PutCommand({
              TableName: RSVPS_TABLE,
              Item: {
                eventId,
                userId,
                status: 'waitlisted',
                waitlistPosition,
                createdAt: now,
              },
              ConditionExpression: 'attribute_not_exists(eventId) AND attribute_not_exists(userId)',
            }));
            
            return {
              statusCode: 201,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ message: 'Event full. Added to waitlist.', status: 'waitlisted', waitlistPosition })
            };
        }
      }
      throw txError; // Re-throw other unexpected transaction errors
    }

  } catch (error) {
    console.error('Error creating RSVP:', error);
    if (error.name === 'ConditionalCheckFailedException') {
         return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'You have already RSVPed or Waitlisted for this event' })
        };
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
