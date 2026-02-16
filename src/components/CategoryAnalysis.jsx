import { useState, useMemo, useRef, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useSettings } from '../SettingsContext';

const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b',
    '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#64748b', '#71717a'
];

const MOBILE_MEDIA = '(max-width: 768px)';

export default function CategoryAnalysis({ categories, currency = '₾', onFilter, onScrollToTable }) {
    const [showList, setShowList] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [chartInView, setChartInView] = useState(false);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA).matches);
    const chartWrapperRef = useRef(null);
    const { t } = useSettings();

    useEffect(() => {
        const el = chartWrapperRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) setChartInView(true);
            },
            { rootMargin: '80px', threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_MEDIA);
        const handle = () => {
            const mobile = mql.matches;
            setIsMobile(mobile);
            setShowList(!mobile);
        };
        handle(); // set initial state
        mql.addEventListener('change', handle);
        return () => mql.removeEventListener('change', handle);
    }, []);

    const catName = (name) => t(`cat.${name}`) || name;

    const chartData = useMemo(() => {
        return {
            labels: categories.map(c => catName(c.category)),
            datasets: [{
                data: categories.map(c => c.total),
                backgroundColor: categories.map((_, i) => COLORS[i % COLORS.length]),
                borderWidth: 0,
                hoverOffset: isMobile ? 0 : 10,
            }],
        };
    }, [categories, t, isMobile]);

    const chartOptions = useMemo(() => {
        const base = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '85%',
            layout: { padding: 10 },
            plugins: { legend: { display: false } },
        };
        if (isMobile) {
            return {
                ...base,
                interaction: { mode: null },
                events: [],
                plugins: { ...base.plugins, tooltip: { enabled: false } },
            };
        }
        return {
            ...base,
            plugins: {
                ...base.plugins,
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#f9fafb',
                    bodyColor: '#d1d5db',
                    callbacks: {
                        label: (c) => {
                            const val = c.parsed;
                            const total = c.dataset.data.reduce((a, b) => a + b, 0);
                            return ` ${c.label}: ${val.toFixed(2)} ${currency} (${((val / total) * 100).toFixed(1)}%)`;
                        },
                    },
                },
            },
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const cat = categories[idx];
                    onFilter({ type: 'category', value: cat.category });
                    setExpanded(expanded === cat.category ? null : cat.category);
                }
            },
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
        };
    }, [isMobile, currency, categories, expanded, onFilter]);

    const toggleExpand = (catKey) => {
        setExpanded(expanded === catKey ? null : catKey);
        onFilter({ type: 'category', value: catKey });
    };

    const handleMerchantClick = (e, merchantName) => {
        e.stopPropagation();
        onFilter({ type: 'merchant', value: merchantName });
        if (onScrollToTable) onScrollToTable();
    };

    if (categories.length === 0) return null;

    const maxTotal = categories[0]?.total || 1;

    return (
        <div className="card category-analysis-card">
            <h3>{t('cat.title')}</h3>
            <div className={`category-analysis-content ${showList ? 'list-visible' : ''}`}>
                <div className="cat-chart-container" ref={chartWrapperRef}>
                    <div className="cat-donut-wrapper">
                        {chartInView ? (
                            <Doughnut data={chartData} options={chartOptions} />
                        ) : (
                            <div className="cat-donut-placeholder" aria-hidden="true" />
                        )}
                        <div className="cat-donut-center">
                            <span className="cat-center-label">{t('cat.total')}</span>
                            <span className="cat-center-value">
                                {categories.reduce((s, c) => s + c.total, 0).toFixed(0)} {currency}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="cat-list-container">
                    <div className="cat-list">
                        {categories.map((cat, i) => (
                            <div key={cat.category} className={`cat-item ${expanded === cat.category ? 'expanded' : ''}`}>
                                <div className="cat-header" onClick={() => toggleExpand(cat.category)}>
                                    <div className="cat-icon" style={{ backgroundColor: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                                        {cat.icon}
                                    </div>
                                    <div className="cat-info">
                                        <div className="cat-row-top">
                                            <span className="cat-name">{catName(cat.category)}</span>
                                            <span className="cat-amt">{cat.total.toFixed(2)} {currency}</span>
                                        </div>
                                        <div className="cat-bar-track">
                                            <div
                                                className="cat-bar-fill"
                                                style={{
                                                    width: `${(cat.total / maxTotal) * 100}%`,
                                                    backgroundColor: COLORS[i % COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className={`cat-arrow ${expanded === cat.category ? 'rotated' : ''}`}>▼</span>
                                </div>

                                {expanded === cat.category && (
                                    <div className="cat-body">
                                        {cat.merchants.map((m) => (
                                            <div key={m.name} className="merch-row" onClick={(e) => handleMerchantClick(e, m.name)}>
                                                <div className="merch-info">
                                                    <span className="merch-name">{m.name}</span>
                                                    <span className="merch-amt">-{m.total.toFixed(2)} {currency}</span>
                                                </div>
                                                <div className="merch-bar-track">
                                                    <div
                                                        className="merch-bar-fill"
                                                        style={{ width: `${(m.total / cat.total) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isMobile && (
                <div
                    className="cat-mobile-toggle"
                    onClick={() => setShowList(!showList)}
                >
                    <span>{showList ?
                        (t('common.hide') === 'common.hide' ? 'Hide Categories' : t('common.hide')) :
                        (t('common.showDetails') === 'common.showDetails' ? 'Show Categories' : t('common.showDetails'))}
                    </span>
                    <span className={`cat-toggle-arrow ${showList ? 'up' : 'down'}`}>▼</span>
                </div>
            )}
        </div>
    );
}
