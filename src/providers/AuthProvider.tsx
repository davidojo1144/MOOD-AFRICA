import { useMutation } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo } from 'react';

import { queryClient } from '@/lib/query-client';
import type { SignInValues, SignUpValues } from '@/lib/validation';
import { authService, setUnauthorizedHandler } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types/user';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (values: SignInValues) => Promise<void>;
  signUp: (values: SignUpValues) => Promise<void>;
  signOut: () => Promise<void>;
  isSigningIn: boolean;
  isSigningUp: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    // Wait for zustand's persisted user before checking the token.
    if (useAuthStore.persist.hasHydrated()) {
      void hydrate();
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => void hydrate());
  }, [hydrate]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearSession();
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const signInMutation = useMutation({
    mutationFn: authService.signIn,
    onSuccess: setSession,
  });

  const signUpMutation = useMutation({
    mutationFn: authService.signUp,
    onSuccess: setSession,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      signIn: async (values) => {
        await signInMutation.mutateAsync(values);
      },
      signUp: async (values) => {
        await signUpMutation.mutateAsync(values);
      },
      signOut: async () => {
        try {
          await authService.signOut();
        } finally {
          await clearSession();
          queryClient.clear();
        }
      },
      isSigningIn: signInMutation.isPending,
      isSigningUp: signUpMutation.isPending,
    }),
    [user, status, signInMutation, signUpMutation, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
