import React, { useEffect, useState } from 'react';
import { View, Modal } from 'react-native';
import { FieldView } from '@/components/views/FieldView';
import { EntomologyForm } from '@/components/forms/EntomologyForm';
import { FieldRecord } from '@/types/vecdim';
import { useRecordsStore } from '@/store/recordsStore';

export default function FieldTabScreen() {
  const { init, isOfflineMode } = useRecordsStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FieldRecord | null>(null);

  useEffect(() => {
    void init();
  }, [init]);

  const handleNewRecord = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleEditRecord = (record: FieldRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingRecord(null);
  };

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-slate-50">
      <FieldView
        onNewRecord={handleNewRecord}
        onEditRecord={handleEditRecord}
        isOfflineMode={isOfflineMode}
      />

      {/* Full-Screen Form Modal */}
      <Modal visible={formOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1 }} className="flex-1 bg-slate-50">
          <EntomologyForm
            initialRecord={editingRecord}
            onSaved={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </View>
      </Modal>
    </View>
  );
}
