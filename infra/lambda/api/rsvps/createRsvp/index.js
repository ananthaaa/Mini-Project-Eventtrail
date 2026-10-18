const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, TransactWriteCommand, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

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
        body: JSON.stringify({ error: 'Unauthorized: Authentication required to RSVP' })
      };
    }

    const userId = claims.sub || claims.username;
    const name = claims.name || claims.email || 'Campus Student';
    const email = claims.email || '';
    const studentId = claims['custom:studentId'] || `STU-${userId.substring(0, 6).toUpperCase()}`;

    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing event ID' })
      };
    }

    // 1. Check existing booking first (Idempotent / repeatable requests)
    const existingRsvp = await docClient.send(new GetCommand({
      TableName: RSVPS_TABLE,
      Key: { eventId, userId }
    }));

    if (existingRsvp.Item) {
      const item = existingRsvp.Item;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'Booking already recorded',
          status: item.status,
          ticketId: item.ticketId || null,
          checkInCode: item.checkInCode || null,
          waitlistPosition: item.waitlistPosition || null,
          createdAt: item.createdAt,
          isExisting: true
        })
      };
    }

    // 2. Validate Event Existence and Lifecycle
    const eventRes = await docClient.send(new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId }
    }));

    if (!eventRes.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Event not found' })
      };
    }

    const eventData = eventRes.Item;

    if (eventData.status === 'cancelled') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Cannot register: This event has been cancelled.' })
      };
    }

    if (eventData.status === 'completed') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Cannot register: This event has concluded.' })
      };
    }

    if (eventData.status === 'draft' || eventData.status === 'registration-closed') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Registration is currently closed for this event.' })
      };
    }

    // Check registration deadline if present
    const nowIso = new Date().toISOString();
    if (eventData.registrationDeadline && nowIso > eventData.registrationDeadline) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Registration deadline for this event has passed.' })
      };
    }

    // 3. Fair Waitlist Check: if queued users already exist, prevent jumping the queue!
    const queryRsvps = await docClient.send(new QueryCommand({
      TableName: RSVPS_TABLE,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: { ':eventId': eventId }
    }));

    const allEventRsvps = queryRsvps.Items || [];
    const waitlistedList = allEventRsvps
      .filter(r => r.status === 'waitlisted')
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

    const waitlistPosition = Date.now();

    // If waitlist already has people waiting, new registrants must join the back of the queue
    if (waitlistedList.length > 0 || (eventData.seatsAvailable || 0) <= 0) {
      await docClient.send(new PutCommand({
        TableName: RSVPS_TABLE,
        Item: {
          eventId,
          userId,
          name,
          email,
          studentId,
          status: 'waitlisted',
          waitlistPosition,
          ticketId: null,
          checkInCode: null,
          createdAt: nowIso,
        },
        ConditionExpression: 'attribute_not_exists(eventId) AND attribute_not_exists(userId)',
      }));

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'Event is full. You have been added to the waitlist.',
          status: 'waitlisted',
          waitlistPosition,
          queueNumber: waitlistedList.length + 1
        })
      };
    }

    // 4. Confirmed Seat Path: Attempt transactional decrement
    const ticketId = `TKT-${eventId.substring(0, 8).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const checkInCode = `CHK-${crypto.randomBytes(6).toString('hex')}`;

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
                name,
                email,
                studentId,
                status: 'confirmed',
                ticketId,
                checkInCode,
                checkedIn: false,
                createdAt: nowIso,
              },
              ConditionExpression: 'attribute_not_exists(eventId) AND attribute_not_exists(userId)',
            }
          }
        ]
      }));

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'RSVP confirmed',
          status: 'confirmed',
          ticketId,
          checkInCode
        })
      };

    } catch (txError) {
      if (txError.name === 'TransactionCanceledException') {
        const cancellationReasons = txError.CancellationReasons || [];

        // Reason 1: User already RSVP'd
        if (cancellationReasons[1] && cancellationReasons[1].Code === 'ConditionalCheckFailed') {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'You have already registered or waitlisted for this event.' })
          };
        }

        // Reason 0: Last seat was taken by concurrent request -> safely join waitlist
        if (cancellationReasons[0] && cancellationReasons[0].Code === 'ConditionalCheckFailed') {
          await docClient.send(new PutCommand({
            TableName: RSVPS_TABLE,
            Item: {
              eventId,
              userId,
              name,
              email,
              studentId,
              status: 'waitlisted',
              waitlistPosition,
              ticketId: null,
              checkInCode: null,
              createdAt: nowIso,
            },
            ConditionExpression: 'attribute_not_exists(eventId) AND attribute_not_exists(userId)',
          }));

          return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              message: 'Seats just filled. You have been placed on the waitlist.',
              status: 'waitlisted',
              waitlistPosition,
              queueNumber: waitlistedList.length + 1
            })
          };
        }
      }
      throw txError;
    }

  } catch (error) {
    console.error('Error creating RSVP:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'You have already registered for this event.' })
      };
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
