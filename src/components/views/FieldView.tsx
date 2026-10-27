import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FieldRecord } from '@/types/vecdim';
import { useRecordsStore } from '@/store/recordsStore';
import { syncEngine } from '@/services/sync/syncService';

interface FieldViewProps {
  onNewRecord: () => void;
  onEditRecord: (record: FieldRecord) => void;
  isOfflineMode: boolean;
}

export function FieldView({ onNewRecord, onEditRecord, isOfflineMode }: FieldViewProps) {
  const { records, currentUser } = useRecordsStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'attention' | 'synced'>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  // Filter records relevant to this field worker
  const userRecords = records;

  const pendingCount = userRecords.filter((r) => r.status === 'pending_sync').length;
  const attentionCount = userRecords.filter((r) => r.status === 'rejected').length;
  const syncedCount = userRecords.filter(
    (r) => r.status === 'synced' || r.status === 'synced_with_flags',
  ).length;

  const filteredRecords = userRecords.filter((r) => {
    if (filter === 'pending') return r.status === 'pending_sync';
    if (filter === 'attention') return r.status === 'rejected';
    if (filter === 'synced') return r.status === 'synced' || r.status === 'synced_with_flags';
    return true;
  });

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Syncing records with VECDIM server...');
    const result = await syncEngine.syncPendingRecords({
      forceSimulateOffline: isOfflineMode,
    });
    setIsSyncing(false);
    setSyncStatusMsg(result.message);
    Alert.alert(result.success ? 'Sync Completed' : 'Sync Status', result.message);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top Action Bar */}
      <View className="border-b border-border bg-surface px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-foreground">Entomology Records</Text>
            <Text className="text-xs text-muted">
              {currentUser.name} ({currentUser.state || 'Field'})
            </Text>
          </View>

          <TouchableOpacity
            onPress={onNewRecord}
            className="flex-row items-center rounded-xl bg-primary px-3.5 py-2 shadow-sm">
            <Text className="text-sm font-bold text-white">+ New Form</Text>
          </TouchableOpacity>
        </View>

        {/* Sync Summary & Trigger */}
        <View className="mt-3 flex-row items-center justify-between rounded-xl border border-border bg-background p-3">
          <View>
            <Text className="text-xs font-semibold text-foreground">Offline Sync Status</Text>
            <Text className="text-[11px] text-muted">
              {pendingCount} pending upload • {attentionCount} need attention
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSyncNow}
            disabled={isSyncing}
            className={`flex-row items-center rounded-lg px-3 py-1.5 ${
              isOfflineMode ? 'border border-amber-300 bg-amber-100' : 'bg-secondary'
            }`}>
            {isSyncing && <ActivityIndicator size="small" color="#fff" className="mr-1.5" />}
            <Text
              className={`text-xs font-bold ${isOfflineMode ? 'text-amber-900' : 'text-white'}`}>
              {isSyncing ? 'Syncing...' : isOfflineMode ? 'Offline Queue' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {syncStatusMsg ? (
          <Text className="mt-1.5 text-[11px] italic text-muted">{syncStatusMsg}</Text>
        ) : null}

        {/* Status Filter Tabs */}
        <View className="mt-3 flex-row gap-1.5">
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`rounded-lg border px-2.5 py-1 ${
              filter === 'all' ? 'border-primary bg-primary-50' : 'border-border bg-surface'
            }`}>
            <Text
              className={`text-xs ${filter === 'all' ? 'font-bold text-primary' : 'text-muted'}`}>
              All ({userRecords.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('attention')}
            className={`rounded-lg border px-2.5 py-1 ${
              filter === 'attention' ? 'border-rose-400 bg-rose-50' : 'border-border bg-surface'
            }`}>
            <Text
              className={`text-xs font-semibold ${
                filter === 'attention' ? 'font-bold text-rose-700' : 'text-muted'
              }`}>
              Needs Attention ({attentionCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('pending')}
            className={`rounded-lg border px-2.5 py-1 ${
              filter === 'pending' ? 'border-amber-400 bg-amber-50' : 'border-border bg-surface'
            }`}>
            <Text
              className={`text-xs ${
                filter === 'pending' ? 'font-bold text-amber-700' : 'text-muted'
              }`}>
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('synced')}
            className={`rounded-lg border px-2.5 py-1 ${
              filter === 'synced' ? 'border-emerald-400 bg-emerald-50' : 'border-border bg-surface'
            }`}>
            <Text
              className={`text-xs ${
                filter === 'synced' ? 'font-bold text-emerald-700' : 'text-muted'
              }`}>
              Synced ({syncedCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Record List */}
      <ScrollView className="flex-1 p-4">
        {filteredRecords.length === 0 ? (
          <View className="items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8">
            <Text className="text-3xl">📋</Text>
            <Text className="mt-2 font-bold text-foreground">No records found</Text>
            <Text className="mt-1 text-center text-xs text-muted">
              {filter === 'attention'
                ? 'Great news! No records currently need correction.'
                : 'Tap "+ New Form" to record an entomology sample offline.'}
            </Text>
          </View>
        ) : (
          filteredRecords.map((item) => {
            const isNeedAttention = item.status === 'rejected';
            const isPending = item.status === 'pending_sync';

            return (
              <TouchableOpacity
                key={item.record_id}
                onPress={() => onEditRecord(item)}
                className={`mb-3 rounded-2xl border bg-surface p-4 shadow-sm ${
                  isNeedAttention
                    ? 'border-rose-300 bg-rose-50/40'
                    : isPending
                      ? 'border-amber-300'
                      : 'border-border'
                }`}>
                {/* Header row */}
                <View className="flex-row items-start justify-between">
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-bold text-foreground">
                        {item.lga} • {item.ward}
                      </Text>
                      <Text className="text-xs text-muted">{item.state}</Text>
                    </View>
                    <Text className="mt-0.5 text-xs text-muted">
                      Date: {item.collection_date} • ID: {item.record_id.slice(0, 8)}...
                    </Text>
                  </View>

                  {/* Status badge */}
                  <View
                    className={`rounded-full border px-2.5 py-0.5 ${
                      isNeedAttention
                        ? 'border-rose-300 bg-rose-100'
                        : isPending
                          ? 'border-amber-300 bg-amber-100'
                          : 'border-emerald-300 bg-emerald-100'
                    }`}>
                    <Text
                      className={`text-[10px] font-bold uppercase ${
                        isNeedAttention
                          ? 'text-rose-800'
                          : isPending
                            ? 'text-amber-800'
                            : 'text-emerald-800'
                      }`}>
                      {isNeedAttention
                        ? 'Needs Attention'
                        : isPending
                          ? 'Pending Sync'
                          : item.status === 'synced_with_flags'
                            ? 'Synced (Flagged)'
                            : 'Synced'}
                    </Text>
                  </View>
                </View>

                {/* Bioassay Info */}
                <View className="mt-3 flex-row items-center justify-between rounded-xl border border-border bg-background p-2.5">
                  <View>
                    <Text className="text-xs font-semibold text-foreground">{item.species}</Text>
                    <Text className="text-[11px] text-muted">
                      {item.insecticide} • {item.n_dead}/{item.n_exposed} dead
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-sm font-bold text-foreground">
                      {item.mortality_pct !== undefined
                        ? `${item.mortality_pct.toFixed(1)}%`
                        : 'N/A'}
                    </Text>
                    <Text
                      className={`text-[10px] font-bold ${
                        item.who_class === 'Susceptible'
                          ? 'text-emerald-600'
                          : item.who_class === 'Possible resistance'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                      }`}>
                      {item.who_class || 'Resistant'}
                    </Text>
                  </View>
                </View>

                {/* Error messages if rejected */}
                {isNeedAttention && item.server_errors && item.server_errors.length > 0 && (
                  <View className="mt-2.5 rounded-lg border border-rose-300 bg-rose-100/60 p-2.5">
                    <Text className="text-[11px] font-bold text-rose-900">
                      Server Rejection Reason (Tap to fix & resubmit):
                    </Text>
                    {item.server_errors.map((err, eIdx) => (
                      <Text key={eIdx} className="mt-0.5 text-xs text-rose-800">
                        • [{err.field}]: {err.message}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Footer GPS accuracy */}
                <View className="mt-2.5 flex-row items-center justify-between text-xs text-muted">
                  <Text className="text-[11px] text-muted">
                    GPS: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)} (±
                    {item.gps_accuracy_m ?? '?'}m)
                  </Text>
                  <Text className="text-[11px] font-semibold text-primary">
                    {isNeedAttention ? 'Fix & Resubmit →' : 'View Details →'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
