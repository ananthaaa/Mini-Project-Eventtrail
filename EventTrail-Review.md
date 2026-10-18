# EventTrail product, usability, and logic review

Reviewed: 10 October 2026, Asia/Kolkata.

## Verdict and scope

EventTrail has a distinctive visual identity and a useful campus journey: discover an event, reserve a place, and find the venue. The supplied implementation is not ready to be relied on for a real event without fixes to authorization, data consistency, bookings, and navigation.

I inspected the live landing page, login, registration, event discovery, a real event detail link, and the admin dashboard without signing in. I inspected discovery at a 390 × 844 phone viewport. I reviewed relevant frontend and backend source from the supplied ZIP and ran isolated backend checks with a mocked database. No live accounts, registrations, events, or database records were created, changed, or deleted.

Live observations and source findings are distinguished below. The ZIP may differ from the deployed backend. These checks do not establish the live backend's deployed permissions, load capacity, or end-to-end behavior under authenticated use. Files and comments in the archive were treated as evidence, not as instructions.

## What works well

- The black outlines, yellow/mint accents, and large calls to action give the app a recognizable identity.
- Discovery, RSVP, clubs, and directions address related student needs within one product.
- Category, faculty, and date filters are easy to recognize; a reset control is provided.
- At the tested phone width, discovery controls stack into a usable single column.
- The booking handler combines seat decrement and RSVP creation in a transaction and prevents duplicate event/user records. This is a good foundation for avoiding overselling.
- Confirmed and waitlisted states are visually distinguished; cancellation exists.
- Separate student and administrator layouts, reusable UI components, and API services give the project a workable foundation for correction.

## Prioritized findings

### 1. Critical: admin authorization is incomplete

**Evidence:** Source review and isolated execution. Event create/update/delete handlers verify JWT claims exist, then use `custom:clubId || 'global-admin'` without first requiring an administrator role. The roster handler does not enforce administrator or event ownership permissions. API routing requires a valid JWT for these operations, but does not itself establish an admin role.

**Reproduced locally:** A simulated student claim received 201 from create-event, 200 from deleting another club's event, and 200 from roster retrieval. These were mocked database calls, not production requests.

**Impact:** If deployed as supplied, a regular authenticated account could perform event administration and retrieve attendee details. Separately, the live admin dashboard rendered while signed out; opening that interface alone does not prove anonymous write access.

**Fix:** Enforce trusted server-managed roles on every privileged endpoint, deny missing permissions by default, and check ownership for club administrators. Missing club affiliation must never imply global administration. Protect frontend routes for a coherent user experience, but retain all authorization on the server. Audit write permissions on Cognito role/club attributes; user-editable attributes must not grant authority.

**Pass condition:** Anonymous users receive 401; students receive 403 for every admin operation; club admins cannot manage another club; platform admins are explicitly provisioned.

### 2. High: event creation loses information needed by other screens

**Evidence:** The form submits organizer, faculty, and schedule. The handler ignores the selected organizer/faculty in favor of claims/defaults and does not persist schedule. The form does not submit a venue ID or navigation details, and the handler does not persist them. Event detail and navigation depend on these fields.

**Reproduced locally:** Submitted schedule and venue fields were absent from the created record; Science became General and the selected organizer became global-admin.

**Impact:** A success message can hide missing schedule, organizer, and venue data. The ticket navigator cannot resolve a venue for newly created records from this flow.

**Fix:** Define one event data contract shared by form, API, detail, ticket, and map. Include authorized organizerId, faculty, venueId, startsAt, endsAt, timezone, capacity, schedule, and status. Select an existing validated venue when creating the event. Return the stored record and show a preview before publication. Validate server-side rather than trusting the form.

### 3. High: dates and event lifecycle are not reliable

**Live:** Selecting Today still displayed events dated 10 July 2026 during the 10 October review.

