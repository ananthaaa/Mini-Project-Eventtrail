# CampusPulse Project Modules Status

This document provides a detailed overview of the CampusPulse Backend Build Plan, encompassing all 8 sequential modules. It outlines the scope, completion status, and technical achievements of the modules finished so far, as well as the detailed roadmap for the upcoming modules.

---

## ✅ Completed Modules

### Module 1: Infrastructure Foundation & Data Layer
**Status:** Completed
**Scope & Achievements:**
- Established the foundational AWS environment using the AWS Cloud Development Kit (CDK) in TypeScript.
- Provisioned all 7 core DynamoDB tables: `Events`, `Clubs`, `Venues`, `Speakers`, `Users`, `RSVPs`, and `PathNodes`/`PathEdges`.
- Configured Global Secondary Indexes (GSIs) such as `Events.byFaculty`, `Events.byCategory`, `Events.byOrganizer`, and `RSVPs.byUser` for efficient querying.
- Developed and executed a one-time seed script to ingest all mock JSON data (`src/data/*.json` and `graph.json`) directly into the DynamoDB tables.
- Validated data ingestion via AWS CLI and NoSQL Workbench.

### Module 2: Auth (Cognito)
**Status:** Completed
**Scope & Achievements:**
- Deployed an Amazon Cognito User Pool with distinct `student` and `admin` groups.
- Added custom attributes (`custom:clubId` and `custom:role`) to scope permissions and identify users.
- Implemented a Post-Confirmation Lambda trigger that automatically provisions a corresponding user record in the `Users` DynamoDB table upon registration.
- Configured an API Gateway JWT Authorizer to secure endpoints and validate incoming tokens.
- Fully integrated the React frontend (`Login.jsx`, `SignupPage.jsx`, and `RoleContext.jsx`) with live Cognito authentication, seamlessly replacing the local mockup state.

### Module 3: Public Read API (Events, Clubs, Venues, Speakers, Graph)
**Status:** Completed
**Scope & Achievements:**
- Scaffolded an API Gateway HTTP API for unauthenticated, public data access.
- Deployed individual Lambda functions for all public GET routes: `/events`, `/events/{id}`, `/clubs`, `/clubs/{id}`, `/venues/{id}`, `/speakers`, `/graph/nodes`, and `/graph/edges`.
- Engineered dynamic filtering for the `/events` endpoint, allowing users to query by `faculty` and `category` using the DynamoDB GSIs created in Module 1.
- Updated the frontend services (`apiService.js` and `mapService.js`) to consume these live endpoints, effectively eliminating all dependencies on local static JSON files.
- Ensured the client-side A* pathfinding algorithm for campus navigation correctly consumes the live backend graph data.

### Module 4: Admin CRUD + Media Upload
**Status:** Completed
**Scope & Achievements:**
- Provisioned the `MediaStack` containing an S3 bucket configured for Cross-Origin Resource Sharing (CORS) and public read access for media delivery (bypassing CloudFront due to AWS account limitations).
- Connected the Cognito JWT Authorizer to new restricted API Gateway routes.
- Built and deployed event mutator Lambdas (`POST /events`, `PUT /events/{id}`, `DELETE /events/{id}`) featuring strict tenant isolation—verifying the admin's `custom:clubId` against the event's `organizerId`.
- Built the `createVenue` Lambda to save custom floor plan maps and navigation waypoints to DynamoDB.
- Deployed a `/upload-url` endpoint that issues temporary Presigned POST URLs to securely upload image assets (capped at 5MB) directly from the browser to S3.
- Integrated the live S3 uploader and authenticated CRUD fetches into the React Admin Dashboard (`AdminEventForm.jsx` and `AdminVenueUpload.jsx`).

---

## ⏳ Upcoming Modules

### Module 5: RSVP + Waitlist (Core Transactional Logic)
**Status:** Next up
**Depends on:** Modules 1, 2, 3
**Scope:**
- **Transactional Consistency:** Build the `POST /events/{id}/rsvp` endpoint using DynamoDB `TransactWriteItems` to decrement `seatsAvailable` with a strict condition that `seatsAvailable > 0`.
- **Waitlisting:** If seats are zero, place the user on the waitlist with a specific `waitlistPosition`.
- **Cancellations:** Build the `DELETE /events/{id}/rsvp` endpoint to cancel reservations.
- **Streams & Automation:** Implement a DynamoDB Stream trigger that listens for cancellations and automatically invokes a `promoteWaitlist` Lambda to move the next waitlisted user to confirmed status.
- **My RSVPs:** Implement `GET /users/{id}/rsvps` using the `RSVPs.byUser` GSI.
- **Frontend Integration:** Wire `RsvpContext.jsx`, the seat capacity meters, and the student profile to the live RSVP endpoints.
- **Validation:** Conduct rigorous load-testing to ensure zero overbooking during concurrent RSVP requests.

### Module 6: Notifications
**Status:** Pending
**Depends on:** Module 5
**Scope:**
- **Email Delivery:** Set up Amazon Simple Email Service (SES) and an SNS topic (`rsvp-events`) to dispatch transactional emails for RSVP confirmations and waitlist promotions.
- **Scheduled Reminders:** Leverage EventBridge Scheduler to automatically queue and send reminder emails 24 hours before an event begins.
- **In-App Notifications:** Create a lightweight `Notifications` table in DynamoDB and implement polling in the frontend `NotificationContext` to display real-time alerts to the user.

### Module 7: Admin Dashboard & Roster
**Status:** Pending
**Depends on:** Modules 4, 5
**Scope:**
- **Live Reporting:** Build `GET /admin/events/{id}/roster` to serve a list of confirmed and waitlisted students for specific events.
- **Aggregate Stats:** Build `GET /admin/dashboard/stats` to aggregate system-wide RSVP and waitlist counts to populate the admin dashboard tiles.
- **Observability:** Create a comprehensive CloudWatch Dashboard to monitor RSVP volumes, waitlist trends, API latency, and transactional write failures.

### Module 8: Security Hardening, Observability & Launch Prep
**Status:** Pending
**Depends on:** All previous modules
**Scope:**
- **Security:** Deploy AWS Web Application Firewall (WAF) in front of API Gateway with strict rate-limiting rules, specifically targeting the RSVP endpoints.
- **IAM Auditing:** Perform a final review of all Lambda IAM roles to ensure strict least-privilege access.
- **Environments & CI/CD:** Stand up distinct `staging` and `prod` stacks using CDK context, and implement a robust GitHub Actions CI/CD pipeline for automated deployments.
- **Final Validation:** Conduct a comprehensive end-to-end regression test and a realistic-scale load test on the `staging` environment prior to production launch.
