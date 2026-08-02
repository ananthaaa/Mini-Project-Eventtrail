const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CLUBS_TABLE = process.env.CLUBS_TABLE_NAME;

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
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data.Item),
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
