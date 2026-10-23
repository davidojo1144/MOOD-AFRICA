import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  edges?: Edge[];
  className?: string;
  contentClassName?: string;
}>;

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  className,
  contentClassName,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerClassName={cn('grow px-5 pb-10', contentClassName)}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View className={cn('flex-1 px-5', contentClassName)}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      className={cn('flex-1 bg-background dark:bg-background-dark', className)}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
