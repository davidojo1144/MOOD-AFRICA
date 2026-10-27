import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export function VecdimView() {
  const { currentUser } = useRecordsStore();
  const state: StateName = currentUser.state ?? 'Osun';

  const [alerts, setAlerts] = useState<AlertTierItem[]>([]);
  const [selectedLga, setSelectedLga] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      state,
      lga: selectedLga !== 'All' ? selectedLga : undefined,
    })
      .then((data) => {
        if (isMounted) {
          setAlerts(data);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error(e);
        if (isMounted) setIsLoading(false);
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
  };

  const handleAcknowledge = async () => {
    if (!ackModalItem) return;
    setIsSubmittingAck(true);
    await AlertsClientService.acknowledgeAlert(ackModalItem.id, currentUser.user_id, ackNotes);
    setIsSubmittingAck(false);
    setAckModalItem(null);
    setAckNotes('');
    Alert.alert(
      'Alert Acknowledged',
      `Action logged for ${ackModalItem.lga} (${ackModalItem.month}).`,
    );
    setRefreshKey((k) => k + 1);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="border-b border-border bg-surface px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-foreground">
              VECDIM State Surveillance ({state})
            </Text>
            <Text className="text-xs text-muted">
              State-level early warning alerts • Role: {currentUser.role}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setRefreshKey((k) => k + 1)}
            className="rounded-lg border border-border bg-background px-3 py-1.5">
            <Text className="text-xs font-semibold text-foreground">Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Tier Count Pills */}
        <View className="mt-3 flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSelectedTier(selectedTier === 'ALERT' ? 'All' : 'ALERT')}
            className={`flex-1 rounded-xl border p-2.5 ${
              selectedTier === 'ALERT'
                ? 'border-rose-400 bg-rose-100'
                : 'border-rose-200 bg-rose-50'
            }`}>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
              ALERT
            </Text>
            <Text className="text-lg font-bold text-rose-950">{tierSummary.ALERT}</Text>
            <Text className="text-[10px] text-rose-700">Risk ≥ 0.70</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTier(selectedTier === 'WARNING' ? 'All' : 'WARNING')}
            className={`flex-1 rounded-xl border p-2.5 ${
              selectedTier === 'WARNING'
                ? 'border-amber-400 bg-amber-100'
                : 'border-amber-200 bg-amber-50'
            }`}>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              WARNING
            </Text>
            <Text className="text-lg font-bold text-amber-950">{tierSummary.WARNING}</Text>
            <Text className="text-[10px] text-amber-700">0.50 – 0.69</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTier(selectedTier === 'WATCH' ? 'All' : 'WATCH')}
            className={`flex-1 rounded-xl border p-2.5 ${
              selectedTier === 'WATCH'
                ? 'border-blue-400 bg-blue-100'
                : 'border-blue-200 bg-blue-50'
            }`}>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
              WATCH
            </Text>
            <Text className="text-lg font-bold text-blue-950">{tierSummary.WATCH}</Text>
            <Text className="text-[10px] text-blue-700">Risk &lt; 0.50</Text>
          </TouchableOpacity>
        </View>

        {/* LGA Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 flex-row">
          <TouchableOpacity
            onPress={() => setSelectedLga('All')}
            className={`mr-1.5 rounded-lg border px-3 py-1 ${
              selectedLga === 'All' ? 'border-primary bg-primary' : 'border-border bg-surface'
            }`}>
            <Text
              className={`text-xs ${
                selectedLga === 'All' ? 'font-bold text-white' : 'text-muted'
              }`}>
              All LGAs
            </Text>
          </TouchableOpacity>

          {STATE_LGAS[state].map((lgaItem) => (
            <TouchableOpacity
              key={lgaItem}
              onPress={() => setSelectedLga(lgaItem)}
              className={`mr-1.5 rounded-lg border px-3 py-1 ${
                selectedLga === lgaItem ? 'border-primary bg-primary' : 'border-border bg-surface'
              }`}>
              <Text
                className={`text-xs ${
                  selectedLga === lgaItem ? 'font-bold text-white' : 'text-foreground'
                }`}>
                {lgaItem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Alert Feed */}
      <ScrollView className="flex-1 p-4">
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#E2582B" />
            <Text className="mt-2 text-xs text-muted">Loading state alerts...</Text>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View className="items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8">
            <Text className="text-2xl">🔍</Text>
            <Text className="mt-2 font-bold text-foreground">No alerts match filters</Text>
            <Text className="text-xs text-muted">Change LGA or Tier filter above.</Text>
          </View>
        ) : (
          filteredAlerts.map((item) => {
            const isAlert = item.tier === 'ALERT';
            const isWarning = item.tier === 'WARNING';

            const tierBg = isAlert
              ? 'border-rose-300 bg-rose-50/50'
              : isWarning
                ? 'border-amber-300 bg-amber-50/50'
                : 'border-blue-200 bg-blue-50/30';

            const tierBadge = isAlert
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : isWarning
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-blue-100 text-blue-800 border-blue-200';

            return (
              <View
                key={item.id}
                className={`mb-3 rounded-2xl border bg-surface p-4 shadow-sm ${tierBg}`}>
                {/* Header */}
                <View className="flex-row items-start justify-between">
                  <View>
                    <Text className="text-base font-bold text-foreground">{item.lga}</Text>
                    <Text className="text-xs text-muted">
                      Month: {item.month} • {item.n_records} surveillance records
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    {/* Tier badge */}
                    <View className={`rounded-full border px-2.5 py-0.5 ${tierBadge}`}>
                      <Text className="text-[10px] font-bold uppercase">{item.tier}</Text>
                    </View>
                  </View>
                </View>

                {/* Metrics Row */}
                <View className="mt-3 flex-row items-center justify-between rounded-xl border border-border bg-background p-2.5">
                  <View>
                    <Text className="text-[10px] font-bold uppercase text-muted">
                      Predicted Risk Score
                    </Text>
                    <Text className="text-lg font-bold text-foreground">
                      {(item.mean_risk * 100).toFixed(1)}%
                    </Text>
                  </View>

                  {/* Resistance Flag shown SEPARATELY from Tier */}
                  <View className="items-end">
                    <Text className="text-[10px] font-bold uppercase text-muted">
                      Pyrethroid Resistance
                    </Text>
                    <View
                      className={`mt-0.5 rounded-md border px-2 py-0.5 ${
                        item.pyrethroid_resistance_flag
                          ? 'border-rose-300 bg-rose-100'
                          : 'border-emerald-300 bg-emerald-100'
                      }`}>
                      <Text
                        className={`text-[10px] font-bold ${
                          item.pyrethroid_resistance_flag ? 'text-rose-800' : 'text-emerald-800'
                        }`}>
                        {item.pyrethroid_resistance_flag
                          ? 'Resistance Flagged (<90% mort)'
                          : 'Susceptible (≥90% mort)'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Acknowledgment & Action Tracking */}
                <View className="mt-2.5 flex-row items-center justify-between">
                  {item.acknowledged ? (
                    <View className="flex-row items-center">
                      <Text className="text-xs font-bold text-emerald-700">
                        ✓ Acknowledged by {item.acknowledged_by || 'Supervisor'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setAckModalItem(item)}
                      className="rounded-lg bg-primary px-3 py-1.5 shadow-sm">
                      <Text className="text-xs font-bold text-white">
                        Acknowledge & Dispatch Team
                      </Text>
                    </TouchableOpacity>
                  )}

                  <Text className="font-mono text-[11px] text-muted">ID: {item.id}</Text>
                </View>

                {item.notes ? (
                  <View className="mt-2 rounded border border-border bg-surface p-2">
                    <Text className="text-xs italic text-muted">Notes: {item.notes}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Acknowledgment Modal */}
      <Modal visible={Boolean(ackModalItem)} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <Text className="text-base font-bold text-foreground">
              Acknowledge Alert: {ackModalItem?.lga} ({ackModalItem?.month})
            </Text>
            <Text className="mt-1 text-xs text-muted">
              Target: 80% of alerts acknowledged within 48 hours for rapid intervention response.
            </Text>

            <Text className="mt-3 text-xs font-semibold text-muted">Action Notes</Text>
            <TextInput
              value={ackNotes}
              onChangeText={setAckNotes}
              placeholder="e.g. Field team dispatched for larval source management"
              className="mt-1 rounded-xl border border-border bg-background p-3 text-sm text-foreground"
              multiline
              numberOfLines={3}
            />

            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setAckModalItem(null)}
                className="flex-1 items-center rounded-xl border border-border py-2.5">
                <Text className="text-xs font-semibold text-muted">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAcknowledge}
                disabled={isSubmittingAck}
                className="flex-1 items-center rounded-xl bg-primary py-2.5 shadow-sm">
                {isSubmittingAck ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-xs font-bold text-white">Confirm Action</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
