# Global Guidance — Operations Command Portal

## Project Overview
- **Name**: webapp (Global Guidance Operations Portal)
- **Goal**: AI-powered enterprise operational command center for a modern global education consultancy. Every user sees a personalized workspace tuned to their role.
- **Stack**: Hono on Cloudflare Pages · Vanilla JS SPA · Cloudflare KV (binding `COMMS`)

## URLs
- **Production**: https://26262f30.webapp-2il.pages.dev (v16v/v16w, deployed 2026-07-01)
- **Previous**: https://aad9c459.webapp-2il.pages.dev (v16u)
- **Alias**: https://webapp-2il.pages.dev (always points to latest)
- **Local dev**: http://localhost:3000 (PM2)

## v16v / v16w — Daily Activity Recording · Real IP Tracking · 6-Month History · JSON/CSV/PDF Exports (latest, shipped 2026-07-01)

**User request**: Record every activity every day with real IP addresses, keep 6 months of history, let CEO review yesterday / day-before-yesterday activity, and download daily backups as JSON + CSV + PDF.

### Backend (v16v) — day-partitioned KV, 190-day TTL
- **Every activity written to `v16v:log:YYYY-MM-DD`** (one KV key per day, ring buffer cap 10,000 events/day, 190-day TTL for auto-expiry)
- **Real IP captured** via `CF-Connecting-IP` header on every request
- **Geo enrichment** from Cloudflare edge: `city`, `region`, `country`, `timezone`, `isp`
- **Per-user last-known IP** cached at `v16v:ip:<user>` (30-day TTL) for fast lookups
- **Date index** at `v16v:log:index` (cap 200 dates ≈ 6.6 months)
- Instrumented endpoints auto-log: v16u heartbeat (status changes, idle 15/30), v16u capture request/respond, v16s user create/update/delete/password_reset/status
- **v16v endpoints (11 total)**:
  | Endpoint | Purpose |
  |---|---|
  | `POST /api/v16v/log` | Log a single event (called by frontend + other endpoints) |
  | `GET /api/v16v/dates` | List all dates with data + recent-30 summary |
  | `GET /api/v16v/activity/:date` | Fetch one day's events (up to 10,000) |
  | `GET /api/v16v/search?user=&action=&ip=&q=&from=&to=&limit=` | Filter events |
  | `GET /api/v16v/ip/:user` | Last-known IP + geo for one user |
  | `GET /api/v16v/ips` | All users' last-known IPs |
  | `GET /api/v16v/stats?from=&to=` | Top users, top actions, byDate, unique IPs |
  | `GET /api/v16v/export/:date.json` | Download JSON for one day |
  | `GET /api/v16v/export/:date.csv` | Download CSV for one day |
  | `GET /api/v16v/export/:date.pdf` | Download PDF for one day |
  | `GET /api/v16v/export-all/all.{json\|csv\|pdf}?from=&to=` | Bulk export |

### Frontend (v16w) — CEO Activity History panel
- **Launcher button** at bottom-right of portal (CEO / management only, purple gradient)
- **Full-screen modal panel** with 4 tabs:
  1. **Daily View** — date picker + prev/next-day nav + "Today" shortcut, JSON/CSV/PDF export buttons
  2. **Search & Range** — filter by user, action, IP, free-text query, date range; bulk JSON/CSV/PDF export
  3. **IP Addresses** — table of last-known IP per user + location + ISP + last-seen time
  4. **Stats** — top users, top actions, daily event volume for selected range
- **Auto-logs `session.start`** once per fresh page load (throttled to 5 min)
- **Mobile responsive** (≤640px breakpoint)

### Data captured per event
```
id, ts, date, user, role, action, target, meta,
ip (CF-Connecting-IP), city, region, country, timezone, isp, ua
```

### Retention math
- ~200 users × ~50 events/day × ~300 bytes = ~3 MB/day
- 180 days × 3 MB = ~540 MB total (KV free tier is 25 GB — well within budget)
- Old day-keys auto-expire via KV TTL — no cleanup cron needed

### PDF generation
Pure-text PDF built byte-by-byte in Cloudflare Workers (Helvetica 10pt, Letter, ~42 lines/page). No dependencies — works on the edge with no `fs` or Node.js APIs.

### Test results (18/18 Playwright)
```
✅ [1] Event logged
✅ [2] Additional events logged
✅ [3] 1 date(s), latest: 2026-07-01
✅ [4] 7 events for 2026-07-01
✅ [5] 7 events have IP; sample: 127.0.0.1 @ Santa Clara / US
✅ [6] search by user returned 2
✅ [7] q=capture returned 2
✅ [8] 4 unique users with IPs
✅ [9] stats: 7 events, 2 IPs, top user=test.ceo
✅ [10] JSON export 7 events, 3390 bytes
✅ [11] CSV export 8 lines (header + 7 rows)
✅ [12] PDF valid: 1525 bytes, magic="%PDF-1.4", ends with %%EOF
✅ [13] bulk JSON: 1 days, 7 events
✅ [14] bulk CSV: 8 lines
✅ [15] bulk PDF valid: 1540 bytes
✅ [16] v16w launcher button present in DOM
✅ [17] v16w panel opens for CEO
✅ [18] zero page errors
```

### Build
`dist/_worker.js 4,298.43 kB` (+38 kB from v16u)

## v16u — Idle Detection · Status Notifications · Remote Capture · Salary Shake (shipped 2026-06-27)

Round-9 four-feature pack per CEO request: *"sometimes salary day shake also not showing"*, *"someone away from system for 15 min → notify me; 30 min → alert them"*, *"any staff status change → notify management; management change → notify CEO"*, *"CEO clicks camera icon → get their screen + webcam, also live screen share. Works on Mac/Windows/iOS/Android."*

