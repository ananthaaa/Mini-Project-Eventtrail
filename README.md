# EventTrail / CampusPulse — Campus Event & Navigation Platform

**EventTrail** (also referred to as **CampusPulse** in architectural specifications) is a comprehensive campus event discovery, club management, RSVP/waitlist ticketing, and progressive outdoor/indoor navigation platform.

---

## 🚀 Current Project State

### ✅ What is Built (Frontend — Complete)
A modern React + Vite + Vanilla CSS frontend is fully built and functional, featuring:
- **Event Discovery**: Browsing upcoming events, category filtering, and search.
- **RSVP & Waitlist UI**: Interactive ticketing, seat meters, and cancellation workflows.
- **Progressive Campus Navigation**: Dual-phase outdoor + indoor navigation supporting 4 progressive view modes (2D Map, Route Overview, Turn-by-Turn with 3D buildings, and eye-level AR Simulation) using MapLibre GL JS and client-side A* walkway graph routing.
- **Club Directory & Profiles**: Browsing campus organizations and their hosted events.
- **Admin Management Screens**: Event creation, venue mapping/uploading, and attendee roster management.

> ⚠️ **Note**: Currently, the frontend runs entirely on local mock JSON files (`src/data/*.json`) and local React Context state. There is no live server backend or persistent database attached yet.

### ⏳ What is NOT Built (Backend — In Progress)
An approved AWS Serverless backend architecture is currently being integrated across an 8-module build plan. The target stack includes:
- **Infrastructure as Code**: AWS CDK (TypeScript/JavaScript) in `/infra`.
- **Database**: 7 DynamoDB tables with Global Secondary Indexes.
- **Authentication**: Amazon Cognito User Pools (`student` and `admin` groups) with JWT authorization.
- **API Layer**: API Gateway REST APIs backed by Lambda function handlers replacing mock resolvers.
- **Media Storage**: Amazon S3 + CloudFront with presigned upload workflows.
- **Notifications**: Amazon SNS/SES transactional emails and EventBridge scheduled reminders.

---

## 📂 Repository Structure

```
EventTrail-main/
├── src/                  # React + Vite application source code (components, pages, hooks, mock data)
├── docs/                 # Canonical documentation, architecture specs, build plans, and progress trackers
│   ├── modules/          # Completed backend module verification reports (Phase 1–8)
│   ├── 00-cleanup-summary.md
│   ├── 00-progress-overview.md
│   ├── CampusPulse-AWS-Architecture.md
│   ├── CampusPulse-Module-Plan.md
│   ├── campus-navigation.md
│   ├── cleanup-notes.md
│   └── project-ui-reference.md
├── infra/                # AWS CDK backend infrastructure definitions and seeding scripts (Modules 1–8)
├── public/               # Static assets and icons
├── package.json          # Project dependencies and npm scripts
└── vite.config.js        # Vite bundling configuration
```

---

## 📖 Key Documentation Links
- [**Backend Build Progress Tracker**](file:///c:/Users/caana/OneDrive/Desktop/mini-project/EventTrail-main/docs/00-progress-overview.md): Monitor the live status of the 8-module AWS integration.
- [**AWS Architecture Specification**](file:///c:/Users/caana/OneDrive/Desktop/mini-project/EventTrail-main/docs/CampusPulse-AWS-Architecture.md): Detailed AWS serverless architecture design.
- [**8-Module Build Plan**](file:///c:/Users/caana/OneDrive/Desktop/mini-project/EventTrail-main/docs/CampusPulse-Module-Plan.md): The step-by-step implementation roadmap and verification checklists.
- [**Campus Navigation Architecture**](file:///c:/Users/caana/OneDrive/Desktop/mini-project/EventTrail-main/docs/campus-navigation.md): Walkway graph network, A* pathfinding, and 4-mode MapLibre guide.
- [**Phase 0 Cleanup Summary**](file:///c:/Users/caana/OneDrive/Desktop/mini-project/EventTrail-main/docs/00-cleanup-summary.md): Summary of repository reorganization and structure pass.

---

## 🛠️ Running Locally (Frontend)

To run the standalone frontend reference app locally:

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:5173` in your browser to explore the UI.
