const {
  CognitoIdentityProviderClient,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminResetUserPasswordCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const cognitoClient = new CognitoIdentityProviderClient({});
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const USER_POOL_ID = process.env.USER_POOL_ID;
const USERS_TABLE = process.env.USERS_TABLE_NAME;

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
    return { authorized: false, statusCode: 403, error: 'Forbidden: Platform Administrator privileges required' };
  }

  return { authorized: true, claims, userId: claims.sub || claims.username };
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,PATCH',
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

    const username = event.pathParameters?.username;
    if (!username) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Username/Email is required in path' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { action } = body; // 'suspend' | 'enable' | 'reset_password'

    if (!['suspend', 'enable', 'reset_password'].includes(action)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid action. Must be 'suspend', 'enable', or 'reset_password'" }),
      };
    }

    let message = '';
    let newStatus = '';

    if (action === 'suspend') {
      await cognitoClient.send(new AdminDisableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      }));
      message = `Organizer ${username} access has been suspended.`;
      newStatus = 'SUSPENDED';
    } else if (action === 'enable') {
      await cognitoClient.send(new AdminEnableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      }));
      message = `Organizer ${username} access has been re-enabled.`;
      newStatus = 'ACTIVE';
    } else if (action === 'reset_password') {
      await cognitoClient.send(new AdminResetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      }));
      message = `Password reset request dispatched to ${username}.`;
      newStatus = 'RESET_REQUIRED';
    }

    // Update status in DynamoDB if available
    if (USERS_TABLE && newStatus) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { id: username },
          UpdateExpression: 'SET #st = :st, updatedAt = :now',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: { ':st': newStatus, ':now': new Date().toISOString() },
        }));
      } catch (dbErr) {
        console.warn('Could not update user record in USERS_TABLE:', dbErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message, username, status: newStatus }),
    };
  } catch (error) {
    console.error('Error in manageOrganizer:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error managing organizer' }),
    };
  }
};
