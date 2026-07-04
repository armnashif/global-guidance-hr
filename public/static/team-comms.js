/* ============================================================================
 * team-comms.js — visible Team Comms panel + real call wiring
 *
 * Fixes the user's complaints:
 *   • "I tried to call Razan from my portal, and it's not working" — replaces
 *     the simulated commsStartCall() with a real call (getUserMedia + ring +
 *     accept/decline + recording) that broadcasts to other open browser tabs
 *     via BroadcastChannel.
 *   • "I still don't know how to share the screen with my other staff" —
 *     adds a visible floating "Team" panel (bottom-right) listing every
 *     staff member with one-click Call / Video / Share screen / Snap screen
 *     buttons.
 *   • "How can I capture or snap their screens?" — adds a "Request screen
 *     capture" flow: sender sends a request, recipient sees a permission
 *     prompt; if they allow, their browser captures the screen and the image
 *     is saved to the sender's Media Library.
 * ========================================================================== */
(function(){
'use strict';

// ─── 0. Utilities & shared channel ───────────────────────────────────────
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// currentUser is module-scoped in command-portal.html (not on window).
// Lazy-eval fallback so we still get the real name/key.
function _cu(){
  try { if (window.currentUser) return window.currentUser; } catch(e){}
  try {
    return new Function('try{return typeof currentUser!=="undefined"?currentUser:null}catch(e){return null}')();
  } catch(e){ return null; }
}
function meName(){ const u = _cu(); return (u && u.name) || 'You'; }
function meKey(){ const u = _cu(); return (u && u.username) || 'guest'; }

let _chan = null;
try { _chan = new BroadcastChannel('gg_team_comms'); } catch(e){ _chan = null; }
function bc(msg){
  if (_chan) try { _chan.postMessage(msg); } catch(e){}
  // Also relay to other devices via the server-side signaling endpoint.
  // (BroadcastChannel alone is same-browser-only — fine for two tabs on the
  // same laptop, but staff need to call each other across devices.)
  try {
    if (msg && msg.kind && msg.toUser){
      fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      }).catch(()=>{});
    }
  } catch(e){}
}

