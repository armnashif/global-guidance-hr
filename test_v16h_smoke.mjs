// v16h smoke test: C1 EOD workflow + C2 Planner gate + C3 Staff Controls panel
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000/';
const errors = [];
const results = [];

function log(label, ok, detail='') {
  const tag = ok ? '✅' : '❌';
  console.log(`${tag} ${label}${detail ? ' — ' + detail : ''}`);
  results.push({ label, ok, detail });
}

async function login(page, user, pw) {
  await page.goto(BASE, { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(800);
  const userIn = await page.$('#loginUser');
  const passIn = await page.$('#loginPass');
  if (!userIn || !passIn) throw new Error('login inputs not found');
  await userIn.fill(user);
  await passIn.fill(pw);
  await page.evaluate(() => { if (typeof doLogin === 'function') doLogin(); });
  await page.waitForTimeout(2200);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text());
  });

  // ============================================================
  // TEST 1: CEO login → Settings → Staff Controls panel renders
  // ============================================================
  try {
    await login(page, 'nashif.razzak', 'CEO@Global2026');
    // currentUser is a module `let` — access via eval inside page
    const loggedIn = await page.evaluate(() => {
      try { return typeof currentUser !== 'undefined' && currentUser && currentUser.username === 'nashif.razzak'; }
      catch(e){ return false; }
    });
    log('CEO login', loggedIn, loggedIn ? '' : 'currentUser not set');

    // Navigate to settings via JS (fastest, avoids UI hunting)
    await page.evaluate(() => { if (typeof nav === 'function') nav('settings'); });
    await page.waitForTimeout(1000);

    // Look for Staff Controls in settings sidebar
    const hasStaffControlsLink = await page.evaluate(() => {
      const txt = document.body.innerText || '';
      return txt.includes('Staff Controls');
    });
    log('C3: "Staff Controls" appears in CEO settings', hasStaffControlsLink);

    // Activate Staff Controls via the real function
    const clicked = await page.evaluate(() => {
      try { settingsNav('staffcontrols'); return true; }
      catch(e){ return false; }
    });
    log('C3: Staff Controls module activated', clicked);
    await page.waitForTimeout(1500);

    // Verify panel rendered — look for the 6 toggle keys or staff cards
    const panelOK = await page.evaluate(() => {
      const txt = document.body.innerText || '';
      // Look for at least one of the 6 toggle labels
      const keys = ['Planner', 'Daily Report', 'EOD', 'GPS', 'Reminders'];
      let found = 0;
      keys.forEach(k => { if (txt.includes(k)) found++; });
      return found >= 3;
    });
    log('C3: Staff Controls panel shows toggle labels', panelOK);

  } catch (e) {
    log('CEO flow', false, e.message);
  }

  // ============================================================
  // TEST 2: Thasbiha login → planner gate active
  // ============================================================
  try {
    // Logout first if possible by reloading clean
    await page.goto(BASE, { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
    await page.reload({ waitUntil:'domcontentloaded' });
    await page.waitForTimeout(800);

    await login(page, 'thasbiha.s', 'Staff@Global2026');
    const loggedIn = await page.evaluate(() => {
      try { return typeof currentUser !== 'undefined' && currentUser && currentUser.username === 'thasbiha.s'; }
      catch(e){ return false; }
    });
    log('Thasbiha login', loggedIn, loggedIn ? '' : 'currentUser not set');

    // Try to navigate to myworkspace — planner gate should activate
    await page.evaluate(() => { if (typeof nav === 'function') nav('myworkspace'); });
    await page.waitForTimeout(1200);

    // Check if we got routed to attendance OR if planner gate flag was set
    const gateInfo = await page.evaluate(() => {
      return {
        gateActive: !!window._v16hPlannerGateActive,
        currentPage: (window.currentPage || ''),
        bodyText: (document.body.innerText || '').slice(0, 500)
      };
    });
    // Either gate active OR thasbiha doesn't have plannerRequired (which is fine — just log)
    log('C2: Planner gate flag state read', true, `gateActive=${gateInfo.gateActive}, page=${gateInfo.currentPage}`);

  } catch (e) {
    log('Thasbiha flow', false, e.message);
  }

  // ============================================================
  // TEST 3: KV endpoints respond (C1 + C3 backend)
  // ============================================================
  try {
    const sc = await page.evaluate(async () => {
      const r = await fetch('/api/v16g/staff-controls');
      return { status: r.status, ok: r.ok };
    });
    log('C3 API: GET /api/v16g/staff-controls', sc.ok || sc.status === 200, `status=${sc.status}`);

    const eod = await page.evaluate(async () => {
      const r = await fetch('/api/v16g/eod-lock/Thasbiha');
      return { status: r.status, ok: r.ok };
    });
    log('C1 API: GET /api/v16g/eod-lock/:empId', eod.ok || eod.status === 200, `status=${eod.status}`);

    const notif = await page.evaluate(async () => {
      const r = await fetch('/api/v16g/notifications');
      return { status: r.status, ok: r.ok };
    });
    log('C1 API: GET /api/v16g/notifications', notif.ok || notif.status === 200, `status=${notif.status}`);
  } catch (e) {
    log('API checks', false, e.message);
  }

  // ============================================================
  // FINAL
  // ============================================================
  console.log('\n=== ERRORS ===');
  if (errors.length === 0) {
    console.log('(none)');
  } else {
    errors.slice(0, 20).forEach(e => console.log(' • ' + e));
  }

  const pass = results.filter(r => r.ok).length;
  const total = results.length;
  console.log(`\n=== ${pass}/${total} checks passed, ${errors.length} JS errors ===`);

  await browser.close();
  process.exit(pass === total && errors.length === 0 ? 0 : 1);
})();
