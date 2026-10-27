import React, { useEffect, useState } from 'react';
import {
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTierItem } from '@/types/vecdim';
import { AlertsClientService } from '@/services/api/alertsService';
import { haptics } from '@/lib/haptics';
import { showToast } from '@/lib/toast';
import { AlertListSkeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/FeedbackStates';
import {
  Building2,
  FileSpreadsheet,
  Search,
  Flame,
  AlertTriangle,
  Info,
  MapPin,
  Copy,
  Check,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export function UniosunView() {
  const [alerts, setAlerts] = useState<AlertTierItem[]>([]);
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [dhis2ModalOpen, setDhis2ModalOpen] = useState<boolean>(false);
  const [dhis2Json, setDhis2Json] = useState<string>('');
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    haptics.light();
    setRefreshKey((k) => k + 1);
    await new Promise((res) => setTimeout(res, 500));
    setIsRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;
    AlertsClientService.getAlerts({
      userRole: 'uniosun',
    })
      .then((data) => {
        if (isMounted) {
          setAlerts(data);
          setIsLoading(false);
          setFetchError(null);
        }
      })
      .catch((e) => {
        console.error(e);
        if (isMounted) {
          setFetchError('Unable to load national surveillance alerts.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const totalAlert = alerts.filter((a) => a.tier === 'ALERT').length;
  const totalWarning = alerts.filter((a) => a.tier === 'WARNING').length;
  const totalWatch = alerts.filter((a) => a.tier === 'WATCH').length;

  // Breakdown by State
  const stateBreakdown = ['Lagos', 'Kano', 'Osun'].map((st) => {
    const stAlerts = alerts.filter((a) => a.state === st);
    return {
      state: st,
      total: stAlerts.length,
      alert: stAlerts.filter((a) => a.tier === 'ALERT').length,
      warning: stAlerts.filter((a) => a.tier === 'WARNING').length,
      watch: stAlerts.filter((a) => a.tier === 'WATCH').length,
      resistant: stAlerts.filter((a) => a.pyrethroid_resistance_flag).length,
    };
  });

  const filteredAlerts = alerts.filter((a) => {
    if (selectedState !== 'All' && a.state !== selectedState) return false;
    if (selectedTier !== 'All' && a.tier !== selectedTier) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.lga.toLowerCase().includes(q) || a.state.toLowerCase().includes(q) || a.month.includes(q)
      );
    }
    return true;
  });

  const handleExportDHIS2 = () => {
    const payload = {
      dataSet: 'VECDIM_EPIDEMIC_SURVEILLANCE_v1',
      completeDate: new Date().toISOString().split('T')[0],
      period: '202610',
      orgUnit: 'OU_NIGERIA_NATIONAL',
      metrics: {
        totalSurveillanceAlerts: alerts.length,
        epidemicThresholdAlerts: totalAlert,
        warningAlerts: totalWarning,
        watchAlerts: totalWatch,
      },
      dataValues: filteredAlerts.slice(0, 25).map((a) => ({
        dataElement: 'MALARIA_EARLY_WARNING_TIER',
        period: a.month.replace('-', ''),
        orgUnit: `NG_${a.state.toUpperCase()}_${a.lga.toUpperCase().replace(/\s+/g, '_')}`,
        value: a.tier,
        comment: `Model Prob: ${(a.mean_risk * 100).toFixed(1)}%, Resistance: ${
          a.pyrethroid_resistance_flag ? 'Positive' : 'Negative'
        }`,
      })),
    };
    setDhis2Json(JSON.stringify(payload, null, 2));
    setDhis2ModalOpen(true);
    setHasCopied(false);
  };

  const handleCopyClipboard = async () => {
    await Clipboard.setStringAsync(dhis2Json);
    setHasCopied(true);
    haptics.success();
    showToast.success('Payload Copied', 'DHIS2 JSON copied to clipboard.');
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-slate-50">
      {/* Top Header */}
      <View className="shadow-xs border-b border-slate-200 bg-white px-4 pb-3 pt-3.5">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-1.5">
              <Building2 size={18} color="#4F46E5" />
              <Text className="text-lg font-black tracking-tight text-slate-900">
                UNIOSUN National Surveillance
              </Text>
            </View>
            <Text className="mt-0.5 text-xs font-semibold text-slate-500">
              Epidemic Decision Support • Geosmart Nigeria
            </Text>
          </View>

          {/* Export DHIS2 Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleExportDHIS2}
            className="flex-row items-center rounded-xl bg-indigo-600 px-3.5 py-2 shadow-sm">
            <FileSpreadsheet size={14} color="#FFFFFF" />
            <Text className="ml-1.5 text-xs font-bold text-white">DHIS2 Export</Text>
          </TouchableOpacity>
        </View>

        {/* National Benchmark Matrix (86 ALERT / 135 WARNING / 426 WATCH = 647) */}
        <View className="mt-3 flex-row gap-2">
          {/* ALERT */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedTier(selectedTier === 'ALERT' ? 'All' : 'ALERT')}
            className={`shadow-xs flex-1 rounded-2xl border p-2.5 ${
              selectedTier === 'ALERT'
                ? 'border-rose-400 bg-rose-500 text-white'
                : 'border-rose-200 bg-rose-50'
            }`}>
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-[10px] font-black uppercase tracking-wider ${
                  selectedTier === 'ALERT' ? 'text-white' : 'text-rose-800'
                }`}>
                ALERT
              </Text>
              <Flame size={14} color={selectedTier === 'ALERT' ? '#FFFFFF' : '#E11D48'} />
            </View>
            <Text
              className={`mt-1 text-xl font-black ${
                selectedTier === 'ALERT' ? 'text-white' : 'text-rose-950'
              }`}>
              {totalAlert}
            </Text>
            <Text
              className={`text-[9px] font-bold ${
                selectedTier === 'ALERT' ? 'text-rose-100' : 'text-rose-600'
              }`}>
              R Benchmark: 86
            </Text>
          </TouchableOpacity>

          {/* WARNING */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedTier(selectedTier === 'WARNING' ? 'All' : 'WARNING')}
            className={`shadow-xs flex-1 rounded-2xl border p-2.5 ${
              selectedTier === 'WARNING'
                ? 'border-amber-400 bg-amber-500 text-white'
                : 'border-amber-200 bg-amber-50'
            }`}>
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-[10px] font-black uppercase tracking-wider ${
                  selectedTier === 'WARNING' ? 'text-white' : 'text-amber-800'
                }`}>
                WARNING
              </Text>
              <AlertTriangle size={14} color={selectedTier === 'WARNING' ? '#FFFFFF' : '#D97706'} />
            </View>
            <Text
              className={`mt-1 text-xl font-black ${
                selectedTier === 'WARNING' ? 'text-white' : 'text-amber-950'
              }`}>
              {totalWarning}
            </Text>
            <Text
              className={`text-[9px] font-bold ${
                selectedTier === 'WARNING' ? 'text-amber-100' : 'text-amber-600'
              }`}>
              R Benchmark: 135
            </Text>
          </TouchableOpacity>

          {/* WATCH */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedTier(selectedTier === 'WATCH' ? 'All' : 'WATCH')}
            className={`shadow-xs flex-1 rounded-2xl border p-2.5 ${
              selectedTier === 'WATCH'
                ? 'border-blue-400 bg-blue-500 text-white'
                : 'border-blue-200 bg-blue-50'
            }`}>
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-[10px] font-black uppercase tracking-wider ${
                  selectedTier === 'WATCH' ? 'text-white' : 'text-blue-800'
                }`}>
                WATCH
              </Text>
              <Info size={14} color={selectedTier === 'WATCH' ? '#FFFFFF' : '#2563EB'} />
            </View>
            <Text
              className={`mt-1 text-xl font-black ${
                selectedTier === 'WATCH' ? 'text-white' : 'text-blue-950'
              }`}>
              {totalWatch}
            </Text>
            <Text
              className={`text-[9px] font-bold ${
                selectedTier === 'WATCH' ? 'text-blue-100' : 'text-blue-600'
              }`}>
              R Benchmark: 426
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mt-3 flex-row items-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5">
          <Search size={14} color="#64748B" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search state, LGA, or month (e.g. Osogbo, 2026-03)..."
            placeholderTextColor="#94A3B8"
            className="ml-2 flex-1 py-1 text-xs text-slate-800"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-xs font-bold text-slate-400">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* State Filter Pills */}
        <View className="mt-2.5 flex-row gap-1.5">
          {['All', 'Osun', 'Lagos', 'Kano'].map((st) => {
            const isSelected = selectedState === st;
            return (
              <TouchableOpacity
                key={st}
                activeOpacity={0.7}
                onPress={() => setSelectedState(st)}
                className={`rounded-full border px-3 py-1 ${
                  isSelected
                    ? 'shadow-xs border-indigo-600 bg-indigo-600'
                    : 'border-slate-200 bg-white'
                }`}>
                <Text
                  className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                  {st === 'All' ? 'All States (647)' : st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Alert Feed & State Summaries */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }>
        {/* State Surveillance Breakdown Cards */}
        <Text className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
          State Operational Matrices:
        </Text>
        <View className="mb-4 flex-row gap-2.5">
          {stateBreakdown.map((sb) => (
            <TouchableOpacity
              key={sb.state}
              activeOpacity={0.8}
              onPress={() => setSelectedState(selectedState === sb.state ? 'All' : sb.state)}
              className={`shadow-xs flex-1 rounded-2xl border bg-white p-3 ${
                selectedState === sb.state ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
              }`}>
              <Text className="text-xs font-black text-slate-900">{sb.state}</Text>
              <Text className="text-[10px] font-medium text-slate-500">{sb.total} alerts</Text>
              <View className="mt-2 flex-row gap-1">
                <View className="rounded bg-rose-100 px-1 py-0.5">
                  <Text className="text-[9px] font-extrabold text-rose-800">{sb.alert}</Text>
                </View>
                <View className="rounded bg-amber-100 px-1 py-0.5">
                  <Text className="text-[9px] font-extrabold text-amber-800">{sb.warning}</Text>
                </View>
                <View className="rounded bg-blue-100 px-1 py-0.5">
                  <Text className="text-[9px] font-extrabold text-blue-800">{sb.watch}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtered Alert Item List */}
        <Text className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
          Surveillance Alert Records ({filteredAlerts.length}):
        </Text>

        {isLoading ? (
          <AlertListSkeleton count={4} />
        ) : fetchError ? (
          <ErrorState
            title="National Backend Offline"
            message={fetchError}
            retryLabel="Retry Server"
            onRetry={() => {
              setIsLoading(true);
              setFetchError(null);
              setRefreshKey((k) => k + 1);
            }}
            secondaryActionLabel="Load Cached Benchmarks"
            onSecondaryAction={async () => {
              setIsLoading(true);
              setFetchError(null);
              const benchmarkData = await AlertsClientService.getAlerts({
                userRole: 'uniosun',
              });
              setAlerts(benchmarkData);
              setIsLoading(false);
              showToast.info(
                'Benchmark Data Loaded',
                'Displaying all 647 offline verified alerts.',
              );
            }}
          />
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            variant={searchQuery ? 'amber' : 'slate'}
            icon={<Search size={36} color={searchQuery ? '#D97706' : '#64748B'} />}
            title={
              searchQuery
                ? `No Matches for "${searchQuery}"`
                : 'No National Surveillance Records Found'
            }
            description={
              searchQuery
                ? `No LGA or state matched "${searchQuery}" under the selected tier (${selectedTier}). Try clearing your search keyword.`
                : 'Try adjusting your state filter or alert tier selection to view records.'
            }
            actionLabel="Reset Search & Filters"
            onAction={() => {
              setSelectedState('All');
              setSelectedTier('All');
              setSearchQuery('');
            }}
          />
        ) : (
          filteredAlerts.slice(0, 100).map((item) => {
            const isAlert = item.tier === 'ALERT';
            const isWarning = item.tier === 'WARNING';
            const riskColor = isAlert ? '#E11D48' : isWarning ? '#D97706' : '#2563EB';

            return (
              <View
                key={item.id}
                className={`shadow-xs mb-3 rounded-2xl border bg-white p-3.5 ${
                  isAlert ? 'border-rose-200' : isWarning ? 'border-amber-200' : 'border-slate-200'
                }`}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5">
                      <MapPin size={13} color={riskColor} />
                      <Text className="text-sm font-extrabold text-slate-900">
                        {item.lga} LGA • {item.state} State
                      </Text>
                    </View>
                    <Text className="mt-0.5 text-xs font-medium text-slate-500">
                      Period: {item.month} • ID: {item.id}
                    </Text>
                  </View>

                  <View
                    className={`rounded-full border px-2.5 py-0.5 ${
                      isAlert
                        ? 'border-rose-300 bg-rose-50'
                        : isWarning
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-blue-300 bg-blue-50'
                    }`}>
                    <Text
                      className={`text-[10px] font-black uppercase ${
                        isAlert ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                      {item.tier}
                    </Text>
                  </View>
                </View>

                {/* Metrics */}
                <View className="mt-2.5 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View>
                    <Text className="text-[10px] font-bold text-slate-500">Predicted Risk</Text>
                    <Text className="text-sm font-black text-slate-900">
                      {(item.mean_risk * 100).toFixed(1)}%
                    </Text>
                  </View>

                  <View
                    className={`rounded-lg px-2 py-1 ${
                      item.pyrethroid_resistance_flag ? 'bg-purple-100' : 'bg-slate-200/60'
                    }`}>
                    <Text
                      className={`text-[10px] font-bold ${
                        item.pyrethroid_resistance_flag ? 'text-purple-800' : 'text-slate-600'
                      }`}>
                      {item.pyrethroid_resistance_flag
                        ? 'Pyrethroid Resistant (<90%)'
                        : 'Susceptible'}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-[10px] font-bold text-slate-500">Status</Text>
                    <Text
                      className={`text-[11px] font-bold ${
                        item.acknowledged ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                      {item.acknowledged ? '✓ Logged' : 'Unacknowledged'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* DHIS2 Export Modal */}
      <Modal visible={dhis2ModalOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-slate-950/70 px-4">
          <View
            style={{ maxHeight: '85%' }}
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <View className="flex-row items-center gap-2">
                <FileSpreadsheet size={20} color="#4F46E5" />
                <View>
                  <Text className="text-base font-black text-slate-900">
                    DHIS2 Aggregate Data Payload
                  </Text>
                  <Text className="text-[11px] text-slate-500">
                    National HMIS / Federal Ministry of Health Export
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCopyClipboard}
                className="flex-row items-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5">
                {hasCopied ? (
                  <Check size={13} color="#4F46E5" />
                ) : (
                  <Copy size={13} color="#4F46E5" />
                )}
                <Text className="ml-1 text-xs font-bold text-indigo-700">
                  {hasCopied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-3 rounded-2xl bg-slate-900 p-3.5">
              <Text className="font-mono text-[11px] leading-relaxed text-emerald-400">
                {dhis2Json}
              </Text>
            </ScrollView>

            <View className="mt-4 flex-row gap-2">
              <TouchableOpacity
                onPress={() => setDhis2ModalOpen(false)}
                className="flex-1 items-center rounded-xl bg-slate-900 py-3">
                <Text className="text-xs font-bold text-white">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
