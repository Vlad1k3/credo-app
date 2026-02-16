import { useState, useCallback } from 'react';
import { parseFiles } from '../utils/parser';
import { useSettings } from '../SettingsContext';
import SettingsToggle from './SettingsToggle';

export default function UploadScreen({ onDataLoaded }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useSettings();

    const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'csv', 'pdf'];

    const handleFiles = useCallback(async (fileList) => {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        const invalid = files.filter(f => {
            const ext = f.name.split('.').pop().toLowerCase();
            return !ALLOWED_EXTENSIONS.includes(ext);
        });

        if (invalid.length > 0) {
            setError(`${t('upload.unsupported')}${invalid.map(f => f.name).join(', ')}${t('upload.unsupportedSuffix')}`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { transactions, accountInfos } = await parseFiles(files);
            if (transactions.length === 0) {
                setError(t('upload.noTransactions'));
                setIsLoading(false);
                return;
            }
            onDataLoaded(transactions, accountInfos);
        } catch (err) {
            setError(t('upload.parseFailed') + err.message);
            setIsLoading(false);
        }
    }, [onDataLoaded, t]);

    return (
        <div className="upload-screen">
            <div className="upload-settings">
                <SettingsToggle />
            </div>
            <div className="upload-hero">
                <div className="upload-branding">
                    <h1>{t('app.title')}</h1>
                    <p>{t('upload.subtitle')}</p>
                </div>

                <div
                    className={`upload-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                >
                    {isLoading ? (
                        <div className="upload-loading">
                            <div className="loader" />
                            <p>{t('upload.processing')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="upload-icon-area">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <p className="upload-main-text">
                                {t('upload.drop')} <strong>.xlsx</strong> {t('upload.or')} <strong>.pdf</strong> {t('upload.filesHere')}
                            </p>
                            <p className="upload-hint">{t('upload.hint')}</p>
                            <label className="upload-btn">
                                {t('upload.btn')}
                                <input type="file" accept=".xlsx,.xls,.csv,.pdf" multiple onChange={(e) => handleFiles(e.target.files)} hidden />
                            </label>
                        </>
                    )}
                </div>

                {error && <div className="upload-error">{error}</div>}

                <div className="privacy-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    {t('upload.privacy')}
                </div>
            </div>
        </div>
    );
}
