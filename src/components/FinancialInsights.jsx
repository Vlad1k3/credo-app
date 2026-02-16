import { useMemo, useState, useEffect } from 'react';
import {
    getFinancialStability,
    getVampireExpenses,
    getLivingStandardProgress,
    getCategoryTrends,
    getDayOfWeekPatterns,
} from '../utils/analytics';
import { useSettings } from '../SettingsContext';

const MOBILE_MEDIA = '(max-width: 768px)';

export default function FinancialInsights({ transactions, currency = '₾' }) {
    const { t } = useSettings();
    const [expanded, setExpanded] = useState(null);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA).matches);

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_MEDIA);
        const handle = () => setIsMobile(mql.matches);
        mql.addEventListener('change', handle);
        return () => mql.removeEventListener('change', handle);
    }, []);

    const stability = useMemo(() => getFinancialStability(transactions), [transactions]);
    const vampires = useMemo(() => getVampireExpenses(transactions), [transactions]);
    const livingStd = useMemo(() => getLivingStandardProgress(transactions), [transactions]);
    const trends = useMemo(() => getCategoryTrends(transactions), [transactions]);
    const dayPatterns = useMemo(() => getDayOfWeekPatterns(transactions), [transactions]);

    const daysShort = t('days.short');

    if (!stability) return null;

    const scoreColor = (s) => s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--yellow)' : 'var(--red)';
    const scoreLabel = (s) => s >= 70 ? t('ins.excellent') : s >= 40 ? t('ins.average') : t('ins.poor');

    const maxDayAvg = Math.max(...dayPatterns.map(d => d.avgPerDay), 1);
    const peakDay = dayPatterns.reduce((max, d) => d.avgPerDay > max.avgPerDay ? d : max, dayPatterns[0]);

    const toggle = (key) => setExpanded(expanded === key ? null : key);
    const isOpen = (key) => !isMobile || expanded === key;

    const sections = [];

    // 1. Financial Stability
    sections.push({
        key: 'stability',
        title: t('ins.stability'),
        preview: `${Math.round(stability.overall)}/100`,
        previewColor: scoreColor(stability.overall),
        content: (
            <>
                <div className="ins-score-row">
                    <div className="ins-score-ring" style={{ '--score-color': scoreColor(stability.overall) }}>
                        <span className="ins-score-num">{Math.round(stability.overall)}</span>
                    </div>
                    <span className="ins-score-label" style={{ color: scoreColor(stability.overall) }}>
                        {scoreLabel(stability.overall)}
                    </span>
                </div>
                <div className="ins-bars">
                    <InsBar label={t('ins.incomeStab')} value={stability.incomeStability} />
                    <InsBar label={t('ins.expenseStab')} value={stability.expenseStability} />
                    <InsBar label={t('ins.savingsStab')} value={stability.savingsConsistency} />
                </div>
                <div className="ins-footnote">
                    {stability.positiveSavingsMonths}/{stability.totalMonths} {t('ins.monthsPositive')}
                </div>
            </>
        ),
    });

    // 2. Day-of-Week Patterns
    sections.push({
        key: 'dayPatterns',
        title: t('ins.dayPatterns'),
        preview: `${daysShort[peakDay.dayIndex]} ${peakDay.avgPerDay.toFixed(0)}${currency}`,
        previewColor: 'var(--red)',
        content: (
            <>
                <div className="ins-day-grid">
                    {dayPatterns.map((d, i) => {
                        const pct = maxDayAvg > 0 ? (d.avgPerDay / maxDayAvg) * 100 : 0;
                        const isPeak = d === peakDay;
                        return (
                            <div key={i} className={`ins-day-col ${isPeak ? 'peak' : ''}`}>
                                <span className="ins-day-val">{d.avgPerDay.toFixed(0)}</span>
                                <div className="ins-day-bar-track">
                                    <div
                                        className="ins-day-bar-fill"
                                        style={{
                                            height: `${Math.max(pct, 4)}%`,
                                            backgroundColor: isPeak ? 'var(--red)' : 'var(--accent)',
                                        }}
                                    />
                                </div>
                                <span className="ins-day-label">{daysShort[i]}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="ins-footnote">
                    {t('ins.peakDay')}: <b>{daysShort[peakDay.dayIndex]}</b> — {peakDay.avgPerDay.toFixed(0)} {currency}/{t('ins.day')}
                </div>
            </>
        ),
    });

    // 3. Vampire Expenses
    if (vampires.length > 0) {
        sections.push({
            key: 'vampires',
            title: t('ins.vampires'),
            preview: `-${vampires.reduce((s, v) => s + v.total, 0).toFixed(0)} ${currency}`,
            previewColor: 'var(--red)',
            content: (
                <>
                    <div className="ins-vamp-total">
                        {t('ins.vampTotal')}: <b style={{ color: 'var(--red)' }}>
                            -{vampires.reduce((s, v) => s + v.total, 0).toFixed(0)} {currency}
                        </b>
                    </div>
                    <div className="ins-vamp-list">
                        {vampires.map(v => (
                            <div key={v.name} className="ins-vamp-row">
                                <span className="ins-vamp-name" title={v.name}>{v.name}</span>
                                <span className="ins-vamp-freq">{v.count}x</span>
                                <span className="ins-vamp-amt">-{v.total.toFixed(0)} {currency}</span>
                            </div>
                        ))}
                    </div>
                </>
            ),
        });
    }

    // 4. Category Trends
    if (trends.length > 0) {
        sections.push({
            key: 'trends',
            title: t('ins.catTrends'),
            preview: `${trends.length}`,
            previewColor: 'var(--accent)',
            content: (
                <>
                    <div className="ins-trend-list">
                        {trends.map(tr => {
                            const isUp = tr.change > 0;
                            return (
                                <div key={tr.category} className="ins-trend-row">
                                    <span className="ins-trend-name">{t(`cat.${tr.category}`) || tr.category}</span>
                                    <span className="ins-trend-vals">
                                        {tr.firstAvg.toFixed(0)} → {tr.secondAvg.toFixed(0)}
                                    </span>
                                    <span className="ins-trend-change" style={{ color: isUp ? 'var(--red)' : 'var(--green)' }}>
                                        {isUp ? '↑' : '↓'} {Math.abs(tr.change).toFixed(0)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="ins-footnote">{t('ins.trendNote')}</div>
                </>
            ),
        });
    }

    // 5. Living Standard Progress
    if (livingStd) {
        sections.push({
            key: 'living',
            title: t('ins.livingStd'),
            wide: true,
            preview: `${livingStd.savingsChange > 0 ? '+' : ''}${livingStd.savingsChange.toFixed(0)}%`,
            previewColor: livingStd.savingsChange >= 0 ? 'var(--green)' : 'var(--red)',
            content: (
                <>
                    <div className="ins-living-grid">
                        <LivingMetric
                            label={t('ins.avgIncome')}
                            before={livingStd.first.income}
                            after={livingStd.second.income}
                            change={livingStd.incomeChange}
                            currency={currency}
                            goodUp
                        />
                        <LivingMetric
                            label={t('ins.avgExpense')}
                            before={livingStd.first.expense}
                            after={livingStd.second.expense}
                            change={livingStd.expenseChange}
                            currency={currency}
                        />
                        <LivingMetric
                            label={t('ins.avgSavings')}
                            before={livingStd.first.savings}
                            after={livingStd.second.savings}
                            change={livingStd.savingsChange}
                            currency={currency}
                            isDiff
                            goodUp
                        />
                    </div>
                    <div className="ins-footnote">{t('ins.livingNote')}</div>
                </>
            ),
        });
    }

    return (
        <div className="insights-section">
            <h3 className="insights-title">{t('ins.sectionTitle')}</h3>
            <div className="insights-grid">
                {sections.map(sec => (
                    <div
                        key={sec.key}
                        className={`ins-card ${sec.wide ? 'ins-card-wide' : ''} ${isOpen(sec.key) ? 'ins-open' : ''}`}
                    >
                        <div
                            className="ins-card-header"
                            onClick={() => isMobile && toggle(sec.key)}
                        >
                            <span className="ins-card-title">{sec.title}</span>
                            {isMobile && (
                                <>
                                    <span className="ins-card-preview" style={{ color: sec.previewColor }}>
                                        {sec.preview}
                                    </span>
                                    <span className={`ins-card-chevron ${isOpen(sec.key) ? 'rotated' : ''}`} />
                                </>
                            )}
                        </div>
                        <div className={`ins-card-body ${isOpen(sec.key) ? 'open' : ''}`}>
                            {sec.content}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function InsBar({ label, value }) {
    const color = value >= 70 ? 'var(--green)' : value >= 40 ? 'var(--yellow)' : 'var(--red)';
    return (
        <div className="ins-bar-row">
            <span className="ins-bar-label">{label}</span>
            <div className="ins-bar-track">
                <div className="ins-bar-fill" style={{ width: `${value}%`, backgroundColor: color }} />
            </div>
            <span className="ins-bar-val" style={{ color }}>{Math.round(value)}</span>
        </div>
    );
}

function LivingMetric({ label, before, after, change, currency, isDiff, goodUp }) {
    const isPositive = goodUp ? change >= 0 : change <= 0;
    const color = change === 0 ? 'var(--text-muted)' : isPositive ? 'var(--green)' : 'var(--red)';
    const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '—';
    return (
        <div className="ins-living-item">
            <span className="ins-living-label">{label}</span>
            <div className="ins-living-vals">
                <span className="ins-living-before">{before.toFixed(0)}</span>
                <span className="ins-living-arrow">→</span>
                <span className="ins-living-after">{after.toFixed(0)} {currency}</span>
            </div>
            <span className="ins-living-change" style={{ color }}>
                {arrow} {isDiff ? `${change > 0 ? '+' : ''}${change.toFixed(0)} ${currency}` : `${change > 0 ? '+' : ''}${change.toFixed(0)}%`}
            </span>
        </div>
    );
}
