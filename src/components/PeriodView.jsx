import { useMemo, useState, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import '../utils/chartSetup';
import {
    calculateSummary, getCategoryBreakdown, getTopMerchants, aggregateByDay,
} from '../utils/analytics';
import TransactionTable from './TransactionTable';
import CategoryAnalysis from './CategoryAnalysis';
import PeriodComparison from './PeriodComparison';
import { useSettings } from '../SettingsContext';

const barOpts = (unit = '₾', theme) => {
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6';
    const textColor = theme === 'dark' ? '#8b929e' : '#94a3b8';

    return {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { labels: { color: '#6b7280', font: { family: 'Inter', size: 12 } } },
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
                ticks: { color: textColor, font: { family: 'Inter', size: 11 } },
                grid: { color: gridColor },
            },
        },
    };
};

export default function PeriodView({ transactions, previousTransactions = [], period, currency = '₾' }) {
    const [filter, setFilter] = useState(null);
    const tableRef = useRef(null);
    const { t, theme } = useSettings();

    const summary = useMemo(() => calculateSummary(transactions), [transactions]);
    const categories = useMemo(() => getCategoryBreakdown(transactions), [transactions]);
    const topMerchants = useMemo(() => getTopMerchants(transactions, 6), [transactions]);
    const daily = useMemo(() => aggregateByDay(transactions), [transactions]);

    if (transactions.length === 0) {
        return (
            <div className="empty-state">
                <p>{t('period.noTransactions')}</p>
            </div>
        );
    }

    const fmtDay = (d) => {
        const p = d.split('/');
        return `${p[2]}.${p[1]}`;
    };

    const dailyChartData = {
        labels: daily.map(d => fmtDay(d.date)),
        datasets: [
            { label: t('chart.income'), data: daily.map(d => +d.income.toFixed(2)), backgroundColor: '#10b981', borderRadius: 4 },
            { label: t('chart.expenses'), data: daily.map(d => +d.expense.toFixed(2)), backgroundColor: '#ef4444', borderRadius: 4 },
        ],
    };

    const handleScrollToTable = () => {
        if (tableRef.current) {
            tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const maxMerchant = topMerchants[0]?.total || 1;
    const periodName = t(`period.${period.charAt(0).toUpperCase() + period.slice(1)}`);

    return (
        <div className="view-content">
            <div className="summary-cards">
                <PCard label={t('period.income')} value={summary.totalIncome} color="#10b981" prefix="+" currency={currency} />
                <PCard label={t('period.expenses')} value={summary.totalExpense} color="#ef4444" prefix="-" currency={currency} />
                <PCard label={t('period.net')} value={summary.net} color={summary.net >= 0 ? '#10b981' : '#ef4444'} prefix={summary.net >= 0 ? '+' : ''} currency={currency} />
                <PCard label={t('period.transactions')} value={summary.totalTransactions} isCurrency={false} color="#4f46e5" />
            </div>

            {(period === 'year' || period === 'month' || period === 'week') && (
                <PeriodComparison
                    currentTransactions={transactions}
                    previousTransactions={previousTransactions}
                    period={period}
                    currency={currency}
                />
            )}

            <div className={period === 'year' ? '' : 'charts-row'}>
                {daily.length > 1 && (
                    <div className="card card-chart">
                        <h3>{t('period.dailyBreakdown')}</h3>
                        <div className="chart-box"><Bar data={dailyChartData} options={barOpts(currency, theme)} /></div>
                    </div>
                )}

                {topMerchants.length > 0 && (
                    <div className="card">
                        <h3>{t('period.topSpending')} {periodName}</h3>
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
                )}
            </div>

            <CategoryAnalysis
                categories={categories}
                currency={currency}
                onFilter={setFilter}
                onScrollToTable={handleScrollToTable}
            />



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

function PCard({ label, value, color, prefix = '', isCurrency = true, currency = '₾' }) {
    return (
        <div className="s-card">
            <span className="s-card-label">{label}</span>
            <span className="s-card-value" style={{ color }}>
                {isCurrency ? `${prefix}${value.toFixed(2)} ${currency}` : value}
            </span>
        </div>
    );
}
