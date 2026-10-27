import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FieldRecord } from '@/types/vecdim';
import { useRecordsStore } from '@/store/recordsStore';
import { syncEngine } from '@/services/sync/syncService';
import { haptics } from '@/lib/haptics';
import { showToast } from '@/lib/toast';
import { EmptyState } from '@/components/common/FeedbackStates';
import { RecordCardsSkeleton } from '@/components/common/Skeleton';
import {
  Plus,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  Clock,
  Bug,
  ClipboardList,
  ChevronRight,
  Inbox,
  AlertCircle,
} from 'lucide-react-native';

interface FieldViewProps {
  onNewRecord: () => void;
  onEditRecord: (record: FieldRecord) => void;
  isOfflineMode: boolean;
}

export function FieldView({ onNewRecord, onEditRecord, isOfflineMode }: FieldViewProps) {
  const { records, currentUser, isInitialized, saveRecord } = useRecordsStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'attention' | 'synced'>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [syncError, setSyncError] = useState<string | null>(null);

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

  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    haptics.light();
    await new Promise((res) => setTimeout(res, 600));
    setIsRefreshing(false);
    showToast.info('Outbox Refreshed', `${userRecords.length} local records ready.`);
  };

  const handleSyncNow = async () => {
    haptics.light();
    setIsSyncing(true);
    setSyncError(null);
    setSyncStatusMsg('Connecting to VECDIM server...');
    const result = await syncEngine.syncPendingRecords({
      forceSimulateOffline: isOfflineMode,
    });
    setIsSyncing(false);
    setSyncStatusMsg(result.message);
    if (result.success) {
      if (result.rejected > 0) {
        setSyncError(`${result.rejected} record(s) rejected by server validation.`);
        haptics.error();
        showToast.error('Sync Alert', `${result.rejected} record(s) rejected.`);
      } else {
        setSyncError(null);
        haptics.success();
        showToast.success('Sync Completed', result.message);
      }
    } else {
      setSyncError(result.message);
      haptics.warning();
      showToast.info('Sync Status', result.message);
    }
  };

  const handleSeedDemoRecords = async () => {
    haptics.medium();
    const samples: FieldRecord[] = [
      {
        record_id: `demo-osun-1-${Date.now()}`,
        state: 'Osun',
        lga: 'Osogbo',
        ward: 'Osogbo Ward 1',
        latitude: 7.7712,
        longitude: 4.5583,
        gps_accuracy_m: 6.2,
        collection_date: new Date().toISOString().split('T')[0]!,
        captured_at: new Date().toISOString(),
        species: 'An. gambiae s.s.',
        insecticide: 'Permethrin',
        n_exposed: 100,
        n_dead: 42,
        mortality_pct: 42.0,
        who_class: 'Resistant',
        larval_density: 3,
        urban: 1,
        irs_covered: 0,
        itn_use_pct: 72,
        status: 'pending_sync',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        record_id: `demo-osun-2-${Date.now()}`,
        state: 'Osun',
        lga: 'Ife Central',
        ward: 'Ife Central Ward 2',
        latitude: 7.4833,
        longitude: 4.5667,
        gps_accuracy_m: 8.5,
        collection_date: new Date().toISOString().split('T')[0]!,
        captured_at: new Date().toISOString(),
        species: 'An. funestus',
        insecticide: 'Deltamethrin',
        n_exposed: 100,
        n_dead: 94,
        mortality_pct: 94.0,
        who_class: 'Possible resistance',
        larval_density: 2,
        urban: 0,
        irs_covered: 1,
        itn_use_pct: 85,
        status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        record_id: `demo-osun-3-${Date.now()}`,
        state: 'Osun',
        lga: 'Ilesa East',
        ward: 'Ilesa Ward 4',
        latitude: 7.6254,
        longitude: 4.7432,
        gps_accuracy_m: 9.1,
        collection_date: new Date().toISOString().split('T')[0]!,
        captured_at: new Date().toISOString(),
        species: 'An. coluzzii',
        insecticide: 'Alphacypermethrin',
        n_exposed: 100,
        n_dead: 99,
        mortality_pct: 99.0,
        who_class: 'Susceptible',
        larval_density: 1,
        urban: 1,
        irs_covered: 0,
        itn_use_pct: 90,
        status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        record_id: `demo-osun-4-${Date.now()}`,
        state: 'Osun',
        lga: 'Osogbo',
        ward: 'Osogbo Ward 3',
        latitude: 7.781,
        longitude: 4.562,
        gps_accuracy_m: 12.0,
        collection_date: new Date().toISOString().split('T')[0]!,
        captured_at: new Date().toISOString(),
        species: 'An. gambiae s.s.',
        insecticide: 'Permethrin',
        n_exposed: 100,
        n_dead: 110, // Rejected sample
        mortality_pct: 110.0,
        who_class: 'Resistant',
        larval_density: 4,
        urban: 1,
        irs_covered: 0,
        itn_use_pct: 60,
        status: 'rejected',
        server_errors: [
          {
            field: 'n_dead',
            rule: 'n_dead_gt_n_exposed',
            message: 'Dead count (110) cannot exceed exposed count (100).',
            severity: 'Block',
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const sample of samples) {
      await saveRecord(sample);
    }
    haptics.success();
    showToast.success('Demo Samples Loaded', '4 sample records ready in Osun state.');
  };

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-slate-50">
      {/* Top Hero Stats Header */}
      <View className="shadow-xs border-b border-slate-200 bg-white px-4 pb-3 pt-3.5">
        {/* Title row */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-black tracking-tight text-slate-900">
              Field Entomology Records
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <MapPin size={12} color="#059669" />
              <Text className="text-xs font-semibold text-slate-600">
                {currentUser.name} • {currentUser.state ? `${currentUser.state} State` : 'National'}
              </Text>
            </View>
          </View>

          {/* Quick Action Button: + New Form */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onNewRecord}
            className="flex-row items-center rounded-xl bg-emerald-600 px-3.5 py-2.5 shadow-sm active:bg-emerald-700">
            <Plus size={16} color="#FFFFFF" strokeWidth={3} />
            <Text className="ml-1 text-xs font-black uppercase tracking-wider text-white">
              New Form
            </Text>
          </TouchableOpacity>
        </View>

        {/* Operational Metrics Cards */}
        <View className="mt-3 flex-row gap-2">
          {/* Total Records */}
          <View className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Captured
            </Text>
            <Text className="mt-0.5 text-xl font-black text-slate-900">{userRecords.length}</Text>
            <Text className="text-[10px] font-medium text-slate-400">Total samples</Text>
          </View>

          {/* Pending Sync Card */}
          <View
            className={`flex-1 rounded-xl border p-2.5 ${
              pendingCount > 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'
            }`}>
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${
                pendingCount > 0 ? 'text-amber-800' : 'text-slate-500'
              }`}>
              Pending Sync
            </Text>
            <View className="flex-row items-center gap-1">
              <Text
                className={`text-xl font-black ${
                  pendingCount > 0 ? 'text-amber-950' : 'text-slate-900'
                }`}>
                {pendingCount}
              </Text>
              {pendingCount > 0 && <Clock size={14} color="#D97706" />}
            </View>
            <Text
              className={`text-[10px] font-medium ${
                pendingCount > 0 ? 'text-amber-700' : 'text-slate-400'
              }`}>
              Offline queue
            </Text>
          </View>

          {/* Needs Attention Card */}
          <View
            className={`flex-1 rounded-xl border p-2.5 ${
              attentionCount > 0 ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
            }`}>
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${
                attentionCount > 0 ? 'text-rose-800' : 'text-slate-500'
              }`}>
              Needs Fix
            </Text>
            <View className="flex-row items-center gap-1">
              <Text
                className={`text-xl font-black ${
                  attentionCount > 0 ? 'text-rose-950' : 'text-slate-900'
                }`}>
                {attentionCount}
              </Text>
              {attentionCount > 0 && <AlertTriangle size={14} color="#E11D48" />}
            </View>
            <Text
              className={`text-[10px] font-medium ${
                attentionCount > 0 ? 'text-rose-700' : 'text-slate-400'
              }`}>
              Server rejected
            </Text>
          </View>
        </View>

        {/* Sync Trigger Action Bar */}
        <View className="mt-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-3 py-2">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-2">
              <RefreshCw
                size={14}
                color={isOfflineMode ? '#D97706' : '#059669'}
                className={isSyncing ? 'animate-spin' : ''}
              />
              <Text className="text-xs font-semibold text-slate-700">
                {isOfflineMode
                  ? 'Offline Queue Active (Airplane Mode)'
                  : pendingCount > 0
                    ? `${pendingCount} record${pendingCount > 1 ? 's' : ''} ready to sync`
                    : 'Outbox up to date'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSyncNow}
            disabled={isSyncing}
            className={`shadow-xs flex-row items-center rounded-lg px-3 py-1.5 ${
              isOfflineMode
                ? 'bg-amber-500 active:bg-amber-600'
                : 'bg-slate-900 active:bg-slate-800'
            }`}>
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-xs font-bold text-white">
                {isOfflineMode ? 'Test Offline Sync' : 'Sync Outbox'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sync Error State Banner (Dismissable & Retryable) */}
        {syncError ? (
          <View className="mt-2.5 flex-row items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-2.5">
            <View className="flex-1 flex-row items-center gap-2 pr-2">
              <AlertCircle size={15} color="#E11D48" />
              <Text className="text-xs font-semibold text-rose-800">{syncError}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSyncNow}
              className="shadow-xs rounded-lg bg-rose-600 px-2.5 py-1 active:bg-rose-700">
              <Text className="text-[11px] font-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : syncStatusMsg ? (
          <Text className="mt-1 text-[11px] font-medium italic text-slate-500">
            {syncStatusMsg}
          </Text>
        ) : null}

        {/* Filter Pills */}
        <View className="mt-3 flex-row gap-1.5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('all')}
            className={`rounded-full border px-3 py-1 ${
              filter === 'all'
                ? 'shadow-xs border-slate-900 bg-slate-900'
                : 'border-slate-200 bg-white'
            }`}>
            <Text
              className={`text-xs font-bold ${filter === 'all' ? 'text-white' : 'text-slate-600'}`}>
              All ({userRecords.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('pending')}
            className={`rounded-full border px-3 py-1 ${
              filter === 'pending'
                ? 'shadow-xs border-amber-500 bg-amber-500'
                : 'border-slate-200 bg-white'
            }`}>
            <Text
              className={`text-xs font-bold ${
                filter === 'pending' ? 'text-white' : 'text-slate-600'
              }`}>
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('attention')}
            className={`rounded-full border px-3 py-1 ${
              filter === 'attention'
                ? 'shadow-xs border-rose-600 bg-rose-600'
                : 'border-slate-200 bg-white'
            }`}>
            <Text
              className={`text-xs font-bold ${
                filter === 'attention' ? 'text-white' : 'text-slate-600'
              }`}>
              Attention ({attentionCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('synced')}
            className={`rounded-full border px-3 py-1 ${
              filter === 'synced'
                ? 'shadow-xs border-emerald-600 bg-emerald-600'
                : 'border-slate-200 bg-white'
            }`}>
            <Text
              className={`text-xs font-bold ${
                filter === 'synced' ? 'text-white' : 'text-slate-600'
              }`}>
              Synced ({syncedCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Records List / Contextual Empty States / Skeleton Loading State */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
            tintColor="#059669"
            colors={['#059669']}
          />
        }>
        {!isInitialized ? (
          <RecordCardsSkeleton count={3} />
        ) : filteredRecords.length === 0 ? (
          userRecords.length === 0 ? (
            /* 1. Global Onboarding Empty State */
            <EmptyState
              variant="emerald"
              icon={<ClipboardList size={34} color="#059669" />}
              title="No Field Records Yet"
              description="Capture mosquito bioassays, larval density, and GPS coordinates offline. All records validate locally against national R rules."
              actionLabel="Start New Capture"
              onAction={onNewRecord}
              secondaryLabel="Load Demo Samples (4 items)"
              onSecondaryAction={handleSeedDemoRecords}
            />
          ) : filter === 'pending' ? (
            /* 2. Filter: Pending Sync Empty State */
            <EmptyState
              variant="amber"
              icon={<Clock size={34} color="#D97706" />}
              title="Offline Outbox Is Clear"
              description="No records are currently pending sync. Any newly captured records will wait here until you are connected."
              actionLabel="Capture New Record"
              onAction={onNewRecord}
              secondaryLabel="View All Records"
              onSecondaryAction={() => setFilter('all')}
            />
          ) : filter === 'attention' ? (
            /* 3. Filter: Attention / Rejected Empty State */
            <EmptyState
              variant="emerald"
              icon={<CheckCircle2 size={34} color="#059669" />}
              title="Zero Validation Issues"
              description="Excellent! All field records have passed server validation rules with zero rejections or blocking errors."
              actionLabel="View All Records"
              onAction={() => setFilter('all')}
            />
          ) : filter === 'synced' ? (
            /* 4. Filter: Synced Empty State */
            <EmptyState
              variant="blue"
              icon={<CheckCircle size={34} color="#2563EB" />}
              title="No Synced Records Yet"
              description={
                pendingCount > 0
                  ? `You have ${pendingCount} record(s) in the offline queue ready to sync.`
                  : 'Records will appear here once confirmed by the central PostGIS server.'
              }
              actionLabel={pendingCount > 0 ? 'Sync Outbox Now' : 'Capture Record'}
              onAction={pendingCount > 0 ? handleSyncNow : onNewRecord}
              secondaryLabel="View All Records"
              onSecondaryAction={() => setFilter('all')}
            />
          ) : (
            /* 5. General Filter Reset */
            <EmptyState
              variant="slate"
              icon={<Inbox size={34} color="#64748B" />}
              title="No Matching Records"
              description="No field records match your active filters."
              actionLabel="Reset Filter"
              onAction={() => setFilter('all')}
            />
          )
        ) : (
          filteredRecords.map((item) => {
            const isNeedAttention = item.status === 'rejected';
            const isPending = item.status === 'pending_sync';

            return (
              <TouchableOpacity
                key={item.record_id}
                activeOpacity={0.7}
                onPress={() => onEditRecord(item)}
                className={`shadow-xs mb-3.5 rounded-2xl border bg-white p-4 ${
                  isNeedAttention
                    ? 'border-rose-300 bg-rose-50'
                    : isPending
                      ? 'border-amber-200'
                      : 'border-slate-200'
                }`}>
                {/* Header row: Location & Status */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5">
                      <MapPin size={14} color="#059669" />
                      <Text className="text-sm font-extrabold text-slate-900">
                        {item.lga} • {item.ward}
                      </Text>
                    </View>
                    <Text className="mt-0.5 text-xs font-medium text-slate-500">
                      State: {item.state} • Collected: {item.collection_date}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    className={`flex-row items-center rounded-full border px-2.5 py-0.5 ${
                      isNeedAttention
                        ? 'border-rose-200 bg-rose-50'
                        : isPending
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-emerald-200 bg-emerald-50'
                    }`}>
                    {isNeedAttention ? (
                      <AlertTriangle size={11} color="#E11D48" />
                    ) : isPending ? (
                      <Clock size={11} color="#D97706" />
                    ) : (
                      <CheckCircle2 size={11} color="#059669" />
                    )}
                    <Text
                      className={`ml-1 text-[10px] font-extrabold uppercase ${
                        isNeedAttention
                          ? 'text-rose-700'
                          : isPending
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                      }`}>
                      {isNeedAttention
                        ? 'Needs Fix'
                        : isPending
                          ? 'Outbox'
                          : item.status === 'synced_with_flags'
                            ? 'Synced (Flag)'
                            : 'Synced'}
                    </Text>
                  </View>
                </View>

                {/* Bioassay Strip */}
                <View className="mt-3 flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                      <Bug size={16} color="#059669" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-800">{item.species}</Text>
                      <Text className="text-[11px] text-slate-500">
                        {item.insecticide} • {item.n_dead}/{item.n_exposed} dead
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-sm font-black text-slate-900">
                      {item.mortality_pct !== undefined
                        ? `${item.mortality_pct.toFixed(1)}%`
                        : 'N/A'}
                    </Text>
                    <View
                      className={`mt-0.5 rounded-full px-2 py-0.5 ${
                        item.who_class === 'Susceptible'
                          ? 'bg-emerald-100'
                          : item.who_class === 'Possible resistance'
                            ? 'bg-amber-100'
                            : 'bg-rose-100'
                      }`}>
                      <Text
                        className={`text-[9px] font-extrabold uppercase ${
                          item.who_class === 'Susceptible'
                            ? 'text-emerald-800'
                            : item.who_class === 'Possible resistance'
                              ? 'text-amber-800'
                              : 'text-rose-800'
                        }`}>
                        {item.who_class || 'Resistant'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Rejection Error Banner */}
                {isNeedAttention && item.server_errors && item.server_errors.length > 0 && (
                  <View className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <View className="flex-row items-center gap-1.5">
                      <AlertTriangle size={13} color="#E11D48" />
                      <Text className="text-xs font-bold text-rose-900">
                        Server Rejection Reason:
                      </Text>
                    </View>
                    {item.server_errors.map((err, eIdx) => (
                      <Text key={eIdx} className="mt-1 text-xs font-medium text-rose-800">
                        • [{err.field}]: {err.message}
                      </Text>
                    ))}
                    <Text className="mt-1.5 text-[10px] font-bold text-rose-600 underline">
                      Tap this card to edit and resubmit under the same record ID →
                    </Text>
                  </View>
                )}

                {/* GPS and Details Link Footer */}
                <View className="mt-2.5 flex-row items-center justify-between pt-1">
                  <Text className="text-[10px] font-medium text-slate-400">
                    GPS: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)} (±
                    {item.gps_accuracy_m ?? '?'}m)
                  </Text>
                  <View className="flex-row items-center gap-0.5">
                    <Text className="text-[11px] font-bold text-emerald-700">
                      {isNeedAttention ? 'Fix Record' : 'Edit'}
                    </Text>
                    <ChevronRight size={13} color="#059669" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
