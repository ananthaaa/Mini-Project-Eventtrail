## Why

The CampusPulse app is a UI reference build using mock JSON data. However, the current UI flow is simplified and misses several critical user journeys outlined in the system diagrams (such as explicit login flows, admin venue/RSVP management, and notifications). We need to expand the mock UI to cover these missing flows so the application accurately reflects the intended user experience before a real backend is attached.

## What Changes

- **Mock Authentication Flow**: Build a mock Register/Login screen replacing the simple "Toggle Role" nav button.
- **Admin Management Flows**:
  - Add a view for Admins to manage RSVPs and Waitlists for specific events.
  - Add a feature to delete mock events from the Admin Dashboard.
  - Add a Venue Management view for Admins to list, edit, or delete mock venues.
- **Simulated Notifications**: Add a mock "Push Notification" toast system to simulate AWS SNS alerts (e.g., when a user RSVPs or crosses a geofence).

## Capabilities

### New Capabilities
- `mock-auth-flow`: A simulated registration and login screen journey for Students and Admins.
- `mock-admin-management`: Admin dashboard expansions for managing (deleting) events, managing venues, and viewing RSVP/Waitlist rosters.
- `mock-notifications`: A simulated in-app toast notification system to represent external SNS alerts.

### Modified Capabilities
- (None)

## Impact

- **UI Components**: We will need to build new pages/views (`Login.jsx`, `AdminRoster.jsx`, `AdminVenueList.jsx`) and new components (`MockToast.jsx`).
- **Mock State**: `RoleContext` and `RsvpContext` will need to be expanded slightly to track these new simulated states.
- **No Backend**: This explicitly avoids changing the backend or integrating AWS. Everything remains purely front-end and mock-driven.
