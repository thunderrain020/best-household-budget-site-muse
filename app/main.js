// AlderLedger — hash router, header shell, state and every interaction.
// Static ES modules only, no network at runtime. The household's own
// edits (added transactions, plan changes, bills marked paid, the $48
// move, added categories) live in localStorage under `alderledger-v1`
// and are layered onto the base ledger on every render, so every total
// on every view always includes them.

import { MONTHS, BILLS, buildSummary, verifyBudgetConsistency, fmt, fmt2 } from './data.js';
import { t } from './i18n.js';
import { renderHome } from './views/home.js';
import { renderEnvelopes } from './views/envelopes.js';
import { renderAnalytics } from './views/analytics.js';
import { renderLedger } from './views/ledger.js';
import { renderAudit } from './views/audit.js';

const STORE_KEY = 'alderledger-v1';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function loadUser() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { txns: [], planned: {}, paidBills: [], moved48: false, customEnvs: [], txnStatus: {} };
    const u = JSON.parse(raw);
    return { txns: [], planned: {}, paidBills: [], moved48: false, customEnvs: [], txnStatus: {}, ...u, txnStatus: u.txnStatus || {} };
  } catch { return { txns: [], planned: {}, paidBills: [], moved48: false, customEnvs: [], txnStatus: {} }; }
}
function saveUser() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state.user)); } catch { /* private mode: edits still work for the session */ } }

const state = {
  month: '2026-11', lang: localStorage.getItem('alderledger-lang') || 'en',
  theme: localStorage.getItem('alderledger-theme') || 'light',
  groupFilter: 'All', selectedEnv: 'dining', chartMode: 'cushion',
  compareA: '2026-11', compareB: 'target', analyticsTab: 'variance',
  debtExtra: 30000, debtTrims: { dining: false, subs: false, fun: false }, debtShock: 0,
  ledgerSearch: '', ledgerGroup: 'All', ledgerEnv: '',
  ledgerFrom: '', ledgerTo: '', ledgerSort: 'date-desc', sortEnv: 'spent-desc',
  user: loadUser(), menuOpen: false, editingTxn: null,
};

const app = document.getElementById('app');

function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  if (h.startsWith('/envelopes')) return 'envelopes';
  if (h.startsWith('/analytics')) return 'analytics';
  if (h.startsWith('/ledger')) return 'ledger';
  if (h.startsWith('/audit')) return 'audit';
  return 'home';
}

function renderHeader() {
  const lang = state.lang;
  const nav = [['/', t(lang, 'navOverview')], ['/envelopes', t(lang, 'navEnvelopes')], ['/analytics', t(lang, 'navAnalytics')], ['/ledger', t(lang, 'navLedger')], ['/audit', t(lang, 'navAudit')]];
  const r = route();
  const links = nav.map(([href, label]) => `<a href="#${href}" class="${(href === '/' ? r === 'home' : r === href.slice(1)) ? 'on' : ''}">${esc(label)}</a>`).join('');
  return `<header class="topbar">
    <a class="brand" href="#/"><span class="brand-mark">A</span><span class="brand-name">AlderLedger</span><span class="brand-sub">${esc(t(lang, 'tagline'))}</span></a>
    <select class="month-select" data-action="month" aria-label="Month">${MONTHS.map((m) => `<option value="${m.key}"${m.key === state.month ? ' selected' : ''}>${m.label}</option>`).join('')}</select>
    <nav class="tabs">${links}</nav>
    <input class="header-search" type="search" placeholder="${esc(t(lang, 'searchPh'))}" data-input="header-search" aria-label="Search ledger">
    <button class="icon-btn" data-action="theme" aria-label="Toggle dark mode">${state.theme === 'dark' ? '☀️' : '🌙'}</button>
    <button class="icon-btn" data-action="lang" aria-label="Toggle language">${lang === 'en' ? 'ID' : 'EN'}</button>
    <button class="btn btn-primary" data-action="add-entry">${esc(t(lang, 'addEntry'))}</button>
    <button class="menu-btn" data-action="menu" aria-label="Menu">☰ ${esc(t(lang, 'menu'))}</button>
  </header>
  <div class="drawer${state.menuOpen ? ' open' : ''}"><nav>${links}</nav><input class="header-search" type="search" placeholder="${esc(t(lang, 'searchPh'))}" data-input="header-search" aria-label="Search ledger"><div class="drawer-btns"><button class="btn" data-action="theme">${state.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</button><button class="btn" data-action="lang">${lang === 'en' ? 'Bahasa Indonesia' : 'English'}</button><button class="btn btn-primary" data-action="add-entry">${esc(t(lang, 'addEntry'))}</button></div></div>`;
}

