import { useRef, useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';

export default function AddPersonPanel({ onAdd }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAdd(name.trim());
      setName('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 'clamp(12px, 2vw, 16px)',
        padding: 'clamp(16px, 3vw, 24px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: 'clamp(16px, 2.5vw, 20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)', marginBottom: 'clamp(12px, 2vw, 16px)' }}>
        <UserPlus size={window.innerWidth < 640 ? 16 : 18} color="#6b7280" strokeWidth={2} />
        <span style={{ fontWeight: 600, fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)', color: '#111827' }}>Add New Member</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 10px)', maxWidth: '100%', flexWrap: 'wrap' }}>
        <input
          id="input-person-name"
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter full name..."
          style={{
            flex: '1 1 auto',
            minWidth: 'clamp(200px, 50vw, 300px)',
            padding: 'clamp(8px, 1.5vw, 9px) clamp(12px, 2vw, 14px)',
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            border: '1px solid #d1d5db',
            fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
            color: '#111827',
            background: '#ffffff',
            transition: 'border-color 150ms ease',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#111827')}
          onBlur={e => (e.currentTarget.style.borderColor = '#d1d5db')}
          disabled={loading}
        />
        <button
          id="btn-submit-person"
          type="submit"
          disabled={loading || !name.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 6px)',
            padding: 'clamp(8px, 1.5vw, 9px) clamp(16px, 3vw, 20px)',
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            border: 'none',
            background: loading || !name.trim() ? '#9ca3af' : '#111827',
            color: '#ffffff',
            fontWeight: 500,
            fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
            cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 150ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { if (!loading && name.trim()) e.currentTarget.style.background = '#1f2937'; }}
          onMouseLeave={e => { if (!loading && name.trim()) e.currentTarget.style.background = '#111827'; }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
    </div>
  );
}
