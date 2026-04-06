import { Users, UserCheck, UserX, BarChart2 } from 'lucide-react';
import { normalizeDate, getTodayString } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ icon: Icon, label, value, color, bg, colors }) => (
  <div
    className="stat-card"
    style={{
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 'clamp(12px, 2vw, 16px)',
      padding: 'clamp(16px, 3vw, 24px)',
      boxShadow: `0 1px 3px ${colors.shadow}`,
      flex: '1 1 calc(50% - 8px)',
      minWidth: 'clamp(140px, 30vw, 200px)',
      transition: 'box-shadow 200ms ease, transform 200ms ease',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = colors.isDark ? '0 4px 16px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.08)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = `0 1px 3px ${colors.shadow}`;
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.textTertiary, marginBottom: 'clamp(8px, 1.5vw, 10px)' }}>
          {label}
        </p>
        <p className="stat-number" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.04em', color: colors.text, lineHeight: 1 }}>
          {value}
        </p>
      </div>
      <div style={{ width: 'clamp(36px, 6vw, 40px)', height: 'clamp(36px, 6vw, 40px)', borderRadius: 'clamp(8px, 1.5vw, 10px)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={window.innerWidth < 640 ? 18 : 20} color={color} strokeWidth={2} />
      </div>
    </div>
  </div>
);

export default function StatsBar({ persons, attendance, dates }) {
  const { colors, isDark } = useTheme();
  const totalMembers = persons.length;

  const todayStr = getTodayString();

  const todayAttendance = attendance.filter(a => normalizeDate(a.date) === todayStr);
  const todayPresent   = todayAttendance.filter(a => a.status === 'P').length;
  const todayAbsent    = todayAttendance.filter(a => a.status === 'A').length;

  const totalP = attendance.filter(a => a.status === 'P').length;
  const totalA = attendance.filter(a => a.status === 'A').length;
  const rate = totalP + totalA > 0 ? Math.round((totalP / (totalP + totalA)) * 100) : 0;

  return (
    <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 16px)', marginBottom: 'clamp(20px, 3vw, 28px)', flexWrap: 'wrap' }}>
      <StatCard icon={Users}     label="Total Members"   value={totalMembers}      color="#6366f1" bg={isDark ? '#1e1b4b' : '#eef2ff'} colors={colors} />
      <StatCard icon={UserCheck} label="Present Today"   value={todayPresent}      color={colors.success} bg={colors.successBg} colors={colors} />
      <StatCard icon={UserX}     label="Absent Today"    value={todayAbsent}        color={colors.error} bg={colors.errorBg} colors={colors} />
      <StatCard icon={BarChart2} label="Attendance Rate" value={`${rate}%`}         color={colors.text} bg={colors.bgTertiary} colors={colors} />
    </div>
  );
}
