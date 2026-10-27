import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, RefreshCw, FolderOpen, Plus, Sparkles, WifiOff } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';

export type FeedbackVariant = 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  variant?: FeedbackVariant;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  secondaryIcon?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  variant = 'slate',
  actionLabel,
  onAction,
  actionIcon,
  secondaryLabel,
  onSecondaryAction,
  secondaryIcon,
}: EmptyStateProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          border: 'border-emerald-200',
          bg: 'bg-emerald-50',
          iconBg: 'bg-emerald-100',
          iconColor: '#059669',
          btnBg: 'bg-emerald-600 active:bg-emerald-700',
        };
      case 'amber':
        return {
          border: 'border-amber-200',
          bg: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          iconColor: '#D97706',
          btnBg: 'bg-amber-600 active:bg-amber-700',
        };
      case 'rose':
        return {
          border: 'border-rose-200',
          bg: 'bg-rose-50',
          iconBg: 'bg-rose-100',
          iconColor: '#E11D48',
          btnBg: 'bg-rose-600 active:bg-rose-700',
        };
      case 'blue':
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: '#2563EB',
          btnBg: 'bg-blue-600 active:bg-blue-700',
        };
      default:
        return {
          border: 'border-slate-300',
          bg: 'bg-white',
          iconBg: 'bg-slate-100',
          iconColor: '#64748B',
          btnBg: 'bg-slate-900 active:bg-slate-800',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <View
      className={`shadow-xs items-center justify-center rounded-3xl border border-dashed ${styles.border} ${styles.bg} p-8`}>
      <View className={`mb-3 h-16 w-16 items-center justify-center rounded-2xl ${styles.iconBg}`}>
        {icon ?? <FolderOpen size={30} color={styles.iconColor} />}
      </View>
      <Text className="text-center text-base font-extrabold text-slate-900">{title}</Text>
      <Text className="mt-1 max-w-xs text-center text-xs leading-relaxed text-slate-500">
        {description}
      </Text>

      {(onAction || onSecondaryAction) && (
        <View className="mt-5 flex-row flex-wrap justify-center gap-2.5">
          {onAction && actionLabel && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                haptics.medium();
                onAction();
              }}
              className={`flex-row items-center rounded-xl px-4 py-2.5 shadow-sm ${styles.btnBg}`}>
              {actionIcon ?? <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />}
              <Text className="ml-1 text-xs font-bold text-white">{actionLabel}</Text>
            </TouchableOpacity>
          )}

          {onSecondaryAction && secondaryLabel && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                haptics.light();
                onSecondaryAction();
              }}
              className="shadow-xs flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 active:bg-slate-50">
              {secondaryIcon ?? <Sparkles size={14} color="#475569" />}
              <Text className="ml-1.5 text-xs font-bold text-slate-700">{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  variant?: 'rose' | 'amber';
  onRetry?: () => void;
  retryLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function ErrorState({
  title = 'Unable to Load Data',
  message,
  variant = 'rose',
  onRetry,
  retryLabel = 'Retry Connection',
  secondaryActionLabel,
  onSecondaryAction,
}: ErrorStateProps) {
  const isRose = variant === 'rose';

  return (
    <View
      className={`shadow-xs items-center justify-center rounded-3xl border ${
        isRose ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'
      } p-7`}>
      <View
        className={`mb-3 h-14 w-14 items-center justify-center rounded-2xl ${
          isRose ? 'bg-rose-100' : 'bg-amber-100'
        }`}>
        {isRose ? <AlertCircle size={28} color="#E11D48" /> : <WifiOff size={28} color="#D97706" />}
      </View>
      <Text
        className={`text-center text-base font-extrabold ${
          isRose ? 'text-rose-950' : 'text-amber-950'
        }`}>
        {title}
      </Text>
      <Text
        className={`mt-1 max-w-xs text-center text-xs leading-relaxed ${
          isRose ? 'text-rose-700' : 'text-amber-700'
        }`}>
        {message}
      </Text>

      <View className="mt-4 flex-row flex-wrap justify-center gap-2">
        {onRetry && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              haptics.medium();
              onRetry();
            }}
            className={`flex-row items-center rounded-xl px-4 py-2.5 shadow-sm ${
              isRose ? 'bg-rose-600 active:bg-rose-700' : 'bg-amber-600 active:bg-amber-700'
            }`}>
            <RefreshCw size={14} color="#FFFFFF" />
            <Text className="ml-1.5 text-xs font-bold text-white">{retryLabel}</Text>
          </TouchableOpacity>
        )}

        {onSecondaryAction && secondaryActionLabel && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              haptics.light();
              onSecondaryAction();
            }}
            className="shadow-xs flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 active:bg-slate-50">
            <Text className="text-xs font-bold text-slate-700">{secondaryActionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface InlineLoadingProps {
  message?: string;
}

export function InlineLoading({ message = 'Loading surveillance data...' }: InlineLoadingProps) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-4">
      <ActivityIndicator size="small" color="#059669" />
      <Text className="text-xs font-semibold text-slate-500">{message}</Text>
    </View>
  );
}
