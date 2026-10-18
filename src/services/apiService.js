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
  return fetchFromApi(endpoint, { ...options, headers: { ...headers, ...(options.headers || {}) } });
};

export const fetchEventById = async (id, options = {}) => {
  return fetchFromApi(`/events/${id}`, options);
};

// --- Clubs (Public Reads with Optional Auth Enrichment) ---

export const fetchClubs = async (options = {}) => {
  let headers = {};
  try {
    const session = await authService.getCurrentSession();
    if (session?.idToken) headers.Authorization = `Bearer ${session.idToken}`;
  } catch (_) {}

  return fetchFromApi('/clubs', { ...options, headers: { ...headers, ...(options.headers || {}) } });
};

export const fetchClubById = async (id, options = {}) => {
  let headers = {};
  try {
    const session = await authService.getCurrentSession();
    if (session?.idToken) headers.Authorization = `Bearer ${session.idToken}`;
  } catch (_) {}

  return fetchFromApi(`/clubs/${id}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
};

export const createClub = async (clubData) => {
  return fetchWithAuth('/clubs', {
    method: 'POST',
    body: JSON.stringify(clubData)
  });
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
  return fetchWithAuth('/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

export const updateEvent = async (id, eventData) => {
  return fetchWithAuth(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData)
  });
};

export const deleteEvent = async (id, hard = false) => {
  return fetchWithAuth(`/events/${id}${hard ? '?hard=true' : ''}`, {
    method: 'DELETE'
  });
};

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
  return fetchWithAuth(`/events/${eventId}/rsvps`, options);
};

export const checkInAttendee = async (eventId, { checkInCode, ticketId }) => {
  return fetchWithAuth(`/events/${eventId}/checkin`, {
    method: 'POST',
    body: JSON.stringify({ checkInCode, ticketId })
  });
};

// --- Notifications ---

export const getNotifications = async (userId, options = {}) => {
  return fetchWithAuth(`/users/${userId}/notifications`, options);
};

export const markNotificationRead = async (notificationId) => {
  return fetchWithAuth(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    body: JSON.stringify({ notificationId })
  });
};

// --- Governance: Event Review & Approval ---

export const reviewEvent = async (eventId, { action, reviewComment = '' }) => {
  try {
    return await fetchWithAuth(`/events/${eventId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reviewComment })
    });
  } catch (err) {
    if (import.meta.env.DEV && (err.message?.includes('Failed to fetch') || err.status === 404 || err.status === 401)) {
      console.warn('[Local Dev] Simulating event review action:', eventId, action);
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
    throw err;
  }
};

// --- Governance: Organizer Account Provisioning & Management ---

export const createOrganizer = async ({ email, name, clubId, temporaryPassword }) => {
  try {
    return await fetchWithAuth('/admin/organizers', {
      method: 'POST',
      body: JSON.stringify({ email, name, clubId, temporaryPassword })
    });
  } catch (err) {
    if (import.meta.env.DEV && (err.message?.includes('Failed to fetch') || err.status === 404 || err.status === 401 || err.status === 403)) {
      console.warn('[Local Dev] Simulating organizer provisioning:', email);
      await new Promise(r => setTimeout(r, 500));
      return {
        success: true,
        username: email,
        email,
        name,
        clubId,
        temporaryPassword,
        simulated: true
      };
    }
    throw err;
  }
};

export const manageOrganizer = async (username, { action, temporaryPassword }) => {
  try {
    return await fetchWithAuth(`/admin/organizers/${encodeURIComponent(username)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, temporaryPassword })
    });
  } catch (err) {
    if (import.meta.env.DEV && (err.message?.includes('Failed to fetch') || err.status === 404 || err.status === 401)) {
      console.warn('[Local Dev] Simulating manage organizer:', username, action);
      await new Promise(r => setTimeout(r, 400));
      return { success: true, username, action, simulated: true };
    }
    throw err;
  }
};

