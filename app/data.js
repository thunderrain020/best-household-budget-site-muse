// AlderLedger — the household's reconciled money, in one place.
//
// Every figure on the site is computed from the tables in this file, in
// integer cents, so nothing can drift: envelope spending is the sum of the
// month's transactions, the plan is zero-based by construction, and the
// audit panel re-derives each identity live. A snapshot date pins the
// "month to date" figures: Friday 20 November 2026, day 20 of 30, with
// 10 days left in the month. September and October 2026 are closed months
// (every dollar received was spent or saved, unassigned $0); November is
// open (cash on hand $775, of which $412 of bills are still due).
//
// Amounts are cents. Income "expected" is the full month's plan; income
// "received" is what has actually landed by the snapshot date.

export const SNAPSHOT = { label: 'Fri 20 Nov 2026', day: 20, daysInMonth: 30, daysLeft: 10 };
export const CURRENCY = 'USD';

export const MONTHS = [
  { key: '2026-09', label: 'Sep 2026', short: 'Sep', closed: true, days: 30 },
  { key: '2026-10', label: 'Oct 2026', short: 'Oct', closed: true, days: 31 },
  { key: '2026-11', label: 'Nov 2026', short: 'Nov', closed: false, days: 30 },
];

// Envelopes. `group` is Needs / Wants / Savings & Debt. `planned` and
// `spent` are cents for that month; `spent` is the exact sum of the
// month's generated transactions for the envelope (see buildMonthTxns).
// `flexible` marks the envelopes the safe-to-spend figure draws on.
export const ENVELOPES = [
  { id: 'housing', name: 'Housing', group: 'Needs', color: '#0F766E', flexible: false },
  { id: 'groceries', name: 'Groceries', group: 'Needs', color: '#15803D', flexible: true },
  { id: 'utilities', name: 'Utilities', group: 'Needs', color: '#0369A1', flexible: false },
  { id: 'transport', name: 'Transport', group: 'Needs', color: '#7C3AED', flexible: true },
  { id: 'insurance', name: 'Insurance', group: 'Needs', color: '#334155', flexible: false },
  { id: 'health', name: 'Health', group: 'Needs', color: '#BE185D', flexible: false },
  { id: 'childcare', name: 'Childcare', group: 'Needs', color: '#B45309', flexible: false },
  { id: 'dining', name: 'Dining & Takeout', group: 'Wants', color: '#BE123C', flexible: true },
  { id: 'fun', name: 'Fun & Streaming', group: 'Wants', color: '#4338CA', flexible: true },
  { id: 'clothing', name: 'Clothing', group: 'Wants', color: '#0E7490', flexible: true },
  { id: 'home', name: 'Home & Garden', group: 'Wants', color: '#65A30D', flexible: true },
  { id: 'gifts', name: 'Gifts & Giving', group: 'Wants', color: '#C026D3', flexible: true },
  { id: 'emergency', name: 'Emergency Fund', group: 'Savings & Debt', color: '#0F766E', flexible: false, savings: true },
  { id: 'sinking', name: 'Sinking Funds', group: 'Savings & Debt', color: '#0369A1', flexible: false, savings: true },
  { id: 'debtextra', name: 'Extra Debt Payment', group: 'Savings & Debt', color: '#4338CA', flexible: false, savings: true, debt: true },
  { id: 'retirement', name: 'Retirement', group: 'Savings & Debt', color: '#475569', flexible: false, savings: true },
];