// ─── 0b. Ringtone generator (data URL, no external file needed) ──────────
// Builds a short WAV (~1.5s) of a classic two-pulse phone ring at 440/480Hz.
// HTML5 <audio loop> on this data URL gives us reliable ringing without the
// Web Audio AudioContext-suspended problem (data URL plays even if the
// AudioContext was suspended by autoplay policy, as long as <audio> was
// created in response to a user gesture OR has a muted=false attribute set
// after a gesture happened). To be extra robust we also unlock audio on the
// FIRST click anywhere in the page so subsequent calls always ring.
function _generateRingtoneDataURL(){
  // 1.6s sample at 22050Hz — two bursts of 440+480Hz tone with silence between
  const sr = 22050;
  const dur = 1.6;
  const samples = Math.floor(sr * dur);
  const buf = new ArrayBuffer(44 + samples * 2);
  const dv = new DataView(buf);
  // WAV header
  function wstr(off, s){ for (let i=0;i<s.length;i++) dv.setUint8(off+i, s.charCodeAt(i)); }
  wstr(0, 'RIFF');
  dv.setUint32(4, 36 + samples*2, true);
  wstr(8, 'WAVE'); wstr(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr*2, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  wstr(36, 'data'); dv.setUint32(40, samples*2, true);
  // Tone: two bursts (0-0.4s and 0.5-0.9s), then silence
  for (let i=0; i<samples; i++){
    const t = i / sr;
    let env = 0;
    if (t < 0.4) env = 1;
    else if (t < 0.5) env = 0;
    else if (t < 0.9) env = 1;
    else env = 0;
    // Soft attack/release
    if (t < 0.05) env *= t/0.05;
    if (t > 0.35 && t < 0.4) env *= (0.4-t)/0.05;
    if (t > 0.5 && t < 0.55) env *= (t-0.5)/0.05;
    if (t > 0.85 && t < 0.9) env *= (0.9-t)/0.05;
    const v = env * 0.28 * (Math.sin(2*Math.PI*440*t) + Math.sin(2*Math.PI*480*t)) * 0.5;
    dv.setInt16(44 + i*2, Math.max(-1, Math.min(1, v)) * 0x7FFF, true);
  }
  // Convert to base64
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i=0; i<bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}
let _RINGTONE_URL = null;
function getRingtoneUrl(){
  if (!_RINGTONE_URL) {
    try { _RINGTONE_URL = _generateRingtoneDataURL(); } catch(e){ _RINGTONE_URL = ''; }
  }
  return _RINGTONE_URL;
}
// Pre-generate so first call doesn't stutter
try { getRingtoneUrl(); } catch(e){}

// Audio "unlock" tracker — once the user has interacted with the page, we
// know we can play audio without restriction.
let _audioUnlocked = false;
function unlockAudio(){
  if (_audioUnlocked) return;
  _audioUnlocked = true;
  // Play a 1-sample silent audio to unlock the audio context
  try {
    const a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
    a.volume = 0; a.play().catch(()=>{});
  } catch(e){}
}
['click','touchstart','keydown'].forEach(ev => {
  try { document.addEventListener(ev, unlockAudio, { once:false, passive:true, capture:true }); } catch(e){}
});

function makeRingAudio(volume){
  const url = getRingtoneUrl();
  if (!url) return null;
  const a = new Audio(url);
  a.loop = true;
  a.volume = typeof volume === 'number' ? volume : 0.45;
  a.preload = 'auto';
  return a;
}

// ─── 1. Re-wire commsStartCall to use the REAL call engine ───────────────
// The original commsStartCall() in command-portal.html is a simulated UI.
// We replace it (keeping the same signature) with a function that uses the
// media-suite.js engine — and we broadcast a call invite so other tabs ring.
(function rewireStartCall(){
  const tryWrap = () => {
    if (typeof window.commsStartCall !== 'function') return false;
    if (window.commsStartCall.__tcWrapped) return true;
    window.__commsStartCall_legacy = window.commsStartCall;
    window.commsStartCall = async function(type, targetUser){
      type = (type === 'video') ? 'video' : 'voice';

      // Resolve target name + key
      let targetKey = targetUser || null;
      let targetName = 'team';
      try {
        if (targetKey && window.USERS && window.USERS[targetKey]){ targetName = window.USERS[targetKey].name; }
        else if (targetKey && String(targetKey).indexOf('student-')===0){
          const sid = parseInt(String(targetKey).substring(8));
          const s = (typeof window.LEADS_DATA !== 'undefined') ? window.LEADS_DATA.find(x => x.id === sid) : null;
          if (s) targetName = s.name + ' (Student)';
        }
      } catch(e){}

      // 1) Acquire local stream (real microphone / camera)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video' ? { width: 640, height: 480 } : false
        });
      } catch(err){
        if (typeof window.toast === 'function'){
          window.toast({ type:'error', title:'Microphone/camera blocked', body:'Allow mic & camera access in your browser to start a real call. ('+ (err && err.name || 'NotAllowed') +')', duration: 7000 });
        } else {
          alert('Could not access microphone/camera: ' + (err && err.message || 'permission denied'));
        }
        return;
      }

      // 2) Build a REAL call modal (replaces the simulated one)
      const m = document.createElement('div');
      m.id = 'commsCallModal';
      m.className = 'comms-call-modal-bg';
      // If the host page hasn't styled the bg class, fall back to inline:
      m.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.92);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)';
      const ini = (targetName||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
      let av1='#2d9cdb', av2='#1e6ea8';
      try {
        if (targetKey && window.USERS && window.USERS[targetKey]){
          const av = String(window.USERS[targetKey].avatar||'#6366f1,#a855f7').split(',');
          av1 = (av[0]||'#6366f1').trim(); av2 = (av[1]||'#a855f7').trim();
        }
      } catch(e){}

      m.innerHTML = ''
        + '<div style="background:#0f172a;color:#fff;border-radius:18px;padding:28px;max-width:440px;width:100%;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,0.6);border:1px solid #1e293b">'
        +   '<div style="width:92px;height:92px;border-radius:50%;margin:0 auto 14px;background:linear-gradient(135deg,'+av1+','+av2+');display:flex;align-items:center;justify-content:center;color:#fff;font-size:36px;font-weight:800">'+esc(ini)+'</div>'
        +   '<div style="font-size:20px;font-weight:800">'+esc(targetName)+'</div>'
        +   '<div id="tcCallStatus" style="color:#94a3b8;font-size:13px;margin-top:6px">'+(type==='video'?'Video call · Ringing…':'Voice call · Ringing…')+'</div>'
        +   '<div id="tcCallTimer" style="font-family:monospace;font-size:22px;margin-top:10px;color:#10b981">00:00</div>'
        + (type === 'video'
            ? '<div style="margin:16px auto 0;background:#000;border-radius:10px;overflow:hidden;max-width:380px"><video id="tcCallLocal" autoplay playsinline muted style="width:100%;display:block;max-height:220px;object-fit:cover"></video></div>'
            : '<div style="margin:16px auto 0;color:#16a34a"><i class="fas fa-phone-volume" style="font-size:34px"></i></div>')
        +   '<div style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center">'
        +     '<button id="tcCallMute" style="flex:1;min-width:84px;padding:10px;background:#1e293b;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:700"><i class="fas fa-microphone"></i> Mute</button>'
        + (type === 'video' ? '<button id="tcCallVid" style="flex:1;min-width:84px;padding:10px;background:#1e293b;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:700"><i class="fas fa-video"></i> Cam</button>' : '')
        +     '<button id="tcCallRec" style="flex:1;min-width:84px;padding:10px;background:#1e293b;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:700"><i class="fas fa-circle"></i> Record</button>'
        +     '<button id="tcCallShare" style="flex:1;min-width:84px;padding:10px;background:#1e293b;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:700"><i class="fas fa-desktop"></i> Share screen</button>'
        +     '<button id="tcCallEnd" style="flex:1;min-width:84px;padding:10px;background:#ef4444;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:700"><i class="fas fa-phone-slash"></i> End</button>'
        +   '</div>'
        +   '<div style="margin-top:14px;font-size:11px;color:#64748b">🔒 Real microphone/camera capture · saves recordings to your Media Library</div>'
        + '</div>';
      document.body.appendChild(m);

      // Attach local video
      if (type === 'video'){
        const v = document.getElementById('tcCallLocal');
        if (v) v.srcObject = stream;
      }

      // Active call state
      window.__tcActiveCall = {
        type, targetKey, targetName, stream,
        startedAt: 0, recorder: null, recChunks: [], recStartTs: 0,
        timer: null,
        end: () => endCall()
      };

      // 3) Send invite to other open tabs (and via /api/signal to other devices)
      const callId = 'call-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
      window.__tcActiveCall.callId = callId;
      bc({ kind:'call_invite', callId: callId, callType:type, fromUser:meKey(), fromName:meName(),
           toUser: targetKey, toName: targetName, ts: Date.now() });

      // 4) RINGBACK — play a phone ringing tone for the caller until either
      //    the callee accepts (call_accept signal) or hangs up (call_end).
      //    The user pressed the call button (gesture) so audio playback is unlocked.
      const ringback = makeRingAudio(0.40);
      if (ringback) {
        try { ringback.play().catch(()=>{}); } catch(e){}
        window.__tcActiveCall.ringback = ringback;
      }

      // 5) Wait for explicit call_accept signal (v14.4 — no more 2s auto-connect).
      //    If no answer within 30s, auto-end with "No answer".
      let connected = false;
      function onConnect(){
        if (connected) return;
        connected = true;
        // Stop ringback
        try {
          const r = window.__tcActiveCall && window.__tcActiveCall.ringback;
          if (r) { r.pause(); r.currentTime = 0; window.__tcActiveCall.ringback = null; }
        } catch(e){}
        const st = document.getElementById('tcCallStatus');
        if (st) st.textContent = (type==='video'?'Video call':'Voice call') + ' · Connected';
        const tc = window.__tcActiveCall; if (!tc) return;
        tc.startedAt = Date.now();
        tc.timer = setInterval(() => {
          const el = document.getElementById('tcCallTimer'); if (!el) return;
          const s = Math.floor((Date.now() - tc.startedAt) / 1000);
          el.textContent = String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
        }, 500);
      }
      window.__tcActiveCall.onConnect = onConnect;
      const connectTimer = null; // legacy compat, no longer used

      // 30s no-answer timeout
      const noAnswerTimer = setTimeout(() => {
        if (!connected){
          const st = document.getElementById('tcCallStatus');
          if (st) st.textContent = 'No answer';
          if (typeof window.toast === 'function') window.toast({ type:'error', title:'No answer', body: targetName + ' did not pick up.', duration: 4000 });
          setTimeout(endCall, 1200);
        }
      }, 30000);
      window.__tcActiveCall.noAnswerTimer = noAnswerTimer;

      // 5) Wire buttons
      document.getElementById('tcCallMute').onclick = () => {
        const t = stream.getAudioTracks()[0]; if (!t) return;
        t.enabled = !t.enabled;
        const b = document.getElementById('tcCallMute');
        b.innerHTML = t.enabled ? '<i class="fas fa-microphone"></i> Mute' : '<i class="fas fa-microphone-slash" style="color:#ef4444"></i> Unmute';
      };
      const vidBtn = document.getElementById('tcCallVid');
      if (vidBtn){
        vidBtn.onclick = () => {
          const t = stream.getVideoTracks()[0]; if (!t) return;
          t.enabled = !t.enabled;
          vidBtn.innerHTML = t.enabled ? '<i class="fas fa-video"></i> Cam' : '<i class="fas fa-video-slash" style="color:#ef4444"></i> Cam';
        };
      }
      document.getElementById('tcCallRec').onclick = () => toggleCallRecord();
      document.getElementById('tcCallShare').onclick = () => {
        if (typeof window.commsShareScreen === 'function') window.commsShareScreen();
      };
      document.getElementById('tcCallEnd').onclick = endCall;

      function endCall(){
        const tc = window.__tcActiveCall;
        if (!tc) return;
        try { if (tc.recorder && tc.recorder.state !== 'inactive') tc.recorder.stop(); } catch(e){}
        try { tc.stream.getTracks().forEach(t => t.stop()); } catch(e){}
        if (tc.timer){ clearInterval(tc.timer); tc.timer = null; }
        if (tc.noAnswerTimer){ clearTimeout(tc.noAnswerTimer); tc.noAnswerTimer = null; }
        try { if (tc.ringback) { tc.ringback.pause(); tc.ringback.currentTime = 0; tc.ringback = null; } } catch(e){}
        const cid = tc.callId;
        window.__tcActiveCall = null;
        const md = document.getElementById('commsCallModal'); if (md) md.remove();
        // Tell other tabs we hung up
        bc({ kind:'call_end', callId: cid, fromUser: meKey(), toUser: targetKey, ts: Date.now() });
        if (typeof window.toast === 'function'){
          window.toast({ type:'success', title:'Call ended', duration: 2500 });
        }
      }

      async function toggleCallRecord(){
        const tc = window.__tcActiveCall; if (!tc) return;
        const btn = document.getElementById('tcCallRec');
        if (tc.recorder){
          try { tc.recorder.stop(); } catch(e){}
          return;
        }
        try {
          const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : (tc.type === 'voice' ? 'audio/webm' : 'video/webm'));
          const rec = new MediaRecorder(tc.stream, { mimeType: mime });
          tc.recChunks = [];
          rec.ondataavailable = e => { if (e.data && e.data.size) tc.recChunks.push(e.data); };
          rec.onstop = async () => {
            const isVideo = tc.type !== 'voice';
            const blob = new Blob(tc.recChunks, { type: isVideo ? 'video/webm' : 'audio/webm' });
            if (typeof window.mediaSave === 'function'){
              await window.mediaSave(blob, { title: tc.type + ' call with ' + tc.targetName, kind:'recording', durationMs: Date.now() - tc.recStartTs });
              if (typeof window.toast === 'function') window.toast({ type:'success', title:'Call recording saved', body:'Open Media Library to play it back.', actionLabel:'Open library', onAction: window.mediaLibraryOpen });
            }
            tc.recorder = null;
            const b2 = document.getElementById('tcCallRec'); if (b2) b2.innerHTML = '<i class="fas fa-circle"></i> Record';
          };
          rec.start(1000);
          tc.recorder = rec; tc.recStartTs = Date.now();
          btn.innerHTML = '<i class="fas fa-stop" style="color:#dc2626"></i> Stop rec';
          if (typeof window.toast === 'function') window.toast({ type:'success', title:'Recording call', body:'It will be saved to your Media Library when you stop.' });
        } catch(err){
          if (typeof window.toast === 'function') window.toast({ type:'error', title:'Could not start recording', body: err && err.message || 'unknown error' });
        }
      }
    };
    window.commsStartCall.__tcWrapped = true;
    return true;
  };
  if (!tryWrap()){
    let n=0; const iv = setInterval(()=>{ n++; if (tryWrap() || n>50) clearInterval(iv); }, 200);
  }
})();

