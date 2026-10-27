import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';

export type CustomModalType = 'danger' | 'warning' | 'info' | 'success';

export interface CustomModalItem {
  field?: string;
  message: string;
}

export interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  type?: CustomModalType;
  title: string;
  message?: string;
  items?: (CustomModalItem | string)[];
  primaryAction?: {
    label: string;
    onPress?: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress?: () => void;
  };
}

export function CustomModal({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  items,
  primaryAction,
  secondaryAction,
}: CustomModalProps) {
  if (!visible) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle size={28} color="#E11D48" />,
          iconBg: 'bg-rose-100',
          borderColor: 'border-rose-200',
          btnBg: 'bg-rose-600 active:bg-rose-700',
          titleColor: 'text-rose-950',
          itemBadgeBg: 'bg-rose-100',
          itemBadgeText: 'text-rose-800',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={28} color="#D97706" />,
          iconBg: 'bg-amber-100',
          borderColor: 'border-amber-200',
          btnBg: 'bg-amber-600 active:bg-amber-700',
          titleColor: 'text-amber-950',
          itemBadgeBg: 'bg-amber-100',
          itemBadgeText: 'text-amber-800',
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={28} color="#059669" />,
          iconBg: 'bg-emerald-100',
          borderColor: 'border-emerald-200',
          btnBg: 'bg-emerald-600 active:bg-emerald-700',
          titleColor: 'text-emerald-950',
          itemBadgeBg: 'bg-emerald-100',
          itemBadgeText: 'text-emerald-800',
        };
      case 'info':
      default:
        return {
          icon: <Info size={28} color="#2563EB" />,
          iconBg: 'bg-blue-100',
          borderColor: 'border-blue-200',
          btnBg: 'bg-blue-600 active:bg-blue-700',
          titleColor: 'text-slate-900',
          itemBadgeBg: 'bg-slate-100',
          itemBadgeText: 'text-slate-700',
        };
    }
  };

  const config = getTypeConfig();

  const handlePrimaryPress = () => {
    if (type === 'danger') {
      haptics.error();
    } else if (type === 'success') {
      haptics.success();
    } else {
      haptics.medium();
    }

    if (primaryAction?.onPress) {
      primaryAction.onPress();
    } else {
      onClose();
    }
  };

  const handleSecondaryPress = () => {
    haptics.light();
    if (secondaryAction?.onPress) {
      secondaryAction.onPress();
    } else {
      onClose();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          className="flex-1 items-center justify-center p-5">
          <TouchableWithoutFeedback>
            <View className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              {/* Top Row: Icon Badge & Close Button */}
              <View className="flex-row items-start justify-between">
                <View
                  className={`h-14 w-14 items-center justify-center rounded-2xl ${config.iconBg}`}>
                  {config.icon}
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  className="rounded-full bg-slate-100 p-1.5 active:bg-slate-200">
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Title & Message */}
              <Text className={`mt-4 text-lg font-black tracking-tight ${config.titleColor}`}>
                {title}
              </Text>

              {message ? (
                <Text className="mt-1.5 text-xs leading-relaxed text-slate-600">{message}</Text>
              ) : null}

              {/* Itemized List (e.g. Validation Errors or Checklist) */}
              {items && items.length > 0 && (
                <View className="mt-3.5 max-h-48 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {items.map((item, idx) => {
                      const isObj = typeof item === 'object' && item !== null;
                      const field = isObj ? item.field : undefined;
                      const text = isObj ? item.message : item;

                      return (
                        <View key={idx} className="mb-2 flex-row items-start gap-2 last:mb-0">
                          <View className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <View className="flex-1">
                            {field ? (
                              <View className="mb-0.5 flex-row">
                                <View className={`rounded px-1.5 py-0.5 ${config.itemBadgeBg}`}>
                                  <Text
                                    className={`font-mono text-[10px] font-bold ${config.itemBadgeText}`}>
                                    {field}
                                  </Text>
                                </View>
                              </View>
                            ) : null}
                            <Text className="text-xs font-medium leading-relaxed text-slate-700">
                              {text}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Action Buttons */}
              <View className="mt-5 flex-row gap-2.5">
                {secondaryAction ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSecondaryPress}
                    className="flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 py-3 active:bg-slate-200">
                    <Text className="text-xs font-bold text-slate-700">
                      {secondaryAction.label}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePrimaryPress}
                  className={`flex-1 items-center justify-center rounded-xl py-3 shadow-sm ${config.btnBg}`}>
                  <Text className="text-xs font-black uppercase tracking-wider text-white">
                    {primaryAction?.label ?? 'OK'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
