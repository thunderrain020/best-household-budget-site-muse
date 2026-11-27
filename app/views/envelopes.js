// AlderLedger — Envelopes, 50/30/20 & Comparison (#/envelopes).
// Allocator with editable plans, the 50/30/20 split, add-category, the
// selected envelope's detail card, a two-period comparison widget, and
// the sortable ranked envelope table.

import { buildSummary, MONTHS, fmt, pct } from '../data.js';
import { sparkline } from '../charts.js';
import { t } from '../i18n.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const GROUP_PILL = { 'Needs': 'pill-needs', 'Wants': 'pill-wants', 'Savings & Debt': 'pill-save' };

function compareValues(key, sNov, user) {
  // key: a month key, or 'target' for the 50/30/20 plan on Nov income.
  if (key === 'target') return { label: 'Target 50/30/20 Plan', income: 742000, needs: 371000, wants: 222600, savings: 148400 };
  const s = key === sNov.monthKey ? sNov : buildSummary(key, user);
  const label = MONTHS.find((m) => m.key === key).label + (key === '2026-11' ? ' Actual' : ' Actual');
  return { label, income: s.expected, needs: s.needs.spent, wants: s.wants.spent, savings: s.savings.spent };
}

export function renderEnvelopes(state, s) {
  const lang = state.lang;
  const unassigned = s.expected - s.plannedSpend - s.plannedSave;
  // Allocator labels stay short and complete: the two-column grid has
  // no room for the longest names, and an ellipsis here reads as a
  // broken label. Full names stay everywhere else (detail, table).
  const SHORT = { dining: 'Dining Out', fun: 'Fun & Media', debtextra: 'Extra Debt' };
  const shortName = (e) => SHORT[e.id] || e.name;
  const allocRows = s.envelopes.map((e) => {
    const remaining = s.planned[e.id] - s.spent[e.id];
    return `<div class="alloc-row"><span class="alloc-name" style="--dot:${e.color}">${esc(shortName(e))}</span>
      <span class="pill ${GROUP_PILL[e.group]}">${esc(e.group)}</span>
      <label>$ <input type="number" min="0" step="5" value="${(s.planned[e.id] / 100).toFixed(0)}" data-planned-env="${e.id}" aria-label="Planned limit for ${esc(e.name)}"></label>
      <span class="alloc-spent">spent ${fmt(s.spent[e.id])}</span>
      <span class="${remaining < 0 ? 'bad' : 'good'}">${remaining < 0 ? 'over ' + fmt(-remaining) : fmt(remaining) + ' left'}</span></div>`;
  }).join('');
  const sorted = [...s.envelopes].sort((a, b) => s.spent[b.id] - s.spent[a.id]);
  const sel = s.envelopes.find((e) => e.id === state.selectedEnv) || sorted[0];
  const rank = sorted.findIndex((e) => e.id === sel.id) + 1;
  const hist = ['2026-09', '2026-10', '2026-11'].map((k) => buildSummary(k, state.user).spent[sel.id] || 0);
  const detail = `<section class="card detail-strip"><div><h3>${esc(sel.name)}</h3>
    <p class="detail-rank">Rank · Spend <b>#${rank} of ${s.envelopes.length}</b> · ${esc(sel.group)}</p></div>
    <div class="detail-nums"><span><b>${fmt(s.spent[sel.id])}</b><br><span class="muted">spent to 20 Nov</span></span><span><b>${fmt(s.planned[sel.id])}</b><br><span class="muted">planned</span></span><span><b class="${s.spent[sel.id] > s.planned[sel.id] ? 'bad' : 'good'}">${s.spent[sel.id] > s.planned[sel.id] ? 'over ' + fmt(s.spent[sel.id] - s.planned[sel.id]) : fmt(s.planned[sel.id] - s.spent[sel.id]) + ' left'}</b><br><span class="muted">pace ${pct(s.planned[sel.id] ? s.spent[sel.id] / s.planned[sel.id] : 0)} of plan</span></span></div>
    <div class="detail-spark">${sparkline(hist, sel.color, 260, 36)}</div>
    <p class="fineprint">Sep ${fmt(hist[0])} · Oct ${fmt(hist[1])} · Nov ${fmt(hist[2])}</p></section>`;
  const A = compareValues(state.compareA, s, state.user), B = compareValues(state.compareB, s, state.user);
  const metrics = [['Income', A.income, B.income], ['Needs', A.needs, B.needs], ['Wants', A.wants, B.wants], ['Savings & Debt', A.savings, B.savings]];
  const cmpRows = metrics.map(([name, a, b]) => {
    const max = Math.max(a, b, 1);
    const diff = a - b;
    return `<div class="cmp-row"><span class="cmp-name">${esc(name)}</span>
      <span class="cmp-bars"><i style="width:${(a / max * 100).toFixed(1)}%;background:#0F766E"></i><i style="width:${(b / max * 100).toFixed(1)}%;background:#A8A29A"></i></span>
      <span class="cmp-nums"><b>${fmt(a)}</b> vs ${fmt(b)}</span>
      <span class="${diff > 0 ? 'bad' : diff < 0 ? 'good' : 'muted'}">${diff === 0 ? '±$0' : (diff > 0 ? '+' : '−') + fmt(Math.abs(diff)).slice(1)}</span></div>`;
  }).join('');
  const opt = (v, cur, label) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
  const cmpSelects = `<div class="cmp-selects"><label>A <select data-action="compare" data-side="A">${opt('2026-11', state.compareA, 'Nov 2026 Actual')}${opt('2026-10', state.compareA, 'Oct 2026')}${opt('2026-09', state.compareA, 'Sep 2026')}${opt('target', state.compareA, 'Target 50/30/20 Plan')}</select></label>
    <label>B <select data-action="compare" data-side="B">${opt('2026-11', state.compareB, 'Nov 2026 Actual')}${opt('2026-10', state.compareB, 'Oct 2026')}${opt('2026-09', state.compareB, 'Sep 2026')}${opt('target', state.compareB, 'Target 50/30/20 Plan')}</select></label></div>`;
  // Ranked table, sorted by the state's sort key.
  const key = state.sortEnv || 'spent-desc';
  const rows = [...s.envelopes].filter((e) => state.groupFilter === 'All' || e.group === state.groupFilter);
  const sortFns = { 'spent-desc': (a, b) => s.spent[b.id] - s.spent[a.id], 'spent-asc': (a, b) => s.spent[a.id] - s.spent[b.id], 'planned-desc': (a, b) => s.planned[b.id] - s.planned[a.id], 'left-desc': (a, b) => (s.planned[b.id] - s.spent[b.id]) - (s.planned[a.id] - s.spent[a.id]) };
  rows.sort(sortFns[key] || sortFns['spent-desc']);
  const th = (label, k) => `<th><button class="th-btn" data-action="sort-env" data-key="${k}">${esc(label)} ${key.startsWith(k.split('-')[0]) && key === k ? '▼' : ''}</button></th>`;
  const tableRows = rows.map((e, i) => `<tr data-action="env-select" data-env="${e.id}" class="${state.selectedEnv === e.id ? 'sel' : ''}"><td>${i + 1}</td><td><span class="dot" style="background:${e.color}"></span>${esc(e.name)}</td><td><span class="pill ${GROUP_PILL[e.group]}">${esc(e.group)}</span></td><td class="num">${fmt(s.planned[e.id])}</td><td class="num">${fmt(s.spent[e.id])}</td><td class="num ${s.planned[e.id] - s.spent[e.id] < 0 ? 'bad' : 'good'}">${fmt(s.planned[e.id] - s.spent[e.id])}</td><td class="num">${pct(s.planned[e.id] ? s.spent[e.id] / s.planned[e.id] : 0)}</td></tr>`).join('');
  return `
  <section class="page-head"><h1>${esc(t(lang, 'envTitle'))}</h1><p class="muted">${MONTHS.find((m) => m.key === state.month).label} · plan ${fmt(s.expected)} · ${esc(t(lang, 'snapshot'))}</p></section>
  ${detail}
  <section class="grid-2">
    <div class="card">
      <div class="card-head"><h2>${esc(t(lang, 'allocator'))}</h2><span><button class="btn btn-sm btn-primary" data-action="apply-503020">${esc(t(lang, 'applySplit'))}</button> <span class="pill ${unassigned === 0 ? 'good' : 'bad'}">${unassigned === 0 ? 'Unassigned $0 · zero-based ✓' : unassigned > 0 ? 'Unassigned ' + fmt(unassigned) : 'Over-allocated ' + fmt(-unassigned)}</span></span></div>
      <div class="alloc-5030"><span>Needs <b>${pct(s.needs.planned / s.expected)}</b> <span class="muted">guide 50%</span></span><span>Wants <b>${pct(s.wants.planned / s.expected)}</b> <span class="muted">guide 30%</span></span><span>Savings <b>${pct(s.savings.planned / s.expected)}</b> <span class="muted">guide 20%</span></span></div>
      <div class="alloc-list">${allocRows}</div>
      <form class="add-cat" data-form="add-category"><input name="name" required maxlength="40" placeholder="New category name" aria-label="New category name"><select name="group" aria-label="Group"><option>Needs</option><option>Wants</option><option>Savings &amp; Debt</option></select><input name="planned" type="number" min="0" step="5" value="100" aria-label="Planned dollars"><button class="btn" type="submit">${esc(t(lang, 'addCategory'))}</button></form>

    </div>
    <div>
      <div class="card"><div class="card-head"><h2>${esc(t(lang, 'compare'))}</h2></div>${cmpSelects}<div class="cmp-legend"><span><i style="background:#0F766E"></i>A · ${esc(A.label)}</span><span><i style="background:#A8A29A"></i>B · ${esc(B.label)}</span></div>${cmpRows}
      <p class="fineprint">A is teal, B is grey. November actuals run to 20 Nov; the 50/30/20 target is the full-month plan on $7,420 of income.</p></div>
    </div>
  </section>
  <section class="card ranked-card">
    <div class="card-head"><h2>${esc(t(lang, 'ranked'))}</h2>
      <div class="pills">${['All', 'Needs', 'Wants', 'Savings & Debt'].map((g) => `<button class="pill-btn${state.groupFilter === g ? ' on' : ''}" data-action="group" data-group="${g}">${esc(t(lang, g === 'All' ? 'all' : g === 'Needs' ? 'needs' : g === 'Wants' ? 'wants' : 'savings'))}</button>`).join('')}</div>
    </div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Envelope</th><th>Group</th>${th('Planned', 'planned-desc')}${th('Spent', 'spent-desc')}${th('Left', 'left-desc')}<th>% of plan</th></tr></thead><tbody>${tableRows}</tbody></table></div>
    <p class="fineprint">Click a row to inspect that envelope. ▼ marks the active sort.</p>
  </section>`;
}
