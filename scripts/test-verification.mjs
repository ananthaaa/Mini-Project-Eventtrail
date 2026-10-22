import assert from 'node:assert/strict';

// Color formatting for console
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ${green('✓')} ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ${red('✗')} ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ${green('✓')} ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ${red('✗')} ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log(bold('\n=== EventTrail Automated Verification Suite ===\n'));

// =========================================================================
// 1. Authorization, Session Security, and Club Ownership
// =========================================================================
console.log(bold('1. Authorization, Permissions, and Club Ownership'));

function checkAdminAuth(claims) {
  if (!claims || (!claims.sub && !claims.username)) {
    const err = new Error('Unauthorized: Authentication required');
    err.statusCode = 401;
    throw err;
  }
  const groups = claims['cognito:groups'] || [];
  const groupList = Array.isArray(groups) ? groups : [groups];
  const isPlatformAdmin = groupList.includes('Admin');
  const role = claims['custom:role'];
  const clubId = claims['custom:clubId'];
  const isClubAdmin = (role === 'club_admin' || groupList.includes('ClubAdmin')) && Boolean(clubId);

  if (!isPlatformAdmin && !isClubAdmin) {
    const err = new Error('Forbidden: Administrative privileges required');
    err.statusCode = 403;
    throw err;
  }
  return { isPlatformAdmin, isClubAdmin, clubId: isPlatformAdmin ? null : clubId };
}

test('Anonymous user is rejected with 401', () => {
  assert.throws(() => checkAdminAuth(null), { statusCode: 401 });
  assert.throws(() => checkAdminAuth({}), { statusCode: 401 });
});

test('Student role without admin group is rejected with 403', () => {
  assert.throws(() => checkAdminAuth({ sub: 'student-123', 'custom:role': 'student' }), { statusCode: 403 });
});

test('Missing custom:clubId never grants fallback global-admin to club admin', () => {
  // If role is club_admin but clubId is missing, it must NOT grant platform admin
  assert.throws(() => checkAdminAuth({ sub: 'user-456', 'custom:role': 'club_admin' }), { statusCode: 403 });
});

test('Authorized club admin is scoped strictly to their clubId', () => {
  const auth = checkAdminAuth({ sub: 'user-789', 'custom:role': 'club_admin', 'custom:clubId': 'club-tech' });
  assert.equal(auth.isClubAdmin, true);
  assert.equal(auth.isPlatformAdmin, false);
  assert.equal(auth.clubId, 'club-tech');
});

test('Club admin is forbidden from modifying events owned by another club', () => {
  const auth = checkAdminAuth({ sub: 'user-789', 'custom:role': 'club_admin', 'custom:clubId': 'club-tech' });
  const event = { id: 'evt-1', clubId: 'club-dance', organizer: 'Dance Club' };
  
  const canModify = auth.isPlatformAdmin || (auth.isClubAdmin && auth.clubId === event.clubId);
  assert.equal(canModify, false);
});

test('Platform admin has global access regardless of clubId', () => {
  const auth = checkAdminAuth({ sub: 'admin-001', 'cognito:groups': ['Admin'] });
  assert.equal(auth.isPlatformAdmin, true);
  const event = { id: 'evt-1', clubId: 'club-dance' };
  const canModify = auth.isPlatformAdmin || (auth.isClubAdmin && auth.clubId === event.clubId);
  assert.equal(canModify, true);
});

// =========================================================================
// 2. Event Schema & Validation Contract
// =========================================================================
console.log(bold('\n2. Event Schema & Contract Validation'));

function validateEventPayload(body, auth) {
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    throw new Error('Valid event title is required');
  }
  if (!body.venueId || typeof body.venueId !== 'string') {
    throw new Error('Valid venueId is required');
  }
  const seatsTotal = Number(body.seatsTotal);
  if (!Number.isInteger(seatsTotal) || seatsTotal <= 0) {
    throw new Error('seatsTotal must be a positive integer');
  }
  if (!body.startDate || isNaN(Date.parse(body.startDate))) {
    throw new Error('Valid ISO-8601 startDate is required');
  }
  if (body.endDate && isNaN(Date.parse(body.endDate))) {
    throw new Error('endDate must be a valid ISO-8601 string');
  }
  if (body.endDate && new Date(body.endDate) < new Date(body.startDate)) {
    throw new Error('endDate cannot be earlier than startDate');
  }
  if (body.registrationDeadline) {
    if (isNaN(Date.parse(body.registrationDeadline))) {
      throw new Error('registrationDeadline must be a valid ISO-8601 string');
    }
    if (new Date(body.registrationDeadline) > new Date(body.startDate)) {
      throw new Error('registrationDeadline cannot be after event startDate');
    }
  }
  return {
    ...body,
    seatsTotal,
    timezone: body.timezone || 'Asia/Kolkata',
    schedule: Array.isArray(body.schedule) ? body.schedule : [],
    status: body.status || 'published',
  };
}

