// Centralized date utility functions

/**
 * Normalize date to YYYY-MM-DD format regardless of input type
 * @param {string|Date} d - Date to normalize
 * @returns {string} Date in YYYY-MM-DD format
 */
export function normalizeDate(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month
 */
export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get all dates for a given month
 * @param {string} monthStr - Month in YYYY-MM format
 * @returns {string[]} Array of dates in YYYY-MM-DD format
 */
export function getDatesForMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
