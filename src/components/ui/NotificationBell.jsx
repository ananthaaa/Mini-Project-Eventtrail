import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../../services/apiService';
import { RoleContext } from '../../context/RoleContext';
import { Bell, Check, ExternalLink, Calendar, Ticket } from 'lucide-react';

export function NotificationBell() {
  const { currentUser, user } = useContext(RoleContext);
  const activeUser = currentUser || user;
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!activeUser) return;

    const fetchNotifs = async () => {
      try {
        const userId = activeUser.id || activeUser.sub || activeUser.email;
        if (!userId) return;

        const data = await getNotifications(userId);
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      } catch (err) {
        console.warn('Could not fetch notifications:', err.message);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 45000); // 45s poll
    return () => clearInterval(interval);
  }, [activeUser]);

  // Click outside to close
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
    if (!notif.read && notif.SK) {
      try {
        await markNotificationRead(notif.SK);
        setNotifications(prev =>
          prev.map(n => n.SK === notif.SK ? { ...n, read: true } : n)
        );
      } catch (err) {
        console.warn('Failed to mark notification read:', err.message);
      }
    }

    const dest = notif.payload?.destination || 
      (notif.payload?.eventId ? `/student/events/${notif.payload.eventId}` : null);
    
    if (dest) {
      navigate(dest);
    }
  };

  if (!activeUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Campus notifications, ${unreadCount} unread`}
        className="p-2 border-2 border-black bg-white hover:bg-pastel-yellow relative transition-colors shadow-[2px_2px_0px_0px_#000] focus-visible:ring-2 focus-visible:ring-black cursor-pointer"
      >
        <Bell className="w-5 h-5 text-black" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-black text-[9px] font-black text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 border-b-2 border-black bg-pastel-yellow flex items-center justify-between">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-black">
              Campus Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-white border border-black text-[10px] font-black px-2 py-0.5">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y-2 divide-black/10">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-black/60 uppercase tracking-wider">
                No notifications right now. You're all caught up!
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.SK || notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNotificationClick(notif); }}
                  className={`p-3.5 hover:bg-pastel-mint/30 transition-colors cursor-pointer text-left ${
                    !notif.read ? 'bg-pastel-mint/15 font-bold' : 'bg-white opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-black text-black">
                      {notif.title || 'Campus Update'}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-accent-green shrink-0 mt-1 border border-black"></span>
                    )}
                  </div>
                  <p className="text-xs text-black/80 font-medium line-clamp-2 mb-1.5">
                    {notif.message || notif.body}
                  </p>
                  <span className="text-[10px] text-black/50 font-mono">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
