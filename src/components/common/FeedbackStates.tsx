import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, RefreshCw, FolderOpen, Plus, Sparkles } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <View className="shadow-xs items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8">
      <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        {icon ?? <FolderOpen size={30} color="#64748B" />}
      </View>
      <Text className="text-center text-base font-extrabold text-slate-900">{title}</Text>
      <Text className="mt-1 max-w-xs text-center text-xs leading-relaxed text-slate-500">
        {description}
      </Text>

      {(onAction || onSecondaryAction) && (
        <View className="mt-5 flex-row gap-2.5">
          {onAction && actionLabel && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                haptics.medium();
                onAction();
              }}
              className="flex-row items-center rounded-xl bg-emerald-600 px-4 py-2.5 shadow-sm active:bg-emerald-700">
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
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
              className="flex-row items-center rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 active:bg-slate-200">
              <Sparkles size={14} color="#475569" />
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
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Unable to Load Data',
  message,
  onRetry,
  retryLabel = 'Retry Connection',
}: ErrorStateProps) {
  return (
    <View className="shadow-xs items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/50 p-7">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
        <AlertCircle size={28} color="#E11D48" />
      </View>
      <Text className="text-center text-base font-extrabold text-rose-950">{title}</Text>
      <Text className="mt-1 max-w-xs text-center text-xs leading-relaxed text-rose-700">
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            haptics.medium();
            onRetry();
          }}
          className="mt-4 flex-row items-center rounded-xl bg-rose-600 px-4 py-2.5 shadow-sm active:bg-rose-700">
          <RefreshCw size={14} color="#FFFFFF" />
          <Text className="ml-1.5 text-xs font-bold text-white">{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
