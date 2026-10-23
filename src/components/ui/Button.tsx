import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/cn';

import { Text } from './Text';

const variantStyles = {
  primary: { container: 'bg-primary active:bg-primary-600', text: 'text-primary-foreground' },
  secondary: {
    container: 'bg-secondary active:opacity-90',
    text: 'text-secondary-foreground',
  },
  outline: {
    container:
      'border border-border dark:border-border-dark bg-transparent active:bg-black/5 dark:active:bg-white/10',
    text: 'text-foreground dark:text-foreground-dark',
  },
  ghost: {
    container: 'bg-transparent active:bg-black/5 dark:active:bg-white/10',
    text: 'text-primary',
  },
  destructive: { container: 'bg-destructive active:opacity-90', text: 'text-white' },
} as const;

const sizeStyles = {
  sm: { container: 'h-9 px-3 rounded-lg', text: 'text-sm' },
  md: { container: 'h-12 px-5 rounded-xl', text: 'text-base' },
  lg: { container: 'h-14 px-6 rounded-2xl', text: 'text-lg' },
} as const;

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  haptic?: boolean;
  className?: string;
  textClassName?: string;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  haptic = true,
  className,
  textClassName,
  onPress,
  ...props
}: ButtonProps) {
  const { impact } = useHaptics();
  const isDisabled = disabled || loading;
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(event) => {
        if (haptic) impact();
        onPress?.(event);
      }}
      className={cn(
        'flex-row items-center justify-center gap-2',
        v.container,
        s.container,
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? '#E2582B' : '#fff'}
        />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text className={cn('font-semibold', v.text, s.text, textClassName)}>{title}</Text>
          {rightIcon ? <View>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}
