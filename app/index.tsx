import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useRecordsStore } from '@/store/recordsStore';
import { FieldRecord } from '@/types/vecdim';
import { RoleSwitcher } from '@/components/common/RoleSwitcher';
import { DraftResumeModal } from '@/components/common/DraftResumeModal';
import { EntomologyForm } from '@/components/forms/EntomologyForm';
import { FieldView } from '@/components/views/FieldView';
import { VecdimView } from '@/components/views/VecdimView';
import { UniosunView } from '@/components/views/UniosunView';

export default function AppIndex() {
  const { currentUser, init } = useRecordsStore();

  const [selectedTab, setSelectedTab] = useState<'field' | 'vecdim' | 'uniosun' | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<FieldRecord | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  useEffect(() => {
    void init();
  }, [init]);

  const activeTab = selectedTab ?? currentUser.role;

  const handleOpenNewForm = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: FieldRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      {/* App Header Branding */}
      <View className="border-b border-border bg-surface px-4 py-2.5">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xl font-extrabold tracking-tight text-primary">VECDIM</Text>
              <View className="rounded bg-primary-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase text-primary-800">
                  UNIOSUN Lab
                </Text>
              </View>
            </View>
            <Text className="text-[11px] text-muted">
              Malaria Vector Surveillance & Early Warning Decision Support
            </Text>
          </View>

          {isOfflineMode && (
            <View className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-amber-900">OFFLINE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Role Switcher & Offline Mode Simulator Header */}
      <RoleSwitcher
        isOfflineMode={isOfflineMode}
        onToggleOfflineMode={() => setIsOfflineMode(!isOfflineMode)}
      />

      {/* Main Content Area */}
      <View className="flex-1">
        {isFormOpen ? (
          <EntomologyForm
            initialRecord={editingRecord}
            onSaved={handleCloseForm}
            onCancel={handleCloseForm}
          />
        ) : activeTab === 'field' ? (
          <FieldView
            onNewRecord={handleOpenNewForm}
            onEditRecord={handleEditRecord}
            isOfflineMode={isOfflineMode}
          />
        ) : activeTab === 'vecdim' ? (
          <VecdimView />
        ) : (
          <UniosunView />
        )}
      </View>

      {/* Bottom Navigation Tabs */}
      {!isFormOpen && (
        <View className="flex-row border-t border-border bg-surface px-3 py-2 shadow-lg">
          <TouchableOpacity
            onPress={() => setSelectedTab('field')}
            className={`flex-1 items-center rounded-xl py-1.5 ${
              activeTab === 'field' ? 'bg-primary-50' : ''
            }`}>
            <Text className="text-base">📝</Text>
            <Text
              className={`mt-0.5 text-[11px] ${
                activeTab === 'field' ? 'font-bold text-primary' : 'font-medium text-muted'
              }`}>
              Field Capture
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('vecdim')}
            className={`flex-1 items-center rounded-xl py-1.5 ${
              activeTab === 'vecdim' ? 'bg-primary-50' : ''
            }`}>
            <Text className="text-base">🛡️</Text>
            <Text
              className={`mt-0.5 text-[11px] ${
                activeTab === 'vecdim' ? 'font-bold text-primary' : 'font-medium text-muted'
              }`}>
              VECDIM (State)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('uniosun')}
            className={`flex-1 items-center rounded-xl py-1.5 ${
              activeTab === 'uniosun' ? 'bg-primary-50' : ''
            }`}>
            <Text className="text-base">🏛️</Text>
            <Text
              className={`mt-0.5 text-[11px] ${
                activeTab === 'uniosun' ? 'font-bold text-primary' : 'font-medium text-muted'
              }`}>
              UNIOSUN (National)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Crash/Restart Draft Resume Prompt Modal */}
      <DraftResumeModal />
    </SafeAreaView>
  );
}
