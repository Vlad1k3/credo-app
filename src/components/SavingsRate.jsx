import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { getMonthlySavingsRate } from '../utils/analytics';
import { useSettings } from '../SettingsContext';

export default function SavingsRate({ transactions, currency = '₾' }) {
    const { t, theme } = useSettings();
    const monthly = useMemo(() => getMonthlySavingsRate(transactions), [transactions]);

    if (monthly.length < 2) return null;

    const monthsShort = t('months.short');
    const fmtMonth = (m) => {
        const [y, mo] = m.split('/');
        return `${monthsShort[parseInt(mo) - 1]} ${y.slice(2)}`;
    };

    const avgRate = monthly.reduce((s, m) => s + m.rate, 0) / monthly.length;

    const chartData = {
        labels: monthly.map(m => fmtMonth(m.month)),
        datasets: [{
            label: t('savings.rate'),
            data: monthly.map(m => m.rate),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: monthly.map(m => m.rate >= 0 ? '#10b981' : '#ef4444'),
        }],
    };

    const chartOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1f2937', titleColor: '#f9fafb', bodyColor: '#d1d5db',
                callbacks: {
                    label: (c) => `${c.parsed.y.toFixed(1)}%`,
                    afterLabel: (c) => {
                        const m = monthly[c.dataIndex];
                        return `${t('chart.income')}: +${m.income.toFixed(0)} ${currency}\n${t('chart.expenses')}: -${m.expense.toFixed(0)} ${currency}`;
                    },
                },
            },
        },
        scales: {
            x: { ticks: { color: theme === 'dark' ? '#8b929e' : '#94a3b8', font: { family: 'Inter', size: 11 } }, grid: { display: false } },
            y: {
                ticks: { color: theme === 'dark' ? '#8b929e' : '#94a3b8', font: { family: 'Inter', size: 11 }, callback: (v) => `${v}%` },
                grid: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6' },
            },
        },
    };

    return (
        <div className="card">
            <h3>{t('savings.title')}</h3>
            <div className="savings-avg">
                <span className="savings-avg-label">{t('savings.average')}</span>
                <span className="savings-avg-value" style={{ color: avgRate >= 0 ? '#10b981' : '#ef4444' }}>
                    {avgRate.toFixed(1)}%
                </span>
            </div>
            <div className="chart-box" style={{ height: '200px' }}>
                <Line data={chartData} options={chartOpts} />
            </div>
            <div className="savings-months">
                {monthly.slice(-3).reverse().map(m => (
                    <div key={m.month} className="savings-month-row">
                        <span className="savings-month-name">{fmtMonth(m.month)}</span>
                        <span className="savings-month-bar-track">
                            <span
                                className="savings-month-bar-fill"
                                style={{
                                    width: `${Math.min(Math.abs(m.rate), 100)}%`,
                                    backgroundColor: m.rate >= 0 ? '#10b981' : '#ef4444',
                                }}
                            />
                        </span>
                        <span className="savings-month-val" style={{ color: m.rate >= 0 ? '#10b981' : '#ef4444' }}>
                            {m.rate >= 0 ? '+' : ''}{m.rate.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
