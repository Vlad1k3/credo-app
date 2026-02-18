/**
 * Pure vanilla JS analytics — no framework deps for max speed.
 */

// ─── Category Detection ──────────────────────────────────────────────
const _catCache = new WeakMap();

const CATEGORY_RULES = [
    // Exported category markers (for re-importing anonymized CSV)
    { pattern: /\[Grocery\]/i, category: 'Grocery', icon: '🛒' },
    { pattern: /\[Restaurants & Cafes\]/i, category: 'Restaurants & Cafes', icon: '🍽' },
    { pattern: /\[Pharmacy\]/i, category: 'Pharmacy', icon: '💊' },
    { pattern: /\[Taxi\]/i, category: 'Taxi', icon: '🚕' },
    { pattern: /\[Transport\]/i, category: 'Transport', icon: '🚌' },
    { pattern: /\[Mobile & Internet\]/i, category: 'Mobile & Internet', icon: '📱' },
    { pattern: /\[Utilities\]/i, category: 'Utilities', icon: '🏠' },
    { pattern: /\[Shopping\]/i, category: 'Shopping', icon: '🛍' },
    { pattern: /\[Subscriptions\]/i, category: 'Subscriptions', icon: '📺' },

    // Grocery stores
    { pattern: /SPAR/i, category: 'Grocery', icon: '🛒' },
    { pattern: /DAILY|DEILY/i, category: 'Grocery', icon: '🛒' },
    { pattern: /GOODWILL/i, category: 'Grocery', icon: '🛒' },
    { pattern: /CARREFOUR/i, category: 'Grocery', icon: '🛒' },
    { pattern: /NIKORA/i, category: 'Grocery', icon: '🛒' },
    { pattern: /SMART/i, category: 'Grocery', icon: '🛒' },
    { pattern: /FRESCO/i, category: 'Grocery', icon: '🛒' },
    { pattern: /ORI NABIJI|ორი ნაბიჯი/i, category: 'Grocery', icon: '🛒' },
    { pattern: /AGROHUB/i, category: 'Grocery', icon: '🛒' },
    { pattern: /MAGNITI|MAGNIT/i, category: 'Grocery', icon: '🛒' },
    { pattern: /EURO ?PRODUCT/i, category: 'Grocery', icon: '🛒' },
    { pattern: /UNIVERSAM/i, category: 'Grocery', icon: '🛒' },

    // Food delivery
    { pattern: /WOLT/i, category: 'Food Delivery', icon: '🍔' },
    { pattern: /BOLT FOOD|BOLT\.EU.*FOOD/i, category: 'Food Delivery', icon: '🍔' },
    { pattern: /GLOVO/i, category: 'Food Delivery', icon: '🍔' },
    { pattern: /\[Food Delivery\]/i, category: 'Food Delivery', icon: '🍔' },

    // Restaurants & Cafes
    { pattern: /TAKARA/i, category: 'Restaurants & Cafes', icon: '🍽' },
    { pattern: /MCDONALD/i, category: 'Restaurants & Cafes', icon: '🍽' },
    { pattern: /KFC/i, category: 'Restaurants & Cafes', icon: '🍽' },
    { pattern: /WENDY/i, category: 'Restaurants & Cafes', icon: '🍽' },
    { pattern: /SUBWAY/i, category: 'Restaurants & Cafes', icon: '🍽' },
    { pattern: /DUNKIN/i, category: 'Restaurants & Cafes', icon: '🍽' },
    { pattern: /STARBUCKS/i, category: 'Restaurants & Cafes', icon: '🍽' },
    { pattern: /COFFEE/i, category: 'Restaurants & Cafes', icon: '🍽' },

    // Pharmacy
    { pattern: /AVERSI/i, category: 'Pharmacy', icon: '💊' },
    { pattern: /GPC/i, category: 'Pharmacy', icon: '💊' },
    { pattern: /PSP/i, category: 'Pharmacy', icon: '💊' },
    { pattern: /PHARMADEPOT|PHARMA ?DEPOT/i, category: 'Pharmacy', icon: '💊' },

    // Taxi & Ride
    { pattern: /YANDEX|YANDEX\.GO/i, category: 'Taxi', icon: '🚕' },
    { pattern: /BOLT(?!.*FOOD)/i, category: 'Taxi', icon: '🚕' },
    { pattern: /MAXIM/i, category: 'Taxi', icon: '🚕' },

    // Transport
    { pattern: /INFOBUS/i, category: 'Transport', icon: '🚌' },
    { pattern: /METRO|მეტრო/i, category: 'Transport', icon: '🚌' },
    { pattern: /RAILWAY|რკინიგზა/i, category: 'Transport', icon: '🚌' },
    { pattern: /WIZZ ?AIR|RYAN ?AIR|PEGASUS|TURKISH AIR/i, category: 'Transport', icon: '🚌' },

    // Mobile & Internet
    { pattern: /MAGTICOM|მაგთი|მობილური/i, category: 'Mobile & Internet', icon: '📱' },
    { pattern: /SILKNET|სილქნეტ/i, category: 'Mobile & Internet', icon: '📱' },
    { pattern: /BEELINE|GEOCELL/i, category: 'Mobile & Internet', icon: '📱' },

    // Utilities (combined)
    { pattern: /ელ\.ენერგია|ეპ ჯორჯია|დენის|ENERGO/i, category: 'Utilities', icon: '🏠' },
    { pattern: /გაზი|სოკარ|SOCAR/i, category: 'Utilities', icon: '🏠' },
    { pattern: /წყალი|წყალმომარაგ/i, category: 'Utilities', icon: '🏠' },
    { pattern: /TELASI/i, category: 'Utilities', icon: '🏠' },

    // Shopping & Services
    { pattern: /pogi shop/i, category: 'Shopping', icon: '🛍' },
    { pattern: /ORGSERVICE/i, category: 'Shopping', icon: '🛍' },
    { pattern: /3 t\.t\.t/i, category: 'Shopping', icon: '🛍' },
    { pattern: /AMAZON|ALIEXPRESS|EBAY/i, category: 'Shopping', icon: '🛍' },
    { pattern: /NETFLIX|SPOTIFY|YOUTUBE|GOOGLE|APPLE/i, category: 'Subscriptions', icon: '📺' },

    // Bank fees
    { pattern: /საკომისიო|Cross Border Fee|\[Bank Fees\]/i, category: 'Bank Fees', icon: '🏦' },

    // Currency exchange
    { pattern: /კონვერტაცია|Exchange|Конвертация|Обмен|\[Currency Exchange\]/i, category: 'Currency Exchange', icon: '💱' },

    // Transfers
    { pattern: /საკუთარ ანგარიშებს|\[Self Transfer\]/i, category: 'Self Transfer', icon: '🔄' },
    { pattern: /გადარიცხვა.*კლიენტებს|თანხის გადარიცხვა|\[Transfer to Others\]/i, category: 'Transfer to Others', icon: '💸' },
    { pattern: /სხვა ბანკიდან|Private transfers|\[Incoming Transfer\]/i, category: 'Incoming Transfer', icon: '📥' },

    // Deposits
    { pattern: /შეტანა|ჩარიცხვა|\[Deposit\]/i, category: 'Deposit', icon: '📥' },
    { pattern: /ბარათზე.*ჩარიცხვა/i, category: 'Deposit', icon: '📥' },

    // Debt
    { pattern: /დავალიანების.*მოგროვება|\[Debt Collection\]/i, category: 'Debt Collection', icon: '📋' },

    // Personal services
    { pattern: /P\/E\s|ი\/მ\s|\[Services\]/i, category: 'Services', icon: '🔧' },
];

