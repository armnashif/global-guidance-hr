import { chromium } from 'playwright';
const CHROME = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', msg => { if (msg.type()==='error') errors.push('[console.error] '+msg.text()); });
page.on('pageerror', err => errors.push('[pageerror] '+err.message+'\n'+(err.stack||'').slice(0,400)));

await page.goto('https://fbb10a17.webapp-2il.pages.dev/', { waitUntil: 'networkidle' });
await page.fill('#loginUser', 'nashif.razzak');
await page.fill('#loginPass', 'password123');
await page.click('#btnSignin');
await page.waitForTimeout(2000);

// Capture all nav details
const result = await page.evaluate(() => {
  const out = {};
  out.currentUserPages = currentUser ? currentUser.pages.slice() : null;
  out.hasNav = typeof nav === 'function';
  out.navSrc = nav.toString().slice(0, 2000);
  // Try nav('emailhub') and capture result
  try { nav('emailhub'); } catch(e) { out.emailhubError = e.message; }
  out.afterEmailhubActive = document.querySelectorAll('.page.active').length;
  out.afterEmailhubActiveIds = Array.from(document.querySelectorAll('.page.active')).map(p=>p.id);
  out.allPageIds = Array.from(document.querySelectorAll('.page')).map(p=>p.id);
  return out;
});
console.log(JSON.stringify(result, null, 2).slice(0, 3500));
console.log('\nERRORS:', errors.join('\n'));
await browser.close();
