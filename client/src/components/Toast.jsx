import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

let toastId = 0;
const listeners = [];

// Fix #7 — Support 'success' | 'error' type
export function showToast(msg, type = 'success') {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, msg, type }));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = ({ id, msg, type }) => {
      setToasts(prev => [...prev, { id, msg, type, out: false }]);
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, out: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
      }, 2800);
    };
    listeners.push(handler);
    return () => {
      const i = listeners.indexOf(handler);
      if (i !== -1) listeners.splice(i, 1);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 'clamp(16px, 3vw, 24px)', 
      right: 'clamp(16px, 3vw, 24px)', 
      left: 'clamp(16px, 3vw, auto)',
      maxWidth: 'clamp(280px, 90vw, 400px)',
      zIndex: 1000, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'clamp(6px, 1.5vw, 8px)' 
    }}>
      {toasts.map(t => {
        const isError = t.type === 'error';
        return (
          <div
            key={t.id}
            className={t.out ? 'toast-out' : 'toast-in'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.5vw, 8px)',
              background: isError ? '#450a0a' : '#111827',
              color: '#ffffff',
              padding: 'clamp(9px, 1.8vw, 10px) clamp(12px, 2.5vw, 16px)',
              borderRadius: 'clamp(8px, 1.5vw, 10px)',
              fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              fontWeight: 500,
              boxShadow: isError
                ? '0 4px 16px rgba(220,38,38,0.25)'
                : '0 4px 16px rgba(0,0,0,0.18)',
              minWidth: 'clamp(200px, 50vw, 250px)',
              border: isError ? '1px solid #7f1d1d' : '1px solid transparent',
              wordBreak: 'break-word',
            }}
          >
            {isError
              ? <XCircle size={window.innerWidth < 640 ? 15 : 16} color="#f87171" strokeWidth={2.5} />
              : <CheckCircle2 size={window.innerWidth < 640 ? 15 : 16} color="#4ade80" strokeWidth={2.5} />
            }
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
