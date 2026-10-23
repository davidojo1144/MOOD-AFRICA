import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { FormField } from '@/components/common/FormField';
import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { type SignInValues, signInSchema } from '@/lib/validation';

export default function SignInScreen() {
  const { signIn, isSigningIn } = useAuth();
  const { control, handleSubmit } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      toast.success({ title: 'Welcome back!' });
    } catch (error) {
      toast.error({ title: 'Sign in failed', message: getErrorMessage(error) });
    }
  });

  return (
    <Screen scroll contentClassName="justify-center gap-8">
      <View className="gap-2">
        <Text variant="h1">Welcome back</Text>
        <Text variant="caption">Sign in to continue to Mood Africa.</Text>
      </View>

      <View className="gap-4">
        <FormField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          leftIcon={<Mail size={18} color="#A8A29E" />}
        />
        <FormField
          control={control}
          name="password"
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          leftIcon={<Lock size={18} color="#A8A29E" />}
          onSubmitEditing={() => void onSubmit()}
        />
      </View>

      <View className="gap-4">
        <Button title="Sign in" loading={isSigningIn} onPress={() => void onSubmit()} />
        <View className="flex-row justify-center gap-1">
          <Text variant="caption">Don&apos;t have an account?</Text>
          <Link href="/sign-up" className="text-sm font-semibold text-primary">
            Sign up
          </Link>
        </View>
      </View>
    </Screen>
  );
}