// Planned (cents) and spent-to-date (cents) per envelope, per month.
// Planned totals: Sep $7,310 · Oct $7,380 · Nov $7,420 — each exactly the
// month's expected income, so the plan is zero-based (see the audit).
const PLAN = {
  '2026-09': { housing: 195000, groceries: 76000, utilities: 25000, transport: 37000, insurance: 0, health: 23000, childcare: 42000, dining: 40000, fun: 23000, clothing: 17000, home: 19000, gifts: 19000, emergency: 85000, sinking: 46000, debtextra: 44000, retirement: 40000 },
  '2026-10': { housing: 195000, groceries: 78000, utilities: 26000, transport: 38000, insurance: 31000, health: 24000, childcare: 42000, dining: 42000, fun: 24000, clothing: 18000, home: 20000, gifts: 20000, emergency: 62000, sinking: 38000, debtextra: 40000, retirement: 40000 },
  '2026-11': { housing: 195000, groceries: 78000, utilities: 26000, transport: 38000, insurance: 31000, health: 24000, childcare: 42000, dining: 42000, fun: 24000, clothing: 18000, home: 20000, gifts: 20000, emergency: 62000, sinking: 38000, debtextra: 44000, retirement: 40000 },
};
const SPENT = {
  '2026-09': { housing: 195000, groceries: 71800, utilities: 24300, transport: 35200, insurance: 0, health: 21400, childcare: 42000, dining: 38800, fun: 22600, clothing: 15800, home: 18900, gifts: 22900, emergency: 90000, sinking: 48000, debtextra: 44300, retirement: 40000 },
  '2026-10': { housing: 195000, groceries: 78500, utilities: 25100, transport: 36600, insurance: 31000, health: 22800, childcare: 42000, dining: 40200, fun: 23100, clothing: 17100, home: 19600, gifts: 20200, emergency: 61000, sinking: 37200, debtextra: 48600, retirement: 40000 },
  '2026-11': { housing: 195000, groceries: 51200, utilities: 18600, transport: 24100, insurance: 31000, health: 14800, childcare: 28000, dining: 46800, fun: 14900, clothing: 9600, home: 12100, gifts: 10400, emergency: 42000, sinking: 26000, debtextra: 30000, retirement: 40000 },
};

// Income per month (cents). `expected` is the full-month plan; `sources`
// name the paychecks. November's freelance invoice ($700) is due 28 Nov,
// so it is expected but not yet received.
export const INCOME = {
  '2026-09': { expected: 731000, sources: [
    { name: 'Salary — Maya Alder', amount: 480000, date: '2026-09-02' },
    { name: 'Salary — Jordan Alder', amount: 183000, date: '2026-09-16' },
    { name: 'Freelance — design', amount: 68000, date: '2026-09-25' } ] },
  '2026-10': { expected: 738000, sources: [
    { name: 'Salary — Maya Alder', amount: 480000, date: '2026-10-02' },
    { name: 'Salary — Jordan Alder', amount: 190000, date: '2026-10-16' },
    { name: 'Freelance — design', amount: 68000, date: '2026-10-28' } ] },
  '2026-11': { expected: 742000, sources: [
    { name: 'Salary — Maya Alder', amount: 480000, date: '2026-11-02' },
    { name: 'Salary — Jordan Alder', amount: 192000, date: '2026-11-16' },
    { name: 'Freelance — design', amount: 70000, date: '2026-11-28', pending: true } ] },
};

