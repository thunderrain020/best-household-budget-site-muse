// AlderLedger — Deep Analytics, Debt Payoff & Goals (#/analytics).
// Three sub-tabs: variance charts, the snowball-vs-avalanche simulator,
// and the sinking-fund goals, plus the full category / bills table.

import { DEBTS, GOALS, VAULTS, simulateDebt, fmt, pct } from '../data.js';
import { varianceDonut, trendChart, debtCurve } from '../charts.js';
import { t } from '../i18n.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Stackable trims: everyday cuts that redirect straight to the extra
// debt payment. Amounts are cents per month.
const TRIMS = [
  { id: 'dining', label: 'Trim Dining +$90/mo', amount: 9000 },
  { id: 'subs', label: 'Pause Subs +$42/mo', amount: 4200 },
  { id: 'fun', label: 'Trim Fun +$30/mo', amount: 3000 },
];
// Income shocks, as a share of the $7,420 expected income lost.
const SHOCKS = [
  { v: 0, label: '100% Normal' },
  { v: 0.25, label: '−25% Hours' },
  { v: 0.5, label: '−50% Layoff' },
];

export function renderAnalytics(state, s) {
  const lang = state.lang;
  const tab = state.analyticsTab || 'variance';
  const tabs = [['variance', 'Cash-Flow & Variance'], ['debt', 'Debt Snowball vs Avalanche'], ['goals', 'Sinking & Savings Goals']];
  const tabBar = `<div class="subtabs">${tabs.map(([k, label]) => `<button class="pill-btn${tab === k ? ' on' : ''}" data-action="atab" data-tab="${k}">${esc(label)}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'variance') {
    body = `<section class="grid-2">
      <div class="card"><div class="card-head"><h2>Budget vs Actual — where the money went</h2></div>${varianceDonut(s)}
      <p class="fineprint">Hover a slice for planned vs actual. Housing is the largest envelope at ${fmt(s.spent.housing)}; Dining is the only one over plan, by ${fmt(Math.max(0, s.spent.dining - s.planned.dining))}.</p></div>
      <div class="card"><div class="card-head"><h2>12-month cash-flow trend</h2></div>${trendChart()}
      <p class="fineprint">November is partial (to 20 Nov). April’s income spike is the $1,900 tax refund; August’s spending spike is back-to-school; October carries the $310 annual insurance premium.</p></div>
    </section>
    <p class="fineprint feature-line">3 Sinking Vaults · Split Receipts · Snowball / Avalanche payoff curve — new in V2</p>`;
  } else if (tab === 'debt') {
    const slider = state.debtExtra ?? 30000;
    const trimsOn = TRIMS.filter((x) => state.debtTrims && state.debtTrims[x.id]);
    const trimSum = trimsOn.reduce((a, x) => a + x.amount, 0);
    const shock = state.debtShock ?? 0;
    const incomeLoss = Math.round(742000 * shock);
    // An income shock eats the extra payment first: the household keeps
    // the lights on before it pays extra on the cards.
    const extra = Math.max(0, slider + trimSum - incomeLoss);
    const sim = simulateDebt(extra);
    const minSim = simulateDebt(0);
    const save = sim.snowball.interest - sim.avalanche.interest;
    const needs = 434000;
    const shockIncome = 742000 - incomeLoss;
    const shortfall = Math.max(0, needs - shockIncome);
    const shockNote = shock === 0 ? '' : incomeLoss >= slider + trimSum
      ? `Income −${(shock * 100).toFixed(0)}% is ${fmt(incomeLoss)}/mo less — it absorbs the whole ${fmt(slider + trimSum)} extra, so the payoff falls back to minimums (${minSim.snowball.months} months).${shortfall > 0 ? ` It also cuts ${fmt(shortfall)}/mo into essentials; the emergency fund covers that gap for about ${(1822800 / shortfall).toFixed(0)} months.` : ' Essentials are still covered; wants and savings flex first.'}`
      : `Income −${(shock * 100).toFixed(0)}% is ${fmt(incomeLoss)}/mo less, leaving ${fmt(extra)}/mo of extra payment.`;
    body = `<section class="grid-2">
      <div class="card"><div class="card-head"><h2>Extra monthly debt payment: <b>${fmt(extra)}</b></h2></div>
        <label class="slider-row"> $0 <input type="range" min="0" max="80000" step="2500" value="${slider}" data-action="debt-extra" aria-label="Extra monthly debt payment in cents"> $800 <span class="muted">(${(slider / 100).toFixed(0)}/mo on top of ${fmt(32000)} minimums)</span></label>
        <div class="trim-row">${TRIMS.map((x) => `<label class="trim"><input type="checkbox" data-action="debt-trim" data-trim="${x.id}"${state.debtTrims && state.debtTrims[x.id] ? ' checked' : ''}> ${esc(x.label)}</label>`).join('')}</div>
        <div class="shock-row"><span class="muted">Income shock:</span>${SHOCKS.map((x) => `<button class="pill-btn${shock === x.v ? ' on' : ''}" data-action="debt-shock" data-shock="${x.v}">${esc(x.label)}</button>`).join('')}</div>
        <p class="fineprint">Trims add ${fmt(trimSum)}/mo to the extra payment${incomeLoss ? ` · shock takes ${fmt(incomeLoss)}/mo off it` : ''} · effective extra ${fmt(extra)}/mo.</p>
        <div class="debt-cards">
          <div class="debt-card"><h3>Snowball <span class="muted">— smallest balance first</span></h3><p class="debt-big">${sim.snowball.months} months</p><p>Interest ${fmt(sim.snowball.interest)} · order: ${sim.snowballOrder.join(' → ')}</p></div>
          <div class="debt-card"><h3>Avalanche <span class="muted">— highest APR first</span></h3><p class="debt-big">${sim.avalanche.months} months</p><p>Interest ${fmt(sim.avalanche.interest)} · order: ${sim.avalancheOrder.join(' → ')}</p></div>
        </div>
        <p class="fineprint">${extra > 0 ? `Avalanche saves ${fmt(save)} of interest and finishes ${sim.snowball.months - sim.avalanche.months} month${sim.snowball.months - sim.avalanche.months === 1 ? '' : 's'} sooner than snowball at ${fmt(extra)}/mo extra. With no extra payment, either method takes 105 months and ${fmt(774030)} of interest — the extra payment is the whole game.` : 'Move the slider or add a trim: with no extra payment, either method takes 105 months and $7,740 of interest.'}${shockNote ? `<br>${esc(shockNote)}` : ''}</p>
        ${debtCurve(sim.snowball, minSim.snowball)}</div>
      <div class="card"><div class="card-head"><h2>Your debts · ${fmt(DEBTS.reduce((a, d) => a + d.balance, 0))} total</h2></div>
        ${DEBTS.map((d) => `<div class="debt-row"><span><b>${esc(d.name)}</b><br><span class="muted">${(d.apr * 100).toFixed(2)}% APR · min ${fmt(d.min)}/mo</span></span><b>${fmt(d.balance)}</b></div>`).join('')}
        <p class="fineprint">Minimums alone are ${fmt(32000)}/mo. The $300/mo extra in the November plan is the Debt Extra envelope (${fmt(s.spent.debtextra)} moved to 20 Nov).</p></div>
    </section>`;
  } else {
    const vaults = VAULTS.map((v) => {
      const monthsLeft = Math.max(1, (Number(v.due.slice(0, 4)) - 2026) * 12 + Number(v.due.slice(5, 7)) - 11);
      const need = Math.ceil((v.target - v.current) / monthsLeft);
      const behind = need - v.monthly;
      const dueLabel = new Date(v.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `<div class="debt-card vault"><h3>${esc(v.name)}</h3><p class="debt-big">${fmt(v.current)} <span class="muted">of ${fmt(v.target)}</span></p>
        <div class="mini-bar big"><i style="width:${(v.current / v.target * 100).toFixed(1)}%"></i></div>
        <p class="fineprint">Due ${esc(dueLabel)} · needs ${fmt(need)}/mo · funding ${fmt(v.monthly)}/mo · <b class="${behind > 0 ? 'bad' : 'good'}">${behind > 0 ? `Behind ${fmt(behind)}/mo` : 'On track ✓'}</b><br>${esc(v.note)}</p></div>`;
    }).join('');
    body = `<section class="grid-2">
      ${GOALS.map((g) => `<div class="card"><div class="card-head"><h2>${esc(g.name)}</h2><span class="pill">${pct(g.balance / g.target)} funded</span></div>
        <p class="debt-big">${fmt(g.balance)} <span class="muted">of ${fmt(g.target)}</span></p>
        <div class="mini-bar big"><i style="width:${(g.balance / g.target * 100).toFixed(1)}%"></i></div>
        <p class="fineprint">${esc(g.note)}</p></div>`).join('')}
    </section>
    <section class="card"><div class="card-head"><h2>Non-monthly sinking vaults</h2><span class="pill">Sinking transfer ${fmt(26000)}/mo split 3 ways</span></div>
      <div class="debt-cards vaults">${vaults}</div>
      <p class="fineprint">Vaults are the irregular bills the Sinking Funds envelope pre-funds, so a $310 premium or a $2,000 trip never lands as a surprise. Holiday Travel is behind: its $760/mo need is bigger than its $120/mo share — top it up from Fun or move the trip.</p></section>`;
  }
  const catRows = s.envelopes.map((e) => {
    const variance = s.spent[e.id] - s.planned[e.id];
    const rule = e.savings ? 'Save on payday · auto-transfer' : e.id === 'housing' ? 'Fixed · due 1st, autopay' : e.flexible ? 'Flexible · pace-checked weekly' : 'Fixed · due in month, autopay where offered';
    const status = s.spent[e.id] > s.planned[e.id] ? 'Over plan' : s.planned[e.id] && s.spent[e.id] / s.planned[e.id] > 0.9 ? 'Watch — near plan' : 'On track';
    return `<tr><td><span class="dot" style="background:${e.color}"></span>${esc(e.name)}</td><td>${esc(e.group)}</td><td class="num">${fmt(s.planned[e.id])}</td><td class="num">${fmt(s.spent[e.id])}</td><td class="num ${variance > 0 ? 'bad' : 'good'}">${variance > 0 ? '+' : ''}${fmt(variance)}</td><td class="wrap-col">${esc(rule)}</td><td><span class="pill ${variance > 0 ? 'bad' : ''}">${esc(status)}</span></td></tr>`;
  }).join('');
  return `
  <section class="page-head"><h1>${esc(t(lang, 'analyticsTitle'))}</h1><p class="muted">${state.month === '2026-11' ? 'November 2026 · to 20 Nov' : 'Closed month'} · all figures from the same ledger as Overview</p></section>
  ${tabBar}
  ${body}
  <section class="card">
    <div class="card-head"><h2>Category &amp; bills table</h2><button class="btn" data-action="export" data-kind="analytics-csv">Download Analytics CSV</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Category</th><th>Group</th><th>Planned</th><th>Spent</th><th>Variance</th><th>Rule / Cadence &amp; Status</th><th>Status</th></tr></thead><tbody>${catRows}</tbody></table></div>
    <p class="fineprint">The Rule column wraps instead of clipping — every word stays readable at 1280 px and on a phone.</p>
  </section>`;
}
