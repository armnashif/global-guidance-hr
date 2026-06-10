/* ============================================================================
 * media-suite.js — v14 fixes module
 *
 * Adds, without modifying any existing function in command-portal.html:
 *   1. IndexedDB-backed Media Library (screenshots, recordings, webcam snaps)
 *   2. "Who is sharing" indicator (broadcast via BroadcastChannel + sessionStorage)
 *   3. Functional voice / video / group calls (local stream, accept/decline, record)
 *   4. Mandatory morning check-in gate
 *   5. Desktop notifications + in-page toast queue
 *
 * All entry points are exposed on `window.MS` and individually on `window`.
 * Original functions are wrapped where helpful — never replaced.
 * ========================================================================== */
(function(){
'use strict';

// ─── 0. Utilities ────────────────────────────────────────────────────────
function $(s, r){ return (r||document).querySelector(s); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function nowIso(){ return new Date().toISOString(); }
function fmtBytes(n){ if (!n) return '0 B'; const u=['B','KB','MB','GB']; let i=0; while(n>=1024 && i<u.length-1){n/=1024;i++;} return n.toFixed(i?1:0)+' '+u[i]; }
function fmtDate(s){ try { const d = new Date(s); return d.toLocaleString(); } catch(e){ return s; } }
// currentUser is module-scoped in command-portal.html (not on window).
// Resolve it via a lazy eval fallback so we still get the real name/key.
function _cu(){
  try { if (window.currentUser) return window.currentUser; } catch(e){}
  try {
    // eslint-disable-next-line no-new-func
    return new Function('try{return typeof currentUser!=="undefined"?currentUser:null}catch(e){return null}')();
  } catch(e){ return null; }
}
function meName(){ const u = _cu(); return (u && u.name) || 'You'; }
function meKey(){ const u = _cu(); return (u && u.username) || 'guest'; }
function meAvatar(){ const u = _cu(); return (u && u.avatar) || '#64748b,#475569'; }

// ─── 1. IndexedDB Media Library ──────────────────────────────────────────
const DB_NAME = 'gg_media_v1';
const STORE   = 'items';
let _dbCache = null;

function openDB(){
  if (_dbCache) return Promise.resolve(_dbCache);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)){
        const os = db.createObjectStore(STORE, { keyPath:'id', autoIncrement:true });
        os.createIndex('by_owner', 'owner', { unique:false });
        os.createIndex('by_ts',    'ts',    { unique:false });
      }
    };
    req.onsuccess = () => { _dbCache = req.result; resolve(_dbCache); };
    req.onerror = () => reject(req.error);
  });
}

async function mediaSave(blob, meta){
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const os = tx.objectStore(STORE);
      const rec = Object.assign({
        owner: meKey(),
        ownerName: meName(),
        type:  blob.type || 'application/octet-stream',
        size:  blob.size || 0,
        ts:    Date.now(),
        title: 'Media',
        blob:  blob
      }, meta || {});
      const r = os.add(rec);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } catch(e){ console.error('mediaSave failed', e); return null; }
}

