// v16 Wave C — Team Attendance Board + Workflow Engine v2 + Builder UI
// Validates Blocks 1-6: role-aware default tasks, team board renders for HR/CEO/COO,
// workflow engine fires events, library has 12 workflows, builder UI opens.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_EXEC = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';

const STAFF_PW = 'Staff@Global2026';
const CEO_PW   = 'CEO@Global2026';
const COO_PW   = 'COO@Global2026';
const SA_PW    = 'SuperAdmin@2026';

const results = [];
function check(name, cond){ results.push({ name, ok: !!cond }); console.log((cond?'✓ PASS':'✗ FAIL') + ' — ' + name); }

async function loginAs(page, username, password){
  await page.goto(BASE, { waitUntil:'load' });
  await page.waitForSelector('#loginUser', { timeout: 10000 });
  await page.fill('#loginUser', username);
  await page.fill('#loginPass', password);
  await page.click('#btnSignin');
  await page.waitForFunction(() => {
    const a = document.getElementById('app');
    return a && a.style.display !== 'none';
  }, { timeout: 8000 });
  await page.waitForTimeout(400);
}

async function navHas(page, label){
  return await page.evaluate(lbl => {
    const items = document.querySelectorAll('#sidebarNav .nav-item .nav-item-label');
    return Array.from(items).some(i => i.textContent.trim().toLowerCase() === lbl.toLowerCase());
  }, label);
}

