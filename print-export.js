/* ============================================================
   print-export.js — invoice page render + print
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await new Promise(r => setTimeout(r, 80));

  wireButtons();
  await renderInvoice();
});

/* ============================================================
   BUTTONS
   ============================================================ */
function wireButtons() {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => {
    location.href = 'invoices.html';
  });

  const printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
}

/* ============================================================
   MAIN RENDER
   ============================================================ */
async function renderInvoice() {
  const id = qs('id');
  if (!id) {
    toast('No invoice ID');
    return;
  }

  // Fetch invoice + settings in parallel
  const [invoice, settings] = await Promise.all([
    api('/invoices/' + encodeURIComponent(id)).catch(() => null),
    api('/settings/invoice').catch(() => null)
  ]);

  if (!invoice || !invoice.invoice) {
    toast('Invoice not found');
    return;
  }

  const inv = invoice.invoice;
  const cfg = settings && settings.settings ? settings.settings : {};

  applySettings(cfg);
  applyInvoice(inv);

  await generateQR(inv);

  if (qs('print') === '1') {
    setTimeout(() => window.print(), 300);
  }
}

/* ============================================================
   SETTINGS → PAGE
   ============================================================ */
function applySettings(cfg) {
  const business = cfg.business || {};
  const header   = cfg.header   || {};
  const footer   = cfg.footer   || {};
  const layout   = cfg.layout   || {};

  // Logo initial
  const bizName = business.name || 'Business';
  setText('invLogo', bizName[0].toUpperCase());

  // Business block
  setText('invBizName', bizName);
  setText('invBizTag', business.tagline || '');

  const metaParts = [];
  if (business.address1) metaParts.push(escapeHtml(business.address1));
  if (business.address2) metaParts.push(escapeHtml(business.address2));
  const contactLine = [];
  if (business.phone)   contactLine.push(escapeHtml(business.phone));
  if (business.email)   contactLine.push(escapeHtml(business.email));
  if (business.website) contactLine.push(escapeHtml(business.website));

  const metaEl = document.getElementById('invBizMeta');
  if (metaEl) {
    metaEl.innerHTML =
      (metaParts.length ? metaParts.join('<br>') : '') +
      (contactLine.length ? (metaParts.length ? '<br>' : '') + contactLine.join(' · ') : '');
  }

  // Title
  setText('invTitle', header.title || 'INVOICE');

  // FSSAI
  setText('invFSSAI', business.fssai || '—');

  // Tax details row visibility
  const taxDetailEl = document.querySelector('.setting-tax-detail');
  if (taxDetailEl) {
    if (header.showTaxDetails) taxDetailEl.removeAttribute('hidden');
    else                       taxDetailEl.setAttribute('hidden', '');
  }

  // Footer
  setText('invThanks',    footer.thanks || '');
  setText('invTerms',     [footer.terms1, footer.terms2].filter(Boolean).join(' '));
  setText('invSignatory', footer.signatureLabel || 'Authorised Signatory');

  // Watermark
  const wm = document.getElementById('invWatermark');
  if (wm) {
    if (layout.showWatermark && layout.watermarkText) {
      wm.textContent = layout.watermarkText;
      wm.removeAttribute('hidden');
    } else {
      wm.setAttribute('hidden', '');
    }
  }

  // Logo visibility
  const logoEl = document.getElementById('invLogo');
  if (logoEl) {
    if (layout.showLogo === false) logoEl.style.display = 'none';
    else                           logoEl.style.display = '';
  }
}

/* ============================================================
   INVOICE → PAGE
   ============================================================ */
