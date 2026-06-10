// Headless verification of the new Edvios-style student portal (v12).
import { chromium } from 'playwright';

const BROWSER = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
const URL = 'http://localhost:3000/';

const errors = [];
const log = [];

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: '+e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);

log.push('--- Opening portal directly for a student ---');
const studentName = await page.evaluate(() => {
  const lead = (LEADS_DATA||[]).find(l => l.status === 'offer') || (LEADS_DATA||[]).find(l => ['applied','cas','visa','enrolled'].includes(l.status)) || LEADS_DATA[0];
  if (!lead) return null;
  // Build a synthetic student session so the portal renders for them
  if (typeof currentUser !== 'undefined') {
    window.currentUser = { username:'student:'+lead.id, name:lead.name, role:'Student', level:10, dept:'Student', avatar:'#10b981,#047857', pages:['dashboard'], isStudent:true, studentId:lead.id, studentName:lead.name };
  }
  studentPortalOpen(lead.name);
  return lead.name;
});
log.push('Opened portal for: '+studentName);

await page.waitForSelector('#studentPortalModal', { timeout: 5000 }).catch(()=>{});
await page.waitForTimeout(400);

const results = await page.evaluate(() => {
  const r = {};
  const m = document.getElementById('studentPortalModal');
  r.modalExists = !!m;
  r.modalClass = m ? m.className : '';
  r.sidebarExists = !!document.querySelector('#sp2Sidebar');
  r.brandName = document.querySelector('.sp2-brand-name')?.textContent || '';
  r.brandSub = document.querySelector('.sp2-brand-sub')?.textContent || '';
  r.userName = document.querySelector('.sp2-user-name')?.textContent || '';
  r.userRole = document.querySelector('.sp2-user-role')?.textContent || '';
  r.greet = document.querySelector('.sp2-hero-greet')?.textContent || '';
  r.heroAlert = document.querySelector('.sp2-hero-alert')?.textContent || '';
  r.heroCta = document.querySelector('.sp2-hero-cta')?.textContent || '';
  r.dateStr = document.querySelector('.sp2-date-pill')?.textContent || '';
  const stats = Array.from(document.querySelectorAll('.sp2-stat')).map(s => ({
    cls: s.className,
    v: s.querySelector('.sp2-stat-v')?.textContent || '',
    l: s.querySelector('.sp2-stat-l')?.textContent || '',
    s: s.querySelector('.sp2-stat-s')?.textContent || ''
  }));
  r.statCount = stats.length;
  r.stats = stats;
  r.navItems = Array.from(document.querySelectorAll('.sp2-nav-item')).map(n => n.textContent.trim().replace(/\s+/g,' '));
  r.eddieHead = !!document.querySelector('.sp2-eddie-head');
  r.eddieGreeting = document.querySelector('.sp2-chat-body .sp2-msg-bub')?.textContent || '';
  r.chipCount = document.querySelectorAll('.sp2-chip').length;
  const apps = Array.from(document.querySelectorAll('.sp2-app')).map(a => ({
    uni: a.querySelector('.sp2-app-uni')?.textContent || '',
    prog: a.querySelector('.sp2-app-prog')?.textContent || '',
    badge: a.querySelector('.sp2-app-badge')?.textContent || '',
    deadline: a.querySelector('.sp2-app-deadline')?.textContent || ''
  }));
  r.appCount = apps.length;
  r.apps = apps;
  r.topbarTitle = document.getElementById('sp2TopTitle')?.textContent || '';
  return r;
});

