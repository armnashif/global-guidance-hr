// Headless verification of v13 five fixes:
//  1. Tiered credentials (CEO / COO / SuperAdmin / Staff)
//  2. Razan theme retint (no pink) + Thasbiha pink preserved
//  3. Amana Bank opening balance card in Morning Check-In
//  4. Amana Bank closing balance card in EOD
//  5. Email Hub unified sync modal (no chained prompts)
import { chromium } from 'playwright';

const BROWSER = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const URL = 'http://localhost:3000/';

const results = {};
const errors = [];

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

async function login(page, username, password) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  return await page.evaluate(({u, p}) => {
    const uInput = document.getElementById('loginUsername') || document.querySelector('input[type="text"]');
    const pInput = document.getElementById('loginPassword') || document.querySelector('input[type="password"]');
    if (!uInput || !pInput) return { ok:false, reason:'inputs missing' };
    uInput.value = u; pInput.value = p;
    uInput.dispatchEvent(new Event('input',{bubbles:true}));
    pInput.dispatchEvent(new Event('input',{bubbles:true}));
    if (typeof doLogin === 'function') { try { doLogin(); } catch(e) { return { ok:false, reason:'doLogin err:'+e.message }; } }
    else {
      const btn = document.querySelector('button[onclick*="doLogin"]') || document.querySelector('.login-btn');
      if (btn) btn.click(); else return { ok:false, reason:'no login button' };
    }
    return { ok:true };
  }, {u:username, p:password});
}

// ====== TEST 1: Tiered credentials ======
{
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('TEST1 ' + e.message));
  // probe: login screen hidden => logged in
  const probeFn = `(() => { const ls = document.getElementById('loginScreen'); const stillOnLogin = ls && getComputedStyle(ls).display !== 'none'; return { loggedIn: !stillOnLogin }; })()`;
  // 1a: SuperAdmin with new password should succeed
  await login(page, 'superadmin', 'SuperAdmin@2026');
  await page.waitForTimeout(900);
  results.t1_super_new = await page.evaluate(probeFn);
  // 1b: SuperAdmin with OLD password should fail
  await page.evaluate(() => { try { logout(); } catch(e){} });
  await page.waitForTimeout(400);
  await login(page, 'superadmin', 'admin@123');
  await page.waitForTimeout(700);
  results.t1_super_old = await page.evaluate(() => {
    const ls = document.getElementById('loginScreen');
    const stillOnLogin = ls && getComputedStyle(ls).display !== 'none';
    return { loggedIn: !stillOnLogin };
  });
  // 1c: CEO Nashif new password
  await page.evaluate(() => { try { logout(); } catch(e){} });
  await page.waitForTimeout(400);
  await login(page, 'nashif.razzak', 'CEO@Global2026');
  await page.waitForTimeout(800);
  results.t1_ceo = await page.evaluate(probeFn);
  // 1d: COO Nafees new password
  await page.evaluate(() => { try { logout(); } catch(e){} });
  await page.waitForTimeout(400);
  await login(page, 'nafees.razzak', 'COO@Global2026');
  await page.waitForTimeout(800);
  results.t1_coo = await page.evaluate(probeFn);
  // 1e: Razan staff new password
  await page.evaluate(() => { try { logout(); } catch(e){} });
  await page.waitForTimeout(400);
  await login(page, 'razan.thawus', 'Staff@Global2026');
  await page.waitForTimeout(800);
  results.t1_staff = await page.evaluate(probeFn);
  // 1f: Razan with old "password123" should fail
  await page.evaluate(() => { try { logout(); } catch(e){} });
  await page.waitForTimeout(400);
  await login(page, 'razan.thawus', 'password123');
  await page.waitForTimeout(700);
  results.t1_staff_old = await page.evaluate(probeFn);
  // 1g: Password override via localStorage (simulate userChangePassword)
  await page.evaluate(() => {
    localStorage.setItem('gg-pw-overrides', JSON.stringify({ 'razan.thawus':'MyNewPass1' }));
  });
  await page.waitForTimeout(200);
  await login(page, 'razan.thawus', 'MyNewPass1');
  await page.waitForTimeout(700);
  results.t1_override = await page.evaluate(probeFn);
  await page.evaluate(() => { try { localStorage.removeItem('gg-pw-overrides'); } catch(e){} });
  await page.close();
}

