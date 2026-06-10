// Quick verification that the Agent Portal v14 wires up correctly.
import { chromium } from 'playwright';

const BROWSER = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const URL = 'http://localhost:3000/';

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: '+e.message));
page.on('console', m => { if (m.type()==='error') errs.push('console.error: '+m.text()); });

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

const r = {};

// 1. agent-portal.js loaded?
r.scriptLoaded = await page.evaluate(() => ({
  hasAgentsData: typeof AGENTS_DATA !== 'undefined' && Array.isArray(AGENTS_DATA),
  agentsCount: typeof AGENTS_DATA !== 'undefined' ? AGENTS_DATA.length : 0,
  hasOpenFn: typeof agentPortalOpen === 'function',
  hasResolver: typeof agentLoginResolve === 'function',
  hasPasswordFn: typeof agentPasswordFor === 'function',
  hasQuickLogin: typeof agentQuickLogin === 'function'
}));

// 2. Third tab "Agent" rendered on login screen?
r.agentTabRendered = await page.evaluate(() => {
  const tab = document.getElementById('loginTabAgent');
  return { exists: !!tab, text: tab ? tab.innerText.trim() : null };
});

// 3. Click the Agent tab; tab activates and the user/pass placeholders change.
// (v14.3: demo quick-login buttons removed — agents type their own credentials.)
await page.click('#loginTabAgent');
await page.waitForTimeout(500);
r.agentTabActive = await page.evaluate(() => {
  const tab = document.getElementById('loginTabAgent');
  const u = document.getElementById('loginUser');
  const p = document.getElementById('loginPass');
  const btn = document.getElementById('btnSignin');
  return {
    tabActive: !!tab && tab.classList.contains('active'),
    userPlaceholder: u ? u.placeholder : '',
    passPlaceholder: p ? p.placeholder : '',
    btnLabel: btn ? btn.innerText.trim() : '',
    noQuickRowVisible: !document.querySelector('#agentQuickRow:not([style*="display: none"])')
  };
});

// 4. Log in as an agent
await page.fill('#loginUser', 'agent.colombo');
await page.fill('#loginPass', 'Agent@Global2026');
await page.click('#btnSignin');
await page.waitForTimeout(1500);
r.agentPortalOpen = await page.evaluate(() => {
  const m = document.getElementById('agentPortalModal');
  return {
    modalOpen: !!m,
    pageTitle: (document.getElementById('agentPageTitle')||{}).textContent || null,
    navItemCount: document.querySelectorAll('#agentNav > div').length,
    kpiSeen: /total submissions/i.test(document.body.innerText) && /conversion rate/i.test(document.body.innerText)
  };
});

// 5. Navigate to applications page
r.appsPage = await page.evaluate(() => {
  try { agentNav('applications'); } catch(e){ return { err: e.message }; }
  return {
    title: (document.getElementById('agentPageTitle')||{}).textContent || null,
    hasTable: !!document.querySelector('#agentBody table'),
    rowCount: document.querySelectorAll('#agentBody tbody tr').length,
    hasFilterChips: document.body.innerText.includes('All') && document.body.innerText.includes('Applied')
  };
});

// 6. Submit-application form renders?
r.submitForm = await page.evaluate(() => {
  try { agentNav('submit'); } catch(e){ return { err: e.message }; }
  return {
    hasNameField: !!document.getElementById('agSubName'),
    hasEmailField: !!document.getElementById('agSubEmail'),
    hasCourseField: !!document.getElementById('agSubCourse'),
    hasDestSelect: !!document.getElementById('agSubDest')
  };
});

// 7. Commission page renders
await page.evaluate(() => { try { agentNav('commissions'); } catch(e){} });
await page.waitForTimeout(400);
r.commissionsPage = await page.evaluate(() => {
  return {
    hasLedger: /commission ledger/i.test(document.body.innerText),
    hasKpis: /pending payout/i.test(document.body.innerText),
    hasReadyToInvoice: /ready to invoice/i.test(document.body.innerText)
  };
});

