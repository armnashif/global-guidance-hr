// v14.2 — Verify cross-tab message delivery via BroadcastChannel('gg_messages')
// Simulates the user's complaint: "if I send any message to any of the staff,
// they are not getting that message." We open two browser contexts (same
// browser, same machine) — one signed in as Umair, one as Razan — and confirm
// that a message sent from Umair's portal lands in Razan's portal in real time.
import { chromium } from 'playwright';

const BROWSER = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const URL = 'http://localhost:3000/';

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
// BroadcastChannel only works across pages in the SAME browser context (same origin).
// So we use a single context with two pages.
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const errs = [];

async function login(page, username, password){
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.fill('#loginUser', username);
  await page.fill('#loginPass', password);
  await page.click('#btnSignin');
  await page.waitForTimeout(1400);
  // Dismiss the morning check-in gate if it's open (so it doesn't cover comms)
  await page.evaluate(() => {
    const g = document.getElementById('msMorningGate'); if (g) g.remove();
  });
}

const umair = await ctx.newPage();
const razan = await ctx.newPage();
umair.on('pageerror', e => errs.push('umair pageerror: '+e.message));
razan.on('pageerror', e => errs.push('razan pageerror: '+e.message));
umair.on('console', m => { if (m.type()==='error') errs.push('umair console.error: '+m.text()); });
razan.on('console', m => { if (m.type()==='error') errs.push('razan console.error: '+m.text()); });

await login(umair, 'umair', 'Staff@Global2026');
await login(razan, 'razan.thawus', 'Staff@Global2026');

const r = {};

// 1. Both tabs have the gg_messages BroadcastChannel hook installed
r.relayInstalled = await umair.evaluate(() => ({
  hasTC: typeof window.TC === 'object',
  hasInjectMessage: window.TC && typeof window.TC.injectMessage === 'function',
  hasRelayMessage: window.TC && typeof window.TC.relayMessage === 'function',
  commsSendWrapped: typeof window.commsSend === 'function' && window.commsSend.__tcMsgWrapped === true,
}));

// 2. Razan navigates into Communications Hub & opens the #general channel.
await razan.evaluate(() => { if (typeof window.nav === 'function') window.nav('communications'); });
await razan.waitForTimeout(800);
r.razanOnComms = await razan.evaluate(() => ({
  messagesEl: !!document.getElementById('commsMessages'),
  channelKey: typeof window.commsChannelKey === 'function' ? window.commsChannelKey() : null,
}));

// 3. Umair navigates into Communications Hub & sends a message to the same #general channel.
await umair.evaluate(() => { if (typeof window.nav === 'function') window.nav('communications'); });
await umair.waitForTimeout(800);
const TOKEN = 'V142TOKEN-' + Date.now();
await umair.evaluate((tok) => {
  // Match Razan's channel — both default to ch:general
  const input = document.getElementById('commsInput');
  if (input){ input.value = 'Hello from Umair! ' + tok; input.focus(); }
  if (typeof window.commsSend === 'function') window.commsSend();
}, TOKEN);

// Give the BroadcastChannel a moment to deliver
await razan.waitForTimeout(800);

// 4. Razan should now see the message in his commsMessages list
r.razanSawMessage = await razan.evaluate((tok) => {
  // COMMS_STATE is module-scoped — lazy-eval like team-comms.js does
  let msgs = [];
  try {
    const st = new Function('try{return typeof COMMS_STATE!=="undefined"?COMMS_STATE:null}catch(e){return null}')();
    msgs = (st && st.messages) || [];
  } catch(e){}
  const matched = msgs.filter(m => m.text && m.text.indexOf(tok) >= 0);
  const dom = document.getElementById('commsMessages');
  return {
    inState: matched.length > 0,
    fromName: matched[0] && matched[0].fromName,
    inDom: dom && dom.innerText.indexOf(tok) >= 0,
  };
}, TOKEN);

// 5. Direct injection test (proves the receive path on its own)
const TOKEN2 = 'V142DIRECT-' + Date.now();
await razan.evaluate((tok) => {
  // Simulate a relayed message arriving from another tab
  if (window.TC && typeof window.TC.injectMessage === 'function'){
    window.TC.injectMessage({
      kind: 'message',
      id: 'direct-' + Date.now(),
      from: 'someone-else',
      fromName: 'Some Other User',
      avatar: '#6366f1,#a855f7',
      channel: 'ch:general',
      text: 'Direct injection test ' + tok,
      timestamp: Date.now(),
      serverTimestamp: Date.now(),
      _relayed: true,
    });
  }
}, TOKEN2);
await razan.waitForTimeout(300);
r.directInject = await razan.evaluate((tok) => {
  let msgs = [];
  try {
    const st = new Function('try{return typeof COMMS_STATE!=="undefined"?COMMS_STATE:null}catch(e){return null}')();
    msgs = (st && st.messages) || [];
  } catch(e){}
  return { found: msgs.some(m => m.text && m.text.indexOf(tok) >= 0) };
}, TOKEN2);

console.log('=== RESULTS ===');
console.log(JSON.stringify(r, null, 2));
console.log('\n=== ERRORS ===');
console.log(errs.length ? errs.join('\n') : '(none)');

const passes = [
  ['1  gg_messages relay installed (TC.injectMessage + commsSend wrapped)',
   r.relayInstalled.hasTC && r.relayInstalled.hasInjectMessage && r.relayInstalled.hasRelayMessage && r.relayInstalled.commsSendWrapped],
  ['2  Razan reached Comms Hub on ch:general',
   r.razanOnComms.messagesEl && r.razanOnComms.channelKey === 'ch:general'],
  ['3  Umair\'s message arrived in Razan\'s COMMS_STATE',
   r.razanSawMessage.inState === true],
  ['4  Umair\'s message rendered in Razan\'s DOM',
   r.razanSawMessage.inDom === true],
  ['5  Direct TC.injectMessage path works',
   r.directInject.found === true],
];

console.log('\n=== PASS/FAIL ===');
let pass = 0, fail = 0;
passes.forEach(([n,ok]) => { console.log((ok?'✓ PASS':'✗ FAIL')+' — '+n); ok ? pass++ : fail++; });
console.log('\nTOTAL: '+pass+'/'+(pass+fail)+' passed ('+fail+' failed). Page errors: '+errs.length);

await browser.close();
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