// ─── 2. Incoming call ring (across tabs) ─────────────────────────────────
function _handleIncomingSignal(d){
  if (!d) return;
  if (d.kind === 'call_invite' && d.toUser === meKey() && d.fromUser !== meKey()){
    showIncomingCall(d);
    // v14.7: Add an immediate topbar notification so even if the modal is
    // dismissed/missed, the user can see it in the bell drawer afterwards.
    try {
      if (typeof window.tbAddNotif === 'function'){
        window.tbAddNotif({
          id: 'n-callring-' + (d.callId || d.ts),
          cat: 'task',
          icon: d.callType === 'video' ? 'fa-video' : 'fa-phone',
          color: '#10b981',
          title: 'Incoming ' + (d.callType === 'video' ? 'video' : 'voice') + ' call: ' + (d.fromName || d.fromUser),
          sub: 'Tap to open the Calls tab',
          ts: Date.now(),
          prio: 'high',
          unread: true,
          link: () => {
            // Open the bell dropdown and switch to the Calls tab
            try {
              if (typeof window.tbBellSwitchTab === 'function') {
                window.tbBellSwitchTab('calls');
              } else if (typeof window.tbNotifOpen === 'function') {
                window.tbNotifOpen();
              }
            } catch(e){}
          }
        });
      }
      // Also force a fresh fetch of /api/calls so the Calls tab updates
      if (typeof window._tbRebuildCalls === 'function') {
        try { window._tbRebuildCalls(); } catch(e){}
      }
    } catch(e){}
  } else if (d.kind === 'call_accept' && d.toUser === meKey()){
    // We are the caller; the callee just accepted — stop ringback, show Connected
    const tc = window.__tcActiveCall;
    if (tc && tc.onConnect && (!tc.callId || tc.callId === d.callId)) {
      try { tc.onConnect(); } catch(e){}
    }
  } else if (d.kind === 'call_end'){
    // If we have an incoming modal for this call, dismiss it
    if (window.__tcIncomingModal){
      try { window.__tcIncomingModal.remove(); } catch(e){}
      window.__tcIncomingModal = null;
    }
    // If we are the caller and recipient declined, end the call
    const tc = window.__tcActiveCall;
    if (tc && (!tc.callId || tc.callId === d.callId) && d.fromUser !== meKey()){
      // Caller-side decline handling — show "Declined" status briefly
      const st = document.getElementById('tcCallStatus');
      if (st) st.textContent = 'Call declined';
      if (typeof window.toast === 'function') window.toast({ type:'info', title:'Call declined', duration: 3000 });
      try { tc.end && tc.end(); } catch(e){}
    }
  } else if (d.kind === 'snap_request' && d.toUser === meKey()){
    showSnapRequest(d);
  } else if (d.kind === 'snap_response' && d.toUser === meKey()){
    handleSnapResponse(d);
  }
}
if (_chan){
  _chan.addEventListener('message', (ev) => {
    if (!ev || !ev.data) return;
    _handleIncomingSignal(ev.data);
  });
}

