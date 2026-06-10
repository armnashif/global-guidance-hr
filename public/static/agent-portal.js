/* ============================================================
   AGENT PORTAL (v14) — Global Guidance Education Consultancy
   External recruitment partners can:
     - Submit student applications
     - Track application stages
     - Manage documents
     - View commission ledger
     - Change their password

   Loaded as /static/agent-portal.js by command-portal.html.
   Depends on: currentUser, doLogout, AGENTS_DATA, AGENT_APPLICATIONS.
   ============================================================ */

(function(){
  'use strict';

  // ---------- SAMPLE DATA (populated only if not already defined) ----------
  if (typeof window.AGENTS_DATA === 'undefined'){
    window.AGENTS_DATA = [
      { id:'AG-001', username:'agent.colombo',  name:'Colombo Education Hub',    contactName:'Rashmi Perera',  email:'rashmi@colomboedu.lk',  phone:'+94 77 123 4567', city:'Colombo', country:'\uD83C\uDDF1\uD83C\uDDF0 Sri Lanka', joined:'2024-03-15', tier:'Gold',     commissionRate:12, totalSubmissions:24, conversions:18, pendingCommission:850000,  avatar:'#0ea5e9,#0369a1' },
      { id:'AG-002', username:'agent.jaffna',   name:'Jaffna Pathways Partners', contactName:'Suthan Rajen',   email:'suthan@jaffnapath.lk',  phone:'+94 76 987 6543', city:'Jaffna',  country:'\uD83C\uDDF1\uD83C\uDDF0 Sri Lanka', joined:'2024-08-22', tier:'Silver',   commissionRate:10, totalSubmissions:14, conversions:9,  pendingCommission:320000,  avatar:'#10b981,#047857' },
      { id:'AG-003', username:'agent.kandy',    name:'Kandy Global Studies',     contactName:'Niranjan W.',    email:'niranjan@kandyglobal.lk', phone:'+94 71 555 7788', city:'Kandy', country:'\uD83C\uDDF1\uD83C\uDDF0 Sri Lanka', joined:'2025-01-10', tier:'Silver',   commissionRate:10, totalSubmissions:9,  conversions:5,  pendingCommission:180000,  avatar:'#8b5cf6,#6d28d9' },
      { id:'AG-004', username:'agent.dubai',    name:'Dubai Bridge Consultancy', contactName:'Faiza Al-Mansoori', email:'faiza@dubaibridge.ae', phone:'+971 50 234 5678', city:'Dubai', country:'\uD83C\uDDE6\uD83C\uDDEA UAE',        joined:'2024-11-05', tier:'Platinum', commissionRate:15, totalSubmissions:31, conversions:26, pendingCommission:1240000, avatar:'#f59e0b,#b45309' },
      { id:'AG-005', username:'agent.male',     name:'Maldives Pathways',        contactName:'Ahmed Shahid',   email:'shahid@mvpathways.mv',  phone:'+960 999 1234',  city:'Mal\u00e9', country:'\uD83C\uDDF2\uD83C\uDDFB Maldives',    joined:'2025-02-20', tier:'Bronze',   commissionRate:8,  totalSubmissions:5,  conversions:3,  pendingCommission:95000,   avatar:'#06b6d4,#0e7490' }
    ];
  }

  if (typeof window.AGENT_APPLICATIONS === 'undefined'){
    window.AGENT_APPLICATIONS = [
      { id:'GG-AP-2026-0101', agentId:'AG-001', studentName:'Pavithra Senanayake', email:'pavithra.s@gmail.com', phone:'+94 71 200 1122', dest:'\uD83C\uDDEC\uD83C\uDDE7 UK', course:'Business Management MSc', uni:'University of Hertfordshire', intake:'Jan 2026', stage:'cas',      submitted:'2025-11-12', updated:'2026-01-04', commission:'GBP 2,850', notes:'CAS issued. Visa appointment booked Jan 18.' },
      { id:'GG-AP-2026-0098', agentId:'AG-001', studentName:'Tharindu Bandara',    email:'tharindu.b@gmail.com', phone:'+94 76 311 4455', dest:'\uD83C\uDDEC\uD83C\uDDE7 UK', course:'Computer Science BSc',    uni:'De Montfort University',      intake:'Sept 2026', stage:'applied',  submitted:'2026-01-02', updated:'2026-01-08', commission:'GBP 2,100', notes:'Awaiting offer letter from DMU.' },
      { id:'GG-AP-2026-0102', agentId:'AG-001', studentName:'Nethmi Fernando',     email:'nethmi.f@gmail.com',   phone:'+94 70 778 9933', dest:'\uD83C\uDDE8\uD83C\uDDE6 CA', course:'Architectural Tech (Diploma)', uni:'Centennial College',      intake:'May 2026',  stage:'offer',    submitted:'2025-12-18', updated:'2026-01-06', commission:'CAD 2,400', notes:'Conditional offer received. Awaiting deposit.' },
      { id:'GG-AP-2026-0089', agentId:'AG-002', studentName:'Sanjay Mahendran',    email:'sanjay.m@yahoo.com',   phone:'+94 76 432 8800', dest:'\uD83C\uDDEC\uD83C\uDDE7 UK', course:'International Business MSc', uni:'Coventry University',   intake:'Jan 2026',  stage:'visa',     submitted:'2025-10-30', updated:'2026-01-09', commission:'GBP 2,600', notes:'Visa refused on financial docs. Re-applying.' },
      { id:'GG-AP-2026-0090', agentId:'AG-002', studentName:'Anika Mahalingam',    email:'anika.m@gmail.com',    phone:'+94 76 555 2244', dest:'\uD83C\uDDEC\uD83C\uDDE7 UK', course:'Public Health MSc',         uni:'University of Sunderland', intake:'Sept 2026', stage:'applied',  submitted:'2026-01-05', updated:'2026-01-05', commission:'GBP 2,200', notes:'Application submitted. IELTS 6.5 achieved.' },
      { id:'GG-AP-2026-0096', agentId:'AG-003', studentName:'Praveen Kumara',      email:'praveen.k@gmail.com',  phone:'+94 71 600 9988', dest:'\uD83C\uDDEC\uD83C\uDDE7 UK', course:'MBA',                       uni:'University of Bedfordshire', intake:'Jan 2026', stage:'enrolled', submitted:'2025-09-10', updated:'2025-12-15', commission:'GBP 2,950', notes:'Visa granted. Enrolled. Commission ready to invoice.' },
      { id:'GG-AP-2026-0103', agentId:'AG-004', studentName:'Layla Hassan',        email:'layla.h@hotmail.com',  phone:'+971 50 887 7665', dest:'\uD83C\uDDEC\uD83C\uDDE7 UK', course:'Pharmacy MSc',             uni:'University of Hertfordshire', intake:'Sept 2026', stage:'cas',      submitted:'2025-11-25', updated:'2026-01-07', commission:'GBP 3,200', notes:'CAS issued. Strong applicant.' },
      { id:'GG-AP-2026-0104', agentId:'AG-004', studentName:'Omar Khalifa',        email:'omar.k@gmail.com',     phone:'+971 55 220 1199', dest:'\uD83C\uDDE6\uD83C\uDDFA AU', course:'Engineering Management MSc', uni:'University of Adelaide',     intake:'Feb 2026',  stage:'enrolled', submitted:'2025-08-14', updated:'2025-12-22', commission:'AUD 4,800', notes:'Visa granted. In Adelaide. Commission invoiced.' },
      { id:'GG-AP-2026-0105', agentId:'AG-005', studentName:'Aishath Reema',       email:'reema@gmail.com',      phone:'+960 999 7878',  dest:'\uD83C\uDDEC\uD83C\uDDE7 UK', course:'Business Analytics MSc',  uni:'Coventry University',       intake:'Sept 2026', stage:'applied',  submitted:'2026-01-03', updated:'2026-01-03', commission:'GBP 2,400', notes:'Application sent.' }
    ];
  }

  // ---------- STATE ----------
  window.AGENT_PORTAL_STATE = {
    currentAgent: null,
    activePage:   'dashboard',
    filterStage:  'all',
    searchTerm:   ''
  };

  // ---------- HELPERS ----------
  function esc(s){
    return String(s||'').replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function agentById(id){
    return (window.AGENTS_DATA || []).find(function(a){ return a.id === id; });
  }
  function agentByUsername(u){
    u = String(u||'').toLowerCase();
    return (window.AGENTS_DATA || []).find(function(a){ return String(a.username||'').toLowerCase() === u; });
  }
  function appsFor(agentId){
    return (window.AGENT_APPLICATIONS || []).filter(function(x){ return x.agentId === agentId; });
  }
  function countStage(apps, s){ return apps.filter(function(a){ return a.stage === s; }).length; }
  function stageBadge(stage){
    var map = {
      applied:  { bg:'#dbeafe', fg:'#1d4ed8', label:'Applied' },
      offer:    { bg:'#fef3c7', fg:'#92400e', label:'Offer' },
      cas:      { bg:'#e0e7ff', fg:'#4338ca', label:'CAS / COE' },
      visa:     { bg:'#fce7f3', fg:'#9d174d', label:'Visa' },
      enrolled: { bg:'#d1fae5', fg:'#065f46', label:'Enrolled' },
      dropped:  { bg:'#fee2e2', fg:'#991b1b', label:'Withdrawn' }
    };
    var s = map[stage] || { bg:'#f1f5f9', fg:'#475569', label:stage||'—' };
    return '<span style="display:inline-block;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;background:'+s.bg+';color:'+s.fg+'">'+s.label+'</span>';
  }
  function tierColor(t){
    return ({ Platinum:'#7c3aed', Gold:'#d97706', Silver:'#64748b', Bronze:'#92400e' })[t] || '#64748b';
  }
  function toast(html, kind){
    kind = kind || 'success';
    var bg = kind === 'success' ? 'linear-gradient(135deg,#10b981,#059669)'
           : kind === 'error'   ? 'linear-gradient(135deg,#dc2626,#991b1b)'
           : 'linear-gradient(135deg,#f59e0b,#b45309)';
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:20px;right:24px;background:'+bg+';color:#fff;padding:12px 18px;border-radius:9px;font-weight:700;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,0.3);font-size:13.5px;max-width:380px';
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 3500);
  }

  // ---------- AUTH HELPERS (exported for command-portal.html) ----------
  window.agentLoginResolve = function(query){
    query = String(query||'').trim().toLowerCase();
    if (!query) return null;
    return (window.AGENTS_DATA || []).find(function(a){
      return String(a.id||'').toLowerCase() === query
          || String(a.username||'').toLowerCase() === query
          || String(a.email||'').toLowerCase() === query
          || String(a.name||'').toLowerCase() === query
          || String(a.name||'').toLowerCase().indexOf(query) >= 0;
    }) || null;
  };
  window.agentPasswordFor = function(username){
    if (!username) return 'Agent@Global2026';
    try {
      var ov = JSON.parse(localStorage.getItem('gg-pw-overrides') || '{}');
      if (ov && ov['agent:'+username]) return ov['agent:'+username];
    } catch(e){}
    return 'Agent@Global2026';
  };
  window.agentQuickLogin = function(username){
    var ui = document.getElementById('loginUser') || document.getElementById('loginUsername');
    var pi = document.getElementById('loginPass') || document.getElementById('loginPassword');
    if (ui) ui.value = username;
    if (pi) pi.value = window.agentPasswordFor(username);
    if (typeof window.doLogin === 'function') window.doLogin();
  };

  // ---------- OPEN / CLOSE ----------
  window.agentPortalOpen = function(agentId){
    var agent = agentById(agentId);
    if (!agent){ alert('Agent not found: '+agentId); return; }
    window.AGENT_PORTAL_STATE.currentAgent = agent;
    window.AGENT_PORTAL_STATE.activePage   = 'dashboard';

    var old = document.getElementById('agentPortalModal');
    if (old) old.remove();

    var av = (agent.avatar || '#f59e0b,#b45309').split(',');

    var overlay = document.createElement('div');
    overlay.id = 'agentPortalModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#0b1220;display:flex;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif';
    overlay.innerHTML =
      '<div style="display:flex;flex:1;min-height:0">'
      +   '<aside id="agentSidebar" style="width:260px;background:linear-gradient(180deg,#f59e0b,#92400e);color:#fff;display:flex;flex-direction:column;overflow-y:auto">'
      +     '<div style="padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,0.18)">'
      +       '<div style="display:flex;align-items:center;gap:11px">'
      +         '<div style="width:46px;height:46px;border-radius:11px;background:linear-gradient(135deg,'+av[0]+','+av[1]+');display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,0.3);flex-shrink:0">'+esc(agent.name.charAt(0))+'</div>'
      +         '<div style="min-width:0;flex:1">'
      +           '<div style="font-size:13.5px;font-weight:800;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(agent.name)+'</div>'
      +           '<div style="font-size:10.5px;opacity:0.85;margin-top:3px">'+esc(agent.id)+' &middot; <span style="background:rgba(255,255,255,0.22);padding:1px 7px;border-radius:999px;font-weight:700">'+esc(agent.tier)+'</span></div>'
      +         '</div>'
      +       '</div>'
      +     '</div>'
      +     '<nav id="agentNav" style="flex:1;padding:10px"></nav>'
      +     '<div style="padding:12px 14px;border-top:1px solid rgba(255,255,255,0.18);background:rgba(0,0,0,0.18)">'
      +       '<button onclick="agentPortalClose()" style="width:100%;padding:10px;background:rgba(255,255,255,0.18);color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-sign-out-alt"></i> Logout</button>'
      +     '</div>'
      +   '</aside>'
      +   '<main style="flex:1;display:flex;flex-direction:column;min-width:0;background:#0b1220;color:#e2e8f0;overflow:hidden">'
      +     '<header style="padding:14px 26px;border-bottom:1px solid #1e293b;background:#0f172a;display:flex;align-items:center;justify-content:space-between;gap:16px">'
      +       '<div>'
      +         '<div style="font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:0.05em;text-transform:uppercase">Agent Portal</div>'
      +         '<div id="agentPageTitle" style="font-size:20px;font-weight:800;margin-top:2px">Dashboard</div>'
      +       '</div>'
      +       '<div style="text-align:right">'
      +         '<div style="font-size:11px;color:#94a3b8">Logged in as</div>'
      +         '<div style="font-size:13px;font-weight:700">'+esc(agent.contactName)+'</div>'
      +       '</div>'
      +     '</header>'
      +     '<div id="agentBody" style="flex:1;overflow-y:auto;padding:22px 26px;background:#0b1220"></div>'
      +   '</main>'
      + '</div>';

    document.body.appendChild(overlay);

    // Hide command-portal app behind us
    var appEl = document.getElementById('app');
    if (appEl) appEl.style.display = 'none';

    renderSidebar();
    window.agentNav('dashboard');
  };

  window.agentPortalClose = function(){
    var m = document.getElementById('agentPortalModal');
    if (m) m.remove();
    window.AGENT_PORTAL_STATE.currentAgent = null;
    if (typeof window.doLogout === 'function') window.doLogout();
  };

  // ---------- NAVIGATION ----------
  function renderSidebar(){
    var nav = document.getElementById('agentNav');
    if (!nav) return;
    var items = [
      { id:'dashboard',    label:'Dashboard',          icon:'fa-tachometer-alt' },
      { id:'students',     label:'My Students',        icon:'fa-user-graduate' },
      { id:'submit',       label:'Submit Application', icon:'fa-paper-plane' },
      { id:'applications', label:'Applications',       icon:'fa-folder-open' },
      { id:'documents',    label:'Documents',          icon:'fa-file-alt' },
      { id:'commissions',  label:'Commissions',        icon:'fa-coins' },
      { id:'messages',     label:'Messages',           icon:'fa-comments' },
      { id:'profile',      label:'Profile & Password', icon:'fa-user-cog' }
    ];
    var html = items.map(function(it){
      var active = window.AGENT_PORTAL_STATE.activePage === it.id;
      var style = 'display:flex;align-items:center;gap:11px;padding:10px 14px;margin-bottom:3px;border-radius:9px;cursor:pointer;font-size:13.5px;font-weight:600;transition:background 0.15s;'
        + (active ? 'background:rgba(255,255,255,0.22);color:#fff' : 'color:rgba(255,255,255,0.85)');
      return '<div onclick="agentNav(\''+it.id+'\')" style="'+style+'"'
        + ' onmouseover="if(!this.dataset.active)this.style.background=\'rgba(255,255,255,0.10)\'"'
        + ' onmouseout="if(!this.dataset.active)this.style.background=\'transparent\'"'
        + (active ? ' data-active="1"' : '')
        + '>'
        + '<i class="fas '+it.icon+'" style="width:18px;text-align:center"></i>'
        + '<span>'+it.label+'</span>'
        + '</div>';
    }).join('');
    nav.innerHTML = html;
  }

  window.agentNav = function(page){
    window.AGENT_PORTAL_STATE.activePage = page;
    renderSidebar();
    var titleEl = document.getElementById('agentPageTitle');
    var body    = document.getElementById('agentBody');
    if (!body) return;
    var titles = {
      dashboard:    'Dashboard',
      students:     'My Students',
      submit:       'Submit New Application',
      applications: 'My Applications',
      documents:    'Documents',
      commissions:  'Commissions',
      messages:     'Messages',
      profile:      'Profile & Settings'
    };
    if (titleEl) titleEl.textContent = titles[page] || 'Agent Portal';

    var fn = {
      dashboard:    renderDashboard,
      students:     renderStudents,
      submit:       renderSubmitForm,
      applications: renderApplications,
      documents:    renderDocuments,
      commissions:  renderCommissions,
      messages:     renderMessages,
      profile:      renderProfile
    }[page];

    body.innerHTML = fn ? fn() : '<div style="padding:40px;text-align:center;color:#94a3b8">Page not found.</div>';
  };

  // ---------- KPI CARD ----------
  function kpi(label, val, icon, color){
    return '<div style="padding:16px 18px;border-left:4px solid '+color+';background:#0f172a;border-radius:10px;border:1px solid #1e293b">'
      + '<div style="display:flex;align-items:center;justify-content:space-between">'
      +   '<div><div style="font-size:11.5px;color:#94a3b8;font-weight:700;letter-spacing:0.04em;text-transform:uppercase">'+esc(label)+'</div>'
      +   '<div style="font-size:26px;font-weight:800;color:#e2e8f0;margin-top:4px">'+val+'</div></div>'
      +   '<div style="width:42px;height:42px;border-radius:10px;background:'+color+'22;color:'+color+';display:flex;align-items:center;justify-content:center;font-size:17px"><i class="fas '+icon+'"></i></div>'
      + '</div></div>';
  }

  // Small wrapper card
  function card(titleHtml, bodyHtml, extra){
    return '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:18px;'+(extra||'')+'">'
      + (titleHtml ? '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px">'+titleHtml+'</div>' : '')
      + bodyHtml
      + '</div>';
  }

  // ---------- DASHBOARD ----------
  function renderDashboard(){
    var a    = window.AGENT_PORTAL_STATE.currentAgent;
    var apps = appsFor(a.id);
    var active   = apps.filter(function(x){ return ['applied','offer','cas','visa'].indexOf(x.stage)>=0; }).length;
    var enrolled = countStage(apps,'enrolled');
    var conv     = apps.length ? Math.round(enrolled/apps.length*100) : 0;
    var recent   = apps.slice().sort(function(x,y){ return (y.updated||'').localeCompare(x.updated||''); }).slice(0,5);

    var heroAv = (a.avatar||'#f59e0b,#b45309').split(',');
    var html = '';

    html += '<div style="background:linear-gradient(135deg,'+heroAv[0]+','+heroAv[1]+');border-radius:14px;padding:22px 26px;margin-bottom:20px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:20px;box-shadow:0 10px 30px rgba(180,83,9,0.4)">'
      + '<div><div style="font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;opacity:0.85">Welcome, partner</div>'
      + '<div style="font-size:24px;font-weight:800;margin-top:2px">'+esc(a.contactName)+'</div>'
      + '<div style="font-size:13px;opacity:0.9;margin-top:4px">'+esc(a.name)+' &middot; '+esc(a.city)+' &middot; '+esc(a.country)+'</div></div>'
      + '<div style="text-align:right"><div style="font-size:11px;font-weight:700;opacity:0.85">Partner since</div>'
      + '<div style="font-size:17px;font-weight:800">'+esc(a.joined)+'</div>'
      + '<div style="margin-top:6px;font-size:11.5px;background:rgba(255,255,255,0.22);padding:3px 12px;border-radius:999px;display:inline-block;font-weight:700">Commission rate '+a.commissionRate+'%</div></div>'
      + '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">'
      + kpi('Total Submissions', apps.length, 'fa-paper-plane', '#0ea5e9')
      + kpi('Active Pipeline',   active,      'fa-spinner',     '#8b5cf6')
      + kpi('Enrolled',          enrolled,    'fa-graduation-cap', '#10b981')
      + kpi('Conversion Rate',   conv+'%',    'fa-chart-line', '#f59e0b')
      + '</div>';

    html += '<div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">';

    // Recent activity
    var recentBody;
    if (recent.length === 0){
      recentBody = '<div style="padding:30px;text-align:center;color:#94a3b8">No applications yet — use Submit Application to get started.</div>';
    } else {
      recentBody = '<table style="width:100%;border-collapse:collapse;font-size:12.5px">'
        + '<thead><tr style="text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #1e293b">'
        +   '<th style="padding:8px 6px">App ID</th><th style="padding:8px 6px">Student</th><th style="padding:8px 6px">Course / Uni</th><th style="padding:8px 6px">Stage</th><th style="padding:8px 6px">Updated</th>'
        + '</tr></thead><tbody>'
        + recent.map(function(x){
            return '<tr style="border-bottom:1px solid #1e293b">'
              + '<td style="padding:8px 6px;font-family:monospace;font-size:11px">'+esc(x.id)+'</td>'
              + '<td style="padding:8px 6px;font-weight:600">'+esc(x.studentName)+'</td>'
              + '<td style="padding:8px 6px;font-size:12px">'+esc(x.course)+' — '+esc(x.uni)+'</td>'
              + '<td style="padding:8px 6px">'+stageBadge(x.stage)+'</td>'
              + '<td style="padding:8px 6px;font-size:11.5px;color:#94a3b8">'+esc(x.updated)+'</td>'
              + '</tr>';
          }).join('')
        + '</tbody></table>';
    }
    html += card(
      '<div><div style="font-size:14.5px;font-weight:800"><i class="fas fa-history"></i> Recent Activity</div></div>'
        + '<button onclick="agentNav(\'applications\')" style="padding:6px 12px;border-radius:7px;font-size:11.5px;font-weight:700;border:1px solid #334155;background:transparent;color:#e2e8f0;cursor:pointer">View all</button>',
      recentBody);

    // Commission summary
    html += card(
      '<div style="font-size:14.5px;font-weight:800"><i class="fas fa-coins" style="color:#f59e0b"></i> Commissions</div>',
      '<div style="font-size:12px;color:#94a3b8;margin-bottom:4px">Pending payout</div>'
      + '<div style="font-size:24px;font-weight:800;font-family:\'DM Mono\',monospace;color:#16a34a">LKR '+Number(a.pendingCommission||0).toLocaleString('en-LK')+'</div>'
      + '<div style="font-size:11px;color:#94a3b8;margin-top:4px">Across '+enrolled+' enrolled student(s)</div>'
      + '<button onclick="agentNav(\'commissions\')" style="margin-top:14px;width:100%;padding:9px 12px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;border:0;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-file-invoice-dollar"></i> Open commission ledger</button>'
    );

    html += '</div>';

    // Quick actions
    html += card(
      '<div style="font-size:14.5px;font-weight:800"><i class="fas fa-bolt" style="color:#f59e0b"></i> Quick Actions</div>',
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">'
      + qaBtn('Submit Application', 'fa-plus-circle', 'agentNav(\'submit\')', true)
      + qaBtn('My Students',        'fa-user-graduate', 'agentNav(\'students\')')
      + qaBtn('Upload Documents',   'fa-cloud-upload-alt', 'agentNav(\'documents\')')
      + qaBtn('Change Password',    'fa-key', 'agentNav(\'profile\')')
      + '</div>',
      'margin-top:18px');

    return html;
  }
  function qaBtn(label, icon, onclick, primary){
    var bg = primary ? 'linear-gradient(135deg,#f59e0b,#b45309)' : '#1e293b';
    var col = '#fff';
    return '<button onclick="'+onclick+'" style="padding:14px;border-radius:9px;background:'+bg+';color:'+col+';border:0;font-weight:700;cursor:pointer;font-family:inherit;font-size:12.5px;text-align:left"><i class="fas '+icon+'"></i> '+label+'</button>';
  }

  // ---------- STUDENTS ----------
  function renderStudents(){
    var a = window.AGENT_PORTAL_STATE.currentAgent;
    var apps = appsFor(a.id);
    var seen = {};
    var students = [];
    apps.forEach(function(x){ if (!seen[x.studentName]){ seen[x.studentName]=true; students.push(x); } });

    var head = '<div><div style="font-size:14.5px;font-weight:800"><i class="fas fa-user-graduate" style="color:#0ea5e9"></i> My Students</div>'
      + '<div style="font-size:11.5px;color:#94a3b8;margin-top:2px">'+students.length+' unique student'+(students.length===1?'':'s')+'</div></div>'
      + '<button onclick="agentNav(\'submit\')" style="padding:8px 14px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;border:0;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-plus"></i> Add new student</button>';

    var body;
    if (students.length === 0){
      body = '<div style="padding:40px;text-align:center;color:#94a3b8">No students yet. Submit your first application.</div>';
    } else {
      body = '<table style="width:100%;border-collapse:collapse;font-size:12.5px">'
        + '<thead><tr style="text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #1e293b">'
        + '<th style="padding:8px 6px">Student</th><th style="padding:8px 6px">Contact</th><th style="padding:8px 6px">Destination</th><th style="padding:8px 6px">Latest Course</th><th style="padding:8px 6px">Latest Stage</th><th></th></tr></thead><tbody>'
        + students.map(function(s){
            return '<tr style="border-bottom:1px solid #1e293b">'
              + '<td style="padding:9px 6px;font-weight:600">'+esc(s.studentName)+'</td>'
              + '<td style="padding:9px 6px;font-size:11.5px;color:#94a3b8"><div>'+esc(s.email)+'</div><div>'+esc(s.phone)+'</div></td>'
              + '<td style="padding:9px 6px">'+esc(s.dest)+'</td>'
              + '<td style="padding:9px 6px"><div>'+esc(s.course)+'</div><div style="font-size:10.5px;color:#94a3b8">'+esc(s.uni)+'</div></td>'
              + '<td style="padding:9px 6px">'+stageBadge(s.stage)+'</td>'
              + '<td style="padding:9px 6px"><button onclick="agentViewApp(\''+esc(s.id)+'\')" style="padding:5px 10px;border-radius:7px;background:#1e293b;color:#e2e8f0;border:0;cursor:pointer"><i class="fas fa-eye"></i></button></td>'
              + '</tr>';
          }).join('')
        + '</tbody></table>';
    }
    return card(head, body);
  }

  // ---------- SUBMIT NEW APPLICATION ----------
  function renderSubmitForm(){
    var head = '<div style="font-size:14.5px;font-weight:800"><i class="fas fa-paper-plane" style="color:#0ea5e9"></i> Submit New Application</div>';
    var body = ''
      + '<div style="font-size:12.5px;color:#94a3b8;margin-bottom:18px">File a new student application to Global Guidance. We will assign a counsellor and confirm receipt within 24 hours.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px">'
      +   inputBlock('Student full name *',   'agSubName',     'e.g. Tharindu Bandara')
      +   inputBlock('Date of birth',         'agSubDob',      '', 'date')
      +   inputBlock('Email *',               'agSubEmail',    'student@example.com', 'email')
      +   inputBlock('Phone *',               'agSubPhone',    '+94 ...')
      +   inputBlock('Passport number',       'agSubPassport', 'N1234567')
      +   '<div>'
      +     '<label style="display:block;font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Destination country *</label>'
      +     '<select id="agSubDest" style="width:100%;padding:9px 11px;border-radius:7px;background:#0b1220;color:#e2e8f0;border:1px solid #334155;font-family:inherit">'
      +       '<option>\uD83C\uDDEC\uD83C\uDDE7 United Kingdom</option><option>\uD83C\uDDE8\uD83C\uDDE6 Canada</option><option>\uD83C\uDDE6\uD83C\uDDFA Australia</option><option>\uD83C\uDDE9\uD83C\uDDEA Germany</option><option>\uD83C\uDDEE\uD83C\uDDEA Ireland</option><option>\uD83C\uDDF3\uD83C\uDDFF New Zealand</option>'
      +     '</select>'
      +   '</div>'
      +   inputBlock('Intended course *',     'agSubCourse',   'e.g. Business Management MSc')
      +   inputBlock('Preferred university',  'agSubUni',      'e.g. Coventry University')
      +   '<div>'
      +     '<label style="display:block;font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Intended intake</label>'
      +     '<select id="agSubIntake" style="width:100%;padding:9px 11px;border-radius:7px;background:#0b1220;color:#e2e8f0;border:1px solid #334155;font-family:inherit">'
      +       '<option>Jan 2026</option><option>May 2026</option><option>Sept 2026</option><option>Jan 2027</option>'
      +     '</select>'
      +   '</div>'
      +   inputBlock('IELTS / English score', 'agSubIelts',    'e.g. 6.5')
      +   '<div style="grid-column:1/-1"><label style="display:block;font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Academic background</label><textarea id="agSubAcademic" rows="2" placeholder="Highest qualification, percentage / GPA, year of completion" style="width:100%;padding:9px 11px;border-radius:7px;background:#0b1220;color:#e2e8f0;border:1px solid #334155;font-family:inherit;resize:vertical"></textarea></div>'
      +   '<div style="grid-column:1/-1"><label style="display:block;font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Notes / special requests</label><textarea id="agSubNotes" rows="2" placeholder="Anything our admissions team should know" style="width:100%;padding:9px 11px;border-radius:7px;background:#0b1220;color:#e2e8f0;border:1px solid #334155;font-family:inherit;resize:vertical"></textarea></div>'
      + '</div>'
      + '<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:9px;padding:11px 14px;margin:16px 0;font-size:12px;color:#e2e8f0"><i class="fas fa-info-circle" style="color:#f59e0b"></i> By submitting you confirm the student consented to share their details. Documents (passport, transcripts, IELTS, SOP) can be uploaded under <b>Documents</b> after submission.</div>'
      + '<div style="display:flex;justify-content:flex-end;gap:10px">'
      +   '<button onclick="agentNav(\'dashboard\')" style="padding:10px 18px;border-radius:8px;background:#1e293b;color:#e2e8f0;border:0;font-weight:700;cursor:pointer;font-family:inherit">Cancel</button>'
      +   '<button onclick="agentSubmitApplication()" style="padding:10px 18px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;border:0;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-paper-plane"></i> Submit Application</button>'
      + '</div>';
    return card(head, body, 'max-width:980px;margin:0 auto');
  }
  function inputBlock(label, id, ph, type){
    return '<div><label style="display:block;font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">'+esc(label)+'</label>'
      + '<input id="'+esc(id)+'" type="'+(type||'text')+'" placeholder="'+esc(ph||'')+'" style="width:100%;padding:9px 11px;border-radius:7px;background:#0b1220;color:#e2e8f0;border:1px solid #334155;font-family:inherit;box-sizing:border-box"></div>';
  }

  window.agentSubmitApplication = function(){
    var a = window.AGENT_PORTAL_STATE.currentAgent;
    var v = function(id){ var el = document.getElementById(id); return el ? el.value : ''; };
    var name   = v('agSubName').trim();
    var email  = v('agSubEmail').trim();
    var phone  = v('agSubPhone').trim();
    var dest   = v('agSubDest');
    var course = v('agSubCourse').trim();
    var uni    = v('agSubUni').trim();
    var intake = v('agSubIntake');
    var notes  = v('agSubNotes').trim();
    if (!name || !email || !phone || !course){
      toast('<i class="fas fa-exclamation-triangle"></i> Please fill in at least student name, email, phone, and course.', 'error');
      return;
    }
    var next = ((window.AGENT_APPLICATIONS||[]).length + 110);
    var today = new Date().toISOString().slice(0,10);
    var newApp = {
      id: 'GG-AP-2026-0' + next, agentId: a.id, studentName: name, email: email, phone: phone,
      dest: dest, course: course, uni: uni || '—', intake: intake,
      stage: 'applied', submitted: today, updated: today,
      commission: '—', notes: notes || 'Awaiting admissions review.'
    };
    (window.AGENT_APPLICATIONS || (window.AGENT_APPLICATIONS=[])).unshift(newApp);
    toast('<i class="fas fa-check-circle"></i> Application '+esc(newApp.id)+' submitted! Admissions will email within 24h.');
    window.agentNav('applications');
  };

  // ---------- APPLICATIONS ----------
  function renderApplications(){
    var a = window.AGENT_PORTAL_STATE.currentAgent;
    var apps = appsFor(a.id);
    var stage = window.AGENT_PORTAL_STATE.filterStage || 'all';
    var search = (window.AGENT_PORTAL_STATE.searchTerm||'').toLowerCase();
    var filtered = apps.filter(function(x){
      if (stage !== 'all' && x.stage !== stage) return false;
      if (search){
        var hay = (x.studentName+' '+x.course+' '+x.uni+' '+x.id).toLowerCase();
        if (hay.indexOf(search) < 0) return false;
      }
      return true;
    });
    var stages = ['all','applied','offer','cas','visa','enrolled','dropped'];

    var head = '<div><div style="font-size:14.5px;font-weight:800"><i class="fas fa-folder-open" style="color:#0ea5e9"></i> My Applications</div>'
      + '<div style="font-size:11.5px;color:#94a3b8;margin-top:2px">'+filtered.length+' of '+apps.length+' application'+(apps.length===1?'':'s')+'</div></div>'
      + '<button onclick="agentNav(\'submit\')" style="padding:8px 14px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;border:0;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-plus"></i> New application</button>';

    var body = '<div style="display:flex;gap:10px;margin-bottom:14px;align-items:center;flex-wrap:wrap">'
      + '<input id="agSearchInput" placeholder="Search by student name, course, or app ID..." value="'+esc(window.AGENT_PORTAL_STATE.searchTerm||'')+'" style="flex:1;min-width:220px;padding:9px 12px;border-radius:7px;background:#0b1220;color:#e2e8f0;border:1px solid #334155;font-family:inherit" oninput="AGENT_PORTAL_STATE.searchTerm=this.value;agentNav(\'applications\');var i=document.getElementById(\'agSearchInput\');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}">'
      + '<div style="display:flex;gap:5px;flex-wrap:wrap">'
      +   stages.map(function(s){
            var active = s === stage;
            var lbl = s === 'all' ? 'All' : s.charAt(0).toUpperCase()+s.slice(1);
            return '<button onclick="AGENT_PORTAL_STATE.filterStage=\''+s+'\';agentNav(\'applications\')" style="padding:6px 12px;border-radius:7px;font-size:11.5px;font-weight:700;border:1px solid '+(active?'#f59e0b':'#334155')+';background:'+(active?'#f59e0b':'transparent')+';color:'+(active?'#fff':'#e2e8f0')+';cursor:pointer;font-family:inherit">'+lbl+'</button>';
          }).join('')
      + '</div></div>';

    if (filtered.length === 0){
      body += '<div style="padding:40px;text-align:center;color:#94a3b8">No applications match your filter.</div>';
    } else {
      body += '<table style="width:100%;border-collapse:collapse;font-size:12.5px">'
        + '<thead><tr style="text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #1e293b">'
        + '<th style="padding:8px 6px">App ID</th><th style="padding:8px 6px">Student</th><th style="padding:8px 6px">Course / Uni</th><th style="padding:8px 6px">Intake</th><th style="padding:8px 6px">Stage</th><th style="padding:8px 6px">Submitted</th><th style="padding:8px 6px">Commission</th><th></th></tr></thead><tbody>'
        + filtered.map(function(x){
            return '<tr style="border-bottom:1px solid #1e293b">'
              + '<td style="padding:9px 6px;font-family:monospace;font-size:11.5px">'+esc(x.id)+'</td>'
              + '<td style="padding:9px 6px"><div style="font-weight:600">'+esc(x.studentName)+'</div><div style="font-size:10.5px;color:#94a3b8">'+esc(x.dest)+'</div></td>'
              + '<td style="padding:9px 6px"><div>'+esc(x.course)+'</div><div style="font-size:10.5px;color:#94a3b8">'+esc(x.uni)+'</div></td>'
              + '<td style="padding:9px 6px;font-size:11.5px">'+esc(x.intake)+'</td>'
              + '<td style="padding:9px 6px">'+stageBadge(x.stage)+'</td>'
              + '<td style="padding:9px 6px;font-size:11px;color:#94a3b8">'+esc(x.submitted)+'</td>'
              + '<td style="padding:9px 6px;font-size:11.5px;font-family:\'DM Mono\',monospace;font-weight:700">'+esc(x.commission)+'</td>'
              + '<td style="padding:9px 6px"><button onclick="agentViewApp(\''+esc(x.id)+'\')" style="padding:5px 10px;border-radius:7px;background:#1e293b;color:#e2e8f0;border:0;cursor:pointer"><i class="fas fa-eye"></i></button></td>'
              + '</tr>';
          }).join('')
        + '</tbody></table>';
    }
    return card(head, body);
  }

  window.agentViewApp = function(id){
    var x = (window.AGENT_APPLICATIONS||[]).find(function(a){ return a.id === id; });
    if (!x) return;
    var m = document.createElement('div');
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    m.onclick = function(e){ if (e.target === m) m.remove(); };
    m.innerHTML = '<div style="background:#0f172a;color:#e2e8f0;border-radius:14px;max-width:640px;width:100%;padding:24px;border:1px solid #1e293b;max-height:90vh;overflow:auto">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;gap:12px"><div><div style="font-family:monospace;font-size:11.5px;color:#94a3b8">'+esc(x.id)+'</div><div style="font-size:20px;font-weight:800;margin-top:2px">'+esc(x.studentName)+'</div></div>'
      + '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="padding:6px 12px;border-radius:7px;background:#1e293b;color:#e2e8f0;border:0;font-weight:700;cursor:pointer">Close</button></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">'
      + detailItem('Stage', stageBadge(x.stage))
      + detailItem('Commission', '<span style="font-family:monospace;font-weight:700">'+esc(x.commission)+'</span>')
      + detailItem('Email', esc(x.email))
      + detailItem('Phone', esc(x.phone))
      + detailItem('Course', esc(x.course))
      + detailItem('University', esc(x.uni))
      + detailItem('Destination', esc(x.dest))
      + detailItem('Intake', esc(x.intake))
      + detailItem('Submitted', esc(x.submitted))
      + detailItem('Last Updated', esc(x.updated))
      + '</div>'
      + '<div><div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:4px">Notes from admissions</div>'
      + '<div style="background:#0b1220;padding:11px 13px;border-radius:8px;font-size:12.5px;line-height:1.5;border:1px solid #1e293b">'+esc(x.notes||'No notes yet.')+'</div></div>'
      + '</div>';
    document.body.appendChild(m);
  };
  function detailItem(label, valHtml){
    return '<div><div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase">'+esc(label)+'</div><div style="margin-top:3px">'+valHtml+'</div></div>';
  }

  // ---------- DOCUMENTS ----------
  function renderDocuments(){
    var a = window.AGENT_PORTAL_STATE.currentAgent;
    var apps = appsFor(a.id);
    var docTypes = [
      { name:'Passport bio page',    icon:'fa-passport', required:true },
      { name:'Academic transcripts', icon:'fa-graduation-cap', required:true },
      { name:'IELTS / English test', icon:'fa-language', required:true },
      { name:'Statement of Purpose', icon:'fa-file-alt', required:true },
      { name:'Bank statement',       icon:'fa-university', required:true },
      { name:'CV / Resume',          icon:'fa-id-card',  required:false },
      { name:'Reference letters',    icon:'fa-envelope', required:false },
      { name:'Other supporting docs',icon:'fa-paperclip', required:false }
    ];

    var head = '<div><div style="font-size:14.5px;font-weight:800"><i class="fas fa-file-alt" style="color:#0ea5e9"></i> Document Vault</div><div style="font-size:11.5px;color:#94a3b8;margin-top:2px">PDF, JPG, PNG (max 20MB each)</div></div>';

    var body;
    if (apps.length === 0){
      body = '<div style="padding:40px;text-align:center;color:#94a3b8">No applications yet. Submit a student first.</div>';
    } else {
      body = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">'
        + apps.map(function(x){
            return '<button onclick="agentOpenDocsFor(\''+esc(x.id)+'\')" style="text-align:left;padding:12px 14px;min-width:240px;border-radius:9px;background:#1e293b;color:#e2e8f0;border:0;cursor:pointer;font-family:inherit">'
              + '<div style="font-weight:700;font-size:13px">'+esc(x.studentName)+'</div>'
              + '<div style="font-size:11px;color:#94a3b8;margin-top:2px">'+esc(x.id)+' &middot; '+esc(x.course)+'</div></button>';
          }).join('') + '</div>'
        + '<div style="background:#0b1220;border-radius:10px;padding:16px;border:1px solid #1e293b">'
        +   '<div style="font-size:12px;font-weight:700;margin-bottom:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em">Required Document Types</div>'
        +   '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">'
        +     docTypes.map(function(d){
                return '<div style="display:flex;align-items:center;gap:9px;padding:9px 12px;background:#0f172a;border-radius:7px;border:1px solid #1e293b"><i class="fas '+d.icon+'" style="color:#f59e0b;width:18px"></i><div style="flex:1"><div style="font-size:12.5px;font-weight:600">'+esc(d.name)+'</div><div style="font-size:10.5px;color:#94a3b8">'+(d.required ? 'Required for visa' : 'Optional')+'</div></div></div>';
              }).join('')
        +   '</div></div>';
    }
    return card(head, body);
  }
  window.agentOpenDocsFor = function(appId){
    var input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'application/pdf,image/*';
    input.onchange = function(){
      var n = input.files ? input.files.length : 0;
      if (!n) return;
      toast('<i class="fas fa-cloud-upload-alt"></i> '+n+' file'+(n===1?'':'s')+' queued for '+esc(appId)+'. Upload will complete once finance approves.');
    };
    input.click();
  };

  // ---------- COMMISSIONS ----------
  function renderCommissions(){
    var a = window.AGENT_PORTAL_STATE.currentAgent;
    var apps = appsFor(a.id);
    var enrolled   = apps.filter(function(x){ return x.stage === 'enrolled'; });
    var inPipeline = apps.filter(function(x){ return ['cas','visa'].indexOf(x.stage) >= 0; });

    var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px">'
      + kpi('Pending payout (LKR)', Number(a.pendingCommission||0).toLocaleString('en-LK'), 'fa-coins', '#16a34a')
      + kpi('Ready to invoice', enrolled.length, 'fa-file-invoice-dollar', '#0ea5e9')
      + kpi('In pipeline', inPipeline.length, 'fa-spinner', '#f59e0b')
      + '</div>';

    var head = '<div><div style="font-size:14.5px;font-weight:800"><i class="fas fa-coins" style="color:#f59e0b"></i> Commission Ledger</div>'
      + '<div style="font-size:11.5px;color:#94a3b8;margin-top:2px">'+a.commissionRate+'% rate &middot; paid 30 days after enrolment confirmation</div></div>'
      + '<button onclick="agentRequestInvoice()" style="padding:8px 14px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;border:0;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-file-invoice-dollar"></i> Request Invoice</button>';

    var body;
    if (apps.length === 0){
      body = '<div style="padding:40px;text-align:center;color:#94a3b8">No commission entries yet.</div>';
    } else {
      body = '<table style="width:100%;border-collapse:collapse;font-size:12.5px">'
        + '<thead><tr style="text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #1e293b">'
        + '<th style="padding:8px 6px">App ID</th><th style="padding:8px 6px">Student</th><th style="padding:8px 6px">University</th><th style="padding:8px 6px">Stage</th><th style="padding:8px 6px">Commission</th><th style="padding:8px 6px">Status</th></tr></thead><tbody>'
        + apps.map(function(x){
            var stat = x.stage === 'enrolled' ? '<span style="color:#16a34a;font-weight:700"><i class="fas fa-check-circle"></i> Ready to invoice</span>'
                     : (x.stage === 'dropped' ? '<span style="color:#dc2626"><i class="fas fa-times"></i> No commission</span>'
                     : '<span style="color:#94a3b8"><i class="fas fa-hourglass-half"></i> Pending student arrival</span>');
            return '<tr style="border-bottom:1px solid #1e293b">'
              + '<td style="padding:9px 6px;font-family:monospace;font-size:11.5px">'+esc(x.id)+'</td>'
              + '<td style="padding:9px 6px;font-weight:600">'+esc(x.studentName)+'</td>'
              + '<td style="padding:9px 6px">'+esc(x.uni)+'</td>'
              + '<td style="padding:9px 6px">'+stageBadge(x.stage)+'</td>'
              + '<td style="padding:9px 6px;font-family:monospace;font-weight:700">'+esc(x.commission)+'</td>'
              + '<td style="padding:9px 6px;font-size:11.5px">'+stat+'</td>'
              + '</tr>';
          }).join('')
        + '</tbody></table>';
    }
    html += card(head, body);
    return html;
  }
  window.agentRequestInvoice = function(){
    toast('<i class="fas fa-envelope"></i> Invoice request sent to accounts@global-guidance.lk. Finance will respond within 48h.');
  };

  // ---------- MESSAGES ----------
  function renderMessages(){
    var msgs = [
      { from:'Razan Thawus',  role:'Head BD/Visa', when:'2 hours ago', subj:'CAS issued for Pavithra', body:'Hi! CAS letter for Pavithra Senanayake has been issued. Please collect from the portal. Visa appointment is on Jan 18.' },
      { from:'Thasbiha S.',   role:'Head Admissions', when:'Yesterday', subj:'Anika Mahalingam — IELTS update needed', body:'Could you please share Anika\'s latest IELTS score certificate? The university is asking for a 6.5 minimum.' },
      { from:'Nashif Razzak', role:'CEO',         when:'3 days ago', subj:'Commission rate review', body:'Congrats on hitting 18 enrolments this year. We are reviewing your tier — possible upgrade to Platinum at our partnership meeting.' }
    ];
    var head = '<div style="font-size:14.5px;font-weight:800"><i class="fas fa-comments" style="color:#0ea5e9"></i> Messages from Global Guidance</div>';
    var body = msgs.map(function(m){
      return '<div style="padding:14px 16px;background:#0b1220;border:1px solid #1e293b;border-radius:9px;margin-bottom:10px">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">'
        + '<div><div style="font-weight:700;font-size:13.5px">'+esc(m.from)+'</div><div style="font-size:11px;color:#94a3b8">'+esc(m.role)+'</div></div>'
        + '<div style="font-size:11px;color:#94a3b8">'+esc(m.when)+'</div>'
        + '</div>'
        + '<div style="font-size:13px;font-weight:700;margin-bottom:4px">'+esc(m.subj)+'</div>'
        + '<div style="font-size:12.5px;line-height:1.5;color:#cbd5e1">'+esc(m.body)+'</div>'
        + '<div style="margin-top:9px"><button onclick="agentReply(\''+esc(m.from)+'\')" style="padding:6px 12px;border-radius:7px;background:#1e293b;color:#e2e8f0;border:0;font-weight:700;cursor:pointer;font-size:11.5px"><i class="fas fa-reply"></i> Reply</button></div>'
        + '</div>';
    }).join('');
    return card(head, body);
  }
  window.agentReply = function(to){
    var txt = prompt('Reply to '+to+':');
    if (txt && txt.trim()) toast('<i class="fas fa-paper-plane"></i> Reply sent to '+esc(to)+'.');
  };

  // ---------- PROFILE & PASSWORD ----------
  function renderProfile(){
    var a = window.AGENT_PORTAL_STATE.currentAgent;
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
      + card(
          '<div style="font-size:14.5px;font-weight:800"><i class="fas fa-id-badge" style="color:#0ea5e9"></i> Agency Details</div>',
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
          + inputBlockVal('Agency name', 'agProfName', a.name)
          + inputBlockVal('Primary contact', 'agProfContact', a.contactName)
          + inputBlockVal('Email', 'agProfEmail', a.email)
          + inputBlockVal('Phone', 'agProfPhone', a.phone)
          + inputBlockVal('City', 'agProfCity', a.city)
          + inputBlockVal('Country', 'agProfCountry', a.country, true)
          + '</div>'
          + '<button onclick="agentProfileSave()" style="margin-top:14px;padding:10px 18px;border-radius:8px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;border:0;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-save"></i> Save changes</button>'
        )
      + card(
          '<div style="font-size:14.5px;font-weight:800"><i class="fas fa-key" style="color:#f59e0b"></i> Change Password</div>',
          inputBlock('Current password', 'agPwOld', 'Enter current password', 'password')
          + inputBlock('New password',    'agPwNew', 'Min 8 characters', 'password')
          + inputBlock('Confirm new password', 'agPwConfirm', 'Re-enter new password', 'password')
          + '<div style="font-size:11px;color:#94a3b8;background:#0b1220;padding:9px 12px;border-radius:7px;margin:10px 0;border:1px solid #1e293b"><i class="fas fa-info-circle"></i> Default password is <b>Agent@Global2026</b>. Use at least 8 characters mixing letters and numbers.</div>'
          + '<button onclick="agentChangePassword()" style="padding:10px 18px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;border:0;font-weight:700;cursor:pointer;font-family:inherit"><i class="fas fa-shield-alt"></i> Update password</button>'
        )
      + '</div>';

    html += card(
      '<div style="font-size:14.5px;font-weight:800;margin-bottom:10px"><i class="fas fa-handshake" style="color:#0ea5e9"></i> Partnership Stats</div>',
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">'
      + statBox('Tier',        a.tier,            tierColor(a.tier))
      + statBox('Commission',  a.commissionRate+'%', '#16a34a')
      + statBox('Submissions', a.totalSubmissions,'#0ea5e9')
      + statBox('Conversions', a.conversions,     '#f59e0b')
      + '</div>',
      'margin-top:18px'
    );
    return html;
  }
  function inputBlockVal(label, id, val, readonly){
    return '<div><label style="display:block;font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">'+esc(label)+'</label>'
      + '<input id="'+esc(id)+'" value="'+esc(val||'')+'"'+(readonly?' readonly':'')+' style="width:100%;padding:9px 11px;border-radius:7px;background:#0b1220;color:#e2e8f0;border:1px solid #334155;font-family:inherit;box-sizing:border-box"></div>';
  }
  function statBox(lbl, val, color){
    return '<div style="text-align:center;padding:14px;background:#0b1220;border:1px solid #1e293b;border-radius:9px"><div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase">'+esc(lbl)+'</div><div style="font-size:20px;font-weight:800;color:'+color+';margin-top:4px">'+esc(val)+'</div></div>';
  }

  window.agentProfileSave = function(){
    var a = window.AGENT_PORTAL_STATE.currentAgent;
    var v = function(id){ var el = document.getElementById(id); return el ? el.value : null; };
    a.name        = v('agProfName')    || a.name;
    a.contactName = v('agProfContact') || a.contactName;
    a.email       = v('agProfEmail')   || a.email;
    a.phone       = v('agProfPhone')   || a.phone;
    a.city        = v('agProfCity')    || a.city;
    toast('<i class="fas fa-check-circle"></i> Profile saved.');
  };
  window.agentChangePassword = function(){
    var a = window.AGENT_PORTAL_STATE.currentAgent;
    var v = function(id){ var el = document.getElementById(id); return el ? el.value : ''; };
    var oldP = v('agPwOld'), newP = v('agPwNew'), cfm = v('agPwConfirm');
    var expected = window.agentPasswordFor(a.username);
    if (oldP !== expected){ toast('<i class="fas fa-times-circle"></i> Current password is wrong.', 'error'); return; }
    if (!newP || newP.length < 8){ toast('<i class="fas fa-exclamation-triangle"></i> New password must be 8+ characters.', 'error'); return; }
    if (newP !== cfm){ toast('<i class="fas fa-exclamation-triangle"></i> Passwords do not match.', 'error'); return; }
    try {
      var ov = JSON.parse(localStorage.getItem('gg-pw-overrides') || '{}');
      ov['agent:'+a.username] = newP;
      localStorage.setItem('gg-pw-overrides', JSON.stringify(ov));
    } catch(e){ toast('Could not save: '+e.message, 'error'); return; }
    ['agPwOld','agPwNew','agPwConfirm'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
    toast('<i class="fas fa-shield-alt"></i> Password updated. Use it next time you sign in.');
  };

  console.log('[Agent Portal v14] loaded. Agents:', (window.AGENTS_DATA||[]).length, 'Applications:', (window.AGENT_APPLICATIONS||[]).length);
})();
