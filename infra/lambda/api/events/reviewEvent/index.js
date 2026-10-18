const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE_NAME;

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
  const isPlatformAdmin = groups.includes('admin') || groups.includes('Admin') || role === 'admin';

  if (!isPlatformAdmin) {
    return { authorized: false, statusCode: 403, error: 'Forbidden: Only Platform Administrators can review and approve events' };
  }

  return { authorized: true, claims, userId: claims.sub || claims.username };
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Access-Control-Allow-Headers': '*',
  };

  try {
    const auth = getAdminAuth(event);
    if (!auth.authorized) {
      return {
        statusCode: auth.statusCode,
        headers: corsHeaders,
        body: JSON.stringify({ error: auth.error }),
      };
    }

    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Event ID is required in URL path' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { action, reviewComment } = body;

    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid action. Must be 'approve', 'reject', or 'request_changes'" }),
      };
    }

    if ((action === 'reject' || action === 'request_changes') && (!reviewComment || !reviewComment.trim())) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: `A review comment explaining the decision is required when ${action === 'reject' ? 'rejecting' : 'requesting changes for'} an event.` }),
      };
    }

    // 1. Fetch existing event
    const getRes = await docClient.send(new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId },
    }));

    if (!getRes.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    const currentEvent = getRes.Item;
    const now = new Date().toISOString();

    let newStatus = '';
    let notificationMsg = '';

    if (action === 'approve') {
      newStatus = 'published';
      notificationMsg = `Your event "${currentEvent.title}" has been approved and published to students!`;
    } else if (action === 'reject') {
      newStatus = 'rejected';
      notificationMsg = `Your event "${currentEvent.title}" was declined: ${reviewComment}`;
    } else if (action === 'request_changes') {
      newStatus = 'needs_changes';
      notificationMsg = `Changes requested for "${currentEvent.title}": ${reviewComment}`;
    }

    // 2. Update event in DynamoDB
    const updateRes = await docClient.send(new UpdateCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId },
      UpdateExpression: 'SET #st = :st, reviewComment = :comment, reviewedBy = :reviewer, reviewedAt = :now, updatedAt = :now',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':st': newStatus,
        ':comment': reviewComment ? reviewComment.trim() : null,
        ':reviewer': auth.userId,
        ':now': now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    // 3. Dispatch Notification to Club Organizers if table configured
    if (NOTIFICATIONS_TABLE && currentEvent.organizerId) {
      try {
        await docClient.send(new PutCommand({
          TableName: NOTIFICATIONS_TABLE,
          Item: {
            id: `notif-${crypto.randomUUID()}`,
            userId: currentEvent.organizerId, // Club organizer ID
            eventId: eventId,
            type: action === 'approve' ? 'EVENT_APPROVED' : 'EVENT_REVIEW_FEEDBACK',
            title: `Event Review: ${action === 'approve' ? 'Approved' : (action === 'reject' ? 'Declined' : 'Needs Changes')}`,
            message: notificationMsg,
            reviewComment: reviewComment ? reviewComment.trim() : null,
            read: false,
            createdAt: now,
          },
        }));
      } catch (notifErr) {
        console.warn('Could not dispatch review notification:', notifErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: `Event has been ${action === 'approve' ? 'approved and published' : (action === 'reject' ? 'rejected' : 'returned for revisions')}.`,
        event: updateRes.Attributes,
      }),
    };
  } catch (error) {
    console.error('Error reviewing event:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error reviewing event' }),
    };
  }
};
