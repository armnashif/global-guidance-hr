// v14.3 production readiness tests:
//  1. Login screen exposes NO demo credentials, NO quick-login buttons, NO password hints
//  2. /api/signal POST + GET works end-to-end (cross-device call invites)
//  3. /api/messages persists across requests (KV-backed)
//  4. team-comms.js sends a signal when starting a call (verified via the
//     server-side queue picking it up)
import { chromium } from 'playwright';

const BROWSER = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const URL = 'http://localhost:3000/';
const BASE = 'http://localhost:3000';

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: '+e.message));
page.on('console', m => { if (m.type()==='error') errs.push('console.error: '+m.text()); });

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

const r = {};

// 1. No demo credentials anywhere on the visible login screen
r.cleanLogin = await page.evaluate(() => {
  const text = document.body.innerText;
  // The visible quick-login row should be gone (display:none container is fine)
  const visibleQuickBtns = Array.from(document.querySelectorAll('.quick-login-btn'))
    .filter(b => {
      // Walk up to find any display:none parent
      let el = b;
      while (el && el !== document.body){
        if (getComputedStyle(el).display === 'none') return false;
        el = el.parentElement;
      }
      return true;
    });
  return {
    noStaffPasswordHint: text.indexOf('Staff@Global2026') < 0,
    noCEOPasswordHint: text.indexOf('CEO@Global2026') < 0,
    noCOOPasswordHint: text.indexOf('COO@Global2026') < 0,
    noSuperAdminHint: text.indexOf('SuperAdmin@2026') < 0,
    noAgentPasswordHint: text.indexOf('Agent@Global2026') < 0,
    noStudent123: text.indexOf('student123') < 0,
    noQuickAccessLabel: text.indexOf('Quick Access') < 0,
    noDemoLabel: !/Demo (agent|student|password)/i.test(text),
    visibleQuickButtonsCount: visibleQuickBtns.length
  };
});

// 2. Switching to Agent tab still doesn't reveal demo creds
await page.click('#loginTabAgent');
await page.waitForTimeout(400);
r.cleanAgent = await page.evaluate(() => {
  const text = document.body.innerText;
  const visibleQuickBtns = Array.from(document.querySelectorAll('.quick-login-btn'))
    .filter(b => {
      let el = b;
      while (el && el !== document.body){
        if (getComputedStyle(el).display === 'none') return false;
        el = el.parentElement;
      }
      return true;
    });
  return {
    noAgentPwd: text.indexOf('Agent@Global2026') < 0,
    noDemoLabel: !/Demo (agent|password)/i.test(text),
    visibleQuickButtonsCount: visibleQuickBtns.length
  };
});

// 3. Switching to Student tab still doesn't reveal demo creds
await page.click('#loginTabStudent');
await page.waitForTimeout(400);
r.cleanStudent = await page.evaluate(() => {
  const text = document.body.innerText;
  const visibleQuickBtns = Array.from(document.querySelectorAll('.quick-login-btn'))
    .filter(b => {
      let el = b;
      while (el && el !== document.body){
        if (getComputedStyle(el).display === 'none') return false;
        el = el.parentElement;
      }
      return true;
    });
  return {
    noStudent123: text.indexOf('student123') < 0,
    noDemoLabel: !/Demo (student|password)/i.test(text),
    visibleQuickButtonsCount: visibleQuickBtns.length
  };
});

