## ADDED Requirements

### Requirement: Login page is full-screen immersive
The system SHALL render the login page at `/login` as a full-screen, full-viewport page with a visually immersive design consistent with the landing page (gradient background, centered card, smooth animations). It SHALL NOT show the app's shared NavBar or Footer.

#### Scenario: Login page renders full-screen
- **WHEN** a user navigates to `/login`
- **THEN** the page fills the full viewport with no app NavBar or Footer visible

### Requirement: Login page supports Student and Admin role toggle
The login form SHALL have a visible toggle/tab to select between "Student" and "Admin" roles before submitting.

#### Scenario: Student role selected
- **WHEN** the user selects the "Student" tab on the login page
- **THEN** the form context switches to student login and a link to the signup page is visible

#### Scenario: Admin role selected
- **WHEN** the user selects the "Admin" tab on the login page
- **THEN** the form context switches to admin login and NO signup link is shown

### Requirement: Successful student login redirects to student dashboard
After a valid student login, the system SHALL redirect to `/student`.

#### Scenario: Student login success
- **WHEN** a student submits valid credentials with the Student role selected
- **THEN** the user is redirected to `/student` (StudentDashboard)

### Requirement: Successful admin login redirects to admin dashboard
After a valid admin login, the system SHALL redirect to `/admin`.

#### Scenario: Admin login success
- **WHEN** an admin submits valid credentials with the Admin role selected
- **THEN** the user is redirected to `/admin` (AdminDashboard)

### Requirement: Signup page is student-only, full-screen immersive
The system SHALL render the signup page at `/signup` as a full-screen, full-viewport page styled consistently with the landing and login pages. The signup form SHALL collect: Name, Email, Password, and Student ID.

#### Scenario: Signup page renders
- **WHEN** a user navigates to `/signup`
- **THEN** a full-screen signup form is shown with fields: Name, Email, Password, Student ID

#### Scenario: All required fields submitted
- **WHEN** the user fills in Name, Email, Password, and Student ID and submits
- **THEN** the account is created (mock) and the user is logged in as a Student and redirected to `/student`

### Requirement: Admin self-registration is not available
The system SHALL NOT provide any UI path for admin account creation via the public auth flow.

#### Scenario: Admin tab on login page has no signup link
- **WHEN** the "Admin" tab is selected on the login page
- **THEN** no "Sign Up" or "Register" link is visible
