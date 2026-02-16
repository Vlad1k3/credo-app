# Formulas & Calculations

Transparency is key. Here acts how Credo Analytics processes your numbers.

## Financial Calculations

### Total Income
$$
\text{Total Income} = \sum (\text{Transactions with Positive Amount})
$$
*Includes salaries, transfers in, refunds, etc.*

### Total Expense
$$
\text{Total Expense} = \sum (\text{Transactions with Negative Amount})
$$
*Includes purchases, bill payments, transfers out, etc.*

### Net Result
$$
\text{Net Result} = \text{Total Income} - |\text{Total Expense}|
$$
*Shows the net change in your wealth for the selected period.*

## Exchange Rates

If you have multi-currency accounts (e.g., GEL, USD, EUR):
1. **Base Currency**: The app defaults to the currency of your first uploaded account (usually GEL).
2. **Conversion**: Transactions in other currencies are converted to the base currency using the **historical exchange rate** on the date of the transaction.
3. **Source**: Exchange rates are fetched from credible financial APIs or estimated based on daily averages if precise data is unavailable.

## Noise Filter Logic

When the **Noise Filter** is active (default), the app hides:
* **Internal Transfers**: Money moved between your own accounts (e.g., Checking -> Savings).
* **Exchange Operations**: Buying/selling currency within your accounts.

This ensures your "Income" reflects real earnings and "Expense" reflects real spending, not just moving money around.
