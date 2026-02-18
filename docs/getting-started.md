# Upload & Setup

### Supported File Formats

Credo Statement Analyzer accepts three file types exported from Credo Bank:

#### XLSX (Excel) — Recommended

The richest format. The parser looks for two sheets:

- **Account Details** (or "დეტალები") — account holder, account number, currency, opening/closing balance
- **Transactions** (or "ტრანზაქცი") — the transaction table

If these sheet names aren't found, the parser falls back to the last sheet in the workbook.

#### PDF

Two PDF formats are supported:

1. **Full Account Statement** — multi-page table with columns: Date, Operation, Debit, Credit, Balance, Description, Beneficiary. Detected by the presence of "Account Statement" or "ამონაწერი" in the header.
2. **Payment Order Receipt** — single-transaction receipt. The parser extracts date, amount, operation details, and receiver/sender info.

!!! info "How PDF parsing works"
    The parser uses `pdfjs-dist` to extract text items with their X/Y positions from each page. It dynamically detects column boundaries from header positions (e.g., "Turnover (DB)", "Balance", "Description") and assigns text items to columns based on their X coordinate. Date entries (`DD.MM.YYYY` at `x < 100`) mark row starts.

#### CSV

Plain text comma-separated format. The parser:

1. Extracts account info from header lines (before the first data row)
2. Handles quoted fields with embedded commas (e.g., `"1,220.09"`)
3. Handles multiline descriptions (lines not starting with a date are appended to the previous row)
4. Translates Georgian header keys to English automatically

### How to Upload

1. **Drag & Drop** — drag file(s) from your file explorer onto the upload zone
2. **Click to Browse** — click the upload button and select files

!!! tip "Multiple files"
    You can upload **multiple files at once**. The app automatically merges and deduplicates transactions across files. This works for:

    - Multiple months of the same account
    - Different accounts (GEL + USD)
    - Mixed formats (some XLSX, some PDF)

### Currency Detection

The app determines each file's currency through this priority chain:

1. **Account Info sheet** — `Account Currency` field from XLSX/CSV headers
2. **Filename pattern** — detects currency codes in filenames like `MYCREDO_GEL_STATEMENT_...` or `statement_USD.pdf`
3. **Default** — falls back to `GEL`

Supported filename patterns:

| Pattern | Example |
|---------|---------|
| `_GEL_` | `MYCREDO_GEL_STATEMENT_2025.xlsx` |
| `.USD.` | `statement.USD.pdf` |
| `-EUR-` | `export-EUR-jan.csv` |
| `GEL.xlsx` | `GEL.xlsx` |
| `STATEMENT_USD` | `STATEMENT_USD.pdf` |

### Deduplication

When adding files to an existing dataset (via the "+ Add Files" button), the app prevents duplicate transactions using a composite key:

```
key = date | debit | credit | operation | currency | balance
```

Only transactions whose key doesn't already exist are added. This means you can safely re-upload overlapping files without getting duplicates.

### Data Storage

Parsed data is stored in the browser's `localStorage` under the key `credo_statement_data`. This means:

- Data persists across page refreshes and browser restarts
- Data is scoped to the browser and origin (not shared across devices)
- Clearing browser data or clicking "New File" removes everything

!!! warning "Storage limits"
    `localStorage` has a ~5 MB limit in most browsers. For very large datasets (thousands of transactions across many accounts), you may approach this limit. The app handles quota errors gracefully — if it can't save, it will continue working from memory.

### Offline Usage

After the first page load, the app works fully offline. To verify:

1. Open the app and load it once
2. Disconnect from the internet
3. Upload a bank statement
4. The dashboard will load and function normally

The only feature that requires internet is **exchange rate fetching** for multi-currency accounts (from the NBG API).
