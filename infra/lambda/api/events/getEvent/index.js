const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

function getCallerAuth(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims) return { isAuthenticated: false, role: 'anonymous' };

  const rawGroups = claims['cognito:groups'] || [];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : (typeof rawGroups === 'string' ? rawGroups.split(',').map(s => s.trim()) : []);

  const role = claims['custom:role'];
  const clubId = claims['custom:clubId'];
  const isPlatformAdmin = groups.includes('admin') || groups.includes('Admin') || role === 'admin';
  const isClubOrganizer = (groups.includes('ClubAdmin') || role === 'club_admin') && Boolean(clubId);

  return {
    isAuthenticated: true,
    isPlatformAdmin,
    isClubOrganizer,
    clubId: isPlatformAdmin ? null : clubId,
    role: isPlatformAdmin ? 'admin' : (isClubOrganizer ? 'club_admin' : 'student'),
    userId: claims.sub || claims.username,
  };
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing event ID' }),
      };
    }

    const command = new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId },
    });

    const data = await docClient.send(command);
    if (!data.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const item = data.Item;
    const auth = getCallerAuth(event);

    // If event is not published, only platform admins and the owning club can view it
    if (item.status !== 'published') {
      const isOwner = auth.isClubOrganizer && item.organizerId === auth.clubId;
      if (!auth.isPlatformAdmin && !isOwner) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Event not found' }),
        };
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch event' }),
    };
  }
};
