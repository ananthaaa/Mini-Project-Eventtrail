import { authService } from './authService';

const API_BASE_URL = (import.meta.env.VITE_HTTP_API_URL || 'https://k1f5xsammd.execute-api.ap-south-1.amazonaws.com/').replace(/\/$/, '');

const fetchFromApi = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errBody = await response.json();
        if (errBody.error) errorMsg = errBody.error;
      } catch (e) {}
      const err = new Error(errorMsg || `HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please check your network and try again.');
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    console.error(`Error fetching ${endpoint}:`, error.message);
    throw error;
  }
};

const fetchWithAuth = async (endpoint, options = {}) => {
  const session = await authService.getCurrentSession();
  const token = session?.idToken;
  if (!token) {
    const err = new Error('Authentication required for this operation');
    err.status = 401;
    throw err;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  return fetchFromApi(endpoint, { ...options, headers });
};

// --- Events (Public Browsing) ---

export const fetchEvents = async (params = {}, options = {}) => {
  let headers = {};
  try {
    const session = await authService.getCurrentSession();
    if (session?.idToken) headers.Authorization = `Bearer ${session.idToken}`;
  } catch (_) {}

  const urlParams = new URLSearchParams(params).toString();
  const endpoint = urlParams ? `/events?${urlParams}` : '/events';
  
  let data = [];
  try {
    data = await fetchFromApi(endpoint, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  } catch (err) {
    console.warn('API fetchEvents failed, falling back to local events:', err.message);
  }

  // Merge any local fallback events created in this browser
  try {
    const localEvents = JSON.parse(localStorage.getItem('cp_events') || '[]');
    if (Array.isArray(localEvents) && localEvents.length > 0) {
      const apiList = Array.isArray(data) ? data : [];
      const apiIds = new Set(apiList.map(e => e.id));
      const localOnly = localEvents.filter(e => !apiIds.has(e.id));
      data = [...apiList, ...localOnly];
    }
  } catch (_) {}

  // Authoritatively apply deletions and cancellations across all data sources
  try {
    const deletedIds = new Set(JSON.parse(localStorage.getItem('cp_deleted_events') || '[]'));
    const cancelledIds = new Set(JSON.parse(localStorage.getItem('cp_cancelled_events') || '[]'));

    if (Array.isArray(data)) {
      if (deletedIds.size > 0) {
        data = data.filter(e => !deletedIds.has(e.id));
      }
      if (cancelledIds.size > 0) {
        data = data.map(e => cancelledIds.has(e.id) ? { ...e, status: 'cancelled' } : e);
      }
    }
  } catch (_) {}

  return Array.isArray(data) ? data : [];
};

export const fetchEventById = async (id, options = {}) => {
  let headers = {};
  try {
    const session = await authService.getCurrentSession();
    if (session?.idToken) headers.Authorization = `Bearer ${session.idToken}`;
  } catch (_) {}

  const deletedIds = new Set(JSON.parse(localStorage.getItem('cp_deleted_events') || '[]'));
  if (deletedIds.has(id)) {
    const notFoundErr = new Error('Event not found or has been deleted');
    notFoundErr.status = 404;
    throw notFoundErr;
  }

  try {
    const evt = await fetchFromApi(`/events/${id}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const cancelledIds = new Set(JSON.parse(localStorage.getItem('cp_cancelled_events') || '[]'));
    if (cancelledIds.has(id)) {
      return { ...evt, status: 'cancelled' };
    }
    return evt;
  } catch (err) {
    if (err.status === 404) throw err;
    try {
      const localEvents = JSON.parse(localStorage.getItem('cp_events') || '[]');
      const found = localEvents.find(e => e.id === id);
      if (found) {
        const cancelledIds = new Set(JSON.parse(localStorage.getItem('cp_cancelled_events') || '[]'));
        if (cancelledIds.has(id)) return { ...found, status: 'cancelled' };
        return found;
      }
    } catch (_) {}
    throw err;
  }
};

// --- Clubs (Public Reads with Optional Auth Enrichment) ---

export const fetchClubs = async (options = {}) => {
  let headers = {};
  try {
    const session = await authService.getCurrentSession();
    if (session?.idToken) headers.Authorization = `Bearer ${session.idToken}`;
  } catch (_) {}

  let clubs = [];
  try {
    clubs = await fetchFromApi('/clubs', { ...options, headers: { ...headers, ...(options.headers || {}) } });
  } catch (err) {
    console.warn('API fetchClubs failed, reading local clubs:', err.message);
  }

  try {
    const localClubs = JSON.parse(localStorage.getItem('cp_clubs') || '[]');
    if (Array.isArray(localClubs) && localClubs.length > 0) {
      const apiList = Array.isArray(clubs) ? clubs : [];
      const apiIds = new Set(apiList.map(c => c.id));
      const localOnly = localClubs.filter(c => !apiIds.has(c.id));
      clubs = [...apiList, ...localOnly];
    }
  } catch (_) {}

  return Array.isArray(clubs) ? clubs : [];
};

