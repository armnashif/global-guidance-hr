/* ============================================================
   GG Universal Document Upload Widget
   Works on every main page: Leads, Admissions, Finance, Students,
   Comms, Daily Ops, Reports, etc.
   Features:
     - Excel (.xlsx/.xls) parser via SheetJS CDN
     - CSV parser
     - Multi-file drag/drop upload (PDF, images, docs)
     - Google Drive / Sheets link sync
     - Per-page category tagging (auto-routes to correct API)
   ============================================================ */
(function () {
  if (window.GGDocumentUpload) return; // singleton

  // ---- Load SheetJS once ----
  function ensureSheetJS() {
    return new Promise((resolve, reject) => {
      if (window.XLSX) return resolve(window.XLSX);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload = () => resolve(window.XLSX);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ---- Page → API category mapping ----
  const CATEGORY_API = {
    'leads':       { api: '/api/uploads/leads',       label: 'Leads',       acceptExcel: true,  parser: 'leads' },
    'admissions':  { api: '/api/uploads/admissions',  label: 'Admissions',  acceptExcel: true,  parser: 'admissions' },
    'finance':     { api: '/api/uploads/finance',     label: 'Finance',     acceptExcel: true,  parser: 'finance' },
    'students':    { api: '/api/uploads/students',    label: 'Students',    acceptExcel: true,  parser: 'generic' },
    'comms':       { api: '/api/uploads/comms',       label: 'Communication', acceptExcel: false, parser: 'generic' },
    'daily-ops':   { api: '/api/uploads/daily-ops',   label: 'Daily Operations', acceptExcel: true, parser: 'generic' },
    'reports':     { api: '/api/uploads/reports',     label: 'Reports',     acceptExcel: true,  parser: 'generic' },
    'visa':        { api: '/api/uploads/visa',        label: 'Visa Processing', acceptExcel: true, parser: 'generic' },
    'leave':       { api: '/api/uploads/leave',       label: 'Leave Management', acceptExcel: true, parser: 'generic' },
    'red-flags':   { api: '/api/uploads/red-flags',   label: 'Red Flags',   acceptExcel: true,  parser: 'generic' },
    'general':     { api: '/api/uploads/general',     label: 'General',     acceptExcel: true,  parser: 'generic' }
  };

  // ---- Render the floating button + modal ----
  function injectStyles() {
    if (document.getElementById('gg-doc-upload-styles')) return;
    const style = document.createElement('style');
    style.id = 'gg-doc-upload-styles';
    style.textContent = `
      .gg-upload-fab {
        position: fixed; right: 24px; bottom: 24px; z-index: 9998;
        background: linear-gradient(135deg,#3b82f6,#1d4ed8);
        color:#fff; padding: 12px 18px; border-radius:999px;
        box-shadow: 0 6px 20px rgba(59,130,246,.45);
        cursor:pointer; font-weight:600; display:flex; gap:8px; align-items:center;
        border:none; font-size:14px; transition:transform .15s;
      }
      .gg-upload-fab:hover { transform: translateY(-2px); }
      .gg-upload-modal-bg {
        position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:9999;
        display:flex; align-items:center; justify-content:center; padding:20px;
      }
      .gg-upload-modal {
        background:#fff; border-radius:14px; max-width:680px; width:100%;
        max-height:90vh; overflow:auto; box-shadow:0 20px 60px rgba(0,0,0,.3);
      }
      .gg-upload-head {
        padding:18px 22px; border-bottom:1px solid #e5e7eb;
        display:flex; justify-content:space-between; align-items:center;
        background:linear-gradient(135deg,#1e3a8a,#3b82f6); color:#fff;
        border-radius:14px 14px 0 0;
      }
      .gg-upload-body { padding:22px; }
      .gg-upload-tabs { display:flex; gap:6px; margin-bottom:18px; border-bottom:1px solid #e5e7eb; }
      .gg-upload-tab {
        padding:10px 16px; cursor:pointer; border-bottom:2px solid transparent;
        font-weight:500; color:#6b7280;
      }
      .gg-upload-tab.active { color:#1d4ed8; border-color:#1d4ed8; }
      .gg-upload-drop {
        border:2px dashed #93c5fd; background:#eff6ff;
        padding:36px 20px; text-align:center; border-radius:10px;
        cursor:pointer; transition:.15s;
      }
      .gg-upload-drop:hover, .gg-upload-drop.drag { background:#dbeafe; border-color:#3b82f6; }
      .gg-upload-drop i { font-size:42px; color:#3b82f6; }
      .gg-upload-list { margin-top:14px; }
      .gg-upload-item {
        display:flex; justify-content:space-between; align-items:center;
        padding:8px 12px; background:#f9fafb; border-radius:6px; margin-bottom:6px;
        font-size:13px;
      }
      .gg-upload-item .ok { color:#059669; }
      .gg-upload-item .err { color:#dc2626; }
      .gg-upload-input {
        width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:8px;
        font-size:14px;
      }
      .gg-upload-btn {
        padding:10px 18px; background:#1d4ed8; color:#fff; border:none; border-radius:8px;
        cursor:pointer; font-weight:600; margin-top:10px;
      }
      .gg-upload-btn:hover { background:#1e40af; }
      .gg-upload-btn.secondary { background:#6b7280; }
      .gg-upload-preview {
        margin-top:14px; max-height:240px; overflow:auto;
        font-size:12px; background:#f3f4f6; padding:10px; border-radius:6px;
        font-family: ui-monospace, monospace;
      }
      .gg-upload-stat {
        display:inline-block; padding:4px 10px; background:#dbeafe; color:#1e40af;
        border-radius:12px; font-size:11px; font-weight:600; margin-right:6px;
      }
    `;
    document.head.appendChild(style);
  }

  // ---- Read file as base64 (for binary upload) ----
  function readAsBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // ---- Read file as ArrayBuffer (for Excel) ----
  function readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsArrayBuffer(file);
    });
  }

  // ---- Parse Excel/CSV → array of row objects (per sheet) ----
  async function parseSpreadsheet(file) {
    await ensureSheetJS();
    const buf = await readAsArrayBuffer(file);
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const sheets = {};
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      // Try multiple header rows: row 1, then row 2 (some sheets have title row)
      let json = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });
      if (json.length === 0 || Object.keys(json[0] || {}).every(k => k.startsWith('__EMPTY'))) {
        json = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false, range: 1 });
      }
      sheets[name] = json;
    }
    return { sheets, sheetNames: wb.SheetNames };
  }

  // ---- Normalize lead row to system schema ----
  function normalizeLeadRow(row) {
    const get = (...keys) => {
      for (const k of keys) {
        const found = Object.keys(row).find(rk => rk && rk.toLowerCase().trim() === k.toLowerCase().trim());
        if (found && row[found] != null && String(row[found]).trim() !== '') return String(row[found]).trim();
      }
      return '';
    };
    return {
      counsellor: get('COUNSELLOR', 'Counsellor', 'Counselor', 'Assigned to'),
      lead: get('LEAD', 'Lead', 'Name'),
      contact: get('Contact No', 'Contact', 'Phone', 'Number'),
      status: get('Status'),
      date: get('Date'),
      country: get('Country'),
      details: get('Details'),
      comments: get('Comments', ' Comments'),
      appointments: get('Appointments'),
      source: get('Source') || 'Excel Import',
      cv: get('CV', "CV's", 'Cv'),
      attempts: [get('1'), get('2'), get('3')].filter(Boolean).join(' | ')
    };
  }

  // ---- Public API ----
  const GGDocumentUpload = {
    open(category) {
      injectStyles();
      const cfg = CATEGORY_API[category] || CATEGORY_API.general;
      const isExcel = cfg.acceptExcel;

      // Build modal
      const bg = document.createElement('div');
      bg.className = 'gg-upload-modal-bg';
      bg.innerHTML = `
        <div class="gg-upload-modal">
          <div class="gg-upload-head">
            <div>
              <i class="fas fa-cloud-upload-alt mr-2"></i>
              Upload to ${cfg.label}
            </div>
            <button onclick="this.closest('.gg-upload-modal-bg').remove()" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;">&times;</button>
          </div>
          <div class="gg-upload-body">
            <div class="gg-upload-tabs">
              <div class="gg-upload-tab active" data-tab="files"><i class="fas fa-file-upload mr-1"></i> Files</div>
              ${isExcel ? '<div class="gg-upload-tab" data-tab="excel"><i class="fas fa-file-excel mr-1"></i> Excel/CSV Sync</div>' : ''}
              <div class="gg-upload-tab" data-tab="gdrive"><i class="fab fa-google-drive mr-1"></i> Google Drive / Sheets</div>
              <div class="gg-upload-tab" data-tab="history"><i class="fas fa-history mr-1"></i> History</div>
            </div>

            <div data-pane="files">
              <div class="gg-upload-drop" id="ggDropZone">
                <i class="fas fa-cloud-upload-alt"></i>
                <h3 style="margin:10px 0 4px;font-size:18px;color:#1f2937;">Drop files here or click to browse</h3>
                <p style="color:#6b7280;font-size:13px;">PDF, DOCX, XLSX, images — multiple files allowed</p>
                <input type="file" id="ggFilePick" multiple style="display:none" accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt"/>
              </div>
              <div class="gg-upload-list" id="ggFileList"></div>
            </div>

            ${isExcel ? `
            <div data-pane="excel" style="display:none;">
              <p style="color:#374151;margin-bottom:10px;">
                Upload an Excel file (e.g. <em>Leads tracker.xlsx</em>, <em>Social Media Leads.xlsx</em>)
                — all sheets will be parsed and synced into the portal.
              </p>
              <div class="gg-upload-drop" id="ggExcelZone">
                <i class="fas fa-file-excel" style="color:#059669;"></i>
                <h3 style="margin:10px 0 4px;">Click to choose Excel/CSV</h3>
                <p style="color:#6b7280;font-size:13px;">Multi-sheet workbooks supported</p>
                <input type="file" id="ggExcelPick" accept=".xlsx,.xls,.csv" style="display:none"/>
              </div>
              <div id="ggExcelPreview"></div>
            </div>` : ''}

            <div data-pane="gdrive" style="display:none;">
              <p style="color:#374151;margin-bottom:10px;">
                Paste a Google Drive folder/file or Google Sheet share link. The system will store the
                reference and (for public Sheets) auto-pull data.
              </p>
              <input class="gg-upload-input" id="ggGDriveLink" placeholder="https://docs.google.com/spreadsheets/d/... or https://drive.google.com/..."/>
              <input class="gg-upload-input" id="ggGDriveLabel" placeholder="Description (e.g. Leads tracker - Master)" style="margin-top:8px;"/>
              <button class="gg-upload-btn" id="ggGDriveSave">
                <i class="fas fa-link mr-1"></i> Sync this link
              </button>
              <div id="ggGDriveResult" style="margin-top:10px;"></div>
              <div style="margin-top:14px;font-size:12px;color:#6b7280;">
                <strong>Tip:</strong> For Google Sheets, set the share to "Anyone with the link – Viewer"
                so the portal can auto-pull the latest rows.
              </div>
            </div>

            <div data-pane="history" style="display:none;">
              <div id="ggHistoryList">
                <p style="color:#6b7280;">Loading…</p>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(bg);

      const $ = sel => bg.querySelector(sel);

      // Tabs
      bg.querySelectorAll('.gg-upload-tab').forEach(t => {
        t.onclick = () => {
          bg.querySelectorAll('.gg-upload-tab').forEach(x => x.classList.remove('active'));
          t.classList.add('active');
          bg.querySelectorAll('[data-pane]').forEach(p => p.style.display = 'none');
          const target = bg.querySelector('[data-pane="' + t.dataset.tab + '"]');
          if (target) target.style.display = '';
          if (t.dataset.tab === 'history') loadHistory();
        };
      });

      // Files tab
      const drop = $('#ggDropZone');
      const pick = $('#ggFilePick');
      drop.onclick = () => pick.click();
      drop.ondragover = e => { e.preventDefault(); drop.classList.add('drag'); };
      drop.ondragleave = () => drop.classList.remove('drag');
      drop.ondrop = e => { e.preventDefault(); drop.classList.remove('drag'); handleFiles(e.dataTransfer.files); };
      pick.onchange = () => handleFiles(pick.files);

      async function handleFiles(files) {
        const list = $('#ggFileList');
        for (const f of files) {
          const item = document.createElement('div');
          item.className = 'gg-upload-item';
          item.innerHTML = `<span><i class="fas fa-file mr-2"></i>${f.name} <small style="color:#6b7280;">(${(f.size/1024).toFixed(1)} KB)</small></span><span class="status">Uploading…</span>`;
          list.appendChild(item);
          try {
            const data = await readAsBase64(f);
            const res = await fetch(cfg.api, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                category: category,
                fileName: f.name,
                fileType: f.type || 'application/octet-stream',
                fileSize: f.size,
                fileData: data,
                uploadedBy: (window.currentUser && window.currentUser.name) || 'Unknown'
              })
            });
            const j = await res.json();
            item.querySelector('.status').className = 'ok';
            item.querySelector('.status').innerHTML = `<i class="fas fa-check"></i> Uploaded`;
            if (j.parsed) {
              item.querySelector('.status').innerHTML += ` <span class="gg-upload-stat">${j.parsed.rows || 0} rows</span>`;
            }
          } catch (e) {
            item.querySelector('.status').className = 'err';
            item.querySelector('.status').innerHTML = `<i class="fas fa-times"></i> Failed`;
          }
        }
      }

      // Excel tab
      if (isExcel) {
        const ezone = $('#ggExcelZone');
        const epick = $('#ggExcelPick');
        ezone.onclick = () => epick.click();
        epick.onchange = async () => {
          const f = epick.files[0];
          if (!f) return;
          const preview = $('#ggExcelPreview');
          preview.innerHTML = `<p style="color:#1d4ed8;"><i class="fas fa-spinner fa-spin"></i> Parsing ${f.name}…</p>`;
          try {
            const parsed = await parseSpreadsheet(f);
            const totalRows = Object.values(parsed.sheets).reduce((s, rows) => s + rows.length, 0);
            let html = `<div style="margin-top:12px;">`;
            html += `<span class="gg-upload-stat">${parsed.sheetNames.length} sheets</span>`;
            html += `<span class="gg-upload-stat">${totalRows} total rows</span></div>`;
            html += `<div class="gg-upload-preview">`;
            for (const sn of parsed.sheetNames) {
              html += `<div><strong>${sn}</strong> — ${parsed.sheets[sn].length} rows</div>`;
              if (parsed.sheets[sn][0]) {
                html += `<div style="color:#6b7280;font-size:11px;margin-bottom:6px;">Columns: ${Object.keys(parsed.sheets[sn][0]).slice(0,8).join(', ')}</div>`;
              }
            }
            html += `</div>`;
            html += `<button class="gg-upload-btn" id="ggExcelSync"><i class="fas fa-sync mr-1"></i> Sync ${totalRows} rows into ${cfg.label}</button>`;
            preview.innerHTML = html;
            $('#ggExcelSync').onclick = async () => {
              $('#ggExcelSync').disabled = true;
              $('#ggExcelSync').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Syncing…';
              // Normalize for leads category
              let payload = { category, fileName: f.name, sheets: parsed.sheets, parser: cfg.parser };
              if (cfg.parser === 'leads') {
                const allLeads = [];
                for (const sn of parsed.sheetNames) {
                  for (const row of parsed.sheets[sn]) {
                    const norm = normalizeLeadRow(row);
                    if (norm.lead || norm.contact) {
                      norm.sheet = sn;
                      allLeads.push(norm);
                    }
                  }
                }
                payload.normalizedLeads = allLeads;
              }
              const res = await fetch(cfg.api + '/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const j = await res.json();
              preview.innerHTML += `<div style="margin-top:10px;color:#059669;"><i class="fas fa-check-circle"></i> ${j.message || 'Synced'} (${j.imported || 0} imported, ${j.duplicates || 0} duplicates)</div>`;
            };
          } catch (e) {
            preview.innerHTML = `<p style="color:#dc2626;"><i class="fas fa-times"></i> Parse failed: ${e.message}</p>`;
          }
        };
      }

      // Google Drive tab
      $('#ggGDriveSave').onclick = async () => {
        const link = $('#ggGDriveLink').value.trim();
        const label = $('#ggGDriveLabel').value.trim();
        const result = $('#ggGDriveResult');
        if (!link) { result.innerHTML = '<span style="color:#dc2626">Please paste a link</span>'; return; }
        result.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing…';
        try {
          const res = await fetch(cfg.api + '/gdrive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, link, label, uploadedBy: (window.currentUser && window.currentUser.name) || 'Unknown' })
          });
          const j = await res.json();
          if (j.success) {
            let extra = '';
            if (j.previewRows) extra = ` <span class="gg-upload-stat">${j.previewRows} rows pulled</span>`;
            result.innerHTML = `<span style="color:#059669"><i class="fas fa-check"></i> Linked${extra}</span>`;
          } else {
            result.innerHTML = `<span style="color:#dc2626"><i class="fas fa-times"></i> ${j.error || 'Failed'}</span>`;
          }
        } catch (e) {
          result.innerHTML = `<span style="color:#dc2626"><i class="fas fa-times"></i> ${e.message}</span>`;
        }
      };

      // History
      async function loadHistory() {
        const list = $('#ggHistoryList');
        list.innerHTML = '<p style="color:#6b7280;"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';
        try {
          const res = await fetch(cfg.api + '/list');
          const j = await res.json();
          if (!j.items || j.items.length === 0) {
            list.innerHTML = '<p style="color:#6b7280;">No uploads yet for this category.</p>';
            return;
          }
          list.innerHTML = j.items.map(it => `
            <div class="gg-upload-item">
              <span>
                <i class="fas ${it.kind === 'gdrive' ? 'fa-link' : 'fa-file'} mr-2"></i>
                ${it.label || it.fileName || it.link || 'Unnamed'}
                <small style="color:#6b7280;">— ${new Date(it.uploadedAt).toLocaleString()}</small>
              </span>
              <span><small>${it.uploadedBy || ''}</small></span>
            </div>
          `).join('');
        } catch (e) {
          list.innerHTML = '<p style="color:#dc2626;">Failed to load history.</p>';
        }
      }
    },

    // Mount the floating upload button on the current page
    mount(category, opts) {
      injectStyles();
      const cfg = CATEGORY_API[category] || CATEGORY_API.general;
      // Remove any existing FAB
      document.querySelectorAll('.gg-upload-fab').forEach(b => b.remove());
      const btn = document.createElement('button');
      btn.className = 'gg-upload-fab';
      btn.innerHTML = `<i class="fas fa-upload"></i> Upload to ${cfg.label}`;
      btn.onclick = () => GGDocumentUpload.open(category);
      // Custom anchor
      if (opts && opts.anchor) {
        const a = document.querySelector(opts.anchor);
        if (a) {
          btn.style.position = 'static';
          btn.style.boxShadow = 'none';
          a.appendChild(btn);
          return;
        }
      }
      document.body.appendChild(btn);
    }
  };

  window.GGDocumentUpload = GGDocumentUpload;

  // Auto-mount based on URL path
  function autoMount() {
    const path = (location.pathname || '').toLowerCase();
    let cat = null;
    if (path.includes('lead')) cat = 'leads';
    else if (path.includes('admission') || path.includes('application')) cat = 'admissions';
    else if (path.includes('finance') || path.includes('commission')) cat = 'finance';
    else if (path.includes('student')) cat = 'students';
    else if (path.includes('comm')) cat = 'comms';
    else if (path.includes('daily')) cat = 'daily-ops';
    else if (path.includes('report')) cat = 'reports';
    else if (path.includes('visa')) cat = 'visa';
    else if (path.includes('leave')) cat = 'leave';
    else if (path.includes('red-flag') || path.includes('redflag')) cat = 'red-flags';
    if (cat) {
      // Check RBAC permission before mounting
      const tryMount = () => {
        if (window.GGRBAC) {
          // User must have at least 'edit' on document-upload AND 'view' on the category
          if (window.GGRBAC.canEdit('document-upload') && window.GGRBAC.canView(cat)) {
            GGDocumentUpload.mount(cat);
          }
        } else {
          // RBAC not loaded yet — mount anyway, gates will hide if needed
          GGDocumentUpload.mount(cat);
        }
      };
      if (document.readyState === 'complete') setTimeout(tryMount, 300);
      else window.addEventListener('load', () => setTimeout(tryMount, 300));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
})();
