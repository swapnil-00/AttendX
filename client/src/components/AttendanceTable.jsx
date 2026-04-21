import { useRef, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
// Fix #9 & #10 — removed local duplicates; import from shared dateUtils
import { normalizeDate, getTodayString } from '../utils/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isSundayDate = (d) => new Date(d + 'T12:00:00').getDay() === 0;
const isPastDate   = (d, t) => d < t;
const isFutureDate = (d, t) => d > t;

const LONG_PRESS_MS = 3000;
const AUTO_LOCK_MS  = 8000;

// ─── AttPill ─────────────────────────────────────────────────────────────────
function AttPill({ status, dateStr, todayStr, isUnlocked, isBeingPressed,
  pressProgress, onClick, onPointerDown, onPointerUp, onPointerLeave, colors, isDark }) {
  const sunday = isSundayDate(dateStr);
  const past   = isPastDate(dateStr, todayStr);
  const future = isFutureDate(dateStr, todayStr);
  const isP    = status === 'P';
  const noRec  = !status;

  if (sunday) return (
    <div style={{ width:38, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', userSelect:'none' }}>
      ☀️
    </div>
  );

  if (future) return (
    <div style={{ width:38, height:28, display:'flex', alignItems:'center', justifyContent:'center',
      color: isDark ? '#404040' : '#e5e7eb', fontSize:'0.8rem', fontWeight:600, userSelect:'none' }}>
      —
    </div>
  );

  // Past locked
  if (past && !isUnlocked) {
    const baseColor = noRec
      ? (isDark ? '#1f1f1f' : '#f9fafb')
      : isP ? (isDark ? '#14532d' : '#f0fdf4')
             : (isDark ? '#450a0a' : '#fff5f5');
    const textColor = noRec
      ? (isDark ? '#404040' : '#d1d5db')
      : isP ? (isDark ? '#4ade80' : '#86efac')
             : (isDark ? '#f87171' : '#fca5a5');
    return (
      <div
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerLeave}
        onContextMenu={e => e.preventDefault()}
        title="Hold 3 s to edit"
        style={{
          position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:38, height:28, borderRadius:6, background:baseColor, color:textColor,
          fontWeight:700, fontSize:'0.75rem',
          border: isBeingPressed ? `2px solid ${isDark ? '#6366f1' : '#6366f1'}` : `1px solid ${isDark ? '#2a2a2a' : '#f3f4f6'}`,
          cursor:'pointer', userSelect:'none', touchAction:'none', overflow:'hidden',
          transition:'border-color 150ms ease',
        }}
      >
        {isBeingPressed && (
          <div style={{
            background:`conic-gradient(rgba(99,102,241,0.45) ${pressProgress*3.6}deg, transparent 0deg)`,
            position:'absolute', inset:0, borderRadius:6,
          }} />
        )}
        <span style={{ position:'relative', zIndex:1 }}>{noRec ? '—' : status}</span>
      </div>
    );
  }

  // Today / unlocked past
  const bgColor = noRec
    ? colors.bgTertiary
    : isP ? colors.successBg
           : colors.errorBg;
  const txColor = noRec ? colors.textTertiary : isP ? colors.success : colors.error;
  return (
    <button
      className="att-pill"
      onClick={onClick}
      title={isUnlocked ? 'Unlocked — click to change, auto-locks in 8 s' : undefined}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        width:38, height:28, borderRadius:6, fontWeight:700, fontSize:'0.75rem',
        background:bgColor, color:txColor,
        border: isUnlocked ? '2px solid #f59e0b' : 'none',
        boxShadow: isUnlocked ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none',
        animation: isUnlocked ? 'pulseAmber 1.5s ease-in-out infinite' : 'none',
      }}
    >{noRec ? '—' : status}</button>
  );
}

