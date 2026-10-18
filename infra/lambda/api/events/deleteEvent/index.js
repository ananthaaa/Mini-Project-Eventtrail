const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

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
    return { authorized: false, statusCode: 403, error: 'Forbidden: Administrator privileges required' };
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

    const existingRes = await docClient.send(new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId }
    }));

    if (!existingRes.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Event not found' })
      };
    }

    if (!auth.isPlatformAdmin && existingRes.Item.organizerId !== auth.clubId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Forbidden: Cannot delete events belonging to another club' })
      };
    }

    const isHardDelete = event.queryStringParameters?.hard === 'true';

    if (isHardDelete) {
      await docClient.send(new DeleteCommand({
        TableName: EVENTS_TABLE,
        Key: { id: eventId }
      }));
    } else {
      // Soft-cancel by default to preserve attendee history and prevent broken links
      await docClient.send(new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: { id: eventId },
        UpdateExpression: 'SET #status = :cancelled, #cancelledAt = :now, updatedAt = :now',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#cancelledAt': 'cancelledAt'
        },
        ExpressionAttributeValues: {
          ':cancelled': 'cancelled',
          ':now': new Date().toISOString()
        }
      }));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: isHardDelete ? 'Event permanently deleted' : 'Event cancelled successfully with history retained',
        status: isHardDelete ? 'deleted' : 'cancelled'
      })
    };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