### 1. Salary-Day Shake Banner (fixed)
Rebuilt as a reliable per-day animated banner with three composed keyframes (`v16uShake` jitter, `v16uCoinPulse` rotating coin emoji, `v16uShineSweep` light sweep). Renders on payday (default 25th, configurable via `GG_SETTINGS.finance.payrollDay`) plus day-before/day-after. Click → opens Finance → Payroll. Dismiss × hides for the rest of the day via `sessionStorage`. Asia/Colombo timezone. Mobile-responsive padding/font.

### 2. Idle Detection
- **Staff side**: portal sends `POST /api/v16u/heartbeat` every 30 s with `isActive` flag (true if any mousedown / keydown / touch / scroll / visible-tab activity in the last 60 s).
- **15-min idle** → CEO gets a one-shot `idle_15` notification ("Shiran is idle (15+ min)").
- **30-min idle** → staff gets an in-portal toast: *"You appear to be idle"* with **I'm here** button (marks active and clears flag). CEO also gets an `idle_30` escalation notification.
- Flags auto-reset the moment the user interacts again.

### 3. Status-Change Notifications
- Wraps the existing `tbSetPresence()` so any change from `online → away/busy/dnd/offline` immediately fires a notification.
- **Normal staff changes** → audience: `management` (visible to CEO + COO + Razan + Thasbiha + Super Admin).
- **Management changes** → audience: `ceo` only.
- **Notification tray** (bell icon top-right, CEO/management only): polls `/api/v16u/notifications` every 20 s, shows red badge with count, toast on new arrivals with shake animation, mark-all-read / per-item-read. Mobile-aware (full-width on ≤640 px).

### 4. Remote Capture (one-way CEO → staff)
CEO can request from any staff member:
- **Screenshot** — `getDisplayMedia` (Mac / Windows / Android Chrome)
- **Webcam photo** — `getUserMedia` (all platforms)
- **Both** — single click, two captures
- **Live screen** — streaming JPEG frames every 2 s while staff allows

**Flow:** CEO `POST /api/v16u/capture/request` → staff's next heartbeat (≤ 30 s) returns it as `pendingCaptureRequests` → consent modal pops on staff browser with **Allow & Send** / **Decline** → Allow triggers browser permission prompt → captured frames JPEG-encoded as data URLs → `POST /capture/respond` stores them in KV with TTL 1 h → CEO panel polls `/capture/result/:id` and renders inline. Click image → full-size in new tab. Decline → request marked `denied` with reason (`user_declined`, `user_denied_screen`, etc.).

**Mobile-aware:**
- iOS Safari (iPhone / iPad) → webcam only (Apple does not expose `getDisplayMedia` on iOS). Banner in consent modal warns staff. Screenshot requests gracefully fall back to webcam.
- Android Chrome → full support.
- macOS / Windows → full support.

**CEO does NOT share their screen** — strictly one-directional (CEO → staff capture). All requests logged in v16t activity feed for audit.

### Backend endpoints (11 new, `/api/v16u/*`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/heartbeat` | Staff sends every 30 s; returns `idleMs`, `selfAlert`, `pendingCaptureRequests` |
| GET | `/presence` | List all presence (CEO live board) |
| GET | `/presence/:user` | Single user presence record |
| GET | `/notifications?audience=ceo\|management&unreadOnly=1` | Audience-scoped inbox |
| POST | `/notifications/mark` | Mark `{ids:[]}` or `{all:true}` |
| POST | `/notifications/clear` | Purge all (CEO) |
| POST | `/capture/request` | CEO initiates `{ targetUser, kind, note }` |
| POST | `/capture/respond` | Staff replies with `{status, dataUrls, error}` |
| POST | `/capture/cancel` | Abort pending |
| GET | `/capture/result/:id` | CEO polls captured data (TTL 1 h) |
| GET | `/capture/requests` | List by `targetUser` or `fromUser` |

**Storage:** KV keys `v16u:presence:<user>` (7-day TTL), `v16u:notifications` (ring buffer cap 500), `v16u:capture:requests` (ring buffer cap 200), `v16u:capture:result:<id>` (TTL 1 h).

**Tests:** Playwright suite (10 cases) — all pass. Module load + 6 window-exposed functions; CEO sees bell, staff doesn't; heartbeat persists 2 records; status-change fires notification ("nashif.razzak is now busy"); shake CSS injected; capture request created; staff consent modal renders with Allow/Deny; decline marks `denied` with `user_declined`; idle endpoint computes `idleMs`; **zero JS errors on page load**.

**Build:** `dist/_worker.js` 4,259.96 kB (+52 kB from v16t). Source `public/command-portal.html` 29,764 → 30,718 lines (+954).

## v16t — CEO Activity Monitor (shipped 2026-06-27)

Round-8 add-on per CEO request: *"make an option for CEO to view all the Staffs and every one activitys and logs, like each and every staffs updating in the portal"*.

A real-time portal-wide activity tracker accessible to CEO / COO / Super Admin / Owner via the `Activity Monitor` sidebar link or `nav('activitymonitor')`.

**What it captures (auto-hooks):**
- `login` / `login_failed` / `logout` (wraps `doLogin` / `doLogout`)
- `nav` events with target page (wraps `window.nav`)
- `planner_save` (wraps `window.savePlanner`)
- `attendance_checkin` / `attendance_checkout` / `leave_submit` / `create_task` / `create_note` / `create_file` / `create_expense` / `create_meeting` / `task_complete` (event delegation on buttons)
- `usermgmt_*` (wraps v16s user management actions)
- `heartbeat` every 5 min while session is alive

**UI features (Activity Monitor page):**
- 6 KPI cards: Active Now (5-min window), Events 1h / 24h / 7d, Top User, Stored Events (ring-buffer fill)
- 24-hour hourly activity bar chart
- Top-10 action breakdown with progress bars
- Staff Activity Summary table — per-user 24h / 7d counts + live dot for users seen in last 5 min, "Timeline" button drills into a per-user modal
- Live Activity Feed (most recent 300 events) with icons, timestamps, target, JSON meta
- Filter bar: free-text search, user dropdown, action dropdown, Clear, Apply, manual Refresh, auto-refresh (15s) toggle, CSV export, 30-day+ purge
- Non-authorised users get a clean "Access Restricted" lock screen

