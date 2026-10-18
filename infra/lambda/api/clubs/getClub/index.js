const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CLUBS_TABLE = process.env.CLUBS_TABLE_NAME;
const MEMBERSHIPS_TABLE = process.env.MEMBERSHIPS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const clubId = event.pathParameters?.id;
    
    if (!clubId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing club ID' }),
      };
    }

    const command = new GetCommand({
      TableName: CLUBS_TABLE,
      Key: {
        id: clubId,
      },
    });

    const data = await docClient.send(command);
    
    if (!data.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Club not found' }),
      };
    }

    const club = { ...data.Item, isMember: false };

    // Check if the caller is an authenticated user and whether they are an active member
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const userId = claims?.sub || claims?.username;

    if (userId && MEMBERSHIPS_TABLE) {
      try {
        const memRes = await docClient.send(new GetCommand({
          TableName: MEMBERSHIPS_TABLE,
          Key: {
            PK: userId,
            SK: clubId,
          }
        }));
        if (memRes.Item && memRes.Item.status === 'active') {
          club.isMember = true;
          club.membership = memRes.Item;
        }
      } catch (memErr) {
        console.warn('Could not check membership status:', memErr.message);
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(club),
    };
  } catch (error) {
    console.error('Error fetching club:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch club' }),
    };
  }
};
