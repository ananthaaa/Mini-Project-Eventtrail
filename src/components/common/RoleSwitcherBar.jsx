import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RoleContext } from '../../context/RoleContext';
import { Shield, Users, GraduationCap, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export default function RoleSwitcherBar() {
  const { currentRole, switchRole } = useContext(RoleContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const roles = [
    {
      id: 'student',
      label: 'Student',
      icon: GraduationCap,
      path: '/student',
      activeBg: 'bg-pastel-mint',
    },
    {
      id: 'club_admin',
      label: 'Organizer',
      icon: Users,
      path: '/organizer',
      activeBg: 'bg-pastel-peach',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      path: '/admin',
      activeBg: 'bg-pastel-yellow',
    },
  ];

  const handleRoleSelect = (roleId, targetPath) => {
    switchRole(roleId);
    navigate(targetPath);
  };

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] select-none">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 bg-accent-yellow border-3 border-black px-3 py-2 font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          title="Open Role Switcher"
        >
          <Zap size={14} className="fill-black" />
          <span>Role Switcher</span>
          <ChevronUp size={14} strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Role Switcher" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] max-w-[95vw] select-none">
      <div className="bg-white border-3 border-black p-1.5 md:p-2 shadow-[4px_4px_0px_0px_#000] flex items-center gap-1 md:gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2 text-xs font-black uppercase tracking-wider text-black border-r-2 border-black pr-3">
          <Zap size={14} className="fill-black text-black" />
          <span className="hidden md:inline">Live Role:</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = currentRole === r.id;

            return (
              <button
                key={r.id}
                onClick={() => handleRoleSelect(r.id, r.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? `${r.activeBg} shadow-[2px_2px_0px_0px_#000] translate-y-[-1px]`
                    : 'bg-white hover:bg-black/5 opacity-75 hover:opacity-100 shadow-[1px_1px_0px_0px_#000]'
                }`}
                title={`Switch to ${r.label} role`}
              >
                <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                <span>{r.label}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-black inline-block ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 border-2 border-transparent hover:border-black hover:bg-black/5 transition-colors cursor-pointer text-black ml-1"
          title="Minimize Role Switcher"
        >
          <ChevronDown size={14} strokeWidth={3} />
        </button>
      </div>
    </aside>
  );
}
