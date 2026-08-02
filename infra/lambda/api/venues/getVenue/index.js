const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const VENUES_TABLE = process.env.VENUES_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const venueId = event.pathParameters?.id;
    
    if (!venueId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing venue ID' }),
      };
    }

    const command = new GetCommand({
      TableName: VENUES_TABLE,
      Key: {
        id: venueId,
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
        body: JSON.stringify({ error: 'Venue not found' }),
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
    console.error('Error fetching venue:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch venue' }),
    };
  }
};
