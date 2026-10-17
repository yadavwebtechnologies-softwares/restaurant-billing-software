/* ============================================================
   invoices.js — invoice list + new invoice creation
   ============================================================ */

const CART = new Map(); // pid → { pid, name, price, qty }

document.addEventListener('DOMContentLoaded', async () => {
  await new Promise(r => setTimeout(r, 80));

  const isNew = qs('new') === '1';
  if (isNew) showNewView();
  else       showListView();

  wireListView();
  wireNewView();
});

/* ============================================================
   VIEW SWITCHER
   ============================================================ */
function showListView() {
  document.getElementById('listView').hidden = false;
  document.getElementById('newView').hidden = true;
}

function showNewView() {
  document.getElementById('listView').hidden = true;
  document.getElementById('newView').hidden = false;
  document.getElementById('cartEmpty')?.removeAttribute('hidden');
}

/* ============================================================
   LIST VIEW
   ============================================================ */
function wireListView() {
  const newBtn = document.getElementById('newInvoiceBtn');
  if (newBtn) newBtn.addEventListener('click', () => {
    history.pushState({}, '', 'invoices.html?new=1');
    showNewView();
  });

  const exportBtn = document.getElementById('exportInvoicesBtn');
  if (exportBtn) exportBtn.addEventListener('click', () => {
    toast('Export coming soon');
  });

  const search = document.getElementById('invoiceSearch');
  if (search) search.addEventListener('input', debounce(loadInvoices, 300));

  document.querySelectorAll('#statusTabs .date-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#statusTabs .date-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadInvoices();
    });
  });

  loadInvoices();
}

async function loadInvoices() {
  const search = document.getElementById('invoiceSearch')?.value.trim() || '';
  const statusTab = document.querySelector('#statusTabs .date-tab.active');
  const status = statusTab?.dataset.status || 'all';

  const params = new URLSearchParams();
  params.set('limit', '50');
  if (status !== 'all') params.set('status', status);
  if (search) params.set('q', search);

  try {
    const data = await api('/invoices?' + params.toString()).catch(() => null);
    if (!data || !Array.isArray(data.invoices)) return;
    renderInvoiceTable(data.invoices);
  } catch (e) {
    // silent
  }
}

function renderInvoiceTable(list) {
  const tbody = document.getElementById('invoicesBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);font-size:var(--fs-sm);">No invoices found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(inv => `
    <tr data-id="${escapeHtml(inv.id || '')}">
      <td class="mono">${escapeHtml(inv.number || '—')}</td>
      <td>
        <div class="cust">
          <div class="cust-avatar">${escapeHtml((inv.customerName || 'W')[0])}</div>
          <div>
            <div class="cust-name">${escapeHtml(inv.customerName || 'Walk-in')}</div>
            <div class="cust-sub">${inv.table ? 'Table ' + escapeHtml(inv.table) : 'Walk-in'}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(formatDateTime(inv.createdAt))}</td>
      <td class="num">₹ ${formatCurrency(inv.grandTotal || 0)}</td>
      <td><span class="pill ${escapeHtml(inv.status || 'paid')}">${cap(inv.status || 'paid')}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-icon" title="View" onclick="window.location.href='invoice.html?id=${escapeHtml(inv.id || '')}'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn btn-icon" title="Print" onclick="window.open('invoice.html?id=${escapeHtml(inv.id || '')}&print=1','_blank')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ============================================================
   NEW VIEW
   ============================================================ */
function wireNewView() {
  const cancelBtn = document.getElementById('cancelNewBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    if (CART.size && !confirm('Discard this invoice?')) return;
    CART.clear();
    history.pushState({}, '', 'invoices.html');
    showListView();
  });

  const saveBtn = document.getElementById('saveInvoiceBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveInvoice);

  // Product tiles
  document.querySelectorAll('.product-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      addToCart({
        pid:   tile.dataset.pid,
        name:  tile.dataset.name,
        price: parseInt(tile.dataset.price, 10)
      });
    });
  });

  // Product search
  const prodSearch = document.getElementById('productSearch');
  if (prodSearch) prodSearch.addEventListener('input', filterProducts);

  // Discount input
  const discount = document.getElementById('cartDiscount');
  if (discount) discount.addEventListener('input', recalcTotals);
}