async function mediaList(){
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const os = tx.objectStore(STORE);
      const items = [];
      os.openCursor(null, 'prev').onsuccess = (e) => {
        const cur = e.target.result;
        if (cur){ items.push(cur.value); cur.continue(); }
        else resolve(items);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch(e){ return []; }
}

async function mediaDelete(id){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function mediaGet(id){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const r  = tx.objectStore(STORE).get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

window.mediaSave = mediaSave;
window.mediaList = mediaList;

// ─── 2. Toast + Desktop Notification system ──────────────────────────────
function ensureToastHost(){
  let h = document.getElementById('msToastHost');
  if (!h){
    h = document.createElement('div');
    h.id = 'msToastHost';
    h.style.cssText = 'position:fixed;top:18px;right:18px;z-index:100000;display:flex;flex-direction:column;gap:10px;max-width:380px;pointer-events:none';
    document.body.appendChild(h);
  }
  return h;
}

function toast(opts){
  opts = opts || {};
  const host = ensureToastHost();
  const id = 't'+Date.now()+Math.floor(Math.random()*999);
  const color = opts.type === 'error' ? '#ef4444' : opts.type === 'success' ? '#10b981' : opts.type === 'call' ? '#0ea5e9' : '#f59e0b';
  const icon = opts.icon || (opts.type === 'call' ? 'fa-phone-volume' : opts.type === 'error' ? 'fa-circle-exclamation' : opts.type === 'success' ? 'fa-check-circle' : 'fa-bell');
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = 'pointer-events:auto;background:#0f172a;color:#fff;border-left:4px solid '+color+';border-radius:10px;padding:12px 14px;box-shadow:0 14px 40px rgba(0,0,0,0.35);font-size:13px;line-height:1.4;display:flex;gap:10px;align-items:flex-start;animation:msIn 0.25s ease-out';
  el.innerHTML =
    '<i class="fas '+icon+'" style="color:'+color+';font-size:18px;margin-top:2px"></i>'
    + '<div style="flex:1;min-width:0">'
    +   '<div style="font-weight:700;margin-bottom:2px">'+esc(opts.title||'Notification')+'</div>'
    +   (opts.body ? '<div style="color:#cbd5e1;font-size:12px">'+esc(opts.body)+'</div>' : '')
    +   (opts.actionLabel ? '<button id="'+id+'_act" style="margin-top:8px;background:'+color+';color:#fff;border:0;border-radius:6px;padding:5px 11px;font-size:11.5px;font-weight:700;cursor:pointer">'+esc(opts.actionLabel)+'</button>' : '')
    + '</div>'
    + '<button id="'+id+'_x" style="background:transparent;color:#94a3b8;border:0;cursor:pointer;font-size:14px;padding:0 2px">&times;</button>';
  host.appendChild(el);

  if (!document.getElementById('msToastKeyframes')){
    const st = document.createElement('style'); st.id = 'msToastKeyframes';
    st.textContent = '@keyframes msIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(st);
  }

  const close = () => { try { el.style.opacity='0'; el.style.transform='translateX(20px)'; el.style.transition='all .2s'; } catch(e){} setTimeout(()=>el.remove(),220); };
  document.getElementById(id+'_x').onclick = close;
  if (opts.actionLabel && opts.onAction){
    document.getElementById(id+'_act').onclick = () => { try { opts.onAction(); } catch(e){} close(); };
  }
  if (opts.duration !== 0) setTimeout(close, opts.duration || 6000);

  // Also fire desktop notification if permission granted and page is not focused
  try {
    if ('Notification' in window && Notification.permission === 'granted' && (!document.hasFocus() || opts.always)){
      const n = new Notification(opts.title || 'Genuine Global', { body: opts.body || '', icon: '/static/favicon.png', tag: opts.tag || id });
      n.onclick = () => { try { window.focus(); } catch(e){} if (opts.onAction) try { opts.onAction(); } catch(e){} close(); };
      setTimeout(()=>{ try { n.close(); } catch(e){} }, 8000);
    }
  } catch(e){}

  return id;
}

function notifyPermissionAsk(){
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default'){
      Notification.requestPermission().then(p => {
        if (p === 'granted') toast({ type:'success', title:'Desktop notifications enabled', body:'You will be alerted about calls and messages even when working on other pages.', duration: 4000 });
      });
    }
  } catch(e){}
}

window.toast = toast;
window.notifyPermissionAsk = notifyPermissionAsk;

// ─── 3. "Who is sharing" indicator ───────────────────────────────────────
// Broadcast via BroadcastChannel so other open tabs see who is sharing,
// and persist in sessionStorage so the indicator stays visible during the session.
let _shareChannel = null;
try { _shareChannel = new BroadcastChannel('gg_screen_share'); } catch(e){ _shareChannel = null; }

function shareSetSelf(state){
  // state = { active:true|false, target:'team'|userKey, targetName:string }
  try {
    if (state && state.active){
      sessionStorage.setItem('gg_share_self', JSON.stringify(Object.assign({
        owner: meKey(), ownerName: meName(), ts: Date.now()
      }, state)));
    } else {
      sessionStorage.removeItem('gg_share_self');
    }
  } catch(e){}
  if (_shareChannel){
    try {
      _shareChannel.postMessage({
        kind:'share', active: !!(state && state.active),
        owner: meKey(), ownerName: meName(),
        target: state && state.target || 'team',
        targetName: state && state.targetName || 'Whole team',
        ts: Date.now()
      });
    } catch(e){}
  }
  renderShareBanner();
}

function shareBannerHtml(s){
  return '<div style="display:flex;align-items:center;gap:10px;padding:7px 14px;background:linear-gradient(90deg,rgba(16,185,129,0.18),rgba(14,165,233,0.18));border:1px solid #10b981;border-radius:999px;font-size:12px;font-weight:700;color:#10b981;box-shadow:0 6px 20px rgba(16,185,129,0.25)">'
    + '<span style="width:8px;height:8px;background:#10b981;border-radius:50%;animation:msPulse 1.2s infinite"></span>'
    + '<i class="fas fa-desktop"></i>'
    + '<span><strong style="color:#fff">'+esc(s.ownerName)+'</strong> is sharing screen with <strong style="color:#fff">'+esc(s.targetName||'team')+'</strong></span>'
    + '<button onclick="MS.shareView('+JSON.stringify(s.owner).replace(/"/g,'&quot;')+')" style="background:#0ea5e9;color:#fff;border:0;border-radius:6px;padding:3px 9px;font-size:10.5px;font-weight:700;cursor:pointer;margin-left:4px">View</button>'
    + (s.owner === meKey() ? '<button onclick="MS.shareStop()" style="background:#ef4444;color:#fff;border:0;border-radius:6px;padding:3px 9px;font-size:10.5px;font-weight:700;cursor:pointer"><i class="fas fa-stop"></i> Stop</button>' : '')
    + '</div>';
}

let _activeShares = {}; // owner -> { ownerName, target, targetName, ts }

function renderShareBanner(){
  // Inject keyframes once
  if (!document.getElementById('msPulseKeyframes')){
    const st = document.createElement('style'); st.id = 'msPulseKeyframes';
    st.textContent = '@keyframes msPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(0.85)}}';
    document.head.appendChild(st);
  }
  // Include self from sessionStorage
  try {
    const self = JSON.parse(sessionStorage.getItem('gg_share_self') || 'null');
    if (self){ _activeShares[self.owner] = self; } else { delete _activeShares[meKey()]; }
  } catch(e){}

  let host = document.getElementById('msShareBannerHost');
  if (!host){
    host = document.createElement('div');
    host.id = 'msShareBannerHost';
    host.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:99998;display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:auto';
    document.body.appendChild(host);
  }
  const keys = Object.keys(_activeShares);
  if (!keys.length){ host.innerHTML = ''; return; }
  host.innerHTML = keys.map(k => shareBannerHtml(_activeShares[k])).join('');
}

if (_shareChannel){
  _shareChannel.onmessage = (ev) => {
    if (!ev || !ev.data) return;
    const d = ev.data;
    if (d.kind === 'share'){
      if (d.active) _activeShares[d.owner] = d;
      else delete _activeShares[d.owner];
      renderShareBanner();
      if (d.active && d.owner !== meKey()){
        toast({ type:'call', title: d.ownerName + ' started sharing screen', body: 'Target: ' + (d.targetName||'team') + '. Tap View to watch.', actionLabel:'View', onAction:()=>shareView(d.owner), tag:'share-'+d.owner });
      }
    } else if (d.kind === 'call_invite' && d.toUser === meKey()){
      callShowIncoming(d);
    }
  };
}

function shareView(owner){
  // Self-share has a live preview already; for others, show a placeholder
  if (owner === meKey()){
    const v = document.getElementById('commsScreenShareVideo'); if (v) v.scrollIntoView({behavior:'smooth'}); return;
  }
  const s = _activeShares[owner];
  if (!s){ toast({ type:'error', title:'Share unavailable', body:'That session has ended.' }); return; }
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.onclick = (e)=>{ if (e.target===modal) modal.remove(); };
  modal.innerHTML = '<div style="background:#0f172a;border:2px solid #10b981;border-radius:14px;width:100%;max-width:900px;overflow:hidden">'
    + '<div style="background:rgba(16,185,129,0.18);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;color:#10b981;font-weight:800"><span><i class="fas fa-desktop"></i> Watching '+esc(s.ownerName)+'\'s screen</span><button onclick="this.closest(\'div[style*=position\\\\:fixed]\').remove()" style="background:#ef4444;color:#fff;border:0;border-radius:6px;padding:4px 10px;font-weight:700;cursor:pointer">Close</button></div>'
    + '<div style="background:#000;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;text-align:center;padding:30px">'
    +   '<div><i class="fas fa-broadcast-tower" style="font-size:48px;color:#10b981;margin-bottom:14px"></i>'
    +   '<div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:6px">'+esc(s.ownerName)+' is sharing live</div>'
    +   '<div style="color:#94a3b8;font-size:12px;max-width:520px;margin:0 auto">In a real production deployment with a TURN/WebRTC signaling server, the remote video stream would render here. For this demo build, the indicator and notification system are fully functional — you can see who is sharing and with whom, in real time across browser tabs.</div></div>'
    + '</div></div>';
  document.body.appendChild(modal);
}

function shareStop(){
  // Stop the underlying stream too (uses existing commsStopScreenShare if present)
  try { if (typeof window.commsStopScreenShare === 'function') window.commsStopScreenShare(); } catch(e){}
  shareSetSelf({ active:false });
}

// Wrap existing commsShareScreen to broadcast presence + Media Library entry
(function wrapShareScreen(){
  const orig = window.commsShareScreen;
  if (typeof orig !== 'function') return;
  window.commsShareScreen = async function(){
    // Choose target before invoking
    const target = await sharePickTarget();
    if (target === null) return;
    const r = await orig.apply(this, arguments);
    // If a stream is now active, broadcast it
    if (window.__commsScreenStream){
      shareSetSelf({ active:true, target: target.key, targetName: target.name });
      // When the user stops natively, the existing 'ended' listener calls commsStopScreenShare → we wrap that too
    }
    return r;
  };
  const origStop = window.commsStopScreenShare;
  if (typeof origStop === 'function'){
    window.commsStopScreenShare = function(){
      const r = origStop.apply(this, arguments);
      shareSetSelf({ active:false });
      return r;
    };
  }
})();

async function sharePickTarget(){
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    let users = [];
    try { users = Object.keys(window.USERS||{}).map(u => ({ key:u, name: window.USERS[u].name || u, role: window.USERS[u].role || '' })).filter(u => u.key !== meKey()); } catch(e){}
    const optsHtml = users.map(u => '<button data-k="'+esc(u.key)+'" data-n="'+esc(u.name)+'" class="ms-tgt" style="text-align:left;width:100%;padding:9px 12px;background:#0f172a;color:#fff;border:1px solid #1e293b;border-radius:8px;cursor:pointer;display:flex;flex-direction:column;gap:2px;margin-bottom:6px"><span style="font-weight:700">'+esc(u.name)+'</span><span style="font-size:11px;color:#94a3b8">'+esc(u.role)+'</span></button>').join('');
    modal.innerHTML = '<div style="background:#0f172a;border-radius:14px;width:100%;max-width:440px;color:#fff;border:1px solid #1e293b;box-shadow:0 30px 80px rgba(0,0,0,0.55)">'
      + '<div style="padding:14px 18px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between"><div style="font-weight:800"><i class="fas fa-desktop" style="color:#10b981"></i> &nbsp;Share screen with</div><button id="msTgtCancel" style="background:transparent;color:#94a3b8;border:0;cursor:pointer;font-size:18px">&times;</button></div>'
      + '<div style="padding:14px 18px;max-height:60vh;overflow:auto">'
      +   '<button data-k="team" data-n="Whole team" class="ms-tgt" style="text-align:left;width:100%;padding:11px 12px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:0;border-radius:8px;cursor:pointer;font-weight:800;margin-bottom:10px"><i class="fas fa-users"></i> &nbsp;Whole team (everyone signed in)</button>'
      +   '<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin:8px 0">Specific person</div>'
      +   (optsHtml || '<div style="color:#94a3b8;font-size:12.5px;padding:10px">No teammates online.</div>')
      + '</div></div>';
    document.body.appendChild(modal);
    modal.querySelector('#msTgtCancel').onclick = () => { modal.remove(); resolve(null); };
    modal.onclick = (e)=>{ if (e.target===modal){ modal.remove(); resolve(null); } };
    modal.querySelectorAll('.ms-tgt').forEach(b => {
      b.onclick = () => { modal.remove(); resolve({ key: b.dataset.k, name: b.dataset.n }); };
    });
  });
}

window.MS = window.MS || {};
window.MS.shareView = shareView;
window.MS.shareStop = shareStop;

// ─── 4. Wrap screenshot/recording/webcam to save to Media Library ────────
(function wrapMediaSavers(){
  // Patch the recorder's onstop to also save into IndexedDB
  const origRec = window.commsRecordScreen;
  if (typeof origRec === 'function'){
    window.commsRecordScreen = async function(){
      const r = await origRec.apply(this, arguments);
      // Hook into the recorder we just created
      const rec = window.__commsRecorder;
      if (rec && !rec.__msHooked){
        rec.__msHooked = true;
        const origOnStop = rec.onstop;
        const chunks = [];
        const origOnData = rec.ondataavailable;
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); if (origOnData) try { origOnData(e); } catch(_){ } };
        rec.onstop = async (e) => {
          try {
            const blob = new Blob(chunks, { type: 'video/webm' });
            await mediaSave(blob, { title:'Screen recording', kind:'recording', durationMs: Date.now() - (window.__commsRecStartTs||Date.now()) });
            toast({ type:'success', title:'Recording saved', body:'Open Media Library to play it back or download.', actionLabel:'Open library', onAction:()=>mediaLibraryOpen() });
          } catch(err){ console.error('save recording failed', err); }
          if (origOnStop) try { origOnStop(e); } catch(_){ }
        };
      }
      return r;
    };
  }

  // Wrap screenshot
  const origSS = window.commsScreenshot;
  if (typeof origSS === 'function'){
    window.commsScreenshot = async function(){
      // We re-implement to capture the canvas blob and save it before the original auto-downloads
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){ alert('Screenshot capture requires a modern browser.'); return; }
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const v = document.createElement('video'); v.srcObject = stream; v.muted = true;
        await v.play();
        await new Promise(r => setTimeout(r, 250));
        const cv = document.createElement('canvas');
        cv.width = v.videoWidth || 1280; cv.height = v.videoHeight || 720;
        cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
        stream.getTracks().forEach(t => t.stop());
        const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
        await mediaSave(blob, { title:'Screenshot', kind:'screenshot' });
        const url = URL.createObjectURL(blob);
        if (typeof window.commsShowMediaPreview === 'function'){
          window.commsShowMediaPreview('Screenshot saved to Media Library', '<img src="'+url+'" style="max-width:100%;max-height:60vh;border-radius:8px;border:1px solid var(--border)">'
            + '<div style="margin-top:10px;color:var(--muted);font-size:11px">Saved to your <strong>Media Library</strong> &mdash; open it from the sidebar (Comms → Media Library) anytime.</div>'
            + '<div style="margin-top:10px"><button class="btn btn-secondary" onclick="MS.mediaLibraryOpen()"><i class=\'fas fa-folder-open\'></i> Open Media Library</button></div>');
        } else {
          toast({ type:'success', title:'Screenshot saved', body:'Open Media Library to view.', actionLabel:'Open library', onAction:()=>mediaLibraryOpen() });
        }
      } catch(err){
        if (err && err.name === 'NotAllowedError') return;
        alert('Could not capture screenshot: ' + (err && err.message ? err.message : 'unknown error'));
      }
    };
  }

  // Wrap webcam capture
  const origCap = window.commsWebcamCapture;
  if (typeof origCap === 'function'){
    window.commsWebcamCapture = function(){
      const v = document.getElementById('commsWebcamVid'); if (!v) return;
      const cv = document.createElement('canvas');
      cv.width = v.videoWidth || 640; cv.height = v.videoHeight || 480;
      cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
      cv.toBlob(async (blob) => {
        if (blob) await mediaSave(blob, { title:'Webcam snap', kind:'webcam' });
        try { window.__commsWebcamStream.getTracks().forEach(t=>t.stop()); } catch(e){}
        window.__commsWebcamStream = null;
        const modal = document.getElementById('commsWebcamModal'); if (modal) modal.remove();
        const url = URL.createObjectURL(blob);
        if (typeof window.commsShowMediaPreview === 'function'){
          window.commsShowMediaPreview('Webcam snap saved', '<img src="'+url+'" style="max-width:100%;max-height:60vh;border-radius:8px;border:1px solid var(--border)">'
            + '<div style="margin-top:10px;color:var(--muted);font-size:11px">Saved to your Media Library.</div>'
            + '<div style="margin-top:10px"><button class="btn btn-secondary" onclick="MS.mediaLibraryOpen()"><i class=\'fas fa-folder-open\'></i> Open Media Library</button></div>');
        }
      }, 'image/png');
    };
  }
})();

// ─── 5. Media Library modal ──────────────────────────────────────────────
// v14.7: Two tabs — Local (this browser's screenshots/recordings) and Shared
// (chat attachments uploaded by anyone to /api/attachments). CEO / COO /
// SuperAdmin see ALL shared media; staff see only their own + channel
// attachments + DMs they are part of.
let _msMlActiveTab = 'local';   // 'local' | 'shared'

