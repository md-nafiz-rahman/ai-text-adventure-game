import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppMenu from '@/components/AppMenu';
import { GameMapProvider } from '@/contexts/GameMapContext';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const { themeMode } = useSettings();

  return (
    <ThemeProvider value={themeMode === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
      <AppMenu />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <SettingsProvider>
      <GameMapProvider>
        <ThemedApp />
      </GameMapProvider>
    </SettingsProvider>
  );
}