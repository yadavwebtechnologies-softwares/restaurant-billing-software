/* ============================================================
   reports.js — reports & sales analysis page
   ============================================================ */

let currentRange = 'week';

document.addEventListener('DOMContentLoaded', async () => {
  await new Promise(r => setTimeout(r, 80));

  wireRangeTabs();
  wireActions();
  animateSalesChart();
  loadReportData(currentRange);
});

/* ---------- Range tabs ---------- */
function wireRangeTabs() {
  const tabs = document.querySelectorAll('#dateTabs .date-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentRange = tab.dataset.range || 'week';
      loadReportData(currentRange);
    });
  });
}

/* ---------- Export + Print ---------- */
function wireActions() {
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', () => {
    toast('CSV export will be available soon');
  });

  const printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', () => {
    window.print();
  });
}

/* ---------- Sales chart ---------- */
function animateSalesChart() {
  const curHeights  = [58, 72, 64, 88, 76, 96, 70];
  const prevHeights = [46, 55, 60, 70, 66, 82, 62];

  document.querySelectorAll('#salesTrendChart .chart-col').forEach((col, i) => {
    const cur  = col.querySelector('.bar:not(.prev)');
    const prev = col.querySelector('.bar.prev');
    if (cur)  cur.style.height  = (curHeights[i]  || 0) + '%';
    if (prev) prev.style.height = (prevHeights[i] || 0) + '%';
  });
}

/* ---------- Load report data ---------- */
async function loadReportData(range) {
  updateRangeLabel(range);

  try {
    const data = await api('/reports?range=' + encodeURIComponent(range)).catch(() => null);
    if (!data) return;

    if (data.kpis)             renderKPIs(data.kpis);
    if (data.salesTrend)       renderSalesTrend(data.salesTrend);
    if (data.paymentSplit)     renderPaymentSplit(data.paymentSplit);
    if (data.categories)       renderCategories(data.categories);
    if (data.monthlyTrend)     renderMonthlyTrend(data.monthlyTrend);
    if (data.hourly)           renderHourly(data.hourly);
    if (data.topProducts)      renderTopProducts(data.topProducts);
    if (data.keyMetrics)       renderKeyMetrics(data.keyMetrics);
    if (data.dailySummary)     renderDailySummary(data.dailySummary);
  } catch (e) {
    // silent — placeholders stay
  }
}

/* ---------- Range label ---------- */
function updateRangeLabel(range) {
  const now = new Date();
  let start = new Date();
  let end   = new Date();

  if (range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === 'week') {
    const day = now.getDay() || 7;
    start = new Date(now);
    start.setDate(now.getDate() - day + 1);
  } else if (range === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
  }

  const startEl = document.getElementById('rangeStart');
  const endEl   = document.getElementById('rangeEnd');
  if (startEl) startEl.textContent = formatDate(start.getTime());
  if (endEl)   endEl.textContent   = formatDate(end.getTime());
}

/* ---------- Renderers ---------- */
function renderKPIs(k) {
  setText('kpiTotalSales',  k.totalSales  ? '₹ ' + formatCurrency(k.totalSales)  : null);
  setText('kpiTotalOrders', k.totalOrders != null ? String(k.totalOrders) : null);
  setText('kpiAvgBill',     k.avgBill     ? '₹ ' + formatCurrency(k.avgBill)     : null);
  setText('kpiPeakHour',    k.peakHour    || null);
}

function renderSalesTrend(trend) {
  const cols = document.querySelectorAll('#salesTrendChart .chart-col');
  if (!trend || !trend.length) return;

  const max = Math.max(...trend.map(d => Math.max(d.current || 0, d.previous || 0)), 1);

  cols.forEach((col, i) => {
    const d = trend[i];
    if (!d) return;
    const curBar  = col.querySelector('.bar:not(.prev)');
    const prevBar = col.querySelector('.bar.prev');
    const curH    = Math.round(((d.current  || 0) / max) * 100);
    const prevH   = Math.round(((d.previous || 0) / max) * 100);

    if (curBar) {
      curBar.style.height = curH + '%';
      curBar.setAttribute('data-tip', (d.label || '') + ' · ₹ ' + formatCurrency(d.current || 0));
    }
    if (prevBar) {
      prevBar.style.height = prevH + '%';
      prevBar.setAttribute('data-tip', (d.label || '') + ' · ₹ ' + formatCurrency(d.previous || 0));
    }
  });
}