**Backend endpoints (`/api/v16t/activity/*`):**
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v16t/activity` | Log one event (fire-and-forget) |
| POST | `/api/v16t/activity/batch` | Log many events at once (frontend batches every 600 ms) |
| GET | `/api/v16t/activity` | List events with filters `?user=&action=&since=&until=&limit=&q=` |
| GET | `/api/v16t/activity/stats` | Aggregated KPIs (1h/24h/7d, byUser, byAction, hourly[24]) |
| GET | `/api/v16t/activity/users` | Distinct users list (for filter dropdown) |
| GET | `/api/v16t/activity/actions` | Distinct actions list |
| DELETE | `/api/v16t/activity` | Purge events older than N days, or all (CEO only) |

**Storage:** KV key `v16t:activity` — JSON array (ring buffer, cap 2000 events). Each event: `{ id, ts, user, role, action, target, meta, ua, ip }`.

**Permission gate:** Page restricted to usernames `razan`, `razan.thawus`, `thasbiha`, `thasbiha.s`, `nashif.razzak`, `nafees.razzak`, `superadmin`, or any user with role containing CEO / COO / Super Admin / Owner, or `level >= 90`.

**Tests:** Playwright suite (9 cases) — all PASS. Module load, Shiran login event capture, nav event capture, CEO renders monitor (24,993 bytes HTML), drill-down modal with 8-row timeline, stats aggregate correctly, non-CEO blocked at lock screen, filter API scopes events per-user.

**Build:** `dist/_worker.js` 4,207.67 kB (+44 kB from v16s). Source `public/command-portal.html` grew 28,982 → 29,764 lines (+782).

## v16s — User Management Portal + Per-User Planner Fix (shipped 2026-06-27)

Round-8 dual fix-pack addressing two CEO requests:

> "in shirans dashboard task list its showing razans tasks, please fix these for all the staffs."
> "make an option for CEO or Super Admin to create more users portal as we are hiring new staffs"

**1. Per-User Planner Fix** — `loadPlanner()` now resolves segments via `ROLE_PLANNER_SEGMENTS[username]` instead of falling back to the BD/counsellor template. Shiran (designer) now sees her own design segments (Design Brief Review, Asset Creation, Brand Guidelines, Social Media Graphics, Print Material, Revisions, File Organization). Binupa, Sukaina, Saleh, Shakya, Jinushiya, etc. all get their role-correct templates. Also fixes `WS_STATE.tasks` / `WS_STATE.docs` / `WS_STATE.meetings` to be per-user scoped (`gg-ws-<suffix>-<username>` localStorage keys) — previously these leaked across users via unscoped keys.

**2. User Management Portal** — CEO / COO / Super Admin can:
- Create new staff portal accounts (for new hires) with username validation (`/^[a-z][a-z0-9._-]{1,29}$/`)
- Edit existing users (name, role, level, department, page access via multi-select)
- Reset passwords
- Disable / re-enable accounts (disabled users blocked at login with: *"This account is currently disabled. Contact the CEO to re-enable it."*)
- Delete v16s-managed users
- View audit log of all management actions

**Storage:** KV keys `v16s:users` (array of user records), `v16s:passwords` (record map), `v16s:audit` (recent action log).

**Backend endpoints:** `GET/POST /api/v16s/users`, `PUT /api/v16s/users/:username`, `POST /api/v16s/users/:username/password`, `POST /api/v16s/users/:username/status`, `DELETE /api/v16s/users/:username`, `GET /api/v16s/password-for/:username`, `GET /api/v16s/audit`.

**Tests:** Playwright suite (5 cases) — all PASS. Shiran planner shows designer segments (no Razan-flavoured fallback), CEO mgmt page renders 13 built-in users with 5 KPIs + table + actions, new user creation via API works and the new user can log in with their assigned password, disabled user is blocked at login with the correct error message.

## v16r — CEO Live Dashboard + GPS Fresh-Fix + Razan Bank Balance + CEO Attendance Optional (shipped 2026-06-27)

Round-7 fix pack addressing 4 distinct CEO/Razan/GPS issues:

1. **CEO attendance now OPTIONAL** — No check-in modal popup at login. No workflow gate. No nag banner. CEO can still file attendance if they want, but it's never blocked or required. `wsAutoPromptCheckin()` patched to no-op for users with `level >= 100` or username `nashif.razzak`.

2. **CEO Live Command Dashboard** — When CEO opens "Dashboard", the page renders a real-time operational overview:
   - **8 attendance tiles**: In Office · Working Remote · In Field · Absent · Sick/Leave · Late Today · Plans Filed · EOD Reports
   - **8 business KPI tiles** (Asia/Colombo today-aware):
     - New Leads (today) · Conversions (all-time + rate) · Registrations (today + MTD) · Offers (today + MTD + open)
     - Visa Payments (today + MTD, Rs.) · Uni Payments (today + MTD, Rs.) · Invoices (today + MTD) · Visa/CAS Active
   - **Staff Status table** (12 staff): mode, location, last event, with geofence indicators
   - **Live Activity Feed**: most recent 15 events (check-ins, plan submissions, EOD reports)
   - **30-second heartbeat** auto-refresh + manual refresh button
   - Data sources: `/api/v16l/ceo-dashboard` + `/api/v16q/workspace/razan` + `LEADS_DATA`

3. **Razan's daily TODO requires today's Amana Bank closing balance** — Every EOD-submit function (`attSubmitEOD`, `submitEODReport`, `v16lSubmitReport`, `v16lSubmitReportAndCheckOut`, `wsSubmitEOD`, `thbSubmitReport*`) wraps with an Amana gate for Razan. If `attendanceState.eod.amanaClosing` is empty, the gate:
   - Alerts: `⚠️ Please enter today's Amana Bank closing balance before filing EOD. Scroll up to "Amana Bank · Daily Balance".`
   - Prompts for the value via `prompt()`
   - Persists to `attendanceState.eod.amanaClosing` + POSTs to `/api/v16q/razan_amana_incomes/row`
   - Only then allows the original submit to proceed

