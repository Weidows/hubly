import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthContext, useAuthState } from '@/auth/auth-context';
import { getItem } from '@/auth/storage';
import { hydrateLocale, localeStorageKey } from '@/i18n';
import { queryClient } from '@/lib/query';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { dark, palette } = useTheme();
  const auth = useAuthState();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        hydrateLocale(await getItem(localeStorageKey));
      } finally {
        setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  const navigationTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.bg,
        card: palette.surface,
        text: palette.ink,
        border: palette.line,
        primary: palette.accent,
      },
    };
  }, [dark, palette]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <SafeAreaProvider>
          <ThemeProvider value={navigationTheme}>
            <StatusBar style={dark ? 'light' : 'dark'} />
            {ready ? (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: palette.bg },
                }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="repo/[type]/[owner]/[name]" />
                <Stack.Screen name="discussion/[type]/[owner]/[name]/[num]" />
              </Stack>
            ) : (
              <View style={{ flex: 1, backgroundColor: palette.bg }} />
            )}
          </ThemeProvider>
        </SafeAreaProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
