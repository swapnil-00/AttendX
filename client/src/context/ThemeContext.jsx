import { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage'; // Fix #13 & #25

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Fix #13 & #25 — use shared useLocalStorage hook instead of raw localStorage calls
  const [storedTheme, setStoredTheme] = useLocalStorage('theme', null);

  const [isDark, setIsDark] = useState(() => {
    if (storedTheme === 'dark') return true;
    if (storedTheme === 'light') return false;
    // Fall back to system preference
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    setStoredTheme(next ? 'dark' : 'light');
  };

  const theme = {
    isDark,
    toggleTheme,
    colors: isDark ? {
      // Dark mode colors
      bg: '#0a0a0a',
      bgSecondary: '#1a1a1a',
      bgTertiary: '#2a2a2a',
      text: '#f5f5f5',
      textSecondary: '#a3a3a3',
      textTertiary: '#737373',
      border: '#2a2a2a',
      borderLight: '#1f1f1f',
      primary: '#3b82f6',
      success: '#22c55e',
      successBg: '#14532d',
      successLight: '#166534',
      error: '#ef4444',
      errorBg: '#450a0a',
      errorLight: '#7f1d1d',
      cardBg: '#141414',
      cardBorder: '#262626',
      hover: '#1f1f1f',
      shadow: 'rgba(0, 0, 0, 0.5)',
      isDark: true,
    } : {
      // Light mode colors
      bg: '#ffffff',
      bgSecondary: '#fafafa',
      bgTertiary: '#f3f4f6',
      text: '#0a0a0a',
      textSecondary: '#6b7280',
      textTertiary: '#9ca3af',
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
      primary: '#3b82f6',
      success: '#16a34a',
      successBg: '#dcfce7',
      successLight: '#bbf7d0',
      error: '#dc2626',
      errorBg: '#fee2e2',
      errorLight: '#fecaca',
      cardBg: '#ffffff',
      cardBorder: '#e5e7eb',
      hover: '#f9fafb',
      shadow: 'rgba(0, 0, 0, 0.05)',
      isDark: false,
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
