import React, { useContext, useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { RoleContext } from '../../context/RoleContext';
import { fetchClubById } from '../../services/apiService';
import logoImg from '../../assets/logo.png';
import {
  LayoutDashboard,
  CalendarPlus,
  UserCheck,
  Building2,
  LogOut,
  Menu,
  X,
  Users,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

const navLinks = [
  { to: '/organizer', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organizer/events/new', label: 'Create Event', icon: CalendarPlus },
  { to: '/organizer/rosters', label: 'Attendee Rosters', icon: UserCheck },
  { to: '/organizer/venues', label: 'Campus Venues', icon: Building2 },
];

const OrganizerLayout = () => {
  const { logout, currentUser, clubId } = useContext(RoleContext);
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clubDetails, setClubDetails] = useState(null);

  useEffect(() => {
    if (clubId) {
      fetchClubById(clubId)
        .then(data => setClubDetails(data))
        .catch(err => console.warn('Could not fetch club details for organizer layout:', err.message));
    }
  }, [clubId]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-neobrutalist font-body">

      {/* Sidebar (Desktop) */}
      <aside
        className={`hidden md:flex flex-col bg-pastel-yellow border-r-3 border-black sticky top-0 h-screen transition-all duration-300 z-50 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`p-4 border-b-3 border-black flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <NavLink to="/organizer" className="flex items-center gap-2 group min-w-0" title="EventTrail Organizer">
              <div className="bg-white px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000] inline-flex items-center">
                <img
                  src={logoImg}
                  alt="EventTrail"
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <span className="font-display font-black text-[10px] uppercase tracking-wider px-1.5 py-1 bg-black text-pastel-mint border border-black shadow-[1px_1px_0px_0px_#000] shrink-0">
                Organizer
              </span>
            </NavLink>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-black flex items-center justify-center shadow-[2px_2px_0px_0px_#22c55e]" title="EventTrail Organizer">
              <Users size={18} strokeWidth={2.5} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 border-2 border-transparent hover:border-black hover:bg-white transition-colors"
          >
            <ChevronRight size={18} strokeWidth={3} className={`text-black transition-transform duration-300 ${sidebarCollapsed ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Club Affiliation Banner */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 bg-white/70 border-b-2 border-black text-left">
            <span className="text-[10px] font-black uppercase text-black/60 tracking-wider block">
              Representing Club
            </span>
            <div className="font-display font-black text-sm uppercase truncate text-black flex items-center gap-1.5 mt-0.5">
              <Sparkles size={14} className="text-yellow-600 shrink-0" />
              <span className="truncate">{clubDetails?.name || currentUser?.clubId || 'Assigned Club'}</span>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 border-3 font-bold uppercase transition-all whitespace-nowrap neo-clickable ` +
                (isActive
                  ? 'border-black bg-white shadow-[2px_2px_0px_0px_#000]'
                  : 'border-transparent text-black/70 hover:border-black hover:bg-white hover:text-black hover:shadow-[2px_2px_0px_0px_#000]') +
                (sidebarCollapsed ? ' justify-center' : '')
              }
            >
              <Icon size={20} strokeWidth={2.5} className="shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t-3 border-black bg-white">
          {!sidebarCollapsed && currentUser && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-3 border-black bg-pastel-mint shadow-[2px_2px_0px_0px_#000] flex items-center justify-center font-display font-black text-base">
                {currentUser.name?.charAt(0) || 'O'}
              </div>
              <div className="overflow-hidden">
                <div className="font-display font-black text-sm uppercase truncate text-black">
                  {currentUser.name}
                </div>
                <div className="font-bold text-xs uppercase text-black/50">Club Organizer</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
            className={`flex items-center gap-2 p-3 bg-pastel-peach border-3 border-black font-bold uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_#000] transition-all w-full ${
              sidebarCollapsed ? 'justify-center' : 'justify-center'
            }`}
          >
            <LogOut size={18} strokeWidth={3} className="shrink-0" />
            {!sidebarCollapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar (Slide-in) */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-pastel-yellow border-r-3 border-black z-50 transform transition-transform duration-300 md:hidden flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b-3 border-black flex items-center justify-between">
          <NavLink to="/organizer" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="bg-white px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000] inline-flex items-center">
              <img
                src={logoImg}
                alt="EventTrail"
                className="h-8 w-auto object-contain"
              />
            </div>
            <span className="font-display font-black text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-black text-pastel-mint border border-black">
              Organizer
            </span>
          </NavLink>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 border-2 border-transparent hover:border-black hover:bg-white transition-colors"
          >
            <X size={20} strokeWidth={3} className="text-black" />
          </button>
        </div>

        <div className="px-4 py-3 bg-white/70 border-b-2 border-black text-left">
          <span className="text-[10px] font-black uppercase text-black/60 tracking-wider block">
            Representing Club
          </span>
          <div className="font-display font-black text-sm uppercase truncate text-black flex items-center gap-1.5 mt-0.5">
            <Sparkles size={14} className="text-yellow-600 shrink-0" />
            <span className="truncate">{clubDetails?.name || currentUser?.clubId || 'Assigned Club'}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 border-3 font-bold uppercase transition-all whitespace-nowrap neo-clickable ` +
                (isActive
                  ? 'border-black bg-white shadow-[2px_2px_0px_0px_#000]'
                  : 'border-transparent text-black/70 hover:border-black hover:bg-white hover:text-black hover:shadow-[2px_2px_0px_0px_#000]')
              }
            >
              <Icon size={20} strokeWidth={2.5} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t-3 border-black bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 p-3 bg-pastel-peach border-3 border-black font-bold uppercase shadow-[2px_2px_0px_0px_#000] transition-all w-full"
          >
            <LogOut size={18} strokeWidth={3} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center px-4 h-16 bg-white border-b-3 border-black sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 border-3 border-black bg-pastel-yellow shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-mint transition-colors"
          >
            <Menu size={20} strokeWidth={3} className="text-black" />
          </button>
          <NavLink to="/organizer" className="ml-4 flex items-center gap-2">
            <img
              src={logoImg}
              alt="EventTrail"
              className="h-9 w-auto object-contain"
            />
            <span className="font-display font-black text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-black text-pastel-mint border border-black">
              Organizer
            </span>
          </NavLink>
        </header>

        <main className="flex-1 bg-neobrutalist bg-grid-dots overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OrganizerLayout;