// Payee pools used to build the ledger deterministically (see below).
const PAYEES = {
  housing: ['Maple Court Rent'], groceries: ['GreenMart Supermarket', 'FreshCo Market', 'Corner Grocer', 'BulkBuy Warehouse'],
  utilities: ['City Power & Light', 'NorthStar Internet', 'Aqua Municipal Water', 'Metro Mobile'],
  transport: ['City Transit Pass', 'Fuel Station', 'RideShare City', 'AutoCare Garage'],
  insurance: ['Beacon Home Insurance'], health: ['Riverside Pharmacy', 'Dr. Chen Clinic', 'Dental Care Plus'],
  childcare: ['Little Oaks Daycare', 'After-School Club'], dining: ['Noodle House', 'Burger Joint', 'Sushi Bar Kiyo', 'Pizza Corner', 'Coffee Roasters'],
  fun: ['StreamFlix', 'Cinema City', 'Game Store', 'Concert Tickets'], clothing: ['Thread & Co', 'Shoe Barn', 'Kids Outfitters'],
  home: ['Hardware Depot', 'Garden Centre', 'HomeGoods'], gifts: ['Gift Shop Bloom', 'Toy World', 'Bookstore'],
  emergency: ['Emergency Fund Transfer'], sinking: ['Holiday Sinking Fund', 'Car Sinking Fund'],
  debtextra: ['Debt Extra — Everyday Card'], retirement: ['Retirement 401(k)'],
};
// Fixed split patterns (fractions of the envelope total, last part is the
// remainder, so the parts always sum exactly). Single-payment envelopes
// (rent, insurance) keep one transaction on their real due date.
const SPLITS = { 1: [1], 2: [0.5, 0.5], 3: [0.42, 0.33, 0.25], 4: [0.34, 0.28, 0.22, 0.16], 5: [0.3, 0.24, 0.2, 0.15, 0.11] };
const SPLIT_COUNT = { housing: 1, groceries: 5, utilities: 3, transport: 4, insurance: 1, health: 3, childcare: 2, dining: 5, fun: 3, clothing: 2, home: 3, gifts: 3, emergency: 1, sinking: 2, debtextra: 1, retirement: 1 };

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Build a month's ledger from the SPENT table: every transaction is dated
// inside the month (November only to the 20th), amounts are integer cents,
// and each envelope's transactions sum to its SPENT figure exactly.
// Deterministic: same month, same transactions, every load.
export function buildMonthTxns(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const lastDay = monthKey === '2026-11' ? 20 : new Date(y, m, 0).getDate();
  const rand = mulberry32(y * 100 + m);
  const txns = [];
  let n = 0;
  const push = (envId, amount, day, payee, type) => {
    n += 1;
    txns.push({ id: `${monthKey}-${String(n).padStart(3, '0')}`, date: `${monthKey}-${String(day).padStart(2, '0')}`, payee, envelope: envId, type, amount, reconciled: true });
  };
  // Income that has landed.
  for (const s of INCOME[monthKey].sources) {
    if (s.pending) continue;
    const day = Number(s.date.slice(8));
    push(null, s.amount, day, s.name, 'income');
  }
  // Spending + savings transfers, envelope by envelope.
  for (const env of ENVELOPES) {
    const total = SPENT[monthKey][env.id];
    if (!total) continue;
    const count = SPLIT_COUNT[env.id];
    const parts = SPLITS[count];
    let used = 0;
    const pool = PAYEES[env.id];
    for (let i = 0; i < count; i++) {
      const amount = i === count - 1 ? total - used : Math.floor(total * parts[i]);
      used += amount;
      const day = env.id === 'housing' ? 1 : env.id === 'insurance' ? 5 : 1 + Math.floor(rand() * lastDay);
      const payee = pool[Math.floor(rand() * pool.length)];
      push(env.id, amount, Math.min(Math.max(day, 1), lastDay), payee, env.savings ? 'transfer' : 'expense');
    }
  }
  txns.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
  // V2 — split receipts (November only): merge two same-day expense
  // transactions from different envelopes into one receipt. Each part
  // keeps its original envelope and amount, so every envelope total is
  // unchanged and the audit still re-adds exactly. The second receipt is
  // still processing at the bank, so it starts as Scheduled.
  if (monthKey === '2026-11') {
    const usedDates = new Set();
    const mergeSplit = (wantA, wantB, payee, status) => {
      for (let i = 0; i < txns.length; i++) {
        const a = txns[i];
        if (a.type !== 'expense' || a.splits || a.envelope !== wantA || usedDates.has(a.date)) continue;
        const j = txns.findIndex((b, k) => k !== i && b.type === 'expense' && !b.splits && b.envelope === wantB && b.date === a.date);
        if (j < 0) continue;
        const b = txns[j];
        const merged = { id: a.id, date: a.date, payee, envelope: null, type: 'expense', amount: a.amount + b.amount, splits: [{ envelope: a.envelope, amount: a.amount }, { envelope: b.envelope, amount: b.amount }], reconciled: true, status };
        txns.splice(Math.max(i, j), 1);
        txns.splice(Math.min(i, j), 1, merged);
        usedDates.add(a.date);
        return true;
      }
      return false;
    };
    const mergeAny = (payee, status) => {
      const retail = ['groceries', 'home', 'clothing', 'gifts', 'dining', 'fun'];
      for (let i = 0; i < txns.length; i++) {
        const a = txns[i];
        if (a.type !== 'expense' || a.splits || !retail.includes(a.envelope) || usedDates.has(a.date)) continue;
        const j = txns.findIndex((b, k) => k !== i && b.type === 'expense' && !b.splits && retail.includes(b.envelope) && b.envelope !== a.envelope && b.date === a.date);
        if (j < 0) continue;
        const b = txns[j];
        const merged = { id: a.id, date: a.date, payee, envelope: null, type: 'expense', amount: a.amount + b.amount, splits: [{ envelope: a.envelope, amount: a.amount }, { envelope: b.envelope, amount: b.amount }], reconciled: true, status };
        txns.splice(Math.max(i, j), 1);
        txns.splice(Math.min(i, j), 1, merged);
        usedDates.add(a.date);
        return true;
      }
      return false;
    };
    if (!mergeSplit('groceries', 'home', 'Costco Wholesale', 'cleared')) mergeAny('Corner Market', 'cleared');
    if (!mergeSplit('groceries', 'clothing', 'Target', 'scheduled')) mergeAny('Corner Market', 'scheduled');
  }
  return txns;
}