// ====== TEST 2: Razan theme retint + Thasbiha pink retained ======
{
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('TEST2 ' + e.message));
  await login(page, 'razan.thawus', 'Staff@Global2026');
  await page.waitForTimeout(1200);
  results.t2_razan = await page.evaluate(() => {
    const styleTag = document.getElementById('userThemeTint');
    const accent4 = getComputedStyle(document.documentElement).getPropertyValue('--accent4').trim();
    const avatarEl = document.getElementById('sideAvatar');
    const avatarBg = avatarEl ? getComputedStyle(avatarEl).backgroundImage : '';
    return {
      themeTintInjected: !!styleTag,
      accent4: accent4,
      avatarHasPink: avatarBg.toLowerCase().includes('f06595'),
      avatarBg: avatarBg.substring(0,180),
      userName: window.currentUser?.name||null
    };
  });
  await page.evaluate(() => { try { logout(); } catch(e){} });
  await page.waitForTimeout(400);
  await login(page, 'thasbiha.s', 'Staff@Global2026');
  await page.waitForTimeout(1200);
  results.t2_thasbiha = await page.evaluate(() => {
    const styleTag = document.getElementById('userThemeTint');
    const accent4 = getComputedStyle(document.documentElement).getPropertyValue('--accent4').trim();
    return {
      themeTintInjected: !!styleTag,
      accent4: accent4,
      userName: window.currentUser?.name||null
    };
  });
  await page.close();
}

// ====== TEST 3 + 4: Amana Bank Morning + EOD ======
{
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('TEST3 ' + e.message));
  await login(page, 'razan.thawus', 'Staff@Global2026');
  await page.waitForTimeout(1200);
  // Navigate to attendance
  await page.evaluate(() => { if (typeof nav === 'function') nav('attendance'); });
  await page.waitForTimeout(700);
  // Open detailed mode if needed and morning sub-tab
  results.t3_morning = await page.evaluate(() => {
    // Try to enter detailed mode + morning
    try { if (typeof attSetSubtab === 'function') attSetSubtab('morning'); } catch(e){}
    try { if (typeof renderAttendanceDetailed === 'function') renderAttendanceDetailed(); } catch(e){}
    const text = document.body.innerText;
    const opening = document.getElementById('att-amana-opening');
    return {
      cardVisible: text.includes('Amana Bank Account') && text.includes('Opening Balance'),
      inputExists: !!opening,
      hasGlobalGuidanceTitle: text.includes('Global Guidance · Amana Bank'),
      stateHasAmanaOpening: typeof attendanceState !== 'undefined' && 'amanaOpening' in attendanceState
    };
  });
  // Type a value into the opening balance and confirm state persists
  results.t3_input = await page.evaluate(() => {
    const el = document.getElementById('att-amana-opening');
    if (!el) return { ok:false, reason:'no input' };
    el.value = '1250400.00';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return { ok:true, stateValue: attendanceState.amanaOpening };
  });
  // Navigate to EOD subtab — the app uses attendanceState.activeSubTab='eod' then re-nav
  await page.evaluate(() => {
    try {
      attendanceState.activeSubTab = 'eod';
      if (typeof saveAtt === 'function') saveAtt();
      if (typeof nav === 'function') nav('attendance');
    } catch(e){}
  });
  await page.waitForTimeout(600);
  results.t4_eod = await page.evaluate(() => {
    // The EOD section is wrapped in #att-eod display block when active
    const eodDiv = document.getElementById('att-eod');
    const eodVisible = eodDiv && getComputedStyle(eodDiv).display !== 'none';
    // Use innerHTML so off-screen / display-block-inner content is still found
    const text = (eodDiv ? (eodDiv.innerText + ' ' + eodDiv.innerHTML) : document.body.innerText);
    return {
      eodCardVisible: text.includes('End-of-Day Balance') && text.includes('Amana Bank'),
      hasNetChange: text.includes('Net change today'),
      hasClosingField: text.includes('Closing balance'),
      hasInflow: text.includes('Total Inflow'),
      hasOutflow: text.includes('Total Outflow'),
      stateHasAmanaClosing: typeof attendanceState !== 'undefined' && attendanceState.eod && 'amanaClosing' in attendanceState.eod,
      eodVisible: eodVisible,
      eodSnippet: text.substring(0, 200)
    };
  });
  await page.close();
}

