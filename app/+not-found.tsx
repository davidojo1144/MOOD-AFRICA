import { Link } from 'expo-router';

import { Screen } from '@/components/common/Screen';
import { Text } from '@/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <Screen contentClassName="items-center justify-center gap-4">
      <Text variant="h2">Page not found</Text>
      <Text variant="caption">The screen you are looking for doesn&apos;t exist.</Text>
      <Link href="/" className="font-semibold text-primary">
        Go home
      </Link>
    </Screen>
  );
}