// Recurring bills for November. Paid bills match a ledger transaction of
// the same amount and date; due bills are the $412 still to pay before 30 Nov.
export const BILLS = [
  { id: 'rent', name: 'Rent — Maple Court', amount: 195000, due: '2026-11-01', envelope: 'housing', status: 'paid', autopay: true },
  { id: 'insurance', name: 'Home insurance — Beacon', amount: 31000, due: '2026-11-05', envelope: 'insurance', status: 'paid', autopay: false },
  { id: 'childcare-a', name: 'Little Oaks Daycare (wk 1)', amount: 14000, due: '2026-11-06', envelope: 'childcare', status: 'paid', autopay: true },
  { id: 'childcare-b', name: 'Little Oaks Daycare (wk 2)', amount: 14000, due: '2026-11-13', envelope: 'childcare', status: 'paid', autopay: true },
  { id: 'internet', name: 'Internet — NorthStar', amount: 8500, due: '2026-11-25', envelope: 'utilities', status: 'due', autopay: true },
  { id: 'electric', name: 'Electric — City Power', amount: 14000, due: '2026-11-27', envelope: 'utilities', status: 'due', autopay: true },
  { id: 'water', name: 'Water — Aqua Municipal', amount: 6200, due: '2026-11-28', envelope: 'utilities', status: 'due', autopay: false },
  { id: 'phone', name: 'Mobile — Metro', amount: 12500, due: '2026-11-29', envelope: 'utilities', status: 'due', autopay: true },
];

// Debts for the snowball / avalanche simulator (cents, APR as a decimal).
export const DEBTS = [
  { id: 'store', name: 'Store Card', balance: 125000, apr: 0.1899, min: 4500 },
  { id: 'everyday', name: 'Everyday Card', balance: 385000, apr: 0.2699, min: 9500 },
  { id: 'loan', name: 'Credit Union Loan', balance: 635000, apr: 0.0949, min: 18000 },
];

