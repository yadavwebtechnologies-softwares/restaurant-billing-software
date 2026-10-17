/* ============================================================
   script.js — shared shell, Firebase init, auth, API, utilities
   Phase 1 — Used by every page
   ============================================================ */

/* ============================================================
   CONFIG — only the Worker URL lives here (not a secret)
   Firebase web config is fetched from Worker /config endpoint
   ============================================================ */
const API_BASE_URL = "[WORKER_URL]"; // e.g. https://billing-api.your-name.workers.dev

let FIREBASE_CONFIG = null; // loaded from Worker on boot

/* ============================================================
   PAGE META
   ============================================================ */
const PAGE_META = {
  'index.html':      { title: 'Login',            section: '',         requireAuth: false },
  'dashboard.html':  { title: 'Dashboard',        section: 'Main',     requireAuth: true, crumb: 'Dashboard' },
  'reports.html':    { title: 'Reports',          section: 'Main',     requireAuth: true, crumb: 'Reports' },
  'invoices.html':   { title: 'Invoices',         section: 'Main',     requireAuth: true, crumb: 'Invoices' },
  'invoice.html':    { title: 'Invoice',          section: 'Main',     requireAuth: true, crumb: 'Invoice' },
  'products.html':   { title: 'Products',         section: 'Manage',   requireAuth: true, crumb: 'Products' },
  'categories.html': { title: 'Categories',       section: 'Manage',   requireAuth: true, crumb: 'Categories' },
  'settings.html':   { title: 'Invoice Settings', section: 'Settings', requireAuth: true, crumb: 'Invoice' }
};

/* ============================================================
   FIREBASE INIT — fetch config from Worker, then load SDK
   ============================================================ */
let fbAuth = null;
let configPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function fetchFirebaseConfig() {
  if (FIREBASE_CONFIG) return FIREBASE_CONFIG;
  if (configPromise) return configPromise;

  configPromise = (async () => {
    const res = await fetch(API_BASE_URL + '/config');
    if (!res.ok) throw new Error('Failed to load Firebase config');
    FIREBASE_CONFIG = await res.json();
    return FIREBASE_CONFIG;
  })();

  return configPromise;
}

async function initFirebase() {
  if (fbAuth) return;

  await fetchFirebaseConfig();

  if (!window.firebase) {
    await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js');
  }
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  fbAuth = firebase.auth();
}

/* ============================================================
   AUTH HELPERS
   ============================================================ */
async function login(email, password) {
  await initFirebase();
  return fbAuth.signInWithEmailAndPassword(email, password);
}

async function logout() {
  await initFirebase();
  await fbAuth.signOut();
  location.href = 'index.html';
}

