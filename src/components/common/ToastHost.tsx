import { CircleAlert, CircleCheck, Info } from 'lucide-react-native';
import { View } from 'react-native';
import Toast, { type ToastConfig, type ToastConfigParams } from 'react-native-toast-message';

import { Text } from '@/components/ui/Text';

const icons = {
  success: { Icon: CircleCheck, color: '#16A34A' },
  error: { Icon: CircleAlert, color: '#DC2626' },
  info: { Icon: Info, color: '#E2582B' },
} as const;

function ToastCard({
  type,
  text1,
  text2,
}: ToastConfigParams<unknown> & { type: keyof typeof icons }) {
  const { Icon, color } = icons[type];
  return (
    <View className="mx-4 w-[92%] flex-row items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg dark:border-border-dark dark:bg-surface-dark">
      <Icon size={22} color={color} />
      <View className="flex-1 gap-0.5">
        {text1 ? <Text className="font-semibold">{text1}</Text> : null}
        {text2 ? <Text variant="caption">{text2}</Text> : null}
      </View>
    </View>
  );
}

const toastConfig: ToastConfig = {
  success: (props) => <ToastCard {...props} type="success" />,
  error: (props) => <ToastCard {...props} type="error" />,
  info: (props) => <ToastCard {...props} type="info" />,
};

export function ToastHost() {
  return <Toast config={toastConfig} topOffset={60} />;
}
