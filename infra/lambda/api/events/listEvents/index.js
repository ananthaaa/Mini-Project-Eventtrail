const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

function getCallerAuth(event) {
  let claims = event.requestContext?.authorizer?.jwt?.claims;

  if (!claims) {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7).trim();
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = Buffer.from(parts[1], 'base64').toString('utf8');
          claims = JSON.parse(payload);
        }
      } catch (err) {
        console.warn('Could not decode Bearer token header:', err.message);
      }
    }
  }

  if (!claims) return { isAuthenticated: false, role: 'anonymous' };

  const rawGroups = claims['cognito:groups'] || [];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : (typeof rawGroups === 'string' ? rawGroups.split(',').map(s => s.trim()) : []);

  const role = claims['custom:role'];
  const clubId = claims['custom:clubId'];
  const isPlatformAdmin = groups.includes('admin') || groups.includes('Admin') || groups.includes('platform-admin') || role === 'admin' || role === 'platform-admin';
  const isClubOrganizer = groups.includes('ClubAdmin') || groups.includes('club-admin') || role === 'club_admin' || role === 'club-admin' || Boolean(clubId);

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
    const isStatusAll = queryParams.status === 'all' || queryParams.admin === 'true';

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
    if (auth.isPlatformAdmin || isStatusAll) {
      // Platform admin or explicit all/admin query can see all events
      if (queryParams.status && queryParams.status !== 'all') {
        items = items.filter(e => e.status === queryParams.status);
      }
    } else if (auth.isClubOrganizer) {
      // Club organizer can see:
      // 1. All published events (for discovery)
      // 2. All events belonging to their linked club (draft, pending_approval, needs_changes, rejected)
      items = items.filter(e => e.status === 'published' || (auth.clubId && e.organizerId === auth.clubId) || !e.status || e.status === 'pending_approval');

      if (queryParams.status && queryParams.status !== 'all') {
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
