import React, { createContext, useState, useEffect, useCallback } from 'react';
import { fetchEvents, fetchVenues } from '../services/apiService';

export const RsvpContext = createContext();

export const RsvpProvider = ({ children }) => {
  // Events and venues are NEVER seeded from localStorage — always fetched fresh from the API.
  // This ensures deleted/created events by admin are always reflected correctly.
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);

  const [userRsvps, setUserRsvps] = useState(() => {
    const saved = localStorage.getItem('cp_user_rsvps');
    return saved ? JSON.parse(saved) : {};
  });

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches the latest events and venues from the real API backend.
   * Returns an empty array if the API returns empty — this is the correct
   * state when no events have been created yet (not a fallback to demo data).
   */
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apiEvents, apiVenues] = await Promise.all([
        fetchEvents(),
        fetchVenues()
      ]);
      // Always set whatever the API returns — even an empty array means
      // "no events created yet" and is the correct state to display.
      setEvents(Array.isArray(apiEvents) ? apiEvents : []);
      setVenues(Array.isArray(apiVenues) ? apiVenues : []);
    } catch (error) {
      console.error('Failed to load events/venues from API:', error.message);
      // On API error, show empty — do NOT fall back to demo/cached data.
      setEvents([]);
      setVenues([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch fresh data from the API on every mount — no localStorage seed.
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // Only persist RSVP state locally (user-specific, not admin-managed data).
  useEffect(() => {
    localStorage.setItem('cp_user_rsvps', JSON.stringify(userRsvps));
  }, [userRsvps]);

  const submitRsvp = (eventId) => {
    if (userRsvps[eventId]) return userRsvps[eventId];

    let status = null;
    let ticketNumber = null;

    setEvents((prevEvents) =>
      prevEvents.map((evt) => {
        if (evt.id === eventId) {
          if (evt.seatsAvailable > 0) {
            status = "RSVP'd";
            const seatNum = evt.seatsTotal - evt.seatsAvailable + 1;
            ticketNumber = `CP-${evt.id.substring(0, 4).toUpperCase()}-${String(seatNum).padStart(3, '0')}`;
            return {
              ...evt,
              seatsAvailable: evt.seatsAvailable - 1,
              rsvpCount: (evt.rsvpCount || 0) + 1,
            };
          } else {
            status = 'Waitlisted';
            return {
              ...evt,
              waitlistCount: (evt.waitlistCount || 0) + 1,
            };
          }
        }
        return evt;
      })
    );

    setUserRsvps((prev) => ({
      ...prev,
      [eventId]: {
        rsvpStatus: status,
        ticketNumber: ticketNumber,
        seatNumber: ticketNumber ? ticketNumber.split('-').pop() : null,
        timestamp: new Date().toISOString(),
      },
    }));

    return { rsvpStatus: status, ticketNumber };
  };

  const addVenue = (newVenue) => {
    setVenues((prev) => [newVenue, ...prev]);
  };

  const updateVenue = (updatedVenue) => {
    setVenues((prev) => prev.map(v => v.id === updatedVenue.id ? updatedVenue : v));
  };

  const deleteVenue = (venueId) => {
    setVenues((prev) => prev.filter(v => v.id !== venueId));
  };

  const clearAllLocalData = () => {
    localStorage.removeItem('cp_user_rsvps');
    setUserRsvps({});
    // Re-fetch from API to get the true current state
    refreshEvents();
  };

  return (
    <RsvpContext.Provider value={{ 
      events, venues, userRsvps, isLoading,
      submitRsvp,
      addVenue, updateVenue, deleteVenue,
      clearAllLocalData,
      refreshEvents,
    }}>
      {children}
    </RsvpContext.Provider>
  );
};
