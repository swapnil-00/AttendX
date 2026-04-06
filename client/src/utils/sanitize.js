/**
 * Basic XSS prevention utilities
 */

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Check if string contains HTML tags
 * @param {string} str - String to check
 * @returns {boolean} True if contains HTML
 */
export function containsHtml(str) {
  return /<[^>]*>/g.test(str);
}

/**
 * Strip HTML tags from string
 * @param {string} str - String to clean
 * @returns {string} String without HTML tags
 */
export function stripHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent || div.innerText || '';
}

/**
 * Validate and sanitize name input
 * @param {string} name - Name to validate
 * @returns {object} { valid: boolean, error: string, sanitized: string }
 */
export function validateName(name) {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name is required', sanitized: '' };
  }

  const trimmed = name.trim();

  if (trimmed.length > 255) {
    return { valid: false, error: 'Name must be 255 characters or less', sanitized: trimmed };
  }

  if (containsHtml(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters', sanitized: trimmed };
  }

  return { valid: true, error: null, sanitized: trimmed };
}