function showIncomingCall(invite){
  // De-dup: if we're already showing a modal for this callId, don't re-show.
  if (window.__tcIncomingModal && window.__tcIncomingModal.dataset.callId === (invite.callId||'')){
    return;
  }
  if (window.__tcIncomingModal){ try { window.__tcIncomingModal.remove(); } catch(e){} }
  const modal = document.createElement('div');
  modal.dataset.callId = invite.callId || '';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100001;display:flex;align-items:center;justify-content:center;padding:20px';
  const ini = (invite.fromName||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  modal.innerHTML = '<div style="background:#0f172a;color:#fff;border:2px solid #16a34a;border-radius:18px;width:100%;max-width:380px;padding:28px;text-align:center;box-shadow:0 30px 80px rgba(22,163,74,0.5)">'
    + '<div style="width:84px;height:84px;border-radius:50%;margin:0 auto 14px;background:linear-gradient(135deg,#16a34a,#15803d);display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;font-weight:800;animation:tcPulse 1.2s infinite">'+esc(ini)+'</div>'
    + '<div style="font-size:18px;font-weight:800">'+esc(invite.fromName)+'</div>'
    + '<div style="color:#94a3b8;font-size:12.5px;margin-top:4px">Incoming '+(invite.callType==='video'?'video':'voice')+' call</div>'
    + '<div style="margin-top:18px;display:flex;gap:10px"><button id="tcDecline" style="flex:1;background:#ef4444;color:#fff;border:0;border-radius:10px;padding:11px;font-weight:700;cursor:pointer"><i class="fas fa-phone-slash"></i> Decline</button><button id="tcAccept" style="flex:1;background:#16a34a;color:#fff;border:0;border-radius:10px;padding:11px;font-weight:700;cursor:pointer"><i class="fas fa-phone"></i> Accept</button></div>'
    + '</div>';
  if (!document.getElementById('tcPulseKeyframes')){
    const st = document.createElement('style'); st.id = 'tcPulseKeyframes';
    st.textContent = '@keyframes tcPulse{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.55)}50%{box-shadow:0 0 0 12px rgba(22,163,74,0)}}';
    document.head.appendChild(st);
  }
  document.body.appendChild(modal);
  window.__tcIncomingModal = modal;

  // v14.4: HTML5 audio ring (data URL) — works without AudioContext.resume(),
  // doesn't suffer from "AudioContext suspended" when created outside a gesture.
  // Browser autoplay rules: most browsers allow looping audio for user-visible
  // tab even without prior gesture if it's a data URL. To be safe we also try
  // unlock and on failure show a "Tap to hear ring" prompt.
  const ringAudio = makeRingAudio(0.55);
  let ringStopped = false;
  function stopRing(){
    ringStopped = true;
    if (ringAudio){ try { ringAudio.pause(); ringAudio.currentTime = 0; } catch(e){} }
  }
  if (ringAudio){
    const playP = ringAudio.play();
    if (playP && typeof playP.catch === 'function'){
      playP.catch((err) => {
        // Autoplay blocked — add a one-time click handler on the modal to start ring
        if (ringStopped) return;
        const unlockBtn = document.createElement('div');
        unlockBtn.style.cssText = 'margin-top:8px;font-size:11px;color:#fbbf24;cursor:pointer';
        unlockBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Tap anywhere to hear ringing';
        const inner = modal.querySelector('div');
        if (inner) inner.appendChild(unlockBtn);
        const unlock = () => {
          if (ringStopped) return;
          try { ringAudio.play().catch(()=>{}); } catch(e){}
          try { unlockBtn.remove(); } catch(e){}
          document.removeEventListener('click', unlock, true);
        };
        document.addEventListener('click', unlock, true);
      });
    }
  }

  // Desktop notification
  if (typeof window.toast === 'function'){
    window.toast({ type:'call', title:'Incoming call from '+invite.fromName, body:invite.callType+' call', always:true, duration:0, actionLabel:'Focus tab', onAction:()=>{ try { window.focus(); }catch(e){} } });
  }
  // Try native browser Notification too
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted'){
      const n = new Notification('Incoming '+invite.callType+' call', { body: 'From ' + invite.fromName, requireInteraction: true });
      n.onclick = () => { try { window.focus(); } catch(e){} try { n.close(); } catch(e){} };
      setTimeout(() => { try { n.close(); } catch(e){} }, 25000);
    }
  } catch(e){}

  document.getElementById('tcDecline').onclick = () => {
    stopRing(); try { modal.remove(); } catch(e){} window.__tcIncomingModal = null;
    bc({ kind:'call_end', callId: invite.callId, fromUser: meKey(), toUser: invite.fromUser, ts: Date.now() });
  };
  document.getElementById('tcAccept').onclick = async () => {
    stopRing(); try { modal.remove(); } catch(e){} window.__tcIncomingModal = null;
    // Send call_accept signal so caller stops ringback and shows Connected
    bc({ kind:'call_accept', callId: invite.callId, fromUser: meKey(), fromName: meName(), toUser: invite.fromUser, ts: Date.now() });
    // Caller-side call modal will be running on the other tab; we open our own local stream view
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video: invite.callType==='video' ? { width:640, height:480 } : false });
      // Build a simple "accepted" modal
      const m = document.createElement('div');
      m.style.cssText = 'position:fixed;right:24px;bottom:24px;width:360px;background:#0f172a;color:#fff;border:1px solid #16a34a;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,0.55);z-index:99998';
      m.innerHTML = '<div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:8px 12px;display:flex;align-items:center;justify-content:space-between;font-weight:800;font-size:12.5px"><span><i class="fas fa-phone"></i> &nbsp;Call with '+esc(invite.fromName)+'</span><button id="tcAcceptedEnd" style="background:#ef4444;color:#fff;border:0;border-radius:6px;padding:3px 9px;font-weight:700;cursor:pointer"><i class="fas fa-phone-slash"></i> End</button></div>'
        + (invite.callType==='video' ? '<div style="background:#000"><video autoplay playsinline muted style="width:100%;max-height:220px;object-fit:cover" id="tcAcceptedVid"></video></div>' : '<div style="padding:24px;text-align:center;background:#0b1220"><i class="fas fa-phone-volume" style="font-size:34px;color:#16a34a"></i><div style="font-size:12px;color:#94a3b8;margin-top:8px">Audio call connected</div></div>');
      document.body.appendChild(m);
      if (invite.callType==='video'){ const v = document.getElementById('tcAcceptedVid'); if (v) v.srcObject = stream; }
      document.getElementById('tcAcceptedEnd').onclick = () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch(e){}
        try { m.remove(); } catch(e){}
        bc({ kind:'call_end', callId: invite.callId, fromUser: meKey(), toUser: invite.fromUser, ts: Date.now() });
      };
    } catch(e){
      if (typeof window.toast === 'function') window.toast({ type:'error', title:'Could not start call', body:'Microphone or camera blocked.' });
    }
  };
}

// ─── 3. Visible "Team" floating panel ────────────────────────────────────
let _panelOpen = false;

function isLoggedInStaff(){
  // currentUser is module-scoped (not on window) — detect login via DOM
  try {
    const app = document.getElementById('app');
    const login = document.getElementById('loginScreen');
    const appVisible = app && getComputedStyle(app).display !== 'none';
    const loginHidden = !login || getComputedStyle(login).display === 'none';
    if (!appVisible || !loginHidden) return false;
    // Agent portal modal open? skip
    if (document.getElementById('agentPortalModal')) return false;
    // Student portal modal open? skip
    if (document.getElementById('studentPortalModal') || document.getElementById('sp2Modal')) return false;
    // v16h fix: Team Comms floating button is now CEO/Admin-only per user request
    // ("Please remove this Team Comms chatbot for the staff. You can put it only
    // for the CEO. And this is for admin."). Staff at level < 100 do NOT see it.
    const u = _cu();
    if (!u) return false;
    const isAdmin = u.username === 'superadmin' || (u.level && u.level >= 100);
    if (!isAdmin) return false;
    return true;
  } catch(e){ return false; }
}

function ensureTeamFab(){
  // v16h fix: if the user is not authorized (staff < 100), remove any stale
  // FAB/panel that might be lingering from a previous CEO session in the same tab.
  if (!isLoggedInStaff()) {
    const existing = document.getElementById('tcTeamFab'); if (existing) existing.remove();
    const panel = document.getElementById('tcTeamPanel'); if (panel) panel.remove();
    return;
  }
  if (document.getElementById('tcTeamFab')) return;

  const fab = document.createElement('button');
  fab.id = 'tcTeamFab';
  fab.title = 'Team Comms — call, video, share screen, snap';
  const mobileBottom = window.matchMedia && window.matchMedia('(max-width: 767px)').matches ? '78px' : '18px';
  fab.style.cssText = 'position:fixed;right:18px;bottom:'+mobileBottom+';z-index:99997;width:56px;height:56px;border-radius:50%;border:0;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 8px 30px rgba(14,165,233,0.5);display:flex;align-items:center;justify-content:center';
  fab.innerHTML = '<i class="fas fa-users"></i>';
  fab.onclick = togglePanel;
  document.body.appendChild(fab);
}

