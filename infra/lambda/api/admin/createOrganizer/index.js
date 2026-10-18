const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const cognitoClient = new CognitoIdentityProviderClient({});
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const USER_POOL_ID = process.env.USER_POOL_ID;
const CLUBS_TABLE = process.env.CLUBS_TABLE_NAME;
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
  const isPlatformAdmin = groups.includes('admin') || groups.includes('Admin') || groups.includes('platform-admin') || role === 'admin' || role === 'platform-admin';

  if (!isPlatformAdmin) {
    return { authorized: false, statusCode: 403, error: 'Forbidden: Platform Administrator privileges required' };
  }

  return { authorized: true, claims, userId: claims.sub || claims.username };
}

function generateSecureTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';

  let pwd = '';
  pwd += upper[crypto.randomInt(0, upper.length)];
  pwd += lower[crypto.randomInt(0, lower.length)];
  pwd += digits[crypto.randomInt(0, digits.length)];
  pwd += special[crypto.randomInt(0, special.length)];

  const all = upper + lower + digits + special;
  for (let i = 4; i < 12; i++) {
    pwd += all[crypto.randomInt(0, all.length)];
  }
  return pwd;
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

    const body = JSON.parse(event.body || '{}');
    const { email, name, clubId, phone } = body;

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Valid organizer email address is required' }),
      };
    }

    if (!name || !name.trim()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Organizer full name is required' }),
      };
    }

    if (!clubId || !clubId.trim()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Assigned clubId is required' }),
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const tempPassword = generateSecureTempPassword();

    // 1. Create or Update User in Cognito User Pool
    try {
      await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: normalizedEmail,
        TemporaryPassword: tempPassword,
        UserAttributes: [
          { Name: 'email', Value: normalizedEmail },
          { Name: 'name', Value: name.trim() },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:role', Value: 'club_admin' },
          { Name: 'custom:clubId', Value: clubId.trim() },
          ...(phone ? [{ Name: 'phone_number', Value: phone.trim() }] : []),
        ],
        DesiredDeliveryMediums: ['EMAIL'],
      }));
    } catch (cognitoErr) {
      if (cognitoErr.name === 'UsernameExistsException') {
        // Upgrade existing user to club_admin with the assigned clubId
        try {
          await cognitoClient.send(new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: normalizedEmail,
            UserAttributes: [
              { Name: 'custom:role', Value: 'club_admin' },
              { Name: 'custom:clubId', Value: clubId.trim() },
            ],
          }));
        } catch (updateErr) {
          console.warn('Could not update existing user attributes:', updateErr.message);
        }
      } else {
        throw cognitoErr;
      }
    }

    // 2. Add User to ClubAdmin Cognito group
    try {
      await cognitoClient.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: normalizedEmail,
        GroupName: 'ClubAdmin',
      }));
    } catch (groupErr) {
      console.warn('Could not add to ClubAdmin group (may need creation):', groupErr.message);
    }

    // 3. Persist record in Users table
    if (USERS_TABLE) {
      try {
        await docClient.send(new PutCommand({
          TableName: USERS_TABLE,
          Item: {
            id: normalizedEmail,
            email: normalizedEmail,
            name: name.trim(),
            role: 'club_admin',
            clubId: clubId.trim(),
            status: 'INVITED',
            invitedAt: new Date().toISOString(),
            invitedBy: auth.userId,
          },
        }));
      } catch (dbErr) {
        console.warn('Could not write organizer to USERS_TABLE:', dbErr.message);
      }
    }

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Organizer account successfully provisioned. Invitation dispatched.',
        organizer: {
          username: normalizedEmail,
          email: normalizedEmail,
          name: name.trim(),
          clubId: clubId.trim(),
          tempPassword, // Returned to admin UI so admin can also copy/deliver directly
          role: 'club_admin',
          status: 'FORCE_CHANGE_PASSWORD',
        },
      }),
    };
  } catch (error) {
    console.error('Error in createOrganizer:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error provisioning organizer' }),
    };
  }
};
