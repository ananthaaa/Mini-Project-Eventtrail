const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const MEMBERSHIPS_TABLE = process.env.MEMBERSHIPS_TABLE_NAME;
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE_NAME;

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      if (record.eventName === 'INSERT') {
        const newEvent = unmarshall(record.dynamodb.NewImage);
        const clubId = newEvent.organizerId;
        const eventId = newEvent.id;
        const title = newEvent.title;

        if (!clubId) continue;

        // Query MembershipsTable for all active members of this club
        const { Items: members } = await docClient.send(new QueryCommand({
          TableName: MEMBERSHIPS_TABLE,
          IndexName: 'ClubMembersIndex',
          KeyConditionExpression: 'SK = :clubId',
          FilterExpression: '#status = :active',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':clubId': clubId,
            ':active': 'active'
          }
        }));

        if (!members || members.length === 0) continue;

        // Fan-out notifications in batches of 25 (DynamoDB limit)
        const batchChunks = [];
        for (let i = 0; i < members.length; i += 25) {
          batchChunks.push(members.slice(i, i + 25));
        }

        const now = Date.now();

        for (const chunk of batchChunks) {
          const putRequests = chunk.map(member => {
            const userId = member.PK; // because PK is userId
            return {
              PutRequest: {
                Item: {
                  PK: userId,
                  SK: `${now}#${eventId}`,
                  type: 'new_event',
                  payload: {
                    eventId,
                    clubId,
                    title
                  },
                  read: false
                }
              }
            };
          });

          await docClient.send(new BatchWriteCommand({
            RequestItems: {
              [NOTIFICATIONS_TABLE]: putRequests
            }
          }));
        }
      }
    }
  } catch (error) {
    console.error('Error processing DynamoDB stream:', error);
    throw error; // Let Lambda retry if it fails
  }
};
