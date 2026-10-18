const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME;

function getAdminAuth(event, body = {}) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims) {
    return { authorized: false, statusCode: 401, error: 'Unauthorized: Missing or invalid token' };
  }

  const rawGroups = claims['cognito:groups'] || [];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : (typeof rawGroups === 'string' ? rawGroups.split(',').map(s => s.trim()) : []);

  const role = claims['custom:role'];
  const tokenClubId = claims['custom:clubId'];
  const clubId = tokenClubId || body.organizerId || body.clubId;

  const isPlatformAdmin = groups.includes('platform-admin') ||
    groups.includes('superadmin') ||
    groups.includes('admin') ||
    groups.includes('Admin') ||
    role === 'platform-admin' ||
    role === 'admin' ||
    tokenClubId === 'platform-admin';

  const isClubOrganizer = groups.includes('ClubAdmin') ||
    groups.includes('club-admin') ||
    role === 'club_admin' ||
    role === 'club-admin' ||
    Boolean(clubId);

  if (!isPlatformAdmin && !isClubOrganizer) {
    return { authorized: false, statusCode: 403, error: 'Forbidden: Organizer or Administrator privileges required' };
  }

  if (!isPlatformAdmin && !clubId) {
    return { authorized: false, statusCode: 403, error: 'Forbidden: Club administrator has no assigned club affiliation' };
  }

  return {
    authorized: true,
    userId: claims.sub || claims.username,
    isPlatformAdmin,
    clubId: isPlatformAdmin ? (clubId || 'platform-admin') : clubId,
    facultyId: claims['custom:facultyId'] || 'General',
    claims,
  };
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const auth = getAdminAuth(event, body);
    if (!auth.authorized) {
      return {
        statusCode: auth.statusCode,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: auth.error })
      };
    }
    const {
      title,
      date,
      time,
      location,
      venueId,
      locationDetails,
      category,
      faculty,
      seatsTotal,
      description,
      coverImage,
      schedule,
      startsAt,
      endsAt,
      timezone,
      registrationDeadline,
      status,
      organizerId: requestedOrganizerId,
    } = body;

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Validation failed: Title is required and cannot be empty.' })
      };
    }

    if (!date || !time || !category) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Validation failed: Missing date, time, or category.' })
      };
    }

    const parsedSeats = parseInt(seatsTotal, 10);
    if (isNaN(parsedSeats) || parsedSeats <= 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Validation failed: Total seats must be a positive integer greater than zero.' })
      };
    }

    // Determine organizerId
    const effectiveOrganizerId = requestedOrganizerId || auth.clubId;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Validation failed: Date must be in YYYY-MM-DD format.' })
      };
    }

    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Determine initial lifecycle status
    let initialStatus;
    if (auth.isPlatformAdmin) {
      initialStatus = status || 'published';
    } else {
      // Club organizers can only create 'draft' or submit for 'pending_approval'
      initialStatus = status === 'draft' ? 'draft' : 'pending_approval';
    }

    const newEvent = {
      id: eventId,
      organizerId: effectiveOrganizerId,
      title: title.trim(),
      date,
      time,
      location: location || 'Campus Main Ground',
      venueId: venueId || 'campus-main',
      locationDetails: locationDetails || null,
      category,
      faculty: faculty || auth.facultyId || 'General',
      seatsTotal: parsedSeats,
      seatsAvailable: parsedSeats,
      description: description || '',
      coverImage: coverImage || '',
      schedule: Array.isArray(schedule) ? schedule : [],
      startsAt: startsAt || `${date}T${time.split(' ')[0] || '09:00'}:00`,
      endsAt: endsAt || `${date}T18:00:00`,
      timezone: timezone || 'Asia/Kolkata',
      registrationDeadline: registrationDeadline || `${date}T23:59:59`,
      status: initialStatus, // 'draft' | 'pending_approval' | 'published'
      createdBy: auth.userId,
      submittedAt: initialStatus === 'pending_approval' ? now : null,
      reviewComment: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: EVENTS_TABLE,
      Item: newEvent
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(newEvent)
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