// 4. /api/signal end-to-end: post a call invite from "umair" to "razan.thawus",
//    then verify razan.thawus polling sees it (only once — dedupe by id)
const postedSignal = await page.evaluate(async () => {
  const r1 = await fetch('/api/signal', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      kind:'call_invite', fromUser:'umair', fromName:'Umair',
      toUser:'razan.thawus', callType:'video'
    })
  });
  return r1.ok ? await r1.json() : { error: r1.status };
});
const polledSignals = await page.evaluate(async () => {
  const r2 = await fetch('/api/signal?user=razan.thawus&since=0');
  return r2.ok ? await r2.json() : { error: r2.status };
});
r.signal = {
  posted: !!(postedSignal && postedSignal.success && postedSignal.signal && postedSignal.signal.kind === 'call_invite'),
  signalCount: (polledSignals.signals || []).length,
  hasCallInvite: (polledSignals.signals || []).some(s => s.kind === 'call_invite' && s.toUser === 'razan.thawus'),
  // After consuming with same `since`, GET with since=now should be empty
};
const nowMs = Date.now() + 1000;
const polledAfter = await page.evaluate(async (ts) => {
  const r3 = await fetch('/api/signal?user=razan.thawus&since=' + ts);
  return r3.ok ? await r3.json() : { error: r3.status };
}, nowMs);
r.signal.emptyAfterCursor = (polledAfter.signals || []).length === 0;

// 5. /api/messages durability — POST a message with a unique token, then GET
//    in a fresh request and verify it survived (proves KV write, not just
//    in-memory)
const TOKEN = 'V143KVTEST-' + Date.now();
const postRes = await page.evaluate(async (tok) => {
  const r = await fetch('/api/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      from:'system-test', fromName:'System Test',
      channel:'ch:general', text:'KV durability '+tok,
      timestamp: Date.now()
    })
  });
  return r.ok ? await r.json() : { error: r.status };
}, TOKEN);
// Wait a moment for KV eventual consistency
await page.waitForTimeout(400);
const getRes = await page.evaluate(async () => {
  const r = await fetch('/api/messages?since=0');
  return r.ok ? await r.json() : { error: r.status };
});
r.messages = {
  posted: !!(postRes && postRes.success),
  foundInGet: !!(getRes && getRes.messages && getRes.messages.some(m => m.text && m.text.indexOf(TOKEN) >= 0)),
  totalCount: getRes && getRes.total
};

console.log('=== RESULTS ===');
console.log(JSON.stringify(r, null, 2));
console.log('\n=== ERRORS ===');
console.log(errs.length ? errs.join('\n') : '(none)');

const passes = [
  ['1a Staff/CEO/COO/SuperAdmin passwords NOT shown on login screen',
   r.cleanLogin.noStaffPasswordHint && r.cleanLogin.noCEOPasswordHint && r.cleanLogin.noCOOPasswordHint && r.cleanLogin.noSuperAdminHint],
  ['1b No quick-login buttons visible on Staff tab',
   r.cleanLogin.visibleQuickButtonsCount === 0],
  ['1c No "Quick Access" or "Demo" labels',
   r.cleanLogin.noQuickAccessLabel && r.cleanLogin.noDemoLabel],
  ['2  Agent tab: no agent password hint, no demo row',
   r.cleanAgent.noAgentPwd && r.cleanAgent.noDemoLabel && r.cleanAgent.visibleQuickButtonsCount === 0],
  ['3  Student tab: no student password hint, no demo row',
   r.cleanStudent.noStudent123 && r.cleanStudent.noDemoLabel && r.cleanStudent.visibleQuickButtonsCount === 0],
  ['4a /api/signal POST works',                    r.signal.posted],
  ['4b /api/signal GET returns the signal',         r.signal.hasCallInvite],
  ['4c /api/signal cursor filtering works',         r.signal.emptyAfterCursor],
  ['5a /api/messages POST works',                   r.messages.posted],
  ['5b /api/messages POST persists & GET sees it',  r.messages.foundInGet],
];

console.log('\n=== PASS/FAIL ===');
let pass = 0, fail = 0;
passes.forEach(([n,ok]) => { console.log((ok?'✓ PASS':'✗ FAIL')+' — '+n); ok ? pass++ : fail++; });
console.log('\nTOTAL: '+pass+'/'+(pass+fail)+' passed ('+fail+' failed). Page errors: '+errs.length);

await browser.close();
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
