import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { fetchEvents, fetchVenues, createRsvp, cancelRsvp, fetchMyRsvps } from '../services/apiService';
import { RoleContext } from './RoleContext';

export const RsvpContext = createContext();

export const DEFAULT_CAMPUS_VENUES = [
  {
    id: 'venue-science-b',
    name: 'Science Building Block B',
    building: 'Science Building Block B',
    category: 'Academic',
    distance: '150m',
    nodeId: 'entrance-science',
    lat: 10.17748302,
    lng: 76.42947042,
    description: 'Applied Sciences block featuring Chemistry, Physics, and Biotechnology labs.',
    indoorSteps: ['Enter main entrance', 'Turn left to Auditorium'],
    waypoints: []
  },
  {
    id: 'venue-hub',
    name: 'Student Activity Hub',
    building: 'Student Activity Hub',
    category: 'Facility',
    distance: '200m',
    nodeId: 'entrance-hub',
    lat: 10.17759638,
    lng: 76.43004264,
    description: 'Heart of campus student life. Club rooms and maker space.',
    indoorSteps: ['Enter main lobby', 'Take stairs to Room 202'],
    waypoints: []
  },
  {
    id: 'venue-stadium',
    name: 'Campus Sports Ground',
    building: 'Campus Sports Ground',
    category: 'Sports',
    distance: '300m',
    nodeId: 'entrance-stadium',
    lat: 10.1777,
    lng: 76.4305,
    description: 'ASIET sports complex with full-size field and basketball court.',
    indoorSteps: ['Enter through sports pavilion'],
    waypoints: []
  }
];

export const getStoredVenues = () => {
  try {
    const raw = localStorage.getItem('eventtrail_admin_venues');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return DEFAULT_CAMPUS_VENUES;
};

export const RsvpProvider = ({ children }) => {
  const { currentUser, isLoggedIn } = useContext(RoleContext);

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState(getStoredVenues);
  const [userRsvps, setUserRsvps] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches the latest events and venues from the real API backend.
   * Merges remote and persistent admin-created buildings/venues.
   */
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apiEventsRes, apiVenuesRes] = await Promise.allSettled([
        fetchEvents(),
        fetchVenues()
      ]);

      const validEvents = apiEventsRes.status === 'fulfilled' && Array.isArray(apiEventsRes.value) 
        ? apiEventsRes.value 
        : [];
      setEvents(validEvents);

      const localVenues = getStoredVenues();
      if (apiVenuesRes.status === 'fulfilled' && Array.isArray(apiVenuesRes.value) && apiVenuesRes.value.length > 0) {
        const apiIds = new Set(apiVenuesRes.value.map(v => v.id));
        const customOnly = localVenues.filter(v => !apiIds.has(v.id));
        setVenues([...apiVenuesRes.value, ...customOnly]);
      } else {
        setVenues(localVenues);
      }
    } catch (error) {
      console.error('Failed to load events/venues:', error.message);
      setEvents([]);
      setVenues(getStoredVenues());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch fresh data from the API on every mount — no localStorage seed.
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // Fetch user RSVPs from backend
  useEffect(() => {
    if (isLoggedIn && currentUser?.id) {
      fetchMyRsvps(currentUser.id)
        .then(rsvps => {
           const rsvpMap = {};
           rsvps.forEach(r => {
              rsvpMap[r.eventId] = {
                 rsvpStatus: r.status === 'confirmed' ? "RSVP'd" : "Waitlisted",
                 ticketNumber: `CP-${r.eventId.substring(0, 4).toUpperCase()}-001`,
                 timestamp: r.createdAt
              };
           });
           setUserRsvps(rsvpMap);
        })
        .catch(err => console.error("Failed to load user RSVPs", err));
    } else {
      setUserRsvps({});
    }
  }, [isLoggedIn, currentUser]);

  const submitRsvp = async (eventId) => {
    if (userRsvps[eventId]) return userRsvps[eventId];

    try {
      const result = await createRsvp(eventId);
      const isWaitlisted = result.status === 'waitlisted';
      const statusStr = isWaitlisted ? 'Waitlisted' : "RSVP'd";
      
      setUserRsvps((prev) => ({
        ...prev,
        [eventId]: {
          rsvpStatus: statusStr,
          ticketNumber: `CP-${eventId.substring(0, 4).toUpperCase()}-001`,
          timestamp: new Date().toISOString(),
        },
      }));
      
      // Refresh events to reflect updated seat counts
      refreshEvents();
      return { rsvpStatus: statusStr };
    } catch (error) {
      console.error('Failed to submit RSVP:', error);
      throw error;
    }
  };

  const cancelUserRsvp = async (eventId) => {
    try {
      await cancelRsvp(eventId);
      setUserRsvps((prev) => {
        const copy = { ...prev };
        delete copy[eventId];
        return copy;
      });
      // Refresh events to reflect available seats
      refreshEvents();
    } catch (error) {
      console.error('Failed to cancel RSVP:', error);
      throw error;
    }
  };

  const addVenue = (newVenue) => {
    setVenues((prev) => {
      const updated = [newVenue, ...prev.filter(v => v.id !== newVenue.id)];
      try {
        localStorage.setItem('eventtrail_admin_venues', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const updateVenue = (updatedVenue) => {
    setVenues((prev) => {
      const updated = prev.map(v => v.id === updatedVenue.id ? updatedVenue : v);
      try {
        localStorage.setItem('eventtrail_admin_venues', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const deleteVenue = (venueId) => {
    setVenues((prev) => {
      const updated = prev.filter(v => v.id !== venueId);
      try {
        localStorage.setItem('eventtrail_admin_venues', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const clearAllLocalData = () => {
    setUserRsvps({});
    // Re-fetch from API to get the true current state
    refreshEvents();
  };

  return (
    <RsvpContext.Provider value={{ 
      events, venues, userRsvps, isLoading,
      submitRsvp, cancelUserRsvp,
      addVenue, updateVenue, deleteVenue,
      clearAllLocalData,
      refreshEvents,
    }}>
      {children}
    </RsvpContext.Provider>
  );
};