4. **Real fresh GPS — no more stale fixes** — Root cause: existing v16p code used `maximumAge: 30000`, which returned up-to-30-second cached browser fixes (so "Center this location" never updated). v16r installs `v16rCaptureFreshGps()`:
   - `enableHighAccuracy: true` + **`maximumAge: 0`** (force real new reading every call)
   - Multi-sample: takes up to 3 fixes, keeps the one with best accuracy
   - Early exit if any sample lands within 30m
   - Marks `imprecise:true` if final accuracy > 100m
   - Hooks `window.v16lAutoGpsCapture`, `window.v16lCaptureGps`, and the v16p capture function so every legacy code path now gets a fresh reading

**Tests (Playwright, headless, against production):**
- CEO `nashif.razzak / CEO@Global2026` login: no checkin modal, dashboard renders with all 16 live tiles + staff table + activity feed. ✅
- Razan `razan.thawus / Staff@Global2026` EOD submit: every wrapped submit fn fires the Amana alert. ✅
- `v16rCaptureFreshGps()`: returns fresh coords with current timestamp. ✅

**Build**: `dist/_worker.js` 4,115.99 kB (+32 kB vs v16q)  
**Source**: `public/command-portal.html` grew from 27,737 → 28,298 lines (+561 lines IIFE module)  
**Commit**: `0bddd48` on `v16h-latest` → pushed → deployed to Cloudflare Pages `e2a4c92e.webapp-2il.pages.dev`

### v16q — Per-User Workspace Mirror (shipped 2026-06-27)

Each staff member sees a personalized workspace mirror with their own live spreadsheet datasets:

- **Thasbiha**: 65 admissions students with university progress, payment status, document checklists
- **Razan**: 14 datasets covering registrations, invoices, Amana incomes, admissions, visa payments, CAS tracking
- **Shiran**: 318 flyer/marketing entries + budget tracking

**Endpoints** (`/api/v16q/*`):
- `GET /api/v16q/workspace/:user` — bundled workspace for the named user
- `POST /api/v16q/:dataset/row` — append a row to the named dataset
- `GET /api/v16q/seed/status` — meta + row counts

**Data**: `src/v16q-seed.json` (169 KB, 18 datasets)
**Build**: 4,083.79 kB (+31 kB vs v16p)

## v16g-restore — Rolled back from v17 (2026-06-09)

The v17 Daybook redesign (5-item nav / MY WORKDAY / CEO Command Center) was reverted per user request — it conflicted with the existing UI flows. Three commits were cleanly reverted (`3f50f36`, `d6b387b`, `d7d9e42`), removing `public/static/v17-daybook.js` and its script tag. The portal is back on v16g — all 9 v16g fixes (dark-theme PDFs, NaN bug, CEO report feed, download approval, comms CEO-only, calls hidden, Himaaus sync, workspace dedup, submit buttons) remain in place. Earlier v17 production URL `4a5f52f6` / `e967b80f` are now obsolete.

### v16g — 9-Issue Fix Pack (latest, shipped 2026-06-08)

Production fix-pack addressing 9 issues reported after v16f rollout:

1. **Dark-theme EOD report fixed** — All 4 print/PDF popups (EOD, Red Flags, Lead/Staff report, Working Time) now force light theme via `color-scheme:light only` + meta + explicit `td/th{color:#111}` overrides + `@media (prefers-color-scheme:dark)` defenses. Reports are readable on any OS dark mode.
2. **My Workspace / My Attendance dedup** — Workspace hero is now a read-only status display; all check-in/EOD actions redirect to `/attendance` (single source of truth). EOD tab removed from workspace.
3. **`NaNh NaNm` Working Hours bug fixed** — Root cause: check-in submit used `en-US` 12h format (`'1:45 AM'`) that the duration parser couldn't read. Switched to `en-GB` `hour12:false` (`'HH:MM:SS'`) and hardened 3 parsers (`_attCalmWorkingHours`, week-table row, `_wsFmtElapsed`) with a strict `parseHM` that accepts HH:MM, HH:MM:SS, and h:mm AM/PM.
4. **Auto-share reports to CEO/COO** — New KV-backed daily-report feed. Staff EOD submit posts to `/api/v16g/daily-reports/submit`. CEO/COO dashboards get a **Today's staff reports** card with View (light-theme modal) and Download (PDF) buttons.
5. **Staff download approval workflow** — Staff request → CEO approves/denies → one-time 24h token issued. Staff side has a 60s poll and auto-downloads on approval. Auto-popup of EOD PDF disabled.
6. **Submit buttons working** — `submitPlanner`, `attSubmitEOD`, `attSubmitCheckin` rewritten with toast confirmations, dual-endpoint writes (`/api/attendance/sync` + `/api/staff-portal/morning-plan/:empId`), and the 24h format fix that also resolves Issue 3.
7. **Communications Hub locked to CEO** — Screen share, screen record, screenshot, webcam snap, location share all gated to `currentUser.level >= 100`. Non-CEO sees an "Admin tools (CEO only)" lock badge. Helper `_commsRequireCEO` guards function entry points.
8. **Audio/video calls hidden (option a)** — `commsStartCall` returns early with a "Voice/video calls coming soon — use external phone for now" toast. Header call buttons replaced with a disabled "Calls — coming soon" badge. (Real WebRTC requires Durable Objects; deferred.)
9. **Himaaus client-sheet sync** — Thasbiha can now import the Himaaus client list via a 3-tab modal: **Paste CSV** / **Upload file** (.csv or .xlsx via on-demand SheetJS) / **Current list**. RFC4180-ish parser handles quoted fields. Replace or append modes. Backed by KV `v16g:himaaus:clients`.

