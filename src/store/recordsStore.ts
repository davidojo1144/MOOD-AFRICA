import { create } from 'zustand';
import { FieldRecord, RecordStatus, UserProfile, ValidationErrorItem } from '@/types/vecdim';
import { DEMO_USERS } from '@/services/auth/demoUsers';
import {
  getStoredDraft,
  getStoredRecords,
  getStoredUser,
  setStoredDraft,
  setStoredRecords,
  setStoredUser,
} from '@/lib/storage';
import { validateRecord } from '@/services/validation/validator';
import { calculateMortalityAndClass } from '@/services/validation/constants';

interface RecordsState {
  records: FieldRecord[];
  activeDraft: Partial<FieldRecord> | null;
  pendingDraftPrompt: Partial<FieldRecord> | null;
  currentUser: UserProfile;
  isInitialized: boolean;

  // Actions
  init: () => Promise<void>;
  setCurrentUser: (user: UserProfile) => Promise<void>;
  saveDraft: (draft: Partial<FieldRecord>) => Promise<void>;
  discardDraft: () => Promise<void>;
  acceptRestoredDraft: () => void;
  dismissDraftPrompt: () => Promise<void>;
  saveRecord: (record: FieldRecord) => Promise<{
    success: boolean;
    errors: ValidationErrorItem[];
    flags: ValidationErrorItem[];
  }>;
  resubmitRecord: (record: FieldRecord) => Promise<{
    success: boolean;
    errors: ValidationErrorItem[];
    flags: ValidationErrorItem[];
  }>;
  deleteRecord: (recordId: string) => Promise<void>;
  updateRecordStatus: (
    recordId: string,
    status: RecordStatus,
    serverErrors?: ValidationErrorItem[],
    serverFlags?: ValidationErrorItem[],
  ) => Promise<void>;
  clearAllRecords: () => Promise<void>;
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  activeDraft: null,
  pendingDraftPrompt: null,
  currentUser: DEMO_USERS[2]!, // Default: Field worker 3 (Osun)
  isInitialized: false,

  init: async () => {
    const [storedRecords, storedDraft, storedUser] = await Promise.all([
      getStoredRecords(),
      getStoredDraft(),
      getStoredUser(),
    ]);

    set({
      records: storedRecords,
      activeDraft: storedDraft,
      pendingDraftPrompt: storedDraft && Object.keys(storedDraft).length > 2 ? storedDraft : null,
      currentUser: storedUser,
      isInitialized: true,
    });
  },

  setCurrentUser: async (user: UserProfile) => {
    set({ currentUser: user });
    await setStoredUser(user);
  },

  saveDraft: async (draft: Partial<FieldRecord>) => {
    // Drafts autosave without Block validation
    set({ activeDraft: draft });
    await setStoredDraft(draft);
  },

  discardDraft: async () => {
    set({ activeDraft: null, pendingDraftPrompt: null });
    await setStoredDraft(null);
  },

  acceptRestoredDraft: () => {
    const { pendingDraftPrompt } = get();
    if (pendingDraftPrompt) {
      set({ activeDraft: pendingDraftPrompt, pendingDraftPrompt: null });
    }
  },

  dismissDraftPrompt: async () => {
    set({ pendingDraftPrompt: null });
  },

  saveRecord: async (record: FieldRecord) => {
    // Compute mortality and WHO class
    const { mortalityPct, whoClass } = calculateMortalityAndClass(record.n_exposed, record.n_dead);
    const enrichedRecord: FieldRecord = {
      ...record,
      mortality_pct: mortalityPct,
      who_class: whoClass,
      status: 'pending_sync',
      updated_at: new Date().toISOString(),
      created_at: record.created_at ?? new Date().toISOString(),
    };

    // Run device validation
    const valResult = validateRecord(enrichedRecord, { mode: 'device' });

    if (!valResult.isValid) {
      // Blocked: cannot be saved to sync queue
      return {
        success: false,
        errors: valResult.errors,
        flags: valResult.flags,
      };
    }

    // Valid: save to local records and clear active draft
    const currentRecords = get().records;
    const existingIndex = currentRecords.findIndex((r) => r.record_id === enrichedRecord.record_id);

    let nextRecords: FieldRecord[];
    if (existingIndex >= 0) {
      nextRecords = [...currentRecords];
      nextRecords[existingIndex] = enrichedRecord;
    } else {
      nextRecords = [enrichedRecord, ...currentRecords];
    }

    set({
      records: nextRecords,
      activeDraft: null,
      pendingDraftPrompt: null,
    });

    await Promise.all([setStoredRecords(nextRecords), setStoredDraft(null)]);

    return {
      success: true,
      errors: [],
      flags: valResult.flags,
    };
  },

  resubmitRecord: async (record: FieldRecord) => {
    // Re-evaluates corrected rejected record under same record_id
    return get().saveRecord(record);
  },

  deleteRecord: async (recordId: string) => {
    const nextRecords = get().records.filter((r) => r.record_id !== recordId);
    set({ records: nextRecords });
    await setStoredRecords(nextRecords);
  },

  updateRecordStatus: async (
    recordId: string,
    status: RecordStatus,
    serverErrors?: ValidationErrorItem[],
    serverFlags?: ValidationErrorItem[],
  ) => {
    const currentRecords = get().records;
    const nextRecords = currentRecords.map((r) => {
      if (r.record_id === recordId) {
        return {
          ...r,
          status,
          server_errors: serverErrors ?? r.server_errors,
          server_flags: serverFlags ?? r.server_flags,
          updated_at: new Date().toISOString(),
        };
      }
      return r;
    });

    set({ records: nextRecords });
    await setStoredRecords(nextRecords);
  },

  clearAllRecords: async () => {
    set({ records: [], activeDraft: null, pendingDraftPrompt: null });
    await Promise.all([setStoredRecords([]), setStoredDraft(null)]);
  },
}));
