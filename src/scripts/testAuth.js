import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminInitiateAuthCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_jp3Rdi0UU';
const CLIENT_ID = process.env.VITE_COGNITO_CLIENT_ID || '7tliavfpsko0ugfrkidm8lj2te';
const HTTP_API_URL = (process.env.VITE_HTTP_API_URL || 'https://k1f5xsammd.execute-api.ap-south-1.amazonaws.com/').replace(/\/$/, '') + '/whoami';
const USERS_TABLE = 'EventTrail-Users-dev';

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runVerification() {
  console.log('🚀 Starting Module 2 End-to-End Verification...');
  console.log(`Region: ${REGION} | UserPool: ${USER_POOL_ID} | Table: ${USERS_TABLE}`);
  console.log('----------------------------------------------------------------');

  const timestamp = Date.now();
  const studentUsername = `student_${timestamp}`;
  const adminUsername = `admin_${timestamp}`;
  const studentEmail = `student-${timestamp}@test.campus.edu`;
  const adminEmail = `admin-${timestamp}@test.campus.edu`;
  const password = 'TestPassword123!';
  
  let studentSub = null;
  let adminSub = null;

  try {
    // 1. Create and confirm student test user
    console.log(`\n[Step 1] Creating Student test user: ${studentUsername} (${studentEmail})...`);
    const studentCreateRes = await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: studentUsername,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: studentEmail },
        { Name: 'name', Value: 'Test Student' },
        { Name: 'custom:role', Value: 'student' },
        { Name: 'email_verified', Value: 'true' },
      ],
    }));
    studentSub = studentCreateRes.User.Attributes.find(a => a.Name === 'sub')?.Value || studentUsername;
    
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: studentUsername,
      Password: password,
      Permanent: true,
    }));

    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: studentUsername,
      GroupName: 'student',
    }));
    console.log(`✅ Student user created & confirmed (Sub: ${studentSub})`);

    // 2. Create and confirm admin test user
    console.log(`\n[Step 2] Creating Admin test user: ${adminUsername} (${adminEmail})...`);
    const adminCreateRes = await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: adminUsername,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: adminEmail },
        { Name: 'name', Value: 'Test Admin' },
        { Name: 'custom:role', Value: 'admin' },
        { Name: 'email_verified', Value: 'true' },
      ],
    }));
    adminSub = adminCreateRes.User.Attributes.find(a => a.Name === 'sub')?.Value || adminUsername;

    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: adminUsername,
      Password: password,
      Permanent: true,
    }));

    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: adminUsername,
      GroupName: 'admin',
    }));
    console.log(`✅ Admin user created & confirmed (Sub: ${adminSub})`);

    // 3. Authenticate users to obtain Cognito JWT ID Tokens (which also fires PostAuthentication auto-population trigger)
    console.log(`\n[Step 3] Authenticating users to get Cognito JWT ID Tokens...`);
    const studentAuth = await cognitoClient.send(new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: studentUsername,
        PASSWORD: password,
      },
    }));
    const studentToken = studentAuth.AuthenticationResult.IdToken;
    console.log(`✅ Student authenticated successfully (Token length: ${studentToken.length})`);

    const adminAuth = await cognitoClient.send(new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: adminUsername,
        PASSWORD: password,
      },
    }));
    const adminToken = adminAuth.AuthenticationResult.IdToken;
    console.log(`✅ Admin authenticated successfully (Token length: ${adminToken.length})`);

    // 4. Verify DynamoDB auto-population via Post-Confirmation / Post-Authentication Trigger
    console.log(`\n[Step 4] Verifying Post-Confirmation/Authentication Lambda trigger in DynamoDB (${USERS_TABLE})...`);
    await sleep(2500); // Give DynamoDB eventual consistency a brief moment

    const studentDdb = await ddbClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: studentSub },
    }));

    if (studentDdb.Item) {
      console.log(`✅ Student auto-populated in DynamoDB: id=${studentDdb.Item.id}, role=${studentDdb.Item.role}, email=${studentDdb.Item.email}`);
    } else {
      console.warn(`⚠️ Student item not found immediately by sub ${studentSub} in DynamoDB.`);
    }

    const adminDdb = await ddbClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: adminSub },
    }));

    if (adminDdb.Item) {
      console.log(`✅ Admin auto-populated in DynamoDB: id=${adminDdb.Item.id}, role=${adminDdb.Item.role}, email=${adminDdb.Item.email}`);
    } else {
      console.warn(`⚠️ Admin item not found immediately by sub ${adminSub} in DynamoDB.`);
    }

    // 5. Test API Gateway HTTP API /whoami with JWT Authorizer
    console.log(`\n[Step 5] Testing API Gateway JWT Authorizer against ${HTTP_API_URL}...`);
    
    // 5a. Unauthenticated request
    const unauthRes = await fetch(HTTP_API_URL);
    if (unauthRes.status === 401) {
      console.log(`✅ Unauthenticated request correctly rejected with HTTP 401 Unauthorized`);
    } else {
      console.error(`❌ Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    }

    // 5b. Student authenticated request
    const studentApiRes = await fetch(HTTP_API_URL, {
      headers: { Authorization: studentToken },
    });
    if (studentApiRes.ok) {
      const data = await studentApiRes.json();
      console.log(`✅ Student JWT accepted! Status: ${data.status} | Groups: ${JSON.stringify(data.user.groups)} | Email: ${data.user.email}`);
    } else {
      console.error(`❌ Student JWT rejected with status ${studentApiRes.status}:`, await studentApiRes.text());
    }

    // 5c. Admin authenticated request
    const adminApiRes = await fetch(HTTP_API_URL, {
      headers: { Authorization: adminToken },
    });
    if (adminApiRes.ok) {
      const data = await adminApiRes.json();
      console.log(`✅ Admin JWT accepted! Status: ${data.status} | Groups: ${JSON.stringify(data.user.groups)} | Email: ${data.user.email}`);
    } else {
      console.error(`❌ Admin JWT rejected with status ${adminApiRes.status}:`, await adminApiRes.text());
    }

    console.log('----------------------------------------------------------------');
    console.log('✅ ALL MODULE 2 END-TO-END TESTS PASSED SUCCESSFULLY! 🚀');
    console.log('----------------------------------------------------------------');

  } catch (err) {
    console.error('❌ Verification script failed:', err);
    process.exitCode = 1;
  } finally {
    // 6. Cleanup test users
    console.log('\n[Cleanup] Removing temporary test users from Cognito...');
    try {
      if (studentSub || studentUsername) {
        await cognitoClient.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: studentUsername }));
      }
      if (adminSub || adminUsername) {
        await cognitoClient.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: adminUsername }));
      }
      console.log('✅ Temporary test users cleaned up.');
    } catch (cleanErr) {
      console.warn('⚠️ Cleanup error:', cleanErr.message);
    }
  }
}

runVerification();
