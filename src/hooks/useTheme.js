// src/hooks/useTheme.js
import { useState, useEffect, useContext, createContext } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY  = 'aurum_theme';

function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // Fall back to OS preference on first visit
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Keep in sync if the user changes OS theme AND hasn't manually chosen one
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return; // user already has a preference saved
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
  const setLight     = () => setTheme('light');
  const setDark       = () => setTheme('dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setLight, setDark, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};
