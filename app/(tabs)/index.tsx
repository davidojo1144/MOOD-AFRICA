import { Image } from 'expo-image';
import { Copy, Fingerprint, RefreshCw, Sparkles, Vibrate } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useClipboard } from '@/hooks/useClipboard';
import { useHaptics } from '@/hooks/useHaptics';
import { env } from '@/lib/env';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { usePosts } from '@/services/queries/posts';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&q=80';
const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export default function HomeScreen() {
  const { user } = useAuth();
  const { impact, notify } = useHaptics();
  const { copy, copied } = useClipboard();
  const biometrics = useBiometrics();
  const posts = usePosts(5);

  const firstName = user?.name.split(' ')[0] ?? 'there';

  const handleCopy = async () => {
    await copy(`Mood Africa — ${env.appEnv}`);
    notify();
    toast.success({ title: 'Copied to clipboard' });
  };

  const handleBiometrics = async () => {
    if (!biometrics.canAuthenticate) {
      toast.info({
        title: 'Biometrics unavailable',
        message: 'Set up Face ID / fingerprint on this device to try it.',
      });
      return;
    }
    const success = await biometrics.authenticate('Verify it’s you');
    if (success) toast.success({ title: 'Identity verified' });
    else toast.error({ title: 'Verification cancelled' });
  };

  return (
    <Screen scroll contentClassName="gap-6 pt-4">
      <View className="gap-1">
        <Text variant="caption">Good to see you,</Text>
        <Text variant="h1">Hello, {firstName} 👋</Text>
      </View>

      <View className="overflow-hidden rounded-2xl">
        <Image
          source={{ uri: HERO_IMAGE }}
          placeholder={{ blurhash: BLURHASH }}
          contentFit="cover"
          transition={300}
          style={{ width: '100%', height: 180 }}
          accessibilityLabel="Savanna landscape at sunset"
        />
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center gap-2 bg-black/40 p-4">
          <Sparkles size={18} color="#F2B33D" />
          <Text className="font-semibold text-white">Discover the mood of the continent</Text>
        </View>
      </View>

      <Card className="gap-3">
        <Text variant="h3">Device playground</Text>
        <Text variant="caption">Quick demos of the native APIs wired into this boilerplate.</Text>
        <View className="gap-2">
          <Button
            title="Haptic feedback"
            variant="outline"
            haptic={false}
            leftIcon={<Vibrate size={18} color="#E2582B" />}
            onPress={() => {
              impact();
              toast.info({ title: 'Bzzt!', message: 'Haptics fire on iOS and Android.' });
            }}
          />
          <Button
            title={copied ? 'Copied!' : 'Copy to clipboard'}
            variant="outline"
            leftIcon={<Copy size={18} color="#E2582B" />}
            onPress={handleCopy}
          />
          <Button
            title="Biometric check"
            variant="outline"
            leftIcon={<Fingerprint size={18} color="#E2582B" />}
            onPress={handleBiometrics}
          />
        </View>
      </Card>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text variant="h3">Latest posts</Text>
          <Button
            title="Refresh"
            size="sm"
            variant="ghost"
            loading={posts.isRefetching}
            leftIcon={<RefreshCw size={16} color="#E2582B" />}
            onPress={() => posts.refetch()}
          />
        </View>

        {posts.isPending ? (
          <ActivityIndicator className="py-6" color="#E2582B" />
        ) : posts.isError ? (
          <Card>
            <Text className="text-destructive">{getErrorMessage(posts.error)}</Text>
          </Card>
        ) : (
          posts.data.map((post) => (
            <Card key={post.id} className="gap-1">
              <Text className="font-semibold capitalize" numberOfLines={1}>
                {post.title}
              </Text>
              <Text variant="caption" numberOfLines={2}>
                {post.body}
              </Text>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
