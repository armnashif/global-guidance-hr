# GG OS Full System Audit

Audit date: 2026-07-05  
Audit gate: Complete  
Product-code changes during this audit: None

## 1. Executive verdict

GG OS contains substantial education-consultancy domain logic and historical operational datasets worth preserving. It should not be rebuilt. It should be incrementally consolidated around one application shell, one Today workflow, one task model, one attendance model, one plan/report model and one server-enforced role system.

The current product is not yet a conventional SaaS application. It is a layered browser application with several generations of functionality applied through late JavaScript overrides.

Key measurements:

- 102 tracked files
- 26 standalone HTML applications in `public`
- 20 static JavaScript files
- 14 legacy React-style component files
- 24 legacy test scripts
- 32,722 lines in the active command portal
- 9,552 lines in the Hono API
- 14,315 lines in the legacy React/Babel template
- More than 200 API routes
- One Cloudflare KV namespace, no relational database and no migration framework

## 2. Runtime architecture

### Active browser application

`public/command-portal.html` is the effective product. It owns authentication UI, navigation, permissions, rendering, local state, attendance, tasks, communication, CRM, role dashboards and many versioned compatibility patches.

### Intended API

`src/app.tsx` is a Hono application designed for Cloudflare Pages. It exposes the broad API surface and uses a Cloudflare KV binding named `COMMS`.

### Production deployment

Vercel currently publishes the Vite `dist` output as a static deployment. Cloudflare bindings are not available in that runtime. Browser API requests can therefore fail or fall back to device-local state. This is the primary cause of inconsistent attendance, reports and cross-device data.

### Legacy runtimes

- `server.js`: separate Node HTTP server with incomplete in-memory APIs and different behavior.
- `src/template.html`: legacy React/Babel HR portal with its own accounts, pages and mock Supabase configuration.
- `public/static/app-main.jsx`, `public/static/app.js` and `public/static/components/*`: alternate HR portal implementations, not the active command portal.

## 3. Authentication and authorization

### Current authentication

- Static staff accounts are embedded in browser JavaScript.
- Password comparison occurs in the browser.
- Staff default passwords and browser-local password overrides exist.
- A KV-backed custom-user/password store exists, but passwords are stored as plain values.
- There are no signed server sessions.
- API endpoints do not consistently authenticate the caller.

### Current authorization

Four overlapping mechanisms exist:

1. Static `pages[]` arrays on each user.
2. Numeric access levels.
3. Primary-role mappings.
4. RBAC APIs plus browser-cached per-user permission overlays.

Most protection is UI visibility, not server-side record authorization.

### Required disposition

KEEP existing usernames, employee IDs, role names and login experience.  
REFACTOR password handling and sessions behind the existing login contract.  
MERGE the four permission mechanisms into one role/permission resolver.  
DO NOT remove or rename accounts during migration.

## 4. Persistence and database audit

### Database finding

There is no database, table schema, foreign-key model or migration history. “Tables” are JavaScript arrays, JSON seed files, KV arrays/objects and browser storage records.

### Server-side stores to preserve

- Employee/user stores: `v16s:users`, `v16s:passwords`, `v16s:audit`
- Attendance/day stores: `v16l:attendance`, `v16l:daily-plan`, `v16l:daily-report`, `v16l:team-activity`, `v16l:offices`
- Legacy report stores: `v16g:daily-reports`, EOD locks and staff controls
- Leave: `v16g:leave-requests`
- Operations: `v16q:*`, admissions/GLSA/Thasbiha patch sets and role-specific stores
- Communication: messages, signals, notifications, attachments, calls and channels
- Work evidence: `v16t:activity`, `v16v:log:*`, IP records and presence
- Finance: daily finance, invoice/commission/petty-cash datasets

### Browser-side stores to preserve during migration

- Attendance/session state
- `ggos:day:v1:*`
- Workspace tasks/docs/meetings
- Settings, theme and sidebar state
- User permission cache
- Role/module overrides
- Schedule and follow-up state

### Normalization target

The first relational schema should contain:

- employees, departments, roles, permissions, role_permissions, employee_roles
- sessions and credential_migrations
- workdays and attendance_events
- daily_plans, daily_plan_priorities and daily_reports
- tasks, task_events, personal_todos and todo_visibility
- meetings, calls, followups and calendar_events
- kpi_definitions, kpi_targets, kpi_results and reviews
- leave_types, leave_balances, leave_requests and leave_approvals
- documents, acknowledgements, learning_items and learning_assignments
- assets and asset_assignments
- vacancies, applicants, interview_stages and offers
- audit_events and legacy_source_mappings

No legacy key should be deleted before export, checksum, import, reconciliation and rollback approval.

## 5. Route and page audit

### Primary routes to KEEP

- `/dashboard` as the stable application entrypoint
- `/api/health`
- Current student and agent portal entrypoints while separately secured
- Operational data routes that contain real admissions, visa, finance and student records
- File, attachment, communication and calendar contracts that are actively consumed

### Routes to MERGE

#### Daily work

Merge these families behind one `/api/workdays` domain service:

