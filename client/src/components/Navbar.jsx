import { Grid3x3, Plus, Download, Loader2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile'; // Fix #6

export default function Navbar({ onAddPerson, onDownload, isDownloading }) {
  const { isDark, toggleTheme, colors } = useTheme();
  const isMobile = useIsMobile(); // Fix #6 — reactive, not stale window.innerWidth

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: colors.cardBg,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: `0 1px 3px ${colors.shadow}`,
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 clamp(12px, 3vw, 24px)',
          minHeight: 'clamp(56px, 10vw, 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'clamp(8px, 2vw, 10px)',
          paddingTop: 'clamp(8px, 2vw, 10px)',
          paddingBottom: 'clamp(8px, 2vw, 10px)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 10px)' }}>
          <div
            style={{
              width: 'clamp(32px, 6vw, 36px)',
              height: 'clamp(32px, 6vw, 36px)',
              background: isDark ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#0a0a0a',
              borderRadius: 'clamp(8px, 2vw, 10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.3s ease',
            }}
          >
            <Grid3x3 size={18} color="#ffffff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', letterSpacing: '-0.03em', color: colors.text, transition: 'color 0.3s ease' }}>
            AttendX
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)', flexWrap: 'wrap' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 'clamp(36px, 7vw, 40px)',
              height: 'clamp(36px, 7vw, 40px)',
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: `1.5px solid ${colors.border}`,
              background: colors.cardBg,
              color: colors.text,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.hover; e.currentTarget.style.borderColor = colors.textTertiary; }}
            onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg; e.currentTarget.style.borderColor = colors.border; }}
          >
            {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>

          <button
            id="btn-add-person"
            onClick={onAddPerson}
            style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 6px)',
              padding: 'clamp(7px, 1.5vw, 8px) clamp(10px, 2vw, 14px)',
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: `1.5px solid ${colors.border}`,
              background: colors.cardBg,
              color: colors.text,
              fontWeight: 500, fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              cursor: 'pointer', transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.hover; e.currentTarget.style.borderColor = colors.textTertiary; }}
            onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg; e.currentTarget.style.borderColor = colors.border; }}
          >
            {/* Fix #6 — isMobile instead of window.innerWidth < 640 */}
            <Plus size={isMobile ? 16 : 15} strokeWidth={2.5} />
            <span className="nav-btn-text">Add Person</span>
          </button>

          <button
            id="btn-download-excel"
            onClick={onDownload}
            disabled={isDownloading}
            style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 6px)',
              padding: 'clamp(7px, 1.5vw, 8px) clamp(10px, 2vw, 14px)',
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: 'none',
              background: isDownloading ? colors.textTertiary : (isDark ? '#3b82f6' : '#111827'),
              color: '#ffffff',
              fontWeight: 500, fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => !isDownloading && (e.currentTarget.style.background = isDark ? '#2563eb' : '#1f2937')}
            onMouseLeave={e => !isDownloading && (e.currentTarget.style.background = isDark ? '#3b82f6' : '#111827')}
          >
            {/* Fix #6 — isMobile instead of window.innerWidth < 640 */}
            {isDownloading
              ? <Loader2 size={isMobile ? 16 : 15} strokeWidth={2.5} className="animate-spin" />
              : <Download size={isMobile ? 16 : 15} strokeWidth={2.5} />
            }
            <span className="nav-btn-text">{isDownloading ? 'Generating...' : 'Download Excel'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
