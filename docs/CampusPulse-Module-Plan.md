# CampusPulse — Backend Build Plan (Modules @ 2 Weeks Each)

Companion to `CampusPulse-AWS-Architecture.md`. That doc defines *what* to build; this one breaks it into **8 sequential modules**, each sized for ~2 weeks of solo/small-team work, with clear prerequisites, deliverables, and a "done means" checklist so you know when to move on.

**Total: ~16 weeks.** Modules are ordered by dependency — each one unblocks the next. Don't skip ahead; the RSVP module (5) specifically depends on 2, 3, and 4 being solid.

---

## Module 1 — Infrastructure Foundation & Data Layer
**Depends on:** nothing (start here)
**Unblocks:** everything else

### Scope
- Set up AWS account structure / IAM baseline, pick **CDK (TypeScript)** as IaC tool
- Create `dev` environment stack
- Provision all 7 DynamoDB tables from the architecture doc: `Events`, `Clubs`, `Venues`, `Speakers`, `Users`, `RSVPs`, `PathNodes`/`PathEdges`
- Add GSIs: `Events.byFaculty`, `Events.byCategory`, `Events.byOrganizer`, `RSVPs.byUser`
- Write the one-time seed script (Lambda or local Node script) that loads `src/data/*.json` and `graph.json` into these tables
- Set up CloudWatch log groups + a barebones dashboard placeholder

### Tasks breakdown (2 weeks)
- Days 1–2: CDK project scaffold, `dev` context/config, IAM baseline roles
- Days 3–5: Define all table constructs + GSIs in CDK
- Days 6–8: Seed script — parse each mock JSON file, batch-write into DynamoDB
- Days 9–10: Verify data with AWS CLI / NoSQL Workbench, write a smoke-test script that reads back known items

### Done means
- [ ] `cdk deploy` stands up all 7 tables in `dev`
- [ ] Seed script populates every table from existing mock JSON with zero manual edits
- [ ] You can `GetItem`/`Query` every table via AWS CLI and get back data matching the mock JSON shape

---

## Module 2 — Auth (Cognito)
**Depends on:** Module 1 (needs `Users` table to exist)
**Unblocks:** Modules 4, 5, 6 (anything requiring login)

### Scope
- Cognito User Pool with `student` and `admin` groups
- Custom attributes: `clubId` (for scoping club-admin permissions), `facultyId` (optional)
- Post-confirmation Lambda trigger that creates a matching row in the `Users` DynamoDB table
- Wire up `Login.jsx` / `SignupPage.jsx` to Cognito (via Amplify Auth or direct SDK calls)
- API Gateway JWT authorizer configured (even if no protected routes exist yet — prove it rejects/accepts tokens correctly against a dummy route)

### Tasks breakdown (2 weeks)
- Days 1–3: Cognito User Pool + groups + custom attributes in CDK
- Days 4–5: Post-confirmation Lambda → write to `Users` table
- Days 6–8: Frontend integration — replace `RoleContext`'s toggle with real Cognito sign-in/sign-up/sign-out
- Days 9–10: JWT authorizer on a throwaway `/whoami` test route; verify group claims show up correctly; manual test as both a student and an admin account

### Done means
- [ ] Can sign up, confirm, and log in as a student and separately as an admin
- [ ] `Users` table auto-populates on signup
- [ ] A protected test route correctly rejects unauthenticated calls and returns the right group claim for authenticated ones
- [ ] `RoleContext` in the frontend reflects real Cognito session state, not a manual toggle

---

## Module 3 — Public Read API (Events, Clubs, Venues, Speakers, Graph)
**Depends on:** Module 1
**Unblocks:** frontend can go fully live on read-only screens; Module 5 (RSVP needs `Events` reads)

### Scope
- All public/unauthenticated GET routes from the architecture doc §6.1:
  `/events`, `/events/{id}`, `/clubs`, `/clubs/{id}`, `/venues/{id}`, `/speakers`, `/graph/nodes`, `/graph/edges`
- API Gateway HTTP API setup (no auth required on these routes)
- Query-param filtering on `/events` (`faculty`, `category`, `date`) using the GSIs from Module 1
- Response shapes matched exactly to current mock JSON so frontend components need no changes