// 8. Profile + password change
r.profilePage = await page.evaluate(() => {
  try { agentNav('profile'); } catch(e){ return { err: e.message }; }
  return {
    hasNameInput: !!document.getElementById('agProfName'),
    hasPwOldInput: !!document.getElementById('agPwOld'),
    hasPwNewInput: !!document.getElementById('agPwNew'),
    hasStats: document.body.innerText.includes('Partnership Stats')
  };
});

// 9. Wrong password rejection
await page.evaluate(() => { if (typeof agentPortalClose === 'function') agentPortalClose(); });
await page.waitForTimeout(400);
await page.click('#loginTabAgent');
await page.waitForTimeout(200);
await page.fill('#loginUser', 'agent.colombo');
await page.fill('#loginPass', 'WrongPassword');
await page.click('#btnSignin');
await page.waitForTimeout(600);
r.wrongPasswordRejected = await page.evaluate(() => {
  const err = document.getElementById('loginError');
  return {
    errorShown: err && getComputedStyle(err).display !== 'none',
    errorText: err ? err.textContent : '',
    modalAbsent: !document.getElementById('agentPortalModal')
  };
});

await browser.close();

console.log('\n=== v14 AGENT PORTAL VERIFICATION ===\n');
console.log(JSON.stringify(r, null, 2));
console.log('\n=== ERRORS ===');
console.log(errs.length ? errs.join('\n') : '(none)');

const checks = [
  ['1a Script loaded',                  r.scriptLoaded.hasAgentsData && r.scriptLoaded.agentsCount === 5],
  ['1b Agent functions exported',       r.scriptLoaded.hasOpenFn && r.scriptLoaded.hasResolver && r.scriptLoaded.hasPasswordFn && r.scriptLoaded.hasQuickLogin],
  ['2  Agent tab renders on login',     r.agentTabRendered.exists && r.agentTabRendered.text && r.agentTabRendered.text.includes('Agent')],
  ['3  Agent tab activates (placeholders update, no demo quick-row)',
   r.agentTabActive.tabActive && /agent/i.test(r.agentTabActive.userPlaceholder) && /agent/i.test(r.agentTabActive.btnLabel) && r.agentTabActive.noQuickRowVisible],
  ['4a Agent login opens portal modal', r.agentPortalOpen.modalOpen],
  ['4b Dashboard greets correctly',     r.agentPortalOpen.pageTitle === 'Dashboard' && r.agentPortalOpen.kpiSeen],
  ['4c Sidebar has 8 nav items',        r.agentPortalOpen.navItemCount === 8],
  ['5a Applications table renders',     r.appsPage.hasTable && r.appsPage.rowCount >= 2],
  ['5b Filter chips visible',           r.appsPage.hasFilterChips],
  ['6  Submit form has all key fields', r.submitForm.hasNameField && r.submitForm.hasEmailField && r.submitForm.hasCourseField && r.submitForm.hasDestSelect],
  ['7  Commission ledger renders',      r.commissionsPage.hasLedger && r.commissionsPage.hasKpis && r.commissionsPage.hasReadyToInvoice],
  ['8  Profile/password page renders',  r.profilePage.hasNameInput && r.profilePage.hasPwOldInput && r.profilePage.hasPwNewInput && r.profilePage.hasStats],
  ['9  Wrong password rejected',        r.wrongPasswordRejected.errorShown && r.wrongPasswordRejected.modalAbsent]
];

console.log('\n=== PASS/FAIL ===');
let pass=0, fail=0;
for (const [n,ok] of checks){
  console.log((ok ? '✓ PASS' : '✗ FAIL') + ' — ' + n);
  if (ok) pass++; else fail++;
}
console.log(`\nTOTAL: ${pass}/${checks.length} passed (${fail} failed). Page errors: ${errs.length}`);
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
