import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { StorageKeys } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

type AppState = {
  theme: ThemePreference;
  hapticsEnabled: boolean;
  setTheme: (theme: ThemePreference) => void;
  setHapticsEnabled: (enabled: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      hapticsEnabled: true,
      setTheme: (theme) => set({ theme }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: StorageKeys.appStore,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
