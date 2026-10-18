import React, { useContext } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { RoleContext } from '../../context/RoleContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ requiredRole = null, children }) {
  const { isLoggedIn, currentRole, authLoading } = useContext(RoleContext);
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neobrutalist p-6">
        <div className="bg-white border-3 border-black p-8 neo-shadow flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
          <span className="font-display font-black text-lg uppercase tracking-wider">
            Verifying campus credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    // Preserve intended destination path so user returns here after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const hasPermission = () => {
    if (!requiredRole) return true;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(currentRole);
    }
    return currentRole === requiredRole;
  };

  if (!hasPermission()) {
    const roleLabels = {
      admin: 'Platform Administrator',
      club_admin: 'Club Organizer',
      student: 'Student'
    };
    const returnPath = currentRole === 'admin' ? '#/admin' : (currentRole === 'club_admin' ? '#/organizer' : '#/student');
    const returnPortalName = currentRole === 'admin' ? 'Admin Portal' : (currentRole === 'club_admin' ? 'Organizer Portal' : 'Student Portal');

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neobrutalist p-6">
        <div className="max-w-md bg-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_#000] text-center">
          <div className="w-16 h-16 bg-red-100 border-3 border-black mx-auto mb-4 flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="font-bold text-sm text-gray-700 mb-6">
            You do not have permission to view this resource. You are currently signed in as {roleLabels[currentRole] || currentRole}.
          </p>
          <a
            href={returnPath}
            className="inline-block w-full py-3 bg-pastel-mint border-3 border-black font-black uppercase text-sm shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
          >
            Return to {returnPortalName}
          </a>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