function filterProducts() {
  const q = (document.getElementById('productSearch')?.value || '').trim().toLowerCase();
  document.querySelectorAll('.product-tile').forEach(tile => {
    const name = (tile.dataset.name || '').toLowerCase();
    tile.style.display = (!q || name.includes(q)) ? '' : 'none';
  });
}

/* ---------- Cart ---------- */
function addToCart({ pid, name, price }) {
  if (CART.has(pid)) {
    const item = CART.get(pid);
    item.qty += 1;
    CART.set(pid, item);
  } else {
    CART.set(pid, { pid, name, price, qty: 1 });
  }
  renderCart();
}

function removeFromCart(pid) {
  CART.delete(pid);
  renderCart();
}

function changeQty(pid, delta) {
  if (!CART.has(pid)) return;
  const item = CART.get(pid);
  item.qty += delta;
  if (item.qty <= 0) CART.delete(pid);
  else CART.set(pid, item);
  renderCart();
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const empty = document.getElementById('cartEmpty');
  const count = document.getElementById('cartCount');
  if (!body) return;

  if (!CART.size) {
    if (empty) empty.hidden = false;
    body.innerHTML = '';
    if (empty) body.appendChild(empty);
    if (count) count.textContent = '0 items';
    recalcTotals();
    return;
  }

  if (empty) empty.hidden = true;
  if (count) count.textContent = CART.size + ' item' + (CART.size > 1 ? 's' : '');

  body.innerHTML = Array.from(CART.values()).map(item => `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-sub">₹ ${formatCurrency(item.price)} each</div>
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-pid="${escapeHtml(item.pid)}">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-pid="${escapeHtml(item.pid)}">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-total">₹ ${formatCurrency(item.price * item.qty)}</div>
        <button class="cart-remove" data-action="remove" data-pid="${escapeHtml(item.pid)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Remove
        </button>
      </div>
    </div>
  `).join('');

  body.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.pid;
      const action = btn.dataset.action;
      if (action === 'inc') changeQty(pid, 1);
      else if (action === 'dec') changeQty(pid, -1);
      else if (action === 'remove') removeFromCart(pid);
    });
  });

  recalcTotals();
}

function recalcTotals() {
  let subtotal = 0;
  CART.forEach(item => subtotal += item.price * item.qty);

  const discountEl = document.getElementById('cartDiscount');
  const discountRupees = discountEl ? Math.max(0, Number(discountEl.value) || 0) : 0;
  const discountPaise = discountRupees * 100;
  const total = Math.max(0, subtotal - discountPaise);

  setText('cartSubtotal', '₹ ' + formatCurrency(subtotal));
  setText('cartTotal',    '₹ ' + formatCurrency(total));
}

/* ---------- Save ---------- */
async function saveInvoice() {
  if (!CART.size) { toast('Add at least one product'); return; }

  const name = document.getElementById('custName')?.value.trim() || 'Walk-in';
  const phone = document.getElementById('custPhone')?.value.trim() || '';
  const table = document.getElementById('custTable')?.value.trim() || '';
  const paymentMode = document.getElementById('paymentMode')?.value || 'UPI';
  const discountRupees = Math.max(0, Number(document.getElementById('cartDiscount')?.value) || 0);

  let subtotal = 0;
  const items = [];
  CART.forEach(item => {
    subtotal += item.price * item.qty;
    items.push({ pid: item.pid, name: item.name, price: item.price, qty: item.qty });
  });

  const payload = {
    customer: { name, phone, table },
    items,
    subtotal,
    discount: discountRupees * 100,
    grandTotal: Math.max(0, subtotal - discountRupees * 100),
    paymentMode,
    status: 'paid'
  };

  const btn = document.getElementById('saveInvoiceBtn');
  if (btn) btn.disabled = true;

  try {
    const res = await api('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res && res.id) {
      toast('Invoice saved');
      CART.clear();
      window.location.href = 'invoice.html?id=' + encodeURIComponent(res.id);
    } else {
      toast('Could not save — check API');
    }
  } catch (e) {
    toast('Save failed');
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function cap(s) {
  if (!s) return '';
  return s[0].toUpperCase() + s.slice(1);
}

function debounce(fn, ms) {
  let t;
  return function () {
    clearTimeout(t);
    const args = arguments;
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}