**New v16g endpoints** (`src/index.tsx`, +228 lines, 8 endpoints under `/api/v16g/*`):
- `GET /api/v16g/daily-reports/today` — Combined KV feed + legacy reports for today
- `GET /api/v16g/daily-reports/range?days=N` — Last N days (max 90)
- `POST /api/v16g/daily-reports/submit` — Idempotent per user+date
- `GET /api/v16g/download-requests?status=pending&requesterId=X` — CEO queue / staff poll
- `POST /api/v16g/download-request` — Staff creates request
- `POST /api/v16g/download-request/decide` — CEO approve/deny + 24h token
- `GET /api/v16g/himaaus/clients?owner=X` — Thasbiha's imported list
- `POST /api/v16g/himaaus/clients/import` — `{owner, rows[], mode:'replace'|'append'}`
- `DELETE /api/v16g/himaaus/clients?owner=X` — Clear all clients for owner

**KV keys added**: `v16g:daily-reports` (cap 2000), `v16g:download-requests` (cap 500), `v16g:himaaus:clients` (cap 5000)

**Build**: 3,538 kB (+49 kB vs v16f)
**Regression**: v16b_roles 30/30, v16c_attendance 31/31, v16f_smoke 30/30. v15_ui_login 14/16 (2 fails are intentional — EOD tab removed per Issue 2).

### v16f — Thasbiha two-workstream redesign (shipped)

Thasbiha now has **two roles under one employee account** with a dedicated dashboard:

- **Role 1 (08:30–15:00)** — Global Guidance HR Manager & Admissions Head (Admissions, Registrations, Lead Conversion, Follow-ups, Onboarding, Counsellor Support, Escalations, Events, HR Coordination)
- **Role 2 (15:00–17:30)** — Himaaus Package Case Operations Coordinator (UK Package Cases, Documentation, Client Coordination, Agreements, Payments, Applications, Escalations, University Coordination, Final Submission)

**New dashboard** (`renderThasbihaOverview` → `_thbDashboardShell`, mounts via "Full report ↗" on calm landing):
- Workstream switcher pills (GG · Himaaus) with manual toggle + 15:00 auto-suggest
- Status row: Attendance · Plan · Report · Workload indicator (🟢/🟡/🔴)
- Today: morning plan summary + evening report summary (per workstream)
- KPI scorecard: GG and Himaaus KPIs side-by-side, auto-computed from the report
- Mid row: calls log (one-tap) + priority students
- Bottom row: daily checklist + team snapshot
- Heartbeat refresh every 60s

