## ADDED Requirements

### Requirement: StudentLayout wraps all student-zone routes
The system SHALL use a `StudentLayout` component as the layout shell for all routes under `/student/*`. This layout SHALL include its own navigation bar tailored for student users (links to Events, Clubs, Navigate, Profile) and SHALL NOT share the global `NavBar` component used in prior app versions.

#### Scenario: Student navigates to any student route
- **WHEN** a logged-in student navigates to any `/student/*` route
- **THEN** the StudentLayout shell (with its student-specific nav) is rendered as the page wrapper

### Requirement: Student navigation provides links to all student sections
The StudentLayout navigation SHALL include links to: Dashboard (`/student`), Events (`/student/events`), Clubs (`/student/clubs`), Navigate (`/student/navigate`), and Profile (`/student/profile`).

#### Scenario: Nav links are visible
- **WHEN** a student is on any student page
- **THEN** all five navigation links are visible and functional

### Requirement: Student routes are migrated to /student/* namespace
All existing student-facing routes SHALL be accessible under the `/student/*` namespace. The old root-level routes (`/discover`, `/clubs`, `/profile`, `/navigate`) SHALL redirect to their new `/student/*` equivalents.

#### Scenario: Old route redirected
- **WHEN** a user navigates to `/discover`
- **THEN** they are redirected to `/student/events`
