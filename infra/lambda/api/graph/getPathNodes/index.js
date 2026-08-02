const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const PATH_NODES_TABLE = process.env.PATH_NODES_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const command = new ScanCommand({
      TableName: PATH_NODES_TABLE,
    });

    const data = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data.Items || []),
    };
  } catch (error) {
    console.error('Error fetching path nodes:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch path nodes' }),
    };
  }
};
