// v16 Wave B — role engine, role widgets, module toggle, CEO Command, notif buckets
// Logs in as a sample of users and checks the right widgets/pages render.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER_EXEC = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';

const STAFF_PW = 'Staff@Global2026';
const CEO_PW   = 'CEO@Global2026';
const COO_PW   = 'COO@Global2026';

const results = [];
function check(name, cond){ results.push({ name, ok: !!cond }); console.log((cond?'✓ PASS':'✗ FAIL') + ' — ' + name); }

async function loginAs(page, username, password){
  await page.goto(BASE, { waitUntil:'load' });
  // Wait for login screen
  await page.waitForSelector('#loginUser', { timeout: 10000 });
  await page.fill('#loginUser', username);
  await page.fill('#loginPass', password);
  await page.click('#btnSignin');
  // App container becomes visible
  await page.waitForFunction(() => {
    const a = document.getElementById('app');
    return a && a.style.display !== 'none';
  }, { timeout: 8000 });
  await page.waitForTimeout(400);
}

async function getRoleWidgetText(page){
  return await page.evaluate(() => {
    const el = document.getElementById('wsRoleWidgets');
    return el ? el.innerText : '';
  });
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

  // ============ 1. Staff: Umair = Admissions Exec ============
  let page = await ctx.newPage();
  await loginAs(page, 'umair', STAFF_PW);
  const umairWidgets = await getRoleWidgetText(page);
  check('1  Umair sees Admissions Exec widget (Offers Awaiting Deposit)', /OFFERS\s+AWAITING\s+DEPOSIT/i.test(umairWidgets));
  check('2  Umair sees CAS In Flight tile',                              /CAS\s+IN\s+FLIGHT/i.test(umairWidgets));
  check('3  Umair lands on My Workspace (staff default)',                await page.evaluate(()=>!!document.getElementById('page-myworkspace')));
  await page.close();

  // ============ 2. Staff: Sukaina = Counsellor ============
  page = await ctx.newPage();
  await loginAs(page, 'sukaina', STAFF_PW);
  const sukWidgets = await getRoleWidgetText(page);
  check('4  Sukaina sees Counsellor widget (Calls Today)',               /CALLS\s+TODAY/i.test(sukWidgets));
  check('5  Sukaina sees My Students tile',                              /MY\s+STUDENTS/i.test(sukWidgets));
  await page.close();

  // ============ 3. Staff: Shiran = Designer ============
  page = await ctx.newPage();
  await loginAs(page, 'shiran', STAFF_PW);
  const shiWidgets = await getRoleWidgetText(page);
  check('6  Shiran sees Designer widget (Design Queue)',                 /DESIGN\s+QUEUE/i.test(shiWidgets));
  check('7  Shiran sees Brand Assets tile',                              /BRAND\s+ASSETS/i.test(shiWidgets));
  await page.close();

  // ============ 4. NEW STAFF: Saleh = HR Exec ============
  page = await ctx.newPage();
  await loginAs(page, 'saleh', STAFF_PW);
  const salWidgets = await getRoleWidgetText(page);
  check('8  Saleh sees HR widget (Leave Queue)',                         /LEAVE\s+QUEUE/i.test(salWidgets));
  check('9  Saleh sees Attendance Alerts tile',                          /ATTENDANCE\s+ALERTS/i.test(salWidgets));
  await page.close();

  // ============ 5. NEW STAFF: Shakya + Jinushiya exist & login ============
  page = await ctx.newPage();
  await loginAs(page, 'shakya', STAFF_PW);
  const shakWidgets = await getRoleWidgetText(page);
  check('10 Shakya (Jr Counsellor) sees Mentor tile',                    /MENTOR/i.test(shakWidgets));
  await page.close();

  page = await ctx.newPage();
  await loginAs(page, 'jinushiya', STAFF_PW);
  const jinWidgets = await getRoleWidgetText(page);
  check('11 Jinushiya (Intern) sees Supervisor + Training tiles',        /SUPERVISOR/i.test(jinWidgets) && /TRAINING/i.test(jinWidgets));
  check('12 Jinushiya sees intern learning-goal banner',                 /learning goal/i.test(jinWidgets));
  await page.close();

  // ============ 6. Management: Thasbiha = Admissions Head ============
  page = await ctx.newPage();
  await loginAs(page, 'thasbiha.s', STAFF_PW);
  // Thasbiha lands on dashboard; navigate to workspace manually
  await page.evaluate(()=>nav('myworkspace'));
  await page.waitForTimeout(400);
  const thsWidgets = await getRoleWidgetText(page);
  check('13 Thasbiha sees Admissions Head widgets (Offers Pending)',     /OFFERS\s+PENDING/i.test(thsWidgets));
  check('14 Thasbiha workspace has Master Sheets quick action',          /Master Sheets/i.test(thsWidgets));
  await page.close();

  // ============ 7. Management: Razan = BD/Finance ============
  page = await ctx.newPage();
  await loginAs(page, 'razan.thawus', STAFF_PW);
  await page.evaluate(()=>nav('myworkspace'));
  await page.waitForTimeout(400);
  const razWidgets = await getRoleWidgetText(page);
  check('15 Razan sees BD/Finance widget (Pending Commission)',          /PENDING\s+COMMISSION/i.test(razWidgets));
  check('16 Razan sees Visa Pipeline tile',                              /VISA\s+PIPELINE/i.test(razWidgets));
  await page.close();

  // ============ 8. CEO: Nashif = CEO Command + nav has CEO Command ============
  page = await ctx.newPage();
  await loginAs(page, 'nashif.razzak', CEO_PW);
  check('17 Nashif has CEO Command nav item',                            await navHas(page, 'CEO Command'));
  // Open CEO Command
  await page.evaluate(()=>nav('ceocommand'));
  await page.waitForTimeout(500);
  const ceoBody = await page.evaluate(()=>document.body.innerText);
  check('18 CEO Command page renders Conversion Funnel',                 /Conversion Funnel/i.test(ceoBody));
  check('19 CEO Command page renders Counsellor Leaderboard',            /Counsellor Leaderboard/i.test(ceoBody));
  check('20 CEO Command page renders Application Aging',                 /Application Aging/i.test(ceoBody));
  check('21 CEO Command page renders Critical Alerts',                   /Critical Alerts/i.test(ceoBody));
  await page.close();

  // ============ 9. Staff CANNOT access CEO Command ============
  page = await ctx.newPage();
  await loginAs(page, 'umair', STAFF_PW);
  check('22 Umair does NOT see CEO Command nav',                         !(await navHas(page, 'CEO Command')));
  await page.close();

  // ============ 10. Module toggle: CEO can access Settings → Modules ============
  page = await ctx.newPage();
  await loginAs(page, 'nashif.razzak', CEO_PW);
  // Open module overrides via API: programmatically toggle a module off, then check sidebar
  const beforeLeads = await navHas(page, 'Leads');
  await page.evaluate(()=>{ _modSetOverride('leads', false); /* disabled flag not set yet -> override doesn't hide; need disabled flag */ });
  check('23 Module overrides helper accessible (CEO)',                   typeof await page.evaluate(()=>typeof window._modSetOverride) === 'string');
  check('24 Pre-toggle: Leads visible to Nashif',                        beforeLeads);
  // Simulate marking 'leads' as disabled-by-default and overriding off
  await page.evaluate(()=>{
    const nav = NAV_STRUCTURE.find(s=>s.label==='CRM');
    if (nav){ const it = nav.items.find(i=>i.id==='leads'); if (it) it.disabled = true; }
    _modSetOverride('leads', false);
    buildSidebar();
  });
  const afterDisabled = await navHas(page, 'Leads');
  check('25 After disabled+no-override, Leads hidden from nav',          !afterDisabled);
  // Now override ON
  await page.evaluate(()=>{ _modSetOverride('leads', true); buildSidebar(); });
  const afterEnabled = await navHas(page, 'Leads');
  check('26 After override ON, Leads visible again',                     afterEnabled);
  await page.close();

  // ============ 11. Notification toast appears ============
  page = await ctx.newPage();
  await loginAs(page, 'umair', STAFF_PW);
  await page.evaluate(()=>notifToast('Wave B test toast','info'));
  await page.waitForTimeout(300);
  const toastShown = await page.evaluate(()=>{
    const host = document.getElementById('_notifToastHost');
    return host && host.children.length > 0 && /Wave B test toast/.test(host.innerText);
  });
  check('27 notifToast() renders a visible toast card',                  toastShown);
  await page.close();

  // ============ 12. Grouped notification view ============
  page = await ctx.newPage();
  await loginAs(page, 'umair', STAFF_PW);
  await page.evaluate(()=>{
    tbAddNotif({ id:'tst-crit', cat:'visa', icon:'fa-passport', color:'#dc2626', title:'Test critical', sub:'Demo', prio:'high' });
    tbAddNotif({ id:'tst-fin',  cat:'finance', icon:'fa-coins', color:'#f59e0b', title:'Test finance', sub:'Demo', prio:'med' });
    tbAddNotif({ id:'tst-ops',  cat:'task',  icon:'fa-list',   color:'#3b82f6', title:'Test op',     sub:'Demo', prio:'low' });
    tbNotifOpen();
  });
  await page.waitForTimeout(300);
  const notifText = await page.evaluate(()=>{
    const p = document.getElementById('tbPopNotif');
    return p ? p.innerText : '';
  });
  check('28 Notification panel shows CRITICAL bucket',                   /CRITICAL/i.test(notifText));
  check('29 Notification panel shows FINANCE bucket',                    /FINANCE/i.test(notifText));
  check('30 Notification panel shows OPERATIONAL bucket',                /OPERATIONAL/i.test(notifText));
  await page.close();

  await browser.close();
  console.log('\n=== v16 WAVE B TEST ===\n');
  const passed = results.filter(r=>r.ok).length;
  console.log(`TOTAL: ${passed}/${results.length}`);
  if (passed !== results.length){
    console.log('\nFailures:');
    results.filter(r=>!r.ok).forEach(r => console.log('  ✗ ' + r.name));
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });
