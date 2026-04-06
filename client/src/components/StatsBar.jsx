import { Users, UserCheck, UserX, BarChart2 } from 'lucide-react';
import { normalizeDate, getTodayString } from '../utils/dateUtils';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div
    className="stat-card"
    style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: 'clamp(12px, 2vw, 16px)',
      padding: 'clamp(16px, 3vw, 24px)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      flex: '1 1 calc(50% - 8px)',
      minWidth: 'clamp(140px, 30vw, 200px)',
      transition: 'box-shadow 200ms ease, transform 200ms ease',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 'clamp(8px, 1.5vw, 10px)' }}>
          {label}
        </p>
        <p className="stat-number" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#111827', lineHeight: 1 }}>
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
      <StatCard icon={Users}     label="Total Members"   value={totalMembers}      color="#6366f1" bg="#eef2ff" />
      <StatCard icon={UserCheck} label="Present Today"   value={todayPresent}      color="#16a34a" bg="#dcfce7" />
      <StatCard icon={UserX}     label="Absent Today"    value={todayAbsent}        color="#dc2626" bg="#fee2e2" />
      <StatCard icon={BarChart2} label="Attendance Rate" value={`${rate}%`}         color="#0a0a0a" bg="#f3f4f6" />
    </div>
  );
}
