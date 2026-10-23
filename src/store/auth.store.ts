import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage, StorageKeys } from '@/lib/storage';
import type { AuthResponse, User } from '@/types/user';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  user: User | null;
  status: AuthStatus;
  biometricsEnabled: boolean;
  setSession: (session: AuthResponse) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  setBiometricsEnabled: (enabled: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'loading',
      biometricsEnabled: false,

      async setSession({ user, tokens }) {
        await secureStorage.set(StorageKeys.accessToken, tokens.accessToken);
        if (tokens.refreshToken) {
          await secureStorage.set(StorageKeys.refreshToken, tokens.refreshToken);
        }
        set({ user, status: 'authenticated' });
      },

      async clearSession() {
        await Promise.all([
          secureStorage.remove(StorageKeys.accessToken),
          secureStorage.remove(StorageKeys.refreshToken),
        ]);
        set({ user: null, status: 'unauthenticated', biometricsEnabled: false });
      },

      // Tokens live in SecureStore, so a persisted user alone isn't proof of a session.
      async hydrate() {
        const token = await secureStorage.get(StorageKeys.accessToken);
        set({ status: token && get().user ? 'authenticated' : 'unauthenticated' });
      },

      setBiometricsEnabled(enabled) {
        set({ biometricsEnabled: enabled });
      },
    }),
    {
      name: StorageKeys.authStore,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ user, biometricsEnabled }) => ({ user, biometricsEnabled }),
    },
  ),
);
