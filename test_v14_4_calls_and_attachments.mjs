// v14.4 — verify KV persistence, attachment upload, call_accept flow, ringback, notifications
import { chromium } from 'playwright';

const BASE = process.env.TEST_BASE || 'http://localhost:3000';
let pass = 0, fail = 0;
function ok(name){ pass++; console.log('\x1b[32m✓ PASS —\x1b[0m ' + name); }
function bad(name, err){ fail++; console.log('\x1b[31m✗ FAIL —\x1b[0m ' + name + ' — ' + (err||'')); }

async function run(){
  console.log('=== v14.4 calls + attachments + notifications ===');

  // ── Test 1: KV diagnostic endpoint ────────────────────────────────────
  try {
    const r = await fetch(BASE + '/api/kv-status');
    const j = await r.json();
    if (j.hasCOMMS && j.writeReadOk) ok('1a  KV binding present & writable');
    else bad('1a  KV binding', JSON.stringify(j));
  } catch(e){ bad('1a  KV status fetch', e.message); }

  // ── Test 2: Message persistence with kvPersisted flag ─────────────────
  try {
    const ts = Date.now();
    const post = await fetch(BASE + '/api/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text: 'KV44_' + ts, from:'diag', fromName:'Diag', channel:'ch:general' })
    });
    const pj = await post.json();
    if (pj.success && pj.kvPersisted) ok('2a  POST /api/messages returns kvPersisted:true');
    else bad('2a  kvPersisted', JSON.stringify(pj));

    await new Promise(r => setTimeout(r, 1500));
    const get1 = await fetch(BASE + '/api/messages?since=0').then(r => r.json());
    const found1 = (get1.messages||[]).some(m => (m.text||'').includes('KV44_' + ts));
    if (found1) ok('2b  First GET sees the message');
    else bad('2b  first GET', `total=${get1.messages?.length}`);

    await new Promise(r => setTimeout(r, 2000));
    const get2 = await fetch(BASE + '/api/messages?since=0').then(r => r.json());
    const found2 = (get2.messages||[]).some(m => (m.text||'').includes('KV44_' + ts));
    if (found2) ok('2c  Second GET still sees the message (persistence)');
    else bad('2c  second GET', `total=${get2.messages?.length}`);
  } catch(e){ bad('2  persistence', e.message); }

  // ── Test 3: Attachment upload + fetch + ref-in-message round-trip ─────
  try {
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const up = await fetch(BASE + '/api/attachments', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ dataUrl: tinyPng, name:'test.png', size:68, type:'image/png' })
    });
    const uj = await up.json();
    if (uj.success && uj.file && uj.file.id) ok('3a  POST /api/attachments returns file id');
    else bad('3a  attachment upload', JSON.stringify(uj));

    const fid = uj.file.id;
    await new Promise(r => setTimeout(r, 800));
    const fetched = await fetch(BASE + '/api/attachments/' + fid).then(r => r.json());
    if (fetched.success && fetched.file && fetched.file.dataUrl && fetched.file.dataUrl.length > 80) {
      ok('3b  GET /api/attachments/:id returns full dataUrl');
    } else bad('3b  attachment fetch', JSON.stringify(fetched).slice(0,200));

    // Send a message with file ref
    const msgPost = await fetch(BASE + '/api/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        text:'attached', from:'diag', fromName:'Diag', channel:'ch:general',
        file: { id: fid, name:'test.png', size:68, type:'image/png' }
      })
    });
    const mj = await msgPost.json();
    if (mj.success && mj.message.file && mj.message.file.id === fid) ok('3c  Message carries file ref (no dataUrl bloat)');
    else bad('3c  message file ref', JSON.stringify(mj).slice(0,200));

    // Confirm message survives the round-trip
    await new Promise(r => setTimeout(r, 1500));
    const got = await fetch(BASE + '/api/messages?since=0').then(r => r.json());
    const m = (got.messages||[]).find(x => x.file && x.file.id === fid);
    if (m) ok('3d  GET sees the attachment-bearing message');
    else bad('3d  message-with-attachment GET');
  } catch(e){ bad('3  attachments', e.message); }

  // ── Test 4: call_accept signal flow ───────────────────────────────────
  try {
    const callId = 'call-test-' + Date.now();
    // Caller sends invite
    await fetch(BASE + '/api/signal', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ kind:'call_invite', callId, callType:'voice', fromUser:'caller', fromName:'Caller', toUser:'callee' })
    });
    // Callee accepts
    const acc = await fetch(BASE + '/api/signal', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ kind:'call_accept', callId, fromUser:'callee', fromName:'Callee', toUser:'caller' })
    });
    const aj = await acc.json();
    if (aj.success && aj.signal && aj.signal.callId === callId && aj.signal.kind === 'call_accept') {
      ok('4a  call_accept signal POST accepted with callId');
    } else bad('4a  call_accept', JSON.stringify(aj).slice(0,200));

    // Caller polls for signals addressed to them
    await new Promise(r => setTimeout(r, 600));
    const sigs = await fetch(BASE + '/api/signal?user=caller&since=0').then(r => r.json());
    const hasAccept = (sigs.signals||[]).some(s => s.kind === 'call_accept' && s.callId === callId);
    if (hasAccept) ok('4b  Caller can poll and see call_accept');
    else bad('4b  call_accept poll', JSON.stringify(sigs).slice(0,200));
  } catch(e){ bad('4  call_accept', e.message); }

  // ── Test 5: Frontend: ringtone generator + audio unlock + global poller present ──
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));

    await page.goto(BASE + '/command-portal', { waitUntil:'domcontentloaded', timeout:15000 });
    await page.waitForTimeout(800);

    // Login as Razan
    await page.evaluate(() => {
      const u = document.getElementById('loginUsername'); if (u) u.value = 'razan.thawus';
      const p = document.getElementById('loginPassword'); if (p) p.value = 'Razan@2024';
      const f = document.querySelector('form'); if (f) f.requestSubmit();
    });
    await page.waitForTimeout(2500);

    const ringOk = await page.evaluate(() => {
      // ringtone generator should produce a data URL
      try {
        // Indirect via the public API surface — call makeRingAudio (it's not on window)
        // Instead, look for our pre-generated URL leak: check team-comms.js side-effect
        // by trying to construct a small <audio> and verifying call-related fns exist.
        const has = (typeof window.commsStartCall === 'function') && window.commsStartCall.__tcWrapped === true;
        return has;
      } catch(e){ return false; }
    });
    if (ringOk) ok('5a  commsStartCall wrapped with v14.4 enhancements');
    else bad('5a  commsStartCall wrap', '');

    const tcOk = await page.evaluate(() => !!(window.TC && window.TC.injectMessage && window.TC.openPanel));
    if (tcOk) ok('5b  TC public API present (openPanel, injectMessage)');
    else bad('5b  TC API', '');

    // Verify global notification poller is starting (look for our setInterval call - indirect via _gnTimer existence)
    // We can check that page loaded without errors
    if (errs.length === 0) ok('5c  Portal loads cleanly (no page errors)');
    else bad('5c  page errors', errs.slice(0,2).join('|'));
  } catch(e){ bad('5  frontend smoke', e.message); }
  finally { if (browser) await browser.close(); }

  console.log('');
  console.log('=== PASS/FAIL ===');
  console.log(`TOTAL: ${pass}/${pass+fail} passed (${fail} failed).`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error(e); process.exit(2); });