export function categorize(transaction) {
    if (_catCache.has(transaction)) return _catCache.get(transaction);
    const text = `${transaction.operation} ${transaction.description}`;
    for (const rule of CATEGORY_RULES) {
        if (rule.pattern.test(text)) {
            const result = { name: rule.category, icon: rule.icon };
            _catCache.set(transaction, result);
            return result;
        }
    }
    const fallback = { name: 'Other', icon: '📦' };
    _catCache.set(transaction, fallback);
    return fallback;
}

export function categoryName(transaction) {
    return categorize(transaction).name;
}

// ─── Internal Transfer Detection ──────────────────────────────────────

const INTERNAL_CATEGORIES = new Set(['Currency Exchange', 'Self Transfer']);

/**
 * Check if a transaction is an internal transfer (currency exchange or self-transfer).
 * These should be excluded from income/expense analytics to prevent double-counting.
 */
export function isInternalTransfer(t) {
    const cat = categorize(t).name;
    return INTERNAL_CATEGORIES.has(cat);
}

// ─── Period Filtering ──────────────────────────────────────────────

/**
 * Get all available period keys from transaction data, sorted chronologically.
 * Returns { days: [...], weeks: [...], months: [...], years: [...] }
 * Each week key is "YYYY/MM/DD" of the Monday start.
 */
