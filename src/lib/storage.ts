import AsyncStorage from '@react-native-async-storage/async-storage';
import { FieldRecord, UserProfile } from '@/types/vecdim';
import { DEMO_USERS } from '@/services/auth/demoUsers';

export const STORAGE_KEYS = {
  RECORDS: '@vecdim_records_v1',
  DRAFT: '@vecdim_active_draft_v1',
  CURRENT_USER: '@vecdim_current_user_v1',
  SYNC_HISTORY: '@vecdim_sync_history_v1',
} as const;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getStoredRecords(): Promise<FieldRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) return [];
    return JSON.parse(raw) as FieldRecord[];
  } catch (err) {
    console.error('Failed to load records from storage', err);
    return [];
  }
}

export async function setStoredRecords(records: FieldRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save records to storage', err);
  }
}

export async function getStoredDraft(): Promise<Partial<FieldRecord> | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<FieldRecord>;
  } catch (err) {
    console.error('Failed to load draft from storage', err);
    return null;
  }
}

export async function setStoredDraft(draft: Partial<FieldRecord> | null): Promise<void> {
  try {
    if (!draft) {
      await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
    }
  } catch (err) {
    console.error('Failed to persist draft to storage', err);
  }
}

export async function getStoredUser(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      return JSON.parse(raw) as UserProfile;
    }
  } catch (err) {
    console.error('Failed to load user', err);
  }
  return DEMO_USERS[2]!; // Default: Field Worker 3 (Osun)
}

export async function setStoredUser(user: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to persist user', err);
  }
}
