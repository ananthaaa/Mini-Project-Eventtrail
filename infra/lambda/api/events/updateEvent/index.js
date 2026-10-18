const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

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

    // Check if event exists
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

    const existingEvent = existingRes.Item;

    // Check club ownership unless platform admin
    if (!auth.isPlatformAdmin && existingEvent.organizerId !== auth.clubId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Forbidden: Cannot modify events belonging to another club' })
      };
    }

    const body = JSON.parse(event.body || '{}');

    // Supported fields for update
    const supportedFields = [
      'title', 'date', 'time', 'location', 'venueId', 'locationDetails',
      'category', 'faculty', 'description', 'coverImage', 'schedule',
      'startsAt', 'endsAt', 'timezone', 'registrationDeadline', 'status', 'seatsTotal'
    ];

    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ':updatedAt': new Date().toISOString()
    };

    let hasUpdates = false;

    for (const key of supportedFields) {
      if (body[key] !== undefined) {
        if (key === 'seatsTotal') {
          const parsedSeats = parseInt(body.seatsTotal, 10);
          if (isNaN(parsedSeats) || parsedSeats <= 0) {
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Validation failed: Total seats must be a positive integer.' })
            };
          }
          const bookedSeats = (existingEvent.seatsTotal || 0) - (existingEvent.seatsAvailable ?? existingEvent.seatsTotal ?? 0);
          const newSeatsAvailable = Math.max(0, parsedSeats - Math.max(0, bookedSeats));
          updateExpression += `, #seatsTotal = :seatsTotal, #seatsAvailable = :seatsAvailable`;
          expressionAttributeNames['#seatsTotal'] = 'seatsTotal';
          expressionAttributeNames['#seatsAvailable'] = 'seatsAvailable';
          expressionAttributeValues[':seatsTotal'] = parsedSeats;
          expressionAttributeValues[':seatsAvailable'] = newSeatsAvailable;
          hasUpdates = true;
          continue;
        }

        if (key === 'title' && (!body.title || typeof body.title !== 'string' || !body.title.trim())) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Validation failed: Title cannot be empty.' })
          };
        }

        if (key === 'status') {
          if (!auth.isPlatformAdmin) {
            // Club organizers cannot self-publish
            if (body.status === 'published') {
              return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Forbidden: Club organizers cannot publish events directly without administrator approval.' })
              };
            }
            // Allow transition to draft or pending_approval
            if (!['draft', 'pending_approval'].includes(body.status)) {
              return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: "Invalid status: Organizers can only set status to 'draft' or 'pending_approval'." })
              };
            }
          }
        }

        // If organizer modifies date, time, or venue on an already published event, trigger re-review
        if (!auth.isPlatformAdmin && existingEvent.status === 'published') {
          if (['date', 'time', 'venueId', 'location'].includes(key) && body[key] !== existingEvent[key]) {
            // Require re-approval
            updateExpression += `, #status = :pendingApprovalStatus, #submittedAt = :submittedAtNow`;
            expressionAttributeNames['#status'] = 'status';
            expressionAttributeNames['#submittedAt'] = 'submittedAt';
            expressionAttributeValues[':pendingApprovalStatus'] = 'pending_approval';
            expressionAttributeValues[':submittedAtNow'] = new Date().toISOString();
          }
        }

        updateExpression += `, #${key} = :${key}`;
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = body[key];
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No fields provided for update' })
      };
    }

    const updated = await docClient.send(new UpdateCommand({
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
      body: JSON.stringify(updated.Attributes)
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
