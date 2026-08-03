const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CLUBS_TABLE = process.env.CLUBS_TABLE_NAME;
const MEMBERSHIPS_TABLE = process.env.MEMBERSHIPS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const userId = claims.sub;
    const role = claims['custom:role'] || 'student';
    
    // Only admins should create clubs
    if (role !== 'admin' && role !== 'superadmin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Only admins can create clubs' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { name, description, category, logoUrl, joinPolicy = 'open' } = body;

    if (!name || !category) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const clubId = crypto.randomUUID();
    const now = Date.now();

    const newClub = {
      id: clubId,
      name,
      description: description || '',
      category,
      logoUrl: logoUrl || '',
      joinPolicy,
      status: 'active',
      createdBy: userId,
      createdAt: now
    };

    const newMembership = {
      PK: userId,
      SK: clubId,
      role: 'owner',
      status: 'active',
      notifyPreference: 'instant',
      joinedAt: now
    };

    // Use a transaction to create the club and add the owner to Memberships
    await docClient.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: CLUBS_TABLE,
            Item: newClub
          }
        },
        {
          Put: {
            TableName: MEMBERSHIPS_TABLE,
            Item: newMembership
          }
        }
      ]
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(newClub)
    };
  } catch (error) {
    console.error('Error creating club:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
