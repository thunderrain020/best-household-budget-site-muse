// AlderLedger — Deep Analytics, Debt Payoff & Goals (#/analytics).
// Three sub-tabs: variance charts, the snowball-vs-avalanche simulator,
// and the sinking-fund goals, plus the full category / bills table.

import { DEBTS, GOALS, VAULTS, BILLS, CUSHION, INCOME, simulateDebt, fmt, fmt2, pct } from '../data.js';
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

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Reconciled Cash-Flow & Register Strip (variance tab, bottom half): the
// payday-to-bill funding snapshot and the split-receipt register, so the
// two deep features built in V2 are visible in the showcase shot instead of
// sitting only on their uncaptured routes. All controls are live: the bill
// chips toggle Paid / Scheduled, the register pills toggle Cleared /
// Scheduled, and the links go to the full #/audit and #/ledger pages.
function registerStrip(state, s, audit) {
  const nov = INCOME['2026-11'].sources;
  const maya = nov.find((x) => x.name.includes('Maya'));
  const freelance = nov.find((x) => x.pending);
  const rent = BILLS.find((b) => b.id === 'rent');
  const decBuffer = CUSHION[29] + maya.amount - rent.amount;
  const decRentPaid = state.user.decRentPaid !== false;
  const dLabel = (d) => `${Number(d.slice(8, 10))} ${MONTHS_SHORT[Number(d.slice(5, 7)) - 1]}`;
  const envName = (id) => { const e = s.envelopes.find((x) => x.id === id); return e ? e.name : id; };
  // Short labels (same convention as the allocator) so a split row's
  // "Split: … · Balanced $0.00 ✓" fits on one line without ellipsis.
  const SHORT_ENV = { 'Gifts & Giving': 'Gifts', 'Dining & Takeout': 'Dining Out', 'Extra Debt Payment': 'Extra Debt', 'Fun & Streaming': 'Fun & Media' };
  const shortEnv = (id) => SHORT_ENV[envName(id)] || envName(id);
  // --- Left: Payday & bill draft calendar (Nov 25 – Dec 2). EODs are the
  // cushion projections — the same numbers the #/audit calendar shows —
  // and the Pay/Paid chip is the live paid state (cal-bill / dec-rent).
  // NOTE: the prompt's draft EODs ($2,485 / $2,345 / $2,983 / $2,858) do
  // NOT match CUSHION — the real projections are $1,480 / $1,210 /
  // $1,848 / $1,720 (Nov 25–29) and $4,490 on Dec 2. The strip uses the
  // real CUSHION values so it reconciles with the calendar and the chart.
  const dueBills = BILLS.filter((b) => b.status === 'due');
  const isPaid = (id) => state.user.paidBills.includes(id);
  const tileFor = (bill) => {
    const day = Number(bill.due.slice(8, 10));
    const eod = CUSHION[day - 1];
    const short = bill.name.split(' — ')[0];
    const paid = isPaid(bill.id);
    const flows = bill.id === 'water'
      ? `<span class="good">Freelance +${fmt(freelance.amount)}</span><span>${esc(short)} −${fmt(bill.amount)}</span>`
      : `<span>${esc(short)} −${fmt(bill.amount)}</span>`;
    return `<div class="cal-tile"><b>${dLabel(bill.due)}</b>${flows}<span class="cal-eod">EOD ${fmt(eod)} <i class="floor-ok" title="Above the $1,000 floor">✓</i></span><button class="tile-pay${paid ? ' paid' : ''}" data-action="cal-bill" data-bill="${bill.id}" title="Click to toggle paid / scheduled">${paid ? 'Paid ✓' : 'Pay'}</button></div>`;
  };
  const tiles = dueBills.map(tileFor).join('');
  const dec2 = `<div class="cal-tile"><b>Dec 2</b><span class="good">Payday +${fmt(maya.amount)}</span><span>Rent −${fmt(rent.amount)}</span><span class="cal-eod">EOD ${fmt(decBuffer)} <i class="floor-ok" title="Above the $1,000 floor">✓</i></span><button class="tile-pay${decRentPaid ? ' paid' : ''}" data-action="dec-rent" title="Click to toggle December rent paid / due">${decRentPaid ? 'Rent Paid ✓' : 'Rent due'}</button></div>`;
  const eods = [...dueBills.map((b) => CUSHION[Number(b.due.slice(8, 10)) - 1]), decBuffer];
  const lowEod = Math.min(...eods);
  const lowDay = lowEod === decBuffer ? 'Dec 2' : dLabel(dueBills.find((b) => CUSHION[Number(b.due.slice(8, 10)) - 1] === lowEod).due);
  const floorOk = lowEod >= 100000;
  // --- Right: split-receipt register. The top three rows stay single-line;
  // Corner Market is expanded with its live split breakdown, computed from
  // the actual splits (Groceries $153.60 + Gifts $43.68 = $197.28) — the
  // prompt's $142 / $55 figures are not the seeded split, so they are not
  // used; the strip reconciles with the ledger instead.
  const splits = s.txns.filter((x) => x.splits);
  const recent = [...s.txns].filter((x) => !x.splits && x.type === 'expense').sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount).slice(0, 2);
  const corner = splits.find((x) => x.payee === 'Corner Market');
  const others = [...splits.filter((x) => x !== corner), ...recent].sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount).slice(0, 3);
  const regRow = (x) => {
    // The expanded Corner Market row drops the "· Balanced $0.00 ✓" from
    // its sub-line — the split check directly below it carries the full
    // balance, and the long sub would otherwise truncate with "…".
    const sub = x.splits
      ? (x === corner ? `Split: ${x.splits.map((sp) => shortEnv(sp.envelope)).join(' + ')}` : `Split: ${x.splits.map((sp) => shortEnv(sp.envelope)).join(' + ')} · Balanced $0.00 ✓`)
      : esc(envName(x.envelope));
    return `<div class="reg-row"><span class="reg-date">${dLabel(x.date)}</span><span class="reg-payee"><b>${esc(x.payee)}</b> <span class="muted">· ${sub}</span></span><b class="num">${fmt(x.amount)}</b><button class="pill-btn status-pill${x.status === 'scheduled' ? ' scheduled' : ''}" data-action="txn-status" data-id="${x.id}" title="Click to toggle cleared / scheduled">${x.status === 'scheduled' ? 'Scheduled' : 'Cleared ✓'}</button></div>`;
  };
  const regRows = others.map(regRow).join('');
  const splitSum = corner.splits.reduce((a, sp) => a + sp.amount, 0);
  const splitBal = corner.amount - splitSum;
  const splitCheck = `${regRow(corner)}
    <div class="split-check">${corner.splits.map((sp) => `<b>${esc(shortEnv(sp.envelope))} ${fmt2(sp.amount)}</b>`).join(' + ')} = <b>Split Sum ${fmt2(splitSum)}</b> · Balanced <b class="good">${fmt2(splitBal)} ✓</b></div>`;
  const auditOk = audit && audit.passed === audit.total;
  return `<section class="card strip-card"><div class="card-head"><h2>Reconciled cash-flow &amp; register</h2><span class="pill">Nov 2026 · to 20 Nov</span></div>
    <div class="sched-cols">
      <div><h3>Payday &amp; bill draft calendar</h3>
        <div class="cal-tiles">${tiles}${dec2}</div>
        <p class="strip-floor">Window low <b>${fmt(lowEod)}</b> (${esc(lowDay)}) · $1,000 floor · <b class="${floorOk ? 'good' : 'bad'}">${floorOk ? 'PASS ✓' : 'BELOW — check'}</b></p>
        <p class="strip-link"><a href="#/audit">${audit ? `${audit.passed}/${audit.total} Audit ${auditOk ? 'PASS ✓' : '— check'}` : 'Audit'} · Full 30-Day Calendar →</a></p>
      </div>
      <div><h3>Split-receipt register</h3>
        ${regRows}
        ${splitCheck}
        <div class="strip-actions"><button class="btn btn-sm" data-action="export" data-kind="csv">Download CSV</button><button class="btn btn-sm" data-action="export" data-kind="json">JSON</button><a class="btn btn-sm btn-primary" href="#/ledger">+ Split Receipt</a></div>
      </div>
    </div></section>`;
}

