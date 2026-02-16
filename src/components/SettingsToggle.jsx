import { useSettings } from '../SettingsContext';

export default function SettingsToggle() {
    const { theme, lang, toggleTheme, toggleLang } = useSettings();

    return (
        <div className="settings-bar">
            <button className="settings-btn lang-btn" onClick={toggleLang} title="Switch language" aria-label={lang === 'en' ? 'Switch to Russian' : 'Switch to English'}>
                {lang === 'en' ? 'RU' : 'EN'}
            </button>
            <button className="settings-btn" onClick={toggleTheme} title="Toggle theme" aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                {theme === 'light' ? '🌙' : '☀️'}
            </button>
        </div>
    );
}
