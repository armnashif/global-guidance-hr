import { chromium } from 'playwright';

const URL = 'https://fbb10a17.webapp-2il.pages.dev/';
const browser = await chromium.launch({ headless: true, executablePath: '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

const errors = [];
const logs = [];
page.on('console', msg => {
  const t = msg.type();
  const txt = msg.text();
  if (t === 'error' || t === 'warning') errors.push(`[${t}] ${txt}`);
  else if (txt.length < 300) logs.push(`[${t}] ${txt}`);
});
page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

console.log('=== 1. Loading site...');
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

console.log('=== 2. Logging in as CEO (nashif.razzak / password123)...');
await page.fill('#loginUser', 'nashif.razzak');
await page.fill('#loginPass', 'password123');
await page.click('#btnSignin');
await page.waitForTimeout(2000);

const loggedIn = await page.evaluate(() => typeof currentUser !== 'undefined' && currentUser && currentUser.username);
console.log('   Logged in as:', loggedIn);

// ===== TEST 1: Dashboard widgets =====
console.log('\n=== 3. Dashboard widgets — open customizer ===');
await page.evaluate(() => { if (typeof nav==='function') nav('dashboard'); });
await page.waitForTimeout(1000);
const widgetCount = await page.evaluate(() => document.querySelectorAll('[data-widget]').length);
console.log('   data-widget elements on dashboard:', widgetCount);
const hasCustomizer = await page.evaluate(() => typeof dashWidgetApply === 'function' && typeof dashApplyLayout === 'function');
console.log('   dashWidgetApply/dashApplyLayout exist:', hasCustomizer);
// Try to open the customizer
const customizerBtn = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, a'));
  const b = btns.find(x => /customi[zs]e|widget/i.test(x.textContent || ''));
  return b ? b.outerHTML.slice(0, 200) : null;
});
console.log('   Customizer trigger button:', customizerBtn);

// ===== TEST 2: Email Hub =====
console.log('\n=== 4. Email Hub ===');
await page.evaluate(() => { if (typeof nav==='function') nav('emailhub'); });
await page.waitForTimeout(1500);
const emailHubState = await page.evaluate(() => ({
  hasEMAIL_STATE: typeof EMAIL_STATE !== 'undefined',
  hasRender: typeof renderEmailHub === 'function',
  rendered: !!document.querySelector('.ws-hero, .ws-shell, #emailHubRoot'),
  contentSnippet: (document.getElementById('mainContent') || document.body).innerHTML.slice(0, 400)
}));
console.log('   Email Hub state:', JSON.stringify(emailHubState, null, 2).slice(0, 800));

// ===== TEST 3: Attendance =====
console.log('\n=== 5. Attendance — Morning Check-in ===');
await page.evaluate(() => { if (typeof nav==='function') nav('attendance'); });
await page.waitForTimeout(1500);
const attState = await page.evaluate(() => ({
  hasAttUseNow: typeof attUseNow === 'function',
  hasAttImport: typeof attImportFromFile === 'function',
  attTime: !!document.getElementById('att-time'),
  autoNowCheckbox: !!document.getElementById('att-auto-now'),
  fileInput: !!document.getElementById('att-import-file'),
  importBtns: Array.from(document.querySelectorAll('button')).filter(b=>/Upload Excel|Google Sheets|Paste names|Use current time/i.test(b.textContent||'')).map(b=>b.textContent.trim()),
}));
console.log('   Attendance:', JSON.stringify(attState));

// ===== TEST 4: WhatsApp archive =====
console.log('\n=== 6. WhatsApp / Communications Hub ===');
await page.evaluate(() => { if (typeof nav==='function') nav('communications'); });
await page.waitForTimeout(2000);
const waState = await page.evaluate(() => ({
  hasLoadArchive: typeof waLoadArchive === 'function',
  hasInjectArchive: typeof _waInjectArchive === 'function',
  hasArchiveStore: typeof COMMS_STATE !== 'undefined' && !!COMMS_STATE.archiveHtml,
  commsMessagesExists: !!document.getElementById('commsMessages'),
}));
console.log('   WhatsApp:', JSON.stringify(waState));

console.log('\n=== ERRORS captured ===');
errors.forEach(e => console.log('  ', e));
console.log('\n=== LOGS captured ===');
logs.slice(-10).forEach(l => console.log('  ', l));

await browser.close();
