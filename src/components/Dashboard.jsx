import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import AllTimeView from './AllTimeView';
import PeriodView from './PeriodView';
import PeriodPicker from './PeriodPicker';
import SettingsToggle from './SettingsToggle';
import {
    calculateSummary, getAvailablePeriods, filterByPeriodKey, formatPeriodKey, getCurrencySymbol,
    getPreviousPeriodTransactions, isInternalTransfer,
} from '../utils/analytics';
import { parseFiles } from '../utils/parser';
import { fetchRatesForDates, convertTransactions, convertAmount, getUniqueDates } from '../utils/rates';
import { useSettings } from '../SettingsContext';
import ReportModal from './ReportModal';

const TAB_IDS = ['all', 'year', 'month', 'week', 'day', 'custom'];

export default function Dashboard({ transactions, accountInfos = [], onClear, onUpdateData, showToast }) {
    const [activeTab, setActiveTab] = useState('all');
    const [periodIndex, setPeriodIndex] = useState({});
    const [showPicker, setShowPicker] = useState(false);
    const [customRange, setCustomRange] = useState({ from: '', to: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [displayCurrency, setDisplayCurrency] = useState(null);
    const [ratesLoading, setRatesLoading] = useState(false);
    const [ratesLoaded, setRatesLoaded] = useState(false);
    const [noiseFilter, setNoiseFilter] = useState(true);
    const [showReport, setShowReport] = useState(false);
    const addFileRef = useRef(null);
    const { t, theme } = useSettings();

    const TABS = TAB_IDS.map(id => ({ id, label: t(`tab.${id}`) }));

    // Detect currencies from actual transactions
    const detectedCurrencies = useMemo(() => {
        const set = new Set(transactions.map(tx => tx.currency).filter(Boolean));
        return [...set];
    }, [transactions]);

    // Detect currencies from accountInfos (includes accounts with no transactions)
    const accountCurrencies = useMemo(() => {
        const set = new Set();
        for (const info of accountInfos) {
            const c = info['Account Currency'];
            if (c) set.add(c);
        }
        // Include transaction currencies too
        for (const c of detectedCurrencies) set.add(c);
        return [...set];
    }, [accountInfos, detectedCurrencies]);

    // Multi-account = accounts in different currencies exist (even if some have no transactions)
    const hasMultipleAccounts = accountCurrencies.length > 1;
    // Multi-currency transactions = actual tx data in more than one currency
    const isMultiCurrency = detectedCurrencies.length > 1;

    // Default display currency: primary account currency or first detected
    const primaryCurrency = accountInfos[0]?.['Account Currency'] || detectedCurrencies[0] || 'GEL';
    const activeCurrency = displayCurrency || primaryCurrency;

    // Fetch exchange rates when we have multiple account currencies
    useEffect(() => {
        if (!hasMultipleAccounts) {
            setRatesLoaded(true);
            return;
        }

        // Need rates if: (a) transactions need conversion, or (b) we have closing balances to convert
        const needsConversion = hasMultipleAccounts && activeCurrency !== primaryCurrency;
        const hasClosingBalances = accountInfos.some(info => {
            const c = info['Account Currency'];
            return c && c !== activeCurrency && parseFloat(String(info['Closing Balance']).replace(/,/g, '')) > 0;
        });

        if (!needsConversion && !hasClosingBalances) {
            setRatesLoaded(true);
            return;
        }

        let cancelled = false;
        setRatesLoading(true);

        const dates = getUniqueDates(transactions);
        fetchRatesForDates(dates).then(() => {
            if (!cancelled) {
                setRatesLoaded(true);
                setRatesLoading(false);
            }
        }).catch(() => {
            if (!cancelled) {
                setRatesLoaded(true);
                setRatesLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, [transactions, activeCurrency, hasMultipleAccounts, primaryCurrency, accountInfos]);

    // Prepare analytics transactions:
    // 1. Filter internal transfers when noise filter is enabled.
    // 2. Convert to display currency.
    const analyticsTransactions = useMemo(() => {
        let txs = transactions;

        // Step 1: Filter internal noise (exchange + self-transfer) when filter is on.
        if (noiseFilter) {
            txs = txs.filter(tx => !isInternalTransfer(tx));
        }

        // Step 2: Convert to display currency
        if ((isMultiCurrency || (hasMultipleAccounts && activeCurrency !== primaryCurrency)) && ratesLoaded) {
            txs = convertTransactions(txs, activeCurrency);
        }

        return txs;
    }, [transactions, noiseFilter, isMultiCurrency, hasMultipleAccounts, activeCurrency, primaryCurrency, ratesLoaded]);

    // Compute REAL combined balance from account closing balances (Source of Truth)
    const combinedClosingBalance = useMemo(() => {
        if (accountInfos.length === 0) return null;

        const lastDate = transactions.length > 0 ? transactions[transactions.length - 1].date : '';
        let total = 0;

        for (const info of accountInfos) {
            const currency = info['Account Currency'];
            const closing = parseFloat(String(info['Closing Balance'] || '0').replace(/,/g, '')) || 0;
            if (closing === 0 && !currency) continue;

            if (currency && currency !== activeCurrency && hasMultipleAccounts) {
                total += ratesLoaded ? convertAmount(closing, currency, activeCurrency, lastDate) : closing;
            } else {
                total += closing;
            }
        }
        return Math.round(total * 100) / 100;
    }, [accountInfos, transactions, activeCurrency, hasMultipleAccounts, ratesLoaded]);

    // Summary: Income/Expense (Filtered) + Rate Adjustment = NET (Real)
    const allSummary = useMemo(() => {
        const summary = calculateSummary(analyticsTransactions);

        // If we have a real closing balance, calculate the adjustment needed to reconcile
        if (combinedClosingBalance !== null) {
            const calculatedNet = summary.net;
            const variance = combinedClosingBalance - calculatedNet;

            // Only add adjustment if it's significant (avoid floating point noise < 0.01)
            if (Math.abs(variance) > 0.05) {
                summary.commonAdjustment = Math.round(variance * 100) / 100;
                summary.net = combinedClosingBalance;
                summary.currentBalance = combinedClosingBalance;
            }
        }

        return summary;
    }, [analyticsTransactions, combinedClosingBalance]);

    const available = useMemo(() => getAvailablePeriods(analyticsTransactions), [analyticsTransactions]);

    const currencySymbol = useMemo(() => {
        return getCurrencySymbol(activeCurrency);
    }, [activeCurrency]);

    useEffect(() => {
        if (activeTab !== 'all' && activeTab !== 'custom' && available[activeTab]) {
            const keys = available[activeTab];
            if (periodIndex[activeTab] === undefined) {
                setPeriodIndex(prev => ({ ...prev, [activeTab]: keys.length - 1 }));
            }
        }
    }, [activeTab, available]);

    const currentPeriodKeys = (activeTab !== 'all' && activeTab !== 'custom') ? (available[activeTab] || []) : [];
    const currentIdx = periodIndex[activeTab] ?? (currentPeriodKeys.length - 1);
    const currentKey = currentPeriodKeys[currentIdx];

    const periodTransactions = useMemo(() => {
        if (activeTab === 'all') return analyticsTransactions;
        if (activeTab === 'custom') {
            if (!customRange.from || !customRange.to) return [];
            return analyticsTransactions.filter(tx => tx.date >= customRange.from && tx.date <= customRange.to);
        }
        if (!currentKey) return analyticsTransactions;
        return filterByPeriodKey(analyticsTransactions, activeTab, currentKey);
    }, [analyticsTransactions, activeTab, currentKey, customRange]);

    const previousTransactions = useMemo(() => {
        if (activeTab === 'all' || activeTab === 'custom' || activeTab === 'day') return [];
        return getPreviousPeriodTransactions(analyticsTransactions, activeTab, currentKey, currentPeriodKeys);
    }, [analyticsTransactions, activeTab, currentKey, currentPeriodKeys]);

    const canPrev = currentIdx > 0;
    const canNext = currentIdx < currentPeriodKeys.length - 1;

    const goPrev = useCallback(() => {
        if (canPrev) setPeriodIndex(prev => ({ ...prev, [activeTab]: currentIdx - 1 }));
    }, [activeTab, currentIdx, canPrev]);

    const goNext = useCallback(() => {
        if (canNext) setPeriodIndex(prev => ({ ...prev, [activeTab]: currentIdx + 1 }));
    }, [activeTab, currentIdx, canNext]);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        setShowPicker(false);
    }, []);

    const handlePickerSelect = useCallback((key) => {
        const keys = available[activeTab] || [];
        const idx = keys.indexOf(key);
        if (idx >= 0) {
            setPeriodIndex(prev => ({ ...prev, [activeTab]: idx }));
        }
    }, [activeTab, available]);

    const handleCustomRange = useCallback((range) => {
        setCustomRange(range);
    }, []);

    // Sequential upload: add more files to existing data — robust dedup
    const handleAddFiles = useCallback(async (fileList) => {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        setIsAdding(true);
        try {
            const result = await parseFiles(files);
            if (result.transactions.length === 0) {
                setIsAdding(false);
                return;
            }

            // Dedup key: currency + balance so multiple statements for same account (e.g. 4 files) don't drop rows
            const makeKey = (tx) =>
                `${tx.date}|${tx.debit}|${tx.credit}|${tx.operation}|${tx.currency ?? ''}|${tx.balance ?? ''}`;

            const existingKeys = new Set(transactions.map(makeKey));
            const newTx = result.transactions.filter(tx => !existingKeys.has(makeKey(tx)));

            const merged = [...transactions, ...newTx].sort((a, b) => a.date.localeCompare(b.date));

            // Deduplicate account infos by Account Number + Currency.
            // When the same file is re-uploaded, keep the newer entry (from result) so Closing Balance isn't doubled.
            const infoKey = (info) =>
                `${info['Account Number'] || ''}|${info['Account Currency'] || ''}`;
            const infoMap = new Map();
            for (const info of accountInfos) infoMap.set(infoKey(info), info);
            for (const info of (result.accountInfos || [])) infoMap.set(infoKey(info), info);
            let uniqueInfos = [...infoMap.values()];

            // Ensure every currency present in merged transactions has an account entry
            // (handles added files whose parser didn't return accountInfo).
            // Synthetic accounts need Closing Balance from last tx in that currency so combinedClosingBalance matches.
            const currenciesInTx = [...new Set(merged.map(t => t.currency).filter(Boolean))];
            const currenciesInInfos = new Set(uniqueInfos.map(i => i['Account Currency']).filter(Boolean));
            const lastBalanceByCurrency = {};
            for (let i = merged.length - 1; i >= 0; i--) {
                const c = merged[i].currency;
                if (c && lastBalanceByCurrency[c] === undefined)
                    lastBalanceByCurrency[c] = merged[i].balance;
            }
            for (const c of currenciesInTx) {
                if (!currenciesInInfos.has(c)) {
                    const closing = lastBalanceByCurrency[c] != null ? lastBalanceByCurrency[c] : 0;
                    uniqueInfos = [...uniqueInfos, { 'Account Currency': c, 'Account Number': `_${c}`, 'Closing Balance': closing }];
                    currenciesInInfos.add(c);
                }
            }

            setRatesLoaded(false);
            setDisplayCurrency(null);
            onUpdateData(merged, uniqueInfos);
        } catch (err) {
            console.error('Failed to add files:', err);
        }
        setIsAdding(false);
    }, [transactions, accountInfos, onUpdateData]);

    const fmtDate = (d) => {
        if (!d) return '';
        const [y, m, day] = d.split('/');
        return `${day}.${m}.${y}`;
    };

    const accountLabel = useMemo(() => {
        if (!accountInfos || accountInfos.length === 0) return '';
        const holder = accountInfos[0]?.['Account Holder'] || '';
        const accountNumbers = accountInfos.map(i => i['Account Number']).filter(Boolean);
        const accountStr = accountNumbers.length > 1
            ? `${accountNumbers.length} ${t('dash.accounts') || 'accounts'}`
            : accountNumbers[0] || '';
        // Group by currency: "2× GEL + USD" instead of "GEL + USD + GEL"
        const currencyCounts = {};
        for (const info of accountInfos) {
            const c = info['Account Currency'];
            if (c) currencyCounts[c] = (currencyCounts[c] || 0) + 1;
        }
        const currencyList = Object.entries(currencyCounts)
            .map(([c, n]) => (n > 1 ? `${n}× ${c}` : c))
            .join(' + ');
        return `${holder} · ${accountStr}${currencyList ? ` · ${currencyList}` : ''}`;
    }, [accountInfos, t]);

    const formatCustomLabel = () => {
        if (!customRange.from || !customRange.to) return t('dash.selectDateRange');
        return `${fmtDate(customRange.from)} — ${fmtDate(customRange.to)}`;
    };

    const monthsFull = t('months.full');
    const monthsShort = t('months.short');
    const isPeriodTab = activeTab !== 'all' && activeTab !== 'custom';

    return (
        <div className="dashboard">
            <header className="dash-header">
                <div className="dash-header-left">
                    <h1 className="dash-title">{t('app.title')}</h1>
                    {accountLabel && <p className="dash-account">{accountLabel}</p>}
                    <p className="dash-range">
                        {fmtDate(allSummary.dateRange.from)} — {fmtDate(allSummary.dateRange.to)} · {allSummary.totalTransactions} {t('dash.transactions')}
                    </p>
                </div>
                <div className="dash-header-right">
                    <button
                        className="btn-report"
                        onClick={() => setShowReport(true)}
                        title={t('report.tooltip')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                        {t('report.button')}
                    </button>
                    <a
                        href="https://Vlad1k3.github.io/credo-app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="upload-btn"
                        style={{
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            padding: '0.4rem 0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'var(--bg-hover)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <span>📚</span> Docs
                    </a>
                    {hasMultipleAccounts && (
                        <div className="currency-toggle">
                            {accountCurrencies.map(c => (
                                <button
                                    key={c}
                                    className={`currency-btn ${activeCurrency === c ? 'active' : ''}`}
                                    onClick={() => { setDisplayCurrency(c); setRatesLoaded(false); }}
                                >
                                    {getCurrencySymbol(c)} {c}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        className={`btn-noise-filter ${noiseFilter ? 'active' : ''}`}
                        onClick={() => setNoiseFilter(!noiseFilter)}
                        title={t('dash.filterTooltip')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        {noiseFilter ? t('dash.filterOn') : t('dash.filterOff')}
                    </button>
                    <SettingsToggle />
                    <label className={`btn-secondary btn-add-files ${isAdding ? 'loading' : ''}`}>
                        {isAdding ? '...' : (t('dash.addFiles') || '+ Add Files')}
                        <input
                            ref={addFileRef}
                            type="file"
                            accept=".xlsx,.xls,.csv,.pdf"
                            multiple
                            hidden
                            onChange={(e) => { handleAddFiles(e.target.files); e.target.value = ''; }}
                        />
                    </label>
                    <button className="btn-secondary" onClick={onClear}>
                        {t('dash.newFile')}
                    </button>
                </div>
            </header>

            {ratesLoading && (
                <div className="rates-loading">
                    {t('dash.loadingRates') || 'Loading exchange rates...'}
                </div>
            )}

            <nav className="tab-bar">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {isPeriodTab && currentKey && (
                <div className="period-nav">
                    <button className="period-nav-btn" disabled={!canPrev} onClick={goPrev} aria-label="Previous period">←</button>
                    <button className="period-nav-center" onClick={() => setShowPicker(true)}>
                        <span className="period-nav-title">{formatPeriodKey(activeTab, currentKey, monthsFull, monthsShort)}</span>
                        <span className="period-nav-count">{currentIdx + 1} {t('dash.of')} {currentPeriodKeys.length} · 📅 {t('dash.pick')}</span>
                    </button>
                    <button className="period-nav-btn" disabled={!canNext} onClick={goNext} aria-label="Next period">→</button>
                </div>
            )}

            {activeTab === 'custom' && (
                <div className="period-nav">
                    <button className="period-nav-center" onClick={() => setShowPicker(true)}>
                        <span className="period-nav-title">{formatCustomLabel()}</span>
                        <span className="period-nav-count">📅 {t('dash.selectRange')}</span>
                    </button>
                </div>
            )}

            {showPicker && (
                <PeriodPicker
                    mode={activeTab === 'custom' ? 'custom' : activeTab}
                    availableKeys={available[activeTab] || []}
                    selectedKey={currentKey}
                    onSelect={handlePickerSelect}
                    customRange={customRange}
                    onCustomRange={handleCustomRange}
                    onClose={() => setShowPicker(false)}
                />
            )}

            <div className="tab-content" key={activeTab}>
                {activeTab === 'all' ? (
                    <AllTimeView
                        transactions={periodTransactions}
                        summary={allSummary}
                        currency={currencySymbol}
                        isMultiCurrency={hasMultipleAccounts}
                    />
                ) : (
                    <PeriodView
                        transactions={periodTransactions}
                        previousTransactions={previousTransactions}
                        period={activeTab === 'custom' ? 'custom' : activeTab}
                        currency={currencySymbol}
                        isMultiCurrency={hasMultipleAccounts}
                    />
                )}
            </div>

            <footer className="dash-footer">
                <span className="privacy-note-inline">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    {t('dash.privacy')}
                </span>
            </footer>

            {showReport && (
                <ReportModal
                    transactions={transactions}
                    accountInfos={accountInfos}
                    onClose={() => setShowReport(false)}
                    showToast={showToast}
                />
            )}
        </div>
    );
}
