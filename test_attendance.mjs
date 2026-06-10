import { chromium } from 'playwright';
const CHROME = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', err => errors.push('[pageerror] '+err.message));
page.on('console', msg => { if (msg.type()==='error') errors.push('[console.error] '+msg.text()); });

await page.goto('https://fbb10a17.webapp-2il.pages.dev/', { waitUntil: 'networkidle' });
await page.fill('#loginUser', 'razan.thawus');  // Razan is the attendance user
await page.fill('#loginPass', 'password123');
await page.click('#btnSignin');
await page.waitForTimeout(2000);

// Navigate to attendance and check what's rendered
await page.evaluate(() => nav('attendance'));
await page.waitForTimeout(2000);

const result = await page.evaluate(() => ({
  activePages: Array.from(document.querySelectorAll('.page.active')).map(p=>p.id),
  attTime: !!document.getElementById('att-time'),
  autoNowCheckbox: !!document.getElementById('att-auto-now'),
  fileInput: !!document.getElementById('att-import-file'),
  importBtns: Array.from(document.querySelectorAll('button')).filter(b=>/Upload Excel|Google Sheets|Paste names|Use current time/i.test(b.textContent||'')).map(b=>b.textContent.trim()),
  subTabHtml: (document.getElementById('att-morning')||{}).outerHTML ? (document.getElementById('att-morning').outerHTML.slice(0,500)) : '(no att-morning element)',
  mainContentSize: (document.getElementById('mainContent')||{}).innerHTML.length || 0,
  pageTitle: (document.getElementById('topbarTitle')||{}).textContent
}));
console.log(JSON.stringify(result, null, 2));
console.log('\nERRORS:', errors.join('\n'));
await browser.close();
