// v16f smoke test — Thasbiha two-workstream dashboard, plan/report/call endpoints,
// CEO/COO report cards. Runs against local PM2 wrangler server.
import { chromium } from 'playwright';
import { spawn } from 'child_process';

const BASE = 'http://localhost:3000';
const CHROME = '/home/user/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';

const results = [];
const ok = (n, c, e='') => { results.push({n,c,e}); console.log(`${c?'✓ PASS':'✗ FAIL'} — ${n}${e?' · '+e:''}`); };

async function login(page, user, pw) {
  await page.goto(BASE, { waitUntil:'networkidle' });
  // make sure we're on the login screen (clear any prior session)
  await page.evaluate(()=>{ try { if (typeof logout==='function') logout(); } catch(e){} try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
  await page.goto(BASE, { waitUntil:'networkidle' });
  await page.waitForSelector('#loginUser', { timeout: 10000 });
  await page.fill('#loginUser', user);
  await page.fill('#loginPass', pw);
  await page.evaluate(()=>{ if (typeof doLogin==='function') doLogin(); });
  await page.waitForTimeout(1800);
  await page.evaluate(()=>{ if (typeof wsCloseCheckin==='function') wsCloseCheckin(); });
  await page.waitForTimeout(400);
}

async function api(path, opts={}) {
  const res = await fetch(BASE + path, opts);
  return res.json();
}

(async () => {
  // ---- 1) Backend endpoints ----
  console.log('\n--- BACKEND ENDPOINTS ---');
  const d1 = await api('/api/thasbiha/daily').catch(e=>({success:false}));
  ok('1 GET /api/thasbiha/daily → success', d1 && d1.success === true);
  ok('2 daily has plan.gg, plan.him slots', d1.daily && 'gg' in d1.daily.plan && 'him' in d1.daily.plan);
  ok('3 daily has report.gg, report.him slots', d1.daily && 'gg' in d1.daily.report && 'him' in d1.daily.report);
  ok('4 daily has kpis.gg, kpis.him slots', d1.daily && 'gg' in d1.daily.kpis && 'him' in d1.daily.kpis);

  const c1 = await api('/api/thasbiha/calls').catch(()=>({success:false}));
  ok('5 GET /api/thasbiha/calls → success', c1 && c1.success === true && Array.isArray(c1.calls));

  // Submit a GG plan
  const pp = await api('/api/thasbiha/plan', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ ws:'gg', plan:{ registrationsTarget:5, applicationsToSubmit:3, meetings:'Team sync 10am' } })
  });
  ok('6 POST /api/thasbiha/plan ws=gg → success', pp && pp.success === true);

  // Submit a Himaaus plan
  const pph = await api('/api/thasbiha/plan', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ ws:'him', plan:{ casesToWorkOn:'3 UK packages', applicationsToSubmit:2 } })
  });
  ok('7 POST /api/thasbiha/plan ws=him → success', pph && pph.success === true);

  // Submit a report (triggers KPI auto-calc)
  const rp = await api('/api/thasbiha/report', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ ws:'gg', report:{ leadsContacted:8, registrationsCompleted:4, applicationsSubmitted:3, offersReceived:1, conversions:2 } })
  });
  ok('8 POST /api/thasbiha/report ws=gg → success', rp && rp.success === true);
  ok('9 report response computes KPIs', rp && rp.daily && rp.daily.kpis && rp.daily.kpis.gg && typeof rp.daily.kpis.gg.leadsContacted !== 'undefined');

  // Log a call
  const cp = await api('/api/thasbiha/call', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ contact:'Test Student', purpose:'Follow-up', outcome:'Positive', durationMin:5, notes:'smoke test', ws:'gg' })
  });
  ok('10 POST /api/thasbiha/call → success', cp && cp.success === true && cp.call && cp.call.id);

  // Range endpoint
  const rng = await api('/api/thasbiha/daily/range?days=7');
  ok('11 GET /api/thasbiha/daily/range → success', rng && rng.success === true && Array.isArray(rng.records));

  // Delete the call we just logged
  if (cp && cp.call) {
    const del = await api('/api/thasbiha/call/delete', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: cp.call.id })
    });
    ok('12 POST /api/thasbiha/call/delete → success', del && del.success === true);
  }

  // ---- 2) UI flow ----
  console.log('\n--- UI FLOW (Thasbiha) ---');
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args:['--no-sandbox','--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    page.on('pageerror', e=>{ console.log('   pageerror:', String(e).slice(0,200)); });
    await login(page, 'thasbiha.s', 'Staff@Global2026');
    // The new Thasbiha role-tab dashboard renders inside the calm "Full report" modal.
    // Open it programmatically to inspect the new mount points.
    await page.evaluate(()=>{ if (typeof calmOpenLegacyDashboard==='function') calmOpenLegacyDashboard(); });
    await page.waitForTimeout(1200);

    // Check dashboard renders new shell
    const hasHeader = await page.evaluate(()=> !!document.getElementById('thbHeader'));
    ok('13 Thasbiha dashboard has #thbHeader mount', hasHeader);

    const hasStatus = await page.evaluate(()=> !!document.getElementById('thbStatusRow'));
    ok('14 Thasbiha dashboard has #thbStatusRow', hasStatus);

    const hasKpi = await page.evaluate(()=> !!document.getElementById('thbKpiScorecard'));
    ok('15 Thasbiha dashboard has #thbKpiScorecard', hasKpi);

    const hasMid = await page.evaluate(()=> !!document.getElementById('thbMidRow'));
    ok('16 Thasbiha dashboard has #thbMidRow', hasMid);

    const hasBot = await page.evaluate(()=> !!document.getElementById('thbBottomRow'));
    ok('17 Thasbiha dashboard has #thbBottomRow', hasBot);

    // Workstream toggle exists
    const hasToggle = await page.evaluate(()=> typeof window.thbSetWs === 'function');
    ok('18 thbSetWs() workstream toggle exists', hasToggle);

    // Modal openers exist
    const openers = await page.evaluate(()=>({
      plan: typeof window.thbOpenPlanForm === 'function',
      report: typeof window.thbOpenReportForm === 'function',
      call: typeof window.thbOpenCallLogger === 'function'
    }));
    ok('19 thbOpenPlanForm() exists', openers.plan);
    ok('20 thbOpenReportForm() exists', openers.report);
    ok('21 thbOpenCallLogger() exists', openers.call);

    // Confirm sidebar trim
    const navText = (await page.locator('.nav-item').allTextContents()).join(' | ').toLowerCase();
    ok('22 Sidebar has NO Commissions',  !/commission/.test(navText));
    ok('23 Sidebar has NO Petty Cash',   !/petty/.test(navText));
    ok('24 Sidebar has NO Payroll',      !/payroll/.test(navText));
    ok('25 Sidebar has NO Students page',!/\bstudents\b/.test(navText));
    ok('26 Sidebar has NO Performance',  !/performance/.test(navText));
    ok('27 Sidebar HAS Leads',           /\blead/.test(navText));
    ok('28 Sidebar HAS Applications',    /application/.test(navText));
    ok('29 Sidebar HAS Employees',       /employee|team/.test(navText));

    // New dashboard root (id 'thbDash', not 'thbDashRoot')
    const hasNewDashRoot = await page.evaluate(()=> !!document.getElementById('thbDash'));
    ok('30 New dashboard root #thbDash is rendered', hasNewDashRoot);

    // ---- 3) CEO sees report card ---- (use a fresh isolated context)
    console.log('\n--- UI FLOW (CEO sees Thasbiha report card) ---');
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    page2.on('pageerror', e=>{ console.log('   ceo pageerror:', String(e).slice(0,200)); });
    await login(page2, 'nashif.razzak', 'CEO@Global2026');
    // CEO mount is via _renderLegacyDashboard → renderCEOTeamOverview (level 100 path)
    await page2.evaluate(()=>{ if (typeof calmOpenLegacyDashboard==='function') calmOpenLegacyDashboard(); });
    await page2.waitForTimeout(1500);
    const ceoCard = await page2.evaluate(()=> !!document.getElementById('thbReportCardMount'));
    ok('31 CEO dashboard mounts #thbReportCardMount', ceoCard);
    // wait for it to populate
    await page2.waitForTimeout(4000);
    const ceoCardLoaded = await page2.evaluate(()=>{
      const el = document.getElementById('thbRcBody');
      if (!el) return { ok:false, txt:'no element' };
      const t = el.innerText || '';
      return { ok: /Plan|GG|Himaaus|KPI|Loading/i.test(t), txt: t.slice(0,200) };
    });
    ok('32 CEO report card body loads with content', ceoCardLoaded.ok, 'txt=' + ceoCardLoaded.txt);

    // ---- 4) COO sees report card ---- (use a fresh isolated context)
    console.log('\n--- UI FLOW (COO sees Thasbiha report card) ---');
    const ctx3 = await browser.newContext();
    const page3 = await ctx3.newPage();
    page3.on('pageerror', e=>{ console.log('   coo pageerror:', String(e).slice(0,200)); });
    await login(page3, 'nafees.razzak', 'COO@Global2026');
    await page3.evaluate(()=>{ if (typeof calmOpenLegacyDashboard==='function') calmOpenLegacyDashboard(); });
    await page3.waitForTimeout(1500);
    const cooCard = await page3.evaluate(()=> !!document.getElementById('thbReportCardMount'));
    ok('33 COO dashboard mounts #thbReportCardMount', cooCard);
    await page3.waitForTimeout(4000);
    const cooCardLoaded = await page3.evaluate(()=>{
      const el = document.getElementById('thbRcBody');
      if (!el) return { ok:false, txt:'no element' };
      const t = el.innerText || '';
      return { ok: /Plan|GG|Himaaus|KPI|Loading/i.test(t), txt: t.slice(0,200) };
    });
    ok('34 COO report card body loads with content', cooCardLoaded.ok, 'txt=' + cooCardLoaded.txt);

  } finally {
    await browser.close();
  }

  // Summary
  const pass = results.filter(r=>r.c).length;
  const fail = results.filter(r=>!r.c).length;
  console.log('\n=========================================');
  console.log(`v16f SMOKE — ${pass}/${results.length} PASS, ${fail} FAIL`);
  console.log('=========================================');
  process.exit(fail===0 ? 0 : 1);
})();
