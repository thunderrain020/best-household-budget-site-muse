// AlderLedger — offline EN / ID strings. The default is English; the
// toggle re-renders every view in Indonesian. Numbers, dates and money
// stay in US format in both languages so the ledger never changes meaning.

export const STRINGS = {
  en: {
    tagline: 'Household Cash-Flow, Zero-Based Envelopes & Debt Planner',
    navOverview: 'Overview', navEnvelopes: 'Envelopes & Compare', navAnalytics: 'Analytics & Debt', navLedger: 'Ledger', navAudit: 'Audit & Bills',
    searchPh: 'Search ledger…', addEntry: '+ Add Entry', menu: 'Menu',
    kpiIncome: 'Monthly Net Income', kpiSpent: 'Total Spent', kpiSafe: 'Safe-to-Spend / Day', kpiSaved: 'Net Saved + Debt Extra',
    kpiRate: 'Savings Rate', kpiBills: 'Bills Still Due', kpiRunway: 'Emergency Runway', kpiZero: 'Zero-Based Balance',
    auditPass: 'audit checks PASS', auditOpen: 'Open the live audit',
    actionNeeded: 'Action Needed', moveBtn: 'Move $48 from Fun', moved: 'Moved $48 · Dining plan is now $468, Fun $192',
    cashflow: 'Cash Flow & Envelope Allocation', trend: 'Checking Cushion & 6-Month Trend',
    upcoming: 'Upcoming Bills', latest: 'Latest Spending',
    markPaid: 'Mark Paid', paid: 'Paid',
    envTitle: 'Envelopes, 50/30/20 & Comparison', allocator: '50/30/20 Allocator', detail: 'Envelope Detail',
    compare: '2-Month / 2-Scenario Comparison', ranked: 'Ranked Envelopes',
    applySplit: 'Apply 50/30/20 Split', addCategory: 'Add Category',
    analyticsTitle: 'Deep Analytics, Debt Payoff & Goals', ledgerTitle: 'Transaction Ledger', auditTitle: 'Audit, Bills & Guides',
    resetDemo: 'Reset Demo Data', downloadCsv: 'Download CSV', downloadJson: 'Download JSON', copySummary: 'Copy Summary', openLedger: 'Open Ledger',
    addTxn: 'Add Transaction', editTxn: 'Edit Transaction', save: 'Save', cancel: 'Cancel', delete: 'Delete',
    csvBtn: 'CSV', jsonBtn: 'JSON',
    all: 'All', needs: 'Needs', wants: 'Wants', savings: 'Savings & Debt',
    highestSpend: 'Highest Spend', bestCushion: 'Best Cushion',
    monthClosed: 'Month closed', snapshot: 'Snapshot Fri 20 Nov 2026 · figures to 20 Nov',
  },
  id: {
    tagline: 'Arus Kas Rumah Tangga, Amplop Berbasis Nol & Perencana Utang',
    navOverview: 'Ringkasan', navEnvelopes: 'Amplop & Bandingkan', navAnalytics: 'Analitik & Utang', navLedger: 'Buku Kas', navAudit: 'Audit & Tagihan',
    searchPh: 'Cari di buku kas…', addEntry: '+ Tambah Entri', menu: 'Menu',
    kpiIncome: 'Penghasilan Bersih Bulanan', kpiSpent: 'Total Belanja', kpiSafe: 'Aman Dibelanjakan / Hari', kpiSaved: 'Ditabung + Bayar Utang',
    kpiRate: 'Tingkat Menabung', kpiBills: 'Tagihan Belum Dibayar', kpiRunway: 'Dana Darurat', kpiZero: 'Saldo Berbasis Nol',
    auditPass: 'pemeriksaan audit LULUS', auditOpen: 'Buka audit langsung',
    actionNeeded: 'Perlu Tindakan', moveBtn: 'Pindah $48 dari Fun', moved: '$48 dipindah · Rencana Dining kini $468, Fun $192',
    cashflow: 'Arus Kas & Alokasi Amplop', trend: 'Saldo Rekening & Tren 6 Bulan',
    upcoming: 'Tagihan Berikutnya', latest: 'Belanja Terakhir',
    markPaid: 'Tandai Lunas', paid: 'Lunas',
    envTitle: 'Amplop, 50/30/20 & Perbandingan', allocator: 'Alokator 50/30/20', detail: 'Detail Amplop',
    compare: 'Perbandingan 2 Bulan / 2 Skenario', ranked: 'Amplop Terurut',
    applySplit: 'Terapkan 50/30/20', addCategory: 'Tambah Kategori',
    analyticsTitle: 'Analitik Mendalam, Pelunasan Utang & Tujuan', ledgerTitle: 'Buku Kas Transaksi', auditTitle: 'Audit, Tagihan & Panduan',
    resetDemo: 'Atur Ulang Data Demo', downloadCsv: 'Unduh CSV', downloadJson: 'Unduh JSON', copySummary: 'Salin Ringkasan', openLedger: 'Buka Buku Kas',
    addTxn: 'Tambah Transaksi', editTxn: 'Ubah Transaksi', save: 'Simpan', cancel: 'Batal', delete: 'Hapus',
    csvBtn: 'CSV', jsonBtn: 'JSON',
    all: 'Semua', needs: 'Kebutuhan', wants: 'Keinginan', savings: 'Tabungan & Utang',
    highestSpend: 'Belanja Tertinggi', bestCushion: 'Sisa Terbaik',
    monthClosed: 'Bulan ditutup', snapshot: 'Cuplikan Jum 20 Nov 2026 · angka sampai 20 Nov',
  },
};

export function t(lang, key) {
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}
