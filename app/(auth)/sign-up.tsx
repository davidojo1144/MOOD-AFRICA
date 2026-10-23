import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { FormField } from '@/components/common/FormField';
import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { type SignUpValues, signUpSchema } from '@/lib/validation';

export default function SignUpScreen() {
  const { signUp, isSigningUp } = useAuth();
  const { control, handleSubmit } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp(values);
      toast.success({ title: 'Account created', message: `Welcome, ${values.name}!` });
    } catch (error) {
      toast.error({ title: 'Sign up failed', message: getErrorMessage(error) });
    }
  });

  return (
    <Screen scroll contentClassName="justify-center gap-8">
      <View className="gap-2">
        <Text variant="h1">Create account</Text>
        <Text variant="caption">Join Mood Africa in less than a minute.</Text>
      </View>

      <View className="gap-4">
        <FormField
          control={control}
          name="name"
          label="Full name"
          placeholder="Ada Okafor"
          autoComplete="name"
          textContentType="name"
          leftIcon={<User size={18} color="#A8A29E" />}
        />
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
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          leftIcon={<Lock size={18} color="#A8A29E" />}
        />
        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm password"
          placeholder="Repeat your password"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          leftIcon={<Lock size={18} color="#A8A29E" />}
          onSubmitEditing={() => void onSubmit()}
        />
      </View>

      <View className="gap-4">
        <Button title="Create account" loading={isSigningUp} onPress={() => void onSubmit()} />
        <View className="flex-row justify-center gap-1">
          <Text variant="caption">Already have an account?</Text>
          <Link href="/sign-in" className="text-sm font-semibold text-primary">
            Sign in
          </Link>
        </View>
      </View>
    </Screen>
  );
}
