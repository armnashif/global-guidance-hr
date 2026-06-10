/* ============================================================
   GG Role-Based Access Control (RBAC)
   Client-side permission gate + Settings UI
   ============================================================ */
(function () {
  if (window.GGRBAC) return;

  const STORAGE_KEY = 'gg_rbac_cache_v1';
  let CACHE = { roles: [], features: [], users: [], me: null, loadedAt: 0 };
  let LOADING = null;

  // Default fallback features (also defined server-side)
  const DEFAULT_FEATURES = [
    { id: 'leads',       label: 'Leads / Lead Management',        group: 'Sales' },
    { id: 'admissions',  label: 'Admissions / Applications',      group: 'Operations' },
    { id: 'finance',     label: 'Finance & Commission',           group: 'Finance' },
    { id: 'students',    label: 'Students',                       group: 'Operations' },
    { id: 'comms',       label: 'Communication Suite',            group: 'Operations' },
    { id: 'daily-ops',   label: 'Daily Operations',               group: 'Operations' },
    { id: 'reports',     label: 'Reports & Analytics',            group: 'Management' },
    { id: 'visa',        label: 'Visa Processing',                group: 'Operations' },
    { id: 'leave',       label: 'Leave Management',               group: 'HR' },
    { id: 'red-flags',   label: 'Red Flags',                      group: 'Management' },
    { id: 'system-settings', label: 'System Settings',            group: 'Admin' },
    { id: 'document-upload', label: 'Document Upload Widget',     group: 'Operations' },
    { id: 'whatsapp',    label: 'WhatsApp Hub',                   group: 'Operations' },
    { id: 'location-tracker', label: 'Staff Location Tracker',    group: 'HR' },
    { id: 'employees',   label: 'Employee Management',            group: 'HR' }
  ];

  const PERM_LEVELS = ['none', 'view', 'edit', 'admin']; // ascending

  function permRank(p) { return PERM_LEVELS.indexOf(p || 'none'); }

  // ---- API loader ----
  async function loadAll(force) {
    if (LOADING && !force) return LOADING;
    LOADING = (async () => {
      try {
        const res = await fetch('/api/rbac/state');
        if (res.ok) {
          const j = await res.json();
          if (j.success) {
            CACHE = { ...j, loadedAt: Date.now() };
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(CACHE)); } catch {}
            return CACHE;
          }
        }
      } catch (e) {}
      // Fallback to localStorage cache
      try {
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (cached) CACHE = cached;
      } catch {}
      return CACHE;
    })();
    const out = await LOADING;
    LOADING = null;
    return out;
  }

  // ---- Identify current user ----
  function getCurrentUser() {
    if (window.currentUser) return window.currentUser;
    try {
      const u = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');
      if (u) return u;
    } catch {}
    return null;
  }

  // ---- Permission resolution ----
  function getMyRole() {
    const u = getCurrentUser();
    if (!u) return null;
    // Check user-specific override in CACHE.users
    const userRow = (CACHE.users || []).find(x =>
      String(x.employeeId) === String(u.employeeId) ||
      String(x.id) === String(u.id) ||
      String(x.username) === String(u.username)
    );
    if (userRow && userRow.roleId) {
      const role = (CACHE.roles || []).find(r => r.id === userRow.roleId);
      if (role) return role;
    }
    // Fallback: match by role name
    const roleByName = (CACHE.roles || []).find(r =>
      r.name && u.role && r.name.toLowerCase() === u.role.toLowerCase()
    );
    if (roleByName) return roleByName;
    // Final fallback: highest privilege if level >= 100 (CEO/COO)
    if (u.level >= 100) return (CACHE.roles || []).find(r => r.id === 'admin') || null;
    return null;
  }

  function can(featureId, action) {
    action = action || 'view';
    const u = getCurrentUser();
    if (!u) return false;
    // Super admin shortcut for level 100+ (CEO/COO) — always full access
    if (u.level >= 100) return true;
    const role = getMyRole();
    if (!role) return false;
    if (role.permissions && role.permissions['*'] && permRank(role.permissions['*']) >= permRank(action)) return true;
    const granted = role.permissions ? role.permissions[featureId] : null;
    return permRank(granted) >= permRank(action);
  }

  function canView(f)  { return can(f, 'view'); }
  function canEdit(f)  { return can(f, 'edit'); }
  function canAdmin(f) { return can(f, 'admin'); }

  // ---- DOM permission gate ----
  // Hide elements with [data-perm="featureId:action"] if user lacks permission
  function applyDomGates(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-perm]').forEach(el => {
      const [feat, act] = (el.getAttribute('data-perm') || '').split(':');
      if (!feat) return;
      if (!can(feat, act || 'view')) {
        el.style.display = 'none';
        el.setAttribute('data-perm-hidden', '1');
      } else if (el.getAttribute('data-perm-hidden')) {
        el.style.display = '';
        el.removeAttribute('data-perm-hidden');
      }
    });
    scope.querySelectorAll('[data-perm-disable]').forEach(el => {
      const [feat, act] = (el.getAttribute('data-perm-disable') || '').split(':');
      if (!feat) return;
      if (!can(feat, act || 'edit')) {
        el.setAttribute('disabled', 'disabled');
        el.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        el.removeAttribute('disabled');
        el.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
  }

  // ---- Settings UI ----
  function injectStyles() {
    if (document.getElementById('gg-rbac-styles')) return;
    const s = document.createElement('style');
    s.id = 'gg-rbac-styles';
    s.textContent = `
      .gg-rbac-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;}
      .gg-rbac-modal{background:#fff;border-radius:14px;max-width:1100px;width:100%;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;}
      .gg-rbac-head{padding:16px 22px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;display:flex;justify-content:space-between;align-items:center;}
      .gg-rbac-head h2{margin:0;font-size:18px;font-weight:700;}
      .gg-rbac-tabs{display:flex;gap:4px;padding:0 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;}
      .gg-rbac-tab{padding:12px 18px;cursor:pointer;border-bottom:3px solid transparent;font-weight:500;color:#6b7280;font-size:14px;}
      .gg-rbac-tab.active{color:#1d4ed8;border-color:#1d4ed8;}
      .gg-rbac-body{padding:18px 22px;overflow:auto;flex:1;}
      .gg-rbac-table{width:100%;border-collapse:collapse;font-size:13px;}
      .gg-rbac-table th,.gg-rbac-table td{padding:8px 10px;text-align:left;border-bottom:1px solid #e5e7eb;}
      .gg-rbac-table th{background:#f3f4f6;font-weight:600;color:#374151;position:sticky;top:0;}
      .gg-rbac-table tr:hover{background:#f9fafb;}
      .gg-rbac-perm-select{padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;background:#fff;}
      .gg-rbac-perm-select.none{background:#fee2e2;color:#991b1b;}
      .gg-rbac-perm-select.view{background:#dbeafe;color:#1e40af;}
      .gg-rbac-perm-select.edit{background:#dcfce7;color:#166534;}
      .gg-rbac-perm-select.admin{background:#fef3c7;color:#92400e;}
      .gg-rbac-btn{padding:8px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:500;font-size:13px;}
      .gg-rbac-btn:hover{background:#1e40af;}
      .gg-rbac-btn.danger{background:#dc2626;}
      .gg-rbac-btn.danger:hover{background:#b91c1c;}
      .gg-rbac-btn.secondary{background:#6b7280;}
      .gg-rbac-input{padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;width:100%;}
      .gg-rbac-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:12px;}
      .gg-rbac-section-title{font-weight:600;color:#1f2937;margin:0 0 10px;font-size:14px;display:flex;justify-content:space-between;align-items:center;}
      .gg-rbac-pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#dbeafe;color:#1e40af;}
      .gg-rbac-toolbar{display:flex;gap:8px;margin-bottom:14px;align-items:center;}
      .gg-rbac-empty{text-align:center;color:#6b7280;padding:30px;}
      .gg-rbac-fab{position:fixed;right:24px;bottom:88px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;padding:12px 18px;border-radius:999px;box-shadow:0 6px 20px rgba(124,58,237,.4);cursor:pointer;font-weight:600;border:none;z-index:9997;font-size:13px;display:flex;gap:8px;align-items:center;}
      .gg-rbac-fab:hover{transform:translateY(-2px);}
    `;
    document.head.appendChild(s);
  }

  async function openSettings() {
    injectStyles();
    await loadAll(true);
    const u = getCurrentUser();
    const isAdmin = u && (u.level >= 100 || canAdmin('system-settings'));
    if (!isAdmin) {
      alert('Only CEO/COO/Admin can manage roles & permissions.');
      return;
    }
    const bg = document.createElement('div');
    bg.className = 'gg-rbac-modal-bg';
    bg.innerHTML = `
      <div class="gg-rbac-modal">
        <div class="gg-rbac-head">
          <h2><i class="fas fa-shield-alt mr-2"></i> Roles & Permissions Settings</h2>
          <button onclick="this.closest('.gg-rbac-modal-bg').remove()" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;">&times;</button>
        </div>
        <div class="gg-rbac-tabs">
          <div class="gg-rbac-tab active" data-tab="roles"><i class="fas fa-user-tag mr-1"></i> Roles & Permissions</div>
          <div class="gg-rbac-tab" data-tab="users"><i class="fas fa-users mr-1"></i> Users</div>
          <div class="gg-rbac-tab" data-tab="features"><i class="fas fa-th-large mr-1"></i> Features</div>
          <div class="gg-rbac-tab" data-tab="audit"><i class="fas fa-history mr-1"></i> Audit Log</div>
        </div>
        <div class="gg-rbac-body" id="ggRbacBody"></div>
      </div>
    `;
    document.body.appendChild(bg);

    bg.querySelectorAll('.gg-rbac-tab').forEach(t => {
      t.onclick = () => {
        bg.querySelectorAll('.gg-rbac-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        renderTab(t.dataset.tab, bg.querySelector('#ggRbacBody'));
      };
    });
    renderTab('roles', bg.querySelector('#ggRbacBody'));
  }

  function permSelect(roleId, featId, current) {
    const css = current || 'none';
    return `
      <select class="gg-rbac-perm-select ${css}" data-role="${roleId}" data-feat="${featId}">
        ${PERM_LEVELS.map(p => `<option value="${p}" ${p===css?'selected':''}>${p}</option>`).join('')}
      </select>
    `;
  }

  async function renderTab(name, body) {
    if (name === 'roles')    return renderRoles(body);
    if (name === 'users')    return renderUsers(body);
    if (name === 'features') return renderFeatures(body);
    if (name === 'audit')    return renderAudit(body);
  }

  async function renderRoles(body) {
    body.innerHTML = '<p style="color:#6b7280;"><i class="fas fa-spinner fa-spin"></i> Loading roles…</p>';
    await loadAll(true);
    const features = (CACHE.features && CACHE.features.length) ? CACHE.features : DEFAULT_FEATURES;
    const groups = {};
    for (const f of features) (groups[f.group||'Other'] = groups[f.group||'Other'] || []).push(f);

    let html = `
      <div class="gg-rbac-toolbar">
        <input class="gg-rbac-input" id="ggNewRoleName" placeholder="New role name (e.g. BDM, HR Manager, Senior Counsellor)" style="max-width:340px;"/>
        <button class="gg-rbac-btn" id="ggAddRole"><i class="fas fa-plus mr-1"></i> Add Role</button>
        <span style="margin-left:auto;color:#6b7280;font-size:12px;">Permission: <strong>none</strong> (hidden) → <strong>view</strong> → <strong>edit</strong> → <strong>admin</strong> (manage)</span>
      </div>
    `;

    for (const role of CACHE.roles || []) {
      html += `
        <div class="gg-rbac-card" data-role-id="${role.id}">
          <div class="gg-rbac-section-title">
            <span>
              <i class="fas fa-user-tag" style="color:#7c3aed;"></i>
              <strong>${role.name}</strong>
              <span class="gg-rbac-pill" style="margin-left:6px;">${role.id === 'admin' ? 'Built-in' : 'Custom'}</span>
              ${role.description ? `<span style="color:#6b7280;font-size:12px;margin-left:8px;">${role.description}</span>` : ''}
            </span>
            <span>
              <button class="gg-rbac-btn secondary" data-action="bulk" data-role="${role.id}" style="margin-right:6px;font-size:11px;padding:4px 8px;">Bulk Set</button>
              ${role.id !== 'admin' ? `<button class="gg-rbac-btn danger" data-action="delete-role" data-role="${role.id}" style="font-size:11px;padding:4px 8px;"><i class="fas fa-trash"></i></button>` : ''}
            </span>
          </div>
          <table class="gg-rbac-table">
            <thead><tr><th>Group</th><th>Feature</th><th style="width:140px;">Permission</th></tr></thead>
            <tbody>
              ${Object.keys(groups).sort().map(g => groups[g].map((f, i) => `
                <tr>
                  <td>${i===0?`<strong>${g}</strong>`:''}</td>
                  <td>${f.label} <small style="color:#9ca3af;">(${f.id})</small></td>
                  <td>${permSelect(role.id, f.id, (role.permissions||{})[f.id] || 'none')}</td>
                </tr>
              `).join('')).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    body.innerHTML = html;

    body.querySelector('#ggAddRole').onclick = async () => {
      const name = body.querySelector('#ggNewRoleName').value.trim();
      if (!name) return;
      const res = await fetch('/api/rbac/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, permissions: {} })
      });
      const j = await res.json();
      if (j.success) renderRoles(body);
      else alert(j.error || 'Failed');
    };

    body.querySelectorAll('select[data-role]').forEach(sel => {
      sel.onchange = async () => {
        sel.className = 'gg-rbac-perm-select ' + sel.value;
        const res = await fetch('/api/rbac/roles/' + sel.dataset.role + '/permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature: sel.dataset.feat, permission: sel.value, by: (getCurrentUser()||{}).name })
        });
        const j = await res.json();
        if (!j.success) alert(j.error || 'Failed to save');
      };
    });

    body.querySelectorAll('[data-action="delete-role"]').forEach(b => {
      b.onclick = async () => {
        if (!confirm('Delete this role? Users assigned to it will lose access until reassigned.')) return;
        const res = await fetch('/api/rbac/roles/' + b.dataset.role, { method: 'DELETE' });
        const j = await res.json();
        if (j.success) renderRoles(body);
        else alert(j.error || 'Failed');
      };
    });

    body.querySelectorAll('[data-action="bulk"]').forEach(b => {
      b.onclick = async () => {
        const lvl = prompt('Bulk-set ALL features for this role to (none / view / edit / admin):', 'view');
        if (!lvl || !PERM_LEVELS.includes(lvl)) return;
        const res = await fetch('/api/rbac/roles/' + b.dataset.role + '/bulk', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permission: lvl, by: (getCurrentUser()||{}).name })
        });
        const j = await res.json();
        if (j.success) renderRoles(body);
        else alert(j.error || 'Failed');
      };
    });
  }

  async function renderUsers(body) {
    body.innerHTML = '<p style="color:#6b7280;"><i class="fas fa-spinner fa-spin"></i> Loading users…</p>';
    await loadAll(true);
    const roleOpts = (CACHE.roles||[]).map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    let html = `
      <div class="gg-rbac-toolbar">
        <input class="gg-rbac-input" id="ggUserSearch" placeholder="Search users by name, email, employee ID…" style="max-width:340px;"/>
        <span style="color:#6b7280;font-size:12px;">${(CACHE.users||[]).length} users</span>
      </div>
      <table class="gg-rbac-table">
        <thead><tr>
          <th>Employee ID</th><th>Name</th><th>Job Title</th><th>Department</th><th>Assigned Role</th><th>Action</th>
        </tr></thead>
        <tbody id="ggUsersBody">
          ${(CACHE.users||[]).map(u => `
            <tr data-uid="${u.id||u.employeeId}">
              <td><strong>${u.employeeId||'-'}</strong></td>
              <td>${u.name}</td>
              <td>${u.role||'-'}</td>
              <td>${u.department||'-'}</td>
              <td>
                <select class="gg-rbac-perm-select" data-user-role="${u.id||u.employeeId}">
                  <option value="">(no role)</option>
                  ${roleOpts.replace(new RegExp(`value="${u.roleId||'__'}"`), `value="${u.roleId||'__'}" selected`)}
                </select>
              </td>
              <td>
                <button class="gg-rbac-btn secondary" data-edit-user="${u.id||u.employeeId}" style="font-size:11px;padding:4px 8px;"><i class="fas fa-edit"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    body.innerHTML = html;

    body.querySelectorAll('[data-user-role]').forEach(sel => {
      sel.onchange = async () => {
        const res = await fetch('/api/rbac/users/' + sel.dataset.userRole + '/role', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: sel.value, by: (getCurrentUser()||{}).name })
        });
        const j = await res.json();
        if (!j.success) alert(j.error || 'Failed');
      };
    });

    body.querySelector('#ggUserSearch').oninput = e => {
      const q = e.target.value.toLowerCase();
      body.querySelectorAll('#ggUsersBody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    };
  }

  async function renderFeatures(body) {
    body.innerHTML = '<p style="color:#6b7280;"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';
    await loadAll(true);
    const features = (CACHE.features && CACHE.features.length) ? CACHE.features : DEFAULT_FEATURES;
    let html = `
      <div class="gg-rbac-toolbar">
        <input class="gg-rbac-input" id="ggFeatId" placeholder="feature-id (lowercase, no spaces)" style="max-width:240px;"/>
        <input class="gg-rbac-input" id="ggFeatLabel" placeholder="Feature label" style="max-width:280px;"/>
        <input class="gg-rbac-input" id="ggFeatGroup" placeholder="Group (e.g. Operations)" style="max-width:180px;"/>
        <button class="gg-rbac-btn" id="ggAddFeat"><i class="fas fa-plus mr-1"></i> Add Feature</button>
      </div>
      <table class="gg-rbac-table">
        <thead><tr><th>ID</th><th>Label</th><th>Group</th><th></th></tr></thead>
        <tbody>
          ${features.map(f => `
            <tr>
              <td><code>${f.id}</code></td>
              <td>${f.label}</td>
              <td>${f.group||'-'}</td>
              <td>${f.builtin ? '<span class="gg-rbac-pill">built-in</span>' : `<button class="gg-rbac-btn danger" data-del-feat="${f.id}" style="font-size:11px;padding:4px 8px;"><i class="fas fa-trash"></i></button>`}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    body.innerHTML = html;

    body.querySelector('#ggAddFeat').onclick = async () => {
      const id = body.querySelector('#ggFeatId').value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-');
      const label = body.querySelector('#ggFeatLabel').value.trim();
      const group = body.querySelector('#ggFeatGroup').value.trim() || 'Other';
      if (!id || !label) return alert('ID and label required');
      const res = await fetch('/api/rbac/features', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label, group, by: (getCurrentUser()||{}).name })
      });
      const j = await res.json();
      if (j.success) renderFeatures(body);
      else alert(j.error || 'Failed');
    };

    body.querySelectorAll('[data-del-feat]').forEach(b => {
      b.onclick = async () => {
        if (!confirm('Delete this feature? It will be removed from all role permissions.')) return;
        const res = await fetch('/api/rbac/features/' + b.dataset.delFeat, { method: 'DELETE' });
        const j = await res.json();
        if (j.success) renderFeatures(body);
        else alert(j.error || 'Failed');
      };
    });
  }

  async function renderAudit(body) {
    body.innerHTML = '<p style="color:#6b7280;"><i class="fas fa-spinner fa-spin"></i> Loading audit log…</p>';
    try {
      const res = await fetch('/api/rbac/audit');
      const j = await res.json();
      if (!j.items || !j.items.length) {
        body.innerHTML = '<div class="gg-rbac-empty"><i class="fas fa-history" style="font-size:36px;color:#d1d5db;"></i><p>No changes yet.</p></div>';
        return;
      }
      body.innerHTML = `
        <table class="gg-rbac-table">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>
            ${j.items.map(it => `
              <tr>
                <td>${new Date(it.at).toLocaleString()}</td>
                <td>${it.by||'-'}</td>
                <td><span class="gg-rbac-pill">${it.action}</span></td>
                <td><code style="font-size:11px;">${JSON.stringify(it.details||{})}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      body.innerHTML = '<p style="color:#dc2626;">Failed to load.</p>';
    }
  }

  // ---- Mount Settings FAB on system-settings page only (or anywhere admin lands) ----
  function mountSettingsFab() {
    const u = getCurrentUser();
    if (!u || u.level < 100) return; // CEO/COO only
    if (document.querySelector('.gg-rbac-fab')) return;
    injectStyles();
    const btn = document.createElement('button');
    btn.className = 'gg-rbac-fab';
    btn.innerHTML = '<i class="fas fa-shield-alt"></i> Roles & Permissions';
    btn.onclick = openSettings;
    document.body.appendChild(btn);
  }

  // ---- Public API ----
  window.GGRBAC = {
    load: loadAll,
    can, canView, canEdit, canAdmin,
    applyDomGates,
    openSettings,
    getMyRole,
    getCurrentUser
  };

  // Auto-init
  async function init() {
    await loadAll();
    applyDomGates();
    mountSettingsFab();
    // Re-apply gates whenever DOM mutates significantly
    const obs = new MutationObserver(() => applyDomGates());
    obs.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