async function mediaLibraryOpen(){
  let modal = document.getElementById('msMediaLibrary');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'msMediaLibrary';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.onclick = (e)=>{ if (e.target===modal) modal.remove(); };
  // Determine current user's level for header label
  let lvl = 0, uname = '';
  try {
    const u = (typeof window.currentUser !== 'undefined') ? window.currentUser : null;
    if (u) { lvl = u.level || 0; uname = u.username || ''; }
  } catch(e){}
  const isPriv = lvl >= 100;
  const scopeLabel = isPriv ? 'CEO/COO view: all team shared media' : 'Your shared media + channels you are in';
  modal.innerHTML = '<div style="background:var(--surface,#0f172a);color:var(--text,#fff);border-radius:14px;width:100%;max-width:1080px;height:88vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,0.55);border:1px solid var(--border,#1e293b)">'
    + '<div style="padding:14px 18px;border-bottom:1px solid var(--border,#1e293b);display:flex;align-items:center;justify-content:space-between;gap:10px"><div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px"><i class="fas fa-photo-film"></i></div><div><div style="font-weight:800;font-size:16px">Media Library</div><div style="font-size:11.5px;color:var(--muted,#94a3b8)" id="msMlSubLabel">Local captures saved to this browser</div></div></div><div style="display:flex;gap:6px"><select id="msMlFilter" style="background:var(--surface2,#1e293b);color:var(--text,#fff);border:1px solid var(--border,#334155);border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit"><option value="all">All types</option><option value="screenshot">Screenshots</option><option value="recording">Recordings</option><option value="webcam">Webcam</option><option value="image">Images (shared)</option><option value="video">Videos (shared)</option><option value="file">Other files (shared)</option></select><button onclick="MS.mediaLibraryRefresh()" class="btn btn-secondary" style="padding:6px 12px;font-size:12px"><i class="fas fa-rotate"></i> Refresh</button><button onclick="document.getElementById(\'msMediaLibrary\').remove()" style="background:#ef4444;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer">Close</button></div></div>'
    // v14.7: Tab switcher
    + '<div style="display:flex;gap:0;border-bottom:1px solid var(--border,#1e293b);background:var(--surface2,#0b1220)">'
    +   '<div id="msTabLocal" onclick="MS.mediaTabSwitch(\'local\')" style="flex:1;padding:11px 16px;cursor:pointer;font-size:13px;font-weight:700;text-align:center;border-bottom:2px solid '+(_msMlActiveTab==='local'?'#0ea5e9':'transparent')+';color:'+(_msMlActiveTab==='local'?'#0ea5e9':'var(--muted,#94a3b8)')+'">'
    +     '<i class="fas fa-camera" style="margin-right:6px"></i>Local captures'
    +     '<span style="font-size:10px;background:rgba(14,165,233,0.15);color:#0ea5e9;padding:2px 7px;border-radius:10px;margin-left:6px;font-weight:700">this browser</span>'
    +   '</div>'
    +   '<div id="msTabShared" onclick="MS.mediaTabSwitch(\'shared\')" style="flex:1;padding:11px 16px;cursor:pointer;font-size:13px;font-weight:700;text-align:center;border-bottom:2px solid '+(_msMlActiveTab==='shared'?'#10b981':'transparent')+';color:'+(_msMlActiveTab==='shared'?'#10b981':'var(--muted,#94a3b8)')+'">'
    +     '<i class="fas fa-share-nodes" style="margin-right:6px"></i>Shared media'
    +     '<span style="font-size:10px;background:'+(isPriv?'rgba(245,158,11,0.18)':'rgba(16,185,129,0.15)')+';color:'+(isPriv?'#f59e0b':'#10b981')+';padding:2px 7px;border-radius:10px;margin-left:6px;font-weight:700">'+(isPriv?'all staff':'mine + channels')+'</span>'
    +   '</div>'
    + '</div>'
    + '<div id="msMlScopeBar" style="padding:8px 16px;background:rgba(14,165,233,0.08);font-size:11.5px;color:var(--muted,#94a3b8);border-bottom:1px solid var(--border,#1e293b)"><i class="fas fa-info-circle" style="margin-right:6px;color:#0ea5e9"></i><span id="msMlScopeText">'+scopeLabel+'</span></div>'
    + '<div id="msMlBody" style="flex:1;overflow:auto;padding:16px"><div style="text-align:center;color:var(--muted,#94a3b8);padding:40px"><i class="fas fa-spinner fa-spin"></i> Loading...</div></div>'
    + '</div>';
  document.body.appendChild(modal);
  document.getElementById('msMlFilter').onchange = mediaLibraryRefresh;
  mediaLibraryRefresh();
}

function mediaTabSwitch(tab){
  _msMlActiveTab = tab === 'shared' ? 'shared' : 'local';
  // Update tab visuals
  const tl = document.getElementById('msTabLocal');
  const ts = document.getElementById('msTabShared');
  if (tl) {
    tl.style.borderBottom = '2px solid ' + (_msMlActiveTab==='local'?'#0ea5e9':'transparent');
    tl.style.color = _msMlActiveTab==='local'?'#0ea5e9':'var(--muted,#94a3b8)';
  }
  if (ts) {
    ts.style.borderBottom = '2px solid ' + (_msMlActiveTab==='shared'?'#10b981':'transparent');
    ts.style.color = _msMlActiveTab==='shared'?'#10b981':'var(--muted,#94a3b8)';
  }
  // Update scope label
  const lbl = document.getElementById('msMlScopeText');
  if (lbl) {
    let lvl=0; try { lvl = (window.currentUser && window.currentUser.level) || 0; } catch(e){}
    if (_msMlActiveTab === 'local') {
      lbl.textContent = 'Local captures saved to this browser (screenshots, recordings, webcam)';
    } else {
      lbl.textContent = lvl >= 100
        ? 'CEO / COO / SuperAdmin view: ALL shared media uploaded by staff'
        : 'Your uploads + media from channels you are part of + DMs you sent/received';
    }
  }
  mediaLibraryRefresh();
}