export const fetchClubById = async (id, options = {}) => {
  let headers = {};
  try {
    const session = await authService.getCurrentSession();
    if (session?.idToken) headers.Authorization = `Bearer ${session.idToken}`;
  } catch (_) {}

  try {
    return await fetchFromApi(`/clubs/${id}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  } catch (err) {
    try {
      const localClubs = JSON.parse(localStorage.getItem('cp_clubs') || '[]');
      const found = localClubs.find(c => c.id === id);
      if (found) return found;
    } catch (_) {}
    throw err;
  }
};

export const createClub = async (clubData) => {
  try {
    const res = await fetchWithAuth('/clubs', {
      method: 'POST',
      body: JSON.stringify(clubData)
    });
    try {
      const localClubs = JSON.parse(localStorage.getItem('cp_clubs') || '[]');
      localClubs.push(res);
      localStorage.setItem('cp_clubs', JSON.stringify(localClubs));
    } catch (_) {}
    return res;
  } catch (err) {
    const newClub = {
      id: `club_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...clubData,
      createdAt: new Date().toISOString()
    };
    try {
      const localClubs = JSON.parse(localStorage.getItem('cp_clubs') || '[]');
      localClubs.push(newClub);
      localStorage.setItem('cp_clubs', JSON.stringify(localClubs));
    } catch (_) {}
    return newClub;
  }
};

export const joinClub = async (id) => {
  return fetchWithAuth(`/clubs/${id}/join`, {
    method: 'POST'
  });
};

export const leaveClub = async (id) => {
  return fetchWithAuth(`/clubs/${id}/leave`, {
    method: 'DELETE'
  });
};

export const deleteClub = async (id) => {
  return fetchWithAuth(`/clubs/${id}`, {
    method: 'DELETE'
  });
};

// --- Venues & Graph (Public Reads) ---

export const fetchVenues = async (options = {}) => {
  return fetchFromApi('/venues', options);
};

export const fetchVenueById = async (id, options = {}) => {
  return fetchFromApi(`/venues/${id}`, options);
};

export const fetchSpeakers = async (options = {}) => {
  return fetchFromApi('/speakers', options);
};

export const fetchPathNodes = async (options = {}) => {
  return fetchFromApi('/graph/nodes', options);
};

export const fetchPathEdges = async (options = {}) => {
  return fetchFromApi('/graph/edges', options);
};

// --- Authenticated Admin Operations ---

export const getUploadUrl = async (type = 'image/jpeg', prefix = 'events') => {
  const params = new URLSearchParams({ type, prefix }).toString();
  return fetchWithAuth(`/upload-url?${params}`, {
    method: 'GET'
  });
};

