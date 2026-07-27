import React, { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { RoleContext } from '../../context/RoleContext';
import {
  LayoutDashboard,
  CalendarPlus,
  Building2,
  Upload,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const navLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/event-form', label: 'Create Event', icon: CalendarPlus },
  { to: '/admin/venues', label: 'Venues', icon: Building2 },
  { to: '/admin/venue-upload', label: 'Venue Upload', icon: Upload },
];

const AdminLayout = () => {
  const { logout, currentUser } = useContext(RoleContext);
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-neobrutalist font-body">

      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-pastel-mint border-r-3 border-black sticky top-0 h-screen transition-all duration-300 z-50 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`p-4 border-b-3 border-black flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black flex items-center justify-center shadow-[2px_2px_0px_0px_#FFDB58]">
                <ShieldCheck size={18} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="font-display font-black text-lg uppercase tracking-tight text-black">
                Admin
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-black flex items-center justify-center shadow-[2px_2px_0px_0px_#FFDB58]">
              <ShieldCheck size={18} strokeWidth={2.5} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 border-2 border-transparent hover:border-black hover:bg-white transition-colors"
          >
            <ChevronRight size={18} strokeWidth={3} className={`text-black transition-transform duration-300 ${sidebarCollapsed ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>

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
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 border-3 border-black shadow-[2px_2px_0px_0px_#000]"
              />
              <div className="overflow-hidden">
                <div className="font-display font-black text-sm uppercase truncate text-black">
                  {currentUser.name}
                </div>
                <div className="font-bold text-xs uppercase text-black/50">Admin</div>
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
        className={`fixed inset-y-0 left-0 w-64 bg-pastel-mint border-r-3 border-black z-50 transform transition-transform duration-300 md:hidden flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black flex items-center justify-center shadow-[2px_2px_0px_0px_#FFDB58]">
              <ShieldCheck size={18} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="font-display font-black text-lg uppercase tracking-tight text-black">
              Admin
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 border-2 border-transparent hover:border-black hover:bg-white transition-colors"
          >
            <X size={20} strokeWidth={3} className="text-black" />
          </button>
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
            className="p-2 border-3 border-black bg-pastel-mint shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-yellow transition-colors"
          >
            <Menu size={20} strokeWidth={3} className="text-black" />
          </button>
          <span className="ml-4 font-display font-black text-lg uppercase tracking-tight text-black">
            Admin Panel
          </span>
        </header>

        <main className="flex-1 bg-neobrutalist bg-grid-dots overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
