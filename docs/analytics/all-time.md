# All Time View

The **All Time** tab is the default landing page. It aggregates every loaded transaction to show the complete financial picture.

### Summary Cards

Six metric cards are displayed at the top:

| Card | Formula | Description |
|------|---------|-------------|
| **Total Income** | $\sum \text{credit}_i$ | Sum of all credit (incoming) amounts |
| **Total Expense** | $\sum \text{debit}_i$ | Sum of all debit (outgoing) amounts |
| **Exchange Adjustment** | $\text{Closing Balance} - (\text{Income} - \text{Expense})$ | Purple card. Shown only when the difference exceeds 0.05. See [details below](#exchange-adjustment) |
| **Net Result** | $\text{Income} - \text{Expense} + \text{Adjustment}$ | Overall balance change. Green if positive, red if negative |
| **Avg. Daily Expense** | $\frac{\text{Total Expense}}{\text{Unique Days}}$ | Average spending per day that had transactions |
| **Avg. Monthly Expense** | $\frac{\text{Total Expense}}{\text{Unique Months}}$ | Average spending per month |
| **Current Balance** | Last transaction's `balance` field | The closing balance from the most recent transaction |

### Exchange Adjustment

The **Exchange Adjustment** (Russian: **Курсовая разница**) is a purple card that appears between Total Expenses and Net Result. It represents the difference between the bank's authoritative closing balance and the calculated income-minus-expense total.

#### Why it exists

The simple formula `Income − Expense` does not always match the real account balance. The adjustment bridges this gap. There are several reasons the gap can occur:

1. **Excluded internal transfers.** When the noise filter is enabled (default), transactions categorized as *Currency Exchange* or *Self Transfer* are excluded from analytics. These transactions may carry hidden fees or rate spreads that affect the real balance but are no longer visible in the income/expense totals.

2. **Exchange rate fluctuations.** When multiple currencies are involved, all amounts are converted to the display currency using historical NBG rates. The bank's actual conversion rate at the time of a transfer may differ from the official NBG rate, creating a small discrepancy.

3. **Transactions outside the statement range.** Bank statements do not always contain the complete history. If the exported period starts after the account was opened or ends before the last transaction, some operations fall outside the analyzer's visibility. The opening/closing balance reported by the bank accounts for these invisible transactions, but the calculated income/expense totals do not.

4. **Partial statement exports.** When generating a statement, part of the period may have been omitted. The bank's closing balance still reflects the true account state, but the exported transactions are incomplete, creating a gap.

#### Formula

$$
\text{Adjustment} = \text{Combined Closing Balance} - (\text{Total Income} - \text{Total Expense})
$$

Where:

- **Combined Closing Balance** — the sum of each account's closing balance (from XLSX/PDF headers), converted to the display currency using the NBG rate on the last transaction date
- **Total Income** and **Total Expense** — calculated from the filtered transaction set (after noise filter and currency conversion)

#### Display rules

- The card is **only shown** when `|Adjustment| > 0.05` (to ignore floating-point rounding noise)
- Positive values are prefixed with `+`, negative values display with a minus sign
- The card color is **purple** (`#8b5cf6`), distinct from income (green) and expense (red)
- A tooltip reads: *"Compensates for excluded internal transfers and exchange rate fluctuations"*
- When the adjustment is applied, the **Net Result** card displays the bank's closing balance (the authoritative value), not the raw `Income − Expense`

!!! info "When the card does not appear"
    If no account metadata is available (e.g., the statement file lacks header information), the closing balance is unknown, and the adjustment cannot be calculated. In this case, the card is simply not shown.

### Monthly Bar Chart

A stacked/grouped bar chart showing **Income** (green) and **Expense** (red) per calendar month.

- X-axis: months (e.g., "Jan", "Feb", ...)
- Y-axis: amount in display currency
- Hovering shows a tooltip with exact values
- Months are derived by grouping transactions on `date.substring(0, 7)` (format `YYYY/MM`)

### Balance Timeline

A line chart showing the **combined account balance** over time.

How it's built:

1. Transactions are grouped by account (original currency)
2. For each unique date, the balance for each account is the **last known balance on or before that date** (found via binary search)
3. All account balances for the same date are summed
4. The result is a smooth timeline that never goes negative (it reflects actual bank balances, not running totals)

!!! note "Multi-account balances"
    If you have GEL and USD accounts and are viewing in GEL, each USD balance is converted to GEL at the rate on that specific date before summing.

### Category Breakdown

A doughnut chart showing expense distribution across categories, paired with a ranked list.

- Only **debit transactions** (expenses) are included
- Each transaction is categorized by matching its `operation + description` against 91 regex rules (see [Categories](categories.md))
- Categories are sorted by total descending
- Clicking a category in the chart or list filters the transaction table below
- Expanding a category reveals a merchant sub-list sorted by spend

### Top Merchants

A ranked bar list showing the top 10 merchants by total spend. Merchant names are extracted from the transaction description using pattern matching:

- Card payments: `გადახდა - MERCHANT_NAME 18.39 GEL` → `MERCHANT_NAME`
- Utility payments: `გაზი - სოკარ ჯორჯია` → `სოკარ ჯორჯია`
- Fallback: beneficiary name or operation type

### Savings Rate Chart

A bar chart showing the **monthly savings rate** — the percentage of income that was saved each month.

$$
\text{Savings Rate}_m = \frac{\text{Income}_m - \text{Expense}_m}{\text{Income}_m} \times 100\%
$$

- Green bars indicate positive savings (saved money)
- Red bars indicate negative savings (spent more than earned)
- Below the chart, a scrollable list shows each month's exact rate, income, and expense values

See [Formulas](formulas.md#savings-rate) for the complete formula.

### Financial Insights

Five analytical cards available only in the All Time view:

1. **Financial Stability Score** — composite 0–100 score based on income stability, expense stability, and savings consistency
2. **Day-of-Week Patterns** — bar chart showing average daily expense per weekday (Mon–Sun)
3. **Vampire Expenses** — small recurring charges (< 15 GEL) that appear 3+ times
4. **Category Trends** — categories with the biggest change between the first half and second half of your data
5. **Living Standard Progress** — comparison of average income, expense, and savings between the first and second halves

See [Financial Insights](insights.md) for detailed formulas and methodology.

### Transaction Table

A paginated, searchable, sortable table of all transactions with:

- **Search** — filters by operation, description, beneficiary name (debounced at 200ms)
- **Type filter** — All / Income / Expense buttons
- **Sort** — click column headers to sort by date, amount, or balance
- **Detail modal** — click any row to see full transaction details including category, beneficiary account, etc.
- **Category/merchant filter** — clicking a category or merchant in the breakdown above filters the table
