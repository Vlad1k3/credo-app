/**
 * Exchange rate utility using NBG (National Bank of Georgia) API.
 * Fetches historical rates, caches them, and converts amounts between currencies.
 *
 * API: https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?date=YYYY-MM-DD
 * Rate meaning: `rate` GEL per `quantity` units of foreign currency.
 *   e.g. USD: rate=2.6856, quantity=1 → 1 USD = 2.6856 GEL
 */

const NBG_API = 'https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/';
const CACHE_KEY = 'credo_nbg_rates';

// In-memory cache: { "2025/08/14": { USD: { rate, quantity }, EUR: { rate, quantity }, ... } }
let rateCache = {};
let _sortedDates = null;

// Load cache from localStorage on init
try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) rateCache = JSON.parse(stored);
} catch { /* ignore */ }

function saveCache() {
    _sortedDates = null;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(rateCache));
    } catch { /* quota exceeded — no big deal */ }
}

/**
 * Convert date from "2025/08/14" to "2025-08-14" for API query.
 */
function toApiDate(d) {
    return d.replace(/\//g, '-');
}

/**
 * Fetch rates for a single date from NBG API.
 * Returns map: { USD: { rate, quantity }, EUR: { rate, quantity }, ... }
 */
async function fetchRatesForDate(dateStr) {
    const apiDate = toApiDate(dateStr);
    const resp = await fetch(`${NBG_API}?date=${apiDate}`);
    if (!resp.ok) throw new Error(`NBG API error: ${resp.status}`);
    const data = await resp.json();

    const map = {};
    if (data[0]?.currencies) {
        for (const c of data[0].currencies) {
            map[c.code] = { rate: c.rate, quantity: c.quantity };
        }
    }
    return map;
}

/**
 * Fetch and cache rates for a list of dates.
 * Only fetches dates not already in cache.
 * @param {string[]} dates - Array of dates in "YYYY/MM/DD" format
 * @param {Function} onProgress - Optional callback (loaded, total) for progress UI
 */
export async function fetchRatesForDates(dates, onProgress) {
    const unique = [...new Set(dates)].filter(d => !rateCache[d]);
    if (unique.length === 0) return;

    // Fetch in parallel batches of 5 to avoid hammering the API
    const BATCH_SIZE = 5;
    let loaded = 0;

    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
        const batch = unique.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
            batch.map(async (d) => {
                try {
                    return { date: d, rates: await fetchRatesForDate(d) };
                } catch {
                    // On error, use empty map — will fallback to nearest date
                    return { date: d, rates: {} };
                }
            })
        );

        for (const { date, rates } of results) {
            rateCache[date] = rates;
        }

        loaded += batch.length;
        if (onProgress) onProgress(loaded, unique.length);
    }

    saveCache();
}

/**
 * Get the GEL-per-unit rate for a currency on a given date.
 * Falls back to nearest cached date if exact date is missing.
 * GEL → GEL is always 1.
 */
export function getRateToGEL(date, currencyCode) {
    if (currencyCode === 'GEL') return 1;

    const cached = rateCache[date];
    if (cached?.[currencyCode]) {
        const { rate, quantity } = cached[currencyCode];
        return rate / quantity; // GEL per 1 unit of currency
    }

    // Fallback: binary search for nearest date with this currency
    if (!_sortedDates) _sortedDates = Object.keys(rateCache).sort();
    const dates = _sortedDates;
    if (dates.length === 0) return 1;

    // Find insertion point via binary search (dates are YYYY/MM/DD, lexicographically sortable)
    let lo = 0, hi = dates.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (dates[mid] < date) lo = mid + 1;
        else hi = mid - 1;
    }
    // Search outward from insertion point for nearest date with this currency
    for (let d = 0; d < dates.length; d++) {
        for (const idx of [lo - 1 - d, lo + d]) {
            if (idx >= 0 && idx < dates.length && rateCache[dates[idx]]?.[currencyCode]) {
                const { rate, quantity } = rateCache[dates[idx]][currencyCode];
                return rate / quantity;
            }
        }
    }

    // Last resort: return 1 (no conversion)
    return 1;
}

/**
 * Convert amount between two currencies using the rate on a given date.
 * All rates go through GEL as the base currency.
 */
export function convertAmount(amount, fromCurrency, toCurrency, date) {
    if (fromCurrency === toCurrency || amount === 0) return amount;

    // Convert to GEL first
    const gelAmount = amount * getRateToGEL(date, fromCurrency);

    // Then convert from GEL to target
    if (toCurrency === 'GEL') return gelAmount;
    const targetRate = getRateToGEL(date, toCurrency);
    return targetRate > 0 ? gelAmount / targetRate : gelAmount;
}

/**
 * Convert all transactions to a target currency.
 * Returns new array with converted debit/credit/balance/amount values.
 * Original transactions are not mutated.
 */
export function convertTransactions(transactions, targetCurrency) {
    return transactions.map(t => {
        if (t.currency === targetCurrency) return t;

        const rate = (d, amount) => convertAmount(amount, t.currency, targetCurrency, d);

        return {
            ...t,
            debit: Math.round(rate(t.date, t.debit) * 100) / 100,
            credit: Math.round(rate(t.date, t.credit) * 100) / 100,
            balance: Math.round(rate(t.date, t.balance) * 100) / 100,
            amount: Math.round(rate(t.date, t.amount) * 100) / 100,
            originalCurrency: t.currency,
            currency: targetCurrency,
        };
    });
}

/**
 * Extract unique dates from transactions (for pre-fetching rates).
 */
export function getUniqueDates(transactions) {
    return [...new Set(transactions.map(t => t.date))];
}
