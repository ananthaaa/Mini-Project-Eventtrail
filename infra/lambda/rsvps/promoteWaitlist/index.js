const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, TransactWriteCommand, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;
const RSVPS_TABLE = process.env.RSVPS_TABLE_NAME;
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE_NAME;

exports.handler = async (event) => {
  console.log(`Processing ${event.Records?.length || 0} DynamoDB stream records`);

  for (const record of event.Records || []) {
    if (record.eventName !== 'REMOVE') continue;

    const oldImage = record.dynamodb?.OldImage;
    if (!oldImage) continue;

    const status = oldImage.status?.S;
    const eventId = oldImage.eventId?.S;

    // Only promote if a confirmed RSVP was removed/cancelled
    if (status !== 'confirmed') continue;
    if (!eventId) continue;

    try {
      // 1. Query all waitlisted users for this event
      const queryRes = await docClient.send(new QueryCommand({
        TableName: RSVPS_TABLE,
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': eventId
        }
      }));

      const waitlisted = (queryRes.Items || [])
        .filter(item => item.status === 'waitlisted')
        .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

      if (waitlisted.length === 0) {
        console.log(`No waitlisted users waiting for event ${eventId}. Available seat remains in pool.`);
        continue;
      }

      // Fetch event title for notification
      let eventTitle = 'Campus Event';
      try {
        const evRes = await docClient.send(new GetCommand({
          TableName: EVENTS_TABLE,
          Key: { id: eventId }
        }));
        if (evRes.Item?.title) eventTitle = evRes.Item.title;
      } catch (_) {}

      // 2. Loop through waitlisted candidates in order in case a candidate was already deleted
      let promoted = false;
      for (const candidate of waitlisted) {
        const ticketId = `TKT-${eventId.substring(0, 8).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const checkInCode = `CHK-${crypto.randomBytes(6).toString('hex')}`;
        const nowIso = new Date().toISOString();

        try {
          await docClient.send(new TransactWriteCommand({
            TransactItems: [
              {
                Update: {
                  TableName: EVENTS_TABLE,
                  Key: { id: eventId },
                  UpdateExpression: 'SET seatsAvailable = seatsAvailable - :dec',
                  ConditionExpression: 'attribute_exists(id) AND seatsAvailable > :min',
                  ExpressionAttributeValues: {
                    ':dec': 1,
                    ':min': 0
                  }
                }
              },
              {
                Update: {
                  TableName: RSVPS_TABLE,
                  Key: { eventId, userId: candidate.userId },
                  UpdateExpression: 'SET #s = :confirmed, ticketId = :ticketId, checkInCode = :checkInCode, promotedAt = :now REMOVE waitlistPosition',
                  ConditionExpression: '#s = :waitlisted',
                  ExpressionAttributeNames: { '#s': 'status' },
                  ExpressionAttributeValues: {
                    ':confirmed': 'confirmed',
                    ':waitlisted': 'waitlisted',
                    ':ticketId': ticketId,
                    ':checkInCode': checkInCode,
                    ':now': nowIso
                  }
                }
              }
            ]
          }));

          console.log(`Successfully promoted user ${candidate.userId} to confirmed for event ${eventId} (ticket: ${ticketId})`);

          // 3. Deliver persistent notification
          if (NOTIFICATIONS_TABLE) {
            try {
              await docClient.send(new PutCommand({
                TableName: NOTIFICATIONS_TABLE,
                Item: {
                  PK: candidate.userId,
                  SK: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
                  type: 'waitlist_promoted',
                  title: 'RSVP Confirmed from Waitlist! 🎉',
                  message: `A spot opened up for "${eventTitle}". Your ticket has been confirmed!`,
                  payload: {
                    eventId,
                    ticketId,
                    destination: `/student/events/${eventId}`
                  },
                  read: false,
                  createdAt: nowIso
                }
              }));
              console.log(`Notification sent to ${candidate.userId}`);
            } catch (notifErr) {
              console.error(`Failed to send notification to ${candidate.userId}:`, notifErr);
            }
          }

          promoted = true;
          break; // Promotion successful, stop trying candidates for this freed seat
        } catch (candidateErr) {
          console.warn(`Could not promote candidate ${candidate.userId} (may have cancelled):`, candidateErr.message);
          // Continue to next candidate
        }
      }

      if (!promoted) {
        console.warn(`Could not promote any waitlisted candidates for event ${eventId}`);
      }

    } catch (error) {
      console.error(`Error in waitlist promotion pipeline for event ${eventId}:`, error);
    }
  }
};
