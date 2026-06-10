// Verify the media-suite module loads cleanly and exposes its API,
// and that the morning check-in gate appears on staff login.
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

// 1. media-suite module loaded and exposed API
r.api = await page.evaluate(() => ({
  hasMS: typeof window.MS === 'object',
  hasMediaLibraryOpen: typeof window.mediaLibraryOpen === 'function',
  hasStartCall: typeof window.startCall === 'function',
  hasStartVoiceCall: typeof window.startVoiceCall === 'function',
  hasStartVideoCall: typeof window.startVideoCall === 'function',
  hasStartGroupCall: typeof window.startGroupCall === 'function',
  hasToast: typeof window.toast === 'function',
  hasMediaSave: typeof window.mediaSave === 'function',
  hasMorningGate: window.MS && typeof window.MS.morningCheckinShow === 'function',
  hasShareView: window.MS && typeof window.MS.shareView === 'function',
}));

// 2. Toast renders
r.toast = await page.evaluate(() => {
  window.toast({ type:'success', title:'Test', body:'hello', duration: 0 });
  const host = document.getElementById('msToastHost');
  return { hostExists: !!host, hasChild: host && host.children.length > 0 };
});

// 3. IndexedDB save + list round-trip
r.idb = await page.evaluate(async () => {
  const blob = new Blob([new Uint8Array([0,1,2,3,4,5,6,7,8,9])], { type:'image/png' });
  const id = await window.mediaSave(blob, { title:'Test shot', kind:'screenshot' });
  const list = await window.mediaList();
  return { saved: !!id, listSize: list.length, firstKind: list[0] && list[0].kind, firstTitle: list[0] && list[0].title };
});

// 4. Media Library modal opens and shows the saved item
r.libraryOpen = await page.evaluate(async () => {
  await window.MS.mediaLibraryOpen();
  await new Promise(r => setTimeout(r, 400));
  const m = document.getElementById('msMediaLibrary');
  const body = document.getElementById('msMlBody');
  return {
    modalOpen: !!m,
    hasFilter: !!document.getElementById('msMlFilter'),
    bodyHasItem: body && /Test shot/.test(body.innerText),
    closeBtn: !!m && /Close/.test(m.innerText)
  };
});
await page.evaluate(() => { const m=document.getElementById('msMediaLibrary'); if(m) m.remove(); });

// 5. Log in as a staff user → morning check-in gate appears
await page.evaluate(() => { try { localStorage.removeItem('gg_checkin_umair_'+new Date().toISOString().slice(0,10)); } catch(e){} });
await page.fill('#loginUser', 'umair');
await page.fill('#loginPass', 'Staff@Global2026');
await page.click('#btnSignin');
await page.waitForTimeout(1600);
r.morningGate = await page.evaluate(() => {
  const g = document.getElementById('msMorningGate');
  // Simplified v14.2 gate: single "Check in now" CTA that navigates to attendance page.
  // No mode picker, no focus input, no Amana balance field, no confirm checkbox.
  return {
    gateOpen: !!g,
    hasGoToAttendance: !!document.getElementById('msGateGoToAttendance'),
    noAmana: !document.getElementById('msGateAmana'),
    noMode: !(g && g.querySelectorAll('.ms-mode').length),
    noFocus: !document.getElementById('msGateFocus'),
    noConfirm: !document.getElementById('msGateConfirm')
  };
});

// 6. Click "Check in now" — should close the modal AND navigate to attendance page
let navTarget = null;
if (r.morningGate.gateOpen){
  navTarget = await page.evaluate(() => {
    let captured = null;
    const origNav = window.nav;
    window.nav = function(p){ captured = p; if (typeof origNav === 'function') try { origNav(p); } catch(e){} };
    document.getElementById('msGateGoToAttendance').click();
    return captured;
  });
  await page.waitForTimeout(400);
}
r.gateClosed = await page.evaluate(() => ({ gateGone: !document.getElementById('msMorningGate') }));
r.gateNavigated = { navTarget: navTarget };

// 7. Try starting a voice call → expect recipient picker modal
// Fire-and-forget (do NOT await — the call promise only resolves on accept/cancel)
await page.evaluate(() => { window.startVoiceCall(); });
await page.waitForTimeout(600);
r.callPicker = await page.evaluate(() => {
  const buttons = document.querySelectorAll('.ms-rcp');
  const startBtn = document.getElementById('msCallStart');
  return { pickerButtonsCount: buttons.length, startBtnExists: !!startBtn };
});
// Cancel it (cannot accept getUserMedia in headless)
await page.evaluate(() => { const c = document.getElementById('msCallCancel'); if (c) c.click(); });
await page.waitForTimeout(200);

console.log('=== RESULTS ===');
console.log(JSON.stringify(r, null, 2));
console.log('\n=== ERRORS ===');
console.log(errs.length ? errs.join('\n') : '(none)');

const passes = [
  ['1a media-suite exposes MS+APIs',        r.api.hasMS && r.api.hasMediaLibraryOpen && r.api.hasStartCall && r.api.hasToast && r.api.hasMorningGate],
  ['1b voice/video/group fns exposed',       r.api.hasStartVoiceCall && r.api.hasStartVideoCall && r.api.hasStartGroupCall],
  ['2  toast renders',                       r.toast.hostExists && r.toast.hasChild],
  ['3  IndexedDB save + list',               r.idb.saved && r.idb.listSize >= 1 && r.idb.firstKind === 'screenshot'],
  ['4  Media Library modal opens',           r.libraryOpen.modalOpen && r.libraryOpen.hasFilter && r.libraryOpen.bodyHasItem],
  ['5  Morning check-in gate auto-appears (simplified)', r.morningGate.gateOpen && r.morningGate.hasGoToAttendance && r.morningGate.noAmana && r.morningGate.noMode && r.morningGate.noFocus && r.morningGate.noConfirm],
  ['6  Gate closes & navigates to attendance', r.gateClosed.gateGone && r.gateNavigated.navTarget === 'attendance'],
  ['7  Call recipient picker shows',         r.callPicker.startBtnExists],
];

console.log('\n=== PASS/FAIL ===');
let pass = 0, fail = 0;
passes.forEach(([n,ok]) => { console.log((ok?'✓ PASS':'✗ FAIL')+' — '+n); ok ? pass++ : fail++; });
console.log('\nTOTAL: '+pass+'/'+(pass+fail)+' passed ('+fail+' failed). Page errors: '+errs.length);

await browser.close();
process.exit(fail > 0 || errs.length > 0 ? 1 : 0);
