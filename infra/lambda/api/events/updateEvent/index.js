const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

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
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Cannot modify events belonging to another club' }) };
    }

    const body = JSON.parse(event.body || '{}');
    
    // Build update expression
    const updateKeys = ['title', 'date', 'time', 'location', 'category', 'description', 'coverImage'];
    let updateExpression = 'set';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    let hasUpdates = false;

    for (const key of updateKeys) {
      if (body[key] !== undefined) {
        updateExpression += hasUpdates ? `, #${key} = :${key}` : ` #${key} = :${key}`;
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = body[key];
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No fields to update' }) };
    }

    const updatedEvent = await docClient.send(new UpdateCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(updatedEvent.Attributes)
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
