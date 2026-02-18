# Dashboard Overview

The dashboard is the main interface after uploading files. It provides both high-level overviews and deep drill-downs into your financial data.

### Layout Structure

```
+----------------------------------------------+
|  Header (controls, account info, date range)  |
+----------------------------------------------+
|  Tab Bar: All | Year | Month | Week | Day | Custom  |
+----------------------------------------------+
|  Period Navigation (← current period →)       |
+----------------------------------------------+
|                                              |
|  Tab Content                                 |
|  - Summary cards                             |
|  - Charts (bar, line)                        |
|  - Category breakdown (doughnut + list)       |
|  - Period comparison                         |
|  - Financial insights (All Time only)         |
|  - Transaction table                         |
|                                              |
+----------------------------------------------+
|  Footer (privacy note)                       |
+----------------------------------------------+
```

### Tab System

The dashboard has 6 tabs, each providing a different time perspective:

| Tab | Shows | Navigation |
|-----|-------|-----------|
| **All Time** | Entire loaded dataset | No period nav |
| **Year** | One calendar year | `← 2023` / `2024 →` |
| **Month** | One calendar month | `← January` / `February →` |
| **Week** | Monday–Sunday | `← Week 4` / `Week 5 →` |
| **Day** | Single day | `← 14 Jan` / `15 Jan →` |
| **Custom** | User-defined range | Date picker |

Switching tabs triggers a fade-slide animation on the content area. The `key={activeTab}` prop on the content wrapper re-mounts the view on each tab change.

### All Time Tab

Displays the complete financial picture. Includes:

- **Summary cards** — income, expense, net, average daily/monthly, current balance
- **Monthly bar chart** — income vs. expense per month
- **Balance timeline** — line chart of combined account balance over time
- **Category breakdown** — doughnut chart + ranked list of expense categories
- **Top merchants** — ranked list of highest-spend merchants
- **Savings rate chart** — monthly savings as percentage of income
- **Financial insights** — stability score, vampire expenses, day patterns, category trends, living standard

See [All Time View](../analytics/all-time.md) for details.

### Period Tabs (Year / Month / Week / Day)

All period tabs share the same layout:

- **Summary cards** — income, expense, net, transaction count for that period
- **Bar chart** — daily breakdown within the period
- **Category breakdown** — expense categories for that period only
- **Period comparison** — compares metrics against the previous period
- **Transaction table** — filtered to the selected period

See [Time Periods](../analytics/periods.md) for details.

### Period Navigation

When a period tab is active, a navigation bar appears:

- **Left Arrow (←)** — go to the previous period
- **Center Label** — shows the current period name. Click to open the **Period Picker** (calendar/list selector)
- **Right Arrow (→)** — go to the next period

The arrows are disabled at the boundaries (first/last available period).

### Mobile Experience

On screens narrower than 768px:

- **Stacking** — side-by-side elements (chart + list) stack vertically
- **Touch targets** — all interactive elements have a minimum 44px touch area
- **Collapsible sections** — category lists and insight cards collapse to headers with tap-to-expand
- **Simplified charts** — tooltips and hover effects are disabled on touch devices to prevent interference with scrolling
- **Mobile transaction list** — the desktop table is replaced with a compact card-based list

### Currency Handling

If uploaded files contain multiple currencies (e.g., GEL and USD accounts):

1. A **Currency Toggle** appears in the header
2. The app defaults to the primary account currency (first uploaded account)
3. Clicking another currency converts all values using historical NBG exchange rates
4. Each transaction is converted individually using the rate on its specific date
5. Closing balances from account info are also converted for the combined balance

See [Exchange Rates](../analytics/exchange-rates.md) for the conversion algorithm.
