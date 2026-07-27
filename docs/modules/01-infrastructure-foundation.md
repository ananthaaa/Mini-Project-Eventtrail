# Module 1 — Infrastructure Foundation & Data Layer

**Status:** 🟡 **IN PROGRESS (Code Complete — Pending Cloud Authentication & Deploy)**
**Date:** 2026-07-27

---

## 1. What Was Built

The AWS Serverless infrastructure foundation and data layer for EventTrail / CampusPulse was fully implemented using AWS CDK (TypeScript) inside the `/infra` directory:
- Scaffolder a modern TypeScript CDK project (`package.json`, `tsconfig.json`, `cdk.json`, `bin/infra.ts`).
- Defined the core data layer stack (`DataLayerStack`) provisioning all 7 DynamoDB tables required by the application, configured with `PAY_PER_REQUEST` billing (on-demand capacity) and dev-friendly removal policies.
- Attached all 4 required Global Secondary Indexes (GSIs) to power efficient discovery and profile querying without full table scans.
- Provisioned baseline CloudWatch telemetry, including a log group (`/aws/campuspulse/dev`) and a system dashboard placeholder (`CampusPulse-dev-Dashboard`).
- Built a universal, automated DynamoDB bulk seed script (`infra/scripts/seedDynamoDB.js` and `src/scripts/seedDynamoDB.js`) that parses all mock JSON files from `/src/data/*.json` and loads them into their respective DynamoDB tables with zero manual edits.
- Created an automated smoke-test verification suite (`infra/scripts/smokeTest.js`) that performs live `Scan` and `GetItem` checks across all tables.

---

## 2. AWS Resources Created

| Resource Type | Resource Name / Identifier | Purpose |
|---|---|---|
| **DynamoDB Table** | `EventTrail-Events-dev` | Stores campus events (`id` PK). Has 3 GSIs: `byFaculty`, `byCategory`, `byOrganizer`. |
| **DynamoDB Table** | `EventTrail-Clubs-dev` | Stores student clubs and organizations (`id` PK). |
| **DynamoDB Table** | `EventTrail-Venues-dev` | Stores campus buildings, indoor waypoints, and outdoor coordinates (`id` PK). |
| **DynamoDB Table** | `SpeakersTable` (`EventTrail-Speakers-dev`) | Stores speaker profiles and avatars (`id` PK). |
| **DynamoDB Table** | `UsersTable` (`EventTrail-Users-dev`) | Stores student and club admin user profiles (`id` PK). |
| **DynamoDB Table** | `RSVPsTable` (`EventTrail-RSVPs-dev`) | Stores event ticket reservations (`eventId` PK, `userId` SK). Has GSI: `byUser`. |
| **DynamoDB Table** | `PathNodesTable` (`EventTrail-PathNodes-dev`) | Stores outdoor campus walkway graph nodes (`nodeId` PK). |
| **DynamoDB Table** | `PathEdgesTable` (`EventTrail-PathEdges-dev`) | Stores connected walkway edges and distances (`edgeId` PK). |
| **CloudWatch LogGroup** | `/aws/campuspulse/dev` | Central log repository for upcoming Lambda function handlers. |
| **CloudWatch Dashboard** | `CampusPulse-dev-Dashboard` | Operational dashboard placeholder for monitoring API and Lambda performance. |

---

## 3. API Endpoints Added
*None.* API Gateway REST endpoints and Lambda resolvers are introduced starting in Module 3 (Public Read API) and Module 4 (Admin CRUD).

---

## 4. Frontend Files Touched
*None.* Module 1 establishes the backend cloud infrastructure and data layer. Frontend integration and rewiring begin in Module 2 (Auth) and Module 3 (API consumption).

---

## 5. Key Decisions & Deviations

1. **Environment Scoping**: Table names are parameterized with an environment suffix (e.g., `-dev`) via CDK context and environment variables. This allows multiple staging or production stacks to coexist within the same AWS account without naming collisions.
2. **RSVP Table Seeding**: While there is no standalone `rsvps.json` mock file, student profiles in `users.json` contain an array of RSVP event IDs (`user.rsvps`). The seed script was enhanced to dynamically derive and generate individual confirmed RSVP records in `RSVPsTable` during the seed run.
3. **Consolidated Seed Script**: Updated `src/scripts/seedDynamoDB.js` to execute the full 7-table seeding logic rather than only seeding the navigation graph tables.

---

## 6. How to Verify It Works

To verify and test Module 1 end-to-end against a live AWS account:

1. **Authenticate AWS CLI Session**:
   Ensure your AWS credentials are active:
   ```bash
   aws login
   # OR check caller identity
   aws sts get-caller-identity
   ```

2. **Deploy Infrastructure**:
   Navigate to `/infra` and deploy the stack:
   ```bash
   cd infra
   npm install
   npm run build
   npx cdk deploy
   ```

3. **Run Bulk Data Seeding**:
   Populate all 7 DynamoDB tables directly from the frontend mock JSON files:
   ```bash
   npm run seed
   ```

4. **Execute Smoke Tests**:
   Run the verification suite to confirm data shapes and table read functionality:
   ```bash
   npm run smoke-test
   ```

---

## 7. Known Limitations & Follow-Ups
- **Cloud Authentication Required**: Live deployment (`cdk deploy`) and database seeding (`npm run seed`) could not be executed during this session because the local AWS CLI session was expired (`aws: [ERROR]: Your session has expired`). Once the user reauthenticates, running the verification commands above will complete the live cloud check.

---

## 8. Verification Checklist

- [x] **CDK Scaffold & Synth**: `cdk synth` compiles TypeScript definitions and generates valid CloudFormation template for all 7 tables, GSIs, LogGroup, and Dashboard.
- [x] **Seed Script Implementation**: Script written to parse and batch-insert data into all 7 tables without manual edits.
- [ ] **Live Stack Deployment**: `cdk deploy` stands up all 7 tables in `dev` *(Pending AWS session reauthentication)*.
- [ ] **Live Table Seeding**: Seed script populates live AWS DynamoDB tables *(Pending AWS session reauthentication)*.
- [ ] **Live Smoke Testing**: `GetItem`/`Query` returns data matching mock JSON shapes *(Pending AWS session reauthentication)*.
