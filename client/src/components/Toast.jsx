import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile'; // Fix #6

let toastId = 0;
const listeners = [];

export function showToast(msg, type = 'success') {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, msg, type }));
}

export default function ToastContainer() {
  const { colors, isDark } = useTheme();
  const isMobile = useIsMobile(); // Fix #6 — reactive, replaces window.innerWidth < 640
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
              background: isError ? colors.errorBg : (isDark ? '#1a1a1a' : '#111827'),
              color: isDark ? colors.text : '#ffffff',
              padding: 'clamp(9px, 1.8vw, 10px) clamp(12px, 2.5vw, 16px)',
              borderRadius: 'clamp(8px, 1.5vw, 10px)',
              fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              fontWeight: 500,
              boxShadow: isError
                ? (isDark ? '0 4px 16px rgba(239,68,68,0.4)' : '0 4px 16px rgba(220,38,38,0.25)')
                : (isDark ? '0 4px 16px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.18)'),
              minWidth: 'clamp(200px, 50vw, 250px)',
              border: isError ? `1px solid ${colors.errorLight}` : '1px solid transparent',
              wordBreak: 'break-word',
            }}
          >
            {/* Fix #6 — isMobile instead of window.innerWidth < 640 */}
            {isError
              ? <XCircle size={isMobile ? 15 : 16} color={colors.error} strokeWidth={2.5} />
              : <CheckCircle2 size={isMobile ? 15 : 16} color={colors.success} strokeWidth={2.5} />
            }
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