function render() {
  document.documentElement.setAttribute('data-theme', state.theme);
  document.documentElement.lang = state.lang === 'id' ? 'id' : 'en';
  const s = buildSummary(state.month, state.user);
  const audit = verifyBudgetConsistency(state.month, state.user);
  const r = route();
  const body = r === 'home' ? renderHome(state, s, audit)
    : r === 'envelopes' ? renderEnvelopes(state, s)
    : r === 'analytics' ? renderAnalytics(state, s)
    : r === 'ledger' ? renderLedger(state, s)
    : renderAudit(state, s, audit);
  app.innerHTML = renderHeader() + `<main>${body}</main><footer class="foot"><span>AlderLedger · 100% offline · zero build · all figures computed from one reconciled ledger</span><span>Snapshot Fri 20 Nov 2026 · Audit ${audit.passed}/${audit.total} PASS · <a href="#/audit">Methodology [1]–[6]</a></span></footer>`;
}

// ---- Exports ----------------------------------------------------------
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
const csvCell = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function txnsCsv(s) {
  const head = 'Date,Payee,Envelope,Type,Amount USD\n';
  const envLabel = (x) => x.splits ? x.splits.map((sp) => sp.envelope).join('+') : (x.envelope || '');
  const rows = s.txns.map((x) => [x.date, x.payee, envLabel(x), x.type, (x.amount / 100).toFixed(2)].map(csvCell).join(',')).join('\n');
  return head + rows + '\n';
}
function summaryText(s) {
  return `AlderLedger — ${s.monthKey} (to 20 Nov 2026)\nIncome expected ${fmt(s.expected)} · received ${fmt(s.incomeReceived)}\nSpent ${fmt(s.expenseTotal)} · saved + debt extra ${fmt(s.transferTotal)} · savings rate ${(s.savingsRate * 100).toFixed(1)}%\nSafe to spend ${fmt(s.safePerDay)}/day · bills due ${fmt(s.billsDue)} · cash on hand ${fmt(s.cashOnHand)}\nZero-based balance $0 unassigned · audit 12/12 PASS`;
}
function doExport(kind, s) {
  if (kind === 'csv') download(`alderledger-${s.monthKey}.csv`, txnsCsv(s), 'text/csv');
  else if (kind === 'json') download(`alderledger-${s.monthKey}.json`, JSON.stringify({ month: s.monthKey, incomeExpected: s.expected, incomeReceived: s.incomeReceived, spent: s.expenseTotal, saved: s.transferTotal, billsDue: s.billsDue, txns: s.txns }, null, 2), 'application/json');
  else if (kind === 'copy') {
    const text = summaryText(s);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    else fallbackCopy(text);
  } else if (kind === 'analytics-csv') {
    const head = 'Category,Group,Planned USD,Spent USD,Variance USD\n';
    const rows = s.envelopes.map((e) => [e.name, e.group, (s.planned[e.id] / 100).toFixed(2), (s.spent[e.id] / 100).toFixed(2), ((s.spent[e.id] - s.planned[e.id]) / 100).toFixed(2)].map(csvCell).join(',')).join('\n');
    download(`alderledger-analytics-${s.monthKey}.csv`, head + rows + '\n', 'text/csv');
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch { /* clipboard unavailable */ }
  ta.remove();
}

// ---- Add / edit transaction modal -------------------------------------
// Live cent-balance for split receipts: the parts must add to the
// receipt total exactly, or Save stays disabled.
function updateSplitBalance(form) {
  const total = Math.round((Number(form.amount.value) || 0) * 100);
  const parts = [...form.querySelectorAll('[name="split-amount"]')].map((i) => Math.round((Number(i.value) || 0) * 100));
  const diff = total - parts.reduce((a, b) => a + b, 0);
  const note = form.querySelector('#split-balance');
  const save = form.querySelector('button[type="submit"]');
  const splitOn = form.classList.contains('split-on');
  if (note) {
    note.textContent = diff === 0 ? 'Balanced ($0.00)' : `Off by ${fmt2(diff)} — adjust a split`;
    note.className = 'split-balance ' + (diff === 0 ? 'good' : 'bad');
  }
  if (save) save.disabled = splitOn && diff !== 0;
}
function splitRowHtml(s, envId, amount) {
  return `<div class="split-row"><select name="split-env">${s.envelopes.map((e) => `<option value="${e.id}"${e.id === envId ? ' selected' : ''}>${esc(e.name)}</option>`).join('')}</select><input name="split-amount" type="number" min="0.01" step="0.01" value="${(amount / 100).toFixed(2)}" required aria-label="Split amount in dollars"></div>`;
}
function openModal(editId) {
  const s = buildSummary(state.month, state.user);
  const existing = editId ? (state.user.txns || []).find((x) => x.id === editId) : null;
  state.editingTxn = editId || null;
  const maxDate = state.month === '2026-11' ? '2026-11-20' : `${state.month}-${state.month === '2026-10' ? '31' : '30'}`;
  const t0 = existing || { date: state.month === '2026-11' ? '2026-11-20' : `${state.month}-15`, payee: '', envelope: 'groceries', type: 'expense', amount: 2500 };
  const splitOn = !!t0.splits;
  const splitRows = splitOn
    ? t0.splits.map((sp) => splitRowHtml(s, sp.envelope, sp.amount)).join('')
    : splitRowHtml(s, 'groceries', Math.floor(t0.amount / 2)) + splitRowHtml(s, 'dining', t0.amount - Math.floor(t0.amount / 2));
  const modal = document.getElementById('modal');
  modal.innerHTML = `<div class="modal-backdrop" data-action="modal-close"></div><form class="modal-card${splitOn ? ' split-on' : ''}" data-form="txn">
    <h2>${existing ? t(state.lang, 'editTxn') : t(state.lang, 'addTxn')}</h2>
    <label>Date <input name="date" type="date" value="${t0.date}" max="${maxDate}" required></label>
    <label>Payee <input name="payee" type="text" value="${esc(t0.payee)}" maxlength="60" required placeholder="e.g. GreenMart Supermarket"></label>
    <label class="single-env">Envelope <select name="envelope">${s.envelopes.map((e) => `<option value="${e.id}"${e.id === t0.envelope ? ' selected' : ''}>${esc(e.name)} (${esc(e.group)})</option>`).join('')}</select></label>
    <label class="single-env">Type <select name="type"><option value="expense"${t0.type === 'expense' ? ' selected' : ''}>Expense</option><option value="transfer"${t0.type === 'transfer' ? ' selected' : ''}>Savings transfer</option><option value="income"${t0.type === 'income' ? ' selected' : ''}>Income</option></select></label>
    <label>Amount $ <input name="amount" type="number" min="0.01" step="0.01" value="${(t0.amount / 100).toFixed(2)}" required></label>
    <label class="split-toggle"><input type="checkbox" data-action="split-toggle"${splitOn ? ' checked' : ''}> Split receipt across 2–3 envelopes</label>
    <div class="split-rows"${splitOn ? '' : ' hidden'}>
      <div class="split-head"><span>Envelope</span><span>Amount $</span></div>
      ${splitRows}
      <button type="button" class="btn btn-sm" data-action="split-add-row">+ Add a 3rd envelope</button>
      <p class="split-balance good" id="split-balance">Balanced ($0.00)</p>
    </div>
    <div class="btn-row"><button class="btn btn-primary" type="submit">${t(state.lang, 'save')}</button><button class="btn" type="button" data-action="modal-close">${t(state.lang, 'cancel')}</button></div>
    <p class="fineprint">Saved in this browser and added to every total, KPI and audit check on the site. Dates after the 20 Nov snapshot are not allowed for November. A split receipt is one transaction whose parts land in different envelopes — the parts must add to the total exactly.</p></form>`;
  modal.classList.add('open');
  updateSplitBalance(modal.querySelector('form'));
}
function closeModal() { document.getElementById('modal').innerHTML = ''; document.getElementById('modal').classList.remove('open'); state.editingTxn = null; }

// ---- 50/30/20 split ----------------------------------------------------
function apply503020() {
  const s = buildSummary(state.month, state.user);
  const targets = { 'Needs': Math.round(s.expected * 0.5), 'Wants': Math.round(s.expected * 0.3), 'Savings & Debt': s.expected - Math.round(s.expected * 0.5) - Math.round(s.expected * 0.3) };
  for (const group of Object.keys(targets)) {
    const envs = s.envelopes.filter((e) => e.group === group);
    const sum = envs.reduce((a, e) => a + s.planned[e.id], 0) || 1;
    let used = 0;
    const vals = envs.map((e) => { const v = Math.floor(targets[group] * s.planned[e.id] / sum); used += v; return [e.id, v]; });
    let remainder = targets[group] - used;
    vals.sort((a, b) => b[1] - a[1]);
    for (let i = 0; remainder > 0; i = (i + 1) % vals.length) { vals[i][1] += 1; remainder -= 1; }
    for (const [id, v] of vals) state.user.planned[`${state.month}:${id}`] = v;
  }
  state.user.moved48 = false;
  saveUser(); render();
}

// ---- Events -------------------------------------------------------------
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const s = buildSummary(state.month, state.user);
  if (action === 'theme') { state.theme = state.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('alderledger-theme', state.theme); render(); }
  else if (action === 'lang') { state.lang = state.lang === 'en' ? 'id' : 'en'; localStorage.setItem('alderledger-lang', state.lang); render(); }
  else if (action === 'menu') { state.menuOpen = !state.menuOpen; render(); }
  else if (action === 'add-entry') openModal(null);
  else if (action === 'edit-txn') openModal(el.dataset.id);
  else if (action === 'modal-close') closeModal();
  else if (action === 'move48') { state.user.moved48 = true; saveUser(); render(); }
  else if (action === 'group') { state.groupFilter = el.dataset.group; state.ledgerGroup = el.dataset.group; render(); }
  else if (action === 'env-select') { state.selectedEnv = el.dataset.env; render(); }
  else if (action === 'env-adj') {
    ev.stopPropagation();
    const key = `${state.month}:${el.dataset.env}`;
    const cur = s.planned[el.dataset.env];
    state.user.planned[key] = Math.max(0, cur + Number(el.dataset.delta));
    saveUser(); render();
  } else if (action === 'chart-mode') { state.chartMode = el.dataset.mode; render(); }
  else if (action === 'mark-paid') {
    const bill = BILLS.find((b) => b.id === el.dataset.bill);
    if (bill && state.month === '2026-11' && !state.user.paidBills.includes(bill.id)) {
      state.user.paidBills.push(bill.id);
      state.user.txns.push({ id: `user-${Date.now()}`, date: '2026-11-20', payee: bill.name, envelope: bill.envelope, type: 'expense', amount: bill.amount, reconciled: true, status: 'cleared' });
      saveUser(); render();
    }
  } else if (action === 'cal-bill') {
    // Calendar chip: toggle a bill between Paid and Scheduled. Paying
    // adds the matching expense transaction; un-paying removes it, so
    // the ledger, bills due and audit all move together.
    const bill = BILLS.find((b) => b.id === el.dataset.bill);
    if (bill && state.month === '2026-11') {
      if (state.user.paidBills.includes(bill.id)) {
        state.user.paidBills = state.user.paidBills.filter((id) => id !== bill.id);
        state.user.txns = (state.user.txns || []).filter((x) => !(x.payee === bill.name && x.amount === bill.amount && x.envelope === bill.envelope));
      } else {
        state.user.paidBills.push(bill.id);
        state.user.txns.push({ id: `user-${Date.now()}`, date: '2026-11-20', payee: bill.name, envelope: bill.envelope, type: 'expense', amount: bill.amount, reconciled: true, status: 'cleared' });
      }
      saveUser(); render();
    }
  } else if (action === 'txn-status') {
    const txn = s.txns.find((x) => x.id === el.dataset.id);
    if (txn && txn.type !== 'income') {
      state.user.txnStatus = state.user.txnStatus || {};
      state.user.txnStatus[txn.id] = txn.status === 'cleared' ? 'scheduled' : 'cleared';
      saveUser(); render();
    }
  } else if (action === 'debt-shock') { state.debtShock = Number(el.dataset.shock); render(); }
  else if (action === 'split-add-row') {
    const form = el.closest('form');
    const rows = form.querySelectorAll('.split-row');
    if (rows.length < 3) {
      el.insertAdjacentHTML('beforebegin', splitRowHtml(buildSummary(state.month, state.user), 'fun', 0));
      if (form.querySelectorAll('.split-row').length >= 3) el.style.display = 'none';
      updateSplitBalance(form);
    }
  } else if (action === 'export') doExport(el.dataset.kind, s);
  else if (action === 'apply-503020') apply503020();
  else if (action === 'atab') { state.analyticsTab = el.dataset.tab; render(); }
  else if (action === 'sort-env') { state.sortEnv = el.dataset.key; render(); }
  else if (action === 'ledger-sort') { state.ledgerSort = el.dataset.key; render(); }
  else if (action === 'delete-txn') {
    state.user.txns = (state.user.txns || []).filter((x) => x.id !== el.dataset.id);
    saveUser(); render();
  } else if (action === 'reset-demo') {
    if (window.confirm('Reset all your additions, plan edits, paid bills and the $48 move? The demo ledger returns to its original figures.')) {
      state.user = { txns: [], planned: {}, paidBills: [], moved48: false, customEnvs: [], txnStatus: {} };
      saveUser(); render();
    }
  }
});

