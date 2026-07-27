## 1. Core State Expansion

- [x] 1.1 Refactor `RoleContext.jsx` to track `isLoggedIn` and `currentUser` instead of just a role toggle
- [x] 1.2 Expand `RsvpContext.jsx` to expose mock reducers for deleting events and modifying venue lists
- [x] 1.3 Create `NotificationContext.jsx` to manage a global queue of simulated toast notifications

## 2. Mock Authentication UI

- [x] 2.1 Create `Login.jsx` to present mock login forms for both Students and Admins
- [x] 2.2 Update `NavBar.jsx` to redirect to `/login` instead of instantly toggling roles
- [x] 2.3 Update `App.jsx` to register the new login route and protect admin routes

## 3. Mock Admin Management UI

- [x] 3.1 Update `AdminDashboard.jsx` to include a "Delete" button on each event card
- [x] 3.2 Create `AdminRoster.jsx` to allow admins to view the simulated list of RSVP'd and waitlisted students for an event
- [x] 3.3 Create `AdminVenueList.jsx` as a dashboard to list, edit, or delete existing mock venues

## 4. Mock Notification UI

- [x] 4.1 Build `MockToast.jsx` using Framer Motion to slide in simulated SMS/Email notifications
- [x] 4.2 Wire `MockToast` into `EventDetail.jsx` (for RSVP success/waitlist) and `Navigate.jsx` (for Geofence Arrival)
