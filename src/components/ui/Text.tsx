import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

const variants = {
  h1: 'text-3xl font-bold tracking-tight',
  h2: 'text-2xl font-bold tracking-tight',
  h3: 'text-xl font-semibold',
  body: 'text-base',
  caption: 'text-sm text-muted dark:text-muted-dark',
  label: 'text-sm font-medium',
} as const;

export type TextProps = RNTextProps & {
  variant?: keyof typeof variants;
  className?: string;
};

export function Text({ variant = 'body', className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('text-foreground dark:text-foreground-dark', variants[variant], className)}
      {...props}
    />
  );
}
