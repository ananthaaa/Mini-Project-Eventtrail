# EventTrail — Sprint Backlog & Status

This document tracks the progress of the EventTrail project, which has been organized into a **6-sprint sprint backlog**. Each sprint is grouped around a core feature area.

Based on the work already completed in the project, Sprints 1, 2, 3, and 5 are fully implemented. We are currently preparing to start **Sprint 4**.

---

## 🏆 Sprint Status Summary

| Sprint | Feature Area | Status |
|--------|--------------|--------|
| **Sprint 1** | Authentication and login | ✅ **Completed** |
| **Sprint 2** | Event discovery | ✅ **Completed** |
| **Sprint 3** | Admin event management | ✅ **Completed** |
| **Sprint 4** | RSVP and waitlist | ⏳ **Pending (Next Up)** |
| **Sprint 5** | Navigation and indoor guidance | ⏳ **Pending (Rebuild)** |
| **Sprint 6** | Notifications and attendance | ⏳ **Pending** |

---

## 📋 Detailed Sprint Backlog

### ✅ Sprint 1: Authentication and Login
**Status:** Completed
*Note: This sprint encompasses the backend infrastructure foundation and AWS Cognito integration.*

| Task ID | Task Description | User Story | Est. Hours |
|---|---|---|---|
| **SB-01** | Configure AWS Cognito user pool and authentication flow | As a user, I want to log in securely so that I can access the platform based on my role. | 8 |
| **SB-02** | Build login page UI and connect it to Cognito | As a user, I want a login page so that I can enter my credentials and sign in. | 6 |

**Technical Achievements:** 
- AWS CDK used to provision DynamoDB tables (`Users`, etc.).
- Cognito User Pool configured with `student` and `admin` groups.
- API Gateway JWT Authorizer secured routes.
- Frontend login UI connected to real Cognito session state.

### ✅ Sprint 2: Event Discovery
**Status:** Completed
*Note: This sprint covers the public read APIs for querying DynamoDB.*

| Task ID | Task Description | User Story | Est. Hours |
|---|---|---|---|
| **SB-03** | Create event discovery page with search and filter options | As a student, I want to discover events so that I can find relevant campus activities. | 10 |
| **SB-04** | Display full event details page | As a student, I want to view event details so that I can decide whether to attend. | 6 |

**Technical Achievements:**
- Deployed Lambda functions for `GET /events`, `GET /clubs`, etc.
- Implemented DynamoDB Global Secondary Index (GSI) filtering for categories and faculties.
- Frontend integrated with the live read APIs, removing all mock JSON data.

### ✅ Sprint 3: Admin Event Management
**Status:** Completed
*Note: This sprint covers the admin authenticated CRUD operations and media uploads.*

| Task ID | Task Description | User Story | Est. Hours |
|---|---|---|---|
| **SB-05** | Build admin dashboard for event management | As an admin, I want to manage events so that I can control campus event publishing. | 10 |
| **SB-06** | Add create, edit, and delete event functionality | As an admin, I want to update event data so that I can keep event information accurate. | 12 |

**Technical Achievements:**
- S3 Bucket configured for direct, CORS-enabled frontend uploads (5MB cap) with public read access.
- Authenticated Lambdas deployed for `POST/PUT/DELETE /events` with strict JWT `custom:clubId` verification to ensure multi-tenant security.
- Frontend `AdminEventForm` integrated with live API and S3 Presigned URLs.

### ⏳ Sprint 4: RSVP and Waitlist
**Status:** Pending (Next Up)

| Task ID | Task Description | User Story | Est. Hours |
|---|---|---|---|
| **SB-07** | Develop RSVP registration feature with capacity check | As a student, I want to RSVP to an event so that I can reserve my seat. | 10 |
| **SB-08** | Implement waitlist management with auto-promotion | As a student, I want to join a waitlist so that I can get a seat if one becomes available. | 12 |

**Technical Focus:**
- DynamoDB `TransactWriteItems` for consistent seat decrements.
- DynamoDB Streams to listen for cancellations and trigger automatic waitlist promotions.
- Connecting the frontend `RsvpContext` to real transactional API endpoints.

### ⏳ Sprint 5: Navigation and Indoor Guidance
**Status:** Pending (Rebuild)
*Note: The previous Mapbox implementation is being deprecated. This sprint involves a complete rebuild using Leaflet, OpenStreetMap, and OpenRouteService as specified in the project requirements.*

| Task ID | Task Description | User Story | Est. Hours |
|---|---|---|---|
| **SB-09** | Develop campus navigation page using map and routing | As a student, I want to navigate to the event venue so that I can reach the location easily. | 14 |
| **SB-10** | Implement geofence detection and indoor guidance steps | As a student, I want indoor directions so that I can reach the exact room after arriving at the building. | 10 |

**Technical Focus:**
- Migrate from Mapbox to Leaflet.js and OpenStreetMap tiles.
- Integrate OpenRouteService for outdoor walking paths and Leaflet Routing Machine for turn-by-turn UI.
- Implement real-time GPS tracking (`navigator.geolocation`) with a 20m geofence trigger for indoor handoff.
- Admin dashboard marker logic updated to use Leaflet draggable pins.

### ⏳ Sprint 6: Notifications and Attendance
**Status:** Pending

| Task ID | Task Description | User Story | Est. Hours |
|---|---|---|---|
| **SB-11** | Implement event reminder and notification system | As a user, I want notifications so that I do not miss important event updates. | 8 |
| **SB-12** | Add attendance tracking and final integration testing | As an admin, I want attendance tracking so that I can monitor event participation and system readiness. | 10 |

**Technical Focus:**
- Amazon SNS and SES integration for email delivery on RSVP/Waitlist actions.
- EventBridge Scheduler for automated T-24h event reminders.
- Admin dashboard endpoints to view confirmed rosters and track live attendance.
