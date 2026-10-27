import React from 'react';
import { View } from 'react-native';
import { VecdimView } from '@/components/views/VecdimView';

export default function VecdimTabScreen() {
  return (
    <View style={{ flex: 1 }} className="flex-1 bg-slate-50">
      <VecdimView />
    </View>
  );
}