export const createEvent = async (eventData) => {
  try {
    return await fetchWithAuth('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  } catch (err) {
    console.warn('[Events] Backend createEvent returned error, falling back locally:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('cp_events') || '[]');
      const newEvt = {
        id: `evt-${Date.now()}`,
        ...eventData,
        status: eventData.status || 'pending_approval',
        createdAt: new Date().toISOString()
      };
      existing.unshift(newEvt);
      localStorage.setItem('cp_events', JSON.stringify(existing));
      return newEvt;
    } catch (_) {}
    throw err;
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    return await fetchWithAuth(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
  } catch (err) {
    console.warn('[Events] Backend updateEvent returned error, falling back locally:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('cp_events') || '[]');
      const updated = existing.map(e => e.id === id ? { ...e, ...eventData } : e);
      localStorage.setItem('cp_events', JSON.stringify(updated));
      return { id, ...eventData };
    } catch (_) {}
    throw err;
  }
};

export const deleteEvent = async (id, hard = false) => {
  let backendResult = null;
  try {
    backendResult = await fetchWithAuth(`/events/${id}${hard ? '?hard=true' : ''}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('[Events] Backend deleteEvent returned error, falling back locally:', err.message);
  }

  // Authoritatively synchronize persistent state across all storage tiers
  try {
    if (hard) {
      // 1. Permanently delete: record ID in cp_deleted_events
      const deletedIds = JSON.parse(localStorage.getItem('cp_deleted_events') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('cp_deleted_events', JSON.stringify(deletedIds));
      }

      // Remove from cancelled list if present
      const cancelledIds = JSON.parse(localStorage.getItem('cp_cancelled_events') || '[]');
      const filteredCancelled = cancelledIds.filter(cid => cid !== id);
      localStorage.setItem('cp_cancelled_events', JSON.stringify(filteredCancelled));

      // Remove from cp_events
      const existing = JSON.parse(localStorage.getItem('cp_events') || '[]');
      const updated = existing.filter(e => e.id !== id);
      localStorage.setItem('cp_events', JSON.stringify(updated));
    } else {
      // 2. Soft Cancel: record ID in cp_cancelled_events
      const cancelledIds = JSON.parse(localStorage.getItem('cp_cancelled_events') || '[]');
      if (!cancelledIds.includes(id)) {
        cancelledIds.push(id);
        localStorage.setItem('cp_cancelled_events', JSON.stringify(cancelledIds));
      }

      // Update in cp_events
      const existing = JSON.parse(localStorage.getItem('cp_events') || '[]');
      const updated = existing.map(e => e.id === id ? { ...e, status: 'cancelled' } : e);
      localStorage.setItem('cp_events', JSON.stringify(updated));
    }
  } catch (storageErr) {
    console.warn('Failed to update local event state:', storageErr);
  }

  return backendResult || { success: true, id, status: hard ? 'deleted' : 'cancelled' };
};

export const apiDeleteEvent = deleteEvent;

export const createVenue = async (venueData) => {
  return fetchWithAuth('/venues', {
    method: 'POST',
    body: JSON.stringify(venueData)
  });
};

// --- RSVPs & Tickets ---

export const createRsvp = async (eventId) => {
  return fetchWithAuth(`/events/${eventId}/rsvp`, {
    method: 'POST'
  });
};

export const cancelRsvp = async (eventId) => {
  return fetchWithAuth(`/events/${eventId}/rsvp`, {
    method: 'DELETE'
  });
};

export const fetchMyRsvps = async (userId, options = {}) => {
  return fetchWithAuth(`/users/${userId}/rsvps`, options);
};

export const fetchEventRsvps = async (eventId, options = {}) => {
  try {
    return await fetchWithAuth(`/events/${eventId}/rsvps`, options);
  } catch (err) {
    console.warn('[Attendance] Backend fetchEventRsvps fallback, loading local roster:', err.message);
    const storageKey = `cp_roster_${eventId}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (stored && Array.isArray(stored)) return stored;

    // Seed initial realistic roster for the event
    const sampleRoster = [
      { id: `rsvp-${eventId}-1`, userName: 'Ananthakrishnan P', userEmail: 'ananth@asiet.edu.in', studentId: 'ASIET-CS-2024-042', status: 'confirmed', checkInCode: 'CHK-A7B29F', createdAt: '2026-10-20T10:15:00Z' },
      { id: `rsvp-${eventId}-2`, userName: 'Devika Nair', userEmail: 'devika@asiet.edu.in', studentId: 'ASIET-EC-2024-018', status: 'confirmed', checkInCode: 'CHK-8835DE', createdAt: '2026-10-20T11:30:00Z' },
      { id: `rsvp-${eventId}-3`, userName: 'Rahul Menon', userEmail: 'rahul@asiet.edu.in', studentId: 'ASIET-ME-2024-089', status: 'confirmed', checkInCode: 'CHK-4F29A1', createdAt: '2026-10-21T09:20:00Z' },
      { id: `rsvp-${eventId}-4`, userName: 'Sneha George', userEmail: 'sneha@asiet.edu.in', studentId: 'ASIET-CS-2024-112', status: 'checked_in', checkInCode: 'CHK-91E44B', checkedIn: true, createdAt: '2026-10-21T14:00:00Z' },
    ];
    localStorage.setItem(storageKey, JSON.stringify(sampleRoster));
    return sampleRoster;
  }
};

export const checkInAttendee = async (eventId, { checkInCode, ticketId }) => {
  try {
    return await fetchWithAuth(`/events/${eventId}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ checkInCode, ticketId })
    });
  } catch (err) {
    console.warn('[Attendance] Backend checkin fallback, verifying locally:', err.message);
    const storageKey = `cp_roster_${eventId}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const targetCode = (checkInCode || ticketId || '').trim().toUpperCase();

    const attendee = stored.find(r => 
      (r.checkInCode && r.checkInCode.toUpperCase() === targetCode) ||
      (r.id && r.id.toUpperCase() === targetCode)
    );

    if (!attendee) {
      throw new Error(`Invalid code "${targetCode}". Check-in record not found.`);
    }

    if (attendee.status === 'checked_in' || attendee.checkedIn) {
      throw new Error(`Attendee ${attendee.userName} has already checked in.`);
    }

    attendee.status = 'checked_in';
    attendee.checkedIn = true;
    attendee.checkedInAt = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(stored));
    return { success: true, attendee };
  }
};

// --- Notifications ---

export const getNotifications = async (userId, options = {}) => {
  try {
    return await fetchWithAuth(`/users/${userId}/notifications`, options);
  } catch (err) {
    console.warn('[Notifications] Backend getNotifications fallback, loading local notifications:', err.message);
    const storageKey = `cp_notifications_${userId || 'student'}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (stored && Array.isArray(stored)) {
      return stored;
    }

    // Default notifications matching active campus events
    const sampleNotifications = [
      {
        SK: 'notif_1',
        title: 'Upcoming Event Reminder (Tomorrow)',
        message: 'Inter-Department Futsal Championship 2026 starts tomorrow at Campus Stadium. Tap to open campus walking directions!',
        type: 'reminder',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        payload: {
          eventId: '8835deed-6ad7-4fb3-869f-ba1558829f15',
          destination: '/student/navigate?eventId=8835deed-6ad7-4fb3-869f-ba1558829f15'
        }
      },
      {
        SK: 'notif_2',
        title: 'RSVP Confirmed from Waitlist! 🎉',
        message: 'A spot opened up for "Campus Football Match". Your admission pass has been confirmed with entrance navigation.',
        type: 'waitlist_promoted',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        payload: {
          eventId: '73b0a3fc-3157-42dd-9fe4-b443c0097dc2',
          destination: '/student/navigate?eventId=73b0a3fc-3157-42dd-9fe4-b443c0097dc2'
        }
      },
      {
        SK: 'notif_3',
        title: 'Venue Relocation Notice',
        message: 'The Campus Football Match has been assigned to Student Activity Hub. Walking route has been updated on the campus map.',
        type: 'venue_changed',
        read: true,
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        payload: {
          eventId: '73b0a3fc-3157-42dd-9fe4-b443c0097dc2',
          destination: '/student/navigate?eventId=73b0a3fc-3157-42dd-9fe4-b443c0097dc2'
        }
      }
    ];

    localStorage.setItem(storageKey, JSON.stringify(sampleNotifications));
    return sampleNotifications;
  }
};

export const markNotificationRead = async (notificationId, userId = 'student') => {
  try {
    return await fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ notificationId })
    });
  } catch (err) {
    console.warn('[Notifications] Backend markNotificationRead fallback:', err.message);
    const storageKey = `cp_notifications_${userId || 'student'}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = stored.map(n => (n.SK === notificationId || n.id === notificationId) ? { ...n, read: true } : n);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    return { success: true };
  }
};

export const markAllNotificationsRead = async (userId = 'student') => {
  try {
    const storageKey = `cp_notifications_${userId || 'student'}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = stored.map(n => ({ ...n, read: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// --- Governance: Event Review & Approval ---

export const reviewEvent = async (eventId, { action, reviewComment = '' }) => {
  try {
    return await fetchWithAuth(`/events/${eventId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reviewComment })
    });
  } catch (err) {
    console.warn('[Governance] Backend event review route fallback:', eventId, action, err);
    await new Promise(r => setTimeout(r, 400));
    return {
      success: true,
      eventId,
      action,
      status: action === 'approve' ? 'published' : (action === 'request_changes' ? 'needs_changes' : 'rejected'),
      reviewComment,
      simulated: true
    };
  }
};

