import { useRef, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeDate(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const isSundayDate  = (d) => new Date(d + 'T12:00:00').getDay() === 0;
const isPastDate    = (d, today) => d < today;
const isFutureDate  = (d, today) => d > today;

const LONG_PRESS_MS = 3000;
const AUTO_LOCK_MS  = 8000; // re-lock after 8s of inactivity

// ─── AttPill ─────────────────────────────────────────────────────────────────
function AttPill({
  status, dateStr, todayStr,
  isUnlocked, isBeingPressed, pressProgress,
  onClick, onPointerDown, onPointerUp, onPointerLeave,
}) {
  const sunday  = isSundayDate(dateStr);
  const past    = isPastDate(dateStr, todayStr);
  const future  = isFutureDate(dateStr, todayStr);
  const isP     = status === 'P';
  const noRec   = !status;

  // ── Sunday holiday ──
  if (sunday) {
    return (
      <div style={{
        width: 38, height: 28, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', userSelect: 'none',
      }}>
        ☀️
      </div>
    );
  }

  // ── Future date — dimmed, not interactive ──
  if (future) {
    return (
      <div style={{
        width: 38, height: 28, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#e5e7eb', fontSize: '0.8rem', fontWeight: 600,
        userSelect: 'none',
      }}>
        —
      </div>
    );
  }

  // ── Past date — locked unless long-pressed ──
  if (past && !isUnlocked) {
    const baseColor   = noRec ? '#f9fafb' : isP ? '#f0fdf4' : '#fff5f5';
    const textColor   = noRec ? '#d1d5db' : isP ? '#86efac' : '#fca5a5';
    const borderColor = isBeingPressed ? '#6366f1' : '#f3f4f6';

    // conic-gradient progress ring
    const progressStyle = isBeingPressed ? {
      background: `conic-gradient(rgba(99,102,241,0.35) ${pressProgress * 3.6}deg, transparent 0deg)`,
      position: 'absolute', inset: 0, borderRadius: 6,
    } : null;

    return (
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onContextMenu={e => e.preventDefault()}
        title="Hold 3 s to edit"
        style={{
          position: 'relative', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          width: 38, height: 28, borderRadius: 6,
          background: baseColor, color: textColor,
          fontWeight: 700, fontSize: '0.75rem',
          border: `2px solid ${borderColor}`,
          cursor: 'pointer', userSelect: 'none',
          touchAction: 'none', overflow: 'hidden',
          transition: 'border-color 150ms ease',
        }}
      >
        {isBeingPressed && <div style={progressStyle} />}
        <span style={{ position: 'relative', zIndex: 1 }}>
          {noRec ? '—' : status}
        </span>
      </div>
    );
  }

  // ── Today / unlocked past — fully interactive ──
  return (
    <button
      className="att-pill"
      onClick={onClick}
      title={isUnlocked ? 'Unlocked — click to change, auto-locks in 8 s' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 38, height: 28, borderRadius: 6, fontWeight: 700,
        fontSize: '0.75rem', letterSpacing: '0.02em',
        background: noRec ? '#f3f4f6' : isP ? '#dcfce7' : '#fee2e2',
        color: noRec ? '#9ca3af' : isP ? '#16a34a' : '#dc2626',
        border: isUnlocked ? '2px solid #f59e0b' : 'none',
        boxShadow: isUnlocked ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none',
        animation: isUnlocked ? 'pulseAmber 1.5s ease-in-out infinite' : 'none',
      }}
    >
      {noRec ? '—' : status}
    </button>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ cols }) {
  return (
    <tr>
      <td style={{ padding: '12px 16px' }}>
        <div className="skeleton" style={{ height: 14, width: 100 }} />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 28, width: 38, margin: '0 auto', borderRadius: 6 }} />
        </td>
      ))}
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 14, width: 28, margin: '0 auto' }} />
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 14, width: 28, margin: '0 auto' }} />
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 28, width: 56, margin: '0 auto', borderRadius: 6 }} />
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AttendanceTable({
  persons, attendance, dates,
  selectedMonth, onMonthChange,
  onToggle, onDelete, loading,
}) {
  const todayStr = getTodayStr();

  // Unlock/press state
  const [unlockedCell, setUnlockedCell]   = useState(null); // "pid_date"
  const [pressingCell, setPressingCell]   = useState(null);
  const [pressProgress, setPressProgress] = useState(0);

  const pressTimerRef    = useRef(null);
  const progressTimerRef = useRef(null);
  const autoLockTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimeout(pressTimerRef.current);
    clearInterval(progressTimerRef.current);
    clearTimeout(autoLockTimerRef.current);
  }, []);

  const clearPress = () => {
    clearTimeout(pressTimerRef.current);
    clearInterval(progressTimerRef.current);
    pressTimerRef.current = null;
    progressTimerRef.current = null;
    setPressingCell(null);
    setPressProgress(0);
  };

  const handlePointerDown = (personId, dateStr) => {
    if (!isPastDate(dateStr, todayStr) || isSundayDate(dateStr)) return;
    const key = `${personId}_${dateStr}`;
    if (unlockedCell === key) return; // already unlocked

    setPressingCell(key);
    setPressProgress(0);
    const startTime = Date.now();

    progressTimerRef.current = setInterval(() => {
      setPressProgress(Math.min(((Date.now() - startTime) / LONG_PRESS_MS) * 100, 100));
    }, 30);

    pressTimerRef.current = setTimeout(() => {
      clearInterval(progressTimerRef.current);
      setPressingCell(null);
      setPressProgress(0);
      setUnlockedCell(key);

      // Auto re-lock after 8s
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = setTimeout(() => {
        setUnlockedCell(prev => (prev === key ? null : prev));
      }, AUTO_LOCK_MS);
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => clearPress();

  const handlePillClick = (personId, dateStr, status) => {
    if (isSundayDate(dateStr) || isFutureDate(dateStr, todayStr)) return;
    const key = `${personId}_${dateStr}`;
    if (isPastDate(dateStr, todayStr) && unlockedCell !== key) return;

    // Re-lock after editing a past cell
    if (unlockedCell === key) {
      setUnlockedCell(null);
      clearTimeout(autoLockTimerRef.current);
    }
    onToggle(personId, dateStr, status);
  };

  // Build lookup — always parseInt to avoid string/int mismatch
  const lookup = {};
  attendance.forEach(a => {
    lookup[`${parseInt(a.person_id)}_${normalizeDate(a.date)}`] = a.status;
  });
  const getStatus = (pid, d) => lookup[`${parseInt(pid)}_${d}`] || null;
  const countP    = (pid) => dates.filter(d => getStatus(pid, d) === 'P').length;
  const countA    = (pid) => dates.filter(d => getStatus(pid, d) === 'A').length;

  // Month options
  const monthOptions = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthOptions.push({ val, label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) });
  }

  const formatDateHeader = (dateStr) => {
    const [, , day] = dateStr.split('-');
    const dayNum = parseInt(day);
    const dayName = ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(dateStr + 'T12:00:00').getDay()];
    return { dayNum, dayName };
  };

  return (
    <>
      {/* Amber pulse animation for unlocked cells */}
      <style>{`
        @keyframes pulseAmber {
          0%, 100% { box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(245,158,11,0.08); }
        }
      `}</style>

      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
          background: '#fafafa',
        }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#111827', margin: 0 }}>
              Attendance Register
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '2px 0 0' }}>
              {persons.length} member{persons.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Month
            </label>
            <select
              id="select-month"
              value={selectedMonth}
              onChange={e => onMonthChange(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '0.875rem',
                color: '#111827', background: '#ffffff',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {monthOptions.map(o => (
                <option key={o.val} value={o.val}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>



        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            minWidth: `${Math.max(700, 180 + dates.length * 52)}px`,
          }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {/* Name header */}
                <th style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280',
                  whiteSpace: 'nowrap', position: 'sticky', left: 0,
                  background: '#f9fafb', minWidth: '160px', zIndex: 5,
                  borderRight: '1px solid #e5e7eb',
                }}>
                  Name
                </th>

                {/* Date headers */}
                {dates.map(d => {
                  const sunday = isSundayDate(d);
                  const isToday = d === todayStr;
                  const { dayNum, dayName } = formatDateHeader(d);
                  return (
                    <th key={d} style={{
                      padding: '6px 4px', textAlign: 'center',
                      fontSize: '0.65rem', fontWeight: 700,
                      color: sunday ? '#d97706' : isToday ? '#6366f1' : '#6b7280',
                      whiteSpace: 'nowrap', minWidth: '48px',
                      background: sunday ? '#fffbeb' : isToday ? '#f5f3ff' : '#f9fafb',
                      letterSpacing: '0.02em',
                    }}>
                      <div>{dayName}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '1px' }}>{dayNum}</div>
                    </th>
                  );
                })}

                <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap', minWidth: '48px' }}>✓ P</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap', minWidth: '48px' }}>✗ A</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', minWidth: '64px' }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={dates.length} />)
                : persons.length === 0
                ? (
                  <tr>
                    <td colSpan={dates.length + 4} style={{ padding: '60px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '16px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👥</div>
                        <p style={{ fontWeight: 600, color: '#374151', margin: 0 }}>No members yet</p>
                        <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.875rem' }}>Add your first person above.</p>
                      </div>
                    </td>
                  </tr>
                )
                : persons.map((person, idx) => (
                  <tr
                    key={person.id}
                    className="table-row-hover"
                    style={{
                      borderBottom: idx < persons.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background 120ms ease',
                    }}
                  >
                    {/* Sticky name cell */}
                    <td style={{
                      padding: '10px 16px', fontWeight: 500, fontSize: '0.875rem',
                      color: '#111827', whiteSpace: 'nowrap',
                      position: 'sticky', left: 0, background: '#ffffff',
                      borderRight: '1px solid #f3f4f6', zIndex: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${(person.id * 47) % 360}, 65%, 92%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700,
                          color: `hsl(${(person.id * 47) % 360}, 55%, 35%)`,
                        }}>
                          {person.name.slice(0, 1).toUpperCase()}
                        </div>
                        {person.name}
                      </div>
                    </td>

                    {/* Date cells */}
                    {dates.map(d => {
                      const key     = `${person.id}_${d}`;
                      const status  = getStatus(person.id, d);
                      const sunday  = isSundayDate(d);
                      const isToday = d === todayStr;
                      return (
                        <td key={d} style={{
                          padding: '10px 5px', textAlign: 'center',
                          background: sunday ? '#fffbeb' : isToday ? '#f5f3ff' : undefined,
                        }}>
                          <AttPill
                            status={status}
                            dateStr={d}
                            todayStr={todayStr}
                            isUnlocked={unlockedCell === key}
                            isBeingPressed={pressingCell === key}
                            pressProgress={pressingCell === key ? pressProgress : 0}
                            onClick={() => handlePillClick(person.id, d, status)}
                            onPointerDown={() => handlePointerDown(person.id, d)}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                          />
                        </td>
                      );
                    })}

                    {/* Totals */}
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#16a34a' }}>{countP(person.id)}</span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#dc2626' }}>{countA(person.id)}</span>
                    </td>

                    {/* Delete */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        id={`btn-delete-${person.id}`}
                        onClick={() => onDelete(person.id, person.name)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '5px 10px', borderRadius: '6px',
                          border: '1px solid #fecaca', background: '#ffffff',
                          color: '#dc2626', fontSize: '0.75rem', fontWeight: 500,
                          cursor: 'pointer', transition: 'all 150ms ease', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#fecaca'; }}
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
    </>
  );
}
