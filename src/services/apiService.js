import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_HTTP_API_URL;

const fetchFromApi = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

const fetchWithAuth = async (endpoint, options = {}) => {
  const session = await authService.getCurrentSession();
  const token = session?.idToken;
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token,  // AWS JWT Authorizer expects raw token (no 'Bearer ' prefix)
    ...(options.headers || {})
  };

  return fetchFromApi(endpoint, { ...options, headers });
};

export const fetchEvents = async (params = {}) => {
  const urlParams = new URLSearchParams(params).toString();
  const endpoint = urlParams ? `/events?${urlParams}` : '/events';
  return fetchFromApi(endpoint);
};

export const fetchEventById = async (id) => {
  return fetchFromApi(`/events/${id}`);
};

export const fetchClubs = async () => {
  return fetchFromApi('/clubs');
};

export const fetchClubById = async (id) => {
  return fetchFromApi(`/clubs/${id}`);
};

export const fetchVenues = async () => {
  return fetchFromApi('/venues');
};

export const fetchVenueById = async (id) => {
  return fetchFromApi(`/venues/${id}`);
};

export const fetchSpeakers = async () => {
  return fetchFromApi('/speakers');
};

export const fetchPathNodes = async () => {
  return fetchFromApi('/graph/nodes');
};

export const fetchPathEdges = async () => {
  return fetchFromApi('/graph/edges');
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

export const deleteEvent = async (id) => {
  return fetchWithAuth(`/events/${id}`, {
    method: 'DELETE'
  });
};

export const createVenue = async (venueData) => {
  return fetchWithAuth('/venues', {
    method: 'POST',
    body: JSON.stringify(venueData)
  });
};