async function getJWT() {
  await initFirebase();
  const user = fbAuth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

function waitForAuth() {
  return new Promise(async (resolve, reject) => {
    await initFirebase();
    const unsub = fbAuth.onAuthStateChanged(user => {
      unsub();
      resolve(user);
    }, reject);
  });
}

async function requireAuth() {
  const user = await waitForAuth();
  if (!user) { location.href = 'index.html'; return null; }
  return user;
}

async function reauth(password) {
  await initFirebase();
  const user = fbAuth.currentUser;
  if (!user) throw new Error('Not logged in');
  const cred = firebase.auth.EmailAuthProvider.credential(user.email, password);
  return user.reauthenticateWithCredential(cred);
}

/* ============================================================
   API HELPER (JWT always attached)
   ============================================================ */
async function api(path, options = {}) {
  const jwt = await getJWT();
  if (!jwt) throw new Error('Not authenticated');

  const res = await fetch(API_BASE_URL + path, {
    ...options,
    headers: {
      'Authorization': 'Bearer ' + jwt,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (res.status === 401) { location.href = 'index.html'; return null; }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'API error ' + res.status);
  }
  return res.json().catch(() => ({}));
}

/* ============================================================
   ICONS
   ============================================================ */
const ICONS = {
  dashboard:  '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  invoice:    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  new:        '<path d="M12 5v14M5 12h14"/>',
  reports:    '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>',
  products:   '<path d="M20 7l-8-4-8 4 8 4 8-4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/>',
  categories: '<path d="M3 7h18M3 12h18M3 17h12"/>',
  settings:   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  bell:       '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  menu:       '<path d="M3 6h18M3 12h18M3 18h18"/>'
};

function svg(path) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

/* ============================================================
   SHELL BUILDERS
   ============================================================ */
function buildSidebar(activeKey) {
  const items = [
    { key: 'dashboard',  href: 'dashboard.html',       label: 'Dashboard',   group: 'Main' },
    { key: 'new',        href: 'invoices.html?new=1',  label: 'New Invoice', group: 'Main' },
    { key: 'invoice',    href: 'invoices.html',        label: 'Invoices',    group: 'Main' },
    { key: 'reports',    href: 'reports.html',         label: 'Reports',     group: 'Main' },
    { key: 'products',   href: 'products.html',        label: 'Products',    group: 'Manage' },
    { key: 'categories', href: 'categories.html',      label: 'Categories',  group: 'Manage' },
    { key: 'settings',   href: 'settings.html',        label: 'Settings',    group: 'Manage' }
  ];

  const renderGroup = (name) => {
    const list = items.filter(i => i.group === name);
    return `
      <div class="nav-section">${name}</div>
      ${list.map(i => `
        <a class="nav-item ${activeKey === i.key ? 'active' : ''}" href="${i.href}">
          ${svg(ICONS[i.key])} ${i.label}
        </a>`).join('')}`;
  };

  return `
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark">B</div>
        <div class="brand-text">
          <h1><span class="ph" data-setting="businessName">[Business Name]</span></h1>
          <span><span class="ph" data-setting="tagline">[Tagline]</span></span>
        </div>
      </div>
      ${renderGroup('Main')}
      ${renderGroup('Manage')}
      <div class="sidebar-footer">
        <div class="target-card">
          <div class="label">Today's Target</div>
          <div class="value"><span class="ph">[Amount]</span></div>
          <div class="target-track"><div class="target-fill"></div></div>
          <div class="target-meta">
            <span><span class="ph">[%]</span> achieved</span>
            <span><span class="ph">[Left]</span></span>
          </div>
        </div>
      </div>
    </aside>
    <div class="overlay" id="overlay"></div>`;
}

function buildTopbar(meta, user) {
  const initial = (user && user.email) ? user.email[0].toUpperCase() : 'O';
  return `
    <header class="topbar">
      <button class="menu-btn" id="menuBtn" aria-label="Open menu">${svg(ICONS.menu)}</button>
      <div class="crumbs">
        <span>${meta.section || ''}</span>
        <span class="sep">/</span>
        <span class="current">${meta.crumb || meta.title || ''}</span>
      </div>
      <div class="topbar-right">
        <button class="btn-icon" aria-label="Notifications">${svg(ICONS.bell)}</button>
        <button class="profile" id="profileBtn" title="Log out">
          <div>
            <div class="name"><span class="ph">${escapeHtml(user && user.email ? user.email : '[Owner]')}</span></div>
            <div class="role">Owner</div>
          </div>
          <div class="avatar">${initial}</div>
        </button>
      </div>
    </header>`;
}

function buildPageFooter() {
  return `
    <footer class="page-footer">
      <span><span class="ph" data-setting="businessName">[Business Name]</span> · <span class="ph">v1.0</span></span>
      <span><a href="#">Privacy</a> · <a href="#">Docs</a></span>
    </footer>`;
}

/* ============================================================
   SHELL INJECTOR
   ============================================================ */
function currentPageFile() {
  const parts = location.pathname.split('/');
  const last = parts[parts.length - 1];
  return last && last.endsWith('.html') ? last : 'index.html';
}

function detectMeta() {
  return PAGE_META[currentPageFile()] || { title: 'App', section: '', requireAuth: true, crumb: '' };
}

function detectActiveNav() {
  const file = currentPageFile().replace('.html', '');
  if (file === 'index' || file === '') return '';
  if (file === 'invoices' || file === 'invoice') return 'invoice';
  return file;
}

async function initShell() {
  const meta = detectMeta();

  // Login page — if already signed in, redirect to dashboard
  if (!meta.requireAuth) {
    await initFirebase();
    fbAuth.onAuthStateChanged(user => {
      if (user) location.href = 'dashboard.html';
    });
    return;
  }

  // All other pages — require auth first
  const user = await requireAuth();
  if (!user) return;

  const app = document.querySelector('.app');
  if (!app) return; // invoice.html uses page-chrome, not .app

  const main = app.querySelector('.main');
  if (!main) return;

  const content = main.querySelector('.content');
  if (!content) return;

  // Inject sidebar before .main
  app.insertAdjacentHTML('afterbegin', buildSidebar(detectActiveNav()));

  // Inject topbar before .content
  content.insertAdjacentHTML('beforebegin', buildTopbar(meta, user));

  // Inject footer at end of .content
  if (!content.querySelector('.page-footer')) {
    content.insertAdjacentHTML('beforeend', buildPageFooter());
  }

  wireShellEvents();
}

function wireShellEvents() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('overlay');
  const menuBtn  = document.getElementById('menuBtn');
  const profile  = document.getElementById('profileBtn');

  if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
    sidebar.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          sidebar.classList.remove('open');
          overlay.classList.remove('show');
        }
      });
    });
  }

  if (profile) {
    profile.addEventListener('click', () => {
      if (confirm('Log out?')) logout();
    });
  }
}