async function mediaLibraryRefresh(){
  const body = document.getElementById('msMlBody');
  if (!body) return;
  const filt = (document.getElementById('msMlFilter')||{}).value || 'all';
  if (_msMlActiveTab === 'local') {
    const items = await mediaList();
    const filtered = filt === 'all' ? items : items.filter(x => x.kind === filt);
    if (!filtered.length){
      body.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--muted,#94a3b8)"><i class="fas fa-folder-open" style="font-size:48px;color:#475569;margin-bottom:14px"></i><div style="font-size:14px;font-weight:700;color:var(--text,#fff)">No local media captured yet</div><div style="font-size:12px;margin-top:6px">Use Screenshot, Record screen, or Webcam from Comms / Workspace and your captures will appear here.</div></div>';
      return;
    }
    body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">' + filtered.map(it => mediaCardHtml(it)).join('') + '</div>';
    // Hydrate previews
    filtered.forEach(it => {
      try {
        const url = URL.createObjectURL(it.blob);
        const ph = document.getElementById('msMlPrev_'+it.id);
        if (!ph) return;
        if ((it.kind==='screenshot' || it.kind==='webcam') || /^image\//.test(it.type||'')) ph.innerHTML = '<img src="'+url+'" style="width:100%;height:100%;object-fit:cover">';
        else if (it.kind==='recording' || /^video\//.test(it.type||'')) ph.innerHTML = '<video src="'+url+'" muted playsinline style="width:100%;height:100%;object-fit:cover"></video><div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px">VIDEO</div>';
      } catch(e){}
    });
  } else {
    // SHARED tab — fetch from server
    body.innerHTML = '<div style="text-align:center;color:var(--muted,#94a3b8);padding:40px"><i class="fas fa-spinner fa-spin"></i> Loading shared media…</div>';
    let uname='', lvl=0;
    try {
      const u = (typeof window.currentUser !== 'undefined') ? window.currentUser : null;
      if (u) { uname = u.username || ''; lvl = u.level || 0; }
    } catch(e){}
    // Map UI filter to server-side kind
    let serverKind = 'all';
    if (filt === 'image') serverKind = 'image';
    else if (filt === 'video') serverKind = 'video';
    else if (filt === 'file') serverKind = 'file';
    try {
      const r = await fetch('/api/attachments?user=' + encodeURIComponent(uname) + '&role=' + lvl + '&kind=' + serverKind, { cache:'no-store' });
      const j = await r.json();
      if (!(j && j.success && Array.isArray(j.items))){
        body.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--muted,#94a3b8)"><i class="fas fa-triangle-exclamation" style="font-size:48px;color:#f59e0b;margin-bottom:14px"></i><div style="font-size:14px;font-weight:700;color:var(--text,#fff)">Could not load shared media</div><div style="font-size:12px;margin-top:6px">'+esc(j && j.error || 'Unknown error')+'</div></div>';
        return;
      }
      const items = j.items || [];
      if (!items.length){
        body.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--muted,#94a3b8)"><i class="fas fa-folder-open" style="font-size:48px;color:#475569;margin-bottom:14px"></i><div style="font-size:14px;font-weight:700;color:var(--text,#fff)">No shared media yet</div><div style="font-size:12px;margin-top:6px">Files sent as chat attachments will appear here. '+(lvl>=100?'You will see uploads from ALL staff.':'You see your own uploads and media in channels you joined.')+'</div></div>';
        return;
      }
      body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">' + items.map(it => sharedCardHtml(it)).join('') + '</div>';
      // Hydrate previews for images (lazy fetch dataUrl from /api/attachments/:id)
      items.forEach(it => {
        try {
          const ph = document.getElementById('msMlSPrev_' + it.id);
          if (!ph) return;
          const t = (it.type||'').toLowerCase();
          if (t.indexOf('image/') === 0) {
            // Fetch and embed
            fetch('/api/attachments/' + encodeURIComponent(it.id)).then(r=>r.json()).then(j2 => {
              if (j2 && j2.success && j2.file && j2.file.dataUrl){
                ph.innerHTML = '<img src="'+j2.file.dataUrl+'" style="width:100%;height:100%;object-fit:cover">';
              }
            }).catch(()=>{});
          } else if (t.indexOf('video/') === 0) {
            ph.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8"><i class="fas fa-film" style="font-size:32px"></i></div><div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px">VIDEO</div>';
          } else if (t.indexOf('audio/') === 0) {
            ph.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8"><i class="fas fa-headphones" style="font-size:32px"></i></div>';
          } else {
            ph.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8"><i class="fas fa-file" style="font-size:32px"></i></div>';
          }
        } catch(e){}
      });
    } catch(e){
      body.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--muted,#94a3b8)"><i class="fas fa-triangle-exclamation" style="font-size:48px;color:#f59e0b;margin-bottom:14px"></i><div style="font-size:14px;font-weight:700;color:var(--text,#fff)">Network error</div><div style="font-size:12px;margin-top:6px">'+esc(String(e.message||e))+'</div></div>';
    }
  }
}

function sharedCardHtml(it){
  const t = (it.type||'').toLowerCase();
  const kindBadge = t.indexOf('image/')===0 ? '<span style="background:#10b981">IMG</span>'
                   : t.indexOf('video/')===0 ? '<span style="background:#dc2626">VID</span>'
                   : t.indexOf('audio/')===0 ? '<span style="background:#8b5cf6">AUD</span>'
                   : '<span style="background:#64748b">FILE</span>';
  const chBadge = it.channel && it.channel.indexOf('ch:')===0 ? '<span style="background:rgba(139,92,246,0.18);color:#a78bfa;padding:1px 6px;border-radius:4px;font-size:9.5px;font-weight:700;margin-left:4px">#'+esc((it.channel||'').substring(3))+'</span>' : '';
  return '<div style="background:var(--surface2,#1e293b);border:1px solid var(--border,#334155);border-radius:10px;overflow:hidden">'
    + '<div id="msMlSPrev_'+it.id+'" style="position:relative;aspect-ratio:16/9;background:#000;display:flex;align-items:center;justify-content:center;color:#475569"><i class="fas fa-image" style="font-size:24px"></i></div>'
    + '<div style="padding:9px 11px">'
    +   '<div style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--muted,#94a3b8);margin-bottom:4px">'+kindBadge.replace('<span ','<span style="color:#fff;padding:2px 6px;border-radius:4px;font-weight:700;font-size:9.5px" ')+'<span>'+esc(it.uploaderName||it.uploaderUser||'Unknown')+'</span>'+chBadge+'</div>'
    +   '<div style="font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(it.name||'')+'">'+esc(it.name||'File')+'</div>'
    +   '<div style="font-size:10.5px;color:var(--muted,#94a3b8);margin-top:2px">'+esc(fmtDate(it.uploadedAt))+' &middot; '+esc(fmtBytes(it.size))+'</div>'
    +   '<div style="display:flex;gap:5px;margin-top:7px">'
    +     '<button onclick="MS.sharedView(\''+esc(it.id)+'\')" style="flex:1;padding:5px;font-size:11px;border:0;border-radius:6px;background:#0ea5e9;color:#fff;font-weight:700;cursor:pointer" title="View"><i class="fas fa-eye"></i></button>'
    +     '<button onclick="MS.sharedDownload(\''+esc(it.id)+'\',\''+esc((it.name||'file').replace(/[\\\'"]/g,'_'))+'\')" style="flex:1;padding:5px;font-size:11px;border:0;border-radius:6px;background:#10b981;color:#fff;font-weight:700;cursor:pointer" title="Download"><i class="fas fa-download"></i></button>'
    +   '</div>'
    + '</div></div>';
}

async function sharedView(id){
  try {
    const r = await fetch('/api/attachments/' + encodeURIComponent(id));
    const j = await r.json();
    if (!j || !j.success || !j.file || !j.file.dataUrl) { alert('Could not load file.'); return; }
    const f = j.file;
    const t = (f.type||'').toLowerCase();
    let inner = '';
    if (t.indexOf('image/')===0) inner = '<img src="'+f.dataUrl+'" style="max-width:100%;max-height:65vh;border-radius:8px;border:1px solid var(--border)">';
    else if (t.indexOf('video/')===0) inner = '<video controls autoplay style="max-width:100%;max-height:65vh;border-radius:8px" src="'+f.dataUrl+'"></video>';
    else if (t.indexOf('audio/')===0) inner = '<audio controls style="width:100%" src="'+f.dataUrl+'"></audio>';
    else inner = '<div style="padding:30px;text-align:center"><i class="fas fa-file" style="font-size:48px;color:#475569;margin-bottom:14px"></i><div style="font-size:13px;color:var(--muted)">Preview not available for this file type.</div></div>';
    if (typeof window.commsShowMediaPreview === 'function'){
      window.commsShowMediaPreview(esc(f.name||'File'), inner + '<div style="margin-top:10px;display:flex;gap:8px;justify-content:center"><button class="btn btn-secondary" onclick="MS.sharedDownload(\''+esc(id)+'\',\''+esc((f.name||'file').replace(/[\\\'"]/g,'_'))+'\')"><i class="fas fa-download"></i> Download</button></div>');
    } else {
      // Fallback popup
      const w = window.open('', '_blank');
      if (w) { w.document.write('<title>'+esc(f.name||'File')+'</title>'+inner); }
    }
  } catch(e){ alert('Network error: '+e.message); }
}

async function sharedDownload(id, fname){
  try {
    const r = await fetch('/api/attachments/' + encodeURIComponent(id));
    const j = await r.json();
    if (!j || !j.success || !j.file || !j.file.dataUrl) { alert('Could not load file.'); return; }
    const a = document.createElement('a');
    a.href = j.file.dataUrl;
    a.download = fname || j.file.name || ('file-' + id);
    document.body.appendChild(a); a.click(); a.remove();
  } catch(e){ alert('Download failed: '+e.message); }
}

function mediaCardHtml(it){
  const kindBadge = it.kind === 'recording' ? '<span style="background:#dc2626">REC</span>' : it.kind==='screenshot' ? '<span style="background:#0ea5e9">SHOT</span>' : it.kind==='webcam' ? '<span style="background:#ec4899">CAM</span>' : '<span style="background:#6b7280">FILE</span>';
  return '<div style="background:var(--surface2,#1e293b);border:1px solid var(--border,#334155);border-radius:10px;overflow:hidden;cursor:pointer" onclick="MS.mediaOpen('+it.id+')">'
    + '<div id="msMlPrev_'+it.id+'" style="position:relative;aspect-ratio:16/9;background:#000;display:flex;align-items:center;justify-content:center;color:#475569"><i class="fas fa-image" style="font-size:24px"></i></div>'
    + '<div style="padding:9px 11px"><div style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--muted,#94a3b8);margin-bottom:4px">'+ kindBadge.replace('<span ', '<span style="color:#fff;padding:2px 6px;border-radius:4px;font-weight:700;font-size:9.5px" ') + '<span>'+esc(it.ownerName||'')+'</span></div>'
    + '<div style="font-size:12.5px;font-weight:700">'+esc(it.title||'Media')+'</div>'
    + '<div style="font-size:10.5px;color:var(--muted,#94a3b8);margin-top:2px">'+esc(fmtDate(it.ts))+' &middot; '+esc(fmtBytes(it.size))+'</div>'
    + '<div style="display:flex;gap:5px;margin-top:7px" onclick="event.stopPropagation()">'
    +   '<button onclick="MS.mediaDownload('+it.id+')" style="flex:1;padding:5px;font-size:11px;border:0;border-radius:6px;background:#0ea5e9;color:#fff;font-weight:700;cursor:pointer"><i class="fas fa-download"></i></button>'
    +   '<button onclick="MS.mediaDelete('+it.id+')" style="flex:1;padding:5px;font-size:11px;border:0;border-radius:6px;background:#475569;color:#fff;font-weight:700;cursor:pointer"><i class="fas fa-trash"></i></button>'
    + '</div></div></div>';
}

async function mediaOpen(id){
  const it = await mediaGet(id);
  if (!it) return;
  const url = URL.createObjectURL(it.blob);
  const inner = (/^video\//.test(it.type||'') || it.kind==='recording')
    ? '<video controls autoplay style="max-width:100%;max-height:65vh;border-radius:8px" src="'+url+'"></video>'
    : '<img src="'+url+'" style="max-width:100%;max-height:65vh;border-radius:8px;border:1px solid var(--border)">';
  if (typeof window.commsShowMediaPreview === 'function'){
    window.commsShowMediaPreview(esc(it.title||'Media') + ' &middot; ' + esc(it.ownerName||''), inner + '<div style="margin-top:10px;display:flex;gap:8px;justify-content:center"><button class="btn btn-secondary" onclick="MS.mediaDownload('+it.id+')"><i class="fas fa-download"></i> Download</button><button class="btn btn-secondary" onclick="MS.mediaDelete('+it.id+')"><i class="fas fa-trash"></i> Delete</button></div>');
  }
}

async function mediaDownload(id){
  const it = await mediaGet(id);
  if (!it) return;
  const ext = (it.type||'').includes('video') ? 'webm' : (it.type||'').includes('png') ? 'png' : 'bin';
  const url = URL.createObjectURL(it.blob);
  const a = document.createElement('a');
  a.href = url; a.download = (it.kind||'media') + '-' + new Date(it.ts).toISOString().replace(/[:.]/g,'-') + '.' + ext;
  document.body.appendChild(a); a.click(); a.remove();
}

async function mediaDeleteUi(id){
  if (!confirm('Delete this media item?')) return;
  await mediaDelete(id);
  mediaLibraryRefresh();
  toast({ type:'success', title:'Deleted', duration: 2500 });
}

window.MS.mediaLibraryOpen = mediaLibraryOpen;
window.MS.mediaLibraryRefresh = mediaLibraryRefresh;
window.MS.mediaOpen = mediaOpen;
window.MS.mediaDownload = mediaDownload;
window.MS.mediaDelete = mediaDeleteUi;
window.mediaLibraryOpen = mediaLibraryOpen;
// v14.7: Shared media (server-side) helpers
window.MS.mediaTabSwitch = mediaTabSwitch;
window.MS.sharedView = sharedView;
window.MS.sharedDownload = sharedDownload;

// ─── 6. Functional calls (voice / video / group) ─────────────────────────
const CALL = { active:null, recorder:null, recChunks:[], recStartTs:0, recTimer:null, micStream:null, camStream:null };

function callPickRecipients(kind){
  return new Promise((resolve) => {
    let users = [];
    try { users = Object.keys(window.USERS||{}).map(u => ({ key:u, name: window.USERS[u].name || u, role: window.USERS[u].role || '' })).filter(u => u.key !== meKey()); } catch(e){}
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    const icon = kind==='group' ? 'fa-users' : kind==='video' ? 'fa-video' : 'fa-phone';
    const tColor = kind==='group' ? '#8b5cf6' : kind==='video' ? '#0ea5e9' : '#16a34a';
    const optsHtml = users.map(u => '<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;margin-bottom:5px;cursor:pointer"><input type="checkbox" data-k="'+esc(u.key)+'" data-n="'+esc(u.name)+'" class="ms-rcp" '+(kind==='group'?'':'name="rcp-radio"')+' style="margin:0"><span><div style="font-weight:700;color:#fff">'+esc(u.name)+'</div><div style="font-size:11px;color:#94a3b8">'+esc(u.role)+'</div></span></label>').join('');
    modal.innerHTML = '<div style="background:#0f172a;color:#fff;border:1px solid #1e293b;border-radius:14px;width:100%;max-width:460px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.55)">'
      + '<div style="padding:14px 18px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between"><div style="font-weight:800"><i class="fas '+icon+'" style="color:'+tColor+'"></i> &nbsp;'+(kind==='group'?'Group call':kind==='video'?'Video call':'Voice call')+'</div><button id="msCallCancel" style="background:transparent;color:#94a3b8;border:0;cursor:pointer;font-size:18px">&times;</button></div>'
      + '<div style="padding:14px 18px;max-height:55vh;overflow:auto">'+(optsHtml||'<div style="color:#94a3b8;font-size:12.5px">No teammates available.</div>')+'</div>'
      + '<div style="padding:12px 18px;border-top:1px solid #1e293b;display:flex;justify-content:flex-end;gap:8px"><button id="msCallStart" class="btn btn-primary" style="background:'+tColor+'"><i class="fas '+icon+'"></i> &nbsp;Start call</button></div>'
      + '</div>';
    document.body.appendChild(modal);
    if (kind !== 'group'){
      // single recipient: act like radio
      modal.querySelectorAll('.ms-rcp').forEach(c => c.addEventListener('change', () => {
        if (c.checked) modal.querySelectorAll('.ms-rcp').forEach(o => { if (o !== c) o.checked = false; });
      }));
    }
    modal.querySelector('#msCallCancel').onclick = ()=>{ modal.remove(); resolve(null); };
    modal.onclick = (e)=>{ if (e.target===modal){ modal.remove(); resolve(null); } };
    modal.querySelector('#msCallStart').onclick = () => {
      const sel = Array.from(modal.querySelectorAll('.ms-rcp:checked')).map(c => ({ key:c.dataset.k, name:c.dataset.n }));
      if (!sel.length){ toast({ type:'error', title:'Pick at least one teammate' }); return; }
      modal.remove();
      resolve(sel);
    };
  });
}

async function startCall(kind){
  kind = kind || 'voice';
  if (CALL.active){ toast({ type:'error', title:'Already in a call', body:'End the current call before starting a new one.' }); return; }
  const targets = await callPickRecipients(kind);
  if (!targets) return;

  // Acquire local stream
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: kind === 'voice' ? false : { width: 640, height: 480 }
    });
  } catch(err){
    toast({ type:'error', title:'Microphone/camera blocked', body:'Allow access in your browser to start a call.' });
    return;
  }

  CALL.active = { kind, targets, startedAt: Date.now(), stream };
  callShowActiveModal();

  // Send invite via broadcast (so other tabs / users in same browser get the ring)
  targets.forEach(t => {
    try { _shareChannel && _shareChannel.postMessage({ kind:'call_invite', callKind: kind, fromUser: meKey(), fromName: meName(), toUser: t.key, toName: t.name, ts: Date.now() }); } catch(e){}
  });
  toast({ type:'call', title:(kind==='group'?'Group ':kind==='video'?'Video ':'Voice ')+'call started', body:'Calling: ' + targets.map(t=>t.name).join(', '), duration: 4000 });
}

function callShowActiveModal(){
  if (!CALL.active) return;
  const c = CALL.active;
  let modal = document.getElementById('msCallActive');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'msCallActive';
  modal.style.cssText = 'position:fixed;right:24px;bottom:24px;width:380px;background:#0f172a;color:#fff;border:1px solid #1e293b;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,0.55);z-index:99998';
  const kindLabel = c.kind === 'group' ? 'Group call' : c.kind === 'video' ? 'Video call' : 'Voice call';
  const kindIcon  = c.kind === 'group' ? 'fa-users' : c.kind === 'video' ? 'fa-video' : 'fa-phone';
  modal.innerHTML = ''
    + '<div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:8px 12px;display:flex;align-items:center;justify-content:space-between"><div style="font-weight:800;font-size:12.5px"><i class="fas '+kindIcon+'"></i> &nbsp;'+kindLabel+' &middot; <span id="msCallDur">00:00</span></div><button onclick="MS.callEnd()" style="background:#ef4444;color:#fff;border:0;border-radius:6px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer"><i class="fas fa-phone-slash"></i> End</button></div>'
    + (c.kind !== 'voice' ? '<div style="background:#000"><video id="msCallVideo" autoplay playsinline muted style="width:100%;display:block;max-height:240px;object-fit:cover"></video></div>' : '<div style="padding:30px 16px;text-align:center;background:#0b1220"><i class="fas fa-phone-volume" style="font-size:36px;color:#16a34a"></i><div style="font-size:13px;color:#94a3b8;margin-top:8px">Audio call in progress</div></div>')
    + '<div style="padding:8px 12px;font-size:11.5px;color:#94a3b8;background:#0b1220">With: ' + esc(c.targets.map(t=>t.name).join(', ')) + '</div>'
    + '<div style="padding:10px 12px;display:flex;gap:6px;flex-wrap:wrap;background:#0f172a;border-top:1px solid #1e293b">'
    +   '<button onclick="MS.callMute()" id="msCallMute" style="flex:1;min-width:64px;padding:8px;background:#1e293b;color:#fff;border:0;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700"><i class="fas fa-microphone"></i> Mute</button>'
    + (c.kind !== 'voice' ? '<button onclick="MS.callVideoToggle()" id="msCallVidTog" style="flex:1;min-width:64px;padding:8px;background:#1e293b;color:#fff;border:0;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700"><i class="fas fa-video"></i> Cam</button>' : '')
    +   '<button onclick="MS.callRecordToggle()" id="msCallRec" style="flex:1;min-width:64px;padding:8px;background:#1e293b;color:#fff;border:0;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700"><i class="fas fa-circle"></i> Rec</button>'
    +   '<button onclick="commsShareScreen()" style="flex:1;min-width:64px;padding:8px;background:#1e293b;color:#fff;border:0;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700"><i class="fas fa-desktop"></i> Share</button>'
    + '</div>';
  document.body.appendChild(modal);
  if (c.kind !== 'voice'){
    const v = document.getElementById('msCallVideo');
    if (v) v.srcObject = c.stream;
  }
  // Duration timer
  if (CALL._timer) clearInterval(CALL._timer);
  CALL._timer = setInterval(() => {
    const el = document.getElementById('msCallDur'); if (!el) return;
    const s = Math.floor((Date.now() - c.startedAt) / 1000);
    el.textContent = String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }, 500);
}

function callMute(){
  if (!CALL.active) return;
  const tracks = CALL.active.stream.getAudioTracks();
  if (!tracks.length) return;
  tracks[0].enabled = !tracks[0].enabled;
  const b = document.getElementById('msCallMute');
  if (b) b.innerHTML = tracks[0].enabled ? '<i class="fas fa-microphone"></i> Mute' : '<i class="fas fa-microphone-slash" style="color:#ef4444"></i> Unmute';
}

function callVideoToggle(){
  if (!CALL.active) return;
  const tracks = CALL.active.stream.getVideoTracks();
  if (!tracks.length) return;
  tracks[0].enabled = !tracks[0].enabled;
  const b = document.getElementById('msCallVidTog');
  if (b) b.innerHTML = tracks[0].enabled ? '<i class="fas fa-video"></i> Cam' : '<i class="fas fa-video-slash" style="color:#ef4444"></i> Cam';
}

async function callRecordToggle(){
  if (!CALL.active) return;
  if (CALL.recorder){ try { CALL.recorder.stop(); } catch(e){} return; }
  try {
    const stream = CALL.active.stream;
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : (CALL.active.kind === 'voice' ? 'audio/webm' : 'video/webm'));
    const rec = new MediaRecorder(stream, { mimeType: mime });
    CALL.recChunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) CALL.recChunks.push(e.data); };
    rec.onstop = async () => {
      const isVideo = CALL.active && CALL.active.kind !== 'voice';
      const blob = new Blob(CALL.recChunks, { type: isVideo ? 'video/webm' : 'audio/webm' });
      await mediaSave(blob, { title: (CALL.active?CALL.active.kind:'call') + ' call recording', kind:'recording', durationMs: Date.now() - CALL.recStartTs });
      toast({ type:'success', title:'Call recording saved', body:'Open Media Library to play it back.', actionLabel:'Open library', onAction: mediaLibraryOpen });
      CALL.recorder = null;
      const b = document.getElementById('msCallRec'); if (b) b.innerHTML = '<i class="fas fa-circle"></i> Rec';
    };
    rec.start(1000);
    CALL.recorder = rec;
    CALL.recStartTs = Date.now();
    const b = document.getElementById('msCallRec'); if (b) b.innerHTML = '<i class="fas fa-stop" style="color:#dc2626"></i> Stop';
    toast({ type:'success', title:'Recording call', body:'It will be saved to your Media Library when you stop.' });
  } catch(err){
    toast({ type:'error', title:'Could not start recording', body: err && err.message || 'unknown error' });
  }
}

function callEnd(){
  if (!CALL.active) return;
  try { if (CALL.recorder && CALL.recorder.state !== 'inactive') CALL.recorder.stop(); } catch(e){}
  try { CALL.active.stream.getTracks().forEach(t => t.stop()); } catch(e){}
  if (CALL._timer){ clearInterval(CALL._timer); CALL._timer = null; }
  CALL.active = null;
  const m = document.getElementById('msCallActive'); if (m) m.remove();
  toast({ type:'success', title:'Call ended', duration: 2500 });
}

function callShowIncoming(invite){
  // Build the ring modal
  let modal = document.getElementById('msCallIncoming');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'msCallIncoming';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100001;display:flex;align-items:center;justify-content:center;padding:20px';
  const icon = invite.callKind==='group'?'fa-users':invite.callKind==='video'?'fa-video':'fa-phone';
  modal.innerHTML = '<div style="background:#0f172a;color:#fff;border:2px solid #16a34a;border-radius:14px;width:100%;max-width:380px;overflow:hidden;text-align:center;box-shadow:0 30px 80px rgba(22,163,74,0.4)">'
    + '<div style="padding:24px 18px 12px"><div style="width:72px;height:72px;margin:0 auto 12px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#15803d);display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;animation:msPulse 1.2s infinite"><i class="fas '+icon+'"></i></div><div style="font-weight:800;font-size:18px">'+esc(invite.fromName)+'</div><div style="color:#94a3b8;font-size:12.5px;margin-top:4px">Incoming '+(invite.callKind==='group'?'group ':invite.callKind==='video'?'video ':'voice ')+'call</div></div>'
    + '<div style="padding:14px 18px 20px;display:flex;gap:10px;justify-content:center"><button id="msCallDecline" style="flex:1;background:#ef4444;color:#fff;border:0;border-radius:10px;padding:10px;font-weight:700;cursor:pointer"><i class="fas fa-phone-slash"></i> Decline</button><button id="msCallAccept" style="flex:1;background:#16a34a;color:#fff;border:0;border-radius:10px;padding:10px;font-weight:700;cursor:pointer"><i class="fas fa-phone"></i> Accept</button></div>'
    + '</div>';
  document.body.appendChild(modal);
  // Soft ring tone
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    let stopRing = false;
    const ring = () => {
      if (stopRing) { try{ctx.close();}catch(e){} return; }
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.frequency.value = 480; gain.gain.value = 0.06;
      osc.connect(gain).connect(ctx.destination); osc.start();
      setTimeout(()=>{ try { osc.stop(); }catch(e){} setTimeout(ring, 700); }, 350);
    };
    ring();
    modal.__stopRing = () => { stopRing = true; };
  } catch(e){}
  document.getElementById('msCallDecline').onclick = () => { try { modal.__stopRing && modal.__stopRing(); } catch(e){} modal.remove(); };
  document.getElementById('msCallAccept').onclick = async () => {
    try { modal.__stopRing && modal.__stopRing(); } catch(e){}
    modal.remove();
    // Start a local call (acquire local stream so user has a working session)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video: invite.callKind==='voice' ? false : { width:640, height:480 } });
      CALL.active = { kind: invite.callKind, targets:[{ key: invite.fromUser, name: invite.fromName }], startedAt: Date.now(), stream };
      callShowActiveModal();
    } catch(e){
      toast({ type:'error', title:'Could not start call', body:'Mic/camera permission denied.' });
    }
  };
  // Desktop notification
  toast({ type:'call', title:'Incoming call from '+invite.fromName, body:invite.callKind+' call', always:true, duration: 0, actionLabel:'Open', onAction:()=>{ try { window.focus(); }catch(e){} } });
}

window.MS.callEnd = callEnd;
window.MS.callMute = callMute;
window.MS.callVideoToggle = callVideoToggle;
window.MS.callRecordToggle = callRecordToggle;
window.MS.callStart = startCall;
window.startCall = startCall;
window.startVoiceCall = () => startCall('voice');
window.startVideoCall = () => startCall('video');
window.startGroupCall = () => startCall('group');

// ─── 7. Mandatory morning check-in gate ──────────────────────────────────
function todayKey(){ const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

function morningCheckinDoneToday(){
  try {
    // Honour the existing attendanceState if it exists for the current user
    if (window.attendanceState && window.attendanceState.checkinDone){
      // Was it stamped today?
      const at = window.attendanceState.checkinSubmittedAt;
      if (at && new Date(at).toDateString() === new Date().toDateString()) return true;
    }
    const flag = localStorage.getItem('gg_checkin_' + meKey() + '_' + todayKey());
    return flag === '1';
  } catch(e){ return false; }
}

function morningCheckinMark(){
  try { localStorage.setItem('gg_checkin_' + meKey() + '_' + todayKey(), '1'); } catch(e){}
  // Also mark in the existing attendance state so the rest of the app reflects it
  try {
    if (window.attendanceState){
      window.attendanceState.checkinDone = true;
      window.attendanceState.checkinSubmittedAt = new Date().toISOString();
      if (typeof window.saveAtt === 'function') window.saveAtt();
    }
  } catch(e){}
}

function morningCheckinShow(force){
  // v14.6: FULLY DISABLED per user request. The modal was popping up
  // on every login/refresh and was disruptive. Staff navigate to the
  // Attendance page themselves when they want to check in.
  return;
  // eslint-disable-next-line no-unreachable
  try {
    const app = document.getElementById('app');
    const login = document.getElementById('loginScreen');
    const appVisible = app && getComputedStyle(app).display !== 'none';
    const loginHidden = !login || getComputedStyle(login).display === 'none';
    if (!appVisible || !loginHidden) return;
    // Skip if agent or student portal modal is open
    if (document.getElementById('agentPortalModal')) return;
    if (document.getElementById('studentPortalModal') || document.getElementById('sp2Modal')) return;
  } catch(e){ return; }
  if (!force && morningCheckinDoneToday()) return;
  // If they're already on the attendance page, no need to gate them
  try {
    const onAttendance = (location.hash || '').toLowerCase().indexOf('attendance') >= 0
       || (document.querySelector('[data-page="attendance"]')||{}).offsetParent != null;
    if (onAttendance && !force) return;
  } catch(e){}
  let modal = document.getElementById('msMorningGate');
  if (modal) return; // already open
  modal = document.createElement('div');
  modal.id = 'msMorningGate';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.92);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)';
  const name = meName();
  modal.innerHTML = '<div style="background:#0f172a;color:#fff;border-radius:16px;width:100%;max-width:480px;overflow:hidden;border:1px solid #1e293b;box-shadow:0 30px 80px rgba(0,0,0,0.55)">'
    + '<div style="background:linear-gradient(135deg,#16a34a,#0ea5e9);padding:20px 22px"><div style="font-size:11.5px;font-weight:700;opacity:0.85;text-transform:uppercase;letter-spacing:0.08em">Daily check-in required</div><div style="font-size:22px;font-weight:800;margin-top:4px">Good morning, '+esc(name)+' &#9728;</div><div style="font-size:13px;opacity:0.92;margin-top:6px;line-height:1.45">Please mark your attendance for today to start your day.</div></div>'
    + '<div style="padding:22px"><div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:#0b1220;border:1px solid #1e293b;border-radius:10px;margin-bottom:18px"><div style="width:36px;height:36px;border-radius:50%;background:rgba(14,165,233,0.18);display:flex;align-items:center;justify-content:center;color:#38bdf8;font-size:16px"><i class="fas fa-clipboard-check"></i></div><div style="font-size:13px;color:#cbd5e1;line-height:1.45">Click below to go to the <b style="color:#fff">Attendance</b> page and complete your check-in. This reminder will keep showing until you check in.</div></div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px"><button id="msGateGoToAttendance" class="btn btn-primary" style="background:linear-gradient(135deg,#16a34a,#0ea5e9);color:#fff;padding:11px 22px;border-radius:10px;border:0;font-weight:800;cursor:pointer;font-size:14px"><i class="fas fa-arrow-right"></i> &nbsp;Check in now</button></div>'
    + '</div></div>';
  document.body.appendChild(modal);

  document.getElementById('msGateGoToAttendance').onclick = () => {
    modal.remove();
    // Navigate to the attendance page
    try {
      if (typeof window.nav === 'function') {
        window.nav('attendance');
      } else if (location && typeof location.assign === 'function') {
        location.hash = '#attendance';
      }
    } catch(e){}
    // Do NOT mark check-in as done here. Only the actual attendance submission
    // (in the attendance page) should mark it. The modal will reappear via the
    // periodic re-check if they navigate away without completing check-in.
  };
}

