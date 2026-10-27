import { FieldRecord, ValidationErrorItem } from '@/types/vecdim';
import { useRecordsStore } from '@/store/recordsStore';

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface SyncProgress {
  isSyncing: boolean;
  totalPending: number;
  syncedCount: number;
  rejectedCount: number;
  lastSyncTime: string | null;
  error?: string | null;
}

export class MobileSyncEngine {
  private apiBaseUrl: string;
  private isSyncing = false;
  private retryBackoffMs = 2000;
  private maxBackoffMs = 30000;

  constructor(apiBaseUrl: string = DEFAULT_API_BASE) {
    this.apiBaseUrl = apiBaseUrl;
  }

  setApiUrl(url: string) {
    this.apiBaseUrl = url;
  }

  getApiUrl(): string {
    return this.apiBaseUrl;
  }

  async syncPendingRecords(options?: {
    forceSimulateOffline?: boolean;
    batchSize?: number;
  }): Promise<{
    success: boolean;
    synced: number;
    rejected: number;
    message: string;
  }> {
    if (this.isSyncing) {
      return { success: false, synced: 0, rejected: 0, message: 'Sync in progress' };
    }

    if (options?.forceSimulateOffline) {
      return {
        success: false,
        synced: 0,
        rejected: 0,
        message: 'Device is in Airplane / Offline mode. Sync postponed until connection returns.',
      };
    }

    const { records, currentUser, updateRecordStatus } = useRecordsStore.getState();
    const pending = records.filter((r) => r.status === 'pending_sync');

    if (pending.length === 0) {
      return {
        success: true,
        synced: 0,
        rejected: 0,
        message: 'All records are up to date. Nothing to sync.',
      };
    }

    this.isSyncing = true;
    let syncedTotal = 0;
    let rejectedTotal = 0;

    const batchSize = options?.batchSize || 10;
    const batches: FieldRecord[][] = [];
    for (let i = 0; i < pending.length; i += batchSize) {
      batches.push(pending.slice(i, i + batchSize));
    }

    try {
      for (const batch of batches) {
        const payload = {
          records: batch.map((r) => ({
            record_id: r.record_id,
            state: r.state,
            lga: r.lga,
            ward: r.ward,
            latitude: r.latitude,
            longitude: r.longitude,
            gps_accuracy_m: r.gps_accuracy_m,
            collection_date: r.collection_date,
            species: r.species,
            insecticide: r.insecticide,
            n_exposed: r.n_exposed,
            n_dead: r.n_dead,
            larval_density: r.larval_density,
            urban: r.urban,
            irs_covered: r.irs_covered,
            itn_use_pct: r.itn_use_pct,
            captured_at: r.captured_at,
          })),
        };

        const res = await fetch(`${this.apiBaseUrl}/records/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.user_id,
            'x-user-role': currentUser.role,
            ...(currentUser.state ? { 'x-user-state': currentUser.state } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const results: {
          record_id: string;
          status: 'accepted' | 'accepted_with_flags' | 'rejected' | 'already_received';
          flags: ValidationErrorItem[];
          errors: ValidationErrorItem[];
        }[] = data.results || [];

        // Apply results record by record so partial failure doesn't block valid ones
        for (const item of results) {
          if (item.status === 'accepted' || item.status === 'already_received') {
            await updateRecordStatus(item.record_id, 'synced', [], item.flags);
            syncedTotal++;
          } else if (item.status === 'accepted_with_flags') {
            await updateRecordStatus(item.record_id, 'synced_with_flags', [], item.flags);
            syncedTotal++;
          } else if (item.status === 'rejected') {
            await updateRecordStatus(item.record_id, 'rejected', item.errors, item.flags);
            rejectedTotal++;
          }
        }

        // Reset backoff on success
        this.retryBackoffMs = 2000;
      }

      this.isSyncing = false;
      return {
        success: true,
        synced: syncedTotal,
        rejected: rejectedTotal,
        message: `Sync complete: ${syncedTotal} accepted, ${rejectedTotal} need attention.`,
      };
    } catch (err: any) {
      this.isSyncing = false;
      // Exponential backoff
      this.retryBackoffMs = Math.min(this.retryBackoffMs * 1.5, this.maxBackoffMs);

      // In offline scenario, records remain in pending_sync safely
      return {
        success: false,
        synced: syncedTotal,
        rejected: rejectedTotal,
        message: `Sync failed (${err.message || 'Network error'}). Records kept offline in queue. Retry in ${Math.round(this.retryBackoffMs / 1000)}s.`,
      };
    }
  }
}

export const syncEngine = new MobileSyncEngine();
