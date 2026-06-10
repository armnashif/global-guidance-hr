// v15.0 — My Workspace smoke test
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const results = [];
function check(n, c, d='') { results.push({n, p:!!c, d}); }
async function j(path, opts) { const r = await fetch(BASE+path, opts); return await r.json(); }

(async () => {
  const user = 'test-user-' + Date.now();
  const day  = '2026-05-20-test';

  // 1. Empty workspace
  const w0 = await j(`/api/workspace?user=${user}&day=${day}`);
  check('1 GET workspace returns empty defaults', w0.success && w0.workspace.checkIn === null && w0.workspace.tasks.length === 0);

  // 2. Check in
  const ci = await j('/api/workspace/checkin', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, mode:'Remote', focus:'Test focus' })});
  check('2 Check-in saves mode + focus', ci.success && ci.checkIn.mode === 'Remote' && ci.checkIn.focus === 'Test focus');

  // 3. Quick add task
  const t1 = await j('/api/workspace/task', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, title:'Task 1', priority:'high', due:'11:00' })});
  check('3 Quick-add task creates pending high-priority', t1.success && t1.task.status === 'pending' && t1.task.priority === 'high');

  // 4. Reject empty title
  const t2 = await j('/api/workspace/task', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, title:'', priority:'low' })});
  check('4 Empty title is rejected', t2.success === false);

  // 5. Update status to in_progress
  const u1 = await j('/api/workspace/task/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, id:t1.task.id, status:'in_progress' })});
  check('5 Update task to in_progress', u1.success && u1.task.status === 'in_progress' && u1.task.startedAt);

  // 6. Mark completed
  const u2 = await j('/api/workspace/task/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, id:t1.task.id, status:'completed' })});
  check('6 Complete task records completedAt', u2.success && u2.task.status === 'completed' && u2.task.completedAt);

  // 7. Reject invalid status
  const u3 = await j('/api/workspace/task/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, id:t1.task.id, status:'escalated' })});
  check('7 Invalid status ignored (kept as completed)', u3.success && u3.task.status === 'completed');

  // 8. Add 2nd task
  const t3 = await j('/api/workspace/task', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, title:'Task 2', priority:'med' })});
  check('8 Second task added', t3.success);

  // 9. Submit EOD
  const eod = await j('/api/workspace/eod', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, achievement:'Closed CAS', issues:'Slow uni reply' })});
  check('9 EOD report saves with correct counts', eod.success && eod.eod.completed === 1 && eod.eod.pending === 1 && eod.eod.achievement === 'Closed CAS');

  // 10. EOD auto-checks-out
  const w1 = await j(`/api/workspace?user=${user}&day=${day}`);
  check('10 EOD auto-set checkoutTs', w1.workspace.checkIn.checkoutTs);

  // 11. Delete task
  const d1 = await j('/api/workspace/task/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user, day, id:t1.task.id })});
  check('11 Delete task removes from list', d1.success);
  const w2 = await j(`/api/workspace?user=${user}&day=${day}`);
  check('12 List shrinks after delete', w2.workspace.tasks.length === 1);

  // 13. Team view
  const team = await j(`/api/workspace/team?day=${day}&users=${user}`);
  // After delete of t1, only t3 (pending, med) remains. EOD was already submitted before delete.
  check('13 Team view aggregates correctly', team.success && team.team[0].user === user && team.team[0].checkedIn === true && team.team[0].eodSubmitted === true && team.team[0].tasksTotal === 1 && team.team[0].pending === 1, `total=${team.team[0]?.tasksTotal} pending=${team.team[0]?.pending} completed=${team.team[0]?.completed}`);

  // 14. Reject team view with no users
  const team2 = await j(`/api/workspace/team?day=${day}`);
  check('14 Team view rejects missing users', team2.success === false);

  console.log('\n=== v15.0 MY WORKSPACE SMOKE TEST ===\n');
  let passed = 0;
  for (const r of results) {
    console.log((r.p?'✓ PASS':'✗ FAIL') + ' — ' + r.n + (r.d?' · '+r.d:''));
    if (r.p) passed++;
  }
  console.log(`\nTOTAL: ${passed}/${results.length}`);
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