(async () => {
  const browser = await chromium.launch({ executablePath: BROWSER_EXEC });
  const ctx = await browser.newContext();

  // ============ Block 1 — Universal Attendance defaults ============
  // Sukaina (Counsellor) should get a role-tuned default daily plan.
  let page = await ctx.newPage();
  await loginAs(page, 'sukaina', STAFF_PW);
  const sukDefaults = await page.evaluate(() => {
    // Clear any pre-existing state so we test the seeded defaults
    sessionStorage.removeItem('gg_att_sukaina');
    loadAttForUser();
    return {
      role: attendanceState._seededRole,
      tasks: attendanceState.tasks.map(t => t.text),
      categories: attendanceState.selectedCategories
    };
  });
  check('1  Sukaina is seeded as counsellor role',           sukDefaults.role === 'counsellor');
  check('2  Sukaina has Call 5 leads in default plan',       sukDefaults.tasks.some(t => /call\s+5\s+leads/i.test(t)));
  check('3  Sukaina default categories include followups',   sukDefaults.categories.includes('followups'));
  await page.close();

  // Saleh (HR Exec) should get HR-tuned defaults.
  page = await ctx.newPage();
  await loginAs(page, 'saleh', STAFF_PW);
  const salDefaults = await page.evaluate(() => {
    sessionStorage.removeItem('gg_att_saleh');
    loadAttForUser();
    return { role: attendanceState._seededRole, tasks: attendanceState.tasks.map(t => t.text) };
  });
  check('4  Saleh is seeded as hr_exec role',                salDefaults.role === 'hr_exec');
  check('5  Saleh has Process leave queue default task',     salDefaults.tasks.some(t => /leave\s+queue/i.test(t)));
  await page.close();

  // Shiran (Designer) — should get designer defaults
  page = await ctx.newPage();
  await loginAs(page, 'shiran', STAFF_PW);
  const shiDefaults = await page.evaluate(() => {
    sessionStorage.removeItem('gg_att_shiran');
    loadAttForUser();
    return { role: attendanceState._seededRole, tasks: attendanceState.tasks.map(t => t.text) };
  });
  check('6  Shiran is seeded as designer role',              shiDefaults.role === 'designer');
  check('7  Shiran has Publish IG post default task',        shiDefaults.tasks.some(t => /IG\s+post/i.test(t)));
  await page.close();

  // ============ Block 2 — Team Attendance Board ============

  // Staff (Umair) should NOT see Team Attendance in nav
  page = await ctx.newPage();
  await loginAs(page, 'umair', STAFF_PW);
  check('8  Umair (staff) does NOT see Team Attendance nav', !(await navHas(page, 'Team Attendance')));
  await page.close();

  // Saleh (HR) SHOULD see Team Attendance
  page = await ctx.newPage();
  await loginAs(page, 'saleh', STAFF_PW);
  check('9  Saleh sees Team Attendance nav',                 await navHas(page, 'Team Attendance'));
  // Navigate and check page renders
  await page.evaluate(() => nav('teamattendance'));
  await page.waitForTimeout(800); // fetch /api/workspace/team
  const taText = await page.evaluate(() => document.body.innerText);
  check('10 Team Attendance page renders header',            /TEAM\s+ATTENDANCE\s+BOARD/i.test(taText));
  check('11 Team Attendance shows Present stat',             /PRESENT/i.test(taText) && /MISSING/i.test(taText));
  check('12 Team Attendance renders a table row for users',  await page.evaluate(() => document.querySelectorAll('#taTable tbody tr').length >= 3));
  await page.close();

  // CEO (Nashif) also sees Team Attendance
  page = await ctx.newPage();
  await loginAs(page, 'nashif.razzak', CEO_PW);
  check('13 Nashif (CEO) sees Team Attendance nav',          await navHas(page, 'Team Attendance'));
  await page.close();

  // COO (Nafees) also sees Team Attendance
  page = await ctx.newPage();
  await loginAs(page, 'nafees.razzak', COO_PW);
  check('14 Nafees (COO) sees Team Attendance nav',          await navHas(page, 'Team Attendance'));
  await page.close();

  // ============ Block 4 — Workflow Engine ============
  page = await ctx.newPage();
  await loginAs(page, 'superadmin', SA_PW);

  const engineProbe = await page.evaluate(() => ({
    hasEngine: typeof window.WorkflowEngine === 'object' && typeof window.WorkflowEngine.fire === 'function',
    triggerCount: Object.keys(window.WORKFLOW_TRIGGERS || {}).length,
    actionCount:  Object.keys(window.WORKFLOW_ACTIONS  || {}).length,
    workflowCount: Array.isArray(window.WORKFLOWS) ? window.WORKFLOWS.length : 0
  }));
  check('15 WorkflowEngine is exposed on window',            engineProbe.hasEngine);
  check('16 Engine has >= 15 triggers',                       engineProbe.triggerCount >= 15);
  check('17 Engine has >= 5 actions',                         engineProbe.actionCount >= 5);
  check('18 Engine has 12 default workflows',                 engineProbe.workflowCount === 12);

  // Fire a known event — wf-redflag should trigger a toast
  const fireResult = await page.evaluate(() => {
    const r = window.WorkflowEngine.fire('redflag.raised', { lead:'TestLead', user:'test' });
    return { fired: r.fired, ok: r.ok };
  });
  check('19 firing redflag.raised returns ok',               fireResult.ok === true);
  check('20 firing redflag.raised triggers >= 1 action',     fireResult.fired >= 1);
  // Toast should be visible
  await page.waitForTimeout(200);
  const toastVisible = await page.evaluate(() => {
    const host = document.getElementById('_notifToastHost');
    return host && host.children.length > 0;
  });
  check('21 toast appears after workflow fires',             toastVisible);

  // Firing unknown event returns error
  const unkRes = await page.evaluate(() => window.WorkflowEngine.fire('totally.fake.event', {}));
  check('22 unknown trigger returns ok:false',               unkRes.ok === false);

  // Disable a workflow then fire — nothing should run
  const disResult = await page.evaluate(() => {
    window.WorkflowEngine.enable('wf-redflag', false);
    const r = window.WorkflowEngine.fire('redflag.raised', { lead:'X' });
    window.WorkflowEngine.enable('wf-redflag', true); // restore
    return r;
  });
  check('23 disabled workflow does not fire',                disResult.fired === 0);

  // Execution log captures runs
  const logLen = await page.evaluate(() => window.WorkflowEngine.log().length);
  check('24 execution log has >= 1 entry after firing',      logLen >= 1);

  // ============ Block 6 — Workflow Builder UI ============
  // Navigate to Settings → Automation
  await page.evaluate(() => { nav('settings'); });
  await page.waitForTimeout(400);
  // Click the automation module in settings sidebar
  await page.evaluate(() => { if (typeof renderSettingsModule === 'function') renderSettingsModule('automation'); });
  await page.waitForTimeout(300);

  const builderHTML = await page.evaluate(() => {
    const el = document.getElementById('settingsContent') || document.body;
    return el.innerText;
  });
  check('25 Automation settings shows Active Automations',   /Active\s+Automations/i.test(builderHTML));
  check('26 Automation settings shows execution log',        /Execution\s+Log/i.test(builderHTML));

  // Open builder via wfOpenBuilder()
  const builderOpened = await page.evaluate(() => {
    if (typeof window.wfOpenBuilder !== 'function') return false;
    window.wfOpenBuilder('wf-redflag');
    const card = document.getElementById('wfBuilderCard');
    return card && card.style.display !== 'none';
  });
  check('27 Workflow builder card opens when editing',       builderOpened);

  // Builder lets us read the workflow form
  const formProbe = await page.evaluate(() => {
    const inp = document.querySelectorAll('#wfBuilderBody input, #wfBuilderBody select');
    return inp.length;
  });
  check('28 Builder shows >= 3 input/select fields',         formProbe >= 3);

  // Test fire from the UI helper
  const testFireWorks = await page.evaluate(() => {
    if (typeof window.wfTestFire !== 'function') return false;
    try { window.wfTestFire('wf-cas-issued'); return true; } catch(e){ return false; }
  });
  check('29 wfTestFire helper executes without error',       testFireWorks);

  // Reset defaults restores 12 workflows
  await page.evaluate(() => {
    // Add a custom workflow, then reset
    window.WorkflowEngine.upsert({ id:'wf-custom-test', name:'X', trigger:'lead.created', action:'toast', params:{ text:'X' }, enabled:true });
  });
  const beforeReset = await page.evaluate(() => window.WORKFLOWS.length);
  check('30 Custom workflow added (13 total)',                beforeReset === 13);

  await page.evaluate(() => window.WorkflowEngine.resetDefaults());
  const afterReset = await page.evaluate(() => window.WORKFLOWS.length);
  check('31 resetDefaults restores 12 workflows',             afterReset === 12);

  await page.close();
  await browser.close();

  // ============ Summary ============
  const pass = results.filter(r => r.ok).length;
  const fail = results.length - pass;
  console.log('');
  console.log('───────────────────────────────────────────');
  console.log('TOTAL: ' + pass + '/' + results.length + (fail ? ('  (' + fail + ' FAILED)') : ''));
  console.log('───────────────────────────────────────────');
  if (fail) {
    console.log('FAILED tests:');
    results.filter(r => !r.ok).forEach(r => console.log('  ✗ ' + r.name));
    process.exit(1);
  }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
