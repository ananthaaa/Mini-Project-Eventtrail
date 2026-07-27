# CampusPulse — AWS Serverless Backend Architecture Plan

**Companion backend for:** EventTrail-UI (CampusPulse) — a React/Vite frontend currently running on local mock JSON (`src/data/*.json`) and React Context (`RsvpContext`, `NavModeContext`, `RoleContext`, `NotificationContext`).

**Goal of this document:** define a real, serverless AWS backend that the existing frontend can be pointed at with minimal rewiring — matching the entities, screens, and flows already built (event discovery → RSVP/waitlist → outdoor+indoor navigation → clubs → admin CRUD).

---

## 1. Guiding Principles

- **Serverless-first**: no servers to patch/scale; pay-per-use fits a campus-scale app with bursty traffic around event RSVP windows.
- **Single-table-friendly but pragmatic**: use a handful of purpose-built DynamoDB tables (mirrors the existing mock JSON files almost 1:1), rather than forcing one mega single-table design the team doesn't need yet.
- **Match existing frontend contracts**: keep response shapes close to `events.json`, `clubs.json`, `venues.json`, `speakers.json`, `users.json`, `graph.json` so `src/services/*.js` only needs new `fetch` calls, not data-remapping.
- **Auth-aware, not auth-heavy**: `RoleContext` today is a UI toggle (student/admin); the backend should replace it with real Cognito groups without changing how pages consume "current role."
- **Keep navigation client-side**: A* pathfinding stays in the browser (as designed in `map.md`); AWS only needs to serve the graph (`PathNodes` / `PathEdges`) and indoor waypoints.

---

## 2. High-Level Architecture Diagram

```
┌──────────────────────┐
│  React (Vite) SPA    │  Hosted on S3 + CloudFront
│  EventTrail-UI        │
└──────────┬────────────┘
           │ HTTPS (fetch / axios)
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Amazon API Gateway (HTTP API)               │
│  /events  /clubs  /venues  /speakers  /users  /rsvp  /graph    │
│  /admin/*                                   JWT Authorizer     │
└───────┬───────────────────────────────────────┬────────────────┘
        │                                       │
        ▼                                       ▼
┌────────────────────┐               ┌─────────────────────────┐
│  Amazon Cognito     │               │  AWS Lambda functions    │
│  User Pool          │◄──authorizer──│  (Node.js, one per       │
│  - student group    │               │   resource/action)       │
│  - admin group       │              └──────────┬────────────────┘
└────────────────────┘                          │
                                                  ▼
                                    ┌───────────────────────────┐
                                    │   Amazon DynamoDB           │
                                    │  Events, Clubs, Venues,     │
                                    │  Speakers, Users, RSVPs,    │
                                    │  PathNodes, PathEdges       │
                                    └──────────┬──────────────────┘
                                               │ Streams
                                               ▼
                                    ┌───────────────────────────┐
                                    │  DynamoDB Streams → Lambda  │
                                    │  (seat-count / waitlist     │
                                    │   promotion trigger)        │
                                    └──────────┬──────────────────┘
                                               ▼
                                    ┌───────────────────────────┐
                                    │  Amazon SNS / SES           │
                                    │  RSVP confirmed, waitlist    │
                                    │  promoted, event reminders   │
                                    └───────────────────────────┘

Supporting services (cross-cutting):
  S3            → event cover images, club logos, venue floor-plan images/SVGs
  CloudWatch    → logs, alarms, dashboards
  CloudFront    → SPA CDN + S3 asset CDN
  Route 53      → DNS
  ACM           → TLS certs
  IAM           → least-privilege execution roles per Lambda
  AWS WAF       → API Gateway protection (rate limiting, common exploits)
  Secrets Mgr   → any third-party keys (e.g. map tile provider)
```

---

## 3. Frontend Hosting

| Component | Service | Notes |
|---|---|---|
| Static SPA build (`npm run build` → `dist/`) | **S3 (static website / private bucket)** | Origin for CloudFront |
| CDN + HTTPS | **CloudFront** | Caches JS/CSS/images; SPA fallback routing (403/404 → `index.html`) for React Router |
| Custom domain | **Route 53 + ACM** | `campuspulse.app` → CloudFront distribution |
| CI/CD | **GitHub Actions / Amplify Hosting (optional)** | On push to `main`: build → sync to S3 → CloudFront invalidation |

> Alternative: use **AWS Amplify Hosting** directly for the SPA if the team wants git-push deploys without hand-rolling the S3+CloudFront pipeline. Either works; the API layer below is unaffected.

---

