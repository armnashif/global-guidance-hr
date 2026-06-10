import { chromium } from 'playwright';
const URL = 'https://3000-i1or73f6i7zoopcazy4yn-c81df28e.sandbox.novita.ai/';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errors = [];
const requests = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type()==='error') errors.push('[err] '+m.text()); });
page.on('request', r => {
  const u = r.url();
  if (u.includes('/api/v16g/daily-reports') || u.includes('/api/attendance/sync') || u.includes('/api/staff-portal')) {
    requests.push(r.method() + ' ' + u);
  }
});

await page.goto(URL, { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForFunction(()=>typeof window.doLogin==='function', { timeout:60000 });
await page.evaluate(()=>{
  document.getElementById('loginUser').value = 'thasbiha.s';
  document.getElementById('loginPass').value = 'Staff@Global2026';
  window.doLogin();
});
await page.waitForTimeout(3500);

// Verify wrapper installed
const wrapInfo = await page.evaluate(()=>{
  const fn = window.attSubmitEOD || (typeof attSubmitEOD !== 'undefined' ? attSubmitEOD : null);
  return {
    hasOrigEOD: typeof _origAttSubmitEOD !== 'undefined',
    hasEOD: typeof attSubmitEOD !== 'undefined',
    eodSrc: fn ? fn.toString().substring(0, 250) : 'no fn',
    hasSync: typeof syncAttendanceToBackend !== 'undefined',
    userId: typeof currentUser !== 'undefined' ? currentUser.empId : 'no user'
  };
});
console.log('WRAPPER:', JSON.stringify(wrapInfo, null, 2));

// Simulate full check-in then EOD submit
const result = await page.evaluate(async ()=>{
  try {
    // 1. Set up check-in state
    attendanceState.checkinDone = true;
    attendanceState.checkinTime = '09:00';
    attendanceState.checkinSubmittedAt = '09:00';
    attendanceState.mode = 'Office';
    attendanceState.focus = 'Test submission';
    attendanceState.mood = 4;
    attendanceState.tasks = [{text:'Task 1',p:'P1',done:true},{text:'Task 2',p:'P2',done:false}];
    // 2. Set up EOD state
    attendanceState.eodDone = false;
    attendanceState.eod = attendanceState.eod || {};
    attendanceState.eod.completion = 50;
    attendanceState.eod.done = 'Completed task 1';
    attendanceState.eod.notDone = 'Task 2 still pending';
    attendanceState.eod.selfDecl = 'I confirm';
    attendanceState.eod.tomorrow = 'Test plan tomorrow';
    attendanceState.eod.leads = 2;
    attendanceState.eod.reg = 1;
    attendanceState.eod.offers = 0;
    // 3. Call submit
    attSubmitEOD();
    return { ok:true, eodDone: attendanceState.eodDone, eodAt: attendanceState.eodSubmittedAt };
  } catch(e) {
    return { ok:false, err: e.message };
  }
});
console.log('SUBMIT:', JSON.stringify(result));
await page.waitForTimeout(2000);
console.log('REQUESTS:', requests);
console.log('ERRORS:', errors.length === 0 ? 'NONE' : errors.join(' | '));

// 4. Now verify CEO can see it
const userId = wrapInfo.userId;
const ceoView = await page.evaluate(async (uid)=>{
  const r = await fetch('/api/v16g/daily-reports/today', { cache:'no-store' });
  const j = await r.json();
  const items = j.items || [];
  const mine = items.filter(x => x.userId === uid);
  return { total: items.length, mine: mine.length, sample: mine[0] };
}, userId);
console.log('CEO_VIEW:', JSON.stringify(ceoView, null, 2));

await browser.close();
