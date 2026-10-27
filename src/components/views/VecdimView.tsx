import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTierItem, StateName } from '@/types/vecdim';
import { useRecordsStore } from '@/store/recordsStore';
import { STATE_LGAS } from '@/services/validation/constants';
import { AlertsClientService } from '@/services/api/alertsService';
import { haptics } from '@/lib/haptics';
import { showToast } from '@/lib/toast';
import { AlertListSkeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/FeedbackStates';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Calendar,
  Flame,
  ShieldCheck,
} from 'lucide-react-native';

export function VecdimView() {
  const { currentUser } = useRecordsStore();
  const state: StateName = currentUser.state ?? 'Osun';

  const [alerts, setAlerts] = useState<AlertTierItem[]>([]);
  const [selectedLga, setSelectedLga] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Acknowledgment Modal
  const [ackModalItem, setAckModalItem] = useState<AlertTierItem | null>(null);
  const [ackNotes, setAckNotes] = useState<string>('');
  const [isSubmittingAck, setIsSubmittingAck] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    AlertsClientService.getAlerts({
      userRole: 'vecdim',
      userState: state,
      lga: selectedLga !== 'All' ? selectedLga : undefined,
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
          setFetchError('Unable to load state early warning alerts from server.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [state, selectedLga, refreshKey]);

  const filteredAlerts = alerts.filter((a) => {
    if (selectedTier !== 'All' && a.tier !== selectedTier) return false;
    return true;
  });

  const tierSummary = {
    ALERT: alerts.filter((a) => a.tier === 'ALERT').length,
    WARNING: alerts.filter((a) => a.tier === 'WARNING').length,
    WATCH: alerts.filter((a) => a.tier === 'WATCH').length,
    RESISTANT: alerts.filter((a) => a.pyrethroid_resistance_flag).length,
    ACKNOWLEDGED: alerts.filter((a) => a.acknowledged).length,
  };

  const handleAcknowledge = async () => {
    if (!ackModalItem) return;
    setIsSubmittingAck(true);
    await AlertsClientService.acknowledgeAlert(ackModalItem.id, currentUser.user_id, ackNotes);
    setIsSubmittingAck(false);
    setAckModalItem(null);
    setAckNotes('');
    haptics.success();
    showToast.success(
      'Alert Acknowledged',
      `Action logged for ${ackModalItem.lga} (${ackModalItem.month}).`,
    );
    setRefreshKey((k) => k + 1);
  };

  const lgaList = ['All', ...(STATE_LGAS[state] ?? [])];

  const quickActionNotes = [
    'Vector spraying team dispatched',
    'Larviciding intervention scheduled',
    'ITN distribution surge requested',
    'Verified via local health authority',
  ];

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-slate-50">
      {/* Top Command Header */}
      <View className="shadow-xs border-b border-slate-200 bg-white px-4 pb-3 pt-3.5">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-1.5">
              <ShieldAlert size={18} color="#2563EB" />
              <Text className="text-lg font-black tracking-tight text-slate-900">
                {state} State Surveillance
              </Text>
            </View>
            <Text className="mt-0.5 text-xs font-semibold text-slate-500">
              Epidemic Early Warning Feed • Officer: {currentUser.name}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRefreshKey((k) => k + 1)}
            className="shadow-xs flex-row items-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5">
            <RefreshCw size={13} color="#475569" />
            <Text className="ml-1.5 text-xs font-bold text-slate-700">Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Tier Count Pills */}
        <View className="mt-3 flex-row gap-2">
          {/* ALERT */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedTier(selectedTier === 'ALERT' ? 'All' : 'ALERT')}
            className={`shadow-xs flex-1 rounded-2xl border p-2.5 ${
              selectedTier === 'ALERT'
                ? 'border-rose-400 bg-rose-500 text-white'
                : 'border-rose-200 bg-rose-50/70'
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
              {tierSummary.ALERT}
            </Text>
            <Text
              className={`text-[9px] font-bold ${
                selectedTier === 'ALERT' ? 'text-rose-100' : 'text-rose-600'
              }`}>
              Risk ≥ 0.70
            </Text>
          </TouchableOpacity>

          {/* WARNING */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedTier(selectedTier === 'WARNING' ? 'All' : 'WARNING')}
            className={`shadow-xs flex-1 rounded-2xl border p-2.5 ${
              selectedTier === 'WARNING'
                ? 'border-amber-400 bg-amber-500 text-white'
                : 'border-amber-200 bg-amber-50/70'
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
              {tierSummary.WARNING}
            </Text>
            <Text
              className={`text-[9px] font-bold ${
                selectedTier === 'WARNING' ? 'text-amber-100' : 'text-amber-600'
              }`}>
              0.50 – 0.69
            </Text>
          </TouchableOpacity>

          {/* WATCH */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedTier(selectedTier === 'WATCH' ? 'All' : 'WATCH')}
            className={`shadow-xs flex-1 rounded-2xl border p-2.5 ${
              selectedTier === 'WATCH'
                ? 'border-blue-400 bg-blue-500 text-white'
                : 'border-blue-200 bg-blue-50/70'
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
              {tierSummary.WATCH}
            </Text>
            <Text
              className={`text-[9px] font-bold ${
                selectedTier === 'WATCH' ? 'text-blue-100' : 'text-blue-600'
              }`}>
              Risk &lt; 0.50
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resistance Flag Banner Callout */}
        <View className="mt-2.5 flex-row items-center justify-between rounded-xl border border-purple-200 bg-purple-50/60 px-3 py-1.5">
          <View className="flex-row items-center gap-1.5">
            <ShieldCheck size={14} color="#7E22CE" />
            <Text className="text-xs font-bold text-purple-900">
              Pyrethroid Resistance Flag: {tierSummary.RESISTANT} wards
            </Text>
          </View>
          <Text className="text-[10px] font-bold text-purple-700">
            {tierSummary.ACKNOWLEDGED}/{alerts.length} Acknowledged
          </Text>
        </View>

        {/* LGA Filter Carousel */}
        <View className="mt-2.5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-0.5">
            <View className="flex-row gap-1.5">
              {lgaList.map((lga) => {
                const isSelected = selectedLga === lga;
                return (
                  <TouchableOpacity
                    key={lga}
                    activeOpacity={0.7}
                    onPress={() => setSelectedLga(lga)}
                    className={`rounded-full border px-3 py-1 ${
                      isSelected ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-slate-600'
                      }`}>
                      {lga}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Main Alert Feed */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <AlertListSkeleton count={4} />
        ) : fetchError ? (
          <ErrorState
            title="Unable to Load Alerts"
            message={fetchError}
            onRetry={() => {
              setIsLoading(true);
              setFetchError(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={36} color="#059669" />}
            title="No Alerts Found"
            description={`No early warning alerts matching ${selectedTier !== 'All' ? selectedTier : 'the active'} filters for ${state} State.`}
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedLga('All');
              setSelectedTier('All');
            }}
          />
        ) : (
          filteredAlerts.map((item) => {
            const isAlert = item.tier === 'ALERT';
            const isWarning = item.tier === 'WARNING';
            const riskColor = isAlert ? '#E11D48' : isWarning ? '#D97706' : '#2563EB';

            return (
              <View
                key={item.id}
                className={`shadow-xs mb-3.5 rounded-2xl border bg-white p-4 ${
                  isAlert ? 'border-rose-200' : isWarning ? 'border-amber-200' : 'border-slate-200'
                }`}>
                {/* Header: LGA, Month, Tier */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5">
                      <MapPin size={14} color={riskColor} />
                      <Text className="text-sm font-extrabold text-slate-900">{item.lga} LGA</Text>
                    </View>
                    <View className="mt-0.5 flex-row items-center gap-1.5">
                      <Calendar size={12} color="#64748B" />
                      <Text className="text-xs font-medium text-slate-500">
                        Period: {item.month} • {item.state} State
                      </Text>
                    </View>
                  </View>

                  {/* Tier Chip */}
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

                {/* Risk Probability & Pyrethroid Indicator */}
                <View className="mt-3 flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Random Forest Risk
                    </Text>
                    <View className="mt-0.5 flex-row items-baseline gap-1">
                      <Text className="text-base font-black text-slate-900">
                        {(item.mean_risk * 100).toFixed(1)}%
                      </Text>
                      <Text className="text-[10px] text-slate-500">probability</Text>
                    </View>
                  </View>

                  {/* Pyrethroid Resistance Flag (Separated from risk tier) */}
                  <View
                    className={`rounded-xl border px-3 py-1.5 ${
                      item.pyrethroid_resistance_flag
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-slate-200 bg-white'
                    }`}>
                    <Text className="text-[9px] font-black uppercase text-purple-900">
                      Resistance Flag
                    </Text>
                    <Text
                      className={`text-[11px] font-bold ${
                        item.pyrethroid_resistance_flag ? 'text-purple-700' : 'text-slate-400'
                      }`}>
                      {item.pyrethroid_resistance_flag
                        ? 'Bioassay < 90% (Resistant)'
                        : 'Susceptible'}
                    </Text>
                  </View>
                </View>

                {/* Acknowledgment Status & Action */}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-1 pr-2">
                    {item.acknowledged ? (
                      <View>
                        <View className="flex-row items-center gap-1">
                          <CheckCircle2 size={13} color="#059669" />
                          <Text className="text-xs font-bold text-emerald-800">
                            Acknowledged by {item.acknowledged_by}
                          </Text>
                        </View>
                        {item.notes && (
                          <Text
                            className="mt-0.5 text-[11px] italic text-slate-600"
                            numberOfLines={1}>
                            {`"${item.notes}"`}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text className="text-xs font-bold text-amber-700">Pending State Action</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setAckModalItem(item);
                      setAckNotes(item.notes ?? '');
                    }}
                    className={`shadow-xs rounded-xl px-3 py-1.5 ${
                      item.acknowledged ? 'border border-slate-200 bg-slate-100' : 'bg-blue-600'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        item.acknowledged ? 'text-slate-700' : 'text-white'
                      }`}>
                      {item.acknowledged ? 'Update Note' : 'Acknowledge'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Acknowledgment Modal */}
      <Modal visible={!!ackModalItem} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-slate-950/70 px-4">
          <View className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <View className="mb-1 flex-row items-center gap-2">
              <ShieldAlert size={20} color="#2563EB" />
              <Text className="text-lg font-black text-slate-900">Acknowledge Alert</Text>
            </View>
            <Text className="text-xs text-slate-500">
              Log operational action for {ackModalItem?.lga} LGA ({ackModalItem?.month}).
            </Text>

            {/* Quick Action Presets */}
            <Text className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Action Presets:
            </Text>
            <View className="mt-1.5 flex-row flex-wrap gap-1.5">
              {quickActionNotes.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  activeOpacity={0.7}
                  onPress={() => setAckNotes(preset)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                  <Text className="text-[11px] font-medium text-slate-700">{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Notes Input */}
            <Text className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Action Notes:
            </Text>
            <TextInput
              value={ackNotes}
              onChangeText={setAckNotes}
              placeholder="e.g. Field spraying team dispatched to wards..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              className="text-top mt-1.5 min-h-[75px] rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900"
            />

            {/* Buttons */}
            <View className="mt-5 flex-row gap-2.5">
              <TouchableOpacity
                onPress={() => setAckModalItem(null)}
                className="flex-1 items-center rounded-xl border border-slate-200 bg-slate-100 py-3">
                <Text className="text-xs font-bold text-slate-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAcknowledge}
                disabled={isSubmittingAck}
                className="flex-1 items-center justify-center rounded-xl bg-blue-600 py-3 shadow-sm">
                {isSubmittingAck ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-bold text-white">Save Action</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