function SkeletonRow({ cols }) {
  return (
    <tr>
      <td style={{ padding:'12px 16px' }}><div className="skeleton" style={{ height:14, width:100 }} /></td>
      {Array.from({ length:cols }).map((_,i) => (
        <td key={i} style={{ padding:'12px 8px', textAlign:'center' }}>
          <div className="skeleton" style={{ height:28, width:38, margin:'0 auto', borderRadius:6 }} />
        </td>
      ))}
      <td style={{ padding:'12px 8px', textAlign:'center' }}><div className="skeleton" style={{ height:14, width:28, margin:'0 auto' }} /></td>
      <td style={{ padding:'12px 8px', textAlign:'center' }}><div className="skeleton" style={{ height:14, width:28, margin:'0 auto' }} /></td>
      <td style={{ padding:'12px 8px', textAlign:'center' }}><div className="skeleton" style={{ height:28, width:56, margin:'0 auto', borderRadius:6 }} /></td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AttendanceTable({ persons, attendance, dates, selectedMonth, onMonthChange, onToggle, onDelete, loading }) {
  const { colors, isDark } = useTheme();
  // Fix #10 — use shared getTodayString instead of local duplicate getTodayStr
  const todayStr = getTodayString();

  const [unlockedCell, setUnlockedCell]   = useState(null);
  const [pressingCell, setPressingCell]   = useState(null);
  const [pressProgress, setPressProgress] = useState(0);
  const pressTimerRef    = useRef(null);
  const progressTimerRef = useRef(null);
  const autoLockTimerRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(pressTimerRef.current);
    clearInterval(progressTimerRef.current);
    clearTimeout(autoLockTimerRef.current);
  }, []);

  const clearPress = () => {
    clearTimeout(pressTimerRef.current);
    clearInterval(progressTimerRef.current);
    setPressingCell(null); setPressProgress(0);
  };

  const handlePointerDown = (personId, dateStr) => {
    if (!isPastDate(dateStr, todayStr) || isSundayDate(dateStr)) return;
    const key = `${personId}_${dateStr}`;
    if (unlockedCell === key) return;
    setPressingCell(key); setPressProgress(0);
    const t0 = Date.now();
    progressTimerRef.current = setInterval(() => {
      setPressProgress(Math.min(((Date.now()-t0)/LONG_PRESS_MS)*100, 100));
    }, 30);
    pressTimerRef.current = setTimeout(() => {
      clearInterval(progressTimerRef.current);
      setPressingCell(null); setPressProgress(0); setUnlockedCell(key);
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = setTimeout(() => {
        setUnlockedCell(prev => prev === key ? null : prev);
      }, AUTO_LOCK_MS);
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => clearPress();

  const handlePillClick = (personId, dateStr, status) => {
    if (isSundayDate(dateStr) || isFutureDate(dateStr, todayStr)) return;
    const key = `${personId}_${dateStr}`;
    if (isPastDate(dateStr, todayStr) && unlockedCell !== key) return;
    if (unlockedCell === key) { setUnlockedCell(null); clearTimeout(autoLockTimerRef.current); }
    onToggle(personId, dateStr, status);
  };

  const lookup = {};
  attendance.forEach(a => {
    // Fix #9 — uses imported normalizeDate instead of local duplicate
    lookup[`${parseInt(a.person_id)}_${normalizeDate(a.date)}`] = a.status;
  });
  const getStatus = (pid, d) => lookup[`${parseInt(pid)}_${d}`] || null;
  const countP    = (pid)    => dates.filter(d => getStatus(pid,d) === 'P').length;
  const countA    = (pid)    => dates.filter(d => getStatus(pid,d) === 'A').length;

  // Fix #26 — Extended from 12 to 24 months lookback
  const monthOptions = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push({
      val: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      label: d.toLocaleString('default', { month:'long', year:'numeric' }),
    });
  }

  const formatDateHeader = (dateStr) => {
    const [,,day] = dateStr.split('-');
    return {
      dayNum:  parseInt(day),
      dayName: ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(dateStr+'T12:00:00').getDay()],
    };
  };

  return (
    <>
      <style>{`@keyframes pulseAmber {
        0%,100%{box-shadow:0 0 0 3px rgba(245,158,11,0.2);}
        50%{box-shadow:0 0 0 6px rgba(245,158,11,0.08);}
      }`}</style>

      <div style={{ background:colors.cardBg, border:`1px solid ${colors.cardBorder}`, borderRadius:16, boxShadow:`0 1px 3px ${colors.shadow}`, overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${colors.borderLight}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, background:colors.bgSecondary }}>
          <div>
            <h2 style={{ fontWeight:700, fontSize:'1.0625rem', color:colors.text, margin:0 }}>Attendance Register</h2>
            <p style={{ fontSize:'0.8rem', color:colors.textTertiary, margin:'2px 0 0' }}>
              {persons.length} member{persons.length!==1?'s':''}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:600, color:colors.textSecondary, textTransform:'uppercase', letterSpacing:'0.06em' }}>Month</label>
            <select
              id="select-month"
              value={selectedMonth}
              onChange={e => onMonthChange(e.target.value)}
              style={{ padding:'7px 12px', borderRadius:8, border:`1px solid ${colors.border}`, fontSize:'0.875rem', color:colors.text, background:colors.cardBg, cursor:'pointer', outline:'none' }}
            >
              {monthOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Scrollable table */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:`${Math.max(700, 180+dates.length*52)}px` }}>
            <thead>
              <tr style={{ background:colors.bgSecondary, borderBottom:`1px solid ${colors.border}` }}>
                <th style={{ padding:'10px 16px', textAlign:'left', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:colors.textSecondary, whiteSpace:'nowrap', position:'sticky', left:0, background:colors.bgSecondary, minWidth:160, zIndex:5, borderRight:`1px solid ${colors.border}` }}>
                  Name
                </th>
                {dates.map(d => {
                  const sunday  = isSundayDate(d);
                  const isToday = d === todayStr;
                  const { dayNum, dayName } = formatDateHeader(d);
                  return (
                    <th key={d} style={{ padding:'6px 4px', textAlign:'center', fontSize:'0.65rem', fontWeight:700, whiteSpace:'nowrap', minWidth:48,
                      color:  sunday ? '#d97706' : isToday ? '#818cf8' : colors.textSecondary,
                      background: sunday ? (isDark?'#1c1200':'#fffbeb') : isToday ? (isDark?'#1e1b4b':'#f5f3ff') : colors.bgSecondary,
                    }}>
                      <div>{dayName}</div>
                      <div style={{ fontSize:'0.75rem', marginTop:1 }}>{dayNum}</div>
                    </th>
                  );
                })}
                <th style={{ padding:'10px 8px', textAlign:'center', fontSize:'0.7rem', fontWeight:700, color:colors.success, whiteSpace:'nowrap', minWidth:48, background:colors.bgSecondary }}>✓ P</th>
                <th style={{ padding:'10px 8px', textAlign:'center', fontSize:'0.7rem', fontWeight:700, color:colors.error,   whiteSpace:'nowrap', minWidth:48, background:colors.bgSecondary }}>✗ A</th>
                <th style={{ padding:'10px 12px', textAlign:'center', fontSize:'0.7rem', fontWeight:600, color:colors.textTertiary, minWidth:64, background:colors.bgSecondary }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:8}).map((_,i) => <SkeletonRow key={i} cols={dates.length} />)
                : persons.length === 0
                ? (
                  <tr>
                    <td colSpan={dates.length+4} style={{ padding:'60px 24px', textAlign:'center' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                        <div style={{ width:56, height:56, borderRadius:16, background:colors.bgTertiary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>👥</div>
                        <p style={{ fontWeight:600, color:colors.text, margin:0 }}>No members yet</p>
                        <p style={{ color:colors.textTertiary, margin:0, fontSize:'0.875rem' }}>Add your first person above.</p>
                      </div>
                    </td>
                  </tr>
                )
                : persons.map((person, idx) => (
                  <tr key={person.id} className="table-row-hover" style={{ borderBottom: idx < persons.length-1 ? `1px solid ${colors.borderLight}` : 'none', transition:'background 120ms ease' }}>

                    {/* Sticky name */}
                    <td className="sticky-name-cell" style={{ padding:'10px 16px', fontWeight:500, fontSize:'0.875rem', color:colors.text, whiteSpace:'nowrap', position:'sticky', left:0, borderRight:`1px solid ${colors.borderLight}`, zIndex:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0,
                          background:`hsl(${(person.id*47)%360}, ${isDark?'40%':'65%'}, ${isDark?'25%':'92%'})`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'0.7rem', fontWeight:700,
                          color:`hsl(${(person.id*47)%360}, ${isDark?'60%':'55%'}, ${isDark?'75%':'35%'})`,
                        }}>
                          {person.name.slice(0,1).toUpperCase()}
                        </div>
                        {person.name}
                      </div>
                    </td>

                    {/* Date cells */}
                    {dates.map(d => {
                      const key    = `${person.id}_${d}`;
                      const status = getStatus(person.id, d);
                      const sunday  = isSundayDate(d);
                      const isToday = d === todayStr;
                      return (
                        <td key={d} style={{ padding:'10px 5px', textAlign:'center',
                          background: sunday ? (isDark?'#1c1200':'#fffbeb') : isToday ? (isDark?'#1e1b4b':'#f5f3ff') : undefined,
                        }}>
                          <AttPill
                            status={status} dateStr={d} todayStr={todayStr}
                            isUnlocked={unlockedCell===key} isBeingPressed={pressingCell===key}
                            pressProgress={pressingCell===key ? pressProgress : 0}
                            onClick={() => handlePillClick(person.id, d, status)}
                            onPointerDown={() => handlePointerDown(person.id, d)}
                            onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
                            colors={colors} isDark={isDark}
                          />
                        </td>
                      );
                    })}

                    {/* Totals */}
                    <td style={{ padding:'10px 8px', textAlign:'center' }}>
                      <span style={{ fontWeight:700, fontSize:'0.875rem', color:colors.success }}>{countP(person.id)}</span>
                    </td>
                    <td style={{ padding:'10px 8px', textAlign:'center' }}>
                      <span style={{ fontWeight:700, fontSize:'0.875rem', color:colors.error }}>{countA(person.id)}</span>
                    </td>

                    {/* Delete */}
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      <button
                        id={`btn-delete-${person.id}`}
                        onClick={() => onDelete(person.id, person.name)}
                        style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6,
                          border:`1px solid ${colors.errorLight}`, background:colors.cardBg, color:colors.error,
                          fontSize:'0.75rem', fontWeight:500, cursor:'pointer', transition:'all 150ms ease', whiteSpace:'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = colors.errorBg; e.currentTarget.style.borderColor = colors.error; }}
                        onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg;  e.currentTarget.style.borderColor = colors.errorLight; }}
                      >
                        <Trash2 size={12} strokeWidth={2} />Delete
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
