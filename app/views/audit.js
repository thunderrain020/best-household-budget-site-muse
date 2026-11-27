// AlderLedger — Audit, Recurring Bills Calendar & Guides (#/audit).
// The live 12-check integrity panel (verifyBudgetConsistency), a
// November calendar with every bill's due date marked, the numbered
// methodology, and plain-language budgeting guides.

import { BILLS, METHODOLOGY, GUIDES, fmt } from '../data.js';
import { t } from '../i18n.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function renderAudit(state, s, audit) {
  const lang = state.lang;
  const checks = audit.checks.map((c) => `<div class="check-row ${c.passed ? 'pass' : 'fail'}"><span class="check-mark">${c.passed ? '✓ PASS' : '✗ FAIL'}</span><span><b>${c.id}. ${esc(c.name)}</b><br><span class="muted">${esc(c.detail)}</span></span></div>`).join('');
  // November 2026 calendar: 1 Nov 2026 is a Sunday. 30 days.
  const firstDow = 0; // Sunday
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push('<td class="cal-empty"></td>');
  for (let d = 1; d <= 30; d++) {
    const date = `2026-11-${String(d).padStart(2, '0')}`;
    const bills = s.bills.filter((b) => b.due === date);
    const isToday = d === 20;
    cells.push(`<td class="${isToday ? 'cal-today' : ''}"><b>${d}</b>${bills.map((b) => `<span class="cal-bill ${b.status}">${esc(b.name.split(' — ')[0])} ${fmt(b.amount)}</span>`).join('')}${d === 28 ? '<span class="cal-bill income">Freelance +$700</span>' : ''}</td>`);
  }
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
  const methods = METHODOLOGY.map((m) => `<div class="method"><b>[${m.n}] ${esc(m.title)}</b><p>${esc(m.text)}</p></div>`).join('');
  const guides = GUIDES.map((g) => `<div class="card guide"><h3>${esc(g.title)}</h3><p>${esc(g.text)}</p></div>`).join('');
  return `
  <section class="page-head"><h1>${esc(t(lang, 'auditTitle'))}</h1><p class="muted">Recomputed live from the ledger, plan, bills and debts on every load — nothing here is a hard-coded badge.</p></section>
  <section class="grid-2">
    <div class="card"><div class="card-head"><h2>Live data integrity audit</h2><span class="pill ${audit.passed === audit.total ? 'good' : 'bad'}"><b>${audit.passed}/${audit.total} PASS</b></span></div>
      <div class="check-list">${checks}</div>
      <p class="fineprint">Checked by <code>verifyBudgetConsistency()</code> in <code>app/data.js</code>. Mark a bill paid, move $48, or add a transaction anywhere on the site and this panel re-derives itself.</p></div>
    <div class="card"><div class="card-head"><h2>Recurring bills — November 2026</h2><span class="pill">${fmt(s.billsDue)} still due</span></div>
      <div class="table-wrap"><table class="cal"><thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
      <p class="fineprint">20 Nov is today (outlined). Paid bills are teal, due bills are amber, the 28 Nov freelance invoice is indigo. ${s.bills.filter((b) => b.status === 'paid').length} of ${s.bills.length} bills paid · ${fmt(s.billsPaid)} paid · ${fmt(s.billsDue)} due.</p>
      <div class="bill-list">${s.bills.map((b) => `<div class="bill-row"><span><b>${esc(b.name)}</b><br><span class="muted">Due ${b.due} · ${b.autopay ? 'autopay' : 'manual'}</span></span><span class="bill-amt">${fmt(b.amount)} ${b.status === 'due' ? `<button class="btn btn-sm" data-action="mark-paid" data-bill="${b.id}">${t(lang, 'markPaid')}</button>` : '<span class="good">✓ Paid</span>'}</span></div>`).join('')}</div>
    </div>
  </section>
  <section class="card"><div class="card-head"><h2>Methodology — how the numbers work</h2></div><div class="methods">${methods}</div></section>
  <section class="grid-2">${guides}</section>`;
}