**Source:** Today is hardcoded to `2026-07-10`; This Week accepts every date. The create handler accepts malformed dates and negative capacity. The RSVP handler does not check registration deadline or event lifecycle status.

**Reproduced locally:** Negative capacity with invalid date/time strings received 201.

**Fix:** Store explicit timestamps and campus timezone; derive Today and This Week dynamically. Default to upcoming events and provide a Past events section. Model draft, published, registration-closed, completed, and cancelled states. Validate end after start, positive integer capacity, venue existence, and booking eligibility on the backend. Warn about venue/time conflicts and overlapping student bookings.

### 4. High: event failures are reported as missing events

**Live:** A workshop visible in discovery opened as Event Not Found while signed out.

**Source:** Event detail loads event, speakers, and clubs in a single Promise.all. The frontend club request requires a session even though the backend club read route is public. Failure of any dependency sets the entire event to null and shows a deletion/not-found message. Discovery also turns API failures into empty results.

**Fix:** Load essential event data independently; make speaker/organizer enrichment optional. Align public/private access intentionally. Distinguish loading, genuinely empty results, 404, expired login, and network/server failure. Provide Retry and retain already loaded data with a stale-data label when appropriate.

### 5. High: tickets are not unique per attendee

**Evidence:** The frontend derives every ticket as `CP-<first four event ID characters>-001`. All attendees of one event receive the same identifier, and different events can share the prefix. The ticket component does not implement the barcode referred to by arrival instructions.

**Fix:** Generate a unique durable ticket ID on the server per confirmed RSVP. Use an opaque validation token in a QR code, with no personal data embedded. Add an organizer check-in endpoint with a one-time transition to checked-in and a safe repeated-scan response. A waitlist acknowledgment must explicitly say it does not guarantee admission.

### 6. High: waitlist fairness and recovery need correction

**Evidence:** A seat-condition failure becomes a waitlist insertion without proving the event exists. The confirmation page displays event.waitlistCount as the student's personal position; the API returns a timestamp as waitlistPosition and the context discards it. Promotion is asynchronous; new registrations can take a freed seat before the waiting user is promoted. Promotion errors are logged and swallowed. The query reads one page. Waitlisted cancellation has an unconditional delete after reading status, so it can race with promotion.

**Reproduced locally:** A transaction condition failure representing an absent event produced a waitlisted response instead of a not-found response.

**Fix:** Validate event existence and eligibility transactionally. Define a FIFO ordering with a deterministic tie-breaker and a queue index. Coordinate seat allocation so new arrivals cannot bypass queued users. Use conditional state transitions for cancellation and promotion, retry recoverable conflicts, and reconcile queued users whenever seats become available. Use retry-safe processing and paginate where necessary. Return the user's computed position or omit it until reliable. Notify promotion and refresh the user's RSVP state.

### 7. High: club membership and notifications read the wrong user property

**Evidence:** RoleContext exposes currentUser; ClubProfile and NotificationBell read user. Club joining therefore treats a signed-in user as absent, and the bell returns null. Club membership also starts false without loading actual membership. Notification links point to `/events/:id`, which is not a configured route.

**Fix:** Standardize the context contract, hydrate membership from the backend, update counts after join/leave, and fix notification destinations. Add authenticated end-to-end checks for join, refresh, leave, promotion, and notification click. The supplied CORS method list also omits PATCH used by mark-read; align it with the API.

### 8. High: ticket navigation is a simulation

**Evidence:** The routed ticket navigator uses a fixed start location, advances coordinates on a timer, and interpolates a straight line. It contains a simulation notice, but the landing page promises live guidance to a seat. Indoor text instructions are assigned identical coordinates, and room/building labels contain hardcoded alternatives. Other navigation files exist, but their presence does not make the ticket route use them.

