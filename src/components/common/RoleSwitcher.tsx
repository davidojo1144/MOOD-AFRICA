import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { DEMO_USERS } from '@/services/auth/demoUsers';
import { UserProfile } from '@/types/vecdim';
import { useRecordsStore } from '@/store/recordsStore';
import { User, Shield, Building2, Check, Wifi, WifiOff, ChevronDown } from 'lucide-react-native';

interface RoleSwitcherProps {
  isOfflineMode?: boolean;
  onToggleOfflineMode?: () => void;
  compact?: boolean;
}

export function RoleSwitcher({ isOfflineMode, onToggleOfflineMode }: RoleSwitcherProps) {
  const { currentUser, setCurrentUser } = useRecordsStore();
  const [modalVisible, setModalVisible] = useState(false);

  const renderRoleIcon = (role: string, size = 16, color = '#475569') => {
    switch (role) {
      case 'uniosun':
        return <Building2 size={size} color={color} />;
      case 'vecdim':
        return <Shield size={size} color={color} />;
      default:
        return <User size={size} color={color} />;
    }
  };

  const getRoleTheme = (role: string) => {
    switch (role) {
      case 'uniosun':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          badgeBg: 'bg-indigo-600',
          badgeText: 'text-white',
        };
      case 'vecdim':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badgeBg: 'bg-blue-600',
          badgeText: 'text-white',
        };
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          badgeBg: 'bg-emerald-600',
          badgeText: 'text-white',
        };
    }
  };

  const currentTheme = getRoleTheme(currentUser.role);

  return (
    <>
      {/* Compact Top Header Bar Component */}
      <View className="flex-row items-center gap-2">
        {/* Network Status Toggle Pill */}
        {onToggleOfflineMode && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onToggleOfflineMode}
            className={`flex-row items-center rounded-full border px-2.5 py-1.5 ${
              isOfflineMode ? 'border-amber-400 bg-amber-50' : 'border-emerald-300 bg-emerald-50'
            }`}>
            {isOfflineMode ? (
              <WifiOff size={13} color="#D97706" />
            ) : (
              <Wifi size={13} color="#059669" />
            )}
            <Text
              className={`ml-1 text-[11px] font-bold ${
                isOfflineMode ? 'text-amber-800' : 'text-emerald-800'
              }`}>
              {isOfflineMode ? 'Airplane' : 'Online'}
            </Text>
          </TouchableOpacity>
        )}

        {/* User Profile / Role Switcher Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
          className={`flex-row items-center rounded-full border px-2.5 py-1.5 ${currentTheme.bg} ${currentTheme.border}`}>
          <View className="mr-1.5 h-5 w-5 items-center justify-center rounded-full bg-slate-900">
            <Text className="text-[10px] font-extrabold text-white">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </Text>
          </View>
          <View className="mr-1">
            <Text className="text-[11px] font-bold text-slate-800" numberOfLines={1}>
              {currentUser.name.split(' ')[0]}
            </Text>
          </View>
          <View className={`rounded-full px-1.5 py-0.5 ${currentTheme.badgeBg}`}>
            <Text
              className={`text-[9px] font-extrabold uppercase tracking-wide ${currentTheme.badgeText}`}>
              {currentUser.role}
            </Text>
          </View>
          <ChevronDown size={12} color="#64748B" style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>

      {/* Role Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
          className="flex-1 items-center justify-center px-4">
          <View
            style={{ maxHeight: '85%' }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {/* Modal Header */}
            <View className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-extrabold text-slate-900">
                    Switch Benchmark User
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Select a persona to test role-based capabilities
                  </Text>
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                  {renderRoleIcon(currentUser.role, 16, '#0F172A')}
                </View>
              </View>
            </View>

            {/* User List */}
            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              <View className="gap-2.5">
                {DEMO_USERS.map((user: UserProfile) => {
                  const isSelected = user.user_id === currentUser.user_id;
                  const itemTheme = getRoleTheme(user.role);

                  return (
                    <TouchableOpacity
                      key={user.user_id}
                      activeOpacity={0.7}
                      onPress={() => {
                        void setCurrentUser(user);
                        setModalVisible(false);
                      }}
                      className={`flex-row items-center justify-between rounded-2xl border p-3.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                      }`}>
                      <View className="flex-1 flex-row items-center pr-2">
                        <View
                          className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
                            isSelected ? 'bg-emerald-600' : 'bg-slate-100'
                          }`}>
                          {renderRoleIcon(user.role, 18, isSelected ? '#FFFFFF' : '#475569')}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              className={`text-sm font-bold ${
                                isSelected ? 'text-emerald-950' : 'text-slate-800'
                              }`}>
                              {user.name}
                            </Text>
                            {isSelected && (
                              <View className="rounded-full bg-emerald-100 px-1.5 py-0.5">
                                <Text className="text-[9px] font-bold text-emerald-800">
                                  ACTIVE
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-xs text-slate-500">
                            ID: {user.user_id} •{' '}
                            {user.state ? `${user.state} State` : 'National Office'}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end gap-1">
                        <View className={`rounded-full px-2 py-0.5 ${itemTheme.badgeBg}`}>
                          <Text
                            className={`text-[9px] font-extrabold uppercase ${itemTheme.badgeText}`}>
                            {user.role}
                          </Text>
                        </View>
                        {isSelected && <Check size={14} color="#059669" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View className="border-t border-slate-100 bg-slate-50 px-5 py-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="items-center rounded-xl bg-slate-900 py-3">
                <Text className="text-xs font-bold text-white">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
