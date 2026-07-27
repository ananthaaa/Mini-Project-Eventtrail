import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RoleContext } from '../../context/RoleContext';
import { NavModeContext } from '../../context/NavModeContext';
import { Shield, User, Compass, MapPin, Grid, Layers, LogIn } from 'lucide-react';

const NavBar = () => {
  const { currentRole, isLoggedIn, logout } = useContext(RoleContext);
  const { activeEventId, currentPhase } = useContext(NavModeContext);
  const location = useLocation();

  const isStudent = currentRole === 'student';

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItemClass = (path) => {
    const activeClass = "text-accent bg-accent/10 font-bold";
    const inactiveClass = "text-text-secondary hover:text-text-primary hover:bg-bg-surface-alt font-medium";
    return `text-sm px-4 py-2 rounded-full transition-colors ${
      isActive(path) ? activeClass : inactiveClass
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle w-full select-none">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-accent text-accent-contrast w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-xl transition-transform group-hover:scale-105">
            ET
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-text-primary group-hover:text-accent transition-colors hidden sm:block">
            EventTrail
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-bg-surface border border-border-subtle p-1 rounded-full">
            {isStudent ? (
              <>
                <Link to="/" className={navItemClass('/')}>
                  Home
                </Link>
                <Link to="/discover" className={navItemClass('/discover')}>
                  Discover
                </Link>
                <Link to="/clubs" className={navItemClass('/clubs')}>
                  Clubs
                </Link>
                {activeEventId && currentPhase && (
                  <Link
                    to="/navigate"
                    className={`${navItemClass('/navigate')} !text-red-400 !bg-red-500/10 flex items-center gap-2`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Navigating
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/admin" className={navItemClass('/admin')}>
                  Dashboard
                </Link>
                <Link to="/admin/event-form" className={navItemClass('/admin/event-form')}>
                  New Event
                </Link>
                <Link to="/admin/venues" className={navItemClass('/admin/venues')}>
                  Venues
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isStudent && isLoggedIn && (
              <Link to="/profile" className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-surface border border-border-subtle text-text-secondary hover:text-accent hover:border-accent transition-colors">
                <User size={18} />
              </Link>
            )}

            {!isLoggedIn ? (
              <Link
                to="/login"
                className="flex items-center gap-2 py-2 px-4 rounded-full text-sm font-medium bg-bg-surface border border-border-subtle text-text-primary hover:bg-bg-surface-alt transition-colors"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Log In</span>
              </Link>
            ) : (
              <button
                onClick={logout}
                className={`flex items-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                  isStudent ? 'bg-bg-surface border border-border-subtle text-text-primary hover:bg-bg-surface-alt' : 'bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30'
                }`}
              >
                {isStudent ? (
                  <>
                    <User size={16} />
                    <span className="hidden sm:inline">Log Out</span>
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    <span className="hidden sm:inline">Exit Admin</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
