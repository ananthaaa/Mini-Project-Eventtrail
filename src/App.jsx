import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Providers
import { RsvpProvider } from './context/RsvpContext';
import { NavModeProvider } from './context/NavModeContext';
import { RoleProvider } from './context/RoleContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout Shells
import LandingLayout from './components/layout/LandingLayout';
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';
import OrganizerLayout from './components/layout/OrganizerLayout';

// UI utilities
import MockToast from './components/ui/MockToast';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import EventDiscovery from './pages/EventDiscovery';
import EventDetail from './pages/EventDetail';
import RsvpConfirmation from './pages/RsvpConfirmation';
import MyTickets from './pages/student/MyTickets';
import NavigatePage from './pages/Navigate';
import FullCampusMap from './pages/student/FullCampusMap';
import StudentEventMap from './pages/student/StudentEventMap';
import ClubDirectory from './pages/ClubDirectory';
import ClubProfile from './pages/ClubProfile';
import StudentProfile from './pages/StudentProfile';

// Club Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import OrganizerEventForm from './pages/organizer/OrganizerEventForm';
import OrganizerRoster from './pages/organizer/OrganizerRoster';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminVenueUpload from './pages/admin/AdminVenueUpload';
import AdminClubList from './pages/admin/AdminClubList';
import AdminClubUpload from './pages/admin/AdminClubUpload';
import AdminRoster from './pages/admin/AdminRoster';
import AdminVenueList from './pages/admin/AdminVenueList';
import AdminReviewQueue from './pages/admin/AdminReviewQueue';
import ErrorBoundary from './components/layout/ErrorBoundary';

function LegacyEventRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/student/events/${id}` : '/student/events'} replace />;
}

function LegacyClubRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/student/clubs/${id}` : '/student/clubs'} replace />;
}

function App() {
  return (
    <RoleProvider>
      <RsvpProvider>
        <NavModeProvider>
          <NotificationProvider>
            <ErrorBoundary>
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
                    <Route path="tickets" element={<MyTickets />} />
                    <Route path="rsvp-confirmation/:id" element={<RsvpConfirmation />} />
                    <Route path="navigate" element={<NavigatePage />} />
                    <Route path="campus-map" element={<FullCampusMap />} />
                    <Route path="clubs" element={<ClubDirectory />} />
                    <Route path="clubs/:id" element={<ClubProfile />} />
                    <Route path="profile" element={<StudentProfile />} />
                  </Route>

                  {/* ─── CLUB ORGANIZER ZONE (Protected: club_admin or admin) ─── */}
                  <Route
                    path="/organizer"
                    element={
                      <ProtectedRoute requiredRole={['club_admin', 'admin']}>
                        <OrganizerLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<OrganizerDashboard />} />
                    <Route path="events/new" element={<OrganizerEventForm />} />
                    <Route path="events/:id/edit" element={<OrganizerEventForm />} />
                    <Route path="events/:id/roster" element={<OrganizerRoster />} />
                    <Route path="rosters" element={<OrganizerRoster />} />
                    <Route path="venues" element={<AdminVenueList />} />
                  </Route>

                  {/* ─── ADMIN ZONE (Protected: admin) ─── */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="review-queue" element={<AdminReviewQueue />} />
                    <Route path="event-form" element={<AdminEventForm />} />
                    <Route path="event-form/:id" element={<AdminEventForm />} />
                    <Route path="event/:id/roster" element={<AdminRoster />} />
                    <Route path="venues" element={<AdminVenueList />} />
                    <Route path="venue-upload" element={<AdminVenueUpload />} />
                    <Route path="clubs" element={<AdminClubList />} />
                    <Route path="clubs/new" element={<AdminClubUpload />} />
                  </Route>

                  {/* ─── LEGACY REDIRECTS (Preserving IDs) ─── */}
                  <Route path="/discover" element={<Navigate to="/student/events" replace />} />
                  <Route path="/clubs" element={<Navigate to="/student/clubs" replace />} />
                  <Route path="/clubs/:id" element={<LegacyClubRedirect />} />
                  <Route path="/club/:id" element={<LegacyClubRedirect />} />
                  <Route path="/events" element={<Navigate to="/student/events" replace />} />
                  <Route path="/events/:id" element={<LegacyEventRedirect />} />
                  <Route path="/event/:id" element={<LegacyEventRedirect />} />
                  <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
                  <Route path="/navigate" element={<Navigate to="/student/navigate" replace />} />
                  <Route path="/campus-map" element={<Navigate to="/student/campus-map" replace />} />

                  {/* ─── CATCH-ALL 404 ROUTE ─── */}
                  <Route path="*" element={<NotFoundPage />} />

                </Routes>
              </Router>
            </ErrorBoundary>
          </NotificationProvider>
        </NavModeProvider>
      </RsvpProvider>
    </RoleProvider>
  );
}

export default App;
