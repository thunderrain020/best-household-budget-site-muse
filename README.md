# AlderLedger — Household Cash-Flow, Zero-Based Envelopes & Debt Planner

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/thunderrain020/best-household-budget-site-muse/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/thunderrain020/best-household-budget-site-muse/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

A 100% offline, zero-build household budget site: cash flow, zero-based
envelopes, debt payoff and a live audit, all computed from one reconciled
ledger for a real household month (November 2026, snapshot Fri 20 Nov).

## What it is

**AlderLedger** plans a $7,420 month across 16 envelopes — $5,580 of
spending, $1,840 of saving and extra debt payment, $0 unassigned — and
then proves the plan against the ledger, the bills and the debts:

- **Overview** — 8 headline KPIs with 6-month sparklines and MoM deltas,
  a live action strip (Dining is $48 over plan — one click moves $48
  from Fun and the plan is whole again), a cash-flow allocation strip
  with 50/30/20 guide markers, envelope pace bars with day-20 ticks and
  −/+ $25 quick-adjust, a 30-day checking cushion curve with milestone
  annotations, upcoming bills with working Mark Paid buttons, and the
  latest spending.
- **Envelopes & Compare** — editable 50/30/20 allocator with an
  Apply 50/30/20 Split button and Add Category form, a selected-envelope
  detail card (Rank · Spend #X of N, 3-month sparkline, pace status),
  a side-by-side 2-month / 2-scenario comparison across Income, Needs,
  Wants and Savings & Debt, and a sortable, filterable ranked table.
- **Analytics & Debt** — Cash-Flow & Variance (budget-vs-actual donut,
  12-month trend with Apr tax refund, Aug back-to-school and Oct annual
  insurance callouts), a Debt Snowball vs Avalanche simulator
  ($11,450 across 3 debts; avalanche saves $161 of interest at $300/mo
  extra), and sinking & savings goals.
- **Ledger** — real-time search, envelope/group/date filters, sortable
  columns, add / edit / delete persisted in localStorage, Reset Demo
  Data, and RFC-4180 CSV, JSON and Copy Summary exports.
- **Audit & Bills** — `verifyBudgetConsistency()` re-derives 12 checks
  live (12/12 PASS): zero-based plan, envelope parity, ledger sums,
  cash identity ($6,720 − $4,565 − $1,380 = $775 on hand), bill
  reconciliation ($412 still due before 30 Nov), debt math and 12-month
  continuity — plus a November bills calendar and the numbered
  methodology [1]–[6].

## How it is built

Static files under `app/` only — no build step, no network requests at
runtime. Every chart is a hand-written inline SVG (no chart library, no
canvas), every dataset lives locally, the whole site works offline from
`app/index.html`, and it ships with a working dark mode and an offline
EN / ID language toggle.

```
app/
  index.html            shell: header, nav, search, footer
  style.css             warm-light design system + dark mode + mobile
  main.js               hash router, state, every interaction, exports
  data.js               reconciled ledger (cents), bills, debts, goals,
                        12-month history, verifyBudgetConsistency()
  charts.js             pure-SVG renderers: sparkline, strip, cushion,
                        6-month bars, donut, 12-month trend
  i18n.js               offline EN / ID strings
  views/
    home.js envelopes.js analytics.js ledger.js audit.js
```

## Figures

Snapshot Fri 20 Nov 2026 (day 20 of 30, 10 days left). Income expected
$7,420, received $6,720 (freelance $700 due 28 Nov). Spent $4,565
(68.0% of income received), saved + debt extra $1,380 (20.5% vs 20%
target), safe-to-spend $71/day ($709 flexible left ÷ 10 days), bills
still due $412, emergency runway 4.2 months ($18,228 fund ÷ $4,340/mo
essentials), zero-based balance $0 unassigned.

## Run it

```sh
node serve.ts   # http://localhost:8080
```

## Entry

Built for make.fun's
[best-household-budget-site-20261126-1457](https://make.fun/bounty/best-household-budget-site-20261126-1457)
bounty. `main.ts` hands the site in with the kit's vendored
`vendor/makefun-frontend.ts`, unchanged.
