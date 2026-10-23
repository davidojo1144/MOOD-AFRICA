import { type ComponentRef, type ReactNode, type Ref, useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

export type InputProps = TextInputProps & {
  ref?: Ref<ComponentRef<typeof TextInput>>;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  containerClassName?: string;
};

export function Input({
  ref,
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View
        className={cn(
          'h-12 flex-row items-center gap-2 rounded-xl border bg-surface px-3 dark:bg-surface-dark',
          focused ? 'border-primary' : 'border-border dark:border-border-dark',
          error && 'border-destructive',
        )}>
        {leftIcon}
        <TextInput
          ref={ref}
          placeholderTextColor="#A8A29E"
          className={cn('flex-1 text-base text-foreground dark:text-foreground-dark', className)}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon}
      </View>
      {error ? (
        <Text className="text-sm text-destructive">{error}</Text>
      ) : hint ? (
        <Text variant="caption">{hint}</Text>
      ) : null}
    </View>
  );
}
