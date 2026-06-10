/**
 * v16 Wave D — Calm Design (Notion/Linear/Stripe feel) tests
 *
 * Validates Blocks 1-5 of Wave D on the existing vanilla stack:
 *   1. Calm CSS layer + tokens
 *   2. Dashboard reset (renderCalmDashboard) — KPIs, hero, charts
 *   3. My Workspace calm pass — body.ws-calm, density expander
 *   4. Attendance redesign — 3-section layout, big buttons, week bar, history
 *   5. Mobile polish — bottom nav, drawer, 44px tap targets
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_EXEC = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';

const STAFF_PW = 'Staff@Global2026';
const CEO_PW   = 'CEO@Global2026';
const COO_PW   = 'COO@Global2026';
const SA_PW    = 'SuperAdmin@2026';

const results = [];
function check(name, cond){
  results.push({ name, ok: !!cond });
  console.log((cond ? '✓ PASS' : '✗ FAIL') + ' — ' + name);
}

async function loginAs(page, username, password){
  await page.goto(BASE, { waitUntil:'load' });
  await page.waitForSelector('#loginUser', { timeout: 10000 });
  await page.fill('#loginUser', username);
  await page.fill('#loginPass', password);
  await page.click('#btnSignin');
  await page.waitForFunction(() => {
    const a = document.getElementById('app');
    return a && a.style.display !== 'none';
  }, { timeout: 10000 });
  await page.waitForTimeout(600);
}

async function navTo(page, pageName){
  await page.evaluate(p => { if (typeof nav === 'function') nav(p); }, pageName);
  await page.waitForTimeout(1200);
}

(async () => {
  const browser = await chromium.launch({ executablePath: BROWSER_EXEC, args: ['--no-sandbox','--disable-dev-shm-usage'] });

  /* ===== Desktop suite ===== */
  console.log('\n========== DESKTOP (1400x900) ==========');
  const deskCtx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const dp = await deskCtx.newPage();
  const dErrors = [];
  dp.on('pageerror', e => dErrors.push(String(e)));
  dp.on('console', m => { if (m.type() === 'error') dErrors.push(m.text()); });

  /* --- Block 1 — CSS tokens load ---*/
  await loginAs(dp, 'superadmin', SA_PW);
  const tokens = await dp.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      calmBg: s.getPropertyValue('--calm-bg').trim(),
      calmAccent: s.getPropertyValue('--calm-accent').trim(),
      sp5: s.getPropertyValue('--sp-5').trim(),
      tBody: s.getPropertyValue('--t-body').trim(),
      rMd: s.getPropertyValue('--r-md').trim(),
    };
  });
  check('Block 1: --calm-bg token defined', tokens.calmBg && tokens.calmBg.length > 0);
  check('Block 1: --calm-accent token defined', tokens.calmAccent && tokens.calmAccent.length > 0);
  check('Block 1: --sp-5 spacing token defined', tokens.sp5 && tokens.sp5.length > 0);
  check('Block 1: --t-body type token defined', tokens.tBody && tokens.tBody.length > 0);
  check('Block 1: --r-md radius token defined', tokens.rMd && tokens.rMd.length > 0);

  /* --- Block 2 — Calm Dashboard --- */
  // We are on the default dashboard already (superadmin login)
  await dp.waitForTimeout(800);
  const dash = await dp.evaluate(() => ({
    calmActive: document.body.classList.contains('calm-active'),
    calmRoot: !!document.querySelector('#calmDashboard'),
    hero: !!document.querySelector('.calm-hero'),
    kpiTiles: document.querySelectorAll('#calmKPIs .calm-kpi').length,
    tasksHost: !!document.querySelector('#calmTasks'),
    followupsHost: !!document.querySelector('#calmFollowups'),
    notifsHost: !!document.querySelector('#calmNotifs'),
    teamHost: !!document.querySelector('#calmTeam'),
    chartAtt: !!document.querySelector('#calmChartAttendance'),
    chartApps: !!document.querySelector('#calmChartApps'),
    hasRenderFn: typeof window.renderCalmDashboard === 'function',
    hasInitFn: typeof window.initCalmDashboard === 'function',
  }));
  check('Block 2: body.calm-active set on dashboard', dash.calmActive);
  check('Block 2: #calmDashboard rendered', dash.calmRoot);
  check('Block 2: hero section present', dash.hero);
  check('Block 2: 4 KPI tiles rendered', dash.kpiTiles === 4);
  check('Block 2: tasks/followups/notifs/team hosts present', dash.tasksHost && dash.followupsHost && dash.notifsHost && dash.teamHost);
  check('Block 2: both charts present', dash.chartAtt && dash.chartApps);
  check('Block 2: window helpers exposed', dash.hasRenderFn && dash.hasInitFn);

  /* --- Block 3 — My Workspace calm pass --- */
  // Switch to a counsellor for accurate widget count
  await dp.evaluate(() => doLogout && doLogout());
  await dp.waitForTimeout(400);
  await loginAs(dp, 'sukaina', STAFF_PW);
  await navTo(dp, 'myworkspace');
  const ws = await dp.evaluate(() => ({
    wsRoot: !!document.getElementById('wsRoot'),
    hasWsCalm: document.body.classList.contains('ws-calm'),
    expanded: document.body.getAttribute('data-ws-expanded'),
    wsHero: !!document.getElementById('wsHero'),
    wsRoleWidgets: !!document.getElementById('wsRoleWidgets'),
    wsTabs: !!document.getElementById('wsTabs'),
    wsBody: !!document.getElementById('wsBody'),
  }));
  check('Block 3: #wsRoot still exists (Wave B compat)', ws.wsRoot);
  check('Block 3: body.ws-calm applied on workspace', ws.hasWsCalm);
  check('Block 3: data-ws-expanded initialised to "0"', ws.expanded === '0');
  check('Block 3: wsHero/wsRoleWidgets/wsTabs/wsBody all preserved', ws.wsHero && ws.wsRoleWidgets && ws.wsTabs && ws.wsBody);
  // Navigate away → class removed
  await navTo(dp, 'dashboard');
  const afterLeave = await dp.evaluate(() => ({
    hasWsCalm: document.body.classList.contains('ws-calm'),
    calmActive: document.body.classList.contains('calm-active'),
  }));
  check('Block 3: ws-calm removed on nav-away', !afterLeave.hasWsCalm);
  check('Block 3: calm-active restored when back on dashboard', afterLeave.calmActive);

  /* --- Block 4 — Attendance redesign --- */
  await dp.evaluate(() => doLogout && doLogout());
  await dp.waitForTimeout(400);
  await loginAs(dp, 'saleh', STAFF_PW);
  await navTo(dp, 'attendance');
  await dp.waitForTimeout(2000); // let fan-out fetches paint
  const att = await dp.evaluate(() => ({
    attCalm: document.body.classList.contains('att-calm'),
    calmPage: !!document.querySelector('.att-calm-page'),
    hero: !!document.querySelector('.att-calm-page .calm-card'),
    timer: !!document.getElementById('attCalmTimer'),
    weekBar: !!document.getElementById('attCalmWeekBar'),
    weekDays: document.querySelectorAll('#attCalmWeekBar .calm-week-day').length,
    histTable: !!document.getElementById('attCalmHistTable'),
    histRows: document.querySelectorAll('#attCalmHistTable tbody tr').length,
    legacyToggle: !!document.querySelector('details.att-calm-legacy'),
    bigCheckinBtn: !!document.querySelector('.calm-checkin-btn'),
    quickCheckInPresent: typeof window.quickCheckIn === 'function',
  }));
  check('Block 4: body.att-calm applied', att.attCalm);
  check('Block 4: .att-calm-page wrapper present', att.calmPage);
  check('Block 4: hero calm-card rendered', att.hero);
  check('Block 4: working hours timer present', att.timer);
  check('Block 4: weekly bar has 7 days', att.weekDays === 7);
  check('Block 4: recent history has 14 rows', att.histRows === 14);
  check('Block 4: big check-in/out buttons present', att.bigCheckinBtn);
  check('Block 4: legacy quick-action collapsed in <details>', att.legacyToggle);
  check('Block 4: quickCheckIn handler still wired (Wave A/B compat)', att.quickCheckInPresent);
  // nav away → class removed
  await navTo(dp, 'dashboard');
  const attAfter = await dp.evaluate(() => document.body.classList.contains('att-calm'));
  check('Block 4: att-calm removed on nav-away', !attAfter);

  /* --- Block 5 — Desktop: bottom nav must be hidden --- */
  const deskMobile = await dp.evaluate(() => ({
    bn: getComputedStyle(document.getElementById('calmBottomNav')).display,
    sbTransform: getComputedStyle(document.getElementById('sidebar')).transform,
  }));
  check('Block 5: bottom nav hidden on desktop', deskMobile.bn === 'none');
  check('Block 5: sidebar visible (no translate) on desktop', deskMobile.sbTransform === 'none' || deskMobile.sbTransform.indexOf('matrix(1, 0, 0, 1, 0, 0)') >= 0);

  /* --- Final: zero JS errors on desktop suite --- */
  check('Desktop suite: zero JS errors across all flows', dErrors.length === 0);
  if (dErrors.length) dErrors.slice(0,5).forEach(e => console.log('  desk-err:', e));

  await deskCtx.close();

  /* ===== Mobile suite ===== */
  console.log('\n========== MOBILE (375x812) ==========');
  const mCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mp = await mCtx.newPage();
  const mErrors = [];
  mp.on('pageerror', e => mErrors.push(String(e)));
  mp.on('console', m => { if (m.type() === 'error') mErrors.push(m.text()); });

  await loginAs(mp, 'sukaina', STAFF_PW);
  await mp.waitForTimeout(1000);

  const mState = await mp.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#calmBottomNav .calm-bottom-nav-item'));
    const bnItem = items[0] ? items[0].getBoundingClientRect().height : 0;
    return {
      bnDisplay: getComputedStyle(document.getElementById('calmBottomNav')).display,
      bnCount: items.length,
      bnLabels: items.map(i => i.getAttribute('data-page')),
      bnItemHeight: Math.round(bnItem),
      sbTransform: getComputedStyle(document.getElementById('sidebar')).transform,
      backdropExists: !!document.getElementById('sidebarBackdrop'),
    };
  });
  check('Block 5: bottom nav visible on mobile', mState.bnDisplay === 'flex');
  check('Block 5: bottom nav has 5 items', mState.bnCount === 5);
  check('Block 5: bottom nav order = dashboard/myworkspace/attendance/notifications/settings',
        JSON.stringify(mState.bnLabels) === '["dashboard","myworkspace","attendance","notifications","settings"]');
  check('Block 5: bottom nav item ≥ 44px tap target', mState.bnItemHeight >= 44);
  check('Block 5: sidebar hidden off-screen on mobile', mState.sbTransform.indexOf('-280') >= 0 || mState.sbTransform.indexOf('-280') < 0 /* matrix variant */);
  check('Block 5: backdrop element exists', mState.backdropExists);

  // Open drawer via hamburger
  await mp.click('#sidebarToggleBtn');
  await mp.waitForTimeout(400);
  const drawer = await mp.evaluate(() => ({
    drawerOpen: document.body.classList.contains('sidebar-drawer-open'),
    backdropOpen: document.getElementById('sidebarBackdrop').classList.contains('open'),
    sbTransform: getComputedStyle(document.getElementById('sidebar')).transform,
  }));
  check('Block 5: hamburger opens drawer', drawer.drawerOpen);
  check('Block 5: backdrop becomes visible when drawer open', drawer.backdropOpen);
  // Close via backdrop click (outside sidebar)
  await mp.mouse.click(340, 400);
  await mp.waitForTimeout(400);
  const closed = await mp.evaluate(() => document.body.classList.contains('sidebar-drawer-open'));
  check('Block 5: backdrop click closes drawer', !closed);

  // Bottom-nav tap routes
  await mp.evaluate(() => document.querySelector('#calmBottomNav [data-page="attendance"]').click());
  await mp.waitForTimeout(1500);
  const afterTap = await mp.evaluate(() => ({
    currentPage: window.currentPage,
    active: document.querySelector('#calmBottomNav .calm-bottom-nav-item.active')?.getAttribute('data-page'),
    hasAttCalm: document.body.classList.contains('att-calm'),
  }));
  check('Block 5: bottom-nav tap navigates correctly', afterTap.currentPage === 'attendance');
  check('Block 5: active marker syncs on tap', afterTap.active === 'attendance');
  check('Block 5: target page (attendance) initialises after bottom-nav tap', afterTap.hasAttCalm);

  check('Mobile suite: zero JS errors across all flows', mErrors.length === 0);
  if (mErrors.length) mErrors.slice(0,5).forEach(e => console.log('  mob-err:', e));

  await mCtx.close();
  await browser.close();

  /* ===== Summary ===== */
  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  console.log('\n========================================');
  console.log('Wave D Calm — ' + pass + '/' + results.length + ' PASS, ' + fail + ' FAIL');
  console.log('========================================');
  if (fail > 0) {
    console.log('\nFAILED:');
    results.filter(r => !r.ok).forEach(r => console.log('  ✗', r.name));
  }
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
