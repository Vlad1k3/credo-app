import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'success', onDone }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(onDone, 300);
        }, 2500);
        return () => clearTimeout(t);
    }, [onDone]);

    return (
        <div className={`toast toast-${type} ${visible ? 'toast-in' : 'toast-out'}`}>
            {type === 'success' && <span className="toast-icon">✓</span>}
            {message}
        </div>
    );
}
