const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // For manually created developer admin accounts, custom:clubId might be missing.
    // We allow it to fallback to 'global-admin' instead of throwing 403.
    const userClubId = claims['custom:clubId'] || 'global-admin';

    const body = JSON.parse(event.body || '{}');
    const { title, date, time, location, category, seatsTotal, description, coverImage } = body;

    if (!title || !date || !time || !category || seatsTotal === undefined) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const eventId = crypto.randomUUID();
    const newEvent = {
      id: eventId,
      organizerId: userClubId,
      title,
      date,
      time,
      location,
      category,
      seatsTotal: Number(seatsTotal),
      seatsAvailable: Number(seatsTotal),
      description: description || '',
      coverImage: coverImage || '',
      faculty: claims['custom:facultyId'] || 'General',
      status: 'upcoming'
    };

    await docClient.send(new PutCommand({
      TableName: EVENTS_TABLE,
      Item: newEvent
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(newEvent)
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