/* ============================================================
   TOAST
   ============================================================ */
function toast(message) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #0A0A0A; color: #FFFFFF; padding: 10px 16px; border-radius: 10px;
    font-size: 13.5px; font-weight: 600; z-index: 9999;
    box-shadow: 0 8px 24px rgba(0,0,0,0.20);
    opacity: 0; transition: opacity 0.2s ease;
    max-width: 90vw; text-align: center;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.style.opacity = '1');
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2500);
}

/* ============================================================
   UTILITIES
   ============================================================ */
function formatCurrency(paise) {
  if (paise == null || isNaN(paise)) return '0.00';
  const rupees = Number(paise) / 100;
  return rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatDateTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ============================================================
   AUTO BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await initShell();
  const page = currentPageFile();
  if (page === 'products.html')   initProductsPage();
  if (page === 'categories.html') initCategoriesPage();
});

/* ============================================================
   PRODUCTS PAGE
   ============================================================ */
let PRODUCT_CACHE = [];
let PRODUCT_ACTIVE_SWITCH = true;

function initProductsPage() {
  wireProductsUI();
  loadProducts();
}

function wireProductsUI() {
  const addBtn = document.getElementById('addProductBtn');
  if (addBtn) addBtn.addEventListener('click', () => openProductModal());

  const filter = document.getElementById('productFilter');
  if (filter) filter.addEventListener('input', debounce(loadProducts, 300));

  document.querySelectorAll('#productStatusTabs .date-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#productStatusTabs .date-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadProducts();
    });
  });

  // Modal controls
  const closeBtn  = document.getElementById('productModalClose');
  const cancelBtn = document.getElementById('productModalCancel');
  const saveBtn   = document.getElementById('productModalSave');
  const overlay   = document.getElementById('productModal');
  const activeSw  = document.getElementById('productActiveSwitch');

  if (closeBtn)  closeBtn.addEventListener('click', closeProductModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeProductModal);
  if (saveBtn)   saveBtn.addEventListener('click', saveProduct);

  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeProductModal();
  });

  if (activeSw) activeSw.addEventListener('click', () => {
    activeSw.classList.toggle('on');
    PRODUCT_ACTIVE_SWITCH = activeSw.classList.contains('on');
  });

  // Row actions (event delegation)
  const tbody = document.getElementById('productsBody');
  if (tbody) tbody.addEventListener('click', (e) => {
    const editBtn  = e.target.closest('[data-action="edit"]');
    const delBtn   = e.target.closest('[data-action="deactivate"]');
    if (editBtn)   openProductModal(editBtn.dataset.pid);
    if (delBtn)    deactivateProduct(delBtn.dataset.pid);
  });
}

async function loadProducts() {
  const search = document.getElementById('productFilter')?.value.trim() || '';
  const activeTab = document.querySelector('#productStatusTabs .date-tab.active');
  const status = activeTab?.dataset.status || 'all';

  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (search) params.set('q', search);

  try {
    const data = await api('/products?' + params.toString()).catch(() => null);
    if (!data || !Array.isArray(data.products)) return;
    PRODUCT_CACHE = data.products;
    renderProductsTable(data.products);
  } catch (e) {
    // silent
  }
}

