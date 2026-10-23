import { type AxiosError, create, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/lib/env';
import { secureStorage, StorageKeys } from '@/lib/storage';

type UnauthorizedHandler = () => void | Promise<void>;

let onUnauthorized: UnauthorizedHandler | null = null;

/** Registered by the AuthProvider so a 401 anywhere signs the user out. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export const apiClient = create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.get(StorageKeys.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await onUnauthorized?.();
    }
    if (__DEV__) {
      console.warn(
        `[api] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status ?? error.code}`,
      );
    }
    return Promise.reject(error);
  },
);
