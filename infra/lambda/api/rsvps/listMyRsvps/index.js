const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RSVPS_TABLE = process.env.RSVPS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // A user can only fetch their own RSVPs, unless they are an admin?
    // Let's just enforce they fetch their own.
    const userId = event.pathParameters?.id;
    if (!userId || userId !== claims.sub) {
        // Technically an admin might want to fetch someone else's RSVPs, but for MVP keep it simple
        if (!claims['cognito:groups']?.includes('admin')) {
           return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
        }
    }

    const res = await docClient.send(new QueryCommand({
      TableName: RSVPS_TABLE,
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(res.Items || [])
    };
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