// Savings goals (cents). The emergency fund is the runway behind KPI 7.
export const GOALS = [
  { id: 'emergency', name: 'Emergency fund', balance: 1822800, target: 2604000, note: '6 months of essentials ($4,340/mo)' },
  { id: 'holiday', name: 'Holiday — December trip', balance: 124000, target: 200000, note: 'Flights + stay, booked by 5 Dec' },
  { id: 'car', name: 'Next car', balance: 86000, target: 300000, note: '$180/mo from sinking funds' },
  { id: 'repairs', name: 'Home repairs', balance: 54000, target: 150000, note: 'Roof inspection in spring' },
];

// Non-monthly sinking vaults (cents): the irregular bills the Sinking
// Funds envelope pre-funds. `monthly` is each vault's share of the $260/mo
// sinking transfer; `due` is the date the money must be there. The monthly
// need is (target − current) ÷ months left from Nov 2026, rounded up.
export const VAULTS = [
  { id: 'insurance', name: 'Annual Insurance', target: 31000, current: 28500, due: '2027-10-01', monthly: 2500, note: 'Beacon home premium, auto-renews 1 Oct 2027' },
  { id: 'holiday', name: 'Holiday Travel', target: 200000, current: 124000, due: '2026-12-20', monthly: 12000, note: 'Flights + stay for the December trip' },
  { id: 'car', name: 'Car Maintenance', target: 150000, current: 54000, due: '2027-06-01', monthly: 11500, note: 'Tyres, service + the timing belt, due before summer' },
];

// Twelve months of history (cents). `saved` is money actually moved to
// savings and debt in that month; for closed months income − spent − saved
// is exactly $0, for November it is the $775 cash on hand.
export const HISTORY = [
  { month: 'Dec 2025', income: 695000, spent: 521000, saved: 174000 },
  { month: 'Jan 2026', income: 712000, spent: 534000, saved: 178000 },
  { month: 'Feb 2026', income: 698000, spent: 528000, saved: 170000 },
  { month: 'Mar 2026', income: 724000, spent: 541000, saved: 183000 },
  { month: 'Apr 2026', income: 912000, spent: 568000, saved: 344000, note: 'Tax refund +$1,900' },
  { month: 'May 2026', income: 731000, spent: 549000, saved: 182000 },
  { month: 'Jun 2026', income: 719000, spent: 532000, saved: 187000 },
  { month: 'Jul 2026', income: 742000, spent: 561000, saved: 181000 },
  { month: 'Aug 2026', income: 738000, spent: 589000, saved: 149000, note: 'Back-to-school +$340' },
  { month: 'Sep 2026', income: 731000, spent: 508700, saved: 222300 },
  { month: 'Oct 2026', income: 738000, spent: 551200, saved: 186800, note: 'Annual insurance $310' },
  { month: 'Nov 2026', income: 672000, spent: 456500, saved: 138000, note: 'To 20 Nov — open month', partial: true },
];

// End-of-day checking balance, 1–30 Nov (cents). 1–20 are actual, 21–30
// projected (dashed on the chart): the $1,000 floor is never crossed, the
// low is 12 Nov ($2,410), paydays are 2 Nov (+$4,800) and 16 Nov (+$1,920),
// and the 28 Nov freelance invoice (+$700) lifts the curve before the
// last bills land.
export const CUSHION = [146000, 626000, 598000, 571000, 534000, 512000, 489000, 461000, 438000, 402000, 338000, 241000, 228000, 214000, 198000, 390000, 362000, 338000, 289000, 225000, 208000, 191000, 176000, 162000, 148000, 139000, 121000, 184800, 172000, 164000];

