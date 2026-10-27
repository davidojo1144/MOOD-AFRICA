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
import { AlertTierItem } from '@/types/vecdim';
import { AlertsClientService } from '@/services/api/alertsService';

export function UniosunView() {
  const [alerts, setAlerts] = useState<AlertTierItem[]>([]);
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dhis2ModalOpen, setDhis2ModalOpen] = useState<boolean>(false);
  const [dhis2Json, setDhis2Json] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    AlertsClientService.getAlerts({
      userRole: 'uniosun',
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
  }, []);

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
      dataValues: filteredAlerts.slice(0, 15).map((a) => ({
        dataElement: 'MALARIA_EARLY_WARNING_TIER',
        period: a.month.replace('-', ''),
        orgUnit: `NG_${a.state}_${a.lga}`,
        value: a.tier,
        comment: `Risk: ${(a.mean_risk * 100).toFixed(1)}%, Resistance: ${
          a.pyrethroid_resistance_flag ? 'Positive' : 'Negative'
        }`,
      })),
    };
    setDhis2Json(JSON.stringify(payload, null, 2));
    setDhis2ModalOpen(true);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top Banner */}
      <View className="border-b border-border bg-surface px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-foreground">
              UNIOSUN National Surveillance
            </Text>
            <Text className="text-xs text-muted">National Decision Support & EWS • All States</Text>
          </View>

          <TouchableOpacity
            onPress={handleExportDHIS2}
            className="rounded-lg bg-secondary px-3 py-1.5 shadow-sm">
            <Text className="text-xs font-bold text-white">DHIS2 Export</Text>
          </TouchableOpacity>
        </View>

        {/* National Benchmark Counters (Exactly matching R output: 86 / 135 / 426 = 647) */}
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
            <Text className="text-xl font-extrabold text-rose-950">{totalAlert}</Text>
            <Text className="text-[10px] text-rose-700">R Benchmark: 86</Text>
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
            <Text className="text-xl font-extrabold text-amber-950">{totalWarning}</Text>
            <Text className="text-[10px] text-amber-700">R Benchmark: 135</Text>
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
            <Text className="text-xl font-extrabold text-blue-950">{totalWatch}</Text>
            <Text className="text-[10px] text-blue-700">R Benchmark: 426</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedTier('All');
              setSelectedState('All');
            }}
            className={`flex-1 rounded-xl border p-2.5 ${
              selectedTier === 'All' && selectedState === 'All'
                ? 'border-purple-400 bg-purple-100'
                : 'border-purple-200 bg-purple-50'
            }`}>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
              TOTAL
            </Text>
            <Text className="text-xl font-extrabold text-purple-950">{alerts.length}</Text>
            <Text className="text-[10px] text-purple-700">Target: 647</Text>
          </TouchableOpacity>
        </View>

        {/* State Breakdown Bar */}
        <View className="mt-3 flex-row gap-2">
          {stateBreakdown.map((sb) => (
            <TouchableOpacity
              key={sb.state}
              onPress={() => setSelectedState(selectedState === sb.state ? 'All' : sb.state)}
              className={`flex-1 rounded-lg border p-2 ${
                selectedState === sb.state
                  ? 'border-primary bg-primary-50'
                  : 'border-border bg-background'
              }`}>
              <Text className="text-xs font-bold text-foreground">{sb.state}</Text>
              <Text className="text-[10px] text-muted">
                {sb.alert} Alert • {sb.warning} Warn
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search input */}
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter by LGA, state, or month (e.g. 2026-06)..."
          className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
        />
      </View>

      {/* Alert Feed */}
      <ScrollView className="flex-1 p-4">
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#E2582B" />
            <Text className="mt-2 text-xs text-muted">Loading national alerts...</Text>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View className="items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8">
            <Text className="text-2xl">📋</Text>
            <Text className="mt-2 font-bold text-foreground">No records matched</Text>
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
                <View className="flex-row items-start justify-between">
                  <View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-base font-bold text-foreground">{item.lga}</Text>
                      <Text className="text-xs text-muted">({item.state})</Text>
                    </View>
                    <Text className="text-xs text-muted">
                      Month: {item.month} • {item.n_records} survey records
                    </Text>
                  </View>

                  <View className={`rounded-full border px-2.5 py-0.5 ${tierBadge}`}>
                    <Text className="text-[10px] font-bold uppercase">{item.tier}</Text>
                  </View>
                </View>

                {/* Score & Pyrethroid Flag */}
                <View className="mt-2.5 flex-row items-center justify-between rounded-xl border border-border bg-background p-2.5">
                  <View>
                    <Text className="text-[10px] font-bold uppercase text-muted">
                      Mean Predicted Risk
                    </Text>
                    <Text className="text-base font-bold text-foreground">
                      {(item.mean_risk * 100).toFixed(1)}%
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-[10px] font-bold uppercase text-muted">
                      Pyrethroid Resistance
                    </Text>
                    <View
                      className={`mt-0.5 rounded border px-2 py-0.5 ${
                        item.pyrethroid_resistance_flag
                          ? 'border-rose-300 bg-rose-100'
                          : 'border-emerald-300 bg-emerald-100'
                      }`}>
                      <Text
                        className={`text-[10px] font-bold ${
                          item.pyrethroid_resistance_flag ? 'text-rose-800' : 'text-emerald-800'
                        }`}>
                        {item.pyrethroid_resistance_flag ? 'Flagged' : 'Susceptible'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-2 flex-row justify-between text-[11px]">
                  <Text className="font-mono text-[11px] text-muted">{item.id}</Text>
                  {item.acknowledged ? (
                    <Text className="text-[11px] font-bold text-emerald-700">
                      ✓ Acknowledged ({item.acknowledged_by})
                    </Text>
                  ) : (
                    <Text className="text-[11px] italic text-muted">Pending Review</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* DHIS2 Export Modal */}
      <Modal visible={dhis2ModalOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="max-h-[80%] w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <Text className="text-base font-bold text-foreground">DHIS2 dataValueSets Export</Text>
            <Text className="mt-1 text-xs text-muted">
              Standard DHIS2 surveillance integration payload
            </Text>

            <ScrollView className="mt-3 max-h-80 rounded-xl border border-border bg-background p-3">
              <Text className="font-mono text-xs text-foreground">{dhis2Json}</Text>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setDhis2ModalOpen(false)}
              className="mt-4 items-center rounded-xl bg-primary py-2.5">
              <Text className="text-xs font-bold text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
