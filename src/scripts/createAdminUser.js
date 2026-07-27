/**
 * EventTrail — Create Default Admin User
 * ----------------------------------------
 * Run this ONCE to provision the developer admin account in AWS Cognito.
 * The admin will be added to the `admin` Cognito group and auto-inserted
 * into the EventTrail-Users-dev DynamoDB table via the PostAuthentication trigger.
 *
 * Usage:
 *   npm run create:admin
 *
 * Credentials are read from environment variables:
 *   ADMIN_EMAIL    - Admin login email (e.g. admin@eventtrail.dev)
 *   ADMIN_PASSWORD - Admin password (min 8 chars, used to log in from the UI)
 *   ADMIN_NAME     - Display name shown in the admin UI
 *
 * These are set in .env.local and NEVER committed to git.
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually (script runs in Node, not Vite)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '../../.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
  console.log('✅ Loaded .env.local');
} catch {
  console.log('ℹ️  No .env.local found — relying on system environment variables.');
}

const REGION = process.env.VITE_AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_jp3Rdi0UU';
const USERS_TABLE = 'EventTrail-Users-dev';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Platform Admin';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
  console.error('');
  console.error('Add these lines to your .env.local file:');
  console.error('  ADMIN_EMAIL=admin@eventtrail.dev');
  console.error('  ADMIN_PASSWORD=YourSecurePassword123!');
  console.error('  ADMIN_NAME=Platform Admin');
  process.exit(1);
}

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const adminUsername = `admin_default_${ADMIN_EMAIL.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

async function createAdminUser() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  EventTrail — Create Default Admin User    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`Region:     ${REGION}`);
  console.log(`User Pool:  ${USER_POOL_ID}`);
  console.log(`Email:      ${ADMIN_EMAIL}`);
  console.log(`Name:       ${ADMIN_NAME}`);
  console.log(`Username:   ${adminUsername}`);
  console.log('─────────────────────────────────────────────');

  let adminSub = null;

  try {
    // Step 1: Check if admin already exists
    console.log('\n[Step 1] Checking if admin user already exists...');
    try {
      const existing = await cognitoClient.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: adminUsername,
      }));
      adminSub = existing.UserAttributes.find(a => a.Name === 'sub')?.Value;
      console.log(`ℹ️  Admin user already exists in Cognito (Sub: ${adminSub}). Skipping creation.`);
    } catch (notFoundErr) {
      if (notFoundErr.name === 'UserNotFoundException') {
        // Step 2: Create admin user
        console.log('[Step 2] Creating admin user in Cognito...');
        const createRes = await cognitoClient.send(new AdminCreateUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: adminUsername,
          TemporaryPassword: ADMIN_PASSWORD,
          MessageAction: 'SUPPRESS', // Don't send invitation email
          UserAttributes: [
            { Name: 'email', Value: ADMIN_EMAIL },
            { Name: 'name', Value: ADMIN_NAME },
            { Name: 'custom:role', Value: 'admin' },
            { Name: 'email_verified', Value: 'true' },
          ],
        }));
        adminSub = createRes.User.Attributes.find(a => a.Name === 'sub')?.Value;
        console.log(`✅ Admin user created in Cognito (Sub: ${adminSub})`);

        // Step 3: Set permanent password (skip FORCE_CHANGE_PASSWORD state)
        console.log('[Step 3] Setting permanent password...');
        await cognitoClient.send(new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: adminUsername,
          Password: ADMIN_PASSWORD,
          Permanent: true,
        }));
        console.log('✅ Permanent password set successfully');
      } else {
        throw notFoundErr;
      }
    }

    // Step 4: Add to admin group
    console.log('\n[Step 4] Adding user to `admin` Cognito group...');
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: adminUsername,
      GroupName: 'admin',
    }));
    console.log('✅ User added to `admin` group');

    // Step 5: Upsert DynamoDB profile
    console.log('\n[Step 5] Upserting admin profile in DynamoDB...');
    const existingItem = await ddbClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: adminSub },
    }));

    if (!existingItem.Item) {
      await ddbClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          id: adminSub,
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          role: 'admin',
          avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(adminSub)}`,
          rsvps: [],
          createdAt: new Date().toISOString(),
        },
      }));
      console.log('✅ Admin profile created in DynamoDB');
    } else {
      console.log('ℹ️  Admin profile already exists in DynamoDB — skipping insert');
    }

    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  ✅ ADMIN USER SETUP COMPLETE!             ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('To log in as admin:');
    console.log(`  1. Open http://localhost:5173/login`);
    console.log(`  2. Switch to the "Admin" tab`);
    console.log(`  3. Email:    ${ADMIN_EMAIL}`);
    console.log(`  4. Password: (from your ADMIN_PASSWORD in .env.local)`);
    console.log('');
    console.log('Or use the Quick Admin Login button (reads from VITE_ADMIN_EMAIL + VITE_ADMIN_PASSWORD in .env.local)');
    console.log('');

  } catch (err) {
    console.error('\n❌ Failed to create admin user:', err.message || err);
    process.exit(1);
  }
}

createAdminUser();
