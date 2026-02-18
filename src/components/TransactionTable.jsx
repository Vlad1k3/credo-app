import { useState, useMemo, useEffect } from 'react';
import { categoryName, categorize, extractMerchant } from '../utils/analytics';
import { useSettings } from '../SettingsContext';

const PAGE_SIZE = 20;

function useDebouncedValue(value, delay = 200) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function TransactionTable({ transactions, currency = '₾', filter, onClearFilter }) {
    const [searchInput, setSearchInput] = useState('');
    const search = useDebouncedValue(searchInput);
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortField, setSortField] = useState('date');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(0);
    const [selectedTx, setSelectedTx] = useState(null);
    const { t } = useSettings();

    const filtered = useMemo(() => {
        let result = [...transactions];

        if (filter) {
            if (filter.type === 'category') {
                result = result.filter(tx => categoryName(tx) === filter.value);
            } else if (filter.type === 'merchant') {
                result = result.filter(tx => extractMerchant(tx) === filter.value);
            }
        }

        if (typeFilter !== 'all') {
            result = result.filter(tx => tx.type === typeFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(tx =>
                tx.description.toLowerCase().includes(q) ||
                tx.operation.toLowerCase().includes(q) ||
                tx.beneficiaryName.toLowerCase().includes(q) ||
                categoryName(tx).toLowerCase().includes(q)
            );
        }

        result.sort((a, b) => {
            let va, vb;
            switch (sortField) {
                case 'date': va = a.date; vb = b.date; break;
                case 'amount': va = a.amount; vb = b.amount; break;
                case 'balance': va = a.balance; vb = b.balance; break;
                default: va = a.date; vb = b.date;
            }
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === 'asc' ? va - vb : vb - va;
        });

        return result;
    }, [transactions, search, typeFilter, sortField, sortDir, filter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
        setPage(0);
    };

    const arrow = (field) => sortField !== field ? '' : sortDir === 'asc' ? ' ↑' : ' ↓';

    const fmtDate = (d) => {
        const [y, m, day] = d.split('/');
        return `${day}.${m}.${y}`;
    };

    const filteredIncome = filtered.reduce((s, tx) => s + tx.credit, 0);
    const filteredExpense = filtered.reduce((s, tx) => s + tx.debit, 0);

    const filterLabels = { all: t('tx.all'), income: t('tx.income'), expense: t('tx.expenses') };

    return (
        <div className="card tx-section">
            <div className="tx-header">
                <h3>{t('tx.title')}</h3>
                {filter && (
                    <div className="tx-active-filter">
                        <span className="filter-badge">
                            {filter.type === 'category' ? '📂 ' : '🛒 '}
                            {filter.value}
                            <button className="filter-clear-btn" onClick={onClearFilter} title={t('tx.removeFilter')} aria-label="Remove filter">✕</button>
                        </span>
                    </div>
                )}
            </div>

            <div className="tx-controls">
                <div className="tx-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <input placeholder={t('tx.search')} value={searchInput} onChange={e => { setSearchInput(e.target.value); setPage(0); }} />
                </div>
                <div className="tx-filters">
                    {['all', 'income', 'expense'].map(f => (
                        <button key={f} className={`tx-filter ${typeFilter === f ? 'active ' + f : ''}`} onClick={() => { setTypeFilter(f); setPage(0); }}>
                            {filterLabels[f]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="tx-stats-row">
                <span>{filtered.length} {t('dash.transactions')}</span>
                <span style={{ color: '#10b981' }}>+{filteredIncome.toFixed(2)} {currency}</span>
                <span style={{ color: '#ef4444' }}>-{filteredExpense.toFixed(2)} {currency}</span>
            </div>

            {/* Desktop table */}
            <div className="tx-table-wrap tx-desktop-only">
                <table className="tx-table">
                    <thead>
                        <tr>
                            <th className="sort" onClick={() => handleSort('date')}>{t('tx.date')}{arrow('date')}</th>
                            <th>{t('tx.category')}</th>
                            <th>{t('tx.description')}</th>
                            <th className="sort" onClick={() => handleSort('amount')}>{t('tx.amount')}{arrow('amount')}</th>
                            <th className="sort" onClick={() => handleSort('balance')}>{t('tx.balance')}{arrow('balance')}</th>
                            <th>{t('tx.beneficiary')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.map((tx, i) => (
                            <tr key={`${tx.date}-${i}`} className={tx.type}>
                                <td className="mono">{fmtDate(tx.date)}</td>
                                <td><span className="cat-badge">{categoryName(tx)}</span></td>
                                <td className="desc-cell" title={tx.description || tx.operation}>{tx.description || tx.operation}</td>
                                <td className={`mono amt ${tx.type}`}>{tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} {currency}</td>
                                <td className="mono">{tx.balance.toFixed(2)} {currency}</td>
                                <td className="ben-cell">{tx.beneficiaryName || '—'}</td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td colSpan="6" className="empty-row">{t('tx.noResults')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile compact list */}
            <div className="tx-mobile-list tx-mobile-only">
                {paged.map((tx, i) => {
                    const cat = categorize(tx);
                    return (
                        <div
                            key={`m-${tx.date}-${i}`}
                            className={`tx-mobile-row ${tx.type}`}
                            onClick={() => setSelectedTx(tx)}
                        >
                            <span className="tx-m-icon">{cat.icon}</span>
                            <div className="tx-m-body">
                                <span className="tx-m-desc">{extractMerchant(tx) || tx.description || tx.operation}</span>
                                <span className="tx-m-date">{fmtDate(tx.date)}</span>
                            </div>
                            <span className={`tx-m-amount ${tx.type}`}>
                                {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} {currency}
                            </span>
                        </div>
                    );
                })}
                {paged.length === 0 && (
                    <div className="tx-mobile-empty">{t('tx.noResults')}</div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="tx-pagination">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('tx.prev')}</button>
                    <span>{page + 1} / {totalPages}</span>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{t('tx.next')}</button>
                </div>
            )}

            {/* Mobile transaction detail modal */}
            {selectedTx && (
                <TxDetailModal tx={selectedTx} currency={currency} fmtDate={fmtDate} t={t} onClose={() => setSelectedTx(null)} />
            )}
        </div>
    );
}

function TxDetailModal({ tx, currency, fmtDate, t, onClose }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const cat = categorize(tx);
    return (
        <div className="tx-modal-overlay" onClick={onClose}>
            <div className="tx-modal-panel" onClick={e => e.stopPropagation()}>
                <div className="tx-modal-header">
                    <div className={`tx-modal-amount ${tx.type}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} {currency}
                    </div>
                    <button className="tx-modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="tx-modal-cat">
                    <span className="tx-modal-cat-icon">{cat.icon}</span>
                    <span className="tx-modal-cat-name">{cat.name}</span>
                </div>

                <div className="tx-modal-rows">
                    <TxModalRow label={t('tx.date')} value={fmtDate(tx.date)} />
                    <TxModalRow label={t('tx.description')} value={tx.description || tx.operation} />
                    {tx.operation && tx.description && tx.operation !== tx.description && (
                        <TxModalRow label={t('tx.operation') || 'Operation'} value={tx.operation} />
                    )}
                    <TxModalRow label={t('tx.balance')} value={`${tx.balance.toFixed(2)} ${currency}`} />
                    {tx.beneficiaryName && (
                        <TxModalRow label={t('tx.beneficiary')} value={tx.beneficiaryName} />
                    )}
                    {tx.beneficiaryAccount && (
                        <TxModalRow label={t('tx.account') || 'Account'} value={tx.beneficiaryAccount} mono />
                    )}
                </div>
            </div>
        </div>
    );
}

function TxModalRow({ label, value, mono }) {
    if (!value) return null;
    return (
        <div className="tx-modal-row">
            <span className="tx-modal-label">{label}</span>
            <span className={`tx-modal-value${mono ? ' mono' : ''}`}>{value}</span>
        </div>
    );
}