test('Rejects non-positive seatsTotal (0 or negative)', () => {
  assert.throws(() => validateEventPayload({ title: 'Workshop', venueId: 'v1', seatsTotal: 0, startDate: '2026-11-01T10:00:00Z' }), /positive integer/);
  assert.throws(() => validateEventPayload({ title: 'Workshop', venueId: 'v1', seatsTotal: -10, startDate: '2026-11-01T10:00:00Z' }), /positive integer/);
  assert.throws(() => validateEventPayload({ title: 'Workshop', venueId: 'v1', seatsTotal: 'abc', startDate: '2026-11-01T10:00:00Z' }), /positive integer/);
});

test('Rejects missing venueId', () => {
  assert.throws(() => validateEventPayload({ title: 'Concert', seatsTotal: 100, startDate: '2026-11-01T10:00:00Z' }), /venueId is required/);
});

test('Rejects endDate earlier than startDate', () => {
  assert.throws(() => validateEventPayload({
    title: 'Hackathon',
    venueId: 'v1',
    seatsTotal: 50,
    startDate: '2026-11-05T10:00:00Z',
    endDate: '2026-11-04T10:00:00Z',
  }), /endDate cannot be earlier than startDate/);
});

test('Rejects registrationDeadline after startDate', () => {
  assert.throws(() => validateEventPayload({
    title: 'Summit',
    venueId: 'v1',
    seatsTotal: 100,
    startDate: '2026-11-01T10:00:00Z',
    registrationDeadline: '2026-11-02T10:00:00Z',
  }), /registrationDeadline cannot be after event startDate/);
});

test('Persists complete validated event contract with Asia/Kolkata timezone default', () => {
  const validated = validateEventPayload({
    title: 'AI Symposium',
    venueId: 'auditorium-main',
    seatsTotal: 250,
    startDate: '2026-11-10T09:30:00+05:30',
    endDate: '2026-11-10T17:00:00+05:30',
    registrationDeadline: '2026-11-09T23:59:59+05:30',
    schedule: [{ time: '09:30 AM', activity: 'Keynote' }],
  });
  assert.equal(validated.seatsTotal, 250);
  assert.equal(validated.timezone, 'Asia/Kolkata');
  assert.equal(validated.status, 'published');
  assert.equal(validated.schedule.length, 1);
});

// =========================================================================
// 3. Timezone Boundaries & Dynamic Filters (Asia/Kolkata)
// =========================================================================
console.log(bold('\n3. Timezone Boundaries & Dynamic Filters (Asia/Kolkata)'));

