import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text className="text-2xl font-bold text-foreground">Page Not Found</Text>
        <Text className="text-center text-sm text-muted">
          The screen you are looking for doesn&apos;t exist.
        </Text>
        <Link href="/" className="font-semibold text-primary">
          <Text className="font-semibold text-primary">Go Home</Text>
        </Link>
      </View>
    </>
  );
}
