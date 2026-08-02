const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    
    let command;
    
    if (queryParams.faculty) {
      command = new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'byFaculty',
        KeyConditionExpression: 'faculty = :faculty',
        ExpressionAttributeValues: {
          ':faculty': queryParams.faculty,
        }
      });
    } else if (queryParams.category) {
      command = new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'byCategory',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': queryParams.category,
        }
      });
    } else if (queryParams.organizerId) {
      command = new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'byOrganizer',
        KeyConditionExpression: 'organizerId = :orgId',
        ExpressionAttributeValues: {
          ':orgId': queryParams.organizerId,
        }
      });
    } else {
      command = new ScanCommand({
        TableName: EVENTS_TABLE,
      });
    }

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
    console.error('Error fetching events:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch events' }),
    };
  }
};
