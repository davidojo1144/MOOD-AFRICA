import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecordsStore } from '@/store/recordsStore';
import { RoleSwitcher } from '@/components/common/RoleSwitcher';
import { Activity, ClipboardList, ShieldAlert, Building2 } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';
import { showToast } from '@/lib/toast';

export default function TabLayout() {
  const { records, isOfflineMode, toggleOfflineMode } = useRecordsStore();

  const pendingCount = records.filter((r) => r.status === 'pending_sync').length;

  return (
    <Tabs
      screenOptions={{
        header: () => (
          <SafeAreaView style={{ backgroundColor: '#FFFFFF' }} edges={['top']}>
            <View className="shadow-xs border-b border-slate-200 bg-white px-4 py-3">
              <View className="flex-row items-center justify-between">
                {/* Logo & Lab Branding */}
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
                    <Activity size={18} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-base font-black tracking-tight text-slate-900">
                        VECDIM
                      </Text>
                      <View className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5">
                        <Text className="text-[9px] font-extrabold uppercase text-slate-700">
                          UNIOSUN
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[10px] font-medium text-slate-500">
                      Vector Surveillance & EWS
                    </Text>
                  </View>
                </View>

                {/* Right Header: Role Switcher & Airplane Simulator */}
                <RoleSwitcher
                  isOfflineMode={isOfflineMode}
                  onToggleOfflineMode={() => {
                    toggleOfflineMode();
                    haptics.medium();
                    if (!isOfflineMode) {
                      showToast.info(
                        'Airplane / Offline Mode',
                        'Simulating zero-connectivity field conditions.',
                      );
                    } else {
                      showToast.success('Online Mode', 'Connected to VECDIM backend.');
                    }
                  }}
                />
              </View>
            </View>
          </SafeAreaView>
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}>
      {/* Tab 1: Field Capture */}
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: () => haptics.light(),
        }}
        options={{
          title: 'Field Capture',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <ClipboardList size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      {/* Tab 2: VECDIM State */}
      <Tabs.Screen
        name="vecdim"
        listeners={{
          tabPress: () => haptics.light(),
        }}
        options={{
          title: 'VECDIM (State)',
          tabBarIcon: ({ color, focused }) => (
            <ShieldAlert size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      {/* Tab 3: UNIOSUN National */}
      <Tabs.Screen
        name="uniosun"
        listeners={{
          tabPress: () => haptics.light(),
        }}
        options={{
          title: 'UNIOSUN (National)',
          tabBarIcon: ({ color, focused }) => (
            <Building2 size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
