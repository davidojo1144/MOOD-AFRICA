import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
      <StatusBar style="auto" />
      <View className="items-center">
        <Text className="text-3xl font-bold tracking-tight text-foreground">Mood Africa</Text>
        <Text className="mt-3 text-center text-base text-muted">
          Fresh workspace ready. Start building your app from scratch in{' '}
          <Text className="font-semibold text-primary">app/index.tsx</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}
