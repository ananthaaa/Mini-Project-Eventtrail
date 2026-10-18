const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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
    const auth = getCallerAuth(event);
    const queryParams = event.queryStringParameters || {};

    let command;

    if (queryParams.faculty) {
      command = new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'byFaculty',
        KeyConditionExpression: 'faculty = :faculty',
        ExpressionAttributeValues: {
          ':faculty': queryParams.faculty,
        },
      });
    } else if (queryParams.category) {
      command = new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'byCategory',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': queryParams.category,
        },
      });
    } else if (queryParams.organizerId) {
      command = new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'byOrganizer',
        KeyConditionExpression: 'organizerId = :orgId',
        ExpressionAttributeValues: {
          ':orgId': queryParams.organizerId,
        },
      });
    } else {
      command = new ScanCommand({
        TableName: EVENTS_TABLE,
      });
    }

    const data = await docClient.send(command);
    let items = data.Items || [];

    // Apply strict visibility rules based on caller's role
    if (auth.isPlatformAdmin) {
      // Platform admin can see everything, or filter by requested status
      if (queryParams.status) {
        items = items.filter(e => e.status === queryParams.status);
      }
    } else if (auth.isClubOrganizer) {
      // Club organizer can see:
      // 1. All published events (for discovery)
      // 2. All events belonging to their linked club (draft, pending_approval, needs_changes, rejected)
      items = items.filter(e => e.status === 'published' || e.organizerId === auth.clubId);

      if (queryParams.status) {
        items = items.filter(e => e.status === queryParams.status);
      }
    } else {
      // Students and anonymous users CAN ONLY see published events
      items = items.filter(e => e.status === 'published');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error fetching events' }),
    };
  }
};
