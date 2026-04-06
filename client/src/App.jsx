import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import Navbar from './components/Navbar';
import StatsBar from './components/StatsBar';
import AddPersonPanel from './components/AddPersonPanel';
import AttendanceTable from './components/AttendanceTable';
import ToastContainer, { showToast } from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { getPersons, addPerson, deletePerson, getAttendance, upsertAttendance } from './api';
import { getDatesForMonth, getCurrentMonth, normalizeDate } from './utils/dateUtils';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { colors } = useTheme();
  const [persons, setPersons] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  // Fix #4 — Replace window.confirm with ConfirmModal state
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name }
  const [isDownloading, setIsDownloading] = useState(false);
  const addPanelRef = useRef(null);

  const dates = getDatesForMonth(selectedMonth);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (month) => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([getPersons(), getAttendance(month)]);
      // Fix #3 — Coerce person_id and id to integers on the way in
      // Sort persons alphabetically by name
      const sortedPersons = p
        .map(person => ({ ...person, id: parseInt(person.id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setPersons(sortedPersons);
      setAttendance(a.map(rec => ({ ...rec, id: parseInt(rec.id), person_id: parseInt(rec.person_id) })));
    } catch {
      // Error already shown via axios interceptor toast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(selectedMonth); }, [selectedMonth, fetchAll]);

  // ── Month change ─────────────────────────────────────────────────────────────
  const handleMonthChange = (m) => setSelectedMonth(m);

  // ── Add person ───────────────────────────────────────────────────────────────
  const handleAddPerson = async (name) => {
    try {
      const newPerson = await addPerson(name);
      setPersons(prev => {
        const updated = [...prev, { ...newPerson, id: parseInt(newPerson.id) }];
        // Sort alphabetically by name
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });
      showToast('Member added ✓');
      setShowAddPanel(false);
    } catch {
      // Error toast already handled by interceptor (incl. 409 duplicate)
    }
  };

  // ── Delete person (Fix #4 — uses ConfirmModal) ───────────────────────────────
  const handleDeleteRequest = (id, name) => setConfirmTarget({ id, name });

  const handleDeleteConfirm = async () => {
    const { id, name } = confirmTarget;
    setConfirmTarget(null);
    try {
      await deletePerson(id);
      setPersons(prev => prev.filter(p => p.id !== id));
      setAttendance(prev => prev.filter(a => a.person_id !== id));
      showToast('Member removed ✓');
    } catch {
      // Error toast via interceptor
    }
  };

  // ── Toggle attendance ────────────────────────────────────────────────────────
  const handleToggle = async (personId, dateStr, currentStatus) => {
    const newStatus = currentStatus === 'P' ? 'A' : 'P';

    // Optimistic UI update — Fix #3: compare as integers
    setAttendance(prev => {
      const existing = prev.find(
        a => a.person_id === personId && normalizeDate(a.date) === dateStr
      );
      if (existing) {
        return prev.map(a =>
          a.person_id === personId && normalizeDate(a.date) === dateStr
            ? { ...a, status: newStatus }
            : a
        );
      } else {
        return [...prev, { person_id: personId, date: dateStr, status: newStatus, id: Date.now() }];
      }
    });

    try {
      await upsertAttendance(personId, dateStr, newStatus);
      showToast('Saved ✓');
    } catch {
      // Revert on failure
      setAttendance(prev =>
        prev.map(a =>
          a.person_id === personId && normalizeDate(a.date) === dateStr
            ? { ...a, status: currentStatus }
            : a
        )
      );
      // Error toast via interceptor
    }
  };

  // ── Download Excel ───────────────────────────────────────────────────────────
  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        const lookup = {};
        attendance.forEach(a => {
          lookup[`${a.person_id}_${normalizeDate(a.date)}`] = a.status;
        });

        const formatHeader = (dateStr) => {
          const [, , day] = dateStr.split('-');
          const month = dateStr.slice(5, 7);
          return `${day}/${month}`;
        };

        const headers = ['Name', ...dates.map(formatHeader), 'Total P', 'Total A'];
        const rows = persons.map(person => {
          const statusArr = dates.map(d => lookup[`${person.id}_${d}`] || '');
          const totalP = statusArr.filter(s => s === 'P').length;
          const totalA = statusArr.filter(s => s === 'A').length;
          return [person.name, ...statusArr, totalP, totalA];
        });

        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws['!cols'] = [
          { wch: 22 },
          ...dates.map(() => ({ wch: 8 })),
          { wch: 10 },
          { wch: 10 },
        ];

        const headerStyle = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '111827' } },
          alignment: { horizontal: 'center' },
        };
        headers.forEach((_, ci) => {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: ci });
          if (ws[cellRef]) ws[cellRef].s = headerStyle;
        });

        rows.forEach((row, ri) => {
          row.forEach((val, ci) => {
            const cellRef = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
            if (!ws[cellRef]) return;
            if (val === 'P') {
              ws[cellRef].s = { fill: { fgColor: { rgb: 'C6EFCE' } }, font: { color: { rgb: '276221' }, bold: true }, alignment: { horizontal: 'center' } };
            } else if (val === 'A') {
              ws[cellRef].s = { fill: { fgColor: { rgb: 'FFC7CE' } }, font: { color: { rgb: '9C0006' }, bold: true }, alignment: { horizontal: 'center' } };
            } else if (ci > 0) {
              ws[cellRef].s = { alignment: { horizontal: 'center' } };
            }
          });
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

        const [year, month] = selectedMonth.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
          .toLocaleString('default', { month: 'long' });
        XLSX.writeFile(wb, `Attendance_Report_${monthName}${year}.xlsx`);
        showToast('Excel downloaded ✓');
      } catch (error) {
        console.error('Excel generation error:', error);
        showToast('Failed to generate Excel file', 'error');
      } finally {
        setIsDownloading(false);
      }
    }, 100);
  };

  // ── Navbar "Add Person" click ─────────────────────────────────────────────────
  const handleNavAddPerson = () => {
    setShowAddPanel(true);
    setTimeout(() => addPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, transition: 'background 0.3s ease' }}>
      <Navbar onAddPerson={handleNavAddPerson} onDownload={handleDownloadExcel} isDownloading={isDownloading} />

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)' }}>
        {/* Page title */}
        <div style={{ marginBottom: 'clamp(20px, 4vw, 28px)' }} className="fade-in">
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', letterSpacing: '-0.04em', color: colors.text, margin: '0 0 6px', transition: 'color 0.3s ease' }}>
            Attendance Management
          </h1>
          <p style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: colors.textSecondary, margin: 0, transition: 'color 0.3s ease' }}>
            Track, manage and export your team's attendance — all in one place.
          </p>
        </div>

        {/* Stats */}
        <StatsBar persons={persons} attendance={attendance} dates={dates} />

        {/* Add person panel */}
        <div ref={addPanelRef}>
          {showAddPanel && (
            <div className="fade-in">
              <AddPersonPanel onAdd={handleAddPerson} />
            </div>
          )}
        </div>

        {/* Attendance table */}
        <div className="fade-in">
          <AttendanceTable
            persons={persons}
            attendance={attendance}
            dates={dates}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            onToggle={handleToggle}
            onDelete={handleDeleteRequest}
            loading={loading}
          />
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: 'clamp(40px, 8vw, 60px)', 
          padding: 'clamp(20px, 3vw, 24px) 0',
          borderTop: `1px solid ${colors.border}`,
          textAlign: 'center',
          transition: 'border-color 0.3s ease'
        }}>
          <p style={{ 
            fontSize: 'clamp(0.75rem, 1.6vw, 0.875rem)', 
            color: colors.textTertiary,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            lineHeight: 1.6,
            transition: 'color 0.3s ease'
          }}>
            <span style={{ fontWeight: 600, color: colors.text }}>AttendX</span>
            <span style={{ color: colors.textTertiary }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Built with
              <span style={{ 
                color: '#ef4444', 
                fontSize: '1.1em',
                animation: 'heartbeat 1.5s ease-in-out infinite'
              }}>♥</span>
              by
            </span>
            <span style={{ 
              fontWeight: 600, 
              color: colors.text,
              background: colors.isDark 
                ? 'linear-gradient(135deg, #f5f5f5 0%, #a3a3a3 100%)'
                : 'linear-gradient(135deg, #111827 0%, #4b5563 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Swapnil Chaudhari
            </span>
          </p>
        </div>
      </main>

      {/* Fix #4 — Confirm modal (replaces window.confirm) */}
      {confirmTarget && (
        <ConfirmModal
          name={confirmTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      <ToastContainer />
    </div>
  );
}