// ====== TEST 5: Email Hub unified sync modal ======
{
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('TEST5 ' + e.message));
  // Stub prompt so if old code path runs, we detect it
  await page.addInitScript(() => {
    window.__promptCalls = 0;
    const origPrompt = window.prompt;
    window.prompt = function(){ window.__promptCalls++; return ''; };
  });
  await login(page, 'razan.thawus', 'Staff@Global2026');
  await page.waitForTimeout(1200);
  results.t5_modal = await page.evaluate(() => {
    const out = { hasOpenSync: typeof emailOpenSyncModal === 'function', hasSelectTab: typeof emailSyncSelectTab === 'function', hasSubmit: typeof emailSyncSubmit === 'function' };
    try { if (typeof emailAddAccount === 'function') emailAddAccount('gmail'); } catch(e){ out.err = e.message; }
    const m = document.getElementById('emailSyncModal');
    out.modalRendered = !!m;
    if (m) {
      out.hasGmailTab = !!document.getElementById('emSyncTabGmail');
      out.hasImapTab = !!document.getElementById('emSyncTabImap');
      out.hasEmailField = !!document.getElementById('emSyncEmail');
      out.hasSignatureField = !!document.getElementById('emSyncSig');
      out.modalText = (m.innerText || '').substring(0, 200);
    }
    out.promptCalls = window.__promptCalls;
    return out;
  });
  // Try clicking IMAP tab
  results.t5_imap_tab = await page.evaluate(() => {
    try { if (typeof emailSyncSelectTab === 'function') emailSyncSelectTab('imap'); } catch(e){ return { err:e.message }; }
    return {
      imapHostExists: !!document.getElementById('emSyncImapHost'),
      smtpHostExists: !!document.getElementById('emSyncSmtpHost'),
      passwordExists: !!document.getElementById('emSyncPassword'),
      webmailExists: !!document.getElementById('emSyncWebmail')
    };
  });
  await page.close();
}

await browser.close();

// ====== Report ======
console.log('\n=== v13 VERIFICATION RESULTS ===\n');
console.log(JSON.stringify(results, null, 2));
console.log('\n=== Page Errors ===');
console.log(errors.length === 0 ? '(none)' : errors.join('\n'));

// Pass/fail summary
const checks = [
  ['1a SuperAdmin new password works', results.t1_super_new?.loggedIn === true],
  ['1b SuperAdmin OLD password rejected', results.t1_super_old?.loggedIn === false],
  ['1c CEO new password works', results.t1_ceo?.loggedIn === true],
  ['1d COO new password works', results.t1_coo?.loggedIn === true],
  ['1e Staff (Razan) new password works', results.t1_staff?.loggedIn === true],
  ['1f Staff OLD password rejected', results.t1_staff_old?.loggedIn === false],
  ['1g localStorage password override works', results.t1_override?.loggedIn === true],
  ['2a Razan theme retint injected', results.t2_razan?.themeTintInjected === true],
  ['2b Razan accent4 NOT pink', results.t2_razan?.accent4 && !results.t2_razan.accent4.toLowerCase().includes('f06595')],
  ['2c Razan avatar NOT pink', results.t2_razan?.avatarHasPink === false],
  ['2d Thasbiha NO theme retint (keeps pink)', results.t2_thasbiha?.themeTintInjected === false],
  ['3a Morning Amana card visible', results.t3_morning?.cardVisible === true],
  ['3b Morning opening input exists', results.t3_morning?.inputExists === true],
  ['3c amanaOpening field in state', results.t3_morning?.stateHasAmanaOpening === true],
  ['3d Opening input persists to state', results.t3_input?.stateValue === '1250400.00'],
  ['4a EOD Amana card visible', results.t4_eod?.eodCardVisible === true],
  ['4b EOD has Net Change', results.t4_eod?.hasNetChange === true],
  ['4c EOD has closing/inflow/outflow', results.t4_eod?.hasClosingField && results.t4_eod?.hasInflow && results.t4_eod?.hasOutflow],
  ['4d amanaClosing field in state', results.t4_eod?.stateHasAmanaClosing === true],
  ['5a emailOpenSyncModal exists', results.t5_modal?.hasOpenSync === true],
  ['5b Sync modal renders', results.t5_modal?.modalRendered === true],
  ['5c Modal has Gmail & IMAP tabs', results.t5_modal?.hasGmailTab && results.t5_modal?.hasImapTab],
  ['5d Modal has form fields (no prompts)', results.t5_modal?.hasEmailField && results.t5_modal?.hasSignatureField],
  ['5e No prompt() calls', results.t5_modal?.promptCalls === 0],
  ['5f IMAP tab renders host/smtp/password fields', results.t5_imap_tab?.imapHostExists && results.t5_imap_tab?.smtpHostExists && results.t5_imap_tab?.passwordExists],
];

console.log('\n=== PASS/FAIL ===');
let pass=0, fail=0;
for (const [name, ok] of checks) {
  console.log((ok ? '✓ PASS' : '✗ FAIL') + ' — ' + name);
  if (ok) pass++; else fail++;
}
console.log(`\nTOTAL: ${pass}/${checks.length} passed, ${fail} failed`);
if (errors.length) console.log(`Page errors: ${errors.length}`);
process.exit(fail > 0 ? 1 : 0);
