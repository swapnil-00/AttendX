import { Trash2 } from 'lucide-react';
import { normalizeDate } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

function AttPill({ status, onClick, disabled, isFuture, colors }) {
  const isP = status === 'P';
  const noRecord = !status;

  return (
    <button
      className="att-pill"
      onClick={onClick}
      disabled={disabled || isFuture}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        fontWeight: 700,
        fontSize: '0.75rem',
        letterSpacing: '0.02em',
        background: isFuture ? colors.hover : (noRecord ? colors.bgTertiary : isP ? colors.successBg : colors.errorBg),
        color: isFuture ? colors.textTertiary : (noRecord ? colors.textTertiary : isP ? colors.success : colors.error),
        cursor: isFuture ? 'not-allowed' : 'pointer',
        opacity: isFuture ? 0.5 : 1,
      }}
      title={isFuture ? 'Cannot mark attendance for future dates' : ''}
    >
      {isFuture ? '🔒' : (noRecord ? '—' : status)}
    </button>
  );
}

function SkeletonRow({ cols, colors }) {
  return (
    <tr>
      <td style={{ padding: '12px 16px' }}>
        <div className="skeleton" style={{ height: 14, width: 100, background: colors.bgTertiary }} />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 28, width: 36, margin: '0 auto', borderRadius: 6, background: colors.bgTertiary }} />
        </td>
      ))}
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 14, width: 28, margin: '0 auto', background: colors.bgTertiary }} />
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 14, width: 28, margin: '0 auto', background: colors.bgTertiary }} />
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 28, width: 56, margin: '0 auto', borderRadius: 6, background: colors.bgTertiary }} />
      </td>
    </tr>
  );
}

