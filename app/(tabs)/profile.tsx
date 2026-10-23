import { LogOut, Moon, Smartphone, Sun } from 'lucide-react-native';
import { Pressable, Switch, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { type ThemePreference, useAppStore } from '@/store/app.store';

const themeOptions: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Smartphone },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useAppStore((s) => s.setHapticsEnabled);

  const initials =
    user?.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '?';

  return (
    <Screen scroll contentClassName="gap-6 pt-4">
      <Text variant="h1">Profile</Text>

      <Card className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Text className="text-lg font-bold text-white">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text variant="h3">{user?.name}</Text>
          <Text variant="caption">{user?.email}</Text>
        </View>
      </Card>

      <Card className="gap-3">
        <Text variant="label">Appearance</Text>
        <View className="flex-row gap-2">
          {themeOptions.map(({ value, label, Icon }) => {
            const active = theme === value;
            return (
              <Pressable
                key={value}
                onPress={() => setTheme(value)}
                className={cn(
                  'flex-1 items-center gap-1 rounded-xl border py-3',
                  active ? 'border-primary bg-primary/10' : 'border-border dark:border-border-dark',
                )}>
                <Icon size={18} color={active ? '#E2582B' : '#A8A29E'} />
                <Text className={cn('text-sm', active && 'font-semibold text-primary')}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card className="flex-row items-center justify-between">
        <View>
          <Text variant="label">Haptic feedback</Text>
          <Text variant="caption">Vibrate on taps and actions</Text>
        </View>
        <Switch
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
          trackColor={{ true: '#E2582B' }}
        />
      </Card>

      <Button
        title="Sign out"
        variant="destructive"
        leftIcon={<LogOut size={18} color="#fff" />}
        onPress={signOut}
      />

      <Text variant="caption" className="text-center">
        Environment: {env.appEnv}
      </Text>
    </Screen>
  );
}
