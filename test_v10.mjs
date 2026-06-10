import { chromium } from 'playwright';
const CHROME = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
const errors = [];
page.on('pageerror', err => errors.push('[pageerror] '+err.message));
page.on('console', m => { if (m.type()==='error') errors.push('[err] '+m.text().slice(0,200)); });

console.log('=== Loading new build...');
await page.goto('https://04b4f8ed.webapp-2il.pages.dev/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#loginUser', { timeout: 30000 });
await page.fill('#loginUser', 'nashif.razzak');
await page.fill('#loginPass', 'password123');
await page.evaluate(() => doLogin());
await page.waitForTimeout(2500);

console.log('\n=== TEST 1: Email Hub ===');
await page.evaluate(() => nav('emailhub'));
await page.waitForTimeout(1500);
const emailHub = await page.evaluate(() => ({
  activePage: (document.querySelector('.page.active')||{}).id,
  hasWsHero: !!document.querySelector('.ws-hero'),
  hasWsShell: !!document.querySelector('.ws-shell'),
  hasComposeBtn: Array.from(document.querySelectorAll('button')).some(b=>/Compose/i.test(b.textContent)),
  foldersFound: Array.from(document.querySelectorAll('*')).filter(b=>/^(Inbox|Starred|Drafts|Sent|Trash|Important)/i.test((b.textContent||'').trim())).length,
  pageTitle: (document.getElementById('topbarTitle')||{}).textContent,
  mainSize: (document.getElementById('mainContent')||{}).innerHTML.length || 0,
}));
console.log('   '+JSON.stringify(emailHub));

console.log('\n=== TEST 2: WhatsApp Web ===');
await page.evaluate(() => nav('whatsappweb'));
await page.waitForTimeout(1500);
const waWeb = await page.evaluate(() => ({
  activePage: (document.querySelector('.page.active')||{}).id,
  pageTitle: (document.getElementById('topbarTitle')||{}).textContent,
  mainSize: (document.getElementById('mainContent')||{}).innerHTML.length || 0,
}));
console.log('   '+JSON.stringify(waWeb));

console.log('\n=== TEST 3: Attendance (Morning form now default) ===');
await page.evaluate(() => nav('attendance'));
await page.waitForTimeout(1500);
const att = await page.evaluate(() => ({
  activePage: (document.querySelector('.page.active')||{}).id,
  hasAttTime: !!document.getElementById('att-time'),
  hasAutoNow: !!document.getElementById('att-auto-now'),
  hasFileInput: !!document.getElementById('att-import-file'),
  importBtns: Array.from(document.querySelectorAll('button')).filter(b=>/Upload Excel|Google Sheets|Paste names|Use current time/i.test(b.textContent||'')).map(b=>b.textContent.trim()),
  attShowAdvanced: (typeof attShowAdvanced !== 'undefined') ? attShowAdvanced : 'undef',
  mainSize: (document.getElementById('mainContent')||{}).innerHTML.length || 0,
}));
console.log('   '+JSON.stringify(att, null, 2));

console.log('\n=== TEST 4: WhatsApp archive cache survival ===');
await page.evaluate(() => nav('communications'));
await page.waitForTimeout(2500);
const archiveResults = await page.evaluate(() => {
  const r = {};
  // Inject fake archive
  if (typeof COMMS_STATE === 'undefined') return { error: 'COMMS_STATE missing' };
  COMMS_STATE.archiveHtml = COMMS_STATE.archiveHtml || {};
  COMMS_STATE.archiveHtml['general'] = '<div id="fake-archive-banner">CACHED ARCHIVE</div>';
  COMMS_STATE.activeChannel = 'general';
  COMMS_STATE.activeType = 'channel';
  if (typeof _waInjectArchive === 'function') _waInjectArchive('general');
  r.afterInject = !!document.querySelector('#fake-archive-banner');
  // Now render messages and check archive survival
  COMMS_STATE.messages = [{id:'m1', from:'t', fromName:'T', text:'hi', timestamp:Date.now(), readBy:[]}];
  if (typeof renderCommsMessages === 'function') renderCommsMessages();
  r.afterRender = !!document.querySelector('#fake-archive-banner');
  return r;
});
console.log('   '+JSON.stringify(archiveResults));

console.log('\n=== TEST 5: Dashboard widgets ===');
await page.evaluate(() => nav('dashboard'));
await page.waitForTimeout(1000);
const dash = await page.evaluate(() => ({
  widgetCount: document.querySelectorAll('[data-widget]').length,
  hasDashApply: typeof dashApplyLayout === 'function',
  hasDashOpen: typeof dashWidgetOpen === 'function',
}));
console.log('   '+JSON.stringify(dash));

console.log('\n=== ERRORS ===');
errors.slice(0,10).forEach(e => console.log('  ', e));
await browser.close();
