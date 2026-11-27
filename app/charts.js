// AlderLedger — hand-written SVG charts. No library, no canvas, no
// network: every chart is a string of SVG built from the data in data.js.
// All charts use viewBox + width 100% so they scale without clipping,
// and every annotation sits inside the viewBox with room to spare.

import { HISTORY, CUSHION, ENVELOPES, fmt } from './data.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// A compact sparkline for a KPI card: values in cents, 6 points.
export function sparkline(values, color, w = 120, h = 24) {
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 4 - ((v - min) / span) * (h - 8)).toFixed(1)}`).join(' ');
  const last = values[values.length - 1];
  const ly = h - 4 - ((last - min) / span) * (h - 8);
  const lx = w - 2;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="6-month trend"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${lx}" cy="${ly.toFixed(1)}" r="3" fill="${color}"/></svg>`;
}

// Cash-flow allocation strip: received income split into Needs / Wants /
// Savings & Debt / Cash on hand, with 50/30/20 guide markers at 50% and
// 80% of received income. Widths are shares of the same total, so the
// strip always adds to 100%.
export function allocationStrip(s) {
  const total = s.incomeReceived || 1;
  const parts = [
    { label: 'Needs', value: s.needs.spent, color: '#0F766E' },
    { label: 'Wants', value: s.wants.spent, color: '#B45309' },
    { label: 'Savings & Debt', value: s.savings.spent, color: '#4338CA' },
    { label: 'Cash on hand', value: Math.max(0, s.cashOnHand), color: '#94A3B8' },
  ];
  // Pixel viewBox (560 wide) so the marker text renders at a real 10px:
  // a 0–100 viewBox with preserveAspectRatio="none" would stretch the
  // text 5× wider than tall.
  const W = 560;
  let x = 0;
  const segs = parts.map((p) => {
    const w = (p.value / total) * W;
    const seg = `<rect x="${x.toFixed(2)}" y="13" width="${Math.max(w, 3).toFixed(2)}" height="33" rx="4" fill="${p.color}"><title>${esc(p.label)}: ${fmt(p.value)} (${((p.value / total) * 100).toFixed(1)}%)</title></rect>`;
    x += w;
    return seg;
  }).join('');
  const marks = [50, 80].map((p) => { const mx = (p / 100) * W; return `<line x1="${mx}" y1="13" x2="${mx}" y2="47" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${mx}" y="9" text-anchor="middle" font-size="10" fill="var(--muted)">${p === 50 ? '50% needs' : '80% · 20% save'}</text>`; }).join('');
  const legend = parts.map((p) => `<span class="strip-leg"><i style="background:${p.color}"></i>${esc(p.label)} <b>${fmt(p.value)}</b></span>`).join('');
  return `<svg viewBox="0 0 ${W} 52" width="100%" height="52" role="img" aria-label="Income allocation">${marks}${segs}</svg><div class="strip-legend">${legend}</div>`;
}

// 30-day checking cushion curve (Nov, actual to the 20th, projected
// after) with inline milestone annotations, all inside the viewBox.
// Each callout sits on a crisp pill (card background + border) so the
// text never touches the curve; the two low labels (12 and 28 Nov) are
// lifted further above their points, clear of the rising line.
export function cushionChart() {
  const W = 560, H = 132, PL = 46, PR = 14, PT = 18, PB = 22;
  const max = 660000, min = 80000;
  const X = (d) => PL + ((d - 1) / 29) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - min) / (max - min)) * (H - PT - PB);
  const pts = CUSHION.map((v, i) => `${X(i + 1).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `${PL},${Y(100000)} ` + pts + ` ${X(30)},${Y(100000)}`;
  const floorY = Y(100000);
  const ann = [
    { d: 2, v: 626000, text: 'Nov 2 · Payday +$4,800', anchor: 'start', dy: -8 },
    { d: 12, v: 241000, text: 'Nov 12 · Low $2,410', anchor: 'middle', dy: -20 },
    { d: 16, v: 390000, text: 'Nov 16 · Payday +$1,920', anchor: 'start', dy: -8 },
    { d: 28, v: 184800, text: 'Nov 28 · Freelance +$700', anchor: 'end', dy: -16 },
  ];
  const dots = ann.map((a) => `<circle cx="${X(a.d).toFixed(1)}" cy="${Y(a.v).toFixed(1)}" r="3.5" fill="#0F766E" stroke="#fff" stroke-width="1.5"/>`).join('');
  // Pill behind each label: ~6.3px per 11px semibold char, 7px side pad.
  const pills = ann.map((a) => {
    const w = a.text.length * 6.3 + 14, x0 = X(a.d);
    const x = a.anchor === 'middle' ? x0 - w / 2 : a.anchor === 'end' ? x0 - w + 7 : x0 - 7;
    const y = Y(a.v) + a.dy - 14;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="18" rx="6" fill="var(--card)" stroke="var(--border)" stroke-width="1"/>`;
  }).join('');
  const labels = ann.map((a) => `<text x="${X(a.d).toFixed(1)}" y="${(Y(a.v) + a.dy).toFixed(1)}" text-anchor="${a.anchor}" font-size="11" font-weight="600" fill="var(--ink)">${esc(a.text)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="30-day checking cushion">
    <line x1="${PL}" y1="${floorY}" x2="${W - PR}" y2="${floorY}" stroke="#BE123C" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="${PL + 4}" y="${floorY - 5}" text-anchor="start" font-size="10" fill="#BE123C">$1,000 floor</text>
    <line x1="${X(20)}" y1="${PT}" x2="${X(20)}" y2="${H - PB}" stroke="#94A3B8" stroke-width="1" stroke-dasharray="2 3"/>
    <text x="${X(20)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--muted)">today · 20 Nov</text>
    <polygon points="${area}" fill="#0F766E" opacity="0.10"/>
    <polyline points="${pts}" fill="none" stroke="#0F766E" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}${pills}${labels}
  </svg>`;
}

