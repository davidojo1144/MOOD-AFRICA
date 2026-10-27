import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useRecordsStore } from '@/store/recordsStore';

export function DraftResumeModal() {
  const { pendingDraftPrompt, acceptRestoredDraft, discardDraft } = useRecordsStore();

  if (!pendingDraftPrompt) return null;

  const capturedTime = pendingDraftPrompt.captured_at
    ? new Date(pendingDraftPrompt.captured_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'earlier session';

  return (
    <Modal transparent animationType="fade" visible={Boolean(pendingDraftPrompt)}>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
          <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <Text className="text-lg font-bold text-primary">📝</Text>
          </View>

          <Text className="text-lg font-bold text-foreground">Resume Unfinished Record?</Text>

          <Text className="mt-2 text-sm text-muted">
            You have a saved draft from {capturedTime} ({pendingDraftPrompt.lga || 'Osun'},{' '}
            {pendingDraftPrompt.species || 'Mosquito assay'}).
          </Text>

          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              onPress={discardDraft}
              className="flex-1 items-center rounded-xl border border-border py-3">
              <Text className="font-semibold text-rose-600">Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={acceptRestoredDraft}
              className="flex-1 items-center rounded-xl bg-primary py-3 shadow-sm">
              <Text className="font-bold text-white">Resume Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
