const STORAGE_KEY = 'credo_statement_data';

export function saveToLocal(transactions, accountInfos = []) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, accountInfos }));
        return true;
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
        return false;
    }
}

export function loadFromLocal() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        const parsed = JSON.parse(data);
        // Backward compat: old format was just an array of transactions
        let result;
        if (Array.isArray(parsed)) {
            result = { transactions: parsed, accountInfos: [] };
        } else {
            result = parsed;
        }
        // Normalize: ensure every transaction has a currency field
        // (old data from before multi-currency support may lack it)
        if (result.transactions) {
            for (const t of result.transactions) {
                if (!t.currency) t.currency = 'GEL';
            }
        }
        return result;
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        return null;
    }
}


export function clearLocal() {
    localStorage.removeItem(STORAGE_KEY);
}
