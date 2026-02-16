import { useMemo } from 'react';
import { comparePeriods } from '../utils/analytics';
import { useSettings } from '../SettingsContext';

export default function PeriodComparison({ currentTransactions, previousTransactions, period, currency = '₾' }) {
    const { t } = useSettings();
    const comparison = useMemo(
        () => comparePeriods(currentTransactions, previousTransactions),
        [currentTransactions, previousTransactions]
    );

    if (!comparison) {
        return (
            <div className="card comp-card">
                <h3>{t('compare.title')}</h3>
                <p className="comp-empty">{t('compare.noPrev')}</p>
            </div>
        );
    }

    const { current, previous, changes, categoryChanges } = comparison;

    const periodLabel = t(`period.${period.charAt(0).toUpperCase() + period.slice(1)}`);

    const metrics = [
        { key: 'avgDailyExpense', label: t('compare.avgDaily'), cur: current.avgDailyExpense, prev: previous.avgDailyExpense, pct: changes.avgDailyExpense, flip: true },
        { key: 'avgDailyIncome', label: t('compare.avgDailyIncome'), cur: current.avgDailyIncome, prev: previous.avgDailyIncome, pct: changes.avgDailyIncome, flip: false },
        { key: 'savingsRate', label: t('compare.savingsRate'), cur: current.savingsRate, prev: previous.savingsRate, pct: changes.savingsRate, isRate: true, flip: false },
    ];

    return (
        <div className="card comp-card">
            <h3>{t('compare.title')}</h3>
            <p className="comp-subtitle">{t('compare.vs')} {periodLabel}</p>

            <div className="comp-metrics">
                {metrics.map(m => {
                    const isGood = m.flip ? m.pct <= 0 : m.pct >= 0;
                    const color = m.pct === 0 ? 'var(--text-muted)' : isGood ? 'var(--green)' : 'var(--red)';
                    const arrow = m.pct > 0 ? '↑' : m.pct < 0 ? '↓' : '—';
                    return (
                        <div key={m.key} className="comp-metric">
                            <span className="comp-metric-label">{m.label}</span>
                            <div className="comp-metric-values">
                                <span className="comp-metric-cur">
                                    {m.isRate ? `${m.cur.toFixed(1)}%` : `${m.cur.toFixed(2)} ${currency}`}
                                </span>
                                <span className="comp-metric-change" style={{ color }}>
                                    {arrow} {m.isRate ? `${m.pct > 0 ? '+' : ''}${m.pct.toFixed(1)}pp` : `${m.pct > 0 ? '+' : ''}${m.pct.toFixed(1)}%`}
                                </span>
                            </div>
                            <span className="comp-metric-prev">
                                {t('compare.prev')}: {m.isRate ? `${m.prev.toFixed(1)}%` : `${m.prev.toFixed(2)} ${currency}`}
                            </span>
                        </div>
                    );
                })}
            </div>

            {categoryChanges.length > 0 && (
                <div className="comp-categories">
                    <h4>{t('compare.categoryChanges')}</h4>
                    {categoryChanges.map(c => {
                        const isUp = c.diff > 0;
                        return (
                            <div key={c.category} className="comp-cat-row">
                                <span className="comp-cat-name">{t(`cat.${c.category}`) || c.category}</span>
                                <span className="comp-cat-diff" style={{ color: isUp ? 'var(--red)' : 'var(--green)' }}>
                                    {isUp ? '+' : ''}{c.diff.toFixed(0)} {currency}
                                </span>
                                <span className="comp-cat-pct" style={{ color: isUp ? 'var(--red)' : 'var(--green)' }}>
                                    {isUp ? '↑' : '↓'} {Math.abs(c.pct).toFixed(0)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
