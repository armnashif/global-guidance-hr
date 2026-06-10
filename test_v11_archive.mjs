import { chromium } from 'playwright';
const CHROME = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
const errs = [];
page.on('pageerror', e => errs.push('[pageerror] '+e.message));
page.on('console', m => { if (m.type()==='error') errs.push('[err] '+m.text().slice(0,200)); });

await page.goto('https://fc86cd63.webapp-2il.pages.dev/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#loginUser');
await page.fill('#loginUser', 'nashif.razzak');
await page.fill('#loginPass', 'password123');
await page.evaluate(() => doLogin());
await page.waitForTimeout(2000);

console.log('=== Navigate to Communications Hub ===');
await page.evaluate(() => nav('communications'));
await page.waitForTimeout(2500);

// Simulate: an archive was loaded into cache (as if waLoadArchive ran)
console.log('\n=== Seed archive cache for #general (simulating waLoadArchive after import) ===');
const seed = await page.evaluate(() => {
  COMMS_STATE.archiveHtml = COMMS_STATE.archiveHtml || {};
  COMMS_STATE.archiveItems = COMMS_STATE.archiveItems || {};
  COMMS_STATE.archiveHtml['general'] = '<div id="ARCHIVE_MARKER" style="padding:10px;background:#25d366;color:#fff">FAKE IMPORTED ARCHIVE — 247 messages</div>';
  COMMS_STATE.archiveItems['general'] = [
    {sender:'Nashif', ts:'2024-01-01 10:00', text:'Hello team', isMedia:false},
    {sender:'Razan', ts:'2024-01-01 10:01', text:'Morning!', isMedia:false},
  ];
  COMMS_STATE.activeChannel = 'general';
  COMMS_STATE.activeType = 'channel';
  COMMS_STATE.messages = [];
  // Now run renderCommsMessages — this is what polling does every ~3s
  if (typeof renderCommsMessages === 'function') renderCommsMessages();
  return {
    archiveStored: !!COMMS_STATE.archiveHtml['general'],
    markerVisible: !!document.querySelector('#ARCHIVE_MARKER'),
  };
});
console.log('   After seed + first render:', JSON.stringify(seed));

// === Now simulate 10 polling cycles back-to-back (the bug scenario) ===
console.log('\n=== Simulate 10 polling cycles (was: archive disappeared) ===');
const surviveCheck = await page.evaluate(() => {
  const results = [];
  for (let i = 0; i < 10; i++) {
    if (typeof renderCommsMessages === 'function') renderCommsMessages();
    results.push({ cycle: i+1, marker: !!document.querySelector('#ARCHIVE_MARKER') });
  }
  return results;
});
surviveCheck.forEach(r => console.log('   Cycle ' + r.cycle + ': ARCHIVE_MARKER present =', r.marker));

// === Simulate switching channels and coming back ===
console.log('\n=== Switch to #urgent-cases then back to #general ===');
const swapTest = await page.evaluate(async () => {
  // Switch away to a different channel
  COMMS_STATE.activeChannel = 'urgent-cases';
  COMMS_STATE.activeType = 'channel';
  COMMS_STATE.messages = [];
  renderCommsMessages();
  const awayHasMarker = !!document.querySelector('#ARCHIVE_MARKER');
  // Switch back
  COMMS_STATE.activeChannel = 'general';
  COMMS_STATE.messages = [];
  renderCommsMessages();
  const backHasMarker = !!document.querySelector('#ARCHIVE_MARKER');
  // Run 5 more polling cycles
  for (let i = 0; i < 5; i++) renderCommsMessages();
  const after5MoreCycles = !!document.querySelector('#ARCHIVE_MARKER');
  return { awayHasMarker, backHasMarker, after5MoreCycles };
});
console.log('   ' + JSON.stringify(swapTest));

// === Now simulate live messages arriving alongside the archive ===
console.log('\n=== Add live messages to channel — archive must still be visible ===');
const withLive = await page.evaluate(() => {
  COMMS_STATE.messages = [
    { id:'m1', from:'test', fromName:'Test User', text:'New live message', timestamp:Date.now(), readBy:[] },
    { id:'m2', from:'test2', fromName:'User 2', text:'Another', timestamp:Date.now()+1000, readBy:[] }
  ];
  renderCommsMessages();
  return {
    markerPresent: !!document.querySelector('#ARCHIVE_MARKER'),
    liveCount: document.querySelectorAll('.comms-msg').length,
  };
});
console.log('   ' + JSON.stringify(withLive));

console.log('\n=== Errors ===');
errs.slice(0,10).forEach(e => console.log('  ', e));
await browser.close();
