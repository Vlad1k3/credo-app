# Introduction

### Why This Tool Exists

The official Credo Bank interface provides basic transaction history but lacks meaningful analytical tools. Questions like "What's my biggest expense category?", "Am I saving more this quarter than last?", or "How stable is my income month-to-month?" require exporting data to spreadsheets and building charts manually.

Most third-party financial tools require linking your bank account or uploading statements to external servers. Credo Statement Analyzer was built to answer these questions **without sacrificing privacy**.

### What It Does

The tool transforms raw bank exports into an interactive dashboard:

| Feature | Description |
|---------|-------------|
| **Income & Expense Summary** | Total income, total expense, net result, daily/monthly averages |
| **Category Breakdown** | Automatic categorization via 90+ merchant regex patterns into groups like Grocery, Taxi, Utilities |
| **Balance Timeline** | Line chart showing combined account balance over time |
| **Savings Rate** | Monthly savings rate chart: what percentage of income was saved each month |
| **Period Comparison** | Compare current month/week/year against the previous one with percentage changes |
| **Financial Insights** | Stability score, vampire expenses, day-of-week patterns, category trends, living standard progress |
| **Transaction Table** | Searchable, filterable, sortable list with detail modals |
| **Multi-Currency** | Automatic conversion between GEL, USD, EUR using historical NBG rates |
| **Custom Date Range** | Analyze any arbitrary date range (e.g., a vacation, a project, a quarter) |

### Privacy First

**Your financial data never leaves your device.**

- All file parsing happens in the browser via JavaScript
- Transaction data is stored in `localStorage` (never sent to any server)
- The only external request is fetching exchange rates from the [NBG API](https://nbg.gov.ge) — and only when you have multi-currency accounts
- The app works fully offline after first load
- Click "New File" to wipe all data from the browser instantly

### Technology

| Layer | Technology |
|-------|-----------|
| Framework | React 18 (Vite) |
| Charts | Chart.js + react-chartjs-2 |
| PDF Parsing | pdfjs-dist |
| Excel Parsing | SheetJS (xlsx) |
| Exchange Rates | National Bank of Georgia REST API |
| Styling | Vanilla CSS with custom properties, dark/light theme |
| Localization | English + Russian (built-in i18n context) |

---

*[Next: Upload & Setup](getting-started.md)*