## 4. Authentication & Roles

Replaces `RoleContext`'s UI-only toggle with real identity.

- **Amazon Cognito User Pool**
  - Two groups: `student`, `admin` (club admins). Optional `super-admin` for platform-level admin dashboard access.
  - Hosted UI or custom `Login.jsx` / `SignupPage.jsx` (already present) call Cognito via **Amplify Auth** or direct `InitiateAuth` calls through a thin Lambda.
  - Custom attribute `facultyId` / `clubId` for scoping club-admin permissions (an admin can only edit events for their own club).
- **API Gateway JWT Authorizer** validates the Cognito-issued ID token on every protected route (`/rsvp`, `/admin/*`).
- Public, read-only routes (`/events`, `/clubs`, `/venues`, `/speakers`, `/graph`) can remain unauthenticated (or authenticated-but-permissive) so browsing doesn't require login, matching the current UX where discovery happens before RSVP.

---

## 5. Data Model (DynamoDB)

Each table below maps directly to an existing mock file, so the Lambda response can be near-identical to what `src/data/*.json` already returns — minimizing frontend changes.

### 5.1 `Events`
| Attribute | Type | Notes |
|---|---|---|
| `id` (PK) | String | e.g. `hackathon-2026` |
| `title`, `description`, `coverImage`, `date`, `time`, `faculty`, `category` | String | |
| `organizerId` | String | FK → `Clubs.id` |
| `venueId` | String | FK → `Venues.id` |
| `speakerIds` | List\<String\> | FK → `Speakers.id` |
| `seatsTotal`, `seatsAvailable`, `rsvpCount`, `waitlistCount` | Number | Updated atomically on RSVP (see §6.2) |
| `schedule` | List\<Map\> | `{time, title, desc}` |
| GSI: `byFaculty` (`faculty`), `byCategory` (`category`), `byOrganizer` (`organizerId`) | | Powers `EventDiscovery.jsx` filter bar without a full scan |

### 5.2 `Clubs`
`id` (PK), `name`, `logo`, `bgGrad`, `description`, `memberIds` (List), `eventIds` (List).

### 5.3 `Venues`
`id` (PK), `name`, `building`, `outdoorCoordinates` (List\<Number\>), `distance`, `timeEstimation`, `waypoints` (List\<Map\> — `{step, instruction, details, x, y}`).

### 5.4 `Speakers`
`id` (PK), `name`, `role`, `company`, `avatarText`, `avatarColor`.

### 5.5 `Users`
`id` (PK, = Cognito `sub`), `name`, `avatar`, `role` (`student`|`admin`), `rsvps` (List\<String\>), `clubId` (nullable, for club admins).

### 5.6 `RSVPs` (new — not a mock file today, but implied by `RsvpContext` + seat meter logic)
| Attribute | Type | Notes |
|---|---|---|
| `eventId` (PK) | String | |
| `userId` (SK) | String | Composite key enforces one RSVP per user per event |
| `status` | String | `confirmed` \| `waitlisted` \| `cancelled` |
| `seatNumber` | Number | Assigned on confirm |
| `waitlistPosition` | Number | Assigned when `status = waitlisted` |
| `createdAt` | String (ISO) | |
| GSI: `byUser` (`userId`) | | Powers `StudentProfile.jsx` "my RSVPs" list |

### 5.7 `PathNodes` / `PathEdges` (from `map.md`, already scoped)
As specified in `map.md` §Step 4 — `PathNodes {nodeId (PK), lat, lng, type, label}` and `PathEdges {edgeId (PK), fromNode, toNode, distance}`. Seeded once from `graph.json` via a one-time Lambda/script; read-only at runtime.

> **Why not one single DynamoDB table?** The data is genuinely heterogeneous (events, clubs, venues, graph nodes) with different access patterns and low join complexity — separate tables keep the Lambda code simple and match the mock-JSON mental model the team already has. Revisit single-table design only if item count/cost becomes a real concern.

---

## 6. API Layer (API Gateway HTTP API + Lambda)

One Lambda per logical action (or grouped by resource with an internal router — either works; Lambda-per-route keeps cold starts small and IAM scoping tight).

