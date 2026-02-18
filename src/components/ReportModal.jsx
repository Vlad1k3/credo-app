import { useState, useCallback, useEffect } from 'react';
import { useSettings } from '../SettingsContext';
import { anonymizeTransactions, anonymizeAccountInfos } from '../utils/anonymize';
import { transactionsToCSV } from '../utils/csvExport';

const REPORT_TYPES = ['calculation', 'filter', 'processing', 'other'];

export default function ReportModal({ transactions, accountInfos, onClose, showToast }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const { t } = useSettings();
  const [reportType, setReportType] = useState('calculation');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      setError(t('report.errorNoDescription'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const anonTx = anonymizeTransactions(transactions);
      const anonInfos = anonymizeAccountInfos(accountInfos);
      const csvContent = transactionsToCSV(anonTx, anonInfos);

      const { submitReport } = await import('../utils/report.js');
      await submitReport({
        csvContent,
        description: description.trim(),
        contact: contact.trim(),
        reportType,
      });

      showToast(t('report.success'));
      onClose();
    } catch (err) {
      console.error('Report submission failed:', err);
      setError(t('report.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  }, [transactions, accountInfos, description, contact, reportType, t, showToast, onClose]);

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-panel" onClick={e => e.stopPropagation()}>
        <div className="report-header">
          <span className="report-title">{t('report.title')}</span>
          <button className="picker-close" onClick={onClose}>✕</button>
        </div>

        <div className="report-body">
          <div className="report-field">
            <label className="report-label">{t('report.type')}</label>
            <div className="report-type-group">
              {REPORT_TYPES.map(type => (
                <button
                  key={type}
                  className={`report-type-btn ${reportType === type ? 'active' : ''}`}
                  onClick={() => setReportType(type)}
                >
                  {t(`report.type.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="report-field">
            <label className="report-label">{t('report.description')}</label>
            <textarea
              className="report-textarea"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('report.descriptionPlaceholder')}
              maxLength={2000}
            />
          </div>

          <div className="report-field">
            <label className="report-label">{t('report.contact')}</label>
            <input
              className="report-input"
              type="text"
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder={t('report.contactPlaceholder')}
            />
          </div>

          <div className="report-privacy">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>{t('report.privacyNote')}</span>
          </div>

          <div className="report-notice report-notice--personal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{t('report.noticePersonal')} <a href="https://t.me/deboshir" target="_blank" rel="noopener noreferrer">@deboshir</a></span>
          </div>

          <div className="report-notice report-notice--docs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span>{t('report.noticeDocs')}</span>
          </div>

          {error && <div className="report-error">{error}</div>}

          <button
            className="report-submit"
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
          >
            {submitting ? t('report.submitting') : t('report.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