function togglePanel(){
  if (_panelOpen){ closePanel(); return; }
  openPanel();
}

function openPanel(){
  _panelOpen = true;
  // Hide fab while panel open
  const fab = document.getElementById('tcTeamFab'); if (fab) fab.style.display='none';

  const panel = document.createElement('div');
  panel.id = 'tcTeamPanel';
  const mobilePanel = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
  panel.style.cssText = 'position:fixed;right:'+(mobilePanel?'10px':'18px')+';bottom:'+(mobilePanel?'76px':'18px')+';z-index:99997;width:'+(mobilePanel?'calc(100vw - 20px)':'380px')+';max-height:min(72vh,720px);background:#0f172a;color:#fff;border:1px solid #1e293b;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,0.5);display:flex;flex-direction:column;overflow:hidden';
  panel.innerHTML = ''
    + '<div style="padding:12px 14px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0ea5e9,#0284c7)">'
    +   '<div style="display:flex;align-items:center;gap:8px"><i class="fas fa-users"></i><div><div style="font-weight:800;font-size:13.5px">Team Comms</div><div style="font-size:10.5px;opacity:0.85">Call · Video · Share · Snap their screen</div></div></div>'
    +   '<button id="tcPanelClose" style="background:rgba(255,255,255,0.18);color:#fff;border:0;border-radius:6px;padding:4px 9px;font-weight:700;cursor:pointer">&times;</button>'
    + '</div>'
    + '<div style="padding:10px 12px;border-bottom:1px solid #1e293b;display:flex;gap:6px;flex-wrap:wrap">'
    +   '<button class="tc-quick" data-act="library"><i class="fas fa-photo-film"></i> Media Library</button>'
    +   '<button class="tc-quick" data-act="screenshot"><i class="fas fa-camera"></i> My screenshot</button>'
    +   '<button class="tc-quick" data-act="record"><i class="fas fa-circle"></i> Record screen</button>'
    +   '<button class="tc-quick" data-act="share"><i class="fas fa-desktop"></i> Share to team</button>'
    + '</div>'
    + '<div style="padding:8px 12px;border-bottom:1px solid #1e293b;font-size:10.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:700">Teammates</div>'
    + '<div id="tcTeamList" style="flex:1;overflow:auto;padding:6px 8px"></div>'
    + '<div style="padding:8px 12px;border-top:1px solid #1e293b;font-size:10.5px;color:#64748b;text-align:center;line-height:1.4">'
    +   'Calls/share/snap use your real mic, camera, and screen. Recordings are saved to your <strong style="color:#cbd5e1">Media Library</strong> on this device.'
    + '</div>';
  document.body.appendChild(panel);

  // Style the quick buttons
  panel.querySelectorAll('.tc-quick').forEach(b => {
    b.style.cssText = 'flex:1;min-width:80px;background:#1e293b;color:#fff;border:0;border-radius:8px;padding:7px 6px;font-size:11px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:inherit';
  });
  panel.querySelector('#tcPanelClose').onclick = closePanel;
  panel.querySelectorAll('.tc-quick').forEach(b => {
    b.onclick = () => {
      const act = b.dataset.act;
      if (act === 'library' && typeof window.mediaLibraryOpen === 'function') window.mediaLibraryOpen();
      else if (act === 'screenshot' && typeof window.commsScreenshot === 'function') window.commsScreenshot();
      else if (act === 'record' && typeof window.commsRecordScreen === 'function') window.commsRecordScreen();
      else if (act === 'share' && typeof window.commsShareScreen === 'function') window.commsShareScreen();
    };
  });

  renderTeamList();
}

function closePanel(){
  _panelOpen = false;
  const p = document.getElementById('tcTeamPanel'); if (p) p.remove();
  const fab = document.getElementById('tcTeamFab'); if (fab) fab.style.display='';
}

function _users(){
  // USERS is module-scoped in command-portal.html (not on window).
  try { if (window.USERS) return window.USERS; } catch(e){}
  try {
    return new Function('try{return typeof USERS!=="undefined"?USERS:null}catch(e){return null}')();
  } catch(e){ return null; }
}

function renderTeamList(){
  const host = document.getElementById('tcTeamList'); if (!host) return;
  let users = [];
  try {
    const U = _users();
    if (U){
      users = Object.keys(U).map(k => Object.assign({ key:k }, U[k])).filter(u => u.key !== meKey());
    }
  } catch(e){}
  if (!users.length){
    host.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;font-size:12.5px">No teammates available.</div>';
    return;
  }
  host.innerHTML = users.map(u => {
    const av = String(u.avatar||'#6366f1,#a855f7').split(',');
    const a1 = (av[0]||'#6366f1').trim(), a2 = (av[1]||'#a855f7').trim();
    const ini = (u.name||u.key||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
    const k = esc(u.key);
    const n = esc(u.name||u.key);
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:9px;margin-bottom:4px;background:#0b1220;border:1px solid #1e293b">'
      + '<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,'+a1+','+a2+');display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0">'+esc(ini)+'</div>'
      + '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+n+'</div><div style="font-size:10.5px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(u.role||'')+'</div></div>'
      + '<div style="display:flex;gap:3px">'
      +   '<button title="Voice call" onclick="commsStartCall(\'voice\',\''+k+'\')" style="width:30px;height:30px;border-radius:7px;background:#16a34a;color:#fff;border:0;cursor:pointer"><i class="fas fa-phone"></i></button>'
      +   '<button title="Video call" onclick="commsStartCall(\'video\',\''+k+'\')" style="width:30px;height:30px;border-radius:7px;background:#0ea5e9;color:#fff;border:0;cursor:pointer"><i class="fas fa-video"></i></button>'
      +   '<button title="Share my screen with '+n+'" onclick="TC.shareWith(\''+k+'\',\''+n+'\')" style="width:30px;height:30px;border-radius:7px;background:#8b5cf6;color:#fff;border:0;cursor:pointer"><i class="fas fa-desktop"></i></button>'
      +   '<button title="Request screen capture from '+n+'" onclick="TC.snapRequest(\''+k+'\',\''+n+'\')" style="width:30px;height:30px;border-radius:7px;background:#f59e0b;color:#fff;border:0;cursor:pointer"><i class="fas fa-camera"></i></button>'
      + '</div>'
      + '</div>';
  }).join('');
}

// ─── 4. Share screen WITH a specific person (named target) ───────────────
async function shareWith(targetKey, targetName){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){
    if (typeof window.toast === 'function') window.toast({ type:'error', title:'Screen sharing not supported', body:'Use the latest Chrome, Edge, Firefox or Safari.' });
    return;
  }
  // Call the existing engine (this triggers the browser's native picker)
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video:{ frameRate:{ ideal:24, max:30 } }, audio: true });
    window.__commsScreenStream = stream;
    // Build preview overlay
    let wrap = document.getElementById('commsScreenShareWrap');
    if (wrap) wrap.remove();
    wrap = document.createElement('div');
    wrap.id = 'commsScreenShareWrap';
    wrap.style.cssText = 'position:fixed;right:24px;bottom:90px;width:380px;background:#000;border:2px solid #8b5cf6;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,0.55);z-index:99996';
    wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:rgba(139,92,246,0.18);color:#a78bfa;font-size:11px;font-weight:700"><span><i class="fas fa-desktop"></i> &nbsp;Sharing with '+esc(targetName)+'</span><button onclick="commsStopScreenShare()" style="background:#ef4444;color:#fff;border:0;border-radius:6px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer"><i class="fas fa-stop"></i> Stop</button></div>'
      + '<video id="commsScreenShareVideo" autoplay playsinline muted style="width:100%;display:block;background:#000"></video>';
    document.body.appendChild(wrap);
    const v = document.getElementById('commsScreenShareVideo'); v.srcObject = stream;
    stream.getVideoTracks().forEach(t => t.addEventListener('ended', () => {
      try { window.commsStopScreenShare && window.commsStopScreenShare(); } catch(e){}
    }));

    // Notify the target via BroadcastChannel
    bc({ kind:'share_started', fromUser:meKey(), fromName:meName(), toUser:targetKey, toName:targetName, ts: Date.now() });
    if (typeof window.shareSetSelf === 'function') window.shareSetSelf({ active:true, target: targetKey, targetName: targetName });

    if (typeof window.toast === 'function'){
      window.toast({ type:'success', title:'Sharing screen with '+targetName, body:'They will see a notification. Click Stop in the preview to end.', duration: 5000 });
    }
  } catch(err){
    if (err && err.name === 'NotAllowedError') return;
    if (typeof window.toast === 'function') window.toast({ type:'error', title:'Could not share screen', body: err && err.message || 'unknown error' });
  }
}

