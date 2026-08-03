const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing event ID' }) };
    }

    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const userClubId = claims['custom:clubId'] || 'global-admin';

    // Check if the event belongs to the admin's club
    const existingEvent = await docClient.send(new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId }
    }));

    if (!existingEvent.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Event not found' }) };
    }

    if (existingEvent.Item.organizerId !== userClubId && userClubId !== 'global-admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Cannot delete events belonging to another club' }) };
    }

    await docClient.send(new DeleteCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: 'Event deleted successfully' })
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
