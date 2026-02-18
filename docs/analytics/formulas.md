# Formulas & Calculations

## Core Financial Metrics

### Total Income

$$
\text{Total Income} = \sum_{i=1}^{N} \text{credit}_i
$$

Where `credit` is the incoming amount for each transaction. Transactions with `credit = 0` are expenses and are excluded from this sum.

**Example**: If you received three payments of 1000, 2500, and 500 GEL:

$$
\text{Total Income} = 1000 + 2500 + 500 = 4000 \text{ GEL}
$$

### Total Expense

$$
\text{Total Expense} = \sum_{i=1}^{N} \text{debit}_i
$$

Where `debit` is the outgoing amount. Transactions with `debit = 0` are income and excluded.

### Net Result

$$
\text{Net} = \text{Total Income} - \text{Total Expense}
$$

- **Positive** (green): you earned more than you spent
- **Negative** (red): you spent more than you earned

### Average Daily Expense

$$
\text{Avg Daily Expense} = \frac{\text{Total Expense}}{D}
$$

Where $D$ is the number of **unique days** that have at least one transaction (not calendar days).

**Example**: 3000 GEL spent over 20 unique days = 150 GEL/day

### Average Monthly Expense

$$
\text{Avg Monthly Expense} = \frac{\text{Total Expense}}{M}
$$

Where $M$ is the number of **unique months** that have at least one transaction.

---

## Balance

### Starting Balance

Derived from the first transaction in the dataset:

$$
\text{Starting Balance} = \text{balance}_1 - (\text{credit}_1 - \text{debit}_1)
$$

This reconstructs the balance that existed *before* the first transaction.

### Current Balance

The `balance` field of the last transaction in the sorted dataset.

### Combined Closing Balance (Multi-Account)

When multiple account files are loaded, each provides a `Closing Balance` in its account info. The combined balance is:

$$
\text{Combined Balance} = \sum_{a \in \text{accounts}} \text{convert}(\text{Closing Balance}_a, \text{currency}_a, \text{display currency})
$$

If the combined closing balance differs from the calculated net by more than 0.05, an adjustment term is added:

$$
\text{Adjustment} = \text{Combined Closing Balance} - \text{Net}
$$

This reconciles discrepancies from transactions outside the exported date range.

---

## Savings Rate

Calculated per calendar month:

$$
\text{Savings}_m = \text{Income}_m - \text{Expense}_m
$$

$$
\text{Savings Rate}_m = \begin{cases} \frac{\text{Income}_m - \text{Expense}_m}{\text{Income}_m} \times 100 & \text{if } \text{Income}_m > 0 \\ 0 & \text{otherwise} \end{cases}
$$

**Example**:

| Month | Income | Expense | Savings | Rate |
|-------|--------|---------|---------|------|
| Jan | 5000 | 3500 | 1500 | 30.0% |
| Feb | 5000 | 5200 | -200 | -4.0% |
| Mar | 0 | 800 | -800 | 0% |

---

## Period Comparison

Compares the current period against the previous period using daily averages to normalize for different period lengths.

### Period Stats

For a set of transactions in a period:

$$
\text{Avg Daily Income} = \frac{\sum \text{credit}_i}{D}
$$

$$
\text{Avg Daily Expense} = \frac{\sum \text{debit}_i}{D}
$$

$$
\text{Savings Rate} = \frac{\text{Income} - \text{Expense}}{\text{Income}} \times 100
$$

### Percentage Change

$$
\Delta\% = \frac{\text{Current} - \text{Previous}}{|\text{Previous}|} \times 100
$$

Edge case: if $\text{Previous} = 0$ and $\text{Current} > 0$, the change is $+100\%$.

For savings rate, the change is in **percentage points**:

$$
\Delta_{pp} = \text{Savings Rate}_{\text{current}} - \text{Savings Rate}_{\text{previous}}
$$

### Category Changes

Per-category spending change between current and previous period:

$$
\Delta_{\text{cat}} = \sum_{\text{current}} \text{debit}_{\text{cat}} - \sum_{\text{previous}} \text{debit}_{\text{cat}}
$$

$$
\Delta\%_{\text{cat}} = \frac{\Delta_{\text{cat}}}{\sum_{\text{previous}} \text{debit}_{\text{cat}}} \times 100
$$

Only the top 5 categories by absolute change are shown.

---

## Financial Stability Score

A composite score from 0 to 100, calculated from three sub-scores.

### Sub-scores

