// Fix #4 — Inline confirmation modal replacing window.confirm
import { Trash2, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile'; // Fix #6

export default function ConfirmModal({ name, onConfirm, onCancel }) {
  const { colors, isDark } = useTheme();
  const isMobile = useIsMobile(); // Fix #6 — reactive breakpoint

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 16px)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancel} // clicking the backdrop dismisses
    >
      {/* Fix #5 — stopPropagation prevents backdrop click from firing when clicking inside card */}
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          background: colors.cardBg,
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(20px, 4vw, 28px)',
          maxWidth: 'clamp(320px, 90vw, 380px)',
          width: '100%',
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.18)',
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        {/* Icon */}
        <div style={{
          width: 'clamp(44px, 8vw, 48px)',
          height: 'clamp(44px, 8vw, 48px)',
          borderRadius: 'clamp(10px, 2vw, 12px)',
          background: colors.errorBg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 'clamp(12px, 2.5vw, 16px)',
        }}>
          {/* Fix #6 — useIsMobile replaces window.innerWidth < 640 */}
          <AlertTriangle size={isMobile ? 20 : 22} color={colors.error} strokeWidth={2} />
        </div>

        <h3 style={{ fontWeight: 700, fontSize: 'clamp(0.95rem, 2.2vw, 1rem)', color: colors.text, margin: '0 0 8px' }}>
          Remove member?
        </h3>
        <p style={{ fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)', color: colors.textSecondary, margin: '0 0 clamp(20px, 4vw, 24px)', lineHeight: 1.5 }}>
          <strong style={{ color: colors.text }}>"{name}"</strong> and all their attendance records will be permanently deleted.
        </p>

        <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 10px)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            style={{
              padding: 'clamp(7px, 1.5vw, 8px) clamp(14px, 2.5vw, 18px)',
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: `1px solid ${colors.border}`, background: colors.bg,
              color: colors.textSecondary, fontWeight: 500, fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              cursor: 'pointer', transition: 'background 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.hover}
            onMouseLeave={e => e.currentTarget.style.background = colors.bg}
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            onClick={onConfirm}
            style={{
              padding: 'clamp(7px, 1.5vw, 8px) clamp(14px, 2.5vw, 18px)',
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: 'none', background: colors.error,
              color: '#ffffff', fontWeight: 500, fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 6px)',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? '#dc2626' : '#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.background = colors.error}
          >
            <Trash2 size={isMobile ? 13 : 14} strokeWidth={2} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
