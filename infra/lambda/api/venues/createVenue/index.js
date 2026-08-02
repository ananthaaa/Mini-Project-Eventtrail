const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const VENUES_TABLE = process.env.VENUES_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const userClubId = claims['custom:clubId'];
    // Venue creation might be restricted to platform admins, but for now we'll just check if they are in a club
    if (!userClubId) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin must belong to a club' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { name, category, description, floorPlanImage, graphData } = body;

    if (!name || !category) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const venueId = crypto.randomUUID();
    const newVenue = {
      id: venueId,
      name,
      category,
      description: description || '',
      floorPlanImage: floorPlanImage || '',
      graphData: graphData || null // payload from the waypoint editor
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
