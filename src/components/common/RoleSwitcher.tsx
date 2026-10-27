import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { DEMO_USERS } from '@/services/auth/demoUsers';
import { UserProfile } from '@/types/vecdim';
import { useRecordsStore } from '@/store/recordsStore';

interface RoleSwitcherProps {
  isOfflineMode?: boolean;
  onToggleOfflineMode?: () => void;
}

export function RoleSwitcher({ isOfflineMode, onToggleOfflineMode }: RoleSwitcherProps) {
  const { currentUser, setCurrentUser } = useRecordsStore();
  const [modalVisible, setModalVisible] = useState(false);

  const roleBadgeColor =
    currentUser.role === 'uniosun'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : currentUser.role === 'vecdim'
        ? 'bg-blue-100 text-blue-800 border-blue-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <View className="border-b border-border bg-surface px-4 py-2.5">
      <View className="flex-row items-center justify-between">
        {/* User Role Selector Pill */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="flex-row items-center rounded-lg border border-border bg-background px-3 py-1.5">
          <View className="mr-2">
            <Text className="text-[10px] font-bold uppercase text-muted">Active User:</Text>
            <Text className="text-xs font-bold text-foreground">{currentUser.name}</Text>
          </View>
          <View className={`rounded border px-1.5 py-0.5 ${roleBadgeColor}`}>
            <Text className="text-[10px] font-bold uppercase">{currentUser.role}</Text>
          </View>
        </TouchableOpacity>

        {/* Offline Simulator Toggle */}
        {onToggleOfflineMode && (
          <TouchableOpacity
            onPress={onToggleOfflineMode}
            className={`rounded-lg border px-2.5 py-1.5 ${
              isOfflineMode ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'
            }`}>
            <View className="flex-row items-center">
              <View
                className={`mr-1.5 h-2 w-2 rounded-full ${
                  isOfflineMode ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <Text
                className={`text-[11px] font-bold ${
                  isOfflineMode ? 'text-amber-800' : 'text-emerald-800'
                }`}>
                {isOfflineMode ? 'Airplane / Offline' : 'Online'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Role Picker Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <Text className="text-base font-bold text-foreground">Switch Demo User & Role</Text>
            <Text className="mt-1 text-xs text-muted">
              Select one of the benchmark users from demo_users.csv
            </Text>

            <View className="mt-4 gap-2">
              {DEMO_USERS.map((user: UserProfile) => {
                const isSelected = user.user_id === currentUser.user_id;
                return (
                  <TouchableOpacity
                    key={user.user_id}
                    onPress={() => {
                      void setCurrentUser(user);
                      setModalVisible(false);
                    }}
                    className={`flex-row items-center justify-between rounded-xl border p-3 ${
                      isSelected ? 'border-primary bg-primary-50' : 'border-border bg-background'
                    }`}>
                    <View>
                      <Text
                        className={`text-sm font-semibold ${
                          isSelected ? 'text-primary' : 'text-foreground'
                        }`}>
                        {user.name}
                      </Text>
                      <Text className="text-xs text-muted">
                        ID: {user.user_id} {user.state ? `• State: ${user.state}` : '• National'}
                      </Text>
                    </View>
                    <View
                      className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                        user.role === 'uniosun'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'vecdim'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}>
                      <Text className="text-[10px] font-bold uppercase">{user.role}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mt-4 items-center rounded-xl border border-border py-2.5">
              <Text className="text-sm font-semibold text-muted">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