function renderProductsTable(list) {
  const tbody = document.getElementById('productsBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);font-size:var(--fs-sm);">No products yet. Click "Add Product" to start.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${escapeHtml(p.name || '')}</td>
      <td>${escapeHtml(p.category || '—')}</td>
      <td class="num">₹ ${formatCurrency(p.price || 0)}</td>
      <td class="num">${p.taxRate != null ? p.taxRate : 0}%</td>
      <td>${escapeHtml(p.unit || 'plate')}</td>
      <td><span class="pill ${p.isActive === false ? 'inactive' : 'active'}">${p.isActive === false ? 'Inactive' : 'Active'}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-icon" title="Edit" data-action="edit" data-pid="${escapeHtml(p.id || '')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button class="btn btn-icon" title="${p.isActive === false ? 'Activate' : 'Deactivate'}" data-action="deactivate" data-pid="${escapeHtml(p.id || '')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openProductModal(pid) {
  const modal = document.getElementById('productModal');
  const title = document.getElementById('productModalTitle');
  const form  = document.getElementById('productForm');
  const activeSw = document.getElementById('productActiveSwitch');

  if (!modal) return;
  if (form) form.reset();

  if (pid) {
    const p = PRODUCT_CACHE.find(x => x.id === pid);
    if (!p) return;
    if (title) title.textContent = 'Edit Product';
    document.getElementById('productId').value       = p.id || '';
    document.getElementById('productName').value     = p.name || '';
    document.getElementById('productCategory').value = p.category || '';
    document.getElementById('productUnit').value     = p.unit || 'plate';
    document.getElementById('productPrice').value    = p.price != null ? (p.price / 100).toFixed(2) : '';
    document.getElementById('productTax').value      = p.taxRate != null ? p.taxRate : 5;
    document.getElementById('productDescription').value = p.description || '';

    PRODUCT_ACTIVE_SWITCH = p.isActive !== false;
  } else {
    if (title) title.textContent = 'Add Product';
    document.getElementById('productId').value = '';
    PRODUCT_ACTIVE_SWITCH = true;
  }

  if (activeSw) activeSw.classList.toggle('on', PRODUCT_ACTIVE_SWITCH);
  modal.removeAttribute('hidden');
  setTimeout(() => document.getElementById('productName')?.focus(), 60);
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.setAttribute('hidden', '');
}

async function saveProduct() {
  const name     = document.getElementById('productName')?.value.trim();
  const category = document.getElementById('productCategory')?.value.trim();
  const unit     = document.getElementById('productUnit')?.value || 'plate';
  const priceRupees = parseFloat(document.getElementById('productPrice')?.value || '0');
  const taxRate  = parseFloat(document.getElementById('productTax')?.value || '0');
  const desc     = document.getElementById('productDescription')?.value.trim();
  const id       = document.getElementById('productId')?.value || '';

  if (!name) { toast('Product name is required'); return; }
  if (!(priceRupees >= 0)) { toast('Enter a valid price'); return; }

  const payload = {
    name,
    category: category || '',
    unit,
    price: Math.round(priceRupees * 100),
    taxRate,
    description: desc || '',
    isActive: PRODUCT_ACTIVE_SWITCH
  };

  const saveBtn = document.getElementById('productModalSave');
  if (saveBtn) saveBtn.disabled = true;

  try {
    if (id) {
      await api('/products/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(payload) });
      toast('Product updated');
    } else {
      await api('/products', { method: 'POST', body: JSON.stringify(payload) });
      toast('Product added');
    }
    closeProductModal();
    loadProducts();
  } catch (e) {
    toast('Could not save product');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function deactivateProduct(pid) {
  if (!pid) return;
  const p = PRODUCT_CACHE.find(x => x.id === pid);
  if (!p) return;
  const action = p.isActive === false ? 'activate' : 'deactivate';
  if (!confirm(`Are you sure you want to ${action} this product?`)) return;

  try {
    await api('/products/' + encodeURIComponent(pid), {
      method: 'PATCH',
      body: JSON.stringify({ isActive: p.isActive === false })
    });
    toast('Product ' + (p.isActive === false ? 'activated' : 'deactivated'));
    loadProducts();
  } catch (e) {
    toast('Could not update product');
  }
}

/* ============================================================
   CATEGORIES PAGE — placeholder (next file)
   ============================================================ */
function initCategoriesPage() {
  // will be built next
}

/* ============================================================
   DEBOUNCE (if not already present)
   ============================================================ */
if (typeof debounce === 'undefined') {
  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      const args = arguments;
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }
}
