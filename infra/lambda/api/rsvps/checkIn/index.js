const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RSVPS_TABLE = process.env.RSVPS_TABLE_NAME;
const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

function getAdminAuth(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims) {
    return { authorized: false, statusCode: 401, error: 'Unauthorized' };
  }

  const rawGroups = claims['cognito:groups'] || [];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : (typeof rawGroups === 'string' ? rawGroups.split(',').map(s => s.trim()) : []);

  const role = claims['custom:role'];
  const clubId = claims['custom:clubId'];

  const isPlatformAdmin = groups.includes('platform-admin') ||
    groups.includes('superadmin') ||
    role === 'platform-admin' ||
    clubId === 'platform-admin';

  const isAdminGroup = groups.includes('admin') || role === 'admin';

  if (!isPlatformAdmin && !isAdminGroup) {
    return { authorized: false, statusCode: 403, error: 'Forbidden: Administrator privileges required for check-in' };
  }

  return {
    authorized: true,
    userId: claims.sub || claims.username,
    isPlatformAdmin,
    clubId: isPlatformAdmin ? (clubId || 'platform-admin') : clubId,
    claims,
  };
}

exports.handler = async (event) => {
  try {
    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing event ID' })
      };
    }

    const auth = getAdminAuth(event);
    if (!auth.authorized) {
      return {
        statusCode: auth.statusCode,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: auth.error })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { checkInCode, ticketId } = body;

    if (!checkInCode && !ticketId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing checkInCode or ticketId in request' })
      };
    }

    // Query RSVPs for this event
    const queryRes = await docClient.send(new QueryCommand({
      TableName: RSVPS_TABLE,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: { ':eventId': eventId }
    }));

    const items = queryRes.Items || [];
    const attendee = items.find(i => 
      (checkInCode && i.checkInCode === checkInCode) || 
      (ticketId && i.ticketId === ticketId)
    );

    if (!attendee) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid ticket: No confirmed RSVP found with this code.' })
      };
    }

    if (attendee.status !== 'confirmed') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Cannot check in: Ticket status is "${attendee.status}", not confirmed.` })
      };
    }

    // Safe repeated scan
    if (attendee.checkedIn) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          status: 'already_checked_in',
          message: 'Attendee has already been checked in.',
          attendee: {
            name: attendee.name,
            studentId: attendee.studentId,
            ticketId: attendee.ticketId,
            checkedInAt: attendee.checkedInAt
          }
        })
      };
    }

    const nowIso = new Date().toISOString();
    await docClient.send(new UpdateCommand({
      TableName: RSVPS_TABLE,
      Key: { eventId, userId: attendee.userId },
      UpdateExpression: 'SET checkedIn = :val, checkedInAt = :now, checkedInBy = :admin',
      ExpressionAttributeValues: {
        ':val': true,
        ':now': nowIso,
        ':admin': auth.userId
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        status: 'checked_in',
        message: 'Attendee successfully checked in!',
        attendee: {
          name: attendee.name,
          studentId: attendee.studentId,
          ticketId: attendee.ticketId,
          checkedInAt: nowIso
        }
      })
    };

  } catch (error) {
    console.error('Error during attendee check-in:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