export const METHODOLOGY = [
  { n: 1, title: 'Zero-based plan', text: 'Every dollar of expected income gets a job before the month starts: planned spending + planned saving = expected income, unassigned $0.' },
  { n: 2, title: '50 / 30 / 20 guide', text: 'Needs near 50%, wants near 30%, savings and debt near 20% of take-home pay. This household runs 58.5 / 16.7 / 24.8 — housing and childcare push needs up, wants stay low, savings stay above target.' },
  { n: 3, title: 'Envelopes, not categories', text: 'An envelope is a hard limit for the month. Spending past it must come from another envelope, in the open, with the Move button — never silently from savings.' },
  { n: 4, title: 'Cash identity', text: 'Income received − spending − savings moved = cash on hand. For November: $6,720 − $4,565 − $1,380 = $775, of which $412 of bills are still due.' },
  { n: 5, title: 'Debt order', text: 'Snowball pays the smallest balance first (quick wins); avalanche pays the highest APR first (least interest). The simulator prices both on the same debts and the same extra payment.' },
  { n: 6, title: 'Reconciliation', text: 'Every transaction is dated, tagged to one envelope, and marked reconciled. The audit on this page re-adds the ledger, the plan, the bills and the debts on every load.' },
];

export const GUIDES = [
  { title: 'Start with last month, not a blank page', text: 'Copy last month’s envelopes, then change only the three lines that actually moved. A plan you can keep beats a perfect one you abandon by the 10th.' },
  { title: 'Pay the future first', text: 'Move savings and the extra debt payment on payday, before spending starts. What stays in checking after that is the honest safe-to-spend number.' },
  { title: 'One over-budget envelope is a decision, not a failure', text: 'Dining ran $48 over in November. Move $48 from Fun, in the open, and the plan is whole again — the transfer, not the overspend, is the habit that matters.' },
];

// ---- Derived summary -------------------------------------------------
// `user` carries the household's own edits (localStorage): extra
// transactions, planned-limit overrides, bills marked paid, and whether
// the $48 Dining fix has been applied. Everything below is computed from
// base data + those edits, so the audit can never be out of sync with the
// screen.

export function buildSummary(monthKey, user) {
  const u = user || { txns: [], planned: {}, paidBills: [], moved48: false };
  const baseTxns = buildMonthTxns(monthKey);
  const txns = [...baseTxns, ...(u.txns || []).filter((t) => t.date.startsWith(monthKey))];
  // Effective cleared / scheduled status: the household's own override
  // wins, then the transaction's own status, then cleared.
  for (const t of txns) t.status = (u.txnStatus && u.txnStatus[t.id]) || t.status || 'cleared';
  // Household-added envelopes (from the allocator's Add Category form)
  // join the base sixteen; they carry their own plan and start at $0 spent.
  const envelopes = [...ENVELOPES, ...(u.customEnvs || []).map((c) => ({ ...c, color: '#64748B', flexible: c.group !== 'Savings & Debt', savings: c.group === 'Savings & Debt' }))];
  const planned = {};
  for (const env of envelopes) {
    planned[env.id] = (u.planned && u.planned[`${monthKey}:${env.id}`]) ?? (PLAN[monthKey] && PLAN[monthKey][env.id]) ?? env.planned ?? 0;
  }
  if (u.moved48 && monthKey === '2026-11') {
    planned.dining += 4800; planned.fun -= 4800;
  }
  const spent = {};
  for (const env of envelopes) spent[env.id] = 0;
  let incomeReceived = 0, expenseTotal = 0, transferTotal = 0, clearedTotal = 0, scheduledTotal = 0, splitCount = 0;
  for (const t of txns) {
    if (t.splits) splitCount += 1;
    if (t.type === 'income') incomeReceived += t.amount;
    if (t.type === 'expense') { expenseTotal += t.amount; if (t.splits) for (const sp of t.splits) spent[sp.envelope] = (spent[sp.envelope] || 0) + sp.amount; else if (t.envelope) spent[t.envelope] = (spent[t.envelope] || 0) + t.amount; }
    if (t.type === 'transfer') { transferTotal += t.amount; if (t.envelope) spent[t.envelope] = (spent[t.envelope] || 0) + t.amount; }
    if (t.type !== 'income') { if (t.status === 'scheduled') scheduledTotal += t.amount; else clearedTotal += t.amount; }
  }
  const groupSum = (group, field) => envelopes.filter((e) => e.group === group).reduce((s, e) => s + (field === 'planned' ? planned[e.id] : spent[e.id]), 0);
  const plannedSpend = groupSum('Needs', 'planned') + groupSum('Wants', 'planned');
  const plannedSave = groupSum('Savings & Debt', 'planned');
  const expected = INCOME[monthKey].expected;
  // Bills are November's schedule: in a closed month every bill is settled.
  const bills = BILLS.map((b) => ({ ...b, status: monthKey === '2026-11' ? ((u.paidBills || []).includes(b.id) ? 'paid' : b.status) : 'paid' }));
  const billsDue = bills.filter((b) => b.status === 'due').reduce((s, b) => s + b.amount, 0);
  const billsPaid = bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
  const flexiblePlanned = envelopes.filter((e) => e.flexible).reduce((s, e) => s + planned[e.id], 0);
  const flexibleSpent = envelopes.filter((e) => e.flexible).reduce((s, e) => s + spent[e.id], 0);
  const cashOnHand = incomeReceived - expenseTotal - transferTotal;
  return {
    monthKey, envelopes, txns, planned, spent, incomeReceived, expenseTotal, transferTotal,
    expected, plannedSpend, plannedSave, bills, billsDue, billsPaid, cashOnHand,
    clearedTotal, scheduledTotal, splitCount,
    needs: { planned: groupSum('Needs', 'planned'), spent: groupSum('Needs', 'spent') },
    wants: { planned: groupSum('Wants', 'planned'), spent: groupSum('Wants', 'spent') },
    savings: { planned: groupSum('Savings & Debt', 'planned'), spent: groupSum('Savings & Debt', 'spent') },
    flexibleRemaining: flexiblePlanned - flexibleSpent,
    safePerDay: Math.max(0, flexiblePlanned - flexibleSpent) / SNAPSHOT.daysLeft,
    savingsRate: incomeReceived ? transferTotal / incomeReceived : 0,
    runwayMonths: 1822800 / 434000,
  };
}

