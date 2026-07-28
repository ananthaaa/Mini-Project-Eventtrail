const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Post-confirmation trigger event:', JSON.stringify(event, null, 2));

  if (
    event.triggerSource === 'PostConfirmation_ConfirmSignUp' ||
    event.triggerSource === 'PostConfirmation_AdminCreateUser' ||
    event.triggerSource === 'PostAuthentication_Authentication'
  ) {
    const { sub, email, name } = event.request.userAttributes || {};
    const role = event.request.userAttributes['custom:role'] || 'student';
    const clubId = event.request.userAttributes['custom:clubId'] || null;
    const facultyId = event.request.userAttributes['custom:facultyId'] || null;

    const tableName = process.env.USERS_TABLE_NAME;
    if (!tableName) {
      console.error('USERS_TABLE_NAME environment variable is not defined.');
      return event;
    }

    try {
      const existing = await ddbDocClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { id: sub },
        })
      );

      if (!existing.Item) {
        const newUserItem = {
          id: sub,
          email: email || event.userName,
          name: name || event.userName || 'Campus User',
          role: role,
          clubId: clubId || undefined,
          facultyId: facultyId || undefined,
          gender: event.request.userAttributes['gender'] || undefined,
          avatar: event.request.userAttributes['picture'] || `https://i.pravatar.cc/150?u=${encodeURIComponent(sub)}`,
          rsvps: [],
          createdAt: new Date().toISOString(),
        };

        await ddbDocClient.send(
          new PutCommand({
            TableName: tableName,
            Item: newUserItem,
          })
        );
        console.log(`Successfully created user ${sub} in ${tableName}`);
      } else {
        console.log(`User ${sub} already exists in ${tableName}, skipping insert.`);
      }
    } catch (err) {
      console.error('Error inserting user into DynamoDB:', err);
    }
  }

  return event;
};