- `/api/attendance/sync*`
- `/api/workspace*`
- `/api/daily-reports*`
- `/api/tasks*`
- `/api/v16g/daily-reports*`
- `/api/v16l/attendance*`
- `/api/v16l/daily-plan*`
- `/api/v16l/daily-report*`
- `/api/thasbiha/daily*`, `/plan`, `/report`, `/tasks`
- staff-portal attendance/task/report buckets

#### Notifications and activity

Merge:

- generic notifications
- `v16g` notifications
- `v16u` notifications
- activity feed, worktracker, `v16t` and `v16v` audit logs

Keep audit events immutable and separate from user-facing notifications.

#### Operations

Merge lead-management variants, applications pages, student/follow-up views and user-specific portals into shared operations routes with role-filtered views.

### Routes/pages to REMOVE after migration

- `fast-login.html`
- `test-google-sheets.html`
- duplicated setup/code-generator pages exposed as user modules
- old `lead-management.html` after unified lead migration
- old `daily-operations.html` after enhanced/current workflow migration
- duplicate `/legacy` dashboard exposure for ordinary users
- direct user-specific portals once their unique records are represented in Operations

Removal means archive after data and route telemetry verification, not immediate deletion.

## 6. Duplicate inventory

### Duplicate pages

- Lead management: `lead-management.html`, `lead-management-unified.html`, command-portal leads
- Daily operations: `daily-operations.html`, `daily-operations-enhanced.html`, workspace, My Workspace, Today
- Applications: `applications.html`, `applications-visa.html`, command-portal applications and visa modules
- Staff portals: Thasbiha, Razan, Umair and generic workspace views
- Reports: command-portal reports, staff reports, analytics page, daily report and CEO reports
- Settings: command-portal settings and `system-settings.html`
- Login/auth: command portal, legacy template, static app, fast login and student/agent variants

### Duplicate forms

- Check-in forms and work-mode selectors
- Morning planner/task-entry forms
- Evening/EOD report forms
- Task add/edit/complete forms
- Leave request forms
- Lead/student/application edit forms
- Settings/profile/password forms
- Search inputs across global, settings, communication, AI workspace and tables

### Duplicate APIs

There are no exact duplicate method/path declarations in Hono, but there are extensive semantic duplicates:

- attendance: sync, workspace, v16l and browser-local implementations
- tasks: generic, workspace, Thasbiha, AI workspace and Today tasks
- reports: generic, workspace EOD, v16g, v16l and role-specific reports
- messages/emails/calls: generic, auto and specialized families
- users/permissions: static users, v16s users, RBAC roles/users and local permission overlays
- files: files, attachments, category uploads and Google Drive link records

### Duplicate database tables

No database tables exist. Equivalent duplicate record stores exist in KV/browser state for attendance, tasks, plans, reports, notifications, users and activity. These should be mapped into canonical relational tables, with source identifiers retained.

### Duplicate widgets

- Multiple attendance cards/status pills
- Multiple task totals and task boards
- Dashboard, Calm Dashboard and role-dashboard cards
- Multiple report-submission summaries
- Multiple meeting widgets, including superseded mock meeting content
- Multiple notifications surfaces
- Global, communication and AI search surfaces without one shared search contract

### Duplicate navigation

- Legacy seven-section sidebar
- New reduced sidebar override
- Mobile bottom navigation
- Settings sub-navigation
- AI workspace navigation
- User-specific portal navigation
- Legacy tools navigation

## 7. Dead and unused code

### High-confidence dead/legacy candidates

- `public/static/components/*`: not loaded by the active command portal
- `public/static/app-main.jsx`: alternate browser-auth HR portal with mock Supabase credentials
- `public/static/app.js`: another alternate UI implementation
- Most of `src/template.html`: only legacy routes use it
- `server.js`: incompatible with the active Hono/Cloudflare API and not used by Vercel production
- Backups such as `system-settings.html.backup` and `index.html.bak`
- Setup/test HTML pages intended for development

### Conditional legacy candidates

- User-specific portals and seed adapters
- Old version patches v16i through v16z
- Legacy React dashboard

These cannot be deleted until route usage, data ownership and fallback dependencies are measured.

## 8. Broken components and workflows

### Critical

1. Production API/runtime mismatch: static Vercel cannot provide Cloudflare KV APIs.
2. Authentication is client-side and API authorization is incomplete.
3. Attendance/report success may mean browser-local success, not durable company data.
4. Different devices can show different employee state.
5. Plain password values exist in source/browser/KV models.

### High

1. Several attendance/planner/report implementations can override one another.
2. Assigned tasks and personal todos are not modeled separately.
3. Role/task inference relies on hard-coded usernames and role strings.
4. API errors are frequently swallowed with empty catch blocks.
5. In-memory server arrays reset on runtime restart or deployment.
6. GPS behavior differs between legacy and newer flows.
7. Leave, reports and permissions have both standalone-page and portal implementations.

### Medium