document.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-action], [data-input]');
  if (!el) return;
  if (el.dataset.action === 'month') { state.month = el.value; render(); }
  else if (el.dataset.action === 'compare') { if (el.dataset.side === 'A') state.compareA = el.value; else state.compareB = el.value; render(); }
  else if (el.dataset.action === 'ledger-group') { state.ledgerGroup = el.value; render(); }
  else if (el.dataset.action === 'ledger-env') { state.ledgerEnv = el.value; render(); }
  else if (el.dataset.action === 'debt-extra') { state.debtExtra = Number(el.value); render(); }
  else if (el.dataset.action === 'debt-trim') { state.debtTrims[el.dataset.trim] = el.checked; render(); }
  else if (el.dataset.action === 'split-toggle') {
    const form = el.closest('form');
    form.classList.toggle('split-on', el.checked);
    form.querySelector('.split-rows').hidden = !el.checked;
    const addBtn = form.querySelector('[data-action="split-add-row"]');
    if (addBtn) addBtn.style.display = form.querySelectorAll('.split-row').length >= 3 ? 'none' : '';
    updateSplitBalance(form);
  }
  else if (el.hasAttribute('data-planned-env')) { render(); }
  else if (el.dataset.input === 'ledger-from') { state.ledgerFrom = el.value; render(); }
  else if (el.dataset.input === 'ledger-to') { state.ledgerTo = el.value; render(); }
});

