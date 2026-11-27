// AlderLedger — Overview (#/). Eight headline KPIs, the live action
// strip, the cash-flow allocation strip with envelope pace bars, the
// cushion / 6-month chart switcher, upcoming bills and latest spending.
// Every number comes from buildSummary() for the selected month.

import { ENVELOPES, HISTORY, SNAPSHOT, GOALS, fmt, fmt2, pct, envById } from '../data.js';
import { sparkline, allocationStrip, cushionChart, sixMonthChart } from '../charts.js';
import { t } from '../i18n.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const SIX = HISTORY.slice(6); // Jun–Nov 2026

function kpi(label, value, sub, spark, delta, deltaCls) {
  return `<article class="kpi"><div class="kpi-top"><span class="kpi-label">${esc(label)}</span>${delta ? `<span class="pill ${deltaCls || ''}">${esc(delta)}</span>` : ''}</div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub}</div>${spark ? `<div class="kpi-spark">${spark}</div>` : ''}</article>`;
}

export function renderHome(state, s, audit) {
  const lang = state.lang;
  const dining = s.spent.dining - s.planned.dining;
  const moved = state.month === '2026-11' && state.user.moved48;
  const over = dining > 0 && !moved;
  const action = over
    ? `<span class="action-dot"></span><b>${t(lang, 'actionNeeded')}:</b>&nbsp;Dining &amp; Takeout is ${fmt(dining)} over plan · <button class="btn btn-sm" data-action="move48">${t(lang, 'moveBtn')}</button>`
    : `<span class="action-ok">✓</span><b>${t(lang, 'actionNeeded')}:</b>&nbsp;${moved ? esc(t(lang, 'moved')) : 'Every envelope is inside its plan to 20 Nov.'}`;
  const pace = SNAPSHOT.day / SNAPSHOT.daysInMonth;
  const spendEnvs = s.envelopes.filter((e) => !e.savings);
  // The overview shows the six biggest envelopes; the full sixteen live
  // on the Envelopes page, with the same −/+ controls.
  const shown = (state.groupFilter === 'All' ? spendEnvs : spendEnvs.filter((e) => e.group === state.groupFilter)).sort((a, b) => s.spent[b.id] - s.spent[a.id]).slice(0, 6);
  const highest = [...spendEnvs].sort((a, b) => s.spent[b.id] - s.spent[a.id])[0];
  const bestCushion = [...spendEnvs].sort((a, b) => (s.planned[b.id] - s.spent[b.id]) - (s.planned[a.id] - s.spent[a.id]))[0];
  const bars = shown.map((e) => {
    const ratio = s.planned[e.id] ? s.spent[e.id] / s.planned[e.id] : 0;
    const overCls = ratio > 1 ? 'over' : ratio > 0.9 ? 'warm' : '';
    const sel = state.selectedEnv === e.id ? ' sel' : '';
    return `<div class="pace-row${sel}" data-action="env-select" data-env="${e.id}" role="button" tabindex="0">
      <span class="pace-name" style="--dot:${e.color}">${esc(e.name)}</span>
      <span class="pace-bar"><i class="${overCls}" style="width:${Math.min(ratio * 100, 100).toFixed(1)}%"></i><em style="left:${(pace * 100).toFixed(1)}%" title="Day 20 of 30"></em></span>
      <span class="pace-nums">${fmt(s.spent[e.id])} <span class="muted">/ ${fmt(s.planned[e.id])}</span></span>
      <span class="pace-adj"><button data-action="env-adj" data-env="${e.id}" data-delta="-2500" aria-label="Decrease ${esc(e.name)} plan by $25">−</button><button data-action="env-adj" data-env="${e.id}" data-delta="2500" aria-label="Increase ${esc(e.name)} plan by $25">+</button></span>
    </div>`;
  }).join('');
  const sel = envById(state.selectedEnv);
  const selDetail = sel ? `<div class="pace-detail"><b>${esc(sel.name)}</b> · ${esc(sel.group)} · spent ${fmt(s.spent[sel.id])} of ${fmt(s.planned[sel.id])} planned (${pct(s.planned[sel.id] ? s.spent[sel.id] / s.planned[sel.id] : 0)} of plan) · ${s.spent[sel.id] > s.planned[sel.id] ? `<span class="bad">over by ${fmt(s.spent[sel.id] - s.planned[sel.id])}</span>` : `<span class="good">${fmt(s.planned[sel.id] - s.spent[sel.id])} left</span>`}</div>` : '';
  const billsDue = s.bills.filter((b) => b.status === 'due');
  const billsHtml = billsDue.map((b) => `<div class="bill-row"><span><b>${esc(b.name)}</b> <span class="muted">· due ${b.due.slice(8)} Nov · ${esc(envById(b.envelope).name)}</span></span><span class="bill-amt">${fmt(b.amount)} <button class="btn btn-sm" data-action="mark-paid" data-bill="${b.id}">${t(lang, 'markPaid')}</button></span></div>`).join('')
    || `<div class="bill-row"><span><b>All November bills are paid.</b></span><span class="good">✓</span></div>`;
  const latest = s.txns.filter((x) => x.type === 'expense').slice(-5).reverse().map((x) => `<div class="bill-row"><span><b>${esc(x.payee)}</b><br><span class="muted">${x.date} · ${esc((s.envelopes.find((e) => e.id === x.envelope) || {}).name || '')}</span></span><span class="bill-amt">${fmt(x.amount)}</span></div>`).join('');
  const closed = state.month !== '2026-11';
  const safeVal = closed ? '—' : fmt(s.safePerDay);
  const safeSub = closed ? `${t(lang, 'monthClosed')} · saved ${fmt(s.transferTotal)}` : `${fmt(s.flexibleRemaining)} flexible left ÷ ${SNAPSHOT.daysLeft} days`;
  return `
  <section class="action-strip"><div class="action-text">${action}</div>
    <a class="audit-pill" href="#/audit" title="${esc(t(lang, 'auditOpen'))}"><b>${audit.passed}/${audit.total}</b> ${esc(t(lang, 'auditPass'))} ✓</a>
  </section>
  <section class="kpi-grid">
    ${kpi(t(lang, 'kpiIncome'), fmt(s.expected), `${fmt(s.incomeReceived)} received · 3 sources`, sparkline(SIX.map((r) => r.income), '#0F766E'), '+0.5% MoM', 'good')}
    ${kpi(t(lang, 'kpiSpent'), fmt(s.expenseTotal), `${pct(s.incomeReceived ? s.expenseTotal / s.incomeReceived : 0)} of income received · to 20 Nov`, sparkline(SIX.map((r) => r.spent), '#BE123C'), '−17.2% vs Oct *', '')}
    ${kpi(t(lang, 'kpiSafe'), safeVal, safeSub, sparkline([500, 470, 7090], '#B45309'), closed ? '' : '10 days left', '')}
    ${kpi(t(lang, 'kpiSaved'), fmt(s.transferTotal), `${pct(s.savingsRate)} of income received · incl. ${fmt(s.spent.debtextra)} debt extra`, sparkline(SIX.map((r) => r.saved), '#4338CA'), '−26.1% vs Oct *', '')}
    ${kpi(t(lang, 'kpiRate'), pct(s.savingsRate), 'vs 20% target · Oct was 25.3%', sparkline(SIX.map((r) => r.saved / r.income), '#0F766E'), '−4.8 pts', '')}
    ${kpi(t(lang, 'kpiBills'), fmt(s.billsDue), `${billsDue.length} bills before 30 Nov · next: Internet ${fmt(8500)} · 25 Nov`, '', s.billsDue ? '' : '✓ all paid', 'good')}
    ${kpi(t(lang, 'kpiRunway'), s.runwayMonths.toFixed(1) + ' mos', `${fmt(GOALS[0].balance)} fund ÷ ${fmt(434000)}/mo essentials`, `<div class="mini-bar"><i style="width:70%"></i></div>`, '70% of target', '')}
    ${kpi(t(lang, 'kpiZero'), '$0 <span class="kpi-small">unassigned</span>', `Plan ${fmt(s.expected)} = ${fmt(s.plannedSpend)} spend + ${fmt(s.plannedSave)} save · Reconciled ✓`, '', '', 'good')}
  </section>
  <p class="fineprint">* November is open — ${esc(t(lang, 'snapshot'))}.</p>
  <section class="grid-2">
    <div class="card">
      <div class="card-head"><h2>${esc(t(lang, 'cashflow'))}</h2>
        <div class="pills">${['All', 'Needs', 'Wants', 'Savings & Debt'].map((g) => `<button class="pill-btn${state.groupFilter === g ? ' on' : ''}" data-action="group" data-group="${g}">${esc(t(lang, g === 'All' ? 'all' : g === 'Needs' ? 'needs' : g === 'Wants' ? 'wants' : 'savings'))}</button>`).join('')}</div>
      </div>
      ${allocationStrip(s)}
      <div class="chips"><span class="chip">${esc(t(lang, 'highestSpend'))}: <b>${esc(highest.name)} ${fmt(s.spent[highest.id])}</b></span><span class="chip">${esc(t(lang, 'bestCushion'))}: <b>${esc(bestCushion.name)} ${fmt(s.planned[bestCushion.id] - s.spent[bestCushion.id])} left</b></span></div>
      <div class="pace-list">${bars}</div>
      ${selDetail}
      <p class="fineprint">− / + moves the plan $25 · tick = day 20 of 30 · <a href="#/envelopes">All 16 envelopes →</a></p>
    </div>
    <div class="card">
      <div class="card-head"><h2>${esc(t(lang, 'trend'))}</h2>
        <div class="pills"><button class="pill-btn${state.chartMode === 'cushion' ? ' on' : ''}" data-action="chart-mode" data-mode="cushion">Cushion</button><button class="pill-btn${state.chartMode === 'sixmonth' ? ' on' : ''}" data-action="chart-mode" data-mode="sixmonth">6-Month</button></div>
      </div>
      ${state.chartMode === 'cushion' ? cushionChart() : sixMonthChart()}
      <div class="btn-row"><button class="btn btn-sm" data-action="export" data-kind="csv">${t(lang, 'csvBtn')}</button><button class="btn btn-sm" data-action="export" data-kind="json">${t(lang, 'jsonBtn')}</button><button class="btn btn-sm" data-action="export" data-kind="copy">${t(lang, 'copySummary')}</button><a class="btn btn-sm" href="#/ledger">${t(lang, 'openLedger')}</a></div>
      <h3>${esc(t(lang, 'upcoming'))} · ${fmt(s.billsDue)} due</h3>
      ${billsHtml}
    </div>
  </section>
  <section class="card">
    <div class="card-head"><h2>${esc(t(lang, 'latest'))}</h2><a href="#/ledger">Full ledger →</a></div>
    <div class="latest-strip">${latest}</div>
  </section>`;
}
