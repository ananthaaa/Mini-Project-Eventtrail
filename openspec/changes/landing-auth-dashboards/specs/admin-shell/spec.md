## ADDED Requirements

### Requirement: AdminLayout wraps all admin-zone routes
The system SHALL use an `AdminLayout` component as the layout shell for all routes under `/admin/*`. This layout SHALL include its own sidebar navigation tailored for admin users and SHALL NOT share the global `NavBar` or `StudentLayout` components.

#### Scenario: Admin navigates to any admin route
- **WHEN** a logged-in admin navigates to any `/admin/*` route
- **THEN** the AdminLayout shell (with its admin-specific sidebar) is rendered as the page wrapper

### Requirement: Admin navigation provides links to all admin sections
The AdminLayout sidebar SHALL include links to: Dashboard (`/admin`), Events (`/admin/event-form`), Venues (`/admin/venues`), Venue Upload (`/admin/venue-upload`).

#### Scenario: Sidebar nav links are visible
- **WHEN** an admin is on any admin page
- **THEN** all sidebar navigation links are visible and functional

### Requirement: Admin layout is visually distinct from student layout
The AdminLayout SHALL use a visually distinct design (e.g., dark sidebar, professional color scheme) that clearly differentiates it from the student shell.

#### Scenario: Admin and student shells look distinct
- **WHEN** an admin is on an admin page and a student is on a student page
- **THEN** the navigation chrome, colors, and layout are visually distinct between the two zones
