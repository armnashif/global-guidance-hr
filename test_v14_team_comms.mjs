// Verify team-comms.js: FAB shows after login, panel opens, real commsStartCall wired
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
await page.waitForTimeout(1500);

const r = {};

// 1. team-comms loaded
r.scriptLoaded = await page.evaluate(() => ({
  hasTC: typeof window.TC === 'object',
  hasOpenPanel: window.TC && typeof window.TC.openPanel === 'function',
  hasShareWith: window.TC && typeof window.TC.shareWith === 'function',
  hasSnapRequest: window.TC && typeof window.TC.snapRequest === 'function',
  startCallWrapped: typeof window.commsStartCall === 'function' && !!window.commsStartCall.__tcWrapped
}));

// 2. FAB should NOT show on the login screen
r.preLogin = await page.evaluate(() => ({
  fabExists: !!document.getElementById('tcTeamFab')
}));

// 3. Log in (using a staff demo; if first login fails the gate test will skip)
await page.fill('#loginUser', 'umair');
await page.fill('#loginPass', 'Staff@Global2026');
await page.click('#btnSignin');
await page.waitForTimeout(2500);

// 4. FAB should now appear
r.postLogin = await page.evaluate(() => ({
  appVisible: getComputedStyle(document.getElementById('app')).display !== 'none',
  fabExists: !!document.getElementById('tcTeamFab'),
  hasCurrentUser: !!window.currentUser
}));

// Close any morning gate
await page.evaluate(() => { const g = document.getElementById('msMorningGate'); if (g) g.remove(); });
await page.waitForTimeout(300);

// 5. Click FAB → panel opens, lists teammates
if (r.postLogin.fabExists){
  await page.click('#tcTeamFab');
  await page.waitForTimeout(500);
}
r.panel = await page.evaluate(() => {
  const p = document.getElementById('tcTeamPanel');
  const list = document.getElementById('tcTeamList');
  return {
    panelOpen: !!p,
    hasQuickActions: p && p.querySelectorAll('.tc-quick').length === 4,
    listChildren: list ? list.children.length : 0,
    hasCallButton: p && /fa-phone/.test(p.innerHTML),
    hasShareButton: p && /fa-desktop/.test(p.innerHTML),
    hasSnapButton: p && /fa-camera/.test(p.innerHTML)
  };
});

// 6. Close panel → FAB returns
await page.evaluate(() => { const c = document.getElementById('tcPanelClose'); if (c) c.click(); });
await page.waitForTimeout(300);
r.closeTest = await page.evaluate(() => ({
  panelGone: !document.getElementById('tcTeamPanel'),
  fabBack: !!document.getElementById('tcTeamFab')
}));

console.log('=== RESULTS ===');
console.log(JSON.stringify(r, null, 2));
console.log('\n=== ERRORS ===');
console.log(errs.length ? errs.join('\n') : '(none)');

const passes = [
  ['1a team-comms script loaded',         r.scriptLoaded.hasTC && r.scriptLoaded.hasOpenPanel],
  ['1b shareWith + snapRequest exposed',  r.scriptLoaded.hasShareWith && r.scriptLoaded.hasSnapRequest],
  ['1c commsStartCall is REAL (wrapped)', r.scriptLoaded.startCallWrapped],
  ['2  No FAB on login screen',           !r.preLogin.fabExists],
  ['3  FAB appears after staff login',    r.postLogin.appVisible && r.postLogin.fabExists],
  ['4  Panel opens on FAB click',         r.panel.panelOpen && r.panel.hasQuickActions],
  ['5  Panel lists teammates with call/share/snap buttons',
       r.panel.listChildren >= 1 && r.panel.hasCallButton && r.panel.hasShareButton && r.panel.hasSnapButton],
  ['6  Panel closes, FAB returns',        r.closeTest.panelGone && r.closeTest.fabBack],
];

console.log('\n=== PASS/FAIL ===');
let pass = 0, fail = 0;
passes.forEach(([n,ok]) => { console.log((ok?'✓ PASS':'✗ FAIL')+' — '+n); ok ? pass++ : fail++; });
console.log('\nTOTAL: '+pass+'/'+(pass+fail)+' passed ('+fail+' failed). Page errors: '+errs.length);

await browser.close();
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
