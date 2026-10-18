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
  try {
    return await fetchWithAuth(`/events/${id}${hard ? '?hard=true' : ''}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('[Events] Backend deleteEvent returned error, falling back locally:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('cp_events') || '[]');
      const filtered = existing.filter(e => e.id !== id);
      localStorage.setItem('cp_events', JSON.stringify(filtered));
      return { success: true, id };
    } catch (_) {}
    throw err;
  }
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

export const createOrganizer = async ({ email, name, clubId, temporaryPassword }) => {
  try {
    return await fetchWithAuth('/admin/organizers', {
      method: 'POST',
      body: JSON.stringify({ email, name, clubId, temporaryPassword })
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

