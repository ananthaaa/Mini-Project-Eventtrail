import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
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
  const { currentUser, user, isLoggedIn } = useContext(RoleContext);
  const activeUser = currentUser || user;

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState(getStoredVenues);
  const [userRsvps, setUserRsvps] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [submittingIds, setSubmittingIds] = useState(new Set());

  /**
   * Fetches the latest events and venues from the backend API.
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

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // Fetch user RSVPs from backend when authenticated
  useEffect(() => {
    const userId = activeUser?.id || activeUser?.sub;
    if (isLoggedIn && userId) {
      fetchMyRsvps(userId)
        .then(rsvps => {
          const rsvpMap = {};
          if (Array.isArray(rsvps)) {
            rsvps.forEach(r => {
              rsvpMap[r.eventId] = {
                status: r.status,
                rsvpStatus: r.status === 'confirmed' ? "RSVP'd" : "Waitlisted",
                ticketNumber: r.ticketId || `TKT-${r.eventId.substring(0, 8).toUpperCase()}-001`,
                ticketId: r.ticketId || null,
                checkInCode: r.checkInCode || null,
                checkedIn: Boolean(r.checkedIn),
                waitlistPosition: r.waitlistPosition || null,
                timestamp: r.createdAt || new Date().toISOString(),
              };
            });
          }
          setUserRsvps(rsvpMap);
        })
        .catch(err => console.warn("Failed to load user reservations:", err.message));
    } else {
      setUserRsvps({});
    }
  }, [isLoggedIn, activeUser]);

  const submitRsvp = async (eventId) => {
    if (userRsvps[eventId]) return userRsvps[eventId];
    if (submittingIds.has(eventId)) {
      throw new Error("Reservation request already in progress.");
    }

    setSubmittingIds(prev => new Set(prev).add(eventId));

    try {
      const result = await createRsvp(eventId);
      const isWaitlisted = result.status === 'waitlisted';
      const statusStr = isWaitlisted ? 'Waitlisted' : "RSVP'd";
      const ticketId = result.ticketId || (isWaitlisted ? null : `TKT-${eventId.substring(0, 8).toUpperCase()}`);
      const checkInCode = result.checkInCode || null;

      const record = {
        status: result.status,
        rsvpStatus: statusStr,
        ticketNumber: ticketId || `WL-${eventId.substring(0, 6).toUpperCase()}`,
        ticketId,
        checkInCode,
        waitlistPosition: result.waitlistPosition || null,
        timestamp: new Date().toISOString(),
      };

      setUserRsvps((prev) => ({
        ...prev,
        [eventId]: record,
      }));

      // Refresh events to reflect updated seat / waitlist counts
      refreshEvents();
      return record;
    } catch (error) {
      console.error('Failed to submit RSVP:', error);
      throw error;
    } finally {
      setSubmittingIds(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
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
      // Refresh events to reflect returned seat
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
    // Validate if any events reference this venue
    const isReferenced = events.some(e => e.venueId === venueId);
    if (isReferenced) {
      const referencedEvent = events.find(e => e.venueId === venueId);
      throw new Error(`Cannot remove venue: It is assigned to event "${referencedEvent?.title || venueId}".`);
    }

    setVenues((prev) => {
      const updated = prev.filter(v => v.id !== venueId);
      try {
        localStorage.setItem('eventtrail_admin_venues', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const refreshAllData = () => {
    return refreshEvents();
  };

  return (
    <RsvpContext.Provider value={{ 
      events, venues, userRsvps, isLoading,
      submitRsvp, cancelUserRsvp,
      addVenue, updateVenue, deleteVenue,
      refreshAllData,
      refreshEvents,
    }}>
      {children}
    </RsvpContext.Provider>
  );
};
