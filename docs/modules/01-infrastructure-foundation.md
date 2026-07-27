# Module 1 — Infrastructure Foundation & Data Layer

**Status:** 🟢 **DONE** (Verified against live AWS environment in `ap-south-1`)
**Date:** 2026-07-27

---

## 1. What Was Built

The AWS Serverless infrastructure foundation and data layer for EventTrail / CampusPulse was fully implemented and deployed using AWS CDK (TypeScript) inside the `/infra` directory:
- Scaffolder a modern TypeScript CDK project (`package.json`, `tsconfig.json`, `cdk.json`, `bin/infra.ts`).
- Defined the core data layer stack (`DataLayerStack`) provisioning all 7 DynamoDB tables required by the application, configured with `PAY_PER_REQUEST` billing (on-demand capacity) and dev-friendly removal policies.
- Attached all 4 required Global Secondary Indexes (GSIs) to power efficient discovery and profile querying without full table scans.
- Provisioned baseline CloudWatch telemetry, including a log group (`/aws/campuspulse/dev`) and a system dashboard placeholder (`CampusPulse-dev-Dashboard`).
- Built and executed a fast, concurrent DynamoDB bulk seed script (`infra/scripts/seedDynamoDB.js` and `src/scripts/seedDynamoDB.js`) that parses all mock JSON files from `/src/data/*.json` and loads them into their respective DynamoDB tables in `ap-south-1` with zero manual edits.
- Created and executed an automated smoke-test verification suite (`infra/scripts/smokeTest.js`) that performs live `Scan` and `GetItem` checks across all tables, confirming 100% data integrity.

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

1. **Environment & Region Scoping**: Table names are parameterized with an environment suffix (`-dev`) and default to `ap-south-1` (matching the user's AWS CLI config).
2. **RSVP Table Seeding**: Student profiles in `users.json` contain an array of RSVP event IDs (`user.rsvps`). The seed script dynamically derives and generates individual confirmed RSVP records in `RSVPsTable` during the seed run.
3. **Chunked Concurrency Optimization**: Replaced sequential `PutCommand` loops with parallel `Promise.all` batching in chunks of 20 items, reducing seeding runtime across 7 tables to under 15 seconds.

---

## 6. How to Verify It Works

To verify and re-test Module 1 end-to-end against the live AWS account:

1. **Deploy Infrastructure**:
   ```bash
   cd infra
   npx cdk deploy
   ```

2. **Run Bulk Data Seeding**:
   ```bash
   npm run seed
   ```

3. **Execute Smoke Tests**:
   ```bash
   npm run smoke-test
   ```

---

## 7. Verification Checklist

- [x] **CDK Scaffold & Deploy**: `cdk deploy` successfully stood up all 7 tables in `dev` (Stack ARN: `arn:aws:cloudformation:ap-south-1:742020475364:stack/CampusPulse-DataLayer-dev/24ecd520-89db-11f1-a802-02da9d5e16b3`).
- [x] **Live Table Seeding**: Seed script populated every table from existing mock JSON with zero manual edits (34 items loaded across 7 tables).
- [x] **Live Smoke Testing**: `GetItem`/`Query` returned data matching mock JSON shapes for all 7 tables (`✅ ALL SMOKE TESTS PASSED!`).
