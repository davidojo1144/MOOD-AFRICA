import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  className = '',
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: '#CBD5E1',
          opacity,
        },
        style,
      ]}
      className={className}
    />
  );
}

/**
 * Skeleton matching the exact 3-box Operational Metrics Cards header
 */
export function StatsCardsSkeleton() {
  return (
    <View className="flex-row gap-2">
      <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <Skeleton width="50%" height={10} borderRadius={4} />
        <View className="mt-2">
          <Skeleton width="40%" height={22} borderRadius={6} />
        </View>
        <View className="mt-1.5">
          <Skeleton width="70%" height={8} borderRadius={4} />
        </View>
      </View>

      <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <Skeleton width="60%" height={10} borderRadius={4} />
        <View className="mt-2">
          <Skeleton width="40%" height={22} borderRadius={6} />
        </View>
        <View className="mt-1.5">
          <Skeleton width="70%" height={8} borderRadius={4} />
        </View>
      </View>

      <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <Skeleton width="55%" height={10} borderRadius={4} />
        <View className="mt-2">
          <Skeleton width="40%" height={22} borderRadius={6} />
        </View>
        <View className="mt-1.5">
          <Skeleton width="70%" height={8} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton matching the horizontal filter pill tabs
 */
export function FilterPillsSkeleton() {
  return (
    <View className="flex-row gap-2">
      <Skeleton width={70} height={28} borderRadius={14} />
      <Skeleton width={90} height={28} borderRadius={14} />
      <Skeleton width={95} height={28} borderRadius={14} />
      <Skeleton width={80} height={28} borderRadius={14} />
    </View>
  );
}

/**
 * Skeleton matching Field Record card structure
 */
export function RecordCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3.5">
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          {/* Header row */}
          <View className="flex-row items-center justify-between">
            <View className="gap-1.5 flex-1 pr-4">
              <Skeleton width="60%" height={15} borderRadius={4} />
              <Skeleton width="40%" height={11} borderRadius={4} />
            </View>
            <Skeleton width={75} height={20} borderRadius={10} />
          </View>

          {/* Bioassay Strip */}
          <View className="mt-3.5 flex-row items-center justify-between rounded-xl bg-slate-50 p-3">
            <View className="flex-row items-center gap-2.5">
              <Skeleton width={32} height={32} borderRadius={8} />
              <View className="gap-1.5">
                <Skeleton width={110} height={12} borderRadius={4} />
                <Skeleton width={130} height={10} borderRadius={4} />
              </View>
            </View>
            <View className="items-end gap-1">
              <Skeleton width={45} height={16} borderRadius={4} />
              <Skeleton width={60} height={14} borderRadius={7} />
            </View>
          </View>

          {/* Footer */}
          <View className="mt-3 flex-row items-center justify-between pt-1">
            <Skeleton width="45%" height={10} borderRadius={4} />
            <Skeleton width="20%" height={10} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton matching Alert item structure in VECDIM / UNIOSUN views
 */
export function AlertListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="gap-3.5">
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="gap-1 flex-1 pr-4">
              <Skeleton width="55%" height={15} borderRadius={4} />
              <Skeleton width="40%" height={11} borderRadius={4} />
            </View>
            <Skeleton width={65} height={22} borderRadius={11} />
          </View>

          {/* Probability & Resistance Strip */}
          <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-3">
            <View className="gap-1">
              <Skeleton width={80} height={9} borderRadius={4} />
              <Skeleton width={50} height={18} borderRadius={4} />
            </View>
            <Skeleton width={120} height={28} borderRadius={10} />
          </View>

          {/* Acknowledgment Footer */}
          <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
            <Skeleton width="40%" height={12} borderRadius={4} />
            <Skeleton width={90} height={28} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );
}