**1. Income Stability** — based on the [coefficient of variation](https://en.wikipedia.org/wiki/Coefficient_of_variation) of monthly income:

$$
\text{CV}_{\text{income}} = \frac{\sigma(\text{monthly incomes})}{\mu(\text{monthly incomes})}
$$

$$
\text{Income Score} = \text{clamp}(100 - \text{CV}_{\text{income}} \times 100, \; 0, \; 100)
$$

A perfectly stable income (same amount every month) scores 100. Highly variable income scores near 0.

**2. Expense Stability** — same formula applied to monthly expenses:

$$
\text{Expense Score} = \text{clamp}(100 - \text{CV}_{\text{expense}} \times 100, \; 0, \; 100)
$$

**3. Savings Consistency** — percentage of months where income exceeded expenses:

$$
\text{Savings Score} = \frac{|\{m : \text{Income}_m > \text{Expense}_m\}|}{|\text{Total Months}|} \times 100
$$

### Composite Score

$$
\text{Overall} = \text{clamp}\Big(0.35 \times \text{Income Score} + 0.30 \times \text{Expense Score} + 0.35 \times \text{Savings Score}, \; 0, \; 100\Big)
$$

**Interpretation**:

| Score | Label | Meaning |
|-------|-------|---------|
| 70–100 | Excellent | Stable income, controlled expenses, consistent savings |
| 40–69 | Average | Some volatility, occasional overspending |
| 0–39 | Poor | Highly variable income/expenses, rarely saving |

**Example**: 12 months of data, income CV = 0.15, expense CV = 0.25, 9 out of 12 months positive:

- Income Score = clamp(100 - 15, 0, 100) = **85**
- Expense Score = clamp(100 - 25, 0, 100) = **75**
- Savings Score = (9/12) x 100 = **75**
- Overall = 0.35 x 85 + 0.30 x 75 + 0.35 x 75 = 29.75 + 22.5 + 26.25 = **78.5**

---

## Vampire Expenses

Small recurring charges that individually seem negligible but accumulate over time.

### Detection Criteria

A merchant qualifies as a "vampire" if:

1. Individual transaction amount < **15 GEL** (configurable threshold)
2. The merchant appears on **3 or more unique dates**

### Metrics

| Metric | Formula |
|--------|---------|
| Count | Number of matching transactions |
| Total | $\sum \text{debit}_i$ for that merchant |
| Average | $\frac{\text{Total}}{\text{Count}}$ |
| Frequency | Number of unique dates |

Results are sorted by total descending, capped at 6 merchants.

**Example**: You buy coffee at "STARBUCKS" for 8 GEL, 12 times across 10 different days:

- Count: 12, Total: 96 GEL, Average: 8 GEL, Frequency: 10

---

## Day-of-Week Patterns

Average daily expense per weekday (Monday through Sunday).

$$
\text{Avg}_{\text{weekday}} = \frac{\sum_{\text{txs on weekday}} \text{debit}_i}{|\text{unique dates on weekday}|}
$$

Days use Monday-based indexing: Mon=0, Tue=1, ..., Sun=6.

The **peak day** (highest average) is highlighted in the chart.

---

## Category Trends

Compares average monthly spending per category between the first half and second half of your data.

### Algorithm

1. Collect all unique months, sort chronologically
2. Split at the midpoint: `firstHalf = months[0..mid-1]`, `secondHalf = months[mid..end]`
3. For each expense category:

$$
\text{Change}\% = \frac{\text{Avg}_{\text{second}} - \text{Avg}_{\text{first}}}{\text{Avg}_{\text{first}}} \times 100
$$

4. Categories where both averages are below 5 are excluded (noise)
5. Top 6 categories by absolute change percentage are shown

**Example**: Grocery averaged 800/month first half, 950/month second half:

$$
\text{Change} = \frac{950 - 800}{800} \times 100 = +18.75\%
$$

---

## Living Standard Progress

Compares average income, expense, and savings between the first and second halves of your data.

$$
\text{Income Change}\% = \frac{\text{Avg Income}_{\text{2nd}} - \text{Avg Income}_{\text{1st}}}{\text{Avg Income}_{\text{1st}}} \times 100
$$

$$
\text{Savings Change} = (\text{Avg Income}_{\text{2nd}} - \text{Avg Expense}_{\text{2nd}}) - (\text{Avg Income}_{\text{1st}} - \text{Avg Expense}_{\text{1st}})
$$

**Example**: First half: avg income 5000, avg expense 4000. Second half: avg income 6000, avg expense 4500.

- Income change: +20%, Expense change: +12.5%, Savings change: +500 GEL

---

## Exchange Rate Conversion

All conversions use GEL as the intermediary currency via NBG rates.

$$
\text{GEL per 1 unit} = \frac{\text{rate}}{\text{quantity}}
$$

$$
\text{amount}_{\text{target}} = \frac{\text{amount}_{\text{source}} \times (\text{rate}_{\text{source}} / \text{quantity}_{\text{source}})}{(\text{rate}_{\text{target}} / \text{quantity}_{\text{target}})}
$$

**Example**: Convert 100 USD to EUR. USD rate=2.6856, EUR rate=2.9123:

$$
\frac{100 \times 2.6856}{2.9123} = 92.21 \text{ EUR}
$$

See [Exchange Rates](exchange-rates.md) for the full system.

---

## Rounding

All financial calculations use rounding to 2 decimal places:

```javascript
function round(n) {
    return Math.round(n * 100) / 100;
}
```
