# Custom Range

The **Custom** tab lets you analyze any arbitrary date range — perfect for tracking specific events like vacations, projects, or quarterly reviews.

## How to Use

1. Click the **Custom** tab
2. Click "Select Date Range" to open the picker
3. Enter a **Start Date** and **End Date**
4. The dashboard instantly recalculates all metrics for that range

## Filtering Logic

Transactions are included if:

$$
\text{from} \leq \text{transaction.date} \leq \text{to}
$$

Dates are compared as strings in `YYYY/MM/DD` format, which is lexicographically equivalent to chronological order.

## What You Get

The custom range view includes the same components as a period view:

- **Summary cards** — income, expense, net, transaction count
- **Daily bar chart** — income vs. expense per day within the range
- **Category breakdown** — expense categories for the selected range only
- **Transaction table** — filtered to the selected range

!!! note "No period comparison"
    The custom range does not include a period comparison card, since there's no obvious "previous" period to compare against.

## Use Cases

| Scenario | Date Range |
|----------|-----------|
| Holiday trip to Batumi | `2024/07/15` — `2024/07/22` |
| Home renovation project | `2024/03/01` — `2024/05/31` |
| Tax quarter Q3 | `2024/07/01` — `2024/09/30` |
| First week at new job | `2024/09/02` — `2024/09/08` |

## Resetting

The custom range is preserved until you switch away from the Custom tab or set a new range. Switching to another tab (e.g., All Time or Month) does not delete the custom range — switching back to Custom will restore it.
