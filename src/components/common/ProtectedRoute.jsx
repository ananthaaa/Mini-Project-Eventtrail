import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Open portal pass-through with no access restrictions.
 * Allows simultaneous usage across Student, Organizer, and Admin portals.
 */
export default function ProtectedRoute({ children }) {
  return children ? children : <Outlet />;
}