// Six-month In / Out / Saved grouped bars (Jun–Nov 2026).
export function sixMonthChart() {
  const rows = HISTORY.slice(6);
  const W = 560, H = 132, PL = 46, PB = 26, PT = 14;
  const max = Math.max(...rows.map((r) => r.income));
  const bw = (W - PL - 20) / rows.length;
  const bar = (v, x, w, color) => { const h = (v / max) * (H - PT - PB); return `<rect x="${x.toFixed(1)}" y="${(H - PB - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${color}"><title>${fmt(v)}</title></rect>`; };
  let out = '';
  rows.forEach((r, i) => {
    const x0 = PL + i * bw + 8;
    const w = (bw - 16) / 3;
    out += bar(r.income, x0, w, '#0F766E') + bar(r.spent, x0 + w + 2, w, '#BE123C') + bar(r.saved, x0 + 2 * w + 4, w, '#4338CA');
    out += `<text x="${(x0 + (bw - 16) / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--muted)">${esc(r.month.split(' ')[0])}${r.partial ? ' *' : ''}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Six-month income, spending and saving">
    ${out}
    <text x="${PL}" y="${PT - 2}" font-size="10" fill="var(--muted)">$ per month · * Nov to 20th</text>
  </svg><div class="strip-legend"><span class="strip-leg"><i style="background:#0F766E"></i>In</span><span class="strip-leg"><i style="background:#BE123C"></i>Out</span><span class="strip-leg"><i style="background:#4338CA"></i>Saved</span></div>`;
}

// Budget-vs-actual donut: the six largest spending envelopes, actual
// share of spending, with planned vs actual in the title tooltip.
export function varianceDonut(s) {
  const top = [...ENVELOPES].filter((e) => !e.savings).sort((a, b) => s.spent[b.id] - s.spent[a.id]).slice(0, 5);
  const rest = ENVELOPES.filter((e) => !e.savings && !top.includes(e));
  const other = rest.reduce((a, e) => a + s.spent[e.id], 0);
  const otherPlanned = rest.reduce((a, e) => a + s.planned[e.id], 0);
  const slices = [...top.map((e) => ({ label: e.name, value: s.spent[e.id], planned: s.planned[e.id], color: e.color })), { label: 'Other needs & wants', value: other, planned: otherPlanned, color: '#94A3B8' }];
  const total = slices.reduce((a, x) => a + x.value, 0) || 1;
  const R = 74, C = 2 * Math.PI * R;
  let off = 0;
  const segs = slices.map((x) => {
    const len = (x.value / total) * C;
    const seg = `<circle r="${R}" cx="90" cy="90" fill="none" stroke="${x.color}" stroke-width="26" stroke-dasharray="${Math.max(len - 2, 1).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}"><title>${esc(x.label)}: spent ${fmt(x.value)} of ${fmt(x.planned)} planned</title></circle>`;
    off += len;
    return seg;
  }).join('');
  const rows = slices.map((x) => `<div class="donut-row"><i style="background:${x.color}"></i><span>${esc(x.label)}</span><b>${fmt(x.value)}</b><span class="muted">plan ${fmt(x.planned)}</span></div>`).join('');
  return `<div class="donut-wrap"><svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Spending by envelope"><g transform="rotate(-90 90 90)">${segs}</g><text x="90" y="86" text-anchor="middle" font-size="20" font-weight="700" fill="var(--ink)">${fmt(total)}</text><text x="90" y="104" text-anchor="middle" font-size="10" fill="var(--muted)">spent to 20 Nov</text></svg><div class="donut-legend">${rows}</div></div>`;
}

// Debt payoff curve: total balance over time under the current plan
// (snowball with the effective extra payment) vs paying minimums only.
// Both series come from simulateDebt, so the curve can never disagree
// with the months / interest figures beside it. The callout pill is
// HTML under the SVG (not drawn inside it) so its text stays full-size
// on a phone and can never overlap a line.
export function debtCurve(current, minimums, callout) {
  const W = 560, H = 132, PL = 46, PR = 14, PT = 16, PB = 22;
  const maxV = 1145000;
  const maxM = Math.max(current.months, minimums.months, 1);
  const X = (m) => PL + (m / maxM) * (W - PL - PR);
  const Y = (v) => PT + (1 - v / maxV) * (H - PT - PB);
  const line = (series, color, dashed) => {
    const pts = series.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"${dashed ? ' stroke-dasharray="6 4"' : ''}/>`;
  };
  const same = current.months === minimums.months;
  const endCur = `<circle cx="${X(current.months).toFixed(1)}" cy="${Y(0).toFixed(1)}" r="4" fill="#0F766E"/><text x="${Math.min(X(current.months) + 8, W - 70).toFixed(1)}" y="${(Y(0) - 8).toFixed(1)}" font-size="11" font-weight="700" fill="#0F766E">Debt-free · ${current.months} mo</text>`;
  const endMin = same ? '' : `<circle cx="${X(minimums.months).toFixed(1)}" cy="${Y(0).toFixed(1)}" r="4" fill="#BE123C"/><text x="${(X(minimums.months) - 8).toFixed(1)}" y="${(Y(0) - 8).toFixed(1)}" text-anchor="end" font-size="11" font-weight="700" fill="#BE123C">Minimums · ${minimums.months} mo</text>`;
  const legend = same
    ? `<div class="strip-legend"><span class="strip-leg"><i style="background:#BE123C"></i>Minimums only — the current plan is minimums</span></div>`
    : `<div class="strip-legend"><span class="strip-leg"><i style="background:#0F766E"></i>Current plan</span><span class="strip-leg"><i style="background:#BE123C"></i>Minimums only</span></div>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Debt payoff curve">
    <text x="${PL}" y="${PT - 4}" font-size="10" fill="var(--muted)">Total debt $11,450 → $0</text>
    <line x1="${PL}" y1="${Y(0)}" x2="${W - PR}" y2="${Y(0)}" stroke="var(--border)" stroke-width="1"/>
    ${same ? line(minimums.series, '#BE123C', true) : line(minimums.series, '#BE123C', true) + line(current.series, '#0F766E', false)}
    ${endCur}${endMin}
  </svg>${callout ? `<p class="curve-callout"><span class="pill pill-teal">${esc(callout)}</span></p>` : ''}${legend}`;
}

// Twelve-month household cash-flow trend: income bars, spending bars,
// saved line, with the three real callouts from the year.
export function trendChart() {
  const W = 560, H = 230, PL = 46, PB = 30, PT = 26;
  const max = Math.max(...HISTORY.map((r) => r.income));
  const bw = (W - PL - 16) / 12;
  let out = '';
  HISTORY.forEach((r, i) => {
    const x0 = PL + i * bw + 3;
    const w = (bw - 6) / 2;
    const hi = (r.income / max) * (H - PT - PB), hs = (r.spent / max) * (H - PT - PB);
    out += `<rect x="${x0.toFixed(1)}" y="${(H - PB - hi).toFixed(1)}" width="${w.toFixed(1)}" height="${hi.toFixed(1)}" rx="2" fill="#0F766E" opacity="0.85"><title>${esc(r.month)} income ${fmt(r.income)}</title></rect>`;
    out += `<rect x="${(x0 + w + 2).toFixed(1)}" y="${(H - PB - hs).toFixed(1)}" width="${w.toFixed(1)}" height="${hs.toFixed(1)}" rx="2" fill="#BE123C" opacity="0.75"><title>${esc(r.month)} spent ${fmt(r.spent)}</title></rect>`;
    out += `<text x="${(x0 + bw / 2).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="9" fill="var(--muted)">${esc(r.month.slice(0, 3))}</text>`;
  });
  const callouts = [
    { i: 4, text: 'Apr · Tax refund +$1,900', y: PT - 8 },
    { i: 7, text: 'Aug · Back-to-school', y: PT - 8 },
    { i: 10, text: 'Oct · Annual insurance', y: PT - 8 },
  ];
  const labels = callouts.map((c) => { const x = PL + c.i * bw + bw / 2; return `<text x="${x.toFixed(1)}" y="${c.y}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--ink)">${esc(c.text)}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Twelve-month cash-flow trend">${labels}${out}</svg><div class="strip-legend"><span class="strip-leg"><i style="background:#0F766E"></i>Income</span><span class="strip-leg"><i style="background:#BE123C"></i>Spent</span><span class="strip-leg"><i style="background:#4338CA"></i>Saved = income − spent</span></div>`;
}