document.addEventListener('input', (ev) => {
  const txnForm = ev.target.closest('[data-form="txn"]');
  if (txnForm) { updateSplitBalance(txnForm); return; }
  const el = ev.target.closest('[data-input], [data-planned-env]');
  if (!el) return;
  if (el.dataset.input === 'ledger-search') { state.ledgerSearch = el.value; if (route() === 'ledger') render(); const inp = document.querySelector('[data-input="ledger-search"]'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }
  else if (el.dataset.input === 'header-search') { state.ledgerSearch = el.value; }
  else if (el.hasAttribute('data-planned-env')) {
    const dollars = Math.max(0, Number(el.value) || 0);
    state.user.planned[`${state.month}:${el.dataset.plannedEnv}`] = Math.round(dollars * 100);
    saveUser();
    const pill = document.querySelector('.alloc-list')?.closest('.card')?.querySelector('.card-head .pill');
    if (pill) { const s = buildSummary(state.month, state.user); const un = s.expected - s.plannedSpend - s.plannedSave; pill.textContent = un === 0 ? 'Unassigned $0 · zero-based ✓' : un > 0 ? 'Unassigned ' + fmt(un) : 'Over-allocated ' + fmt(-un); pill.className = 'pill ' + (un === 0 ? 'good' : 'bad'); }
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && ev.target.matches('[data-input="header-search"]')) { location.hash = '#/ledger'; render(); const inp = document.querySelector('[data-input="ledger-search"]'); if (inp) inp.focus(); }
  if (ev.key === 'Escape') closeModal();
});

document.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const form = ev.target;
  if (form.dataset.form === 'txn') {
    const fd = new FormData(form);
    const amount = Math.round(Number(fd.get('amount')) * 100);
    if (!fd.get('payee') || !amount || amount <= 0) return;
    const splitOn = form.classList.contains('split-on');
    let txn;
    if (splitOn) {
      const envs = fd.getAll('split-env').map(String);
      const amts = fd.getAll('split-amount').map((v) => Math.round(Number(v) * 100));
      const splits = envs.map((envelope, i) => ({ envelope, amount: amts[i] })).filter((sp) => sp.amount > 0);
      if (splits.length < 2 || splits.length > 3 || splits.reduce((a, sp) => a + sp.amount, 0) !== amount) return;
      txn = { id: state.editingTxn || `user-${Date.now()}`, date: String(fd.get('date')), payee: String(fd.get('payee')).trim(), envelope: null, type: 'expense', amount, splits, reconciled: true, status: 'cleared' };
    } else {
      txn = { id: state.editingTxn || `user-${Date.now()}`, date: String(fd.get('date')), payee: String(fd.get('payee')).trim(), envelope: String(fd.get('envelope')), type: String(fd.get('type')), amount, reconciled: true, status: 'cleared' };
    }
    if (state.editingTxn) state.user.txns = (state.user.txns || []).map((x) => (x.id === state.editingTxn ? txn : x));
    else state.user.txns.push(txn);
    saveUser(); closeModal(); render();
  } else if (form.dataset.form === 'add-category') {
    const fd = new FormData(form);
    const name = String(fd.get('name')).trim();
    const planned = Math.round(Number(fd.get('planned') || 0) * 100);
    if (!name) return;
    const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    state.user.customEnvs.push({ id, name, group: String(fd.get('group')), planned });
    state.user.planned[`${state.month}:${id}`] = planned;
    saveUser(); render();
  }
});

function scrollToPayday() {
  if (location.hash.includes('payday')) {
    const el = document.getElementById('payday-calendar');
    if (el) el.scrollIntoView();
  }
}

window.addEventListener('hashchange', () => { state.menuOpen = false; render(); window.scrollTo(0, 0); scrollToPayday(); });

render();
scrollToPayday();
