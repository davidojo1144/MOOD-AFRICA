import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useAppStore } from '@/store/app.store';

export function useHaptics() {
  const enabled = useAppStore((s) => s.hapticsEnabled) && Platform.OS !== 'web';

  const impact = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (enabled) void Haptics.impactAsync(style);
    },
    [enabled],
  );

  const notify = useCallback(
    (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
      if (enabled) void Haptics.notificationAsync(type);
    },
    [enabled],
  );

  const selection = useCallback(() => {
    if (enabled) void Haptics.selectionAsync();
  }, [enabled]);

  return { impact, notify, selection };
}
