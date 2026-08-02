import React, { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { RoleContext } from '../../context/RoleContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Compass,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  Map as MapIcon,
  MapPin
} from 'lucide-react';
import Badge from '../ui/Badge';

const navLinks = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/events', label: 'Events', icon: Calendar },
  { to: '/student/campus-map', label: 'Map', icon: MapIcon },
  { to: '/student/navigate', label: 'Navigate', icon: Compass },
  { to: '/student/clubs', label: 'Clubs', icon: Users },
  { to: '/student/profile', label: 'Profile', icon: User },
];

const StudentLayout = () => {
  const { logout, currentUser } = useContext(RoleContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neobrutalist font-body">
      {/* Top Navigation */}
      <header className="bg-white border-b-3 border-black sticky top-0 z-50 neo-shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left Side: Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent-yellow border-3 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <Zap size={16} strokeWidth={3} className="text-black" />
              </div>
              <span className="font-display font-black text-xl uppercase tracking-tight text-black hidden sm:block">
                Event<span className="text-accent-yellow drop-shadow-[1px_1px_0px_#000]">Trail</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 border-3 font-bold text-sm uppercase tracking-wider transition-all neo-clickable ` +
                  (isActive
                    ? 'border-black bg-pastel-mint shadow-[2px_2px_0px_0px_#000]'
                    : 'border-transparent text-black/70 hover:border-black hover:bg-pastel-yellow hover:text-black')
                }
              >
                <Icon size={16} strokeWidth={2.5} />
                {label}
              </NavLink>
            ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-3">
                <span className="font-display font-bold uppercase text-sm truncate max-w-[100px] lg:max-w-[150px]">
                  {currentUser.name?.split(' ')[0]}
                </span>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border-3 border-black shadow-[2px_2px_0px_0px_#000] shrink-0"
                />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="hidden sm:flex shrink-0 items-center gap-2 px-3 py-2 bg-pastel-peach border-3 border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_#000] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_#000] transition-all"
            >
              <LogOut size={14} strokeWidth={3} />
              Logout
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 border-3 border-black bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-yellow"
            >
              {mobileOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={3} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="xl:hidden bg-white border-t-3 border-black p-4 flex flex-col gap-2">
            {navLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 border-3 font-bold uppercase transition-all ` +
                  (isActive
                    ? 'border-black bg-pastel-mint shadow-[2px_2px_0px_0px_#000]'
                    : 'border-transparent text-black/70 hover:border-black hover:bg-pastel-yellow hover:text-black')
                }
              >
                <Icon size={18} strokeWidth={2.5} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 mt-4 p-3 bg-pastel-peach border-3 border-black font-bold uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_#000] transition-all"
            >
              <LogOut size={18} strokeWidth={3} />
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
