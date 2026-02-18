# Exchange Rates

Credo Statement Analyzer supports multi-currency accounts by converting all values to a single display currency using historical exchange rates from the National Bank of Georgia (NBG).

## When Rates Are Needed

Exchange rates are fetched only when:

1. **Multiple account currencies** are detected (e.g., GEL + USD files uploaded)
2. **AND** the user has selected a display currency different from the primary currency, or account closing balances need cross-currency conversion

If you only have single-currency accounts, no exchange rate requests are made.

## Data Source

**API**: National Bank of Georgia
**Endpoint**: `https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?date=YYYY-MM-DD`

Each API response contains an array of currencies with:

| Field | Description | Example |
|-------|-------------|---------|
| `code` | ISO 4217 currency code | `USD` |
| `rate` | GEL per `quantity` units | `2.6856` |
| `quantity` | Number of units the rate applies to | `1` |

### Rate meaning

$$
1 \text{ unit of currency} = \frac{\text{rate}}{\text{quantity}} \text{ GEL}
$$

For most currencies, `quantity = 1`. For some (e.g., Japanese Yen), `quantity = 100`.

## Fetching Strategy

### Pre-fetching

When multi-currency accounts are detected, the app:

1. Extracts all **unique transaction dates** from the dataset
2. Filters out dates already in the cache
3. Fetches missing dates in **parallel batches of 5** to avoid overwhelming the API

### Caching

Rates are cached at two levels:

| Cache | Storage | Lifetime |
|-------|---------|----------|
| In-memory | JavaScript object | Current session |
| localStorage | Key: `credo_nbg_rates` | Persistent across sessions |

The cache structure is:

```json
{
  "2025/08/14": {
    "USD": { "rate": 2.6856, "quantity": 1 },
    "EUR": { "rate": 2.9123, "quantity": 1 }
  },
  "2025/08/15": { ... }
}
```

### Fallback for missing dates

If a specific date isn't in the cache (API error, weekend/holiday with no rate published):

1. A **binary search** finds the insertion point in the sorted date list
2. The algorithm searches outward from that point (alternating left/right) for the nearest date that has a rate for the requested currency
3. If no rate is found at all, the conversion factor defaults to **1** (no conversion)

## Conversion Algorithm

All conversions go through GEL as the intermediary:

```
Source Currency → GEL → Target Currency
```

### Step-by-step

1. **Source to GEL**:

$$
\text{amount}_{\text{GEL}} = \text{amount}_{\text{source}} \times \frac{\text{rate}_{\text{source}}}{\text{quantity}_{\text{source}}}
$$

2. **GEL to Target** (skip if target is GEL):

$$
\text{amount}_{\text{target}} = \frac{\text{amount}_{\text{GEL}}}{\text{rate}_{\text{target}} / \text{quantity}_{\text{target}}}
$$

### Transaction conversion

When converting a full transaction, all monetary fields are converted individually:

- `debit` — outgoing amount
- `credit` — incoming amount
- `balance` — account balance at that point
- `amount` — absolute transaction amount

Each field uses the exchange rate on **that transaction's specific date**. The original currency is preserved in an `originalCurrency` field.

### Closing balance conversion

When calculating the combined closing balance across multiple accounts, each account's closing balance is converted using the rate on the **last transaction date** in the dataset.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| API returns non-200 status | That date gets an empty rate map; fallback to nearest date |
| API is unreachable (offline) | Previously cached rates are used; new dates get fallback |
| `localStorage` quota exceeded | Cache works in-memory only for that session |
| No rate found for currency | Conversion factor = 1 (amount unchanged) |

## Supported Currencies

The NBG API provides rates for 40+ currencies. The app specifically handles these with dedicated symbols:

| Currency | Symbol |
|----------|--------|
| GEL | ₾ |
| USD | $ |
| EUR | € |
| RUB | ₽ |
| Other | ISO code (e.g., "GBP") |
