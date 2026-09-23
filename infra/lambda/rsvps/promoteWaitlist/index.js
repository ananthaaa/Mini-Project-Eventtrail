const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;
const RSVPS_TABLE = process.env.RSVPS_TABLE_NAME;

exports.handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName !== 'REMOVE') continue;
    
    // Get the old image
    const oldImage = record.dynamodb.OldImage;
    if (!oldImage) continue;

    const status = oldImage.status?.S;
    const eventId = oldImage.eventId?.S;

    // Only promote if a confirmed RSVP was cancelled
    if (status !== 'confirmed') continue;
    if (!eventId) continue;

    try {
      // Find the next waitlisted user
      const queryRes = await docClient.send(new QueryCommand({
        TableName: RSVPS_TABLE,
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': eventId
        }
      }));

      const waitlisted = (queryRes.Items || [])
        .filter(item => item.status === 'waitlisted')
        .sort((a, b) => a.waitlistPosition - b.waitlistPosition);

      if (waitlisted.length === 0) {
        console.log(`No waitlisted users for event ${eventId}`);
        continue;
      }

      const nextUser = waitlisted[0];

      // Promote the next user
      // We use a transaction to ensure we only promote them if seats > 0 
      // (which should be true because the cancellation just incremented seats)
      // and we ensure they are still waitlisted.
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
                ':min': 0
              }
            }
          },
          {
            Update: {
              TableName: RSVPS_TABLE,
              Key: { eventId, userId: nextUser.userId },
              UpdateExpression: 'SET #s = :confirmed REMOVE waitlistPosition',
              ConditionExpression: '#s = :waitlisted',
              ExpressionAttributeNames: { '#s': 'status' },
              ExpressionAttributeValues: { 
                ':confirmed': 'confirmed',
                ':waitlisted': 'waitlisted'
              }
            }
          }
        ]
      }));

      console.log(`Successfully promoted user ${nextUser.userId} to confirmed for event ${eventId}`);

    } catch (error) {
      console.error(`Error promoting waitlist for event ${eventId}:`, error);
    }
  }
};
