import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bar, Line } from 'react-chartjs-2';
import '../utils/chartSetup';
import { aggregateByMonth, calculateSummary, getCategoryBreakdown, getBalanceTimeline, getTopMerchants } from '../utils/analytics';
import TransactionTable from './TransactionTable';
import CategoryAnalysis from './CategoryAnalysis';
import SavingsRate from './SavingsRate';
import FinancialInsights from './FinancialInsights';
import { useSettings } from '../SettingsContext';

const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b',
    '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#64748b', '#71717a'
];

const chartOpts = (unit, currency, theme) => {
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6';
    const textColor = theme === 'dark' ? '#8b929e' : '#94a3b8';

    return {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1f2937', titleColor: '#f9fafb', bodyColor: '#d1d5db',
                borderColor: '#374151', borderWidth: 1, padding: 10,
                callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(2)} ${unit}` },
            },
        },
        scales: {
            x: {
                ticks: { color: textColor, font: { family: 'Inter', size: 11 } },
                grid: { color: gridColor },
            },
            y: {
                ticks: { color: textColor, font: { family: 'Inter', size: 11 }, callback: (v) => `${v}` },
                grid: { color: gridColor },
            },
        },
    };
};

export default function AllTimeView({ transactions, summary, currency = '₾' }) {
    const [filter, setFilter] = useState(null);
    const tableRef = useRef(null);
    const { t, theme } = useSettings();

    const monthly = useMemo(() => aggregateByMonth(transactions), [transactions]);
    const categories = useMemo(() => getCategoryBreakdown(transactions), [transactions]);
    const balance = useMemo(() => getBalanceTimeline(transactions), [transactions]);
    const topMerchants = useMemo(() => getTopMerchants(transactions, 8), [transactions]);

    const monthsShort = t('months.short');
    const fmtMonth = (m) => {
        const [y, mo] = m.split('/');
        return `${monthsShort[parseInt(mo) - 1]} ${y.slice(2)}`;
    };

    const incExpData = {
        labels: monthly.map(m => fmtMonth(m.month)),
        datasets: [
            { label: t('chart.income'), data: monthly.map(m => +m.income.toFixed(2)), backgroundColor: '#10b981', borderRadius: 4 },
            { label: t('chart.expenses'), data: monthly.map(m => +m.expense.toFixed(2)), backgroundColor: '#ef4444', borderRadius: 4 },
        ],
    };

    const balanceData = {
        labels: balance.map(b => { const p = b.date.split('/'); return `${p[2]}.${p[1]}`; }),
        datasets: [{
            label: t('chart.balance'),
            data: balance.map(b => b.balance),
            borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.08)',
            fill: true, tension: 0.3, pointRadius: 1.5, pointHoverRadius: 4,
        }],
    };

    const handleScrollToTable = () => {
        if (tableRef.current) {
            tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const maxMerchant = topMerchants[0]?.total || 1;

    return (
        <div className="view-content">
            <div className="summary-cards">
                <SummaryCard label={t('summary.totalIncome')} value={summary.totalIncome} color="#10b981" prefix="+" currency={currency} />
                <SummaryCard label={t('summary.totalExpenses')} value={summary.totalExpense} color="#ef4444" prefix="-" currency={currency} />

                {/* Show Exchange Rate Adjustment if present (reconciles Income-Expense with Real NET) */}
                {summary.commonAdjustment && Math.abs(summary.commonAdjustment) > 0.05 && (
                    <SummaryCard
                        label={t('summary.exchangeAdjustment') || 'Exchange Adj.'}
                        value={summary.commonAdjustment}
                        color="#8b5cf6"
                        prefix={summary.commonAdjustment >= 0 ? '+' : ''}
                        currency={currency}
                        tooltip={t('summary.exchangeAdjustmentTooltip') || 'Difference due to exchange rate fluctuations during transfers'}
                    />
                )}

                <SummaryCard label={t('summary.net')} value={summary.net} color={summary.net >= 0 ? '#10b981' : '#ef4444'} prefix={summary.net >= 0 ? '+' : ''} currency={currency} />
                <SummaryCard label={t('summary.avgMonthlyIncome')} value={summary.avgMonthlyIncome} color="#10b981" prefix="+" currency={currency} />
                <SummaryCard label={t('summary.avgMonthly')} value={summary.avgMonthlyExpense} color="#f59e0b" currency={currency} />
                <SummaryCard label={t('summary.avgDaily')} value={summary.avgDailyExpense} color="#6b7280" currency={currency} />
            </div>

            <div className="charts-row">
                <div className="card card-chart">
                    <h3>{t('chart.balanceOverTime')}</h3>
                    <div className="chart-box"><Line data={balanceData} options={chartOpts(currency, currency, theme)} /></div>
                </div>
                <div className="card card-chart">
                    <h3>{t('chart.monthlyIncExp')}</h3>
                    <div className="chart-box"><Bar data={incExpData} options={chartOpts(currency, currency, theme)} /></div>
                </div>
            </div>

            <CategoryAnalysis
                categories={categories}
                currency={currency}
                onFilter={setFilter}
                onScrollToTable={handleScrollToTable}
            />

            <div className="charts-row">
                <div className="card">
                    <h3>{t('chart.topSpending')}</h3>
                    <div className="merchant-list">
                        {topMerchants.map((m, i) => (
                            <div key={m.merchant} className="merchant-row">
                                <span className="merchant-idx">{i + 1}</span>
                                <div className="merchant-body">
                                    <span className="merchant-name">{m.merchant}</span>
                                    <div className="merchant-bar-track">
                                        <div className="merchant-bar-fill" style={{ width: `${(m.total / maxMerchant) * 100}%` }} />
                                    </div>
                                </div>
                                <span className="merchant-amt">-{m.total.toFixed(2)} {currency}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <SavingsRate transactions={transactions} currency={currency} />
            </div>

            <FinancialInsights transactions={transactions} currency={currency} />

            <div ref={tableRef}>
                <TransactionTable
                    transactions={transactions}
                    currency={currency}
                    filter={filter}
                    onClearFilter={() => setFilter(null)}
                />
            </div>
        </div>
    );
}

function SummaryCard({ label, value, color, prefix = '', currency = '₾', tooltip }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const iconRef = useRef(null);
    const touchStart = useRef(null);
    const timerRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const close = () => {
        setShowTooltip(false);
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    const openTooltip = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            setPosition({ top: rect.top, left: rect.left + rect.width / 2 });
        }
        setShowTooltip(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(close, 4000);
    };

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    const handleTouchStart = (e) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
    };

    const handleTouchEnd = (e) => {
        if (!touchStart.current) return;
        const t = e.changedTouches[0];
        const dx = Math.abs(t.clientX - touchStart.current.x);
        const dy = Math.abs(t.clientY - touchStart.current.y);
        touchStart.current = null;
        if (dx < 10 && dy < 10) {
            e.preventDefault();
            e.stopPropagation();
            if (showTooltip) { close(); } else { openTooltip(); }
        }
    };

    return (
        <div className="s-card">
            <div className="s-card-label">
                {label}
                {tooltip && (
                    <div
                        className="info-icon-wrapper"
                        ref={iconRef}
                        onMouseEnter={openTooltip}
                        onMouseLeave={close}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        tabIndex={0}
                        role="button"
                        aria-label={tooltip}
                    >
                        <span className="info-icon">i</span>
                        {showTooltip && createPortal(
                            <div className="tooltip-overlay" onClick={close} onTouchEnd={(e) => { e.preventDefault(); close(); }}>
                                <div
                                    className="portal-tooltip"
                                    style={{ top: position.top, left: position.left }}
                                >
                                    {tooltip}
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>
                )}
            </div>
            <span className="s-card-value" style={{ color }}>{prefix}{value.toFixed(2)} {currency}</span>
        </div>
    );
}
