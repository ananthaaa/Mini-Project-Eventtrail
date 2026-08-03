# Club & Membership Module — Detailed Specification

**Project:** EventTrail (CampusPulse) — AWS Serverless Campus Event & Navigation Platform
**Module scope:** Admin-created clubs, student membership/subscription, event-publish notification fan-out, and related feature roadmap.
**Status:** Design spec — ready to slot into the module/sprint tracker alongside Modules 1–2 (DynamoDB infra, Cognito auth).

---

## 1. Problem This Module Solves

Right now, event discovery is a flat, pull-based feed — a student has to actively browse to find out something is happening. There's no way to "follow" a specific club and be told the moment they publish something new. This module turns CampusPulse from a bulletin board into a subscribe-and-notify system, which directly supports the abstract's goal of reducing information fragmentation and passive discovery.

---

## 2. Data Model (DynamoDB)

### 2.1 `Clubs` table
| Attribute | Type | Notes |
|---|---|---|
| `clubId` (PK) | String (UUID) | |
| `name` | String | |
| `description` | String | |
| `category` | String | e.g. Technical, Cultural, Sports, Literary |
| `logoUrl` | String | S3/CloudFront URL |
| `status` | String | `active` / `archived` |
| `createdBy` | String | admin `userId` |
| `createdAt` | Number | epoch ms |
| `joinPolicy` | String | `open` (instant join) or `approval` (pending request) |

### 2.2 `Memberships` table (single-table, dual-access-pattern design)
| Attribute | Type | Notes |
|---|---|---|
| `PK` | String | `userId` |
| `SK` | String | `clubId` |
| `role` | String | `owner` / `co-admin` / `member` |
| `status` | String | `active` / `pending` / `left` |
| `notifyPreference` | String | `instant` / `digest` / `muted` |
| `joinedAt` | Number | epoch ms |

**GSI: `ClubMembersIndex`**
- GSI PK: `SK` (i.e. `clubId`)
- GSI SK: `PK` (i.e. `userId`)

This lets the app query both directions with single-digit-millisecond DynamoDB reads and no table scans:
- "Which clubs is user X in?" → base table query on `PK = userId`
- "Who are the members of club Y?" → `ClubMembersIndex` query on GSI PK `= clubId`

### 2.3 `Events` table (existing — no schema change)
Already carries `clubId` as a foreign key; this module only adds a trigger on event creation.

### 2.4 `Notifications` table (new — in-app notification bell, separate from SNS delivery)
| Attribute | Type | Notes |
|---|---|---|
| `PK` | String | `userId` |
| `SK` | String | `timestamp#notificationId` |
| `type` | String | `new_event` / `waitlist_promotion` / `venue_change` |
| `payload` | Map | eventId, clubId, title, deep link |
| `read` | Boolean | |

---

## 3. Workflow

### 3.1 Club creation (Admin)
```
Admin logs in (Cognito, role = club_admin or college_admin)
   │
Create Club → name, description, category, logo, joinPolicy
   │
Lambda: createClub → writes to Clubs table
   │
Admin auto-added to Memberships as role = owner, status = active
```

### 3.2 Student joins a club
```
Student browses Club Directory
   │
Tap "Join"
   │
IF joinPolicy == "open":
   → Lambda: joinClub → write Memberships row, status = active
   → UI updates optimistically to "Joined ✓"
IF joinPolicy == "approval":
   → Lambda: requestJoin → write Memberships row, status = pending
   → Club owner/co-admins see a "Pending requests" queue in Admin Dashboard
   → Approve → status flips to active (triggers a confirmation notification)
```

### 3.3 New event published → notification fan-out
```
Admin publishes a new event under clubId = X
   │
Lambda: onEventPublish (triggered by API Gateway POST /events, or DynamoDB Stream on Events table)
   │
Query ClubMembersIndex where GSI PK = X → get all active member userIds
   │
For each member:
   ├─ Write a row to Notifications table (in-app bell)
   └─ Check notifyPreference:
        instant → publish to SNS (email/SMS) immediately
        digest  → add to a per-user digest queue (SQS or a DynamoDB "pending digest" item)
        muted   → skip external notification, in-app bell only
   │
EventBridge scheduled rule (e.g. daily 6:00 PM) → Lambda: sendDigest
   → batches all "digest" queue items per user into a single SNS email
```

### 3.4 Student receives and acts on notification
```
Push/email/SMS arrives → deep link → Event Detail screen, RSVP button ready
   OR
In-app notification bell → tap → same deep link
```

---

