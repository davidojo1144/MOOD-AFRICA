import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const StorageKeys = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  authStore: 'store.auth',
  appStore: 'store.app',
} as const;

/** Non-sensitive key/value storage backed by AsyncStorage. */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set<T>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

/**
 * Sensitive storage backed by the iOS Keychain / Android Keystore.
 * SecureStore is unavailable on web, so it falls back to AsyncStorage there.
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};
