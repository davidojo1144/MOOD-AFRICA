import Toast from 'react-native-toast-message';

type ToastOptions = {
  title: string;
  message?: string;
  duration?: number;
};

const show = (type: 'success' | 'error' | 'info') => (options: ToastOptions) =>
  Toast.show({
    type,
    text1: options.title,
    text2: options.message,
    visibilityTime: options.duration ?? 3000,
    position: 'top',
  });

export const toast = {
  success: show('success'),
  error: show('error'),
  info: show('info'),
  hide: () => Toast.hide(),
};
