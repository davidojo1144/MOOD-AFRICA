import { focusManager, onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { queryClient } from '@/lib/query-client';

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Assume online until a network listener (e.g. expo-network) is wired in.
    onlineManager.setOnline(true);
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
