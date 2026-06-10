// Global Guidance HR System v4.0 - Zero-build Node.js server
// Run with: node server.js
// Requires: node server.js (Node.js 16+ only, no npm install needed for basic mode)

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const HTML = fs.readFileSync(path.join(__dirname, 'src/template.html'), 'utf8');

// ─── IN-MEMORY STATE ────────────────────────────────────────────────────────
let LEADS = [
  { id:1, name:'Priya Nair', email:'priya@email.com', phone:'+94771111001', country:'Sri Lanka', studyDestination:'UK', studyLevel:'PG', studyField:'Business Management', intakePeriod:'September 2026', source:'Instagram', status:'qualified', journeyStage:3, aiScore:82, assignedCounselor:'Thasbiha S.', notes:[], documents:[], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { id:2, name:'Sahan Fernando', email:'sahan@email.com', phone:'+94772222002', country:'Sri Lanka', studyDestination:'UK', studyLevel:'UG', studyField:'Computer Science', intakePeriod:'January 2026', source:'Walk-in', status:'application', journeyStage:4, aiScore:91, assignedCounselor:'Sukaina', notes:[], documents:['passport.pdf','degree.pdf'], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { id:3, name:'Amali Wickramasinghe', email:'amali@email.com', phone:'+94773333003', country:'Sri Lanka', studyDestination:'Canada', studyLevel:'PG', studyField:'Data Science', intakePeriod:'September 2026', source:'Referral', status:'offer', journeyStage:5, aiScore:95, assignedCounselor:'Thasbiha S.', notes:[], documents:[], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
];
let LEAD_ID = 4;
let MESSAGES = [];
let NOTIFICATIONS = [];
let PAYMENTS = [];
let EMAILS = [];
let AUTO_LEADS = [...LEADS];
let AUTO_LEAD_ID = 4;
let CHAT_SESSIONS = {};

function scoreAI(lead) {
  let s = 50;
  if (lead.ieltsScore) { const v = parseFloat(lead.ieltsScore); if(v>=7.5)s+=20; else if(v>=7)s+=15; else if(v>=6.5)s+=10; else if(v>=6)s+=5; }
  if (lead.studyLevel === 'PG') s += 10;
  if (['Referral','Walk-in'].includes(lead.source)) s += 15;
  else if (['Google','Website'].includes(lead.source)) s += 8;
  return Math.min(100, Math.max(0, s));
}

function chatReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes('ielts')||m.includes('english')) return 'For most UK universities you need IELTS 6.0-6.5 for undergraduate and 6.5-7.0 for postgraduate. Some universities offer English waivers if your previous education was in English. Would you like to know more?';
  if (m.includes('cost')||m.includes('fee')||m.includes('tuition')) return 'UK tuition for international students: £10,000–£35,000/year. Business courses typically £12,000–£20,000. Our service fee is a one-time charge covering the full application. Want a breakdown?';
  if (m.includes('visa')) return 'UK Student Visa requires: CAS letter, financial proof (£1,334/month London), IELTS, and TB test (Sri Lanka applicants). Processing: 3–8 weeks.';
  if (m.includes('universit')) return 'We work with 50+ UK universities: Coventry, DMU, Hertfordshire, Sunderland, UWE and many more. Want me to recommend based on your profile?';
  if (m.includes('intake')||m.includes('when')) return 'UK intakes: September/October (main), January/February (limited), May/June (very limited). For Sep 2026 — apply NOW.';
  if (m.includes('scholarship')) return 'Options: Chevening (fully funded), British Council, university scholarships (10–50% off). Most need strong academics. Want an eligibility check?';
  return 'Thank you! Our counsellors are available Mon–Sat 9AM–6PM. Would you like to fill in the enquiry form so we can contact you with personalised advice?';
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────
function router(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const json = (data, status=200) => {
    res.writeHead(status, {'Content-Type':'application/json'});
    res.end(JSON.stringify(data));
  };

  const body = () => new Promise(resolve => {
    let b = '';
    req.on('data', d => b += d);
    req.on('end', () => { try { resolve(JSON.parse(b||'{}')); } catch(e) { resolve({}); } });
  });

  // ── Serve main app ──
  if (pathname === '/' || pathname === '/dashboard') {
    res.writeHead(200, {'Content-Type':'text/html'});
    return res.end(HTML);
  }

  // ── Favicon ──
  if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }

  // ── Serve static public files ──
  if (pathname.startsWith('/static/')) {
    const fp = path.join(__dirname, 'public', pathname);
    if (fs.existsSync(fp)) {
      const ext = path.extname(fp);
      const mime = {'.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jsx':'application/javascript'}[ext]||'text/plain';
      res.writeHead(200, {'Content-Type':mime});
      return res.end(fs.readFileSync(fp));
    }
  }

  // ── LEADS API ──
  if (pathname === '/api/leads' && method === 'GET') return json(LEADS);
  if (pathname === '/api/leads/stats' && method === 'GET') {
    return json({ total:LEADS.length, qualified:LEADS.filter(l=>l.status==='qualified').length, flagged:0, registered:LEADS.filter(l=>l.status==='registered').length, hotLeads:LEADS.filter(l=>l.aiScore>=80).length, avgScore:LEADS.length?Math.round(LEADS.reduce((s,l)=>s+l.aiScore,0)/LEADS.length):0, byStatus:LEADS.reduce((a,l)=>{a[l.status]=(a[l.status]||0)+1;return a},{}) });
  }
  if (pathname === '/api/leads' && method === 'POST') {
    return body().then(data => { const lead={id:LEAD_ID++,...data,status:data.status||'new',journeyStage:1,aiScore:scoreAI(data),notes:[],documents:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; LEADS.push(lead); json({success:true,lead}); });
  }
  if (pathname.match(/^\/api\/leads\/\d+$/) && method === 'GET') {
    const id=parseInt(pathname.split('/')[3]); const l=LEADS.find(x=>x.id===id); return l?json(l):json({error:'Not found'},404);
  }
  if (pathname.match(/^\/api\/leads\/\d+$/) && method === 'PUT') {
    return body().then(data => { const idx=LEADS.findIndex(l=>l.id===parseInt(pathname.split('/')[3])); if(idx<0)return json({error:'Not found'},404); LEADS[idx]={...LEADS[idx],...data,updatedAt:new Date().toISOString()}; json({success:true,lead:LEADS[idx]}); });
  }
  if (pathname.match(/^\/api\/leads\/\d+$/) && method === 'DELETE') {
    const id=parseInt(pathname.split('/')[3]); LEADS=LEADS.filter(l=>l.id!==id); return json({success:true});
  }

  // ── AUTOMATION LEADS ──
  if (pathname === '/api/auto/leads' && method === 'GET') return json({leads:AUTO_LEADS,total:AUTO_LEADS.length});
  if (pathname === '/api/auto/leads/stats' && method === 'GET') {
    return json({ total:AUTO_LEADS.length, hotLeads:AUTO_LEADS.filter(l=>l.aiScore>=80).length, avgScore:AUTO_LEADS.length?Math.round(AUTO_LEADS.reduce((s,l)=>s+l.aiScore,0)/AUTO_LEADS.length):0, needsFollowUp:AUTO_LEADS.filter(l=>!['enrolled','dropped'].includes(l.status)).length, byStatus:AUTO_LEADS.reduce((a,l)=>{a[l.status]=(a[l.status]||0)+1;return a},{}) });
  }
  if (pathname === '/api/auto/leads' && method === 'POST') {
    return body().then(data => { const id='AL'+String(AUTO_LEAD_ID++).padStart(3,'0'); const lead={id,...data,status:data.status||'new',journeyStage:1,aiScore:scoreAI(data),notes:[],documents:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; AUTO_LEADS.push(lead); json({success:true,lead,emailSent:true}); });
  }
  if (pathname === '/api/auto/capture' && method === 'POST') {
    return body().then(data => { const id='AL'+String(AUTO_LEAD_ID++).padStart(3,'0'); const lead={id,...data,status:'new',journeyStage:1,aiScore:scoreAI(data),notes:[],documents:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; AUTO_LEADS.push(lead); json({success:true,leadId:id,aiScore:lead.aiScore,message:'Thank you! A counsellor will contact you within 24 hours.'}); });
  }
  if (pathname === '/api/auto/pipeline' && method === 'GET') {
    const stageNames=['New Lead','Contacted','Qualified','Application','Offer Received','Visa Prep','Visa Applied','Enrolled'];
    const stages=stageNames.map((name,i)=>({id:i+1,name,count:AUTO_LEADS.filter(l=>l.journeyStage===i+1).length}));
    return json({stages,leads:AUTO_LEADS});
  }
  if (pathname.match(/^\/api\/auto\/leads\/[^/]+\/advance$/) && method === 'POST') {
    const id=pathname.split('/')[4]; const lead=AUTO_LEADS.find(l=>l.id===id); if(!lead)return json({error:'Not found'},404);
    lead.journeyStage=Math.min(8,lead.journeyStage+1); lead.updatedAt=new Date().toISOString();
    return json({success:true,lead,emailSent:true});
  }
  if (pathname.match(/^\/api\/auto\/leads\/[^/]+$/) && method === 'PUT') {
    return body().then(data => { const id=pathname.split('/')[4]; const idx=AUTO_LEADS.findIndex(l=>l.id===id); if(idx<0)return json({error:'Not found'},404); AUTO_LEADS[idx]={...AUTO_LEADS[idx],...data,updatedAt:new Date().toISOString()}; json({success:true,lead:AUTO_LEADS[idx]}); });
  }

  // ── MESSAGES ──
  if (pathname === '/api/messages' && method === 'GET') return json({messages:MESSAGES,timestamp:Date.now(),total:MESSAGES.length});
  if (pathname === '/api/messages' && method === 'POST') {
    return body().then(data => { const msg={...data,id:Date.now()+Math.random(),serverTimestamp:Date.now(),delivered:true,readBy:[]}; MESSAGES.push(msg); if(MESSAGES.length>500)MESSAGES.shift(); json({success:true,message:msg}); });
  }

  // ── NOTIFICATIONS ──
  if (pathname === '/api/notifications' && method === 'GET') return json(NOTIFICATIONS.slice(-50));
  if (pathname === '/api/notifications' && method === 'POST') {
    return body().then(data => { const n={id:Date.now()+Math.random(),...data,read:[],timestamp:Date.now(),createdAt:new Date().toISOString()}; NOTIFICATIONS.push(n); json({success:true,notification:n}); });
  }
  if (pathname.match(/^\/api\/notifications\/.+\/read$/) && method === 'POST') return json({success:true});
  if (pathname === '/api/notifications/read-all' && method === 'POST') return json({success:true});
  if (pathname === '/api/notifications/clear-all' && method === 'POST') { NOTIFICATIONS=[]; return json({success:true}); }

  // ── PAYMENTS ──
  if (pathname === '/api/auto/payments' && method === 'GET') return json(PAYMENTS);
  if (pathname === '/api/auto/payments/stats' && method === 'GET') {
    const toGBP={LKR:1/380,GBP:1,USD:0.79};
    const total=PAYMENTS.reduce((s,p)=>s+p.amount*(toGBP[p.currency]||1),0);
    const paid=PAYMENTS.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount*(toGBP[p.currency]||1),0);
    return json({total,paid,pending:total-paid,overdue:PAYMENTS.filter(p=>p.status==='overdue').length,count:PAYMENTS.length});
  }
  if (pathname === '/api/auto/payments' && method === 'POST') {
    return body().then(data => { const p={id:'PAY'+String(PAYMENTS.length+1).padStart(3,'0'),...data,status:'pending',invoiceNumber:'GG-'+new Date().getFullYear()+'-'+String(PAYMENTS.length+1).padStart(3,'0'),createdAt:new Date().toISOString()}; PAYMENTS.push(p); json({success:true,payment:p}); });
  }
  if (pathname.match(/^\/api\/auto\/payments\/.+$/) && method === 'PUT') {
    return body().then(data => { const id=pathname.split('/')[4]; const p=PAYMENTS.find(x=>x.id===id); if(!p)return json({error:'Not found'},404); Object.assign(p,data); if(data.status==='paid'&&!p.paidDate)p.paidDate=new Date().toISOString(); json({success:true,payment:p}); });
  }

  // ── SOP GENERATOR ──
  if (pathname === '/api/auto/sop-generator' && method === 'POST') {
    return body().then(({studentName,course,university,background,goals,experience}) => {
      const sop=`STATEMENT OF PURPOSE\n\n${course}\n${university}\n\nMy name is ${studentName}, and I am writing to express my sincere interest in the ${course} programme at ${university}.\n\n${background?`My academic background in ${background} has provided a strong foundation for this programme.\n\n`:''}${experience?`${experience}.\n\n`:''}I chose ${university} for its excellent reputation and industry connections. The programme's curriculum directly aligns with my career objectives.\n\nUpon completing this programme, I aspire to ${goals||'contribute meaningfully to my field and make a positive impact'}.\n\nSincerely,\n${studentName}`;
      json({success:true,sop,wordCount:sop.split(' ').length});
    });
  }

  // ── CHATBOT ──
  if (pathname === '/api/auto/chatbot' && method === 'POST') {
    return body().then(({sessionId,message}) => { json({success:true,response:chatReply(message||''),sessionId}); });
  }

  // ── EMAILS ──
  if (pathname === '/api/auto/emails' && method === 'GET') return json(EMAILS);
  if (pathname === '/api/auto/emails/send' && method === 'POST') {
    return body().then(data => { const e={id:'EM'+String(EMAILS.length+1).padStart(3,'0'),...data,sentAt:new Date().toISOString(),opened:false}; EMAILS.push(e); json({success:true,email:e}); });
  }
  if (pathname.match(/^\/api\/auto\/emails\/preview\/.+$/) && method === 'GET') {
    return json({subject:'Follow-up from Global Guidance',body:'Dear Student,\n\nThank you for your interest. Our counsellor will be in touch shortly.\n\nBest regards,\nGlobal Guidance Team'});
  }

  // ── INTERVIEW QUESTIONS ──
  if (pathname === '/api/auto/interviews/questions' && method === 'GET') {
    const type=parsed.query.type||'university';
    const q=type==='visa'?[
      {q:'Why do you want to study in the UK?',category:'motivation',tips:'Focus on academic quality, not immigration'},
      {q:'What are your ties to your home country?',category:'ties',tips:'Mention family, property, job offers'},
      {q:'How are you financing your studies?',category:'financial',tips:'Have bank statements ready'},
      {q:'What will you do after your degree?',category:'future_plans',tips:'Emphasise returning home'},
      {q:'Why this specific university?',category:'motivation',tips:'Research the university well'},
      {q:'What is the duration of your course?',category:'academic',tips:'Know exact start and end dates'},
    ]:[
      {q:'Why did you choose this university?',category:'motivation',tips:'Mention programs, faculty, rankings'},
      {q:'What are your career goals?',category:'future_plans',tips:'Show how this degree aligns'},
      {q:'Tell me about your academic background.',category:'academic',tips:'Highlight achievements'},
      {q:'How will you fund your studies?',category:'financial',tips:'Have clear financial plan'},
      {q:'Why this course?',category:'motivation',tips:'Show genuine interest'},
      {q:'What did you do after graduation?',category:'academic',tips:'Explain any gaps'},
    ];
    return json(q);
  }
  if (pathname.match(/^\/api\/auto\/interviews\/[^/]+\/mock$/) && method === 'POST') {
    return body().then(({answer}) => {
      const wc=(answer||'').split(' ').filter(Boolean).length;
      const score=Math.min(10,Math.max(2,Math.round((wc>25?3:1)+((answer||'').length>120?3:1)+Math.random()*3)));
      const feedback=score>=8?'Excellent! Specific and well-structured.':score>=5?'Good attempt. Add more specific examples.':'Needs more detail. Use the tip to improve.';
      json({success:true,feedback,score,prepScore:score*10});
    });
  }

  // ── VISA CHECKLISTS ──
  if (pathname === '/api/auto/visa-checklists' && method === 'POST') {
    return body().then(data => json({success:true,checklist:{id:'VC001',...data,status:'not_started',items:[]}}));
  }
  if (pathname === '/api/auto/visa-checklists' && method === 'GET') return json([]);

  // ── MISC APIS (stubs for compatibility) ──
  if (pathname === '/api/presence' && method === 'POST') return json({success:true});
  if (pathname === '/api/presence' && method === 'GET') return json({});
  if (pathname === '/api/typing' && method === 'POST') return json({success:true});
  if (pathname === '/api/typing' && method === 'GET') return json([]);
  if (pathname === '/api/channels' && method === 'GET') return json([{id:'general',name:'General',type:'public'},{id:'admissions',name:'Admissions',type:'department'}]);
  if (pathname === '/api/calls' && method === 'GET') return json([]);
  if (pathname === '/api/calls' && method === 'POST') return json({success:true});
  if (pathname === '/api/emails' && method === 'GET') return json([]);
  if (pathname === '/api/emails' && method === 'POST') return json({success:true});
  if (pathname === '/api/red-flags' && method === 'GET') return json([]);
  if (pathname === '/api/red-flags/stats' && method === 'GET') return json({total:0,open:0,inProgress:0,resolved:0,critical:0});
  if (pathname === '/api/red-flags' && method === 'POST') return json({success:true});
  if (pathname === '/api/meetings' && method === 'GET') return json([]);
  if (pathname === '/api/meetings' && method === 'POST') return json({success:true,id:Date.now()});
  if (pathname === '/api/visitors' && method === 'GET') return json([]);
  if (pathname === '/api/visitors' && method === 'POST') return json({success:true});
  if (pathname === '/api/daily-reports' && method === 'GET') return json([]);
  if (pathname === '/api/daily-reports' && method === 'POST') return json({success:true,report:{id:'r'+Date.now()}});
  if (pathname === '/api/tasks' && method === 'GET') return json([]);
  if (pathname === '/api/tasks' && method === 'POST') return json({success:true,task:{id:'t'+Date.now()}});
  if (pathname === '/api/kpis' && method === 'GET') return json([]);
  if (pathname === '/api/kpis' && method === 'POST') return json({success:true,kpi:{id:'k'+Date.now()}});
  if (pathname === '/api/auto/settings' && method === 'GET') return json({autoFollowUp:true,autoEmailOnNew:true});
  if (pathname === '/api/auto/settings' && method === 'PUT') return json({success:true});
  if (pathname === '/api/student-messages' && method === 'GET') return json([]);
  if (pathname === '/api/student-messages' && method === 'POST') return json({success:true});
  if (pathname === '/api/student-messages/summary' && method === 'GET') return json([]);
  if (pathname === '/api/student-portal/login' && method === 'POST') return json({success:false,message:'Portal not configured'});
  if (pathname === '/api/student-portal/accounts' && method === 'GET') return json({success:true,students:[],total:0});
  if (pathname === '/api/applications' && method === 'GET') return json([]);
  if (pathname.startsWith('/api/messages/')) return json({success:true});
  if (pathname.startsWith('/api/notifications/')) return json({success:true});
  if (pathname.startsWith('/api/tasks/')) return json({success:true});
  if (pathname.startsWith('/api/daily-reports/')) return json({success:true});
  if (pathname.startsWith('/api/meetings/')) return json({success:true});
  if (pathname.startsWith('/api/red-flags/')) return json({success:true});

  // ── Standalone pages ──
  const pages = {
    '/lead-management': 'lead-management-unified',
    '/daily-operations': 'daily-operations-enhanced',
    '/red-flags': 'red-flags',
    '/reports': 'reports-analytics',
    '/leave': 'leave-management',
    '/applications': 'applications',
    '/students': 'students',
    '/applications-visa': 'applications-visa',
    '/finance-commission': 'finance-commission',
    '/system-settings': 'system-settings',
    '/student-portal': 'student-portal',
    '/student-login': 'student-login',
    '/location-tracker': 'location-tracker',
  };
  if (pages[pathname]) {
    const fp = path.join(__dirname, 'public', pages[pathname]+'.html');
    if (fs.existsSync(fp)) { res.writeHead(200,{'Content-Type':'text/html'}); return res.end(fs.readFileSync(fp,'utf8')); }
  }

  // ── 404 ──
  res.writeHead(404, {'Content-Type':'text/html'});
  res.end('<h1>404 Not Found</h1><a href="/">← Back to app</a>');
}

const server = http.createServer(router);
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 Global Guidance HR System v4.0 is RUNNING!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`📍 Network: http://YOUR_IP:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Login:   nashif.razzak / password123 (CEO)');
  console.log('👤 Login:   thasbiha.s / password123 (HR)');
  console.log('👤 Login:   sukaina / password123 (Staff)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠  Press Ctrl+C to stop\n');
});
