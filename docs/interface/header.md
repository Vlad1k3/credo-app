# Header & Controls

The header is the control center of the dashboard, providing access to global settings, file management, and data filtering.

### Controls

| Control | Label | Function |
|---------|-------|----------|
| **Theme Toggle** | `🌙` / `☀️` | Switches between light and dark themes. Saved in `localStorage`. |
| **Language** | `RU` / `EN` | Toggles the interface language between English and Russian. |
| **Noise Filter** | Filter icon | Hides internal transfers (self-transfers between own accounts and currency exchanges) to show only real income/expense. Active by default. |
| **+ Add Files** | `+ Add Files` | Upload additional statement files to merge with existing data. New transactions are deduplicated automatically. |
| **New File** | `New File` | Clears all transaction data from the browser and returns to the upload screen. |

### Account Information

Below the title, a summary line shows:

- **Account Holder** — name from the first uploaded file's account info
- **Account Numbers** — if multiple accounts are loaded, shows count (e.g., "3 accounts")
- **Currencies** — grouped by currency with counts (e.g., "2x GEL + USD")

Example: `JOHN DOE · 3 accounts · 2x GEL + USD`

### Date Range & Transaction Count

The second line shows:

- **Date Range** — start and end dates of all loaded transactions (format: `DD.MM.YYYY`)
- **Transaction Count** — total number of transactions being analyzed

Example: `01.01.2024 — 31.12.2024 · 1,247 transactions`

### Currency Toggle

Appears only when multiple account currencies are detected. Click a currency code (e.g., **USD**, **GEL**) to convert all charts, summaries, and totals to that currency using historical exchange rates.

!!! info "How conversion works"
    When you switch to a non-primary currency, the app fetches historical rates from the National Bank of Georgia for every unique transaction date, then converts each transaction's debit, credit, balance, and amount fields individually. See [Exchange Rates](../analytics/exchange-rates.md) for details.

### Noise Filter

When active (default), the noise filter hides two categories of transactions:

1. **Self Transfers** — money moved between your own Credo accounts (matched by `საკუთარ ანგარიშებს` pattern)
2. **Currency Exchanges** — buying/selling currency within your accounts (matched by `კონვერტაცია`, `Exchange`, etc.)

This prevents internal money movements from inflating your income and expense totals. For example, transferring 1000 GEL from checking to savings would otherwise appear as both a 1000 GEL expense and 1000 GEL income.

!!! tip
    Toggle the filter off if you want to see the complete transaction history including internal movements.