function applyInvoice(inv) {
  // Number
  setText('invNumber', inv.number || '—');

  // Date + time
  const created = inv.createdAt || Date.now();
  setText('invDate', formatDate(created));
  setText('invTime', new Date(created).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));

  // Customer
  const cust = inv.customer || {};
  setText('invCustomerName', cust.name || 'Walk-in');
  setText('invCustomerPhone', cust.phone || '');

  // Table
  const tableLabel = document.getElementById('invTableLabel');
  const tableVal   = document.getElementById('invTable');
  if (cust.table) {
    if (tableLabel) tableLabel.hidden = false;
    if (tableVal)   { tableVal.hidden = false; tableVal.textContent = cust.table; }
  } else {
    if (tableLabel) tableLabel.hidden = true;
    if (tableVal)   tableVal.hidden = true;
  }

  // GSTIN
  setText('invGSTIN', inv.gstin || '—');

  // Items
  renderItems(inv.items || []);

  // Payment
  setText('invPaymentMethod', inv.paymentMode || '—');
  setText('invPaymentStatus', capitalize(inv.status || 'paid'));

  // Totals
  const subtotal = inv.subtotal || 0;
  const discount = inv.discount || 0;
  const tax      = inv.tax || 0;
  const grand    = inv.grandTotal || 0;
  const roundOff = inv.roundOff || 0;

  setText('invSubtotal',  '₹ ' + formatCurrency(subtotal));
  setText('invDiscount',  discount ? '− ₹ ' + formatCurrency(discount) : '₹ 0.00');
  setText('invRoundOff',  roundOff ? (roundOff >= 0 ? '+ ' : '− ') + '₹ ' + formatCurrency(Math.abs(roundOff)) : '0.00');
  setText('invGrandTotal', '₹ ' + formatCurrency(grand));

  const taxRow = document.getElementById('invTaxRow');
  if (taxRow) {
    if (tax > 0) {
      taxRow.removeAttribute('hidden');
      setText('invTax', '₹ ' + formatCurrency(tax));
    } else {
      taxRow.setAttribute('hidden', '');
    }
  }

  // Watermark if paid + no settings watermark
  if (inv.status === 'paid') {
    const wm = document.getElementById('invWatermark');
    if (wm && wm.hasAttribute('hidden')) {
      wm.textContent = 'PAID';
      // keep hidden — settings control it
    }
  }
}

/* ============================================================
   ITEMS ROWS
   ============================================================ */
function renderItems(items) {
  const body = document.getElementById('invItemsBody');
  if (!body) return;

  if (!items.length) {
    body.innerHTML = `
      <div class="inv-row">
        <span class="col-num">—</span>
        <span class="col-item">No items</span>
        <span class="col-qty">—</span>
        <span class="col-rate">—</span>
        <span class="col-amt">—</span>
      </div>`;
    return;
  }

  body.innerHTML = items.map((item, i) => `
    <div class="inv-row">
      <span class="col-num">${i + 1}</span>
      <span class="col-item">${escapeHtml(item.name || '')}</span>
      <span class="col-qty">${item.qty || 0}</span>
      <span class="col-rate">${formatCurrency(item.price || 0)}</span>
      <span class="col-amt">${formatCurrency((item.price || 0) * (item.qty || 0))}</span>
    </div>
  `).join('');
}

/* ============================================================
   QR GENERATION
   ============================================================ */
async function generateQR(inv) {
  const qrWrap = document.getElementById('invQR');
  if (!qrWrap) return;

  // Try to load QRCode lib from CDN (only once)
  try {
    if (!window.QRCode) {
      await loadQRScript();
    }
    if (window.QRCode) {
      qrWrap.innerHTML = '';
      new window.QRCode(qrWrap, {
        text: buildVerifyURL(inv),
        width: 62,
        height: 62,
        correctLevel: window.QRCode.CorrectLevel.M
      });
      return;
    }
  } catch (e) {
    // fall through to placeholder
  }

  // Fallback: keep existing SVG placeholder
}

function loadQRScript() {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function buildVerifyURL(inv) {
  const base = location.origin + location.pathname.replace('invoice.html', 'verify.html');
  return base + '?id=' + encodeURIComponent(inv.id || '') +
         '&code=' + encodeURIComponent(inv.verifyCode || '');
}

/* ============================================================
   HELPERS
   ============================================================ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}

function capitalize(s) {
  if (!s) return '';
  return s[0].toUpperCase() + s.slice(1);
}
