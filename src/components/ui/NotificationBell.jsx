import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../../services/apiService';
import { RoleContext } from '../../context/RoleContext';

export function NotificationBell() {
  const { user } = useContext(RoleContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifs = async () => {
      try {
        // Our user context should provide the user's id (sub from JWT)
        const userId = user.id || user.username; 
        if (!userId) return;

        const data = await getNotifications(userId);
        setNotifications(data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifs();
    // In a real prod app, you might poll this or use WebSockets.
    // For now, fetch once on mount/auth change.
    const interval = setInterval(fetchNotifs, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [user]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    if (!notif.read) {
      try {
        await markNotificationRead(notif.SK); // SK is the notificationId
        setNotifications(prev => 
          prev.map(n => n.SK === notif.SK ? { ...n, read: true } : n)
        );
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
    
    if (notif.payload?.eventId) {
      navigate(`/events/${notif.payload.eventId}`);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-300 hover:text-white relative transition-colors focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                You're all caught up!
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.SK}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!notif.read ? 'bg-indigo-500/10' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div>
                      <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {notif.type === 'new_event' 
                          ? `New Event: ${notif.payload?.title}`
                          : 'New update'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(parseInt(notif.SK.split('#')[0])).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
