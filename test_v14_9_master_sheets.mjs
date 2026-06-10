// v14.9 — Master Sheets smoke test
// Validates GET endpoints, patch persistence, and bulk seed-tasks dedupe.

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const results = [];
function check(name, cond, detail='') { results.push({name, pass: !!cond, detail}); }

async function j(path, opts) {
  const r = await fetch(BASE + path, opts);
  return await r.json();
}

(async () => {
  // 1. Thasbiha master GET
  const thb = await j('/api/thasbiha/master');
  check('1 GET /api/thasbiha/master returns success+students', thb.success && Array.isArray(thb.students) && thb.students.length >= 70, `students=${thb.students?.length}`);

  // 2. GLSA master GET
  const glsa = await j('/api/glsa/master');
  check('2 GET /api/glsa/master returns pipeline+payments+quals', glsa.success && glsa.pipeline.length >= 10 && glsa.payments.length >= 20, `pipeline=${glsa.pipeline?.length} payments=${glsa.payments?.length}`);

  // 3. Admissions master GET
  const adm = await j('/api/admissions/master');
  const admSheetNames = Object.keys(adm.sheets || {});
  check('3 GET /api/admissions/master has 4 sheets', adm.success && admSheetNames.length === 4, `sheets=${admSheetNames.join('|')}`);

  // 4. Thasbiha patch
  const sampleId = thb.students[0]._id;
  const patchVal = 'TEST-v14.9-' + Date.now();
  const p1 = await j('/api/thasbiha/master/patch', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: sampleId, patch:{ 'To Do': patchVal }, user:'test' }) });
  check('4 POST thasbiha patch returns success', p1.success === true, JSON.stringify(p1).slice(0,80));

  // 5. Patch persists on GET
  const thb2 = await j('/api/thasbiha/master');
  const target = thb2.students.find(s => s._id === sampleId);
  check('5 Thasbiha patch persists in GET merged response', target && target['To Do'] === patchVal, 'got=' + (target && target['To Do']));

  // 6. GLSA patch
  const glsaId = glsa.pipeline[0]._id;
  const p2 = await j('/api/glsa/master/patch', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: glsaId, patch:{ 'PACKAGE': 'TestPkg' }, user:'test' }) });
  check('6 POST glsa patch returns success', p2.success === true);

  // 7. Admissions patch
  const admSheet = admSheetNames[0];
  const admId = (adm.sheets[admSheet][0]||{})._id || 'fallback-id';
  const p3 = await j('/api/admissions/master/patch', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sheet: admSheet, id: admId, patch:{ 'Status': 'TestStatus' }, user:'test' }) });
  check('7 POST admissions patch returns success', p3.success === true);

  // 8. Bulk seed-tasks — new picks
  const day = 'test-' + Date.now();
  const s1 = await j('/api/thasbiha/seed-tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
    owner:'thasbiha.s', day,
    picks:[
      { source:'thb',  id:'k1', name:'Test-Kishara', label:'IELTS', segment:'GG' },
      { source:'glsa', id:'g1', name:'Test-Abi',     label:'Pearson', segment:'INMOTHS' }
    ]
  })});
  check('8 seed-tasks creates 2 new tasks', s1.success && s1.added === 2 && s1.skipped === 0, `added=${s1.added} skipped=${s1.skipped}`);

  // 9. Bulk seed-tasks — duplicates skipped
  const s2 = await j('/api/thasbiha/seed-tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
    owner:'thasbiha.s', day,
    picks:[
      { source:'thb',  id:'k1', name:'Test-Kishara', label:'IELTS', segment:'GG' },
      { source:'thb',  id:'k2', name:'New-One',      label:'NewTask', segment:'GG' }
    ]
  })});
  check('9 seed-tasks dedupes by sheetRef (1 dup + 1 new)', s2.success && s2.added === 1 && s2.skipped === 1, `added=${s2.added} skipped=${s2.skipped}`);

  // 10. Generated task has correct shape
  const t = (s1.tasks||[])[0];
  check('10 generated task has segment+sheetRef+status=Pending', t && t.status === 'Pending' && t.sheetRef && t.segment, JSON.stringify(t).slice(0,120));

  // Output
  console.log('\n=== v14.9 MASTER SHEETS SMOKE TEST ===\n');
  let passed = 0;
  for (const r of results) {
    console.log((r.pass ? '✓ PASS' : '✗ FAIL') + ' — ' + r.name + (r.detail?' · '+r.detail:''));
    if (r.pass) passed++;
  }
  console.log(`\nTOTAL: ${passed}/${results.length} passed (${results.length-passed} failed).`);
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