**Mandatory daily workflow** (modal forms):
- **Plan form** (`thbOpenPlanForm`) — two-part (GG fields: registrations target, applications to submit, follow-ups, meetings, escalations, pending approvals … / Himaaus fields: cases to work, doc reviews, agreements, pending uni decisions, CEO approval needed …)
- **Report form** (`thbOpenReportForm`) — Part A (GG: leads contacted, registrations completed, conversions, offers received, follow-ups, issues resolved, red flags …) and Part B (Himaaus: cases worked, applications submitted, files completed, students contacted, tomorrow's priorities …)
- **Call logger** (`thbOpenCallLogger`) — one-tap manual entry (contact / purpose / outcome / duration / notes, ws-tagged)

**Backend API** (`src/index.tsx`, ~155 lines added):
- `GET /api/thasbiha/daily?day=YYYY-MM-DD` — today's record (lazy-created, has `plan{gg,him}`, `report{gg,him}`, `kpis{gg,him}`)
- `GET /api/thasbiha/daily/range?days=7` — range query (supports `days`, `start`, `end`) → returns `daily` and `records` arrays
- `POST /api/thasbiha/plan` body `{ws, plan{...}}` — submit one workstream's plan
- `POST /api/thasbiha/report` body `{ws, report{...}}` — submit report and auto-compute KPIs
- `POST /api/thasbiha/call` body `{contact, purpose, outcome, durationMin, notes, ws}` — log call
- `GET /api/thasbiha/calls?day=&ws=` — list calls
- `POST /api/thasbiha/call/delete` body `{id}` — remove call
- KV keys: `thasbiha:daily` (cap 365) · `thasbiha:calls` (cap 2000)

**KPI auto-calc (server-side on report submit)**:
- GG: `leadsContacted`, `registrations`, `applicationsSubmitted`, `offersReceived`, `followupCompletionPct`, `escalationsClosed`, `conversions`
- Himaaus: `casesProcessed`, `applicationsSubmitted`, `documentationCompleted`, `followupsCompleted`, `pendingCasesReduced`, `escalationsClosed`

**CEO + COO visibility** (`renderThbReportCardShell` mounted in `renderCEOTeamOverview` and `renderCOOOverview`):
- Auto-generated read-only "Thasbiha — Daily Workstream Report" card
- Today's plan + accomplishments + KPI scorecard for both workstreams side-by-side
- 7-day weekly roll-up with plan/report compliance % and aggregated KPIs

**Hidden from Thasbiha** (`pages[]` trim on USERS entry):
- Removed: `commissions`, `petty`, `payroll`, `students`, `workspace`, `performance`, `legacy`
- Role title updated: "Head of Admissions/HR · Himaaus Coordinator"
- Kept: `dashboard`, `myworkspace`, `teamattendance`, `attendance`, `leads`, `pipeline`, `followups`, `applications`, `universities`, `redflags`, `visa`, `mock`, `language`, `coursefinder`, `employees`, `leave`, `communications`, `emailhub`, `whatsappweb`, `settings`

### v16e — Post-Wave-D fix pack (shipped)
Targeted fixes from production review of Wave D:
- **Charts** — `_calmRenderBarChart` rewritten with pixel-based 600×200 viewBox + `xMidYMid meet`. No more stretched/overlapping day labels or value labels on dashboard charts.
- **CEO / COO dashboards** — `renderThasbihaOpsCommandCenter()` calls removed from `renderCEOTeamOverview()` and `renderCOOOverview()`. The command center now appears only on Thasbiha's own dashboard.
- **Topbar simplification** — Hidden by CSS: branch chip, live-alerts strip, quick-action FAB, internal-messages icon, theme toggle, date badge, online dot. Kept: sidebar toggle · title · search · attendance pill · notifications · AI (Eddie) · profile. Messages, Theme, Branch are now accessible from the Profile dropdown so no functionality is lost.
- **Notification accuracy** — `_tbRebuildNotifs` now preserves the original timestamp and unread state across rebuilds (no more "everything is new"), gates "live ops" notifications to L≥80 managers only, and drops items older than 7 days. Bell badge starts with `.hide` class so it doesn't show "0" on a fresh page.
- **Attendance / Tasks consolidation** —
  - Sidebar: `Attendance` renamed to `My Attendance` and made visible to all (was mgmt-only). `Team Attendance` moved to mgmt-only (with HR-Executive exception so Saleh still sees it).
  - `Legacy Tasks` nav item suppressed via new `hidden:true` flag (still reachable via Legacy Tools section for execs).
  - Page title for `attendance` updated to `My Attendance`.

### Wave D — Calm Design (shipped)

**Goal**: Make the portal feel like Notion / Linear / Stripe / HubSpot — clean, calm, executive-level — while keeping the existing vanilla JS stack and all Wave B/C functionality intact.

**Block 1 — Calm Design System v2.** A new CSS layer keyed on `body.calm-active` / `body.ws-calm` / `body.att-calm` adds ~290 lines of design tokens:
- Spacing scale `--sp-1`…`--sp-10` (4 → 64 px), type scale `--t-micro`…`--t-display`, radii, shadows, easing
- Palette: `--calm-bg`, `--calm-surface`, `--calm-hairline`, `--calm-accent`, status colors
- Component classes: `.calm-card`, `.calm-kpi`, `.calm-hero`, `.calm-list-item`, `.calm-table`, `.calm-pill`, `.calm-btn`, `.calm-checkin-btn`, `.calm-week-bar`, `.calm-bottom-nav`
- Light/dark theme support via `[data-theme]`

**Block 2 — Dashboard Reset (`renderCalmDashboard`).** A new 4-zone executive dashboard:
- **Zone 1**: Greeting hero ("Good morning, Nashif"), Cmd-K search, "Full report ↗" CTA (opens legacy dashboard in modal)
- **Zone 2**: 4 KPI tiles (Active students · Pending apps · Staff attendance · Revenue MTD) with live data
- **Zone 3**: Productivity grid 2-1: left column (Today's tasks · Follow-ups · Meetings) · right column (Notifications · Team activity · Upcoming deadlines)
- **Zone 4**: Two charts (Attendance trend · Applications by stage) — pure SVG bar charts, no library
- Fan-out fetches are **deferred + staggered** so the page paints first
- `_calmTeam` only fires for L≥80 managers (avoids KV thrash for staff)

**Block 3 — My Workspace Calm Pass.** `body.ws-calm` overrides:
- Wider container (1200px), bigger padding (`--sp-7`), softer hero
- Role widget tiles: bigger (96px min-height), `--r-md` radius, subtle hover lift
- **Density control**: max 4 visible tiles; "Show N more" expander when role has more
- Tabs flattened (transparent + accent underline, no chrome)
- Cleaner empty state component `.ws-calm-empty`
- All Wave B IDs (`#wsRoot`, `#wsHero`, `#wsRoleWidgets`, `#wsTabs`, `#wsBody`) preserved — zero breakage

**Block 4 — Attendance Redesign.** New 3-section layout via `body.att-calm`:
- **Top**: Status pill · big 64px Check-in / Check-out buttons (`.calm-checkin-btn`) · mode chips (Office/Remote/Field/Sick) · working-hours timer · live date
- **Middle**: 7-day weekly bar (`.calm-week-bar` with ✓/⚠/×/− markers) · Late marks (30d) · Leave balance · Avg working hours
- **Bottom**: Recent history table — last 14 days · Mode · Check-in · Check-out · Working hours · Status pill
- Legacy quick-action card preserved inside collapsed `<details>` (handlers like `quickCheckIn`/`quickCheckOut`/`attendanceState.tasks[i].done` still work)
- Best-effort fan-out to `/api/workspace?user=X&day=YYYY-MM-DD` for week + history data

**Block 5 — Mobile Polish.**
- **Bottom nav** (`#calmBottomNav`) visible <768px with 5 items: Home · Workspace · Attend · Alerts · Settings — auto-syncs active state via `cbSyncActive`
- **Drawer sidebar** at ≤900px: sidebar slides off-screen by default; hamburger opens it; backdrop `.sidebar-backdrop` closes it on tap
- **44 px tap targets** enforced on `.nav-item`, `.btn`, `.tb-icon-btn`, `.calm-btn`, `.calm-pill` at narrow widths
- Topbar collapses non-essentials (search, branch, alert) on mobile
- Sticky check-in/out row at ≤640px on attendance page

**Block 6 — Tests + Deploy.** New suite `test_v16d_calm.mjs` — **44 tests, all pass** — covers all 5 blocks across desktop + mobile viewports with zero JS errors. Full regression: see "Test Suite Status" below.

### Wave C — Attendance & Automation (shipped)

**Universal Attendance v2.** The attendance state engine no longer hard-codes Razan; every user gets their own KV-backed daily state with **role-aware default tasks**:
- Counsellor → "Call 5 leads · Follow up 3 hot leads · Update student notes…"
- HR Exec → "Review attendance log · Process leave queue · Payroll prep check…"
- Designer → "Publish 1 IG post · 2 carousel drafts · Update brand library…"
- 10 role templates in total (`ATT_ROLE_TEMPLATES`)

**Team Attendance Board** (`nav('teamattendance')`) — visible to HR/Mgmt:
- Live grid of all 12 staff: name · role · Status (In/Out) · Check-in time · Check-out · Mode (🏢🏠🚗🤒) · Focus · Tasks done/total · EOD
- 4 KPI cards: Present · Missing · Late (after 9:15 AM) · EOD done
- Per-row "Nudge" button + "Nudge missing" bulk action (fires workflow)
- Backed by existing `/api/workspace/team` (KV-persisted, cross-device)

**Workflow Engine v2** (`window.WorkflowEngine`):
- Real trigger/action registry — `WORKFLOW_TRIGGERS` (17 events), `WORKFLOW_ACTIONS` (5 actions)
- `WorkflowEngine.fire(event, payload)` executes all matching enabled workflows
- Execution log (ring buffer, last 50) persisted in localStorage
- Test-fire from UI (▶ button on each workflow)

**Workflow Library — 12 pre-built automations:**
| Trigger | Action |
|---|---|
| Lead — no contact 24h | Toast warning |
| Lead — no contact 72h | Raise red flag |
| High-value lead (£15k+) | Notify CEO |
| Visa deadline 7d | Notify Razan |
| Visa deadline 24h | CRITICAL toast |
| CAS issued | Success toast |
| Offer received | Auto-create task |
| Commission approved | Notify Razan |
| Attendance missing 9 AM | Notify Saleh |
| EOD missed by 6 PM | Notify HR role |
| Red flag raised | Mgmt toast |
| Counsellor SLA breach | Notify admissions head (disabled) |

**Workflow Builder UI** (Settings → Automation):
- Visual trigger/action picker with cascading parameter fields
- Inline edit · Toggle on/off · Test-fire · Delete
- Execution log viewer with timestamps + success/failure icons
- "Reset to defaults" restores the 12 built-ins

### Wave A — Visual Foundation (shipped)
- New design-token layer: navy/white/soft-gray, radius/shadow/ease scales
- Linear/Stripe-inspired sidebar: hairline dividers, quieter labels, pill nav-items
- 7-category navigation: Workspace · CRM · Operations · Communication · AI · Reports · Settings (+ Legacy)
- Topbar: 56px height, calmer icon buttons, muted alert pill, Linear-style search
- Badge clutter removed (LIVE/NEW/!/counts → subtle pill style)
- Utilities: `.skeleton` shimmer loader, `.fade-in`, `.focus-ring`

### Wave B — Personalization + Intelligence (shipped)

**Role engine.** Every user has ONE primary functional role that drives their personalized workspace:

| User | Username | Role | Workspace Variant |
|---|---|---|---|
| Nashif | `nashif.razzak` | CEO | CEO Command Center (revenue · funnel · leaderboard · risk) |
| Nafees | `nafees.razzak` | COO | COO Ops (productivity · SLA · attendance · staff) |
| Thasbiha | `thasbiha.s` | GLSA / HRM / Admissions Head | Admissions Lead (pipeline · HR · leave) |
| Razan | `razan.thawus` | BD / Visa / Finance Head | Finance + Visa (commissions · visa · enrolled) |
| Umair | `umair` | Admissions Executive | Admissions Exec (offers · CAS · visa · my apps) |
| Sukaina | `sukaina` | Counsellor | Counsellor (my students · calls · follow-ups) |
| Shakya | `shakya` | Jr. Counsellor | Counsellor Jr (with mentor tile) |
| Jinushiya | `jinushiya` | Intern Counsellor | Intern (supervisor · training · learning goal banner) |
| Shiran | `shiran` | Graphic Designer | Designer (design queue · brand assets · social) |
| Saleh | `saleh` | HR Executive | HR (attendance alerts · leave queue · payroll prep) |

**Module disable/enable system.** No module is ever deleted. CEO/Super Admin can toggle any module on/off via **Settings → Modules**. Disabled modules are hidden from sidebar but remain in the codebase.

**Notification engine v2.**
- 4 macro-buckets when viewing all: Critical · Operational · Communication · Finance
- Per-notification CTA buttons ([Open Lead], [Open Visa], etc.)
- Toast system (`notifToast(text, type)`) for high-priority items
- Polling every 30s — fires toasts for new high-priority notifs
- Mark read/unread, clear all, history

**CEO Command Center** (`nav('ceocommand')`) — CEO/COO/Super Admin only:
- Revenue MTD · Cash Flow · Conversion · Pipeline · Branches
- Conversion Funnel (live from LEADS_DATA)
- Counsellor Leaderboard (medals)
- Application Aging heatmap
- Critical Alerts with CTAs

## v15.0 — "My Workspace" Simplified UX

### Big idea
The portal stopped feeling like an admin control panel and became a **daily work assistant**. Staff sign in → simplified workspace → check in → tasks → end-of-day report. Management keeps the full dashboards.

### Role mapping
| Group | Users | Lands on | Sees |
|---|---|---|---|
| Management | Nafees, Razan, Thasbiha, Nashif | Dashboard | Everything (Master Sheets, Compliance, Analytics, Petty Cash, Reports, etc.) |
| Staff | Umair, Shiran, Sukaina, Jinushiya, Shakya, Saleh | My Workspace | Workspace + Communications + their assigned modules only |

### What "My Workspace" gives you
- **Hero card** with greeting, working hours timer, check-in/check-out buttons
- **AI Suggestions row** — 1–3 contextual tips (high-priority pending, EOD reminder, etc.)
- **5 simple tabs**: Today's Tasks · Follow-Ups · Schedule · Team Alerts · End of Day
- **Today's Tasks** with a "Priority Tasks" 🔴 strip and a tickbox "All Tasks" list. Status simplified to **Pending / In Progress / Completed** (advanced statuses kept under the hood for management analytics)
- **Quick Add Task** modal — exactly **4 fields**: Name, Priority, Due Time, Assign To
- **Pick from Master Sheets** button (Thasbiha only) — bulk-create tasks from real Excel data
- **Compact follow-up cards** with [Call] [WhatsApp] [Done] CTAs
- **Morning check-in popup** that auto-appears for staff before 11 AM with "Today's Focus" hints
- **End-of-Day report** — 2 numbers (completed/pending) + 2 text fields (achievement, issues) → auto-checks-you-out

### Nav re-org
- Added **🎯 My Workspace** at the top (between Dashboard and Attendance)
- Marked these as `mgmtOnly` — hidden from staff sidebar:
  Employees · Performance · Daily Tasks (Legacy) · Commissions · Petty Cash · Payroll · Reports
- Attendance & Daily Plan is now `mgmtOnly` (replaced by My Workspace for staff)
- Master Sheets tab (v14.9) stays accessible to Thasbiha via her Ops Center

## Functional Entry URIs

### v15.0 — My Workspace
| Method | Path | Body | Purpose |
|---|---|---|---|
| GET  | `/api/workspace?user=&day=` | — | Load today's workspace |
| POST | `/api/workspace/checkin`   | `{ user, day?, mode, focus, location? }` | Check in |
| POST | `/api/workspace/checkout`  | `{ user, day? }` | Manual checkout |
| POST | `/api/workspace/task`      | `{ user, day?, title, priority?, due?, assignTo? }` | Quick-add task |
| POST | `/api/workspace/task/update` | `{ user, day?, id, status?, title?, priority?, due?, assignTo? }` | Update task |
| POST | `/api/workspace/task/delete` | `{ user, day?, id }` | Delete task |
| POST | `/api/workspace/eod`       | `{ user, day?, achievement, issues }` | Submit end-of-day report |
| GET  | `/api/workspace/team?day=&users=csv` | — | Management team view |

### v14.9 — Master Sheets
| Method | Path |
|---|---|
| GET/POST | `/api/thasbiha/master(/patch)` |
| GET/POST | `/api/glsa/master(/patch)` |
| GET/POST | `/api/admissions/master(/patch)` |
| POST | `/api/thasbiha/seed-tasks` |

### Pre-v15 endpoints
- THB Ops: `/api/thasbiha/{tasks,applications,followups,reports,compliance,analytics,alerts}`
- Comms: `/api/comms/{send,inbox,call/start,snap}`

## Data Architecture
- **Storage**: Cloudflare KV (binding `COMMS`)
- **Workspace** (v15.0): one KV record per `(user, day)` → `ws:<user>:<day>` → `{ checkIn, tasks, eod }`
- **Master Sheets** (v14.9): immutable JSON seed at `/static/seeds/*.json` + per-row KV patch overlay
- **Status simplification**: workspace tasks only have 3 statuses (pending/in_progress/completed). The legacy THB module still tracks 7 statuses internally for management Ops reports.

## User Guide
### Staff (e.g. Umair, Sukaina)
1. Sign in → land on **My Workspace** → check-in popup → tap *Check In*
2. **Today's Tasks** → tap **+ Add Quick Task** (4 fields) → save
3. Tick checkboxes as you complete tasks (or select In Progress)
4. **Follow-Ups** tab → tap **Call** / **WhatsApp** / **Done** on cards
5. At 4 PM tap **End of Day** → 2 numbers + 2 text fields → **Submit Report** → auto-checked-out

### Thasbiha (management)
- Lands on Dashboard
- Still has full Ops Command Center + Master Sheets tabs
- Can navigate to **My Workspace** to use the simplified flow if desired
- The v14.9 "Pick from Master Sheets" picker still works from her Daily Tasks

## Features Not Yet Implemented (v15.1 targets)
- Scheduled 5:30 PM EOD popup (currently surface-only when user navigates to EOD tab)
- Real AI suggestions (currently rule-based)
- Mobile bottom-nav redesign
- Color system pass (navy/white/gray instead of mixed accents)
- Top-level menu rename (Students CRM / Communications etc.)
- Schedule items as first-class entities (currently derived from tasks + default blocks)

## Deployment
- **Platform**: Cloudflare Pages (project `webapp`)
- **Status**: ✅ Active — v16.0 Wave D in production
- **Build**: `npm run build` → `dist/_worker.js` ~3.43 MB
- **Last Updated**: 2026-06-07 (v16 Wave D)

## Test Suite Status
| Suite | Tests | Result |
|---|---|---|
| `test_v16d_calm.mjs` (NEW) | 44 | ✅ 44/44 |
| `test_v16c_attendance_workflows.mjs` | 31 | ✅ 31/31 |
| `test_v16b_roles.mjs` | 30 | ✅ 30/30 |
| `test_v15_workspace.mjs` | 14 | ✅ 14/14 |
| `test_v15_ui_login.mjs` | 16 | ✅ 16/16 |
| `test_v14_9_master_sheets.mjs` | 10 | ✅ 10/10 |
| `test_v14_team_comms.mjs` | 8 | ✅ 8/8 |
| `test_v14_2_messages.mjs` | 5 | ⚠ flakey under sandbox load (passes on cold start) |

Total: **153/158** (5 flake on multi-tab sandbox test — confirmed not a Wave D regression: same test passes on Wave C baseline ✓).

## Test commands
```bash
node test_v16d_calm.mjs            # 44 tests — Wave D calm design (Blocks 1-5)
node test_v16c_attendance_workflows.mjs # 31 tests — Wave C attendance + workflows
node test_v16b_roles.mjs           # 30 tests — Wave B role-aware UX
node test_v15_workspace.mjs        # 14 tests — workspace API
node test_v15_ui_login.mjs         # 16 tests — UI / role-based nav
node test_v14_9_master_sheets.mjs  # 10 tests — master sheets
node test_v14_team_comms.mjs       #  8 tests — team comms regression
node test_v14_2_messages.mjs       #  5 tests — comms (use cold-start)
```