export function getAvailablePeriods(transactions) {
    const daysSet = new Set();
    const weeksSet = new Set();
    const monthsSet = new Set();
    const yearsSet = new Set();

    for (const t of transactions) {
        daysSet.add(t.date);
        monthsSet.add(t.date.substring(0, 7));
        yearsSet.add(t.date.substring(0, 4));

        const d = toDate(t.date);
        const ws = getWeekStart(d);
        weeksSet.add(formatDateKey(ws));
    }

    return {
        day: [...daysSet].sort(),
        week: [...weeksSet].sort(),
        month: [...monthsSet].sort(),
        year: [...yearsSet].sort(),
    };
}

/**
 * Filter transactions by a specific period key.
 *   - day: key is "YYYY/MM/DD"
 *   - week: key is "YYYY/MM/DD" (Monday of that week)
 *   - month: key is "YYYY/MM"
 *   - year: key is "YYYY"
 */
export function filterByPeriodKey(transactions, period, key) {
    switch (period) {
        case 'day':
            return transactions.filter(t => t.date === key);
        case 'week': {
            const ws = toDate(key);
            const we = new Date(ws);
            we.setDate(we.getDate() + 6);
            const wsKey = formatDateKey(ws);
            const weKey = formatDateKey(we);
            return transactions.filter(t => t.date >= wsKey && t.date <= weKey);
        }
        case 'month':
            return transactions.filter(t => t.date.startsWith(key));
        case 'year':
            return transactions.filter(t => t.date.startsWith(key));
        default:
            return transactions;
    }
}

