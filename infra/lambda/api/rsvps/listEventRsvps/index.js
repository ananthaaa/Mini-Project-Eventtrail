const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RSVPS_TABLE = process.env.RSVPS_TABLE_NAME;
const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

function getAdminAuth(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims) {
    return { authorized: false, statusCode: 401, error: 'Unauthorized: Missing or invalid token' };
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
    return { authorized: false, statusCode: 403, error: 'Forbidden: Administrator privileges required to access attendee rosters' };
  }

  if (!isPlatformAdmin && !clubId) {
    return { authorized: false, statusCode: 403, error: 'Forbidden: Club administrator has no assigned club affiliation' };
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

    // Check event exists and caller owns the organizing club (unless platform admin)
    if (EVENTS_TABLE) {
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

      if (!auth.isPlatformAdmin && eventRes.Item.organizerId !== auth.clubId) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Forbidden: You do not have permission to view attendee details for another club\'s event' })
        };
      }
    }

    const command = new QueryCommand({
      TableName: RSVPS_TABLE,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': eventId
      }
    });

    const data = await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data.Items || [])
    };
  } catch (error) {
    console.error('Error fetching event RSVPs:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
