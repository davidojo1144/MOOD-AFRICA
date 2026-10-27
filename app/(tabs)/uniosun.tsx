import React from 'react';
import { View } from 'react-native';
import { UniosunView } from '@/components/views/UniosunView';

export default function UniosunTabScreen() {
  return (
    <View style={{ flex: 1 }} className="flex-1 bg-slate-50">
      <UniosunView />
    </View>
  );
}