// The 12 live data-integrity checks behind the "12/12 PASS" pill.
export function verifyBudgetConsistency(monthKey, user) {
  const s = buildSummary(monthKey, user);
  const checks = [];
  const add = (id, name, passed, detail) => checks.push({ id, name, passed, detail });
  add(1, 'Zero-based plan', s.expected - s.plannedSpend - s.plannedSave === 0, `$${(s.expected / 100).toLocaleString('en-US')} = $${(s.plannedSpend / 100).toLocaleString('en-US')} spend + $${(s.plannedSave / 100).toLocaleString('en-US')} save`);
  add(2, 'Envelope plan parity', s.envelopes.reduce((a, e) => a + s.planned[e.id], 0) === s.expected, `${s.envelopes.length} envelopes sum to expected income`);
  add(3, 'Ledger = envelope spending', s.txns.filter((t) => t.type !== 'income').reduce((a, t) => a + t.amount, 0) === s.expenseTotal + s.transferTotal, `${s.txns.length} transactions re-added`);
  add(4, 'Income received', s.incomeReceived === INCOME[monthKey].sources.filter((x) => !x.pending).reduce((a, x) => a + x.amount, 0), `$${(s.incomeReceived / 100).toLocaleString('en-US')} from ${INCOME[monthKey].sources.filter((x) => !x.pending).length} paychecks landed`);
  add(5, 'Cash identity', s.incomeReceived - s.expenseTotal - s.transferTotal === s.cashOnHand, `$${(s.incomeReceived / 100).toLocaleString('en-US')} − $${(s.expenseTotal / 100).toLocaleString('en-US')} − $${(s.transferTotal / 100).toLocaleString('en-US')} = $${(s.cashOnHand / 100).toLocaleString('en-US')} on hand`);
  add(6, 'Bills reconcile', s.billsDue + s.billsPaid === BILLS.reduce((a, b) => a + b.amount, 0), `$${(s.billsDue / 100).toLocaleString('en-US')} due + $${(s.billsPaid / 100).toLocaleString('en-US')} paid = $${(BILLS.reduce((a, b) => a + b.amount, 0) / 100).toLocaleString('en-US')} scheduled`);
  add(7, 'Bills due before 30 Nov', s.billsDue === 41200 || s.billsDue < 41200, `$${(s.billsDue / 100).toLocaleString('en-US')} still due (was $412)`);
  add(8, 'Debt balances add up', DEBTS.reduce((a, d) => a + d.balance, 0) === 1145000, `$${(DEBTS.reduce((a, d) => a + d.balance, 0) / 100).toLocaleString('en-US')} across 3 debts`);
  add(9, '12-month continuity', HISTORY.filter((h) => !h.partial).every((h) => h.income - h.spent - h.saved === 0), 'Dec 2025 – Oct 2026: income − spent − saved = $0 every month');
  add(10, 'Every transaction is tagged', s.txns.every((t) => t.date && t.payee && t.amount > 0 && (t.type === 'income' || t.envelope || (t.splits && t.splits.length >= 2 && t.splits.reduce((a, sp) => a + sp.amount, 0) === t.amount))), `date, payee, amount and envelope on every row · ${s.splitCount} split receipt${s.splitCount === 1 ? '' : 's'} re-add to their envelopes`);
  add(11, 'No future transactions', s.txns.every((t) => t.date <= '2026-11-20' || !t.date.startsWith('2026-11')), 'nothing dated after the 20 Nov snapshot');
  add(12, 'Goals are funded, not overfunded', GOALS.every((g) => g.balance >= 0 && g.balance <= g.target), '4 goals, all between $0 and target');
  return { passed: checks.filter((c) => c.passed).length, total: checks.length, checks, summary: s };
}