// Periodically re-show the check-in modal until the user actually checks in.
// (Once attendanceState.checkinDone flips, morningCheckinDoneToday() returns
// true and morningCheckinShow becomes a no-op for the rest of the day.)
// v14.5: DISABLED periodic re-show — was annoying users. Now only shown
// once on initial login (handled in startApp). If staff want to mark
// attendance, they navigate to the Attendance page themselves.
// (function reCheckinLoop(){
//   setInterval(() => {
//     try { morningCheckinShow(false); } catch(e){}
//   }, 60000);
// })();

window.MS.morningCheckinShow = morningCheckinShow;
window.MS.morningCheckinDoneToday = morningCheckinDoneToday;

// v14.6: Ensure any lingering check-in modal is removed on script load.
try {
  const ex = document.getElementById('msMorningGate');
  if (ex) ex.remove();
} catch(e){}

// ─── 8. Hook into login flow ─────────────────────────────────────────────
// Wrap startApp so we can: ask notification permission, render any active shares,
// and force the morning check-in if not yet done today.
(function hookStartApp(){
  const tryWrap = () => {
    if (typeof window.startApp !== 'function') return false;
    if (window.startApp.__msWrapped) return true;
    const orig = window.startApp;
    window.startApp = function(){
      const r = orig.apply(this, arguments);
      try { setTimeout(() => {
        notifyPermissionAsk();
        renderShareBanner();
        // v14.6: Morning check-in modal FULLY DISABLED per user request.
        // Staff navigate to the Attendance page themselves when needed.
        // morningCheckinShow(false);
      }, 700); } catch(e){}
      return r;
    };
    window.startApp.__msWrapped = true;
    return true;
  };
  if (!tryWrap()){
    // startApp not defined yet — wait
    let tries = 0;
    const iv = setInterval(() => { tries++; if (tryWrap() || tries > 40) clearInterval(iv); }, 200);
  }
})();

// ─── 9. Help link in window for the user ─────────────────────────────────
window.MS.help = function(){
  console.log('%cGenuine Global Media & Comms Suite','color:#0ea5e9;font-weight:bold;font-size:14px');
  console.log('  MS.callStart("voice"|"video"|"group") — start a call');
  console.log('  MS.mediaLibraryOpen()                 — open media library');
  console.log('  MS.shareView(ownerKey)                — view someone\'s screen share');
  console.log('  MS.morningCheckinShow(true)           — re-open the check-in modal');
  console.log('  commsScreenshot() / commsRecordScreen() — patched, saves to library');
};

// Boot
try { renderShareBanner(); } catch(e){}

})();
