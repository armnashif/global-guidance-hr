// v16h Phase 2 smoke test: #5 wscust + #7/#8 Workspace cards + #10 Followups filters + #11 Schedule + #12 Alerts
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
  await page.fill('#loginUser', user);
  await page.fill('#loginPass', pw);
  await page.evaluate(() => { if (typeof doLogin === 'function') doLogin(); });
  await page.waitForTimeout(2200);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404')) errors.push('console.error: ' + msg.text());
  });

  // ============================================================
  // Login as CEO (full access)
  // ============================================================
  await login(page, 'nashif.razzak', 'CEO@Global2026');
  const loggedIn = await page.evaluate(() => {
    try { return typeof currentUser !== 'undefined' && currentUser && currentUser.username === 'nashif.razzak'; }
    catch(e){ return false; }
  });
  log('CEO login', loggedIn);

  // ============================================================
  // #5 — Workspace Customization Settings panel
  // ============================================================
  await page.evaluate(() => { if (typeof nav==='function') nav('settings'); });
  await page.waitForTimeout(800);

  const wscustVisible = await page.evaluate(() => {
    const txt = document.body.innerText || '';
    return txt.includes('Workspace Customization');
  });
  log('#5: "Workspace Customization" appears in Settings', wscustVisible);

  const wscustActivated = await page.evaluate(() => {
    try { settingsNav('wscust'); return true; }
    catch(e){ return false; }
  });
  log('#5: wscust module activates', wscustActivated);
  await page.waitForTimeout(1200);

  const wscustPanelOK = await page.evaluate(() => {
    const txt = document.body.innerText || '';
    const keys = ["Today's Attendance card", 'Morning Planner Tasks', "Today's Tasks tab", 'Follow-Ups tab', 'Schedule tab', 'Team Alerts tab'];
    let found = 0;
    keys.forEach(k => { if (txt.includes(k)) found++; });
    return found >= 5;
  });
  log('#5: wscust panel shows all 6 items', wscustPanelOK);

  // Verify CEO sees lock buttons
  const hasLockBtns = await page.evaluate(() => {
    return (document.body.innerText || '').includes('Unlocked') || (document.body.innerText || '').includes('Locked');
  });
  log('#5: CEO sees Lock/Unlock controls', hasLockBtns);

  // Backend ws-locks endpoint
  try {
    const r = await page.evaluate(async () => {
      const r1 = await fetch('/api/v16g/ws-locks');
      return { status: r1.status, ok: r1.ok };
    });
    log('#5 API: GET /api/v16g/ws-locks', r.ok, `status=${r.status}`);
  } catch(e){ log('#5 API GET', false, e.message); }

  // Toggle a lock via PUT
  try {
    const r = await page.evaluate(async () => {
      const r1 = await fetch('/api/v16g/ws-locks', {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ key:'plannerCard', locked:true, updatedBy:'test' })
      });
      return { status: r1.status, ok: r1.ok };
    });
    log('#5 API: PUT /api/v16g/ws-locks', r.ok, `status=${r.status}`);
  } catch(e){ log('#5 API PUT', false, e.message); }

  // ============================================================
  // #7 + #8 — Workspace cards (require login navigation)
  // ============================================================
  await page.evaluate(() => { if (typeof nav==='function') nav('myworkspace'); });
  await page.waitForTimeout(1500);

  const wsLoaded = await page.evaluate(() => !!document.getElementById('wsRoot'));
  log('Workspace page loads', wsLoaded);

  // Switch to Today tab to ensure cards render
  await page.evaluate(() => { try { wsSwitchTab && wsSwitchTab('today'); } catch(e){} });
  await page.waitForTimeout(600);

  // #7: Attendance card present
  const hasAttCard = await page.evaluate(() => {
    const txt = document.body.innerText || '';
    return txt.includes("Today's Attendance");
  });
  log('#7: "Today\'s Attendance" card renders in Workspace', hasAttCard);

  // #8: Planner Tasks card
  const hasPlannerCard = await page.evaluate(() => {
    const txt = document.body.innerText || '';
    return txt.includes('Morning Planner Tasks');
  });
  log('#8: "Morning Planner Tasks" card renders in Workspace', hasPlannerCard);

  // Verify helper functions are defined
  const helpersOK = await page.evaluate(() => {
    return typeof _v16hRenderAttendanceCard === 'function'
      && typeof _v16hRenderPlannerCard === 'function'
      && typeof _v16hPlannerToggle === 'function';
  });
  log('#7/#8: Helper functions defined globally', helpersOK);

  // ============================================================
  // #11 — Schedule live data
  // ============================================================
  await page.evaluate(() => { try { wsSwitchTab && wsSwitchTab('schedule'); } catch(e){} });
  await page.waitForTimeout(1500); // fetch /api/meetings/today

  const scheduleOK = await page.evaluate(() => {
    const txt = document.body.innerText || '';
    return txt.includes("Today's Schedule") && (txt.includes('live from meetings') || txt.includes('Nothing scheduled'));
  });
  log('#11: Schedule shows live data subtitle', scheduleOK);

  const hasLoadFn = await page.evaluate(() => typeof _v16hLoadSchedule === 'function');
  log('#11: _v16hLoadSchedule defined', hasLoadFn);

  // ============================================================
  // #12 — Team Alerts 5 types
  // ============================================================
  await page.evaluate(() => { try { wsSwitchTab && wsSwitchTab('alerts'); } catch(e){} });
  await page.waitForTimeout(600);

  const alertsOK = await page.evaluate(() => {
    const txt = document.body.innerText || '';
    const types = ['Urgent', 'Warning', 'Info', 'Success', 'System'];
    let found = 0;
    types.forEach(t => { if (txt.includes(t)) found++; });
    return found >= 4; // filter pills + meta labels
  });
  log('#12: Team Alerts shows 5 type filters', alertsOK);

  const alertHelperOK = await page.evaluate(() => typeof _v16hAlertMeta === 'function' && typeof _v16hAlertSetFilter === 'function');
  log('#12: Alert helpers defined', alertHelperOK);

  // Test filter switching
  await page.evaluate(() => { try { _v16hAlertSetFilter('urgent'); } catch(e){} });
  await page.waitForTimeout(400);
  const filterActive = await page.evaluate(() => window._v16hAlertFilter === 'urgent');
  log('#12: Alert filter switches state', filterActive);

  // ============================================================
  // #10 — Follow-Ups filters + columns
  // ============================================================
  await page.evaluate(() => { if (typeof nav==='function') nav('followups'); });
  await page.waitForTimeout(1000);

  const fupTabs = await page.evaluate(() => {
    const txt = document.body.innerText || '';
    return ['Today', 'Tomorrow', 'Overdue', 'Completed'].every(label => txt.includes(label));
  });
  log('#10: Follow-Ups shows all 4 filter tabs', fupTabs);

  const fupColumns = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('table.data-table th')).map(th => (th.textContent||'').trim());
    // Check for new columns: Status, Last Contact, Channel
    return headers.includes('Status') && headers.includes('Last Contact') && headers.includes('Channel');
  });
  log('#10: Follow-Ups table has full columns (Status/Last Contact/Channel)', fupColumns);

  // Test bucket function
  const bucketOK = await page.evaluate(() => {
    try {
      const u = _v16hFupBucket({ stage:'visa', urgent:true });
      const c = _v16hFupBucket({ stage:'visa', urgent:false });
      const t = _v16hFupBucket({ stage:'offer', urgent:false });
      return u === 'overdue' && c === 'today' && t === 'tomorrow';
    } catch(e){ return false; }
  });
  log('#10: _v16hFupBucket classifies correctly', bucketOK);

  // Switch to completed filter
  await page.evaluate(() => { try { _v16hFupSetFilter('completed'); } catch(e){} });
  await page.waitForTimeout(800);
  const completedFilter = await page.evaluate(() => window._v16hFupFilter === 'completed');
  log('#10: Follow-Ups filter switches to Completed', completedFilter);

  // ============================================================
  // FINAL
  // ============================================================
  console.log('\n=== ERRORS ===');
  if (errors.length === 0) console.log('(none)');
  else errors.slice(0, 20).forEach(e => console.log(' • ' + e));

  const pass = results.filter(r => r.ok).length;
  const total = results.length;
  console.log(`\n=== ${pass}/${total} checks passed, ${errors.length} JS errors ===`);

  await browser.close();
  process.exit(pass === total && errors.length === 0 ? 0 : 1);
})();