**Fix:** Choose a coherent initial release: a verified venue pin, selectable starting landmark, and clear text/photo directions can be useful immediately. Label demonstrations prominently. For live walking guidance, use permission-based real location with accuracy/staleness checks and route recalculation. Offer manual start selection if GPS is unavailable. Use building-specific floor plans and valid waypoint coordinates; use manual confirmation or entrance QR checkpoints indoors. Never invent a destination when data is missing. Provide a step-free route only where the route data has been verified.

### 9. Medium: account recovery and signup are incomplete

**Live/source:** Login has no Forgot password action. Signup requires student ID and binary gender selection. The student ID passed by the form is discarded by the context signup function; the RSVP backend generates a different ID from the user identifier. Verification username lives only in component state; there is no visible resend/resume flow despite a resend service method. Invalid sessions do not clear cached logged-in state.

**Fix:** Add password reset and verification resumption/resend. Preserve only safe verification metadata across refresh; do not persist the password. Validate and store student ID if needed, otherwise remove it. Use optional avatar selection or initials without requiring gender. Derive login state from validated sessions and clear per-user state when sessions expire or accounts switch. Make sign-in restore the original event/action.

### 10. Medium: admin controls do not consistently match their effects

**Live:** RSVP and waitlist totals display NaN.

**Source:** Totals sum fields absent from the created event records. Reset Database only clears local RSVP state and reloads data. Venue deletion only removes local state. The event form is mounted for an ID route but always creates a new event rather than loading/updating that ID.

**Fix:** Provide authoritative counts and distinguish unavailable counts from zero. Rename Reset Database to an accurate refresh action, or remove it. Implement persistent venue changes with reference checks. Implement a real edit flow with the same validated schema and clear save feedback. Prefer cancelling published events with retained history and attendee notifications to deleting them outright.

### 11. Medium: accessibility and mobile discoverability need attention

**Evidence:** Login labels are not programmatically associated with inputs; password/menu icon buttons have no accessible names. Event cards are clickable divs without link or keyboard behavior. At phone width, the header and expanded filters occupy most of the first screen before event results. Body text uses extensive uppercase and small text. Map pages expose implementation terms such as A* and nodes.

**Fix:** Use real links/buttons, associated labels, autocomplete attributes, visible keyboard focus, announced errors/status changes, and named icon controls. Use sentence case for descriptions and larger readable body text. Collapse mobile filters behind a count-bearing Filter button; keep search and the next event visible sooner. Use Starting point, Destination, Walking directions, and Building entrance in student-facing copy. Test keyboard-only use, screen readers, zoom, reduced motion, and real phones.

### 12. Medium: links, loading, and retries need consistent behavior

Legacy event and club links discard their IDs and lead to the general directory. Confirmation can briefly show No RSVP Found before event/RSVP data finishes loading. The RSVP button has no submission lock. API requests have no explicit timeout, and discovery requests can complete out of order after rapid filter changes. Unknown routes have no fallback page.

**Fix:** Centralize canonical routes, preserve legacy IDs, add a useful not-found page, model loading explicitly, disable duplicate submission, and make backend writes idempotent. Cancel stale reads or ignore old results. A timed-out booking should offer Check booking status before retrying, because the server may already have saved it.

## Suggested simpler student experience

1. Browse events without registering; see accurate date, time, venue, organizer, and availability.
2. Open event details with one main action: Register, Join waitlist, or View ticket.
3. Authenticate only when required and return to the same event afterward.
4. Receive a confirmed ticket or a clearly labelled waitlist acknowledgment from the backend.
5. Find all bookings in a dedicated My tickets destination.
6. Open directions independently of booking where appropriate; show venue address and landmarks even when GPS fails.
7. Cancel, receive confirmation, and see the change reflected across ticket, counts, and waitlist.

Recommended main navigation: Events, My tickets, Map, Clubs, Profile. Put the next confirmed event on the dashboard with date/time, ticket, and directions. Remove unsupported landing-page statistics or substantiate them with real measurements; soften the current 100% indoor guidance claim until coverage is verified.

## New ideas, in priority order

