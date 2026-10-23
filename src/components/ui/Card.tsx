import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export type CardProps = ViewProps & { className?: string };

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark',
        className,
      )}
      {...props}
    />
  );
}
