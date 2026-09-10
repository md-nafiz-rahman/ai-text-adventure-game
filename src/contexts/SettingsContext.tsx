import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

export type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentText: string;
  danger: string;
  info: string;
  item: string;
  puzzle: string;
  ai: string;
};

const darkColors: ThemeColors = {
  background: '#0d0d0d',
  surface: '#111111',
  card: '#1a1a1a',
  cardBorder: '#333333',
  text: '#ffffff',
  textSecondary: '#999999',
  textMuted: '#666666',
  accent: '#4ade80',
  accentText: '#000000',
  danger: '#f87171',
  info: '#3b82f6',
  item: '#fbbf24',
  puzzle: '#a78bfa',
  ai: '#22d3ee',
};

const lightColors: ThemeColors = {
  background: '#f5f5f4',
  surface: '#ffffff',
  card: '#ffffff',
  cardBorder: '#dddddd',
  text: '#111111',
  textSecondary: '#555555',
  textMuted: '#8a8a8a',
  accent: '#16a34a',
  accentText: '#ffffff',
  danger: '#dc2626',
  info: '#2563eb',
  item: '#b45309',
  puzzle: '#7c3aed',
  ai: '#0891b2',
};

const THEME_STORAGE_KEY = 'settings:theme';
const QUICK_ACTIONS_STORAGE_KEY = 'settings:quickActionsEnabled';

type SettingsContextValue = {
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  quickActionsEnabled: boolean;
  setQuickActionsEnabled: (enabled: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [quickActionsEnabled, setQuickActionsEnabledState] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedTheme, storedQuickActions] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(QUICK_ACTIONS_STORAGE_KEY),
        ]);

        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeModeState(storedTheme);
        }
        if (storedQuickActions !== null) {
          setQuickActionsEnabledState(storedQuickActions === 'true');
        }
      } catch (err) {
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  };

  const setQuickActionsEnabled = (enabled: boolean) => {
    setQuickActionsEnabledState(enabled);
    AsyncStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, String(enabled)).catch(() => {});
  };

  if (!loaded) {
    return null;
  }

  const colors = themeMode === 'dark' ? darkColors : lightColors;

  return (
    <SettingsContext.Provider
      value={{ themeMode, colors, setThemeMode, quickActionsEnabled, setQuickActionsEnabled }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}