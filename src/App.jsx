import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { RsvpProvider } from './context/RsvpContext';
import { NavModeProvider } from './context/NavModeContext';
import { RoleProvider } from './context/RoleContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout Shells
import LandingLayout from './components/layout/LandingLayout';
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';

// UI utilities (still needed by some inner pages)
import MockToast from './components/ui/MockToast';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login';
import SignupPage from './pages/SignupPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import EventDiscovery from './pages/EventDiscovery';
import EventDetail from './pages/EventDetail';
import RsvpConfirmation from './pages/RsvpConfirmation';
import NavigatePage from './pages/Navigate';
import FullCampusMap from './pages/student/FullCampusMap';
import StudentEventMap from './pages/student/StudentEventMap';
import ClubDirectory from './pages/ClubDirectory';
import ClubProfile from './pages/ClubProfile';
import StudentProfile from './pages/StudentProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminVenueUpload from './pages/admin/AdminVenueUpload';
import AdminClubList from './pages/admin/AdminClubList';
import AdminClubUpload from './pages/admin/AdminClubUpload';
import AdminRoster from './pages/admin/AdminRoster';
import AdminVenueList from './pages/admin/AdminVenueList';

function App() {
  return (
    <RoleProvider>
      <RsvpProvider>
        <NavModeProvider>
          <NotificationProvider>
            <Router>
              <MockToast />
              <Routes>

                {/* ─── PUBLIC ZONE (no NavBar/Footer) ─── */}
                <Route element={<LandingLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                </Route>

                {/* ─── STUDENT ZONE ─── */}
                <Route path="/student" element={<StudentLayout />}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="events" element={<EventDiscovery />} />
                  <Route path="events/:id" element={<EventDetail />} />
                  <Route path="rsvp-confirmation/:id" element={<RsvpConfirmation />} />
                  <Route path="navigate" element={<NavigatePage />} />
                  <Route path="campus-map" element={<FullCampusMap />} />
                  <Route path="clubs" element={<ClubDirectory />} />
                  <Route path="clubs/:id" element={<ClubProfile />} />
                  <Route path="profile" element={<StudentProfile />} />
                </Route>

                {/* ─── ADMIN ZONE ─── */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="event-form" element={<AdminEventForm />} />
                  <Route path="event-form/:id" element={<AdminEventForm />} />
                  <Route path="event/:id/roster" element={<AdminRoster />} />
                  <Route path="venues" element={<AdminVenueList />} />
                  <Route path="venue-upload" element={<AdminVenueUpload />} />
                  <Route path="clubs" element={<AdminClubList />} />
                  <Route path="clubs/new" element={<AdminClubUpload />} />
                </Route>

                {/* ─── LEGACY REDIRECTS ─── */}
                <Route path="/discover" element={<Navigate to="/student/events" replace />} />
                <Route path="/clubs" element={<Navigate to="/student/clubs" replace />} />
                <Route path="/club/:id" element={<Navigate to="/student/clubs" replace />} />
                <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
                <Route path="/navigate" element={<Navigate to="/student/navigate" replace />} />
                <Route path="/campus-map" element={<Navigate to="/student/campus-map" replace />} />
                <Route path="/event/:id" element={<Navigate to="/student/events" replace />} />

              </Routes>
            </Router>
          </NotificationProvider>
        </NavModeProvider>
      </RsvpProvider>
    </RoleProvider>
  );
}

export default App;
