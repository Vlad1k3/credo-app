# Financial Insights

The **Financial Insights** section appears only in the **All Time** view and provides five analytical cards that go beyond basic income/expense summaries.

!!! info "Minimum data requirement"
    Insights require at least **2 months** of transaction data. If less data is available, the insights section is hidden entirely.

---

### 1. Financial Stability Score

A composite 0--100 score that measures how predictable and sustainable your financial behavior is.

#### What it measures

| Sub-score | Weight | What it captures |
|-----------|--------|-----------------|
| Income Stability | 35% | How consistent is your monthly income? |
| Expense Stability | 30% | How consistent are your monthly expenses? |
| Savings Consistency | 35% | How often do you save (income > expense)? |

#### How scores are calculated

Each sub-score uses a different method:

**Income & Expense Stability** use the coefficient of variation (CV = standard deviation / mean). A CV of 0 means perfectly stable, a CV of 1 means extremely variable.

$$
\text{Score} = \max(0, \min(100, 100 - \text{CV} \times 100))
$$

**Savings Consistency** is the simple percentage of months with positive net:

$$
\text{Score} = \frac{\text{months with income > expense}}{\text{total months}} \times 100
$$

#### Interpretation

| Score | Label | Color | Meaning |
|-------|-------|-------|---------|
| 70--100 | Excellent | Green | Predictable finances, regular savings |
| 40--69 | Average | Yellow | Some volatility, savings not consistent |
| 0--39 | Poor | Red | High variability, frequent overspending |

#### Visual

Displayed as a circular score ring with the number in the center, plus three horizontal progress bars for the sub-scores.

---

### 2. Day-of-Week Patterns

Shows which weekdays you spend the most money on.

#### Calculation

For each weekday (Monday through Sunday):

$$
\text{Average} = \frac{\text{total debit on weekday}}{\text{number of unique dates on weekday}}
$$

This normalizes for the fact that some weekdays may have more data points than others.

#### Display

A vertical bar chart with 7 columns (Mon--Sun). The peak day is highlighted in red; other days use the accent color.

Below the chart: "Peak day: **Saturday** -- 85 GEL/day"

#### Use case

Identify weekend spending spikes, Friday indulgences, or midweek patterns.

---

### 3. Vampire Expenses

Small recurring charges that are easy to overlook individually but add up significantly over time.

#### Detection

A transaction is a "vampire candidate" if:

- **Amount < 15 GEL** (the threshold)
- **Transaction type is expense** (debit > 0)

Candidates are grouped by merchant. A merchant is shown if it appears on **3 or more unique dates**.

#### What you see

| Column | Description |
|--------|-------------|
| Merchant name | The extracted merchant name |
| Frequency | Number of transactions (e.g., "12x") |
| Total | Sum of all qualifying transactions |

A total across all vampire merchants is shown at the top.

#### Example

> Vampire Total: **-352 GEL**
>
> - STARBUCKS -- 24x -- -192 GEL
> - BOLT -- 18x -- -108 GEL
> - METRO -- 8x -- -52 GEL

---

### 4. Category Trends

Shows which spending categories are growing or shrinking over time.

#### Algorithm

1. Collect all unique months from the dataset
2. Split months into **first half** and **second half** at the midpoint
3. For each expense category, calculate the average monthly spend in each half
4. Compute the percentage change between halves
5. Exclude categories where both halves average less than 5 GEL (noise)
6. Show the top 6 by absolute percentage change

#### Display

Each trend row shows:

| Column | Description |
|--------|-------------|
| Category | e.g., "Grocery" |
| First -> Second | e.g., "800 -> 950" (monthly averages) |
| Change | e.g., "^ 19%" (red for increase, green for decrease) |

A footnote explains that the comparison splits data into first half vs. second half of the available time range.

#### Example

> - Grocery: 800 -> 950 **^ 19%**
> - Taxi: 200 -> 120 **v 40%**
> - Subscriptions: 30 -> 55 **^ 83%**

---

### 5. Living Standard Progress

Compares your average monthly income, expenses, and savings between the first and second halves of your data to show whether your financial position is improving.

#### Algorithm

1. Aggregate all transactions by month
2. Split the monthly array at the midpoint
3. Calculate average income, expense, and savings for each half
4. Compute percentage changes and absolute savings change

#### Metrics

| Metric | Formula | Good direction |
|--------|---------|----------------|
| Avg Income | Mean of monthly income | Higher is better (green ^) |
| Avg Expense | Mean of monthly expense | Lower is better (green v) |
| Avg Savings | Income - Expense | Higher is better (green ^) |

#### Display

Three side-by-side metric cards showing `before -> after` values with an arrow and percentage/absolute change.

A footnote explains this compares the first half vs. second half of the loaded data.

---

### Mobile Behavior

On screens narrower than 768px, all insight cards collapse to a single header line with a preview value (e.g., "78/100" for stability, "-352 GEL" for vampires). Tapping a card header expands it to show the full content. Only one card can be expanded at a time.
