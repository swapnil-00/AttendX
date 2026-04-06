// Fix #4 — Inline confirmation modal replacing window.confirm
import { Trash2, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ name, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 16px)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={onCancel}
        className="fade-in"
        style={{
          background: '#ffffff',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(20px, 4vw, 28px)',
          maxWidth: 'clamp(320px, 90vw, 380px)',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          border: '1px solid #e5e7eb',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 'clamp(44px, 8vw, 48px)', 
          height: 'clamp(44px, 8vw, 48px)', 
          borderRadius: 'clamp(10px, 2vw, 12px)',
          background: '#fef2f2', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 'clamp(12px, 2.5vw, 16px)',
        }}>
          <AlertTriangle size={window.innerWidth < 640 ? 20 : 22} color="#dc2626" strokeWidth={2} />
        </div>

        <h3 style={{ fontWeight: 700, fontSize: 'clamp(0.95rem, 2.2vw, 1rem)', color: '#111827', margin: '0 0 8px' }}>
          Remove member?
        </h3>
        <p style={{ fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)', color: '#6b7280', margin: '0 0 clamp(20px, 4vw, 24px)', lineHeight: 1.5 }}>
          <strong style={{ color: '#111827' }}>"{name}"</strong> and all their attendance records will be permanently deleted.
        </p>

        <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 10px)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            style={{
              padding: 'clamp(7px, 1.5vw, 8px) clamp(14px, 2.5vw, 18px)', 
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: '1px solid #d1d5db', background: '#ffffff',
              color: '#374151', fontWeight: 500, fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              cursor: 'pointer', transition: 'background 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            onClick={onConfirm}
            style={{
              padding: 'clamp(7px, 1.5vw, 8px) clamp(14px, 2.5vw, 18px)', 
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: 'none', background: '#dc2626',
              color: '#ffffff', fontWeight: 500, fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 6px)',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
          >
            <Trash2 size={window.innerWidth < 640 ? 13 : 14} strokeWidth={2} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
