import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  effectiveTheme: 'light',
  setTheme: () => {},
});

const STORAGE_KEY = 'vetvault-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  const effective = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.setAttribute('data-theme', effective);
  document.documentElement.style.colorScheme = effective;
}

function getInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // localStorage not available
  }
  return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    const t = getInitialTheme();
    return t === 'system' ? getSystemTheme() : t;
  });

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage not available
    }
    const effective = mode === 'system' ? getSystemTheme() : mode;
    setEffectiveTheme(effective);
    applyTheme(mode);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    const effective = theme === 'system' ? getSystemTheme() : theme;
    if (effective !== effectiveTheme) {
      setEffectiveTheme(effective);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const sys = getSystemTheme();
      setEffectiveTheme(sys);
      document.documentElement.setAttribute('data-theme', sys);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
