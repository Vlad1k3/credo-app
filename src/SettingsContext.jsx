import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations from './i18n';

const SettingsContext = createContext();

const STORAGE_KEY = 'credo-settings';

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
}

function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function SettingsProvider({ children }) {
    const [lang, setLangState] = useState(() => loadSettings().lang || 'en');
    const [theme, setThemeState] = useState(() => loadSettings().theme || 'light');

    const setLang = useCallback((l) => {
        setLangState(l);
        saveSettings({ ...loadSettings(), lang: l });
    }, []);

    const setTheme = useCallback((t) => {
        setThemeState(t);
        saveSettings({ ...loadSettings(), theme: t });
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    }, [theme, setTheme]);

    const toggleLang = useCallback(() => {
        setLang(lang === 'en' ? 'ru' : 'en');
    }, [lang, setLang]);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const t = useCallback((key) => {
        return translations[lang]?.[key] ?? translations.en?.[key] ?? key;
    }, [lang]);

    return (
        <SettingsContext.Provider value={{ lang, theme, setLang, setTheme, toggleTheme, toggleLang, t }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