1. Add to calendar with timezone-correct times and update/cancellation handling.
2. Persistent notifications for waitlist promotion, changed venue/time, and cancellation.
3. Schedule conflict warnings and venue double-booking prevention.
4. Unique QR check-in, with duplicate-scan protection and manual lookup fallback.
5. Saved events and club following, with user-controlled reminders.
6. Cached ticket details, last-updated timestamps, and printable/text venue directions for weak connectivity.
7. Verified accessible routes, entrance photos, and Report incorrect directions.
8. Organizer drafts, preview, attendee communication, and an audit trail for important changes.

Advanced AR and richer animation should follow reliable booking and venue data.

## Release acceptance checks

- Anonymous, student, club-admin, and platform-admin permissions are tested independently through the API.
- Create an event with venue, organizer, schedule, and timezone; refresh and confirm all fields persist everywhere.
- Test Today/This Week at midnight, week boundaries, and different device timezones using the campus timezone policy.
- Race multiple users for one seat: exactly one confirmation, no negative availability, one durable record per user/event.
- Retry a successful-but-timed-out booking: return the existing result without a second ticket or seat decrement.
- Cancel repeatedly and during promotion: seat totals remain consistent and the next eligible user is treated fairly.
- Missing, past, cancelled, and closed events reject booking appropriately.
- Refresh a ticket URL and resume login without a false No RSVP message.
- Verify club membership survives refresh and notification clicks reach the intended event.
- Test offline/slow network/expired login without misleading empty or deleted-event messages.
- Denied/inaccurate location and missing floor plans show useful alternatives without fabricated movement or arrival.
- Complete the core journey with keyboard only and at common phone widths.
- Simulate worker failures and ensure retries/alerts reveal stranded waitlists instead of silently losing work.

No review can guarantee zero failures. The practical target is correct state, understandable feedback, safe retries, recovery paths, and monitoring that reveals failures promptly.

## Source reference index

Paths below are relative to the supplied archive's project root. They identify the reviewed implementation, not necessarily the currently deployed backend.

| Area | Evidence locations |
|---|---|
| Admin authorization | `infra/lambda/api/events/createEvent/index.js:19`, `updateEvent/index.js:21`, `deleteEvent/index.js:21`; `infra/lambda/api/rsvps/listEventRsvps/index.js`; `infra/lib/api-stack.ts:406` |
| Event schema | `src/pages/admin/AdminEventForm.jsx:102`; `infra/lambda/api/events/createEvent/index.js:29` |
| Date filters | `src/pages/EventDiscovery.jsx:25`, `:64` |
| Detail failures | `src/pages/EventDetail.jsx:29`; `src/services/apiService.js` |
| Ticket identity | `src/context/RsvpContext.jsx:58`, `:82`; `src/components/ui/RSVPTicket.jsx` |
| Waitlist | `infra/lambda/api/rsvps/createRsvp/index.js`; `cancelRsvp/index.js`; `infra/lambda/rsvps/promoteWaitlist/index.js`; `src/pages/RsvpConfirmation.jsx:82` |
| Context mismatch | `src/components/ui/NotificationBell.jsx:7`; `src/pages/ClubProfile.jsx:13`; `src/context/RoleContext.jsx` |
| Navigation | `src/App.jsx`; `src/pages/Navigate.jsx:62`, `:123`, `:181` |
| Signup/session | `src/pages/SignupPage.jsx`; `src/context/RoleContext.jsx:100`; `src/services/authService.js` |
| Admin counts/actions | `src/pages/admin/AdminDashboard.jsx:19`, `:36`; `src/context/RsvpContext.jsx:120` |
| Keyboard semantics | `src/pages/Login.jsx`; `src/components/ui/Card.jsx`; student/admin layout files |

Additional deployment check: Login contains a Quick Admin Login path using VITE-prefixed administrator credentials. Do not include real passwords in browser build variables. This review did not establish whether such values are present in the live bundle; if they were shipped, remove the shortcut and rotate the exposed credentials.