function renderPaymentSplit(split) {
  const bar    = document.getElementById('paymentSplitBar');
  const legend = document.getElementById('paymentSplitLegend');
  if (!bar || !legend || !split) return;

  const classes = ['s1', 's2', 's3'];

  bar.innerHTML = split.map((s, i) =>
    `<div class="split-seg ${classes[i] || 's3'}" style="width:${s.percent || 0}%"></div>`
  ).join('');

  legend.innerHTML = split.map((s, i) => `
    <div class="split-legend-item">
      <div class="sl-left">
        <span class="sl-dot ${classes[i] || 's3'}"></span>
        <span class="sl-name">${escapeHtml(s.method || '')}</span>
      </div>
      <span class="sl-val">₹ ${formatCurrency(s.amount || 0)} · ${s.percent || 0}%</span>
    </div>
  `).join('');
}

function renderCategories(list) {
  const el = document.getElementById('categoryList');
  if (!el || !list) return;
  const max = Math.max(...list.map(c => c.amount || 0), 1);
  el.innerHTML = list.map(c => `
    <div class="cat-item">
      <div class="cat-row">
        <span class="cat-name">${escapeHtml(c.name || '')}</span>
        <span class="cat-val">₹ ${formatCurrency(c.amount || 0)} · ${c.percent || 0}%</span>
      </div>
      <div class="cat-track"><div class="cat-fill" style="width:${Math.round(((c.amount || 0) / max) * 100)}%"></div></div>
    </div>
  `).join('');
}

function renderMonthlyTrend(list) {
  const el = document.getElementById('monthlyList');
  if (!el || !list) return;
  const max = Math.max(...list.map(m => m.amount || 0), 1);
  el.innerHTML = list.map(m => `
    <div class="cat-item">
      <div class="cat-row">
        <span class="cat-name">${escapeHtml(m.label || '')}</span>
        <span class="cat-val">₹ ${formatCurrency(m.amount || 0)}</span>
      </div>
      <div class="cat-track"><div class="cat-fill" style="width:${Math.round(((m.amount || 0) / max) * 100)}%"></div></div>
    </div>
  `).join('');
}

function renderHourly(hourly) {
  const grid = document.getElementById('hourlyGrid');
  if (!grid || !hourly || !hourly.buckets) return;
  const max = Math.max(...hourly.buckets.map(b => b.orders || 0), 1);

  grid.innerHTML = hourly.buckets.map(b => {
    const ratio = (b.orders || 0) / max;
    let level = '';
    if (ratio >= 0.8) level = 'level-5';
    else if (ratio >= 0.6) level = 'level-4';
    else if (ratio >= 0.4) level = 'level-3';
    else if (ratio >= 0.2) level = 'level-2';
    else if (ratio > 0)   level = 'level-1';
    return `<div class="hour-cell ${level}" title="${escapeHtml(b.label || '')} — ${b.orders || 0} orders">${escapeHtml(b.short || '')}</div>`;
  }).join('');

  setText('peakHourLabel', hourly.peak || null);
  setText('slowHourLabel', hourly.slow || null);
}

function renderTopProducts(list) {
  const el = document.getElementById('topProductsList');
  if (!el || !list) return;
  const max = Math.max(...list.map(p => p.qty || 0), 1);
  el.innerHTML = list.map(p => `
    <div class="cat-item">
      <div class="cat-row">
        <span class="cat-name">${escapeHtml(p.name || '')}</span>
        <span class="cat-val">${p.qty || 0} · ₹ ${formatCurrency(p.amount || 0)}</span>
      </div>
      <div class="cat-track"><div class="cat-fill" style="width:${Math.round(((p.qty || 0) / max) * 100)}%"></div></div>
    </div>
  `).join('');
}

function renderKeyMetrics(m) {
  setText('metricMargin', m.grossMargin != null ? m.grossMargin + '%' : null);
  setText('metricRepeat', m.repeatCustomers != null ? m.repeatCustomers + '%' : null);
  setText('metricTax',    m.totalTax ? '₹ ' + formatCurrency(m.totalTax) : null);
}

function renderDailySummary(list) {
  const tbody = document.getElementById('dailySummaryBody');
  if (!tbody || !list || !list.length) return;

  tbody.innerHTML = list.map(d => `
    <tr>
      <td>${escapeHtml(d.date || '')}</td>
      <td class="num">${d.orders || 0}</td>
      <td class="num">₹ ${formatCurrency(d.revenue || 0)}</td>
      <td class="num">₹ ${formatCurrency(d.avgBill || 0)}</td>
      <td class="num">₹ ${formatCurrency(d.cash || 0)}</td>
      <td class="num">₹ ${formatCurrency(d.upi || 0)}</td>
      <td class="num">₹ ${formatCurrency(d.card || 0)}</td>
    </tr>
  `).join('');
}

/* ---------- Helpers ---------- */
function setText(id, value) {
  if (value == null) return;
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
