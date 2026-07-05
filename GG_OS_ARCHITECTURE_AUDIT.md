# GG OS Architecture Audit

Date: 2026-07-05

## Executive conclusion

GG OS must be upgraded in place, not rebuilt. The existing portal contains valuable staff, admissions, visa, finance, workspace and operational seed data, but the current production architecture is split between a static Vercel deployment and a Cloudflare-oriented Hono API. This makes browser-local fallbacks appear to work while server-backed attendance, reports and shared data can fail or become device-specific.

The safe strategy is a strangler migration: preserve existing routes and data keys, introduce one canonical application shell and one canonical daily-workflow service, migrate modules behind stable adapters, and only retire duplicate legacy paths after regression and data verification.

## Current architecture

- UI: `public/command-portal.html`, a 32,586-line single-file application with inline CSS, HTML, state, routing and feature logic.
- API: `src/app.tsx`, a 9,552-line Hono application targeting Cloudflare Pages.
- Legacy server: `server.js`, a separate zero-build Node server with a smaller, incompatible in-memory API implementation.
- Legacy UI: `src/template.html` plus standalone pages and older React-style static components.
- Build: Vite with the Hono Cloudflare Pages adapter.
- Production hosting: Vercel currently publishes `dist` as static output.
- Intended server persistence: one Cloudflare KV namespace named `COMMS`.
- Browser persistence: extensive `localStorage`, `sessionStorage`, IndexedDB and in-memory fallbacks.
- Database: no relational database, schema or migration system exists.

## Critical findings

### 1. Production runtime mismatch

The live Vercel deployment is static. The Hono API and Cloudflare KV binding are not running there. Calls to attendance, reports, RBAC, notifications and shared operations APIs therefore cannot be treated as durable production writes.

### 2. Authentication is client-side

Staff accounts, passwords and role/page access are resolved in browser JavaScript. Default passwords and local overrides are accepted. There are no signed server sessions, secure password hashes or server-enforced authorization guards.

### 3. Persistence is fragmented

The same business concepts are stored across browser storage, in-memory arrays and many KV keys. A successful UI action can therefore be local-only, and different browsers can show different attendance or task state.

### 4. Multiple competing workflows exist

Attendance, workspace, planner and daily report logic exists in several generations: legacy attendance state, workspace APIs, v16g, v16l and later portal overrides. Their field shapes and gating rules are not identical.

### 5. UI routing and roles are hard-coded

Navigation is rendered from large JavaScript objects and page identifiers. RBAC also has an API layer, a browser cache and per-user overlays. Access is primarily hidden in the UI rather than enforced at the data boundary.

### 6. Data safety risk

Operational data is stored as large JSON arrays in one KV namespace. This has no relational constraints, transactions, foreign keys or durable migration history. Existing KV keys and seed datasets must be exported and mapped before any storage replacement.

### 7. Maintainability and performance

The portal and API monoliths contain legacy screens, duplicate feature generations, inline rendering and large seed payloads. This increases load time, regression risk and the chance that a late script silently overrides an earlier implementation.

## Canonical target information architecture

The employee sidebar will contain only:

1. Today
2. Attendance
3. Leave
4. Operations
5. Reports
6. Learning
7. Documents
8. Organization
9. Assets
10. Performance
11. AI Assistant
12. Settings

Operations will expose only the role-relevant education consultancy workspaces: Admissions, Visa, Student Follow-ups, University Follow-ups, Partners, Marketing and Finance. CEO Dashboard is a role-specific landing experience, not another employee widget page.

## Canonical employee state machine

`SIGNED_OUT -> READY_TO_CHECK_IN -> MORNING_PLAN_REQUIRED -> WORKDAY_ACTIVE -> DAILY_REPORT_REQUIRED -> CHECKED_OUT`

Only the API may advance this state. The UI may not infer completion solely from browser storage.

## Canonical core records

- employees
- roles
- permissions
- departments
- reporting_lines
- workdays
- attendance_events
- daily_plans
- daily_plan_priorities
- daily_reports
- tasks
- activity_targets
- leave_requests
- leave_approvals
- employee_documents
- document_acknowledgements
- learning_items
- learning_assignments
- assets
- asset_assignments
- kpi_definitions
- kpi_results
- performance_reviews
- vacancies
- applicants
- interview_stages
- operational_entities and operational_events
- audit_events

Future payroll tables will be introduced without payroll calculations: salary_grades, employee_compensation_profiles, allowances, deductions, statutory_profiles and bank_accounts.

## Compatibility rules

- Keep existing usernames, employee IDs and operational dataset identifiers.
- Preserve all existing KV keys until verified migration and rollback windows expire.
- Add adapters for legacy attendance, workspace, report and v16q datasets.
- Never overwrite an existing record during import without an immutable backup and source identifier.
- Keep `/dashboard` and current login credentials operational during staged rollout.
- Enforce new permissions server-side before removing legacy UI checks.

## Delivery phases

### Phase 1 — Foundation and daily workflow

- Establish a production API and durable database.
- Add secure sessions and password hashing while preserving usernames.
- Add schema migrations and KV export/import tooling.
- Introduce the new app shell, sidebar and role navigation.
- Implement the canonical check-in, mandatory morning plan, Today view, mandatory evening report and check-out flow.
- Repair GPS, work mode, device and IP logging.

### Phase 2 — HR core

- Employee profile, leave, organization chart, documents, learning, assets and KPI-based performance.

### Phase 3 — Operations and CEO

- Consolidated Admissions, Visa, follow-up, partner, marketing and finance workspaces.
- One-screen CEO dashboard with people, compliance, operations, business and performance signals.

### Phase 4 — Talent, AI and payroll readiness

- Recruitment pipeline, AI assistant capabilities and future-payroll data architecture.

### Phase 5 — Legacy retirement

- Compare old/new records, close migration gaps, freeze legacy writes, archive obsolete routes and remove duplicate code only after acceptance.

## Acceptance gates for Phase 1

- One staff member has one authoritative workday record per Colombo business date.
- Check-in cannot complete without GPS result, work mode, device and network metadata policy outcomes.
- Morning plan submission is idempotent and required before Today work.
- Check-out is impossible without a submitted daily report.
- CEO/COO/HR can see current status without browser-local assumptions.
- Refreshing, changing browser or changing device does not lose shared state.
- Role access is enforced by the API, not only by hidden navigation.
- Existing staff credentials continue through a controlled password migration.
- Existing admissions, visa and finance datasets remain unchanged and exportable.

## External reference gap

The Better HR Proposal PDF itself was not included in the workspace or supplied by URL. Its listed concepts are incorporated above, but a page-by-page comparison requires the PDF.