/**
 * Format a period key for display.
 */
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatPeriodKey(period, key, monthsFull, monthsShort) {
    const MONTHS = monthsFull || MONTHS_EN;
    const MON = monthsShort || MON_EN;

    switch (period) {
        case 'day': {
            const [y, m, d] = key.split('/');
            return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`;
        }
        case 'week': {
            const ws = toDate(key);
            const we = new Date(ws); we.setDate(we.getDate() + 6);
            const f = (dt) => `${dt.getDate()} ${MON[dt.getMonth()]}`;
            return `${f(ws)} — ${f(we)}, ${ws.getFullYear()}`;
        }
        case 'month': {
            const [y, m] = key.split('/');
            return `${MONTHS[parseInt(m) - 1]} ${y}`;
        }
        case 'year':
            return key;
        default:
            return key;
    }
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff));
}

function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
}

// ─── Aggregation ──────────────────────────────────────────────────────

export function aggregateByDay(transactions) {
    const map = {};
    for (const t of transactions) {
        const key = t.date;
        if (!map[key]) map[key] = { date: key, income: 0, expense: 0, count: 0 };
        map[key].income += t.credit;
        map[key].expense += t.debit;
        map[key].count++;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByMonth(transactions) {
    const map = {};
    for (const t of transactions) {
        const key = t.date.substring(0, 7); // "2025/07"
        if (!map[key]) map[key] = { month: key, income: 0, expense: 0, count: 0 };
        map[key].income += t.credit;
        map[key].expense += t.debit;
        map[key].count++;
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

// ─── Category Breakdown ──────────────────────────────────────────────

export function getCategoryBreakdown(transactions) {
    const map = {};
    for (const t of transactions) {
        if (t.debit <= 0) continue;
        const cat = categorize(t);
        const key = cat.name;
        if (!map[key]) map[key] = { category: cat.name, icon: cat.icon, total: 0, count: 0, merchants: {} };
        map[key].total += t.debit;
        map[key].count++;

        // Track individual merchants/sources within each category
        const merchant = extractMerchant(t);
        if (!map[key].merchants[merchant]) {
            map[key].merchants[merchant] = { name: merchant, total: 0, count: 0 };
        }
        map[key].merchants[merchant].total += t.debit;
        map[key].merchants[merchant].count++;
    }

    return Object.values(map)
        .map(cat => ({
            ...cat,
            merchants: Object.values(cat.merchants).sort((a, b) => b.total - a.total),
        }))
        .sort((a, b) => b.total - a.total);
}

/**
 * Extract a readable merchant name from a transaction.
 */
/**
 * Extract a readable merchant name from a transaction.
 */
export function extractMerchant(t) {

    // Card payments: "გადახდა - SPAR 18.39 GEL 31.07.2025"
    const cardMatch = t.description.match(/გადახდა\s*-\s*(.+?)(?:\s+[\d,.]+\s+GEL|\s*$)/i);
    if (cardMatch) return cardMatch[1].trim();

    // Utility payments: "გაზი - სოკარ ჯორჯია გაზი - 003102794156"
    const utilMatch = t.description.match(/^(ელ\.ენერგია|გაზი|წყალი)\s*-\s*(.+?)(?:\s*-\s*\d+|$)/);
    if (utilMatch) return utilMatch[2].trim();

    // Beneficiary name if available
    if (t.beneficiaryName) return t.beneficiaryName;

    // Fall back to operation
    return t.operation || t.description || 'Unknown';
}

export function getTopMerchants(transactions, limit = 10) {
    const map = {};
    for (const t of transactions) {
        if (t.debit <= 0) continue;
        const match = t.description.match(/გადახდა - (.+?) [\d.]+/);
        const merchant = match ? match[1].trim() : (t.beneficiaryName || t.operation);
        if (!merchant) continue;
        if (!map[merchant]) map[merchant] = { merchant, total: 0, count: 0 };
        map[merchant].total += t.debit;
        map[merchant].count++;
    }
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, limit);
}

// ─── Summary ──────────────────────────────────────────────────────────

export function calculateSummary(transactions) {
    let totalIncome = 0;
    let totalExpense = 0;
    const dates = new Set();
    const currencies = new Set();

    for (const t of transactions) {
        if (t.currency) currencies.add(t.currency);
        totalIncome += t.credit;
        totalExpense += t.debit;
        dates.add(t.date);
    }

    const numDays = dates.size || 1;
    const lastTransaction = transactions[transactions.length - 1];
    const firstTransaction = transactions[0];

    const monthsMap = new Set(transactions.map(t => t.date.substring(0, 7)));
    const numMonths = monthsMap.size || 1;

    const currentBalance = lastTransaction ? lastTransaction.balance : 0;
    const firstBalance = firstTransaction ? firstTransaction.balance : 0;
    const firstNet = firstTransaction ? (firstTransaction.credit - firstTransaction.debit) : 0;
    const startingBalance = round(firstBalance - firstNet);

    return {
        totalIncome: round(totalIncome),
        totalExpense: round(totalExpense),
        net: round(totalIncome - totalExpense),
        avgDailyExpense: round(totalExpense / numDays),
        avgDailyIncome: round(totalIncome / numDays),
        avgMonthlyExpense: round(totalExpense / numMonths),
        avgMonthlyIncome: round(totalIncome / numMonths),
        startingBalance,
        currentBalance,
        totalTransactions: transactions.length,
        numDays,
        numMonths,
        currencies: [...currencies],
        isMultiCurrency: currencies.size > 1,
        dateRange: {
            from: firstTransaction?.date || '',
            to: lastTransaction?.date || '',
        },
    };
}

// ─── Balance Timeline ──────────────────────────────────────────────────
// Built only from statement balances: per-account balance from the bank,
// then summed by date in display currency. No running sum, no course adjustment,
// so the chart never goes negative and reflects only what is on the accounts.

export function getBalanceTimeline(transactions) {
    if (!transactions || transactions.length === 0) return [];

    // Group by account (original currency): each date -> last balance that day for that account.
    const byAccount = {};
    for (const t of transactions) {
        const acc = t.originalCurrency ?? t.currency;
        if (!byAccount[acc]) byAccount[acc] = {};
        byAccount[acc][t.date] = round(t.balance ?? 0);
    }

    const allDates = [...new Set(transactions.map(t => t.date))].sort((a, b) => a.localeCompare(b));

    // Per account: sorted [date, balance] so we can get "last known balance on or before d".
    const accountEntries = {};
    for (const acc of Object.keys(byAccount)) {
        accountEntries[acc] = Object.entries(byAccount[acc])
            .map(([date, balance]) => ({ date, balance }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    const getBalanceAt = (entries, date) => {
        let lo = 0, hi = entries.length - 1, result = 0;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (entries[mid].date <= date) {
                result = entries[mid].balance;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return result;
    };

    const result = allDates.map(date => {
        let combined = 0;
        for (const acc of Object.keys(accountEntries)) {
            combined += getBalanceAt(accountEntries[acc], date);
        }
        return { date, balance: round(combined) };
    });

    return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function toDate(dateStr) {
    const [y, m, d] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d);
}

function round(n) {
    return Math.round(n * 100) / 100;
}

// ─── Monthly Savings Rate ──────────────────────────────────────────────

export function getMonthlySavingsRate(transactions) {
    const map = {};
    for (const t of transactions) {
        const key = t.date.substring(0, 7);
        if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
        map[key].income += t.credit;
        map[key].expense += t.debit;
    }
    return Object.values(map)
        .map(m => ({
            ...m,
            savings: round(m.income - m.expense),
            rate: m.income > 0 ? round(((m.income - m.expense) / m.income) * 100) : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

// ─── Period Comparison (normalized to daily averages) ──────────────────

export function comparePeriods(currentTx, previousTx) {
    if (!previousTx || previousTx.length === 0) return null;

    const cur = computePeriodStats(currentTx);
    const prev = computePeriodStats(previousTx);

    const pctChange = (c, p) => p === 0 ? (c > 0 ? 100 : 0) : round(((c - p) / Math.abs(p)) * 100);

    return {
        current: cur,
        previous: prev,
        changes: {
            avgDailyExpense: pctChange(cur.avgDailyExpense, prev.avgDailyExpense),
            avgDailyIncome: pctChange(cur.avgDailyIncome, prev.avgDailyIncome),
            savingsRate: round(cur.savingsRate - prev.savingsRate),
            totalExpense: pctChange(cur.totalExpense, prev.totalExpense),
            totalIncome: pctChange(cur.totalIncome, prev.totalIncome),
        },
        categoryChanges: computeCategoryChanges(currentTx, previousTx),
    };
}

function computePeriodStats(txs) {
    let income = 0, expense = 0;
    const dates = new Set();
    for (const t of txs) {
        income += t.credit;
        expense += t.debit;
        dates.add(t.date);
    }
    const numDays = dates.size || 1;
    return {
        totalIncome: round(income),
        totalExpense: round(expense),
        net: round(income - expense),
        numDays,
        avgDailyIncome: round(income / numDays),
        avgDailyExpense: round(expense / numDays),
        savingsRate: income > 0 ? round(((income - expense) / income) * 100) : 0,
    };
}

function computeCategoryChanges(currentTx, previousTx) {
    const getCats = (txs) => {
        const map = {};
        for (const t of txs) {
            if (t.debit <= 0) continue;
            const cat = categorize(t).name;
            map[cat] = (map[cat] || 0) + t.debit;
        }
        return map;
    };
    const curCats = getCats(currentTx);
    const prevCats = getCats(previousTx);
    const allKeys = new Set([...Object.keys(curCats), ...Object.keys(prevCats)]);
    const changes = [];
    for (const key of allKeys) {
        const cur = round(curCats[key] || 0);
        const prev = round(prevCats[key] || 0);
        const diff = round(cur - prev);
        if (diff === 0) continue;
        changes.push({ category: key, current: cur, previous: prev, diff, pct: prev > 0 ? round((diff / prev) * 100) : (cur > 0 ? 100 : 0) });
    }
    return changes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5);
}

// Get previous period's transactions for comparison
export function getPreviousPeriodTransactions(transactions, period, currentKey, availableKeys) {
    if (!currentKey || period === 'day' || period === 'custom') return [];

    if (period === 'year') {
        const prevYear = String(parseInt(currentKey) - 1);
        return transactions.filter(t => t.date.startsWith(prevYear));
    }

    const idx = availableKeys.indexOf(currentKey);
    if (idx <= 0) return [];
    const prevKey = availableKeys[idx - 1];
    return filterByPeriodKey(transactions, period, prevKey);
}

// ─── Financial Stability Score ────────────────────────────────────────

export function getFinancialStability(transactions) {
    const monthly = aggregateByMonth(transactions);
    if (monthly.length < 2) return null;

    const incomes = monthly.map(m => m.income);
    const expenses = monthly.map(m => m.expense);

    const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const stdDev = (arr, mean) => Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);

    const avgIncome = avg(incomes);
    const avgExpense = avg(expenses);

    const incomeCV = avgIncome > 0 ? stdDev(incomes, avgIncome) / avgIncome : 1;
    const expenseCV = avgExpense > 0 ? stdDev(expenses, avgExpense) / avgExpense : 1;

    const positiveSavingsMonths = monthly.filter(m => m.income > m.expense).length;
    const savingsRatio = positiveSavingsMonths / monthly.length;

    const incomeScore = Math.min(100, Math.max(0, 100 - incomeCV * 100));
    const expenseScore = Math.min(100, Math.max(0, 100 - expenseCV * 100));
    const savingsScore = savingsRatio * 100;
    const overall = Math.min(100, Math.max(0, round(incomeScore * 0.35 + expenseScore * 0.3 + savingsScore * 0.35)));

    return {
        overall,
        incomeStability: round(incomeScore),
        expenseStability: round(expenseScore),
        savingsConsistency: round(savingsScore),
        positiveSavingsMonths,
        totalMonths: monthly.length,
    };
}

// ─── Vampire Expenses ─────────────────────────────────────────────────

export function getVampireExpenses(transactions, threshold = 15) {
    const merchantMap = {};
    for (const t of transactions) {
        if (t.debit <= 0 || t.debit > threshold) continue;
        const merchant = extractMerchant(t);
        if (!merchantMap[merchant]) merchantMap[merchant] = { name: merchant, amounts: [], dates: new Set() };
        merchantMap[merchant].amounts.push(t.debit);
        merchantMap[merchant].dates.add(t.date);
    }
    return Object.values(merchantMap)
        .filter(m => m.dates.size >= 3)
        .map(m => ({
            name: m.name,
            count: m.amounts.length,
            total: round(m.amounts.reduce((s, v) => s + v, 0)),
            avg: round(m.amounts.reduce((s, v) => s + v, 0) / m.amounts.length),
            frequency: m.dates.size,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
}

// ─── Living Standard Progress ─────────────────────────────────────────

export function getLivingStandardProgress(transactions) {
    const monthly = aggregateByMonth(transactions);
    if (monthly.length < 2) return null;

    const mid = Math.floor(monthly.length / 2);
    const firstHalf = monthly.slice(0, mid);
    const secondHalf = monthly.slice(mid);

    const avgOf = (arr, key) => arr.reduce((s, m) => s + m[key], 0) / arr.length;

    const f = { income: avgOf(firstHalf, 'income'), expense: avgOf(firstHalf, 'expense') };
    const s = { income: avgOf(secondHalf, 'income'), expense: avgOf(secondHalf, 'expense') };
    f.savings = f.income - f.expense;
    s.savings = s.income - s.expense;

    const pct = (cur, prev) => prev > 0 ? round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);

    return {
        incomeChange: pct(s.income, f.income),
        expenseChange: pct(s.expense, f.expense),
        savingsChange: round(s.savings - f.savings),
        first: { income: round(f.income), expense: round(f.expense), savings: round(f.savings) },
        second: { income: round(s.income), expense: round(s.expense), savings: round(s.savings) },
    };
}

// ─── Category Trends ──────────────────────────────────────────────────

export function getCategoryTrends(transactions) {
    const catMonthly = {};
    for (const t of transactions) {
        if (t.debit <= 0) continue;
        const month = t.date.substring(0, 7);
        const cat = categorize(t).name;
        if (!catMonthly[cat]) catMonthly[cat] = {};
        catMonthly[cat][month] = (catMonthly[cat][month] || 0) + t.debit;
    }

    const allMonths = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort();
    if (allMonths.length < 2) return [];

    const mid = Math.floor(allMonths.length / 2);
    const firstMonths = allMonths.slice(0, mid);
    const secondMonths = allMonths.slice(mid);

    const trends = [];
    for (const [cat, months] of Object.entries(catMonthly)) {
        const firstAvg = firstMonths.reduce((s, m) => s + (months[m] || 0), 0) / firstMonths.length;
        const secondAvg = secondMonths.reduce((s, m) => s + (months[m] || 0), 0) / secondMonths.length;
        if (firstAvg < 5 && secondAvg < 5) continue;

        const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : (secondAvg > 0 ? 100 : 0);
        trends.push({ category: cat, firstAvg: round(firstAvg), secondAvg: round(secondAvg), change: round(change), diff: round(secondAvg - firstAvg) });
    }
    return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);
}

// ─── Day-of-Week Patterns ─────────────────────────────────────────────

export function getDayOfWeekPatterns(transactions) {
    const days = Array.from({ length: 7 }, () => ({ total: 0, count: 0, dates: new Set() }));
    for (const t of transactions) {
        if (t.debit <= 0) continue;
        const d = toDate(t.date);
        const dow = d.getDay();
        const idx = dow === 0 ? 6 : dow - 1; // 0=Mon, 6=Sun
        days[idx].total += t.debit;
        days[idx].count++;
        days[idx].dates.add(t.date);
    }
    return days.map((d, i) => ({
        dayIndex: i,
        total: round(d.total),
        avgPerDay: d.dates.size > 0 ? round(d.total / d.dates.size) : 0,
        count: d.count,
    }));
}

// ─── Currency Helper ──────────────────────────────────────────────────

export function getCurrencySymbol(code) {
    if (!code) return '₾';
    const c = code.toUpperCase().trim();
    if (c === 'USD') return '$';
    if (c === 'EUR') return '€';
    if (c === 'RUB') return '₽';
    if (c === 'GEL') return '₾';
    return c;
}

