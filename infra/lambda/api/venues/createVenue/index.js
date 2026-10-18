const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const VENUES_TABLE = process.env.VENUES_TABLE_NAME;

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
    return { authorized: false, statusCode: 403, error: 'Forbidden: Administrator privileges required to manage venues' };
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
    const auth = getAdminAuth(event);
    if (!auth.authorized) {
      return {
        statusCode: auth.statusCode,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: auth.error })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { name, category, description, lat, lng, nodeId, building, floorPlanImage, graphData, indoorSteps } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Validation failed: Venue name is required' })
      };
    }

    if (!category) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Validation failed: Category is required' })
      };
    }

    const venueId = body.id || `venue_${crypto.randomUUID().substring(0, 8)}`;
    const newVenue = {
      id: venueId,
      name: name.trim(),
      building: building || name.trim(),
      category,
      description: description || '',
      lat: typeof lat === 'number' ? lat : (lat ? parseFloat(lat) : 10.1780),
      lng: typeof lng === 'number' ? lng : (lng ? parseFloat(lng) : 76.4302),
      nodeId: nodeId || null,
      floorPlanImage: floorPlanImage || '',
      graphData: graphData || null,
      indoorSteps: Array.isArray(indoorSteps) ? indoorSteps : [],
      createdBy: auth.userId,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: VENUES_TABLE,
      Item: newVenue
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(newVenue)
    };
  } catch (error) {
    console.error('Error creating venue:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
