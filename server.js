const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const PORT = process.env.PORT || 3000;
const HTML = fs.readFileSync(path.join(__dirname, 'src/template.html'), 'utf8');
let LEADS = [
  {id:1,name:'Priya Nair',email:'priya@email.com',phone:'+94771111001',dest:'UK',level:'PG',field:'Business',intake:'Sep 2026',stage:3,score:82,source:'Instagram',counselor:'Thasbiha S.',lastContact:'1 day ago',createdAt:new Date().toISOString()},
  {id:2,name:'Sahan Fernando',email:'sahan@email.com',phone:'+94772222002',dest:'UK',level:'UG',field:'Computer Science',intake:'Jan 2026',stage:4,score:91,source:'Walk-in',counselor:'Sukaina',lastContact:'Today',createdAt:new Date().toISOString()},
  {id:3,name:'Amali Wickramasinghe',email:'amali@email.com',phone:'+94773333003',dest:'Canada',level:'PG',field:'Data Science',intake:'Sep 2026',stage:5,score:95,source:'Referral',counselor:'Thasbiha S.',lastContact:'2 hrs ago',createdAt:new Date().toISOString()},
];
let LEAD_ID=4, MESSAGES=[], PAYMENTS=[], EMAILS=[], AUTO_LEADS=[...LEADS];
function score(l){let s=50;if(l.ielts){const v=parseFloat(l.ielts);if(v>=7.5)s+=20;else if(v>=7)s+=15;else if(v>=6.5)s+=10;else if(v>=6)s+=5;}if(l.level==='PG')s+=10;if(['Referral','Walk-in'].includes(l.source))s+=15;else if(['Google','Website'].includes(l.source))s+=8;return Math.min(100,s);}
function chat(m){const q=m.toLowerCase();if(q.includes('ielts'))return 'For UK universities you need IELTS 6.0-6.5 for UG and 6.5-7.0 for PG. Want more details?';if(q.includes('fee')||q.includes('cost'))return 'UK tuition: £10,000–£35,000/year. Our service fee is a one-time charge. Want a breakdown?';if(q.includes('visa'))return 'UK Student Visa needs: CAS letter, financial proof, IELTS, TB test. Processing: 3-8 weeks.';if(q.includes('uni'))return 'We work with 50+ UK universities: Coventry, DMU, Hertfordshire, Sunderland and more. Shall I recommend based on your profile?';return 'Our counsellors are available Mon-Sat 9AM-6PM. Would you like to fill in our enquiry form?';}
function router(req,res){
  const p=url.parse(req.url,true).pathname,m=req.method;
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(m==='OPTIONS'){res.writeHead(204);return res.end();}
  const json=(d,s=200)=>{res.writeHead(s,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
  const body=()=>new Promise(r=>{let b='';req.on('data',d=>b+=d);req.on('end',()=>{try{r(JSON.parse(b||'{}'));}catch(e){r({});}});});
  if(p==='/'||p==='/dashboard'){res.writeHead(200,{'Content-Type':'text/html'});return res.end(HTML);}
  if(p==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(p.startsWith('/static/')){const fp=path.join(__dirname,'public',p);if(fs.existsSync(fp)){const ext=path.extname(fp);const mime={'.js':'application/javascript','.css':'text/css','.png':'image/png'}[ext]||'text/plain';res.writeHead(200,{'Content-Type':mime});return res.end(fs.readFileSync(fp));}};
  if(p==='/api/leads'&&m==='GET')return json(LEADS);
  if(p==='/api/leads/stats'&&m==='GET')return json({total:LEADS.length,hotLeads:LEADS.filter(l=>l.score>=80).length,avgScore:LEADS.length?Math.round(LEADS.reduce((s,l)=>s+l.score,0)/LEADS.length):0,byStatus:{}});
  if(p==='/api/leads'&&m==='POST')return body().then(d=>{const l={id:LEAD_ID++,...d,stage:1,score:score(d),createdAt:new Date().toISOString()};LEADS.push(l);json({success:true,lead:l});});
  if(p.match(/^\/api\/leads\/\d+$/)&&m==='PUT')return body().then(d=>{const i=LEADS.findIndex(l=>l.id===parseInt(p.split('/')[3]));if(i<0)return json({error:'Not found'},404);LEADS[i]={...LEADS[i],...d};json({success:true,lead:LEADS[i]});});
  if(p.match(/^\/api\/leads\/\d+$/)&&m==='DELETE'){LEADS=LEADS.filter(l=>l.id!==parseInt(p.split('/')[3]));return json({success:true});}
  if(p==='/api/auto/leads'&&m==='GET')return json({leads:AUTO_LEADS,total:AUTO_LEADS.length});
  if(p==='/api/auto/leads/stats'&&m==='GET')return json({total:AUTO_LEADS.length,hotLeads:AUTO_LEADS.filter(l=>l.score>=80).length,avgScore:AUTO_LEADS.length?Math.round(AUTO_LEADS.reduce((s,l)=>s+l.score,0)/AUTO_LEADS.length):0,needsFollowUp:5,byStatus:{}});
  if(p==='/api/auto/leads'&&m==='POST')return body().then(d=>{const l={id:'AL'+(AUTO_LEADS.length+1),...d,stage:1,score:score(d),createdAt:new Date().toISOString()};AUTO_LEADS.push(l);json({success:true,lead:l,emailSent:true});});
  if(p==='/api/auto/capture'&&m==='POST')return body().then(d=>{const l={id:'AL'+(AUTO_LEADS.length+1),...d,stage:1,score:score(d),createdAt:new Date().toISOString()};AUTO_LEADS.push(l);json({success:true,leadId:l.id,aiScore:l.score,message:'Thank you! A counsellor will contact you within 24 hours.'});});
  if(p==='/api/auto/pipeline'&&m==='GET'){const names=['New Lead','Contacted','Qualified','Application','Offer Received','Visa Prep','Visa Applied','Enrolled'];return json({stages:names.map((n,i)=>({id:i+1,name:n,count:AUTO_LEADS.filter(l=>l.stage===i+1).length})),leads:AUTO_LEADS});}
  if(p.match(/^\/api\/auto\/leads\/[^/]+\/advance$/)&&m==='POST'){const id=p.split('/')[4];const l=AUTO_LEADS.find(x=>x.id===id);if(!l)return json({error:'Not found'},404);l.stage=Math.min(8,l.stage+1);return json({success:true,lead:l});}
  if(p==='/api/auto/sop-generator'&&m==='POST')return body().then(d=>{json({success:true,sop:`STATEMENT OF PURPOSE\n\n${d.course||'Course'}\n${d.university||'University'}\n\nMy name is ${d.studentName||'Student'}, and I am writing to express my sincere interest in the ${d.course||'programme'} at ${d.university||'university'}.\n\nI look forward to contributing to the community.\n\nSincerely,\n${d.studentName||'Student'}`,wordCount:80});});
  if(p==='/api/auto/chatbot'&&m==='POST')return body().then(d=>{json({success:true,response:chat(d.message||''),sessionId:d.sessionId});});
  if(p==='/api/auto/emails'&&m==='GET')return json(EMAILS);
  if(p==='/api/auto/emails/send'&&m==='POST')return body().then(d=>{const e={id:'EM'+(EMAILS.length+1),...d,sentAt:new Date().toISOString()};EMAILS.push(e);json({success:true,email:e});});
  if(p==='/api/auto/payments'&&m==='GET')return json(PAYMENTS);
  if(p==='/api/auto/payments/stats'&&m==='GET')return json({total:0,paid:0,pending:0,overdue:0,count:0});
  if(p==='/api/auto/payments'&&m==='POST')return body().then(d=>{const pay={id:'PAY'+(PAYMENTS.length+1),...d,status:'pending',createdAt:new Date().toISOString()};PAYMENTS.push(pay);json({success:true,payment:pay});});
  if(p==='/api/auto/interviews/questions'&&m==='GET'){const t=url.parse(req.url,true).query.type||'university';return json(t==='visa'?[{q:'Why do you want to study in the UK?',category:'motivation',tips:'Focus on academic quality'},{q:'What are your ties to your home country?',category:'ties',tips:'Mention family, property'},{q:'How are you financing your studies?',category:'financial',tips:'Have bank statements ready'}]:[{q:'Why did you choose this university?',category:'motivation',tips:'Mention programs, faculty'},{q:'What are your career goals?',category:'future_plans',tips:'Show how this degree aligns'},{q:'Tell me about your academic background.',category:'academic',tips:'Highlight achievements'}]);}
  if(p.match(/^\/api\/auto\/interviews\/[^/]+\/mock$/)&&m==='POST')return body().then(d=>{const wc=(d.answer||'').split(' ').length;const sc=Math.min(10,Math.max(2,Math.round(wc/10+Math.random()*4)));json({success:true,feedback:sc>=7?'Excellent answer!':'Good attempt. Add more specific examples.',score:sc,prepScore:sc*10});});
  if(p==='/api/auto/settings'&&m==='GET')return json({autoFollowUp:true,autoEmailOnNew:true});
  if(p==='/api/auto/settings'&&m==='PUT')return body().then(()=>json({success:true}));
  if(p==='/api/messages'&&m==='GET')return json({messages:MESSAGES,total:MESSAGES.length});
  if(p==='/api/messages'&&m==='POST')return body().then(d=>{const msg={...d,id:Date.now(),serverTimestamp:Date.now()};MESSAGES.push(msg);if(MESSAGES.length>200)MESSAGES.shift();json({success:true,message:msg});});
  if(p==='/api/notifications'&&m==='GET')return json([]);
  if(p==='/api/notifications'&&m==='POST')return json({success:true});
  if(p==='/api/channels'&&m==='GET')return json([{id:'general',name:'General',type:'public'},{id:'admissions',name:'Admissions',type:'department'}]);
  if(p==='/api/auto/visa-checklists'&&m==='GET')return json([]);
  if(p==='/api/auto/visa-checklists'&&m==='POST')return json({success:true,checklist:{id:'VC001',items:[]}});
  if(p==='/api/presence'&&m==='POST')return json({success:true});
  if(p==='/api/presence'&&m==='GET')return json({});
  if(p==='/api/typing'&&m==='POST')return json({success:true});
  if(p==='/api/typing'&&m==='GET')return json([]);
  if(p==='/api/calls'&&m==='GET')return json([]);
  if(p==='/api/calls'&&m==='POST')return json({success:true});
  if(p==='/api/emails'&&m==='GET')return json([]);
  if(p==='/api/emails'&&m==='POST')return json({success:true});
  if(p==='/api/red-flags'&&m==='GET')return json([]);
  if(p==='/api/red-flags/stats'&&m==='GET')return json({total:0,open:0,resolved:0,critical:0});
  if(p==='/api/red-flags'&&m==='POST')return json({success:true});
  if(p==='/api/meetings'&&m==='GET')return json([]);
  if(p==='/api/meetings'&&m==='POST')return json({success:true,id:Date.now()});
  if(p==='/api/visitors'&&m==='GET')return json([]);
  if(p==='/api/visitors'&&m==='POST')return json({success:true});
  if(p==='/api/tasks'&&m==='GET')return json([]);
  if(p==='/api/tasks'&&m==='POST')return json({success:true,task:{id:'t'+Date.now()}});
  if(p==='/api/kpis'&&m==='GET')return json([]);
  if(p==='/api/daily-reports'&&m==='GET')return json([]);
  if(p==='/api/daily-reports'&&m==='POST')return json({success:true,report:{id:'r'+Date.now()}});
  if(p==='/api/applications'&&m==='GET')return json([]);
  if(p==='/api/student-messages'&&m==='GET')return json([]);
  if(p==='/api/student-messages/summary'&&m==='GET')return json([]);
  if(p==='/api/student-portal/login'&&m==='POST')return json({success:false,message:'Portal not configured'});
  if(p==='/api/student-portal/accounts'&&m==='GET')return json({success:true,students:[],total:0});
  if(p.startsWith('/api/'))return json({success:true});
  const pages={'/lead-management':'lead-management-unified','/daily-operations':'daily-operations-enhanced','/red-flags':'red-flags','/reports':'reports-analytics','/leave':'leave-management','/applications':'applications','/students':'students','/applications-visa':'applications-visa','/finance-commission':'finance-commission','/system-settings':'system-settings','/student-portal':'student-portal','/location-tracker':'location-tracker'};
  if(pages[p]){const fp=path.join(__dirname,'public',pages[p]+'.html');if(fs.existsSync(fp)){res.writeHead(200,{'Content-Type':'text/html'});return res.end(fs.readFileSync(fp,'utf8'));}}
  res.writeHead(200,{'Content-Type':'text/html'});res.end(HTML);
}
const server=http.createServer(router);
server.listen(PORT,'0.0.0.0',()=>{console.log('\n🚀 Global Guidance HR System v4.0 RUNNING!');console.log(`📍 http://localhost:${PORT}`);console.log('👤 Login: nashif.razzak / password123 (CEO)');});