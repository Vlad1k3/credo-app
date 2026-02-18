# Time Periods

Credo Analytics lets you slice your data into five time perspectives for granular comparisons.

### Available Periods

#### Year View

Aggregates one calendar year of transactions.

- **Period key format**: `YYYY` (e.g., `2024`)
- **Filter**: all transactions where `date.startsWith("2024")`
- **Chart**: daily income/expense bars within that year
- **Navigation**: step through available years with `← →`

#### Month View

One calendar month.

- **Period key format**: `YYYY/MM` (e.g., `2024/07`)
- **Filter**: all transactions where `date.startsWith("2024/07")`
- **Chart**: daily income/expense bars within that month

#### Week View

Monday through Sunday of one ISO week.

- **Period key format**: `YYYY/MM/DD` (the Monday of that week)
- **Filter**: all transactions from Monday to Sunday (7 days)
- **Week start calculation**: `dayOfWeek === 0 ? date - 6 : date - (dayOfWeek - 1)` (Monday-based)
- **Display format**: `"4 Jul — 10 Jul, 2024"`

#### Day View

Single day.

- **Period key format**: `YYYY/MM/DD`
- **Filter**: exact date match
- **Display format**: `"14 January 2024"`

!!! note
    Day view does not include period comparison (there's no meaningful "previous day" pattern).

### Period Navigation

When any period tab (Year/Month/Week/Day) is active:

1. The app computes all available period keys from the transaction data by scanning every transaction date
2. Keys are sorted chronologically
3. A navigation bar shows `← Current Period →` with the current index
4. The center label is clickable — it opens the **Period Picker** overlay

#### Period Picker

The picker shows a scrollable grid/list of all available periods:

- For **Year/Month/Week**: a grid of clickable period labels
- For **Custom**: two date inputs (from/to)
- Click a period to jump to it instantly
- Click outside or press the close button to dismiss

### Period Comparison

For all period tabs except Day, a **comparison card** shows how the current period compares to the previous one.

#### What is compared

| Metric | Formula | "Good" direction |
|--------|---------|-----------------|
| Avg. Daily Expense | $\frac{\text{Total Expense}}{\text{Unique Days}}$ | Lower is better |
| Avg. Daily Income | $\frac{\text{Total Income}}{\text{Unique Days}}$ | Higher is better |
| Savings Rate | $\frac{\text{Income} - \text{Expense}}{\text{Income}} \times 100$ | Higher is better |

#### Percentage change formula

$$
\Delta\% = \frac{\text{Current} - \text{Previous}}{|\text{Previous}|} \times 100
$$

Special case: if `Previous = 0` and `Current > 0`, the change is shown as `+100%`.

For savings rate, the change is shown in **percentage points** (pp), not percent:

$$
\Delta_{pp} = \text{Current Rate} - \text{Previous Rate}
$$

#### Category changes

The top 5 categories with the largest absolute spending change between periods are shown:

$$
\Delta_{\text{cat}} = \text{Current Spend}_{\text{cat}} - \text{Previous Spend}_{\text{cat}}
$$

Green (↓) means you spent less, red (↑) means you spent more.

### How "Previous Period" Is Determined

| Current Tab | Previous Period |
|-------------|----------------|
| Year `2024` | All transactions in `2023` |
| Month `2024/07` | The previous available month key (e.g., `2024/06`) |
| Week `2024/07/01` | The previous available week key |
| Day | No comparison available |
| Custom | No comparison available |

!!! info
    The previous period uses the **previous available key** from the sorted key array, not a calendar offset. This means if you have data for January and March but not February, March's previous period is January.
