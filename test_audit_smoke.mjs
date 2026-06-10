// v16h audit smoke test — verify D1, D2, D3, D5, D7 visible in the live page.
import { chromium } from 'playwright';
const url = 'https://3000-i1or73f6i7zoopcazy4yn-c81df28e.sandbox.novita.ai';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errors = [];
const logs = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));

await page.goto(url, { waitUntil: 'networkidle' });
// Login as Thasbiha (Head of Admissions / HR — level >= 80, sees leave queue)
await page.fill('input[type="text"], input[placeholder*="user" i]', 'thasbiha.s').catch(()=>{});
await page.fill('input[type="password"]', 'Staff@Global2026').catch(()=>{});
await page.click('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').catch(()=>{});
await page.waitForTimeout(2500);

// D2: navigate to universities — check topbar title is "University Follow-Ups" (not "Uni Follow-Ups")
await page.evaluate(() => typeof nav === 'function' && nav('universities'));
await page.waitForTimeout(800);
const topbarUni = await page.evaluate(() => (document.getElementById('topbarTitle')||{}).textContent || '');
console.log('D2 topbar (universities):', JSON.stringify(topbarUni));

// D3: navigate to leave
await page.evaluate(() => typeof nav === 'function' && nav('leave'));
await page.waitForTimeout(1500);
const leaveStats = await page.evaluate(() => ({
  pending: (document.getElementById('leaveStatPending')||{}).textContent,
  now:     (document.getElementById('leaveStatNow')||{}).textContent,
  hasQueueBody: !!document.getElementById('leaveQueueBody'),
  queueBodyText: ((document.getElementById('leaveQueueBody')||{}).innerText||'').slice(0, 140)
}));
console.log('D3 leave stats:', JSON.stringify(leaveStats));

// D7: navigate to WhatsApp
await page.evaluate(() => typeof nav === 'function' && nav('whatsappweb'));
await page.waitForTimeout(800);
const waCheck = await page.evaluate(() => ({
  hasIframe: !!document.getElementById('waWebFrame'),
  openButtonCount: document.querySelectorAll('button').length > 0 ? Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.includes('Open WhatsApp Web')).length : 0
}));
console.log('D7 WhatsApp:', JSON.stringify(waCheck));

// D1: navigate to Email Hub — count Connect-Gmail / Webmail/IMAP buttons (should be 0 since they were collapsed)
await page.evaluate(() => typeof nav === 'function' && nav('emailhub'));
await page.waitForTimeout(800);
const emailButtons = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('button'));
  return {
    connectGmail:  all.filter(b => b.textContent.includes('Connect Gmail')).length,
    webmailImap:   all.filter(b => /Webmail|IMAP/i.test(b.textContent)).length,
    connectEmail:  all.filter(b => /Connect email account/i.test(b.textContent)).length
  };
});
console.log('D1 email buttons:', JSON.stringify(emailButtons));

console.log('---');
console.log('Errors:', errors.length, errors.slice(0,3));
console.log('Console:', logs.slice(0,5));
await browser.close();