log.push('\n=== PORTAL RENDER ===');
log.push('Modal exists:        '+results.modalExists+' ('+results.modalClass+')');
log.push('Sidebar exists:      '+results.sidebarExists);
log.push('Brand:               "'+results.brandName+'" — "'+results.brandSub+'"');
log.push('User name / role:    "'+results.userName+'" / "'+results.userRole+'"');
log.push('Hero date pill:      "'+results.dateStr+'"');
log.push('Hero greeting:       "'+results.greet+'"');
log.push('Hero alert:          "'+results.heroAlert+'"');
log.push('Hero CTA text:       "'+results.heroCta+'"');
log.push('Topbar title:        "'+results.topbarTitle+'"');
log.push('Stat tile count:     '+results.statCount);
results.stats.forEach((s,i)=>log.push('  ['+i+'] '+s.v+' '+s.l+' — '+s.s));
log.push('Sidebar nav count:   '+results.navItems.length);
results.navItems.slice(0,6).forEach((n,i)=>log.push('  ['+i+'] '+n));
log.push('  …');
results.navItems.slice(-4).forEach((n,i)=>log.push('  ['+(results.navItems.length-4+i)+'] '+n));
log.push('Eddie head:          '+results.eddieHead);
log.push('Eddie greeting:      "'+results.eddieGreeting.slice(0,90)+'..."');
log.push('Eddie chip count:    '+results.chipCount);
log.push('Application count:   '+results.appCount);
results.apps.forEach((a,i)=>log.push('  ['+i+'] '+a.uni+' — '+a.badge+' — '+a.deadline));

// === Tab navigation test ===
log.push('\n=== TAB NAVIGATION ===');
if (results.modalExists) {
  const tabsToTest = ['applications','timeline','documents','scholarships','finance','visa','profile','eddie','dashboard'];
  for (const tab of tabsToTest) {
    const r2 = await page.evaluate((t) => {
      if (typeof studentPortalTab === 'function') studentPortalTab(t);
      const active = document.querySelector('.sp2-page.active');
      const navActive = document.querySelector('.sp2-nav-item.active');
      return {
        activePage: active?.dataset.spPage,
        activeNav: navActive?.dataset.sp,
        topbar: document.getElementById('sp2TopTitle')?.textContent
      };
    }, tab);
    const ok = r2.activePage === tab && r2.activeNav === tab;
    log.push((ok ? '✅' : '❌')+' '+tab.padEnd(15)+' active='+r2.activePage+' nav='+r2.activeNav+' topbar="'+r2.topbar+'"');
  }

  // === Eddie chat test ===
  log.push('\n=== EDDIE CHAT ===');
  await page.evaluate(() => { studentPortalTab('dashboard'); });
  await page.waitForTimeout(300);
  const chatResult = await page.evaluate(() => {
    const inp = document.getElementById('sp2ChatInput');
    if (!inp) return { error:'no input' };
    inp.value = 'Tell me about the visa checklist';
    if (typeof studentPortalSendEddie === 'function') studentPortalSendEddie();
    return { sent:true };
  });
  log.push('Chat send: '+JSON.stringify(chatResult));
  await page.waitForTimeout(1500);
  const chat = await page.evaluate(() => {
    const msgs = Array.from(document.querySelectorAll('#sp2ChatBody .sp2-msg'));
    return {
      count: msgs.length,
      hasMe: msgs.some(m => m.classList.contains('me')),
      last: msgs[msgs.length-1]?.textContent?.slice(0,120) || ''
    };
  });
  log.push('Messages now: '+chat.count+'  hasUserMsg='+chat.hasMe);
  log.push('Last reply:   "'+chat.last+'..."');

  // === Sidebar toggle ===
  log.push('\n=== SIDEBAR TOGGLE ===');
  const wBefore = await page.evaluate(() => document.getElementById('sp2Sidebar')?.offsetWidth ?? -1);
  await page.evaluate(() => { if (typeof studentPortalToggleSidebar==='function') studentPortalToggleSidebar(); });
  await page.waitForTimeout(400);
  const wAfter = await page.evaluate(() => document.getElementById('sp2Sidebar')?.offsetWidth ?? -1);
  log.push('Sidebar width: '+wBefore+' → '+wAfter+(wAfter<wBefore ? ' ✅ collapses' : ' ❌ no collapse'));
  await page.evaluate(() => { if (typeof studentPortalToggleSidebar==='function') studentPortalToggleSidebar(); });
  await page.waitForTimeout(200);

  // Screenshot
  await page.evaluate(() => studentPortalTab('dashboard'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/v12_dashboard.png', fullPage: false });
  log.push('Screenshot: /tmp/v12_dashboard.png');
}

log.push('\n=== JS ERRORS ===');
if (errors.length === 0) log.push('✅ Zero JS errors');
else errors.forEach(e => log.push('❌ '+e));

console.log(log.join('\n'));
await browser.close();
process.exit((errors.length || !results.modalExists) ? 1 : 0);