### 6.1 Public / read routes
| Route | Method | Lambda | DynamoDB access |
|---|---|---|---|
| `/events` | GET | `listEvents` | Scan/Query `Events` (supports `?faculty=`, `?category=`, `?date=` via GSIs) |
| `/events/{id}` | GET | `getEvent` | GetItem `Events`, batch-get `Speakers`, `Venues` |
| `/clubs` | GET | `listClubs` | Scan `Clubs` |
| `/clubs/{id}` | GET | `getClub` | GetItem `Clubs` + batch-get member `Users`/`Speakers` |
| `/venues/{id}` | GET | `getVenue` | GetItem `Venues` |
| `/speakers` | GET | `listSpeakers` | Scan `Speakers` |
| `/graph/nodes` | GET | `getPathNodes` | Scan `PathNodes` |
| `/graph/edges` | GET | `getPathEdges` | Scan `PathEdges` |

### 6.2 Authenticated student routes
| Route | Method | Lambda | Logic |
|---|---|---|---|
| `/events/{id}/rsvp` | POST | `createRsvp` | **Conditional transactional write** (`TransactWriteItems`): decrement `Events.seatsAvailable` only if `> 0`; on success write `RSVPs` item with `status=confirmed` + `seatNumber`; on failure (seats = 0) write `status=waitlisted` + next `waitlistPosition`. Prevents overbooking race conditions. |
| `/events/{id}/rsvp` | DELETE | `cancelRsvp` | Deletes/updates `RSVPs` item, increments `seatsAvailable`, triggers waitlist-promotion stream (see §6.4) |
| `/users/{id}/rsvps` | GET | `listMyRsvps` | Query `RSVPs` GSI `byUser` |
| `/users/{id}` | GET/PUT | `getUser` / `updateUser` | Profile read/edit (`StudentProfile.jsx`) |

### 6.3 Authenticated admin routes (Cognito `admin` group required; scoped to own `clubId`)
| Route | Method | Lambda |
|---|---|---|
| `/admin/events` | POST | `createEvent` |
| `/admin/events/{id}` | PUT / DELETE | `updateEvent` / `deleteEvent` |
| `/admin/venues` | POST | `createVenue` (incl. presigned S3 upload for floor-plan image, per `AdminVenueUpload.jsx`) |
| `/admin/events/{id}/roster` | GET | `getRoster` — Query `RSVPs` by `eventId`, returns confirmed + waitlisted lists for `AdminRoster.jsx` |
| `/admin/dashboard/stats` | GET | `getDashboardStats` — aggregate RSVP/waitlist counts per event for `AdminDashboard.jsx` stat tiles |

### 6.4 Event-driven: waitlist promotion
- **DynamoDB Streams** on `RSVPs` (or on `Events.seatsAvailable` change) → **Lambda `promoteWaitlist`**:
  1. Triggered when a `confirmed` RSVP is cancelled/deleted.
  2. Finds the lowest `waitlistPosition` for that `eventId`.
  3. Transactionally flips that RSVP to `confirmed`, assigns a `seatNumber`, decrements everyone else's `waitlistPosition` by one.
  4. Publishes an **SNS** notification → **SES** email (or in-app notification via `NotificationContext`) telling the promoted user they're in.
- This directly replaces the "Seat full? → Waitlist Banner" logic currently faked in `RsvpContext`.

---

## 7. File / Media Storage

| Content | Bucket | Notes |
|---|---|---|
| Event cover images | `campuspulse-media/events/` | Uploaded by admins via presigned S3 URL from `createEvent`/`updateEvent` Lambda |
| Club logos | `campuspulse-media/clubs/` | |
| Venue floor-plan images/SVGs | `campuspulse-media/venues/` | Matches `AdminVenueUpload.jsx`'s "image upload zone" |
| SPA build assets | separate `campuspulse-frontend` bucket | Served via CloudFront, not this media bucket |

All media served through **CloudFront** (not direct S3 URLs) for caching + custom domain + optional signed URLs if content needs to be gated.

---

## 8. Notifications

| Trigger | Channel | Service |
|---|---|---|
| RSVP confirmed | Email | SES (via SNS topic `rsvp-events`) |
| Waitlist promoted | Email + in-app | SES + a lightweight `Notifications` DynamoDB table polled/subscribed by `NotificationContext` (or upgraded to **AppSync subscription / WebSocket API** later for real-time push) |
| Event reminder (T-1 day) | Email | **EventBridge Scheduler** rule per event → Lambda → SES |

> Real-time push (e.g. "you've been promoted off the waitlist" appearing instantly in the UI) is the one place this plan recommends a follow-up: either **API Gateway WebSocket API** or **AWS AppSync** with GraphQL subscriptions. Not required for v1 — polling `/users/{id}/rsvps` on a timer is a fine MVP.

---

## 9. Geolocation / Navigation Backend Notes