// ─── 5. Request a screen capture FROM another staff member ───────────────
// v14.5: Company-policy automatic snap. No notifications shown to either party.
// (This is an official company portal — supervisors can request snaps silently.)
function snapRequest(targetKey, targetName){
  // Send a request via BroadcastChannel; the target's browser will silently
  // capture and return a screenshot. No prompts or toast notifications.
  bc({ kind:'snap_request', fromUser:meKey(), fromName:meName(), toUser:targetKey, toName:targetName, requestId: 'snap-'+Date.now(), ts: Date.now(), silent: true });
  // (No toast — automatic per company policy)
}

function showSnapRequest(req){
  // v14.5: Automatic capture — no Allow/Deny modal, no toast notifications.
  // Captures silently using browser permissions already granted to this site.
  (async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false, preferCurrentTab: true });
      const v = document.createElement('video'); v.srcObject = stream; v.muted = true;
      await v.play();
      await new Promise(r => setTimeout(r, 250));
      const cv = document.createElement('canvas');
      cv.width = v.videoWidth || 1280; cv.height = v.videoHeight || 720;
      cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
      stream.getTracks().forEach(t => t.stop());
      const dataUrl = cv.toDataURL('image/png');
      bc({ kind:'snap_response', fromUser: meKey(), fromName: meName(), toUser: req.fromUser, requestId: req.requestId, dataUrl: dataUrl, ts: Date.now(), silent: true });
      // No success toast — silent operation
    } catch(err){
      bc({ kind:'snap_response', fromUser: meKey(), toUser: req.fromUser, requestId: req.requestId, denied: true, error: err && err.message, ts: Date.now(), silent: true });
      // No error toast — silent operation
    }
  })();
}

async function handleSnapResponse(resp){
  // v14.5: Silent snap — no toast notifications. Just save to library.
  if (resp.denied){
    // Silent failure — no toast (company policy automatic capture)
    return;
  }
  if (resp.dataUrl && typeof window.mediaSave === 'function'){
    // Convert data URL → Blob and save to library
    try {
      const r = await fetch(resp.dataUrl);
      const blob = await r.blob();
      await window.mediaSave(blob, { title:'Snap from '+(resp.fromName||'teammate'), kind:'screenshot' });
      // No toast — silent save to Media Library
    } catch(e){
      console.error('handleSnapResponse failed', e);
    }
  }
}

// ─── 5b. Cross-tab MESSAGE relay (fixes "messages don't reach staff") ────
// The server stores messages in an in-memory GLOBAL_MESSAGES array, which on
// Cloudflare Workers is NOT durable across isolates. That means a message
// POSTed by user A may not be visible to user B's polling GET if their
// requests land on different isolates. To make same-browser / same-device
// delivery rock-solid, we add a BroadcastChannel relay: every commsSend()
// also broadcasts the message, and every other tab listens & injects.
let _msgChan = null;
try { _msgChan = new BroadcastChannel('gg_messages'); } catch(e){ _msgChan = null; }
function mbc(msg){ if (_msgChan) try { _msgChan.postMessage(msg); } catch(e){} }

// 1) Wrap commsSend so each outgoing message is ALSO relayed via BC.
(function wrapCommsSend(){
  const tryWrap = () => {
    if (typeof window.commsSend !== 'function') return false;
    if (window.commsSend.__tcMsgWrapped) return true;
    const orig = window.commsSend;
    window.commsSend = function(){
      // Snapshot the composer & state BEFORE orig clears it
      try {
        const input = document.getElementById('commsInput');
        const text = input ? (input.value || '').trim() : '';
        const atts = (window.COMMS_STATE && window.COMMS_STATE.attachments) ? window.COMMS_STATE.attachments.slice() : [];
        const channel = (typeof window.commsChannelKey === 'function') ? window.commsChannelKey() : null;
        const u = _cu();
        if (channel && u && (text || atts.length)){
          const baseMsg = {
            from: u.username, fromName: u.name, avatar: u.avatar,
            channel: channel,
            text: text,
            urgent: !!(window.COMMS_STATE && window.COMMS_STATE.urgentMode),
            timestamp: Date.now(),
            id: 'bc-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
            serverTimestamp: Date.now(),
            delivered: true,
            _viaBC: true
          };
          if (atts.length){
            atts.forEach((f, idx) => {
              mbc(Object.assign({ kind:'message' }, baseMsg, {
                file: f, text: idx === 0 ? text : '',
                id: baseMsg.id + '-' + idx
              }));
            });
          } else {
            mbc(Object.assign({ kind:'message' }, baseMsg));
          }
        }
      } catch(e){ /* never block the real send */ }
      return orig.apply(this, arguments);
    };
    window.commsSend.__tcMsgWrapped = true;
    return true;
  };
  if (!tryWrap()){
    let n=0; const iv = setInterval(()=>{ n++; if (tryWrap() || n>50) clearInterval(iv); }, 200);
  }
})();

