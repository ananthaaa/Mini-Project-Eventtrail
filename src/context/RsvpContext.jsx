import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { fetchEvents, fetchVenues, createRsvp, cancelRsvp, fetchMyRsvps } from '../services/apiService';
import { RoleContext } from './RoleContext';

export const RsvpContext = createContext();

export const RsvpProvider = ({ children }) => {
  // Events and venues are NEVER seeded from localStorage — always fetched fresh from the API.
  // This ensures deleted/created events by admin are always reflected correctly.
  const { currentUser, isLoggedIn } = useContext(RoleContext);

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [userRsvps, setUserRsvps] = useState({});

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
    setVenues((prev) => [newVenue, ...prev]);
  };

  const updateVenue = (updatedVenue) => {
    setVenues((prev) => prev.map(v => v.id === updatedVenue.id ? updatedVenue : v));
  };

  const deleteVenue = (venueId) => {
    setVenues((prev) => prev.filter(v => v.id !== venueId));
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