### Tasks breakdown (2 weeks)
- Days 1–2: API Gateway HTTP API scaffold in CDK, base routing
- Days 3–6: Lambda per route — `listEvents`, `getEvent` (with speaker/venue batch-get), `listClubs`, `getClub`, `getVenue`, `listSpeakers`
- Days 7–8: `getPathNodes` / `getPathEdges`, plus CloudFront caching consideration for graph routes
- Days 9–10: Swap `src/services/*.js` mock resolvers for real `fetch()` calls; regression-test every read-only screen (`Home`, `EventDiscovery`, `EventDetail`, `ClubDirectory`, `ClubProfile`)

### Done means
- [ ] Every read-only screen in the app works against real API Gateway + DynamoDB, mock JSON no longer used
- [ ] Filter bar in `EventDiscovery.jsx` works via real GSI queries, not client-side filtering
- [ ] Navigation graph (`Navigate.jsx` outdoor phase) loads nodes/edges from the API and A* still runs correctly client-side

---

## Module 4 — Admin CRUD + Media Upload
**Depends on:** Modules 1, 2, 3
**Unblocks:** Module 7 (admin dashboard stats need roster data, tied to Module 5 too)

### Scope
- Authenticated admin routes (§6.3): `createEvent`, `updateEvent`, `deleteEvent`, `createVenue`
- Club-scoped authorization: an admin can only mutate events/venues where `organizerId`/`clubId` matches their Cognito `clubId` attribute
- S3 buckets for event covers, club logos, venue floor-plans (`campuspulse-media/...`)
- Presigned-URL upload flow for `AdminEventForm.jsx` (cover image) and `AdminVenueUpload.jsx` (floor plan)
- CloudFront in front of the media bucket

### Tasks breakdown (2 weeks)
- Days 1–2: S3 buckets + CloudFront distribution for media in CDK
- Days 3–4: Presigned-URL generator Lambda (`getUploadUrl`) + frontend upload wiring
- Days 5–7: `createEvent` / `updateEvent` / `deleteEvent` Lambdas with club-scoped authorization checks
- Days 8–9: `createVenue` Lambda (incl. waypoint editor payload from `AdminVenueUpload.jsx`)
- Days 10: End-to-end test as a club-admin account — create an event with a real uploaded image, confirm it appears correctly in `EventDetail.jsx`

### Done means
- [ ] Admin can create/edit/delete an event through the real UI, and it persists in DynamoDB
- [ ] Uploaded images actually appear via CloudFront URLs on event/club/venue pages
- [ ] An admin from Club A gets a 403 trying to edit Club B's event (authorization scoping verified)

---

## Module 5 — RSVP + Waitlist (Core Transactional Logic)
**Depends on:** Modules 1, 2, 3 (needs `Events`, auth, and event reads)
**Unblocks:** Module 6 (notifications), Module 7 (dashboard stats)
**This is the highest-risk module — give it the full 2 weeks even if it feels smaller in scope.**

### Scope
- `POST /events/{id}/rsvp` — transactional seat-decrement (`TransactWriteItems`) with conditional check on `seatsAvailable > 0`
- Waitlist path: if seats are full, write `status=waitlisted` + `waitlistPosition`
- `DELETE /events/{id}/rsvp` — cancel, increment `seatsAvailable`
- `GET /users/{id}/rsvps` — "my RSVPs" list via `RSVPs.byUser` GSI
- DynamoDB Streams trigger → `promoteWaitlist` Lambda (auto-promotes next waitlisted user on cancellation)
- Wire `RsvpContext` to real endpoints, replacing local-state mutation

### Tasks breakdown (2 weeks)
- Days 1–3: `createRsvp` Lambda with `TransactWriteItems` — this is the trickiest part, get the conditional logic and error handling right first
- Days 4–5: `cancelRsvp` Lambda + `listMyRsvps`
- Days 6–7: DynamoDB Streams → `promoteWaitlist` Lambda, including waitlist-position renumbering
- Days 8–9: Frontend — `RsvpContext` calls real endpoints; seat meter, confirmation screen, and waitlist banner reflect real state
- Days 10: **Load test** — simulate concurrent RSVP requests against a low-seat-count event to confirm no overbooking occurs

### Done means
- [ ] Concurrent RSVP attempts on a nearly-full event never oversell seats (verified under load test, not just manual clicking)
- [ ] Cancelling a confirmed RSVP correctly promotes the top of the waitlist
- [ ] `RsvpConfirmation.jsx` and `StudentProfile.jsx` reflect real backend state end-to-end

---

## Module 6 — Notifications
**Depends on:** Module 5
**Unblocks:** nothing further, but polishes Modules 5 & 7