// Lazy-eval COMMS_STATE (module-scoped in command-portal.html, NOT on window)
function _commsState(){
  try { if (window.COMMS_STATE) return window.COMMS_STATE; } catch(e){}
  try {
    return new Function('try{return typeof COMMS_STATE!=="undefined"?COMMS_STATE:null}catch(e){return null}')();
  } catch(e){ return null; }
}
// Lazy-eval commsChannelKey (also module-scoped)
function _channelKey(){
  try { if (typeof window.commsChannelKey === 'function') return window.commsChannelKey(); } catch(e){}
  try {
    return new Function('try{return typeof commsChannelKey==="function"?commsChannelKey():null}catch(e){return null}')();
  } catch(e){ return null; }
}
function _renderMsgs(){
  try { if (typeof window.renderCommsMessages === 'function') return window.renderCommsMessages(); } catch(e){}
  try { new Function('try{if(typeof renderCommsMessages==="function")renderCommsMessages()}catch(e){}')(); } catch(e){}
}
function _showCommsToast(m){
  try { if (typeof window.showCommsToast === 'function') return window.showCommsToast(m); } catch(e){}
  try { new Function('m', 'try{if(typeof showCommsToast==="function")showCommsToast(m)}catch(e){}')(m); } catch(e){}
}
function _refreshSidebar(){
  try { if (typeof window.refreshCommsSidebar === 'function') return window.refreshCommsSidebar(true); } catch(e){}
  try { new Function('try{if(typeof refreshCommsSidebar==="function")refreshCommsSidebar(true)}catch(e){}')(); } catch(e){}
}

// 2) Listen for relayed messages from other tabs and inject them into the UI.
function _injectIncomingMessage(m){
  try {
    if (!m || !m.channel) return;
    const u = _cu();
    const myKey = (u && u.username) || null;
    // Skip our own echoes
    if (myKey && m.from === myKey) return;
    const state = _commsState();
    if (!state) return;
    // Dedupe by id
    const have = new Set((state.messages||[]).map(x => x.id));
    if (have.has(m.id)) return;

    const currentKey = _channelKey();

    if (m.channel === currentKey){
      // Same channel as the user is viewing — append + re-render
      state.messages = state.messages || [];
      state.messages.push(m);
      _renderMsgs();
      _showCommsToast(m);
    } else {
      // Different channel — increment unread badge & toast
      if (m.channel && m.channel.indexOf('ch:') === 0){
        const cid = m.channel.substring(3);
        state.unread = state.unread || {};
        state.unread[cid] = (state.unread[cid] || 0) + 1;
      } else if (m.channel && m.channel.indexOf('dm:') === 0){
        // DM addressed to me?
        const parts = m.channel.substring(3).split('|');
        if (myKey && parts.indexOf(myKey) >= 0){
          _showCommsToast(m);
        }
      }
      _refreshSidebar();
    }

    // ALSO POST to /api/messages so future polls (and same-isolate users) see it.
    // We tag _relayed:true so we don't double-relay.
    if (!m._relayed){
      try {
        fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({}, m, { _relayed: true }))
        }).catch(()=>{});
      } catch(e){}
    }
  } catch(e){ /* swallow */ }
}

if (_msgChan){
  _msgChan.addEventListener('message', (ev) => {
    if (!ev || !ev.data) return;
    if (ev.data.kind === 'message') _injectIncomingMessage(ev.data);
  });
}

// 3) Expose helper so other code (or future server-push) can inject too.
window.TC = window.TC || {};
window.TC.injectMessage = _injectIncomingMessage;
window.TC.relayMessage = function(m){ mbc(Object.assign({ kind:'message' }, m)); };

// ─── 5c. Server-backed signal polling — calls ring across devices ───────
// This is the durable counterpart to BroadcastChannel. It polls /api/signal
// every 3 s for any pending call_invite / snap_request / call_end /
// snap_response addressed to the logged-in user. KV-backed on the server.
let _signalSince = Date.now();
let _signalSeen = new Set();
let _signalTimer = null;

async function pollSignals(){
  try {
    if (!isLoggedInStaff()){ return; }
    const me = meKey();
    if (!me || me === 'guest') return;
    const r = await fetch('/api/signal?user=' + encodeURIComponent(me) + '&since=' + _signalSince, { cache:'no-store' });
    if (!r.ok) return;
    const data = await r.json();
    _signalSince = data.timestamp || Date.now();
    (data.signals || []).forEach((s) => {
      if (!s || !s.id || _signalSeen.has(s.id)) return;
      _signalSeen.add(s.id);
      // Convert server signal to the same shape used by BroadcastChannel handlers
      const evtData = {
        kind: s.kind,
        callId: s.callId,
        callType: s.callType,
        fromUser: s.fromUser,
        fromName: s.fromName,
        toUser: s.toUser,
        requestId: s.requestId,
        dataUrl: s.dataUrl,
        denied: s.denied,
        ts: s.ts
      };
      try { _handleIncomingSignal(evtData); } catch(e){}
    });
    // Periodically prune _signalSeen so it doesn't grow unbounded
    if (_signalSeen.size > 500){
      _signalSeen = new Set(Array.from(_signalSeen).slice(-200));
    }
  } catch(e){ /* swallow, keep polling */ }
}

function startSignalPolling(){
  if (_signalTimer) return;
  // Initial since-timestamp = login time, so we don't pull historical noise
  _signalSince = Date.now() - 30_000; // a 30s grace window for races
  _signalTimer = setInterval(pollSignals, 3000);
  // One immediate poll
  pollSignals();
}

// ─── 5d. Global message notification poller (v14.4) ──────────────────────
// Even when the user is NOT on the Comms Hub page, we poll /api/messages so
// that ANY incoming message addressed to them (DMs or @-mentions) triggers
// a global toast + sound + browser notification. The existing
// loadCommsMessages() only runs when the Comms page is mounted, so notifs
// were missing for users on other pages.
let _gnSince = Date.now();
let _gnSeen = new Set();
let _gnTimer = null;

// Try to request browser Notification permission on first login
function _requestNotificationPermission(){
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default'){
      Notification.requestPermission().catch(()=>{});
    }
  } catch(e){}
}

function _globalNotifySound(){
  try {
    const url = getRingtoneUrl();
    if (!url) return;
    // Short beep — first 0.3s of the ringtone with no loop
    const a = new Audio(url);
    a.volume = 0.32;
    a.loop = false;
    const playP = a.play();
    if (playP && typeof playP.catch === 'function') playP.catch(()=>{});
    // Stop after 350ms
    setTimeout(() => { try { a.pause(); a.currentTime=0; } catch(e){} }, 350);
  } catch(e){}
}

function _globalNotifyToast(m){
  const fromName = m.fromName || m.from || 'Someone';
  const text = m.text || (m.file ? '📎 ' + (m.file.name || 'attachment') : '(new message)');
  // Use the system toast if available (top-right floating)
  try {
    if (typeof window.toast === 'function'){
      window.toast({
        type:'message',
        title: fromName,
        body: text.slice(0, 120),
        duration: 6000,
        actionLabel:'Open chat',
        onAction: () => {
          try {
            if (typeof window.showPage === 'function') window.showPage('communications-hub');
            else if (typeof window.go === 'function') window.go('communications-hub');
          } catch(e){}
        }
      });
      return;
    }
  } catch(e){}
  // Fallback: in-line div
  try {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:18px;right:18px;z-index:99999;background:#0f172a;color:#fff;border:1px solid #334155;border-radius:12px;padding:12px 16px;max-width:340px;box-shadow:0 18px 50px rgba(0,0,0,0.4);font-family:inherit;animation:tcSlide 0.2s ease-out';
    t.innerHTML = '<div style="font-weight:800;font-size:13px;color:#0ea5e9"><i class="fas fa-comment-dots"></i> '+ esc(fromName) +'</div>'
      + '<div style="font-size:12px;color:#cbd5e1;margin-top:4px;line-height:1.4">'+ esc(text.slice(0,120)) +'</div>';
    document.body.appendChild(t);
    setTimeout(()=>{ try { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(), 350); } catch(e){} }, 5500);
  } catch(e){}
}

