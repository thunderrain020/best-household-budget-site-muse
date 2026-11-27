// AlderLedger — Interactive Transaction Ledger (#/ledger).
// Real-time search, envelope / group / date filters, sortable columns,
// add / edit / delete (persisted in localStorage), reset, and RFC-4180
// CSV, JSON and summary exports via Blob.

import { fmt } from '../data.js';
import { t } from '../i18n.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function renderLedger(state, s) {
  const lang = state.lang;
  const q = (state.ledgerSearch || '').toLowerCase();
  let rows = [...s.txns];
  if (q) rows = rows.filter((x) => x.payee.toLowerCase().includes(q) || x.date.includes(q) || (x.envelope || '').toLowerCase().includes(q));
  if (state.ledgerGroup && state.ledgerGroup !== 'All') rows = rows.filter((x) => { const e = s.envelopes.find((e) => e.id === x.envelope); return x.type === 'income' ? state.ledgerGroup === 'Income' : e && e.group === state.ledgerGroup; });
  if (state.ledgerEnv) rows = rows.filter((x) => x.envelope === state.ledgerEnv);
  if (state.ledgerFrom) rows = rows.filter((x) => x.date >= state.ledgerFrom);
  if (state.ledgerTo) rows = rows.filter((x) => x.date <= state.ledgerTo);
  const sort = state.ledgerSort || 'date-desc';
  const sorts = {
    'date-desc': (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
    'date-asc': (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    'amount-desc': (a, b) => b.amount - a.amount, 'amount-asc': (a, b) => a.amount - b.amount,
    'payee-asc': (a, b) => a.payee.localeCompare(b.payee),
  };
  rows.sort(sorts[sort] || sorts['date-desc']);
  const th = (label, k) => `<th><button class="th-btn" data-action="ledger-sort" data-key="${k}">${esc(label)} ${sort === k ? '▼' : ''}</button></th>`;
  const body = rows.map((x) => {
    const env = s.envelopes.find((e) => e.id === x.envelope);
    const mine = (state.user.txns || []).some((u) => u.id === x.id);
    return `<tr><td>${x.date}</td><td>${esc(x.payee)}${x.reconciled ? ' <span class="rec" title="Reconciled">✓</span>' : ''}</td><td>${x.type === 'income' ? '<span class="pill pill-save">Income</span>' : env ? `<span class="pill">${esc(env.group)}</span> ${esc(env.name)}` : '—'}</td><td class="num ${x.type === 'income' ? 'good' : ''}">${x.type === 'income' ? '+' : '−'}${fmt(x.amount)}</td>
    <td>${mine ? `<button class="btn btn-sm" data-action="edit-txn" data-id="${x.id}">Edit</button> <button class="btn btn-sm" data-action="delete-txn" data-id="${x.id}">${t(lang, 'delete')}</button>` : '<span class="muted">demo</span>'}</td></tr>`;
  }).join('') || `<tr><td colspan="5" class="muted">No transactions match — clear the search or filters.</td></tr>`;
  const totals = { income: rows.filter((x) => x.type === 'income').reduce((a, x) => a + x.amount, 0), out: rows.filter((x) => x.type !== 'income').reduce((a, x) => a + x.amount, 0) };
  return `
  <section class="page-head"><h1>${esc(t(lang, 'ledgerTitle'))}</h1><p class="muted">${rows.length} of ${s.txns.length} transactions · ${s.monthKey} · income ${fmt(totals.income)} · out ${fmt(totals.out)}</p></section>
  <section class="card">
    <div class="ledger-tools">
      <input type="search" placeholder="${esc(t(lang, 'searchPh'))}" value="${esc(state.ledgerSearch || '')}" data-input="ledger-search" aria-label="Search ledger">
      <select data-action="ledger-group" aria-label="Group filter"><option value="All">All groups</option>${['Needs', 'Wants', 'Savings & Debt', 'Income'].map((g) => `<option${state.ledgerGroup === g ? ' selected' : ''}>${g}</option>`).join('')}</select>
      <select data-action="ledger-env" aria-label="Envelope filter"><option value="">All envelopes</option>${s.envelopes.map((e) => `<option value="${e.id}"${state.ledgerEnv === e.id ? ' selected' : ''}>${esc(e.name)}</option>`).join('')}</select>
      <input type="date" value="${state.ledgerFrom || ''}" data-input="ledger-from" aria-label="From date">
      <input type="date" value="${state.ledgerTo || ''}" data-input="ledger-to" aria-label="To date">
    </div>
    <div class="btn-row"><button class="btn btn-primary" data-action="add-entry">${t(lang, 'addEntry')}</button>
      <button class="btn" data-action="export" data-kind="csv">${t(lang, 'downloadCsv')}</button>
      <button class="btn" data-action="export" data-kind="json">${t(lang, 'downloadJson')}</button>
      <button class="btn" data-action="export" data-kind="copy">${t(lang, 'copySummary')}</button>
      <button class="btn btn-danger" data-action="reset-demo">${t(lang, 'resetDemo')}</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr>${th('Date', 'date-desc')}${th('Payee', 'payee-asc')}<th>Envelope</th>${th('Amount', 'amount-desc')}<th></th></tr></thead><tbody>${body}</tbody></table></div>
    <p class="fineprint">Demo rows are the generated ledger; rows you add are editable and deletable, saved in this browser, and included in every total on the site. Reset Demo Data clears only your additions and plan edits.</p>
  </section>`;
}