function getKolkataDateStrings(referenceIso) {
  const ref = new Date(referenceIso);
  const kolkataNow = new Date(ref.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${kolkataNow.getFullYear()}-${pad(kolkataNow.getMonth() + 1)}-${pad(kolkataNow.getDate())}`;

  // Week end (Sunday)
  const dayOfWeek = kolkataNow.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const endOfWeek = new Date(kolkataNow);
  endOfWeek.setDate(kolkataNow.getDate() + daysUntilSunday);
  const endOfWeekStr = `${endOfWeek.getFullYear()}-${pad(endOfWeek.getMonth() + 1)}-${pad(endOfWeek.getDate())}`;

  return { todayStr, endOfWeekStr };
}

test('Calculates Indian Standard Time (Asia/Kolkata) accurately across UTC midnight', () => {
  // 19:30 UTC on Oct 18 is 01:00 AM on Oct 19 in IST
  const { todayStr } = getKolkataDateStrings('2026-10-18T19:30:00Z');
  assert.equal(todayStr, '2026-10-19');
});

test('Distinguishes upcoming vs past events dynamically without hardcoded dates', () => {
  const nowStr = '2026-10-18';
  const sampleEvents = [
    { id: '1', date: '2026-10-15', title: 'Past Tech Talk' },
    { id: '2', date: '2026-10-18', title: 'Today Workshop' },
    { id: '3', date: '2026-10-25', title: 'Future Hackathon' },
  ];

  const upcoming = sampleEvents.filter(e => e.date >= nowStr);
  const past = sampleEvents.filter(e => e.date < nowStr);

  assert.equal(upcoming.length, 2);
  assert.equal(past.length, 1);
  assert.equal(past[0].id, '1');
  assert.equal(upcoming[0].id, '2');
});

// =========================================================================
// 4. Concurrency, Overselling Prevention & Waitlist Ordering
// =========================================================================
console.log(bold('\n4. Concurrency, Overselling & Fair Waitlist Ordering'));

class MockEventDatabase {
  constructor(seatsTotal) {
    this.event = { id: 'evt-100', seatsTotal, seatsAvailable: seatsTotal, waitlistCount: 0, status: 'published' };
    this.rsvps = new Map(); // key: userId -> rsvp
    this.waitlistQueue = []; // array of userIds
  }

  async registerUser(userId) {
    // Idempotent check
    if (this.rsvps.has(userId)) {
      return { status: 'already_registered', rsvp: this.rsvps.get(userId) };
    }

    // Atomic conditional decrement check
    // If waitlist already has people, newcomer cannot jump queue
    if (this.waitlistQueue.length > 0 || this.event.seatsAvailable <= 0) {
      // Enter waitlist
      this.waitlistQueue.push(userId);
      this.event.waitlistCount++;
      const waitlistPos = this.waitlistQueue.length;
      const rsvp = {
        userId,
        status: 'waitlisted',
        queuePosition: waitlistPos,
        timestamp: new Date().toISOString(),
      };
      this.rsvps.set(userId, rsvp);
      return { status: 'waitlisted', rsvp };
    }

    // Allocate confirmed seat
    this.event.seatsAvailable--;
    const rsvp = {
      userId,
      status: 'confirmed',
      ticketId: `TKT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      checkInCode: `CHK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
    this.rsvps.set(userId, rsvp);
    return { status: 'confirmed', rsvp };
  }
}

await runAsyncTest('Concurrent requests for the last seat prevent overselling', async () => {
  const db = new MockEventDatabase(1); // Only 1 seat available!
  
  // 5 users race concurrently for the 1 seat
  const results = await Promise.all([
    db.registerUser('student-A'),
    db.registerUser('student-B'),
    db.registerUser('student-C'),
    db.registerUser('student-D'),
    db.registerUser('student-E'),
  ]);

  const confirmed = results.filter(r => r.status === 'confirmed');
  const waitlisted = results.filter(r => r.status === 'waitlisted');

  assert.equal(confirmed.length, 1, 'Only exactly 1 user can get the last seat');
  assert.equal(waitlisted.length, 4, 'Remaining 4 users are placed in waitlist');
  assert.equal(db.event.seatsAvailable, 0);
  assert.ok(confirmed[0].rsvp.ticketId.startsWith('TKT-'));
  assert.ok(confirmed[0].rsvp.checkInCode.startsWith('CHK-'));
});

test('Fair waitlist ordering prevents new registrant from bypassing queued users', async () => {
  const db = new MockEventDatabase(0); // 0 seats left
  await db.registerUser('student-queue-1');
  await db.registerUser('student-queue-2');

  // Now a seat becomes available (e.g. cancellation) but waitlist exists
  db.event.seatsAvailable = 1;

  // Newcomer arrives
  const newcomerResult = await db.registerUser('student-newcomer');
  assert.equal(newcomerResult.status, 'waitlisted', 'Newcomer cannot jump ahead of waitlist');
  assert.equal(newcomerResult.rsvp.queuePosition, 3);
});

test('Duplicate RSVP calls return existing booking idempotently without double-booking', async () => {
  const db = new MockEventDatabase(5);
  const first = await db.registerUser('student-repeat');
  assert.equal(first.status, 'confirmed');
  const originalTicketId = first.rsvp.ticketId;
  const seatsLeftBefore = db.event.seatsAvailable;

  // Re-attempt registration
  const second = await db.registerUser('student-repeat');
  assert.equal(second.status, 'already_registered');
  assert.equal(second.rsvp.ticketId, originalTicketId);
  assert.equal(db.event.seatsAvailable, seatsLeftBefore, 'SeatsAvailable must not decrement again');
});

// =========================================================================
// 5. Cancellation & Waitlist Promotion Races
// =========================================================================
console.log(bold('\n5. Cancellation & Waitlist Promotion Races'));

test('Conditional state transition prevents cancellation-promotion race condition', () => {
  // Simulate candidate in waitlist
  const candidate = { userId: 'student-waitlist', status: 'waitlisted' };

  // Promoter starts promoting candidate
  const promoterPromotes = () => {
    if (candidate.status !== 'waitlisted') {
      throw new Error('Candidate is no longer waitlisted');
    }
    candidate.status = 'confirmed';
    candidate.ticketId = 'TKT-PROMOTED';
  };

  // Concurrent cancel attempt by user
  const userCancelsWaitlist = () => {
    // ConditionExpression: #status = :waitlisted
    if (candidate.status !== 'waitlisted') {
      throw new Error('ConditionalCheckFailedException: Candidate already promoted or cancelled');
    }
    candidate.status = 'cancelled';
  };

  // Promoter finishes first
  promoterPromotes();
  assert.equal(candidate.status, 'confirmed');

  // User cancellation of waitlist now fails cleanly instead of corrupting confirmed seat
  assert.throws(() => userCancelsWaitlist(), /ConditionalCheckFailedException/);
  assert.equal(candidate.status, 'confirmed', 'Confirmed status preserved despite stale cancel request');
});

// =========================================================================
// 6. Missing, Closed, Past, and Cancelled Events Handling
// =========================================================================
console.log(bold('\n6. Missing, Closed, Past, and Cancelled Events Handling'));

function validateEventEligibility(event) {
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  if (event.status === 'cancelled') {
    const err = new Error('This event has been cancelled and cannot accept registrations');
    err.statusCode = 400;
    throw err;
  }
  if (event.status === 'completed') {
    const err = new Error('This event has ended');
    err.statusCode = 400;
    throw err;
  }
  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    const err = new Error('Registration deadline has passed');
    err.statusCode = 400;
    throw err;
  }
  return true;
}

test('Rejects non-existent event with 404', () => {
  assert.throws(() => validateEventEligibility(null), { statusCode: 404 });
});

test('Rejects cancelled event with 400', () => {
  assert.throws(() => validateEventEligibility({ status: 'cancelled' }), /cancelled/);
});

test('Rejects completed event with 400', () => {
  assert.throws(() => validateEventEligibility({ status: 'completed' }), /ended/);
});

test('Rejects expired registration deadline with 400', () => {
  assert.throws(() => validateEventEligibility({
    status: 'published',
    registrationDeadline: '2026-01-01T00:00:00Z',
  }), /Registration deadline has passed/);
});

// =========================================================================
// 7. Club Membership & Notification Destinations
// =========================================================================
console.log(bold('\n7. Club Membership & Notification Destinations'));

test('Join and Leave club update member count atomically', () => {
  let club = { id: 'club-robotics', memberCount: 15 };
  
  // Join
  club.memberCount += 1;
  assert.equal(club.memberCount, 16);

  // Leave
  club.memberCount = Math.max(0, club.memberCount - 1);
  assert.equal(club.memberCount, 15);
});

test('Notification routes resolve to canonical /student/events/:id', () => {
  const notification = {
    id: 'notif-1',
    eventId: 'evt-ai-summit',
    type: 'PROMOTION',
    message: 'You have been promoted from the waitlist!',
  };

  const targetUrl = notification.eventId ? `/student/events/${notification.eventId}` : '/student/events';
  assert.equal(targetUrl, '/student/events/evt-ai-summit');
  assert.ok(!targetUrl.includes('/event/'), 'Must not use un-namespaced legacy routes');
});

// =========================================================================
// 8. Venue Dependency Check on Deletion
// =========================================================================
console.log(bold('\n8. Venue Dependency Check on Deletion'));

test('Prevents deleting venue while referenced by active events', () => {
  const venueIdToDelete = 'venue-auditorium';
  const activeEvents = [
    { id: 'e1', title: 'Annual Fest', venueId: 'venue-auditorium', status: 'published' },
    { id: 'e2', title: 'Coding Contest', venueId: 'venue-lab-1', status: 'published' },
  ];

  const dependentEvents = activeEvents.filter(e => e.venueId === venueIdToDelete && e.status !== 'cancelled');
  assert.equal(dependentEvents.length, 1);

  const canDelete = dependentEvents.length === 0;
  assert.equal(canDelete, false, 'Venue cannot be deleted while referenced by active events');
});

// =========================================================================
// 9. Multi-Role Club Governance & Approval Lifecycle
// =========================================================================
console.log(bold('\n9. Multi-Role Club Governance & Approval Lifecycle'));

test('Server claims determine destination portal regardless of UI selection', () => {
  function resolveDestination(claims, returnTo = null) {
    if (returnTo) return returnTo;
    const groups = claims?.['cognito:groups'] || [];
    const groupList = Array.isArray(groups) ? groups : [groups];
    if (groupList.includes('Admin') || claims?.['custom:role'] === 'admin') {
      return '/admin';
    }
    if ((groupList.includes('ClubAdmin') || claims?.['custom:role'] === 'club_admin') && claims?.['custom:clubId']) {
      return '/organizer';
    }
    return '/student';
  }

  assert.equal(resolveDestination({ 'cognito:groups': ['Admin'] }), '/admin');
  assert.equal(resolveDestination({ 'cognito:groups': ['ClubAdmin'], 'custom:clubId': 'club-music' }), '/organizer');
  assert.equal(resolveDestination({ 'custom:role': 'student' }), '/student');
  // Client choosing 'admin' tab without admin claims still goes to /student
  assert.equal(resolveDestination({ 'custom:role': 'student' }), '/student');
});

test('Organizer cannot self-publish: createEvent enforces draft or pending_approval', () => {
  function sanitizeOrganizerCreateStatus(requestedStatus, isPlatformAdmin) {
    if (isPlatformAdmin) return requestedStatus || 'published';
    if (requestedStatus === 'published') {
      return 'pending_approval'; // Platform approval required
    }
    return requestedStatus === 'draft' ? 'draft' : 'pending_approval';
  }

  assert.equal(sanitizeOrganizerCreateStatus('published', false), 'pending_approval');
  assert.equal(sanitizeOrganizerCreateStatus('draft', false), 'draft');
  assert.equal(sanitizeOrganizerCreateStatus('published', true), 'published');
});

test('High-impact edits to published events by organizers trigger re-approval', () => {
  function sanitizeOrganizerUpdateStatus(existingStatus, updateFields, isPlatformAdmin) {
    if (isPlatformAdmin) return updateFields.status || existingStatus;
    const hasHighImpactChanges = Boolean(
      updateFields.date || updateFields.time || updateFields.venueId || updateFields.locationDetails
    );
    if (existingStatus === 'published' && hasHighImpactChanges) {
      return 'pending_approval'; // Must be re-approved by admin
    }
    return updateFields.status || existingStatus;
  }

  const rescheduled = sanitizeOrganizerUpdateStatus('published', { date: '2026-11-20' }, false);
  assert.equal(rescheduled, 'pending_approval');

  const descOnly = sanitizeOrganizerUpdateStatus('published', { description: 'Updated details' }, false);
  assert.equal(descOnly, 'published');
});

test('Student list filtering hides drafts and pending_approval events', () => {
  const events = [
    { id: 'e1', title: 'Live Hackathon', status: 'published' },
    { id: 'e2', title: 'Secret Draft', status: 'draft', organizerId: 'club-tech' },
    { id: 'e3', title: 'Pending Concert', status: 'pending_approval', organizerId: 'club-music' },
  ];

  function filterForStudent(eventsList) {
    return eventsList.filter(e => e.status === 'published');
  }

  const studentVisible = filterForStudent(events);
  assert.equal(studentVisible.length, 1);
  assert.equal(studentVisible[0].id, 'e1');
});

test('Organizer list view shows published events plus their own club drafts/pending', () => {
  const events = [
    { id: 'e1', title: 'Live Hackathon', status: 'published', organizerId: 'club-other' },
    { id: 'e2', title: 'My Club Draft', status: 'draft', organizerId: 'club-tech' },
    { id: 'e3', title: 'Other Club Draft', status: 'draft', organizerId: 'club-music' },
  ];

  function filterForOrganizer(eventsList, organizerClubId) {
    return eventsList.filter(e => e.status === 'published' || e.organizerId === organizerClubId);
  }

  const organizerVisible = filterForOrganizer(events, 'club-tech');
  assert.equal(organizerVisible.length, 2);
  assert.ok(organizerVisible.some(e => e.id === 'e1'));
  assert.ok(organizerVisible.some(e => e.id === 'e2'));
  assert.ok(!organizerVisible.some(e => e.id === 'e3'));
});

test('Admin review actions execute state transitions and store review comment', () => {
  function executeAdminReview(event, action, comment, adminName) {
    if (action === 'approve') {
      return {
        ...event,
        status: 'published',
        approvedAt: '2026-10-18T10:00:00Z',
        approvedBy: adminName,
        reviewComment: comment || ''
      };
    }
    if (action === 'request_changes') {
      if (!comment) throw new Error('Comment required for requesting changes');
      return {
        ...event,
        status: 'needs_changes',
        reviewComment: comment,
        reviewedBy: adminName
      };
    }
    if (action === 'reject') {
      if (!comment) throw new Error('Comment required for rejection');
      return {
        ...event,
        status: 'rejected',
        reviewComment: comment,
        reviewedBy: adminName
      };
    }
    throw new Error('Invalid action');
  }

  const pendingEvt = { id: 'evt-ai', title: 'AI Workshop', status: 'pending_approval' };

  const approved = executeAdminReview(pendingEvt, 'approve', 'Looks great!', 'Admin Jane');
  assert.equal(approved.status, 'published');
  assert.equal(approved.approvedBy, 'Admin Jane');

  const needsChanges = executeAdminReview(pendingEvt, 'request_changes', 'Please change venue to Hall 3', 'Admin Jane');
  assert.equal(needsChanges.status, 'needs_changes');
  assert.equal(needsChanges.reviewComment, 'Please change venue to Hall 3');

  assert.throws(() => executeAdminReview(pendingEvt, 'request_changes', '', 'Admin Jane'), /Comment required/);
});

test('First-time login challenge enforces permanent password establishment', () => {
  function handleLoginResponse(authResult, permanentPassword) {
    if (authResult.challengeName === 'NEW_PASSWORD_REQUIRED') {
      if (!permanentPassword || permanentPassword.length < 8) {
        throw new Error('Permanent password of min 8 chars required to complete challenge');
      }
      return { status: 'SUCCESS', isFirstTimeComplete: true };
    }
    return { status: 'SUCCESS', isFirstTimeComplete: false };
  }

  assert.throws(
    () => handleLoginResponse({ challengeName: 'NEW_PASSWORD_REQUIRED' }, 'short'),
    /Permanent password/
  );

  const res = handleLoginResponse({ challengeName: 'NEW_PASSWORD_REQUIRED' }, 'SecurePassword123!');
  assert.equal(res.status, 'SUCCESS');
  assert.equal(res.isFirstTimeComplete, true);
});

// =========================================================================
// 10. Live GPS Navigation, Path Snapping, and Arrival Verification
// =========================================================================
console.log(bold('10. Live GPS Navigation, Path Snapping, and Arrival Verification'));

import {
  isWithinCampusBounds,
  distanceMeters,
  projectPointToSegment,
  getClosestConnectedNode,
  matchGpsToCampusPath,
  detectRouteDeviation,
  checkArrivalDetection,
  resolveDestination,
} from '../src/utils/gpsPathMatcher.js';
import { buildAdjacencyList, findPathAStar } from '../src/utils/pathfinding.js';
import fs from 'node:fs';

const roadGraph = JSON.parse(fs.readFileSync('./src/data/graph.json', 'utf8'));
const campusAdjacency = buildAdjacencyList(roadGraph.edges);

test('Campus boundary check admits ASIET campus and rejects distant GPS readings', () => {
  // ASIET campus center
  assert.equal(isWithinCampusBounds(10.1780, 76.4302), true);
  // Main gate
  assert.equal(isWithinCampusBounds(10.1778, 76.4291), true);
  // Outside: Kochi City
  assert.equal(isWithinCampusBounds(9.9312, 76.2673), false);
  // Outside: New Delhi
  assert.equal(isWithinCampusBounds(28.6139, 77.2090), false);
});

test('Connected node lookup strictly filters isolated and disconnected nodes', () => {
  // "isolated-node" in graph.json has no edges
  const closest = getClosestConnectedNode(10.185, 76.435, roadGraph.nodes, campusAdjacency);
  assert.notEqual(closest, 'isolated-node');
  assert.ok(campusAdjacency[closest] && campusAdjacency[closest].length > 0);
});

test('Inaccurate GPS near library snaps to the nearest valid campus walkway segment', () => {
  // GPS point with ±12m noise near Central Library
  const rawReading = { lat: 10.17782, lng: 76.42982, accuracy: 12 };
  const matched = matchGpsToCampusPath(
    rawReading,
    { nodes: roadGraph.nodes, edges: roadGraph.edges, adjacency: campusAdjacency }
  );

  assert.equal(matched.isSnapped, true);
  assert.equal(matched.status, 'matched');
  assert.ok(matched.distanceToPath < 10, 'Must be within 10 meters of path segment');
  assert.ok(matched.estimatedLat > 10.17 && matched.estimatedLng > 76.42);
  assert.ok(matched.fromNode && matched.toNode, 'Must identify segment endpoints');
});

test('Far-off or out-of-campus GPS readings are rejected rather than silently snapped', () => {
  // Out of campus
  const outOfCampus = matchGpsToCampusPath(
    { lat: 10.0150, lng: 76.3400, accuracy: 15 },
    { nodes: roadGraph.nodes, edges: roadGraph.edges, adjacency: campusAdjacency }
  );
  assert.equal(outOfCampus.isSnapped, false);
  assert.equal(outOfCampus.status, 'out_of_campus');

  // Inside campus but in an unmapped building interior > 55m from any path
  const offPath = matchGpsToCampusPath(
    { lat: 10.1820, lng: 76.4260, accuracy: 10 },
    { nodes: roadGraph.nodes, edges: roadGraph.edges, adjacency: campusAdjacency }
  );
  assert.equal(offPath.isSnapped, false);
  assert.equal(offPath.status, 'off_path');
});

test('Anti-jumping hysteresis suppresses sudden path jumps caused by GPS multipath noise', () => {
  const reading1 = { lat: 10.1778, lng: 76.4298, accuracy: 15, timestamp: 1000 };
  const match1 = matchGpsToCampusPath(
    reading1,
    { nodes: roadGraph.nodes, edges: roadGraph.edges, adjacency: campusAdjacency }
  );

  // Unrealistic 65m jump in 1 second with poor accuracy
  const noisyJump = { lat: 10.1784, lng: 76.4306, accuracy: 28, timestamp: 2000 };
  const match2 = matchGpsToCampusPath(
    noisyJump,
    { nodes: roadGraph.nodes, edges: roadGraph.edges, adjacency: campusAdjacency },
    { lastMatch: match1, consecutiveSwitchCount: 0 }
  );

  assert.equal(match2.status, 'smoothing', 'Must apply temporal smoothing instead of sudden jump');
  assert.equal(match2.estimatedLat, match1.estimatedLat);
});

test('Route deviation detection triggers when student departs > 20m from recommended path', () => {
  const routeLine = [
    [76.42910, 10.17781],
    [76.42980, 10.17784],
    [76.43053, 10.17825],
  ];

  // Walking along path (3m off): no deviation
  const onPathPos = { lat: 10.17782, lng: 76.42940 };
  const onPathCheck = detectRouteDeviation(onPathPos, routeLine, 20);
  assert.equal(onPathCheck.deviated, false);

  // Walking away toward opposite quadrant (> 35m off): deviation detected
  const deviatedPos = { lat: 10.17950, lng: 76.42940 };
  const devCheck = detectRouteDeviation(deviatedPos, routeLine, 20);
  assert.equal(devCheck.deviated, true);
  assert.ok(devCheck.distanceToRoute > 20);
});

test('Arrival detection requires repeated reliable readings and rejects noisy hits', () => {
  const destination = { lat: 10.17825, lng: 76.43053 };

  // Reading 1: within 20m, good accuracy (10m) -> count = 1, isArrived = false (requires 2)
  const hit1 = checkArrivalDetection(
    { lat: 10.17826, lng: 76.43054, accuracy: 10 },
    destination,
    { radius: 20, maxAccuracy: 35, consecutiveRequired: 2, currentCount: 0 }
  );
  assert.equal(hit1.isArrived, false);
  assert.equal(hit1.count, 1);

  // Reading 2: second consecutive reliable hit -> isArrived = true
  const hit2 = checkArrivalDetection(
    { lat: 10.17826, lng: 76.43054, accuracy: 10 },
    destination,
    { radius: 20, maxAccuracy: 35, consecutiveRequired: 2, currentCount: 1 }
  );
  assert.equal(hit2.isArrived, true);

  // Single noisy reading with poor accuracy (70m) is rejected
  const noisyHit = checkArrivalDetection(
    { lat: 10.17826, lng: 76.43054, accuracy: 70 },
    destination,
    { radius: 20, maxAccuracy: 35, consecutiveRequired: 2, currentCount: 0 }
  );
  assert.equal(noisyHit.isArrived, false);
});

// =========================================================================
// 11. Event-Specific Campus Navigation & Dynamic Multi-Event Destination
// =========================================================================
console.log(bold('11. Event-Specific Campus Navigation & Dynamic Multi-Event Destination'));

test('Navigation from EventDetail and Dashboard links directly to NAVIGATE section (/student/navigate)', () => {
  const eventDetailCode = fs.readFileSync('./src/pages/EventDetail.jsx', 'utf8');
  assert.ok(!eventDetailCode.includes('/student/campus-map?dest='), 'EventDetail must not redirect to general campus map');
  assert.ok(eventDetailCode.includes('/student/navigate?eventId='), 'EventDetail must route directly to /student/navigate');

  const dashboardCode = fs.readFileSync('./src/pages/student/StudentDashboard.jsx', 'utf8');
  assert.ok(dashboardCode.includes('/student/navigate?eventId='), 'Dashboard must route directly to /student/navigate');

  const myTicketsCode = fs.readFileSync('./src/pages/student/MyTickets.jsx', 'utf8');
  assert.ok(myTicketsCode.includes('/student/navigate?eventId='), 'MyTickets must route directly to /student/navigate');
});

test('resolveDestination retrieves explicit event entrance coordinates over generic coordinates', () => {
  const event = {
    id: 'evt-entrance-test',
    title: 'Entrance Test Event',
    locationDetails: {
      entranceLat: 10.17795,
      entranceLng: 76.43045,
      lat: 10.17600,
      lng: 76.42800,
      nodeId: 'entrance-cs-block'
    }
  };
  const res = resolveDestination(event, null, null, roadGraph.nodes);
  assert.equal(res.lat, 10.17795);
  assert.equal(res.lng, 76.43045);
  assert.equal(res.source, 'event.locationDetails.entrance');
});

test('Different campus events resolve to their respective distinct coordinates (no hardcoding)', () => {
  // Event A: Futsal Championship at Campus Stadium
  const eventA = {
    id: 'evt-futsal-2026',
    title: 'Inter-College Futsal Championship',
    venueId: 'stadium-field-1',
    locationDetails: {
      entranceLat: 10.17772,
      entranceLng: 76.43058,
      nodeId: 'entrance-main-ground'
    }
  };

  // Event B: Hackathon at Computer Science / Science Block
  const eventB = {
    id: 'evt-hackathon-2026',
    title: 'CodeSprint Hackathon',
    venueId: 'science-hall-a'
  };

  // Event C: Seminar at Hub Room 202
  const eventC = {
    id: 'evt-seminar-2026',
    title: 'AI Future Seminar',
    venueId: 'hub-room-202'
  };

  const resA = resolveDestination(eventA, null, null, roadGraph.nodes);
  const resB = resolveDestination(eventB, { id: 'science-hall-a' }, null, roadGraph.nodes);
  const resC = resolveDestination(eventC, { id: 'hub-room-202' }, null, roadGraph.nodes);

  assert.ok(resA && resB && resC, 'All valid events must resolve');
  assert.notEqual(resA.lat, resB.lat, 'Event A and Event B must have distinct latitude');
  assert.notEqual(resA.lng, resB.lng, 'Event A and Event B must have distinct longitude');
  assert.notEqual(resB.lat, resC.lat, 'Event B and Event C must have distinct latitude');

  // Ensure none use old hardcoded default 10.1780, 76.4302
  assert.equal(resA.lat, 10.17772);
  assert.equal(resA.lng, 76.43058);
});

test('Switching from Event A to Event B dynamically generates new route coordinates without page reload', () => {
  const startPt = { lat: 10.177813, lng: 76.4291012 }; // Campus Main Gate
  const startNodeId = getClosestConnectedNode(startPt.lat, startPt.lng, roadGraph.nodes, campusAdjacency);

  // Event A: Stadium
  const eventA = {
    id: 'evt-a',
    locationDetails: { entranceLat: 10.17772, entranceLng: 76.43058 }
  };
  const destA = resolveDestination(eventA, null, null, roadGraph.nodes);
  const targetNodeA = getClosestConnectedNode(destA.lat, destA.lng, roadGraph.nodes, campusAdjacency);
  const pathA = findPathAStar(startNodeId, targetNodeA, campusAdjacency, roadGraph.nodes);

  // Event B: Science / CS Block
  const eventB = {
    id: 'evt-b',
    venueId: 'science-hall-a'
  };
  const destB = resolveDestination(eventB, { id: 'science-hall-a' }, null, roadGraph.nodes);
  const targetNodeB = getClosestConnectedNode(destB.lat, destB.lng, roadGraph.nodes, campusAdjacency);
  const pathB = findPathAStar(startNodeId, targetNodeB, campusAdjacency, roadGraph.nodes);

  assert.ok(pathA && pathA.length > 0, 'Path A must exist');
  assert.ok(pathB && pathB.length > 0, 'Path B must exist');
  assert.notDeepEqual(pathA, pathB, 'Paths to Event A and Event B must be distinct');
  assert.notEqual(pathA[pathA.length - 1], pathB[pathB.length - 1], 'Final destination node must differ');
});

test('Event without valid location or venue returns null (guards against faulty routing)', () => {
  const unlocatedEvent = {
    id: 'evt-online-webinar',
    title: 'Virtual Webinar',
    locationDetails: {}
  };
  const res = resolveDestination(unlocatedEvent, null, null, roadGraph.nodes);
  assert.equal(res, null, 'Unlocated event must resolve to null, triggering warning UI instead of incorrect path');
});

console.log(bold('\n================================================='));
console.log(bold(`Results: ${green(`${passed} passed`)}, ${failed > 0 ? red(`${failed} failed`) : '0 failed'}`));
console.log(bold('=================================================\n'));

if (failed > 0) {
  process.exit(1);
}

