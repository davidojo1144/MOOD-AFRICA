import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
  EXPO_PUBLIC_API_URL: z.url().default('https://jsonplaceholder.typicode.com'),
  EXPO_PUBLIC_API_TIMEOUT: z.coerce.number().int().positive().default(15000),
  EXPO_PUBLIC_USE_MOCK_AUTH: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

// EXPO_PUBLIC_* vars are inlined at build time, so each one must be referenced statically.
const parsed = envSchema.safeParse({
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT,
  EXPO_PUBLIC_USE_MOCK_AUTH: process.env.EXPO_PUBLIC_USE_MOCK_AUTH,
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env = {
  appEnv: parsed.data.EXPO_PUBLIC_APP_ENV,
  apiUrl: parsed.data.EXPO_PUBLIC_API_URL,
  apiTimeout: parsed.data.EXPO_PUBLIC_API_TIMEOUT,
  useMockAuth: parsed.data.EXPO_PUBLIC_USE_MOCK_AUTH,
  isProduction: parsed.data.EXPO_PUBLIC_APP_ENV === 'production',
} as const;