Per `map.md`, the heavy lifting (A* pathfinding) stays **client-side in React** — AWS's only job is:
1. Serve `PathNodes` / `PathEdges` (static-ish, rarely-changing reference data — good candidate for **CloudFront caching** on top of the GET routes, or even a nightly export to a static JSON file in S3 instead of live DynamoDB reads).
2. Serve `Venues.waypoints` for the indoor SVG step tracker.
3. No server-side routing engine, no AWS Location Service required for v1 — the existing GeoJSON-graph + client A* approach is deliberately kept.

If the project later needs *real* GPS geofencing (rather than the current "Simulate Arrival" button), **AWS Location Service Geofencing** is the natural upgrade path — but that's out of scope for matching the current UI build.

---

## 10. IAM & Security

- One **execution role per Lambda**, scoped to only the DynamoDB table(s)/S3 prefix it touches (no shared "god role").
- API Gateway routes protected by **Cognito JWT authorizer**; admin routes additionally check `cognito:groups` contains `admin` and (for scoped actions) that the resource's `organizerId`/`clubId` matches the caller's `clubId` custom attribute.
- **AWS WAF** in front of API Gateway: rate-limiting (protects the RSVP endpoint from bot-driven seat-sniping/spam), basic managed rule sets.
- S3 buckets private by default; access only via CloudFront (OAC) or presigned URLs for uploads.
- Secrets (if any third-party API keys are added later, e.g. a paid map tile provider) go in **Secrets Manager**, injected into Lambda via environment variables at deploy time — never hardcoded.

---

## 11. Observability

- **CloudWatch Logs** per Lambda (structured JSON logging recommended).
- **CloudWatch Alarms**: error rate per Lambda, DynamoDB throttling, API Gateway 5xx rate, `RSVPs` conditional-write failure rate (signals seat-contention hot spots).
- **CloudWatch Dashboard**: RSVP volume, waitlist size trend, active events, API latency (p50/p95).
- **X-Ray** (optional) for tracing the RSVP → stream → promote-waitlist → SNS chain during load testing before a big event launch.

---

## 12. Infrastructure as Code & Environments

- **AWS SAM** or **CDK (TypeScript)** — recommended given the rest of the stack is JS/TS; CDK constructs map cleanly to: 1 stack for data (DynamoDB tables), 1 stack for API (Gateway + Lambdas + Cognito), 1 stack for frontend hosting (S3 + CloudFront).
- Three environments: `dev`, `staging`, `prod` — separate Cognito pools, tables, and API stages, deployed via CI (GitHub Actions: `cdk deploy --context env=dev|staging|prod`).
- `dev` stage is what `src/services/*.js` should target once mock data is swapped for real `fetch` calls (replace the `setTimeout`-wrapped mock resolvers in `mapService.js` and siblings with real endpoint calls, keeping the same return shapes).

---

## 13. Migration Path from Current Mock-Data Build

1. Stand up `dev` environment (Cognito pool, DynamoDB tables, API Gateway, Lambdas) via CDK.
2. Seed all seven tables from the existing `src/data/*.json` files (one-time Lambda/script — same pattern already sketched in `map.md` for `graph.json`).
3. In `src/services/*.js`, replace each mock `Promise`/`setTimeout` resolver with a real `fetch(API_BASE_URL + '/...')` call, keeping response shape identical so components (`EventCard`, `ScheduleTimeline`, etc.) need zero changes.
4. Swap `RoleContext`'s UI toggle for real Cognito sign-in (`Login.jsx` / `SignupPage.jsx` already exist as the UI shell).
5. Wire `RsvpContext` to call `/events/{id}/rsvp` instead of mutating local state, and subscribe (or poll) `/users/{id}/rsvps` for status changes.
6. Point `AdminVenueUpload.jsx` at the presigned-S3-upload flow instead of a mocked "upload zone."
7. Load-test the RSVP endpoint specifically (transactional seat-decrement under concurrency) before any real event launch — this is the single highest-risk path (overbooking).

---

## 14. Cost Shape (rough, for a single-campus scale app)

- DynamoDB: on-demand billing mode — negligible cost at hundreds/low-thousands of users; scales automatically for RSVP bursts.
- Lambda: pay-per-invocation, effectively free-tier at this scale.
- API Gateway (HTTP API, not REST API): cheaper per-request than REST API; fine for this use case.
- S3 + CloudFront: minor cost for images + SPA hosting.
- Cognito: free up to 10,000 MAUs, which comfortably covers a campus.

This architecture should stay well within (or very close to) AWS Free Tier for a single-institution deployment, scaling smoothly if adopted by multiple campuses later (one option: `campusId` becomes a partition key prefix across all tables for multi-tenancy).
