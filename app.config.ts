import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
const IS_PROD = APP_ENV === 'production';

const BUNDLE_ID = IS_PROD ? 'com.moodafrica.app' : `com.moodafrica.app.${APP_ENV}`;
const APP_NAME = IS_PROD ? 'Mood Africa' : `Mood Africa (${APP_ENV})`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: 'mood-africa',
  owner: process.env.EXPO_OWNER,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'moodafrica',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    icon: './assets/expo.icon',
    infoPlist: {
      NSFaceIDUsageDescription: 'Allow Mood Africa to use Face ID to secure your account.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#FFF7ED',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['android.permission.USE_BIOMETRIC', 'android.permission.USE_FINGERPRINT'],
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-local-authentication',
      { faceIDPermission: 'Allow Mood Africa to use Face ID to secure your account.' },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFF7ED',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
        dark: {
          backgroundColor: '#1C1917',
          image: './assets/images/splash-icon.png',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
