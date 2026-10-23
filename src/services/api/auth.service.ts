import { env } from '@/lib/env';
import type { SignInValues, SignUpValues } from '@/lib/validation';
import type { AuthResponse, User } from '@/types/user';

import { apiClient } from './client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockAuth = async (user: Omit<User, 'id'>): Promise<AuthResponse> => {
  await delay(600);
  return {
    user: { id: 'mock-user-1', ...user },
    tokens: { accessToken: `mock-token-${Date.now()}` },
  };
};

export const authService = {
  async signIn(values: SignInValues): Promise<AuthResponse> {
    if (env.useMockAuth) {
      return mockAuth({ name: values.email.split('@')[0] ?? 'Friend', email: values.email });
    }
    const { data } = await apiClient.post<AuthResponse>('/auth/sign-in', values);
    return data;
  },

  async signUp({ confirmPassword: _confirm, ...values }: SignUpValues): Promise<AuthResponse> {
    if (env.useMockAuth) {
      return mockAuth({ name: values.name, email: values.email });
    }
    const { data } = await apiClient.post<AuthResponse>('/auth/sign-up', values);
    return data;
  },

  async signOut(): Promise<void> {
    if (env.useMockAuth) return;
    await apiClient.post('/auth/sign-out');
  },
};