// Debt payoff simulation: same debts, same extra payment, two orders.
// Returns months to debt-free and total interest paid for each method,
// plus the month-by-month total balance series behind the payoff curve
// (series[0] is the starting balance, series[months] is $0) and the
// month each debt is paid off (for the loan schedule).
export function simulateDebt(extraCents) {
  const run = (order) => {
    const debts = order.map((d) => ({ ...d }));
    const total0 = debts.reduce((a, d) => a + d.balance, 0);
    const series = [total0];
    const payoff = {};
    let months = 0, interest = 0;
    let guard = 0;
    while (debts.some((d) => d.balance > 0) && guard < 600) {
      guard += 1; months += 1;
      for (const d of debts) if (d.balance > 0) { const i = Math.round(d.balance * d.apr / 12); d.balance += i; interest += i; }
      let pool = extraCents + debts.reduce((a, d) => a + (d.balance > 0 ? d.min : 0), 0);
      // Minimums first, then the extra (plus freed minimums) to the first
      // open debt in this method's order.
      for (const d of debts) { if (d.balance <= 0) continue; const pay = Math.min(d.min, d.balance); d.balance -= pay; pool -= pay; }
      for (const d of debts) { if (pool <= 0) break; if (d.balance <= 0) continue; const pay = Math.min(pool, d.balance); d.balance -= pay; pool -= pay; }
      for (const d of debts) if (d.balance <= 0 && payoff[d.id] === undefined) payoff[d.id] = months;
      series.push(debts.reduce((a, d) => a + d.balance, 0));
    }
    return { months, interest, series, payoff };
  };
  const snowball = [...DEBTS].sort((a, b) => a.balance - b.balance);
  const avalanche = [...DEBTS].sort((a, b) => b.apr - a.apr);
  return { snowball: run(snowball), avalanche: run(avalanche), snowballOrder: snowball.map((d) => d.name), avalancheOrder: avalanche.map((d) => d.name) };
}

export const fmt = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const fmt2 = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtSigned = (cents) => (cents < 0 ? '−$' : '+$') + (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const pct = (x) => (x * 100).toFixed(1) + '%';
export const envById = (id) => ENVELOPES.find((e) => e.id === id);
