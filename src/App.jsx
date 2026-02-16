import { useState, useEffect, useCallback } from 'react';
import UploadScreen from './components/UploadScreen';
import Dashboard from './components/Dashboard';
import Toast from './components/Toast';
import { saveToLocal, loadFromLocal, clearLocal } from './utils/storage';
import { SettingsProvider } from './SettingsContext';

export default function App() {
  const [transactions, setTransactions] = useState(null);
  const [accountInfos, setAccountInfos] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = loadFromLocal();
    if (saved && saved.transactions && saved.transactions.length > 0) {
      setTransactions(saved.transactions);
      setAccountInfos(saved.accountInfos || []);
    }
    setIsLoaded(true);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const handleDataLoaded = useCallback((data, infos) => {
    setTransactions(data);
    setAccountInfos(infos || []);
    saveToLocal(data, infos || []);
    showToast(`${data.length} transactions loaded`);
  }, [showToast]);

  // Used by Dashboard to merge new files into existing data
  const handleUpdateData = useCallback((mergedTransactions, mergedInfos) => {
    setTransactions(mergedTransactions);
    setAccountInfos(mergedInfos);
    saveToLocal(mergedTransactions, mergedInfos);
  }, []);

  const handleClear = useCallback(() => {
    setTransactions(null);
    setAccountInfos([]);
    clearLocal();
  }, []);

  if (!isLoaded) {
    return (
      <div className="app-loading">
        <div className="loader" />
      </div>
    );
  }

  return (
    <SettingsProvider>
      <div className="app">
        {transactions ? (
          <Dashboard
            transactions={transactions}
            accountInfos={accountInfos}
            onClear={handleClear}
            onUpdateData={handleUpdateData}
            showToast={showToast}
          />
        ) : (
          <UploadScreen onDataLoaded={handleDataLoaded} />
        )}
        {toast && (
          <Toast
            key={toast.key}
            message={toast.message}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
      </div>
    </SettingsProvider>
  );
}
