import { useState, useMemo, useEffect } from 'react';
import { useSettings } from '../SettingsContext';

export default function PeriodPicker({ mode, availableKeys, selectedKey, onSelect, customRange, onCustomRange, onClose }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const availSet = useMemo(() => new Set(availableKeys || []), [availableKeys]);
    const { t } = useSettings();

    const yearsRange = useMemo(() => {
        if (!availableKeys?.length) return { min: 2024, max: 2026 };
        const years = availableKeys.map(k => parseInt(k.substring(0, 4)));
        return { min: Math.min(...years), max: Math.max(...years) };
    }, [availableKeys]);

    const pickerTitles = {
        day: t('picker.selectDay'),
        week: t('picker.selectWeek'),
        month: t('picker.selectMonth'),
        year: t('picker.selectYear'),
        custom: t('picker.customRange'),
    };

    return (
        <div className="picker-overlay" onClick={onClose}>
            <div className="picker-panel" onClick={e => e.stopPropagation()}>
                <div className="picker-header">
                    <span className="picker-title">{pickerTitles[mode]}</span>
                    <button className="picker-close" onClick={onClose}>✕</button>
                </div>

                {(mode === 'day' || mode === 'week') && (
                    <CalendarPicker
                        mode={mode}
                        availSet={availSet}
                        selectedKey={selectedKey}
                        onSelect={(key) => { onSelect(key); onClose(); }}
                        yearsRange={yearsRange}
                    />
                )}

                {mode === 'month' && (
                    <MonthPicker
                        availSet={availSet}
                        selectedKey={selectedKey}
                        onSelect={(key) => { onSelect(key); onClose(); }}
                        yearsRange={yearsRange}
                    />
                )}

                {mode === 'year' && (
                    <YearPicker
                        availSet={availSet}
                        selectedKey={selectedKey}
                        onSelect={(key) => { onSelect(key); onClose(); }}
                        yearsRange={yearsRange}
                    />
                )}

                {mode === 'custom' && (
                    <CustomRangePicker
                        customRange={customRange}
                        onChange={onCustomRange}
                        onApply={onClose}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Calendar (Day / Week picker) ──────────────────────

function CalendarPicker({ mode, availSet, selectedKey, onSelect, yearsRange }) {
    const { t } = useSettings();
    const MONTH_FULL = t('months.full');
    const DAY_LABELS = t('days.short');

    const initial = selectedKey
        ? { year: parseInt(selectedKey.substring(0, 4)), month: parseInt(selectedKey.substring(5, 7)) - 1 }
        : { year: yearsRange.max, month: new Date().getMonth() };

    const [viewYear, setViewYear] = useState(initial.year);
    const [viewMonth, setViewMonth] = useState(initial.month);

    const days = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const getWeekKey = (dateKey) => {
        const [y, m, d] = dateKey.split('/').map(Number);
        const dt = new Date(y, m - 1, d);
        const day = dt.getDay();
        const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(dt.setDate(diff));
        return fmtKey(monday);
    };

    const isSelected = (dateKey) => {
        if (mode === 'day') return dateKey === selectedKey;
        if (mode === 'week') return getWeekKey(dateKey) === selectedKey;
        return false;
    };

    const isWeekHighlight = (dateKey) => {
        if (mode !== 'week' || !selectedKey) return false;
        return getWeekKey(dateKey) === selectedKey;
    };

    const handleDayClick = (dateKey) => {
        if (mode === 'day') {
            if (availSet.has(dateKey)) onSelect(dateKey);
        } else {
            const wk = getWeekKey(dateKey);
            if (availSet.has(wk)) onSelect(wk);
        }
    };

    return (
        <div className="cal-picker">
            <div className="cal-nav">
                <button onClick={prevMonth} className="cal-nav-btn">←</button>
                <span className="cal-nav-label">{MONTH_FULL[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} className="cal-nav-btn">→</button>
            </div>
            <div className="cal-grid">
                {DAY_LABELS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
                {days.map((day, i) => {
                    const key = day.key;
                    const isAvail = mode === 'day' ? availSet.has(key) : availSet.has(getWeekKey(key));
                    const isCurrent = day.isCurrentMonth;
                    return (
                        <button
                            key={i}
                            className={`cal-day ${!isCurrent ? 'other-month' : ''} ${isAvail ? 'available' : 'unavailable'} ${isSelected(key) ? 'selected' : ''} ${isWeekHighlight(key) ? 'week-hl' : ''}`}
                            onClick={() => handleDayClick(key)}
                            disabled={!isAvail}
                        >
                            {day.day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Month Picker ──────────────────────────────

function MonthPicker({ availSet, selectedKey, onSelect, yearsRange }) {
    const { t } = useSettings();
    const MONTH_NAMES = t('months.short');

    const [viewYear, setViewYear] = useState(
        selectedKey ? parseInt(selectedKey.substring(0, 4)) : yearsRange.max
    );

    return (
        <div className="month-picker">
            <div className="cal-nav">
                <button onClick={() => setViewYear(y => y - 1)} className="cal-nav-btn">←</button>
                <span className="cal-nav-label">{viewYear}</span>
                <button onClick={() => setViewYear(y => y + 1)} className="cal-nav-btn">→</button>
            </div>
            <div className="month-grid">
                {MONTH_NAMES.map((m, i) => {
                    const key = `${viewYear}/${String(i + 1).padStart(2, '0')}`;
                    const isAvail = availSet.has(key);
                    const isSel = key === selectedKey;
                    return (
                        <button
                            key={m}
                            className={`month-btn ${isAvail ? 'available' : 'unavailable'} ${isSel ? 'selected' : ''}`}
                            disabled={!isAvail}
                            onClick={() => onSelect(key)}
                        >
                            {m}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Year Picker ──────────────────────────────

function YearPicker({ availSet, selectedKey, onSelect, yearsRange }) {
    const years = [];
    for (let y = yearsRange.min; y <= yearsRange.max; y++) years.push(String(y));

    return (
        <div className="year-picker">
            <div className="year-grid">
                {years.map(y => {
                    const isAvail = availSet.has(y);
                    const isSel = y === selectedKey;
                    return (
                        <button
                            key={y}
                            className={`year-btn ${isAvail ? 'available' : 'unavailable'} ${isSel ? 'selected' : ''}`}
                            disabled={!isAvail}
                            onClick={() => onSelect(y)}
                        >
                            {y}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Custom Range Picker ──────────────────────────────

function CustomRangePicker({ customRange, onChange, onApply }) {
    const { t } = useSettings();
    const [fromDate, setFromDate] = useState(customRange?.from || '');
    const [toDate, setToDate] = useState(customRange?.to || '');

    const handleApply = () => {
        if (fromDate && toDate) {
            onChange({ from: fromDate, to: toDate });
            onApply();
        }
    };

    const toInputDate = (k) => k ? k.replace(/\//g, '-') : '';
    const fromInputDate = (v) => v ? v.replace(/-/g, '/') : '';

    return (
        <div className="custom-range">
            <div className="range-fields">
                <label className="range-label">
                    <span>{t('picker.from')}</span>
                    <input
                        type="date"
                        className="range-input"
                        value={toInputDate(fromDate)}
                        onChange={(e) => setFromDate(fromInputDate(e.target.value))}
                    />
                </label>
                <span className="range-sep">→</span>
                <label className="range-label">
                    <span>{t('picker.to')}</span>
                    <input
                        type="date"
                        className="range-input"
                        value={toInputDate(toDate)}
                        onChange={(e) => setToDate(fromInputDate(e.target.value))}
                    />
                </label>
            </div>
            <button
                className="range-apply-btn"
                disabled={!fromDate || !toDate || fromDate > toDate}
                onClick={handleApply}
            >
                {t('picker.apply')}
            </button>
        </div>
    );
}

// ─── Helpers ──────────────────────────────

function buildCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const days = [];

    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
        const d = prevMonthLastDate - i;
        const dt = new Date(year, month - 1, d);
        days.push({ day: d, key: fmtKey(dt), isCurrentMonth: false });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        days.push({ day: d, key: fmtKey(dt), isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
        const dt = new Date(year, month + 1, d);
        days.push({ day: d, key: fmtKey(dt), isCurrentMonth: false });
    }

    return days;
}

function fmtKey(dt) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
}
