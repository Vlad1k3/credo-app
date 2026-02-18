# Parsing Pipeline

This page documents how Credo Statement Analyzer converts raw bank files into structured transaction objects.

### Overview

```
File (.xlsx / .pdf / .csv)
    |
    v
detectFileType(extension)
    |
    ├── .xlsx → parseXLSX()
    ├── .pdf  → parsePDF()
    └── .csv  → parseCSVFile()
    |
    v
Normalized Transaction Objects
    |
    v
Currency stamping (from accountInfo / filename / default)
    |
    v
Chronological sort
```

### XLSX Parser

#### Sheet detection

The parser scans all sheet names in the workbook looking for:

| Sheet type | Matched names |
|-----------|---------------|
| Transactions | Contains `"transaction"` (EN) or `"ტრანზაქცი"` (GE) |
| Account Details | Contains `"account"`, `"detail"` (EN) or `"დეტალები"` (GE) |

If no Transactions sheet is found, the **last sheet** in the workbook is used as fallback.

#### Conversion pipeline

1. Read the Excel file as `Uint8Array` using `FileReader`
2. Parse with SheetJS: `XLSX.read(data, { type: 'array', cellDates: true })`
3. Convert to CSV string: `XLSX.utils.sheet_to_csv(sheet, { dateNF: 'yyyy/mm/dd' })`
4. Parse the CSV string with the internal `parseCSV()` function

#### Account info extraction

From the Account Details sheet, key-value pairs are read (column A = key, column B = value). Georgian keys are mapped to English:

| Georgian | English |
|----------|---------|
| ანგარიშის მფლობელი | Account Holder |
| საიდენტიფიკაციო ნომერი | Identification Number |
| ამონაწერის პერიოდი | Statement Period |
| ანგარიშის ნომერი | Account Number |
| ანგარიშის ვალუტა | Account Currency |
| საწყისი ნაშთი | Opening Balance |
| საბოლოო ნაშთი | Closing Balance |

### PDF Parser

#### Format detection

The parser reads page 1 text and checks for the presence of `"Account Statement"` or `"ამონაწერი"`. This determines whether the file is:

- **Full statement** → `parsePDFStatement()` — multi-page transaction table
- **Payment receipt** → `parsePDFReceipt()` — single transaction document

#### Full statement parsing

This is the most complex parser. It reconstructs a table from positioned text items.

##### Step 1: Extract text items

Using `pdfjs-dist`, each page is processed to extract text items with their position:

```javascript
{
    str: "318.58",     // the text content
    x: 245,            // horizontal position (pixels from left)
    y: 382,            // vertical position (pixels from bottom)
    page: 1            // page number
}
```

##### Step 2: Detect column boundaries

The parser scans page 1 for header text (e.g., "Date", "Turnover (DB)", "Balance") and records their X positions. Column boundaries are set at the midpoint between adjacent headers.

| Column | Left boundary | Right boundary |
|--------|--------------|----------------|
| Date | 0 | mid(Date, Operation) |
| Operation | mid(Date, Op) | mid(Op, Debit) |
| Debit | mid(Op, DB) | mid(DB, Credit) |
| Credit | mid(DB, CR) | mid(CR, Balance) |
| Balance | mid(CR, Bal) | mid(Bal, Description) |
| Description | mid(Bal, Desc) | mid(Desc, BenefName) |
| Beneficiary Name | mid(Desc, BName) | mid(BName, BAccount) |
| Beneficiary Account | mid(BName, BAcc) | page right edge |

If headers aren't found (e.g., Georgian-only statement), default hardcoded boundaries are used.

!!! info "Split header handling"
    Some headers span two PDF text items (e.g., `"Turnover"` + `"(DB)"` as separate items). The parser handles this by searching for nearby items within 80px horizontal distance on the same Y line.

##### Step 3: Identify row starts

A row starts wherever a date pattern `DD.MM.YYYY` appears at x < DATE_MAX. All items between consecutive row starts are assigned to that row.

##### Step 4: Assign items to columns

For each row, items are sorted into columns based on their X position relative to the detected boundaries. Header text items are pre-filtered out.

##### Step 5: Build transaction objects

- Date: converted from `DD.MM.YYYY` to `YYYY/MM/DD`
- Debit/Credit/Balance: extracted using monetary pattern matching (`/^\d+\.\d{2}$/`)
- Description and beneficiary: joined from all text items in those columns

#### Payment receipt parsing

A simpler regex-based parser that extracts:

- Operation date: from `"Operation Date YYYY-MM-DD"` pattern
- Amount: from `"Amount: 1,234.56 GEL"` pattern
- Details: from `"Operation Details: ..."` pattern
- Receiver: name and account number from labeled fields

Receipts always produce a single expense transaction.

### CSV Parser

#### Structure

Credo Bank CSV files have:

1. **Header section** — key-value pairs (account info) before data rows
2. **Column header row** — typically `Date, Operation, Turnover (DB), Turnover (Cr), Balance, Description, ...`
3. **Data rows** — one per transaction

#### Parsing rules

| Challenge | Solution |
|-----------|----------|
| Comma inside numbers | Quoted fields: `"1,220.09"` — parser respects quote boundaries |
| Multiline descriptions | If a line doesn't start with `YYYY/`, it's appended to the previous transaction's operation |
| Unclosed quotes | Lines are joined until quote count is even |
| Georgian headers | Mapped to English via the same key map as XLSX |

#### Amount parsing

All amounts go through:

```javascript
function parseAmount(str) {
    const cleaned = str.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}
```

This handles: `"1,220.09"` → `1220.09`, `""` → `0`, `"abc"` → `0`.

### Multi-File Merging

When multiple files are uploaded at once via `parseFiles()`:

1. Each file is parsed independently
2. Currency is determined per file (accountInfo > filename > default)
3. All transactions are stamped with their currency
4. Transactions from all files are concatenated
5. The combined array is sorted by date ascending
6. All account info objects are collected

#### Adding files later

When using "+ Add Files" from the dashboard, a deduplication step runs:

```javascript
const makeKey = (tx) =>
    `${tx.date}|${tx.debit}|${tx.credit}|${tx.operation}|${tx.currency}|${tx.balance}`;

const existingKeys = new Set(existingTransactions.map(makeKey));
const newTx = parsedTransactions.filter(tx => !existingKeys.has(makeKey(tx)));
```

This prevents duplicates when re-uploading files that overlap with existing data.

### Currency Detection from Filenames

If the account info sheet doesn't specify a currency, the parser tries to detect it from the filename:

| Pattern | Regex |
|---------|-------|
| `_GEL_`, `_USD_` | `/_(\w+)_/i` |
| `.GEL.`, `.USD.` | `/[._-](\w+)[._-]/i` |
| `GEL.xlsx` | `/(\w+)\.(PDF\|XLSX?\|CSV)/i` |
| `STATEMENT_USD` | `/STATEMENT[._-](\w+)/i` |
| `GEL STATEMENT` | `/(\w+)\s*STATEMENT/i` |

Supported currencies: GEL, USD, EUR, RUB, GBP.
