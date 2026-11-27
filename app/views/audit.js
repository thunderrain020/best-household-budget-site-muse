// AlderLedger — Audit, Recurring Bills Calendar & Guides (#/audit).
// The live 12-check integrity panel (verifyBudgetConsistency), a
// November calendar with every bill's due date marked, the numbered
// methodology, and plain-language budgeting guides.

import { BILLS, INCOME, CUSHION, METHODOLOGY, GUIDES, fmt } from '../data.js';
import { t } from '../i18n.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function renderAudit(state, s, audit) {
  const lang = state.lang;
  const checks = audit.checks.map((c) => `<div class="check-row ${c.passed ? 'pass' : 'fail'}"><span class="check-mark">${c.passed ? '✓ PASS' : '✗ FAIL'}</span><span><b>${c.id}. ${esc(c.name)}</b><br><span class="muted">${esc(c.detail)}</span></span></div>`).join('');
  // November 2026 calendar: 1 Nov 2026 is a Sunday. 30 days. Each cell
  // shows the day, any paycheck that lands, the bills due (click a chip
  // to toggle Paid / Scheduled), and the end-of-day checking balance.
  const firstDow = 0; // Sunday
  const paydays = INCOME['2026-11'].sources.map((x) => ({ day: Number(x.date.slice(8)), label: `${x.name.includes('Maya') ? 'Maya' : x.name.includes('Jordan') ? 'Jordan' : 'Freelance'} +${fmt(x.amount)}` }));
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push('<td class="cal-empty"></td>');
  for (let d = 1; d <= 30; d++) {
    const date = `2026-11-${String(d).padStart(2, '0')}`;
    const bills = s.bills.filter((b) => b.due === date);
    const pays = paydays.filter((p) => p.day === d);
    const isToday = d === 20;
    const proj = d > 20 ? ' cal-proj' : '';
    cells.push(`<td class="${isToday ? 'cal-today' : ''}${proj}"><b>${d}</b><span class="cal-bal">${fmt(CUSHION[d - 1])}</span>${pays.map((p) => `<span class="cal-bill income">${esc(p.label)}</span>`).join('')}${bills.map((b) => `<button class="cal-bill ${b.status}" data-action="cal-bill" data-bill="${b.id}" title="Click to toggle paid / scheduled">${esc(b.name.split(' — ')[0])} ${fmt(b.amount)}${b.status === 'paid' ? ' ✓' : ''}</button>`).join('')}</td>`);
  }
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
  // Paycheck-to-bill funding plan: each November paycheck covers the
  // bills due before the next one lands; the rest goes to envelopes.
  // December rent is funded from the 30 Nov balance + the 2 Dec payday.
  const sources = [...INCOME['2026-11'].sources].sort((a, b) => a.date.localeCompare(b.date));
  const planRows = sources.map((src, i) => {
    const start = src.date;
    const end = i + 1 < sources.length ? sources[i + 1].date : '2026-12-01';
    const covered = s.bills.filter((b) => b.due >= start && b.due < end);
    const sum = covered.reduce((a, b) => a + b.amount, 0);
    return { src, covered, sum, left: src.amount - sum };
  });
  const decRent = 195000;
  const decPayday = INCOME['2026-11'].sources[0].amount;
  const nov30 = CUSHION[29];
  const rentShort = Math.max(0, decRent - nov30);
  const decBuffer = nov30 + decPayday - decRent;
  const methods = METHODOLOGY.map((m) => `<div class="method"><b>[${m.n}] ${esc(m.title)}</b><p>${esc(m.text)}</p></div>`).join('');
  const guides = GUIDES.map((g) => `<div class="card guide"><h3>${esc(g.title)}</h3><p>${esc(g.text)}</p></div>`).join('');
  return `
  <section class="page-head"><h1>${esc(t(lang, 'auditTitle'))}</h1><p class="muted">Recomputed live from the ledger, plan, bills and debts on every load — nothing here is a hard-coded badge.</p></section>
  <section class="grid-2">
    <div class="card"><div class="card-head"><h2>Live data integrity audit</h2><span class="pill ${audit.passed === audit.total ? 'good' : 'bad'}"><b>${audit.passed}/${audit.total} PASS</b></span></div>
      <div class="check-list">${checks}</div>
      <p class="fineprint">Checked by <code>verifyBudgetConsistency()</code> in <code>app/data.js</code>. Mark a bill paid, move $48, or add a transaction anywhere on the site and this panel re-derives itself.</p></div>
    <div class="card" id="payday-calendar"><div class="card-head"><h2>Monthly Payday &amp; Bill Draft Calendar</h2><span class="pill">${fmt(s.billsDue)} still due</span></div>
      <div class="table-wrap"><table class="cal"><thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
      <p class="fineprint">20 Nov is today (outlined). Each day shows the end-of-day checking balance — days 21–30 are projected. Paid bills are teal, due bills are amber, paychecks are indigo. <b>Click a bill chip to toggle Paid / Scheduled</b> — bills due and the audit update live. ${s.bills.filter((b) => b.status === 'paid').length} of ${s.bills.length} bills paid · ${fmt(s.billsPaid)} paid · ${fmt(s.billsDue)} due.</p>
      <div class="bill-list">${s.bills.map((b) => `<div class="bill-row"><span><b>${esc(b.name)}</b><br><span class="muted">Due ${b.due} · ${b.autopay ? 'autopay' : 'manual'}</span></span><span class="bill-amt">${fmt(b.amount)} ${b.status === 'due' ? `<button class="btn btn-sm" data-action="mark-paid" data-bill="${b.id}">${t(lang, 'markPaid')}</button>` : '<span class="good">✓ Paid</span>'}</span></div>`).join('')}</div>
    </div>
  </section>
  <section class="card"><div class="card-head"><h2>Paycheck-to-Bill Funding Plan</h2><span class="pill">Next month’s housing: ${rentShort > 0 ? fmt(rentShort) + ' short until 2 Dec' : 'covered'}</span></div>
    ${planRows.map((r) => `<div class="bill-row"><span><b>${esc(r.src.name)}</b> · ${fmt(r.src.amount)} on ${r.src.date.slice(8)} Nov<br><span class="muted">${r.covered.length ? `Covers ${r.covered.map((b) => `${esc(b.name.split(' — ')[0])} ${fmt(b.amount)}`).join(' · ')}` : 'No bills due before the next payday'}</span></span><span class="bill-amt"><b>${fmt(r.left)}</b> <span class="muted">to envelopes</span></span></div>`).join('')}
    <p class="fineprint">November rent ($1,950, due 1 Nov) was paid from October’s closing balance, before the first November payday. December rent (${fmt(decRent)}, due 1 Dec): the 30 Nov balance (${fmt(nov30)}) covers all but ${fmt(rentShort)} of it; Maya’s 2 Dec payday (${fmt(decPayday)}) closes the gap, leaving a <b>${fmt(decBuffer)} buffer</b> after rent.</p></section>
  <section class="card"><div class="card-head"><h2>Methodology — how the numbers work</h2></div><div class="methods">${methods}</div></section>
  <section class="grid-2">${guides}</section>`;
}
