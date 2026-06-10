// v15.0 — UI test: log in as Umair and verify My Workspace renders correctly
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const BROWSER = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const results = [];
function check(name, cond, detail='') { results.push({name, pass: !!cond, detail}); }

(async () => {
  const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

  // Capture console errors
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('1 Login page loads', await page.title() === 'Global Guidance — Command Portal');

  // Try to log in as Umair (staff)
  await page.fill('#loginUser', 'umair');
  await page.fill('#loginPass', 'Staff@Global2026');
  await page.click('button:has-text("Sign In")').catch(()=>{});
  // Try alternate login button
  await page.evaluate(() => { if (typeof doLogin === 'function') doLogin(); });
  await page.waitForTimeout(1500);

  // Close any check-in modal so we can inspect the workspace
  await page.evaluate(() => { if (typeof wsCloseCheckin === 'function') wsCloseCheckin(); });
  await page.waitForTimeout(500);

  // Check landing page is myworkspace
  const landedOn = await page.evaluate(() => {
    const el = document.querySelector('.page.active');
    return el ? el.id : null;
  });
  check('2 Staff (Umair) lands on My Workspace', landedOn === 'page-myworkspace', 'landed=' + landedOn);

  // Hero exists
  const heroVisible = await page.locator('#wsHero').count();
  check('3 Workspace hero card renders', heroVisible > 0);

  // Tab bar exists
  const tabBtns = await page.locator('#wsTabs button').count();
  check('4 5 tabs rendered', tabBtns === 5, 'count=' + tabBtns);

  // Body has content
  const bodyText = await page.locator('#wsBody').innerText().catch(() => '');
  check('5 Workspace body renders today\'s tasks', /Today's Tasks|Add Quick Task/.test(bodyText));

  // Open Quick Add modal
  await page.evaluate(() => wsOpenQuickAdd());
  await page.waitForTimeout(300);
  const qaVisible = await page.locator('#wsQuickAddModal').count();
  check('6 Quick Add modal opens', qaVisible > 0);
  const qaFields = await page.locator('#wsQAModal input, #wsQAModal select').count().catch(()=>0);
  const qaFieldsAlt = await page.locator('#wsQATitle, #wsQAPriority, #wsQADue, #wsQAAssign').count();
  check('7 Quick Add has exactly 4 fields', qaFieldsAlt === 4, 'found=' + qaFieldsAlt);
  await page.evaluate(() => wsCloseQuickAdd());

  // Verify advanced nav items hidden for staff
  const navItems = await page.locator('.nav-item').allTextContents();
  check('8 No "Master Sheets" nav for staff', !navItems.some(n => /master sheets/i.test(n)));
  check('9 No "Compliance" or "Analytics" advanced tab for staff', !navItems.some(n => /compliance|analytics/i.test(n)));
  check('10 No "Petty Cash" nav for staff', !navItems.some(n => /petty cash/i.test(n)));
  check('11 "My Workspace" nav present', navItems.some(n => /my workspace/i.test(n)));

  // Switch to follow-ups tab
  await page.evaluate(() => wsSwitchTab('followups'));
  await page.waitForTimeout(300);
  const fupText = await page.locator('#wsBody').innerText({ timeout: 4000 }).catch(()=>'');
  check('12 Follow-ups tab renders', /Follow-Ups/i.test(fupText), 'text snippet=' + fupText.slice(0,80));

  // Switch to EOD
  await page.evaluate(() => wsSwitchTab('eod'));
  await page.waitForTimeout(300);
  const eodText = await page.locator('#wsBody').innerText({ timeout: 4000 }).catch(()=>'');
  check('13 EOD tab renders', /End-of-Day Report|submitted|Submit Report/i.test(eodText), 'text snippet=' + eodText.slice(0,80));

  // ---- Now log in as Thasbiha (management) ----
  await page.evaluate(() => { if (typeof logout === 'function') logout(); else location.reload(); });
  await page.waitForTimeout(800);
  await page.fill('#loginUser', 'thasbiha.s');
  await page.fill('#loginPass', 'Staff@Global2026');
  await page.evaluate(() => { if (typeof doLogin === 'function') doLogin(); });
  await page.waitForTimeout(1500);
  // Close check-in modal if it appears
  await page.evaluate(() => { if (typeof wsCloseCheckin === 'function') wsCloseCheckin(); });
  await page.waitForTimeout(300);

  const mgmtLanding = await page.evaluate(() => {
    const el = document.querySelector('.page.active');
    return el ? el.id : null;
  });
  check('14 Thasbiha (mgmt) lands on Dashboard, NOT workspace', mgmtLanding === 'page-dashboard', 'landed=' + mgmtLanding);

  const mgmtNav = await page.locator('.nav-item').allTextContents();
  // v16f: Thasbiha (Head of Admissions/HR · Himaaus Coordinator) has a streamlined pages list —
  // commissions/petty/payroll/students/workspace/performance/legacy are intentionally hidden
  // per user spec. She does keep Employees + My Workspace + admissions/HR core surfaces.
  check('15 Mgmt sees Employees (mgmt-only HR access retained)', mgmtNav.some(n => /\b(team|employees)\b/i.test(n)));
  check('16 Mgmt also sees My Workspace nav', mgmtNav.some(n => /my workspace/i.test(n)));

  await browser.close();

  console.log('\n=== v15.0 UI / NAV ROLE TEST ===\n');
  let passed = 0;
  for (const r of results) {
    console.log((r.pass ? '✓ PASS' : '✗ FAIL') + ' — ' + r.name + (r.detail?' · '+r.detail:''));
    if (r.pass) passed++;
  }
  console.log(`\nTOTAL: ${passed}/${results.length}`);
  if (pageErrors.length) console.log('\nPage errors:', pageErrors);
  if (consoleErrors.length) console.log('\nConsole errors (first 3):', consoleErrors.slice(0,3));
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