### Scope
- SNS topic `rsvp-events`; SES for email (RSVP confirmed, waitlist promoted)
- EventBridge Scheduler rule per event → reminder email T-1 day before
- Lightweight `Notifications` table + polling from `NotificationContext` (real-time push via AppSync/WebSocket is explicitly out of scope for this module — note it as a v2 follow-up)

### Tasks breakdown (2 weeks)
- Days 1–2: SES domain/identity verification, SNS topic setup
- Days 3–4: Wire `createRsvp` and `promoteWaitlist` Lambdas to publish to SNS → SES email
- Days 5–7: `Notifications` table + `NotificationContext` polling integration in the frontend
- Days 8–10: EventBridge Scheduler rule creation on event-create (`createEvent` Lambda schedules a T-1-day reminder job), test end-to-end

### Done means
- [ ] Confirming an RSVP triggers a real email
- [ ] Getting promoted off a waitlist triggers a real email + shows up in-app via `NotificationContext`
- [ ] A scheduled reminder actually fires the day before a test event

---

## Module 7 — Admin Dashboard & Roster
**Depends on:** Modules 4, 5
**Unblocks:** nothing further — this is largely a reporting layer on top of existing data

### Scope
- `GET /admin/events/{id}/roster` — confirmed + waitlisted lists for `AdminRoster.jsx`
- `GET /admin/dashboard/stats` — aggregate RSVP/waitlist counts per event for `AdminDashboard.jsx` stat tiles
- CloudWatch dashboard for RSVP volume, waitlist size trend, API latency

### Tasks breakdown (2 weeks)
- Days 1–4: `getRoster` Lambda, frontend wiring for `AdminRoster.jsx`
- Days 5–7: `getDashboardStats` Lambda (aggregation logic — consider whether to compute on read or maintain running counters)
- Days 8–10: CloudWatch dashboard + alarms (Lambda error rate, DynamoDB throttling, RSVP conditional-write failure rate)

### Done means
- [ ] `AdminDashboard.jsx` shows live, correct RSVP/waitlist counts per event
- [ ] `AdminRoster.jsx` shows the real confirmed + waitlisted student lists
- [ ] CloudWatch dashboard gives you a single place to watch system health

---

## Module 8 — Security Hardening, Observability & Launch Prep
**Depends on:** all previous modules
**Unblocks:** production launch

### Scope
- AWS WAF in front of API Gateway (rate limiting on the RSVP endpoint especially)
- Tighten IAM roles to least-privilege per Lambda (audit, don't just trust Module 1–7 defaults)
- Stand up `staging` and `prod` environments via CDK context
- Full regression pass across every screen against `staging`
- Final load test on RSVP endpoint at realistic scale (simulate a real event launch spike)
- CI/CD pipeline (GitHub Actions) for automated `dev`/`staging`/`prod` deploys

### Tasks breakdown (2 weeks)
- Days 1–2: WAF rules + rate limiting on `/events/{id}/rsvp`
- Days 3–4: IAM audit — confirm every Lambda's role is scoped to only what it needs
- Days 5–6: `staging` + `prod` CDK stacks, deploy and smoke-test both
- Days 7–8: GitHub Actions CI/CD pipeline (build → test → deploy per environment)
- Days 9–10: Full end-to-end regression test + realistic-scale RSVP load test on `staging`

### Done means
- [ ] WAF actively blocking abusive request patterns in testing
- [ ] Every Lambda role reviewed and scoped down
- [ ] `staging` and `prod` both deployable via a single CI/CD pipeline
- [ ] Load test confirms the system holds up under a simulated real event-RSVP spike without overbooking or 5xx storms

---

## Summary Timeline

| Module | Weeks | Focus |
|---|---|---|
| 1 | 1–2 | Infra + DynamoDB data layer |
| 2 | 3–4 | Cognito auth |
| 3 | 5–6 | Public read API |
| 4 | 7–8 | Admin CRUD + media upload |
| 5 | 9–10 | RSVP + waitlist (transactional core) |
| 6 | 11–12 | Notifications |
| 7 | 13–14 | Admin dashboard & roster |
| 8 | 15–16 | Hardening & launch prep |

**Critical path:** 1 → 2 → 3 → 5 is the minimum chain to get a *functionally complete* student-facing app (browse + RSVP) live. Modules 4, 6, 7, 8 can be reordered somewhat if you need the admin side or launch hardening sooner — but don't attempt Module 5 before 2 and 3 are solid, and don't skip the load-testing step in Module 5 no matter how tight the schedule gets.