1. Duplicate HTML IDs: seven `page-dashboard` IDs, three `mainContent` IDs and repeated EOD/sync/location IDs.
2. Multiple CDN-delivered frameworks increase load and availability risk.
3. Search, modal and navigation behavior is implemented repeatedly.
4. Many screens contain mock/demo or placeholder integrations.
5. Several test scripts require Playwright but the package is not installed.

## 9. KEEP

- Existing staff usernames, employee IDs and credential entry flow
- Current operational datasets and all historical KV/browser records
- Admissions, visa, student, university, partner and finance domain knowledge
- Current `/dashboard` URL
- Role-specific concepts and staff ownership mappings
- GPS/office configuration, audit metadata and activity history
- Communication, attachment and document concepts
- Dark theme tokens and responsive intent
- Existing tests as regression specifications, after repairing their runtime
- The Phase 1 Today state machine as the consolidation destination, not as a new parallel module

## 10. MERGE

- Dashboard + My Workspace + Attendance planner + Tasks + EOD into Today
- Legacy tasks + workspace tasks + role tasks into Assigned Tasks
- Employee-created reminders into a separate Personal Todo model
- Attendance variants into Attendance Events + Workday
- Planner variants into one Daily Plan
- Report variants into one Daily Report
- Reports and analytics into role-filtered Reports/Performance
- Leads, pipeline, follow-ups, applications, visa and student portals into Operations
- Hub, messaging and announcements into one communication service
- Settings and system-settings into one role-aware Settings area
- Employee, role and permission definitions into one server-enforced identity model
- File/attachment/upload mechanisms into one document service

## 11. REMOVE

Remove from employee navigation immediately after replacement validation:

- generic Dashboard as a separate destination
- Planner
- Workspace/My Workspace duplicates
- Legacy Tasks
- Activities as a standalone employee destination
- duplicate Reports links
- legacy notification surfaces
- setup/test/admin implementation pages

Archive from the codebase only after migration telemetry:

- duplicate standalone pages
- unused component system
- legacy template and server
- superseded version patches
- backup files

## 12. REFACTOR

- Split the command portal into a shell, route registry, UI components and domain modules
- Split Hono routes by domain
- Add a repository/service layer between APIs and persistence
- Introduce schema migrations and immutable legacy imports
- Add server sessions and hashed passwords behind current login
- Enforce authorization on every API query and mutation
- Replace swallowed errors with structured error handling and request IDs
- Centralize Colombo business-date/time handling
- Centralize design tokens, forms, buttons, cards, empty states and responsive behavior
- Create one role resolver and one navigation resolver
- Separate assigned tasks from private personal todos
- Add idempotency to check-in, plan, report and checkout writes
- Add timeline events from every workday transition

## 13. FUTURE

- Payroll-ready salary grades, allowances, deductions, EPF/ETF/APIT and bank details
- Recruitment pipeline after employee/role foundation
- AI task recommendations and CEO daily brief after reliable structured data exists
- University and visa knowledge assistant with governed sources
- Meeting transcription and minutes
- Document acknowledgement automation
- Advanced KPI forecasting and conversion analytics
- SSO after server authentication is stable
- Native mobile/PWA packaging after responsive workflows are complete

## 14. Approved target information architecture

Primary modules only:

1. Today
2. My Work
3. Attendance
4. Leave
5. Operations
6. Performance
7. Learning
8. Documents
9. Organization
10. Assets
11. AI Assistant
12. Settings

Recruitment belongs under Organization for normal navigation. CEO/COO dashboards are role-specific Today views, not additional top-level modules.

## 15. Canonical workflow

`SIGNED_OUT -> READY_TO_CHECK_IN -> MORNING_PLAN_REQUIRED -> WORKDAY_ACTIVE -> DAILY_REPORT_REQUIRED -> CHECKED_OUT`

Rules:

- One employee, one workday record per Colombo business date
- Check-in requires work mode and GPS policy result
- Morning Plan is mandatory
- Assigned Tasks and Personal Todo are separate
- Today aggregates tasks, calendar, calls, follow-ups, approvals, escalations and KPI progress
- Daily Report is mandatory before checkout
- Every transition produces an immutable timeline/audit event

## 16. Migration sequence

### Stage A — Safety foundation

1. Export and checksum every KV key and browser-importable record.
2. Establish the production API runtime and relational database.
3. Add migration tooling and legacy-source mapping.
4. Add server sessions/password hashing behind existing login.

### Stage B — Daily operating core

1. Create canonical workday, attendance, plan, task, todo, report and timeline services.
2. Read legacy stores through adapters.
3. Dual-write with reconciliation during a controlled transition.
4. Make Today the role-aware landing screen.

### Stage C — HR and Operations consolidation

1. Employee/organization/leave/documents/learning/assets/performance.
2. Admissions/visa/follow-up/partner/marketing/finance Operations views.
3. CEO and COO aggregate dashboards.

### Stage D — Legacy retirement

1. Compare record counts and checksums.
2. Freeze legacy writes.
3. Monitor route usage.
4. Archive and then remove confirmed dead code.

## 17. Audit gate result

The audit is complete. Incremental refactoring may now resume, beginning with the production API/database foundation and canonical workday service. No destructive cleanup is authorized until data export and reconciliation are implemented.