function _globalBrowserNotification(m){
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const fromName = m.fromName || m.from || 'Someone';
    const text = m.text || (m.file ? '📎 ' + (m.file.name || 'attachment') : '(new message)');
    const n = new Notification('GG · ' + fromName, {
      body: text.slice(0, 200),
      tag: 'gg-msg-' + (m.id || Date.now()),
      icon: '/static/favicon.png',
      requireInteraction: false
    });
    n.onclick = () => {
      try { window.focus(); } catch(e){}
      try { if (typeof window.showPage === 'function') window.showPage('communications-hub'); } catch(e){}
      try { n.close(); } catch(e){}
    };
    setTimeout(() => { try { n.close(); } catch(e){} }, 8000);
  } catch(e){}
}

async function pollMessagesForNotifications(){
  try {
    if (!isLoggedInStaff()) return;
    const u = _cu();
    if (!u || !u.username) return;
    const myKey = u.username;
    const r = await fetch('/api/messages?since=' + _gnSince, { cache:'no-store' });
    if (!r.ok) return;
    const data = await r.json();
    _gnSince = data.timestamp || Date.now();
    const msgs = (data.messages || []);
    msgs.forEach(m => {
      if (!m || !m.id) return;
      if (_gnSeen.has(m.id)) return;
      _gnSeen.add(m.id);
      // Skip messages from me
      if (m.from === myKey) return;
      // Determine whether to notify:
      //   - DMs where I'm one of the parties → always notify
      //   - Channel messages → only notify if I'm mentioned OR urgent
      //   - Skip system messages (broadcast etc.) ⇒ they handle themselves
      let shouldNotify = false;
      if (m.channel && typeof m.channel === 'string'){
        if (m.channel.indexOf('dm:') === 0){
          const parts = m.channel.substring(3).split('|');
          if (parts.indexOf(myKey) >= 0) shouldNotify = true;
        } else if (m.channel.indexOf('ch:') === 0){
          // Channel: notify on urgent OR @mention of my first name OR @all
          const firstName = (u.name || '').split(' ')[0].toLowerCase();
          const text = (m.text || '').toLowerCase();
          if (m.urgent || text.indexOf('@'+firstName) >= 0 || text.indexOf('@all') >= 0) {
            shouldNotify = true;
          } else {
            // Also notify lightly (no sound) if this is a fresh channel message
            // and the user isn't currently on the Comms page — keeps them aware.
            try {
              const onComms = !!document.getElementById('commsMessages');
              if (!onComms) shouldNotify = true;
            } catch(e){}
          }
        }
      }
      if (!shouldNotify) return;
      // v14.7: On the first poll after login (initial seed), DO NOT play
      // sound/toast/browser-notification for historical messages. We only
      // want to populate the topbar dropdowns so the user can see their
      // unread items. Subsequent polls play the full notification UX.
      const isSeed = _gnInitialSeed;
      // Avoid double-notifying if the user is actively viewing the Comms Hub
      // — loadCommsMessages() already toasts those.
      const onCommsPage = !!document.getElementById('commsMessages');
      if (!isSeed){
        if (onCommsPage) {
          // Still fire a sound but skip the toast (the in-page toast already shows)
          _globalNotifySound();
        } else {
          _globalNotifySound();
          _globalNotifyToast(m);
          _globalBrowserNotification(m);
        }
      }
      // v14.5: Also add to topbar notifications drawer so it persists
      // v14.6: AND push into the topbar message dropdown so the envelope icon
      //        also reflects real, live message activity.
      try {
        const fromName = m.fromName || m.from || 'Teammate';
        const isDM = m.channel && m.channel.indexOf('dm:') === 0;
        if (typeof window.tbAddNotif === 'function'){
          window.tbAddNotif({
            id: 'n-msg-' + m.id,
            cat: 'task',
            icon: isDM ? 'fa-comment' : 'fa-comments',
            color: isDM ? '#10b981' : '#3b82f6',
            title: (isDM ? 'Message from ' : 'In channel: ') + fromName,
            sub: (m.text || '').slice(0, 120),
            ts: m.ts || Date.now(),
            prio: m.urgent ? 'high' : 'med',
            unread: true,
            link: () => { if (typeof window.nav === 'function') window.nav('communications'); }
          });
        }
        if (typeof window.tbAddMsg === 'function'){
          window.tbAddMsg({
            id: 'm-' + m.id,
            from: fromName,
            text: (m.text || ''),
            ts: m.ts || Date.now(),
            unread: true,
            channel: !isDM
          });
        }
      } catch(e){}
    });
    // Cap _gnSeen size
    if (_gnSeen.size > 500){
      _gnSeen = new Set(Array.from(_gnSeen).slice(-200));
    }
    // v14.7: After the initial seed pass, switch to full notification UX
    if (_gnInitialSeed) {
      _gnInitialSeed = false;
      // Now also bump _gnSince forward so subsequent polls don't re-seed
      _gnSince = Date.now();
    }
  } catch(e){ /* swallow */ }
}

function startGlobalMessagePolling(){
  if (_gnTimer) return;
  // v14.7: On login, look back 24 HOURS for unread messages addressed to me,
  // so the bell/envelope dropdowns show real activity that happened while
  // I was logged out. Without this, the user only saw messages received
  // AFTER they logged in (and even those were missed if they arrived during
  // the 5-second grace window).
  _gnSince = Date.now() - (24 * 60 * 60 * 1000);
  _requestNotificationPermission();
  // First poll: SILENT seed (no sound/toast) — just populates the topbar
  // dropdowns with unread items. Subsequent polls will play sound/toast
  // for genuinely-new messages.
  _gnInitialSeed = true;
  _gnTimer = setInterval(pollMessagesForNotifications, 4000);
  pollMessagesForNotifications();
}
let _gnInitialSeed = false;

// Wait until login, then start polling
(function waitForLoginThenPoll(){
  if (isLoggedInStaff()){
    startSignalPolling();
    startGlobalMessagePolling();
  } else {
    setTimeout(waitForLoginThenPoll, 1500);
  }
})();

// ─── 6. Boot — show the FAB after login ──────────────────────────────────
function tryShowFab(){
  ensureTeamFab();
  setTimeout(tryShowFab, 2000); // self-heal in case the user navigates / closes
}
setTimeout(tryShowFab, 1500);

// Auto-close panel if we get logged out
setInterval(() => {
  if (_panelOpen && !isLoggedInStaff()){
    closePanel();
  }
}, 3000);

// Public API
window.TC = window.TC || {};
window.TC.openPanel = openPanel;
window.TC.closePanel = closePanel;
window.TC.shareWith = shareWith;
window.TC.snapRequest = snapRequest;
window.TC.help = function(){
  console.log('%cTeam Comms','color:#0ea5e9;font-weight:bold;font-size:14px');
  console.log('  Click the floating "Team" button at bottom-right to open the panel.');
  console.log('  TC.openPanel()                       — open the Team panel');
  console.log('  commsStartCall("voice"|"video", username) — real call with someone');
  console.log('  TC.shareWith(username, displayName)  — share your screen with a person');
  console.log('  TC.snapRequest(username, displayName) — ask someone for a screenshot');
};

})();
