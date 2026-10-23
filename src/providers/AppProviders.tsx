import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { colorScheme, useColorScheme } from 'nativewind';
import { type PropsWithChildren, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/common/ToastHost';
import { useAppStore } from '@/store/app.store';

import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';

function ThemeBridge({ children }: PropsWithChildren) {
  const theme = useAppStore((s) => s.theme);
  const { colorScheme: scheme } = useColorScheme();

  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>{children}</ThemeProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <ThemeBridge>
              {children}
              <ToastHost />
            </ThemeBridge>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