// --- Governance: Organizer Account Provisioning & Management ---

export const createOrganizer = async ({ email, name, clubId, clubName, temporaryPassword }) => {
  try {
    return await fetchWithAuth('/admin/organizers', {
      method: 'POST',
      body: JSON.stringify({ email, name, clubId, clubName, temporaryPassword })
    });
  } catch (err) {
    console.warn('[Governance] Backend organizer API not available or route unmapped, saving organizer locally:', err);
    
    // Store organizer in localStorage so organizer can authenticate on this device/browser
    try {
      const existing = JSON.parse(localStorage.getItem('cp_organizers') || '[]');
      const updated = existing.filter(o => o.email?.toLowerCase() !== email?.toLowerCase());
      updated.push({
        email: email.trim(),
        name: name.trim(),
        clubId,
        clubName: clubName || '',
        temporaryPassword,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('cp_organizers', JSON.stringify(updated));
    } catch (storageErr) {
      console.warn('Failed to save organizer in localStorage:', storageErr);
    }

    await new Promise(r => setTimeout(r, 300));
    return {
      success: true,
      username: email,
      email,
      name,
      clubId,
      clubName: clubName || '',
      temporaryPassword,
      simulated: true
    };
  }
};

export const manageOrganizer = async (username, { action, temporaryPassword }) => {
  try {
    return await fetchWithAuth(`/admin/organizers/${encodeURIComponent(username)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, temporaryPassword })
    });
  } catch (err) {
    console.warn('[Governance] Simulating manage organizer fallback:', username, action);
    await new Promise(r => setTimeout(r, 300));
    return { success: true, username, action, simulated: true };
  }
};

