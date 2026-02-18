# Data Model

This page documents the internal data structures used by Credo Statement Analyzer.

### Transaction Object

Every transaction in the system follows this structure:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `date` | `string` | Date in `YYYY/MM/DD` format | `"2025/07/14"` |
| `operation` | `string` | Operation type (Georgian or English) | `"გადახდა"` |
| `debit` | `number` | Outgoing amount (0 if income) | `18.39` |
| `credit` | `number` | Incoming amount (0 if expense) | `0` |
| `balance` | `number` | Account balance after this transaction | `1542.67` |
| `description` | `string` | Full transaction description | `"გადახდა - SPAR 18.39 GEL"` |
| `beneficiaryName` | `string` | Name of the recipient | `"SPAR GEORGIA"` |
| `beneficiaryAccount` | `string` | IBAN of the recipient | `"GE12CD..."` |
| `type` | `string` | `"income"` or `"expense"` | `"expense"` |
| `amount` | `number` | Absolute transaction amount | `18.39` |
| `currency` | `string` | ISO 4217 currency code | `"GEL"` |

#### Derived fields (after currency conversion)

When transactions are converted to a display currency, two additional fields appear:

| Field | Type | Description |
|-------|------|-------------|
| `originalCurrency` | `string` | The currency before conversion |
| `currency` | `string` | Updated to the display currency |

The `debit`, `credit`, `balance`, and `amount` fields are all replaced with converted values.

#### Key invariants

- Every transaction has **exactly one** of `debit > 0` or `credit > 0` (never both)
- `type === "income"` if and only if `credit > 0`
- `amount === (type === "income" ? credit : debit)`
- `date` is always in `YYYY/MM/DD` format, making string comparison equivalent to chronological order
- Transactions are always sorted by `date` ascending

### Account Info Object

Extracted from the account details sheet/header of each uploaded file:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `Account Holder` | `string` | Name of the account owner | `"JOHN DOE"` |
| `Account Number` | `string` | IBAN or account number | `"GE12CD0360000012345678"` |
| `Account Currency` | `string` | ISO 4217 code | `"GEL"` |
| `Opening Balance` | `string` | Balance at start of statement period | `"1200.00"` |
| `Closing Balance` | `string` | Balance at end of statement period | `"1542.67"` |
| `Statement Period` | `string` | Date range of the statement | `"01.01.2025-31.01.2025"` |
| `Identification Number` | `string` | Personal ID number | `"01234567890"` |

!!! note
    Not all fields are guaranteed to be present. PDF statements may only extract a subset. Opening/Closing Balance values are strings and may contain commas.

### Storage Format

Data is persisted in `localStorage` as JSON:

```json
{
  "transactions": [
    {
      "date": "2025/07/14",
      "operation": "გადახდა",
      "debit": 18.39,
      "credit": 0,
      "balance": 1542.67,
      "description": "გადახდა - SPAR 18.39 GEL 14.07.2025",
      "beneficiaryName": "",
      "beneficiaryAccount": "",
      "type": "expense",
      "amount": 18.39,
      "currency": "GEL"
    }
  ],
  "accountInfos": [
    {
      "Account Holder": "JOHN DOE",
      "Account Number": "GE12CD0360000012345678",
      "Account Currency": "GEL",
      "Closing Balance": "1542.67"
    }
  ]
}
```

Storage key: `credo_statement_data`

#### Backward compatibility

Older versions stored just an array of transactions (no wrapper object). The loader handles this:

```javascript
if (Array.isArray(parsed)) {
    result = { transactions: parsed, accountInfos: [] };
}
```

Transactions without a `currency` field are automatically stamped with `"GEL"`.

### Exchange Rate Cache

Stored separately in `localStorage`:

```json
{
  "2025/07/14": {
    "USD": { "rate": 2.6856, "quantity": 1 },
    "EUR": { "rate": 2.9123, "quantity": 1 }
  }
}
```

Storage key: `credo_nbg_rates`

### Period Keys

The app uses string-based period keys for filtering and navigation:

| Period | Key format | Example |
|--------|-----------|---------|
| Day | `YYYY/MM/DD` | `"2025/07/14"` |
| Week | `YYYY/MM/DD` (Monday) | `"2025/07/14"` |
| Month | `YYYY/MM` | `"2025/07"` |
| Year | `YYYY` | `"2025"` |

All keys are lexicographically sortable, which makes chronological sorting trivial (`keys.sort()`).

### Category Result

The output of the `categorize()` function:

```javascript
{ name: "Grocery", icon: "🛒" }
```

Results are cached in a `WeakMap` keyed by the transaction object reference, so repeated calls for the same transaction object return instantly.

### Summary Object

The output of `calculateSummary()`:

| Field | Type | Description |
|-------|------|-------------|
| `totalIncome` | `number` | Sum of all credits |
| `totalExpense` | `number` | Sum of all debits |
| `net` | `number` | Income - Expense |
| `avgDailyExpense` | `number` | Expense / unique days |
| `avgDailyIncome` | `number` | Income / unique days |
| `avgMonthlyExpense` | `number` | Expense / unique months |
| `avgMonthlyIncome` | `number` | Income / unique months |
| `startingBalance` | `number` | Reconstructed starting balance |
| `currentBalance` | `number` | Last transaction's balance |
| `totalTransactions` | `number` | Count of transactions |
| `numDays` | `number` | Unique days with transactions |
| `numMonths` | `number` | Unique months with transactions |
| `currencies` | `string[]` | Detected currencies |
| `isMultiCurrency` | `boolean` | More than one currency |
| `dateRange` | `object` | `{ from: "YYYY/MM/DD", to: "YYYY/MM/DD" }` |
| `commonAdjustment` | `number?` | Reconciliation with closing balance (if needed) |