## 4. API Endpoints (additions to the existing ~20-endpoint REST surface)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/clubs` | Admin creates a club |
| `GET` | `/clubs` | List/browse all clubs (Club Directory) |
| `GET` | `/clubs/{clubId}` | Club profile detail |
| `POST` | `/clubs/{clubId}/join` | Student joins (or requests to join) |
| `DELETE` | `/clubs/{clubId}/leave` | Student leaves / unjoins |
| `PATCH` | `/clubs/{clubId}/members/{userId}` | Admin approves/rejects a pending request, or changes a member's role |
| `PATCH` | `/users/{userId}/clubs/{clubId}/notify-preference` | Student sets instant / digest / muted per club |
| `GET` | `/users/{userId}/notifications` | In-app notification bell feed |
| `PATCH` | `/notifications/{notificationId}/read` | Mark notification read |

---

## 5. UI Screens (additions to the `project.md` reference-UI flow)

```
[Club Directory]
   grid of club cards (logo, name, category, member count, Join/Joined pill)
        │ tap a club
        ▼
[Club Profile]
   header (logo, name, description, member count)
   "Join" / "Joined ✓" / "Request Pending" state button
   ── if just joined ──▶ [Notification Preference Prompt]
        "How should we notify you about {Club Name}?"
        ○ Instantly   ○ Daily digest   ○ In-app only (muted)
   upcoming events list (club-scoped)
   member grid (owner/co-admin badge shown)
        │
        ▼
[Notification Bell — global, in nav bar]
   dropdown/panel listing recent notifications, unread dot, tap → deep link to Event Detail

[Admin Dashboard → Club Management tab]
   list of clubs the admin owns/co-admins
   "Pending requests" queue (if joinPolicy = approval) → Approve / Reject buttons
   member list with role management
```

---

## 6. Feature Roadmap / New Ideas (prioritized)

### Tier 1 — high impact, low build cost (reuses existing infra)
- **"For You" feed ordering** — sort the event feed so events from joined clubs rank above general feed, using existing membership data, no ML required.
- **Digest vs. instant notification toggle** — already specced above (§3.3) — prevents WhatsApp-style notification fatigue, which is the exact problem the abstract identifies.
- **Calendar export (.ics) on RSVP confirmation** — one-click "Add to Calendar," near-zero backend cost, high perceived value.
- **Trending badge on event cards** — small UI read on the existing DynamoDB seat-counter once RSVPs cross a threshold (e.g. 70% capacity).

### Tier 2 — moderate build cost, strong differentiation
- **Club roles (owner / co-admin / member)** — lets a club run without one single point-of-failure login; already in the `Memberships` schema above.
- **Join-approval workflow** — for selective/invite clubs; already specced above.
- **Cross-club co-hosted events** — an event carries `clubIds: [X, Y]` instead of a single FK, fan-out notifies both member lists. Requires changing `Events.clubId` to `Events.clubIds` (list) — flag this as a schema decision before Module build-out.
- **Club analytics tile (Admin Dashboard)** — join/leave trend and most-attended event types, computed from existing `Memberships` and RSVP data.

### Tier 3 — gamification / engagement layer
- **Attendance badges** — e.g. "Attended 5 Tech Fest events," cosmetic, stored as a computed attribute or a simple `Badges` table keyed by userId.
- **First-year buddy nudge** — if `user.joinDate` is recent, surface a "popular beginner-friendly clubs" prompt on first login — directly targets the abstract's "social isolation among first-years" pain point.
- **Club "Best Moments" gallery** — past event photos on the Club Profile page for social proof before joining.

---

## 7. Architectural Notes / Decisions Needed Before Build

1. **Fan-out trigger mechanism** — recommend a DynamoDB Stream on the `Events` table (INSERT event) triggering the `onEventPublish` Lambda, rather than doing the fan-out synchronously inside the `createEvent` Lambda. This keeps the admin's "Publish" action fast even if a club has thousands of members, and decouples notification failures from event creation.
2. **Digest queue storage** — either a lightweight SQS queue consumed by the scheduled `sendDigest` Lambda, or a DynamoDB "pending digest" item per user with a TTL-based cleanup after the daily EventBridge rule fires. SQS is simpler to reason about for batching; DynamoDB avoids adding a new service if you want to stay minimal.
3. **Cross-club events schema change** — if Tier 2's co-hosted events ships, `Events.clubId` (single string) needs to become `Events.clubIds` (list), which affects any existing GSIs keyed on `clubId`. Decide this before Module 3+ event-schema work locks in, same as the RDS→DynamoDB pivot that was already flagged for the project spec.
4. **Notification preference default** — recommend defaulting new joins to `digest` rather than `instant`, so the platform doesn't create the same over-notification fatigue it's trying to solve.

---

## 8. Suggested Module/Sprint Placement

This fits naturally as its own module in the existing 19-module tracker — call it **Module 3: Clubs & Membership** — sequenced right after Module 2 (Cognito auth), since club creation and membership both depend on authenticated, role-aware users. Event-publish notification fan-out (§3.3) should be flagged as a sub-task that depends on whichever module implements the core `Events` CRUD and SNS/EventBridge notification plumbing, so it isn't built twice.