export default function AttendanceTable({
  persons,
  attendance,
  dates,
  selectedMonth,
  onMonthChange,
  onToggle,
  onDelete,
  loading,
}) {
  const { colors } = useTheme();
  // Fix #3 — Build lookup with integer person_id keys to avoid string/int mismatch
  const lookup = {};
  attendance.forEach(a => {
    const pid = parseInt(a.person_id);
    const d   = normalizeDate(a.date);
    lookup[`${pid}_${d}`] = a.status;
  });

  const getStatus  = (personId, dateStr) => lookup[`${parseInt(personId)}_${dateStr}`] || null;
  const countP     = (personId) => dates.filter(d => getStatus(personId, d) === 'P').length;
  const countA     = (personId) => dates.filter(d => getStatus(personId, d) === 'A').length;

  // Check if date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFutureDate = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  // Parse selected month
  const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 2; y--) {
    yearOptions.push(y);
  }

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle month change
  const handleMonthSelect = (month) => {
    const newValue = `${selectedYear}-${String(month).padStart(2, '0')}`;
    onMonthChange(newValue);
  };

  // Handle year change
  const handleYearSelect = (year) => {
    const newValue = `${year}-${String(selectedMonthNum).padStart(2, '0')}`;
    onMonthChange(newValue);
  };

  const formatDateHeader = (dateStr) => {
    const [, , day] = dateStr.split('-');
    const month = dateStr.slice(5, 7);
    return `${day}/${month}`;
  };

  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 'clamp(12px, 2vw, 16px)',
        boxShadow: `0 1px 3px ${colors.shadow}`,
        overflow: 'hidden',
      }}
    >
      {/* Table Header */}
      <div
        style={{
          padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)',
          borderBottom: `1px solid ${colors.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'clamp(10px, 2vw, 12px)',
          background: colors.bgSecondary,
        }}
      >
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 'clamp(0.95rem, 2.2vw, 1.0625rem)', color: colors.text, margin: 0 }}>
            Attendance Register
          </h2>
          <p style={{ fontSize: 'clamp(0.75rem, 1.6vw, 0.8rem)', color: colors.textTertiary, margin: '2px 0 0' }}>
            {persons.length} member{persons.length !== 1 ? 's' : ''} · Click any cell to toggle P / A
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Month
          </label>
          <select
            id="select-month"
            value={selectedMonthNum}
            onChange={e => handleMonthSelect(parseInt(e.target.value))}
            style={{
              padding: 'clamp(6px, 1.2vw, 7px) clamp(10px, 2vw, 12px)',
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: `1px solid ${colors.border}`,
              fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              fontFamily: 'inherit',
              fontWeight: 400,
              color: colors.text,
              background: colors.bg,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {monthNames.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>{name}</option>
            ))}
          </select>
          
          <label style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Year
          </label>
          <select
            id="select-year"
            value={selectedYear}
            onChange={e => handleYearSelect(parseInt(e.target.value))}
            style={{
              padding: 'clamp(6px, 1.2vw, 7px) clamp(10px, 2vw, 12px)',
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              border: `1px solid ${colors.border}`,
              fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
              fontFamily: 'inherit',
              fontWeight: 400,
              color: colors.text,
              background: colors.bg,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile scroll hint */}
      <div className="table-scroll-hint">
        ← Swipe left/right to view all dates →
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'separate', 
          borderSpacing: 0,
          minWidth: `${Math.max(700, 180 + dates.length * 52)}px`, 
          position: 'relative' 
        }}>
          <thead>
            <tr style={{ background: colors.bgSecondary }}>
              <th
                style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: colors.textSecondary,
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  background: colors.bgSecondary,
                  minWidth: '160px',
                  zIndex: 11,
                  borderRight: `2px solid ${colors.border}`,
                  borderBottom: `1px solid ${colors.border}`,
                  boxShadow: `2px 0 5px ${colors.shadow}`,
                }}
              >
                Name
              </th>
              {dates.map(d => (
                <th
                  key={d}
                  style={{
                    padding: '10px 4px',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: colors.textSecondary,
                    whiteSpace: 'nowrap',
                    minWidth: '48px',
                  }}
                >
                  {formatDateHeader(d)}
                </th>
              ))}
              <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: colors.success, whiteSpace: 'nowrap', minWidth: '48px' }}>✓ P</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: colors.error, whiteSpace: 'nowrap', minWidth: '48px' }}>✗ A</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: colors.textTertiary, minWidth: '64px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={dates.length} colors={colors} />)
              : persons.length === 0
              ? (
                <tr>
                  <td colSpan={dates.length + 4} style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '16px', background: colors.bgTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👥</div>
                      <p style={{ fontWeight: 600, color: colors.text, margin: 0, fontSize: '0.9375rem' }}>No members yet</p>
                      <p style={{ color: colors.textTertiary, margin: 0, fontSize: '0.875rem' }}>Add your first person above.</p>
                    </div>
                  </td>
                </tr>
              )
              : persons.map((person, idx) => (
                <tr
                  key={person.id}
                  className="table-row-hover"
                  style={{
                    borderBottom: idx < persons.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                    transition: 'background 120ms ease',
                    background: colors.cardBg,
                  }}
                >
                  {/* Name cell — sticky */}
                  <td
                    style={{
                      padding: '10px 16px',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      color: colors.text,
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      background: colors.cardBg,
                      borderRight: `2px solid ${colors.border}`,
                      zIndex: 10,
                      boxShadow: `2px 0 5px ${colors.shadow}`,
                      borderBottom: idx < persons.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: 30, height: 30,
                          borderRadius: '50%',
                          background: `hsl(${(person.id * 47) % 360}, 65%, ${colors.isDark ? '25%' : '92%'})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700,
                          color: `hsl(${(person.id * 47) % 360}, 55%, ${colors.isDark ? '75%' : '35%'})`,
                          flexShrink: 0,
                        }}
                      >
                        {person.name.slice(0, 1).toUpperCase()}
                      </div>
                      {person.name}
                    </div>
                  </td>

                  {/* Date cells */}
                  {dates.map(d => {
                    const status = getStatus(person.id, d);
                    const isFuture = isFutureDate(d);
                    return (
                      <td key={d} style={{ padding: '10px 6px', textAlign: 'center' }}>
                        <AttPill 
                          status={status} 
                          onClick={() => !isFuture && onToggle(person.id, d, status)} 
                          isFuture={isFuture}
                          colors={colors}
                        />
                      </td>
                    );
                  })}

                  {/* Total P */}
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: colors.success }}>{countP(person.id)}</span>
                  </td>

                  {/* Total A */}
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: colors.error }}>{countA(person.id)}</span>
                  </td>

                  {/* Delete */}
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                      id={`btn-delete-${person.id}`}
                      onClick={() => onDelete(person.id, person.name)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.errorLight}`,
                        background: colors.bg, color: colors.error,
                        fontSize: '0.75rem', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 150ms ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = colors.errorBg; e.currentTarget.style.borderColor = colors.error; }}
                      onMouseLeave={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.borderColor = colors.errorLight; }}
                    >
                      <Trash2 size={12} strokeWidth={2} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