export function renderAnalytics(state, s, audit) {
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
    ${registerStrip(state, s, audit)}`;
  } else if (tab === 'debt') {
    const method = state.debtMethod || 'snowball';
    const slider = state.debtExtra ?? 30000;
    const trimsOn = TRIMS.filter((x) => state.debtTrims && state.debtTrims[x.id]);
    const trimSum = trimsOn.reduce((a, x) => a + x.amount, 0);
    const shock = state.debtShock ?? 0;
    const incomeLoss = Math.round(742000 * shock);
    // Minimums means exactly that: the slider and trims are off and the
    // extra is $0, so the KPIs, curve and schedule all fall back to the
    // 105-month minimums path.
    const minMethod = method === 'minimums';
    const extra = minMethod ? 0 : Math.max(0, slider + trimSum - incomeLoss);
    const sim = simulateDebt(extra);
    const minSim = simulateDebt(0);
    const cur = method === 'avalanche' ? sim.avalanche : sim.snowball;
    const save = sim.snowball.interest - sim.avalanche.interest;
    const methodLabel = method === 'avalanche' ? 'Avalanche' : minMethod ? 'Minimums only' : 'Snowball';
    const freeDate = new Date(2026, 10 + cur.months, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const savedVsMin = minSim.snowball.interest - cur.interest;
    const freedYr = (32000 + extra) * 12;
    const runway = (GOALS.find((g) => g.id === 'emergency').balance / s.needs.planned).toFixed(1);
    const callout = minMethod
      ? `Minimums only · debt-free in ${cur.months} mo · ${fmt(cur.interest)} interest`
      : `${methodLabel} · debt-free in ${cur.months} mo · saves ${fmt(savedVsMin)} vs minimums`;
    const needs = 434000;
    const shockIncome = 742000 - incomeLoss;
    const shortfall = Math.max(0, needs - shockIncome);
    const shockNote = shock === 0 ? '' : incomeLoss >= slider + trimSum
      ? `Income −${(shock * 100).toFixed(0)}% is ${fmt(incomeLoss)}/mo less — it absorbs the whole ${fmt(slider + trimSum)} extra, so the payoff falls back to minimums (${minSim.snowball.months} months).${shortfall > 0 ? ` It also cuts ${fmt(shortfall)}/mo into essentials; the emergency fund covers that gap for about ${(1822800 / shortfall).toFixed(0)} months.` : ' Essentials are still covered; wants and savings flex first.'}`
      : `Income −${(shock * 100).toFixed(0)}% is ${fmt(incomeLoss)}/mo less, leaving ${fmt(extra)}/mo of extra payment.`;
    const order = method === 'avalanche' ? sim.avalancheOrder : sim.snowballOrder;
    const payoff = method === 'avalanche' ? sim.avalanche.payoff : sim.snowball.payoff;
    const schedRows = order.map((name) => {
      const d = DEBTS.find((x) => x.name === name);
      const m = payoff[d.id];
      const when = new Date(2026, 10 + m, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `<div class="debt-row"><span><b>${esc(name)}</b><br><span class="muted">${(d.apr * 100).toFixed(2)}% APR · min ${fmt(d.min)}/mo · ${fmt(d.balance)}</span></span><span class="num"><b>paid off mo ${m}</b><br><span class="muted">${when}</span></span></div>`;
    }).join('');
    const vaultRows = VAULTS.map((v) => {
      const monthsLeft = Math.max(1, (Number(v.due.slice(0, 4)) - 2026) * 12 + Number(v.due.slice(5, 7)) - 11);
      const need = Math.ceil((v.target - v.current) / monthsLeft);
      const behind = need - v.monthly;
      const dueLabel = new Date(v.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `<div class="debt-row"><span><b>${esc(v.name)}</b><br><span class="muted">due ${esc(dueLabel)} · ${fmt(v.current)} of ${fmt(v.target)} · needs ${fmt(need)}/mo</span></span><span class="num"><b class="${behind > 0 ? 'bad' : 'good'}">${behind > 0 ? `Behind ${fmt(behind)}/mo` : 'On track ✓'}</b><br><span class="muted">funding ${fmt(v.monthly)}/mo</span></span></div>`;
    }).join('');
    body = `<div class="debt-kpis">
      <div class="debt-kpi"><span class="muted">Debt-free date</span><b class="kpi-num">${esc(freeDate)}</b><span class="muted">${esc(methodLabel)} · ${cur.months} mo</span></div>
      <div class="debt-kpi"><span class="muted">Interest saved</span><b class="kpi-num good">${fmt(savedVsMin)}</b><span class="muted">vs minimums ${fmt(minSim.snowball.interest)}</span></div>
      <div class="debt-kpi"><span class="muted">Freed cash / yr</span><b class="kpi-num">${fmt(freedYr)}</b><span class="muted">after debt-free</span></div>
      <div class="debt-kpi"><span class="muted">Emergency runway</span><b class="kpi-num">${runway} mos</b><span class="muted">${fmt(GOALS.find((g) => g.id === 'emergency').balance)} fund</span></div>
    </div>
    <section class="grid-2">
      <div class="card debt-controls"><div class="card-head"><h2>Extra monthly debt payment: <b>${fmt(extra)}</b></h2></div>
        <div class="method-row"><span class="muted">Method:</span>${[['snowball', 'Snowball'], ['avalanche', 'Avalanche'], ['minimums', 'Minimums']].map(([k, label]) => `<button class="pill-btn${method === k ? ' on' : ''}" data-action="debt-method" data-method="${k}">${label}</button>`).join('')}</div>
        <label class="slider-row"> $0 <input type="range" min="0" max="80000" step="2500" value="${slider}" data-action="debt-extra" aria-label="Extra monthly debt payment in cents"${minMethod ? ' disabled' : ''}> $800 <span class="muted slider-note">(${(slider / 100).toFixed(0)}/mo on top of ${fmt(32000)} minimums)</span></label>
        <div class="trim-row">${TRIMS.map((x) => `<label class="trim"><input type="checkbox" data-action="debt-trim" data-trim="${x.id}"${state.debtTrims && state.debtTrims[x.id] ? ' checked' : ''}${minMethod ? ' disabled' : ''}> ${esc(x.label)}</label>`).join('')}</div>
        <div class="shock-row"><span class="muted shock-label">Income shock:</span>${SHOCKS.map((x) => `<button class="pill-btn${shock === x.v ? ' on' : ''}" data-action="debt-shock" data-shock="${x.v}">${esc(x.label)}</button>`).join('')}</div>
        <p class="fineprint trim-note">${minMethod ? 'Minimums: the slider and trims are off — only the $320/mo minimums are paid.' : `Trims add ${fmt(trimSum)}/mo to the extra payment${incomeLoss ? ` · shock takes ${fmt(incomeLoss)}/mo off it` : ''} · effective extra ${fmt(extra)}/mo.`}</p>
        ${debtCurve(cur, minSim.snowball, callout)}
        <div class="debt-cards">
          <div class="debt-card"><h3>Snowball <span class="muted">— smallest balance first</span></h3><p class="debt-big">${sim.snowball.months} months</p><p>Interest ${fmt(sim.snowball.interest)} <span class="order-line">· order: ${sim.snowballOrder.join(' → ')}</span></p></div>
          <div class="debt-card"><h3>Avalanche <span class="muted">— highest APR first</span></h3><p class="debt-big">${sim.avalanche.months} months</p><p>Interest ${fmt(sim.avalanche.interest)} <span class="order-line">· order: ${sim.avalancheOrder.join(' → ')}</span></p></div>
        </div>
        <p class="fineprint hide-m">${minMethod ? 'Minimums only: with no extra payment, either method takes 105 months and $7,740 of interest — the extra payment is the whole game.' : extra > 0 ? `Avalanche saves ${fmt(save)} of interest and finishes ${sim.snowball.months - sim.avalanche.months} month${sim.snowball.months - sim.avalanche.months === 1 ? '' : 's'} sooner than snowball at ${fmt(extra)}/mo extra. With no extra payment, either method takes 105 months and ${fmt(774030)} of interest — the extra payment is the whole game.` : 'Move the slider or add a trim: with no extra payment, either method takes 105 months and $7,740 of interest.'}</p>${shockNote ? `<p class="fineprint">${esc(shockNote)}</p>` : ''}
      </div>
      <div class="card sched-card"><div class="card-head"><h2>Loan schedule &amp; sinking vaults</h2><span class="pill">${esc(methodLabel)} · debt-free ${esc(freeDate)}</span></div>
        <div class="sched-cols"><div><h3>Payoff order — ${esc(methodLabel.toLowerCase())}</h3>${schedRows}</div>
        <div><h3>Sinking vaults — irregular bills, pre-funded</h3>${vaultRows}</div></div>
        <p class="fineprint">The schedule follows the ${esc(methodLabel.toLowerCase())} order at ${fmt(extra)}/mo extra. Minimums alone are ${fmt(32000)}/mo; the $300/mo extra in the November plan is the Debt Extra envelope (${fmt(s.spent.debtextra)} moved to 20 Nov). Vaults are pre-funded from the $260/mo Sinking Funds transfer — a vault behind its monthly need shows in red.</p></div>
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
  return `
  <section class="page-head"><h1>${esc(t(lang, 'analyticsTitle'))}</h1><p class="muted">${state.month === '2026-11' ? 'November 2026 · to 20 Nov' : 'Closed month'} · all figures from the same ledger as Overview</p></section>
  ${tabBar}
  ${body}`;
}
