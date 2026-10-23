# Mood Africa

Expo (SDK 58) + React Native + TypeScript app scaffold.

## Stack

| Area        | Tools                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| Navigation  | Expo Router (file-based, typed routes, `Stack.Protected` auth guards)        |
| Styling     | NativeWind v4 + Tailwind CSS 3 (theme in `tailwind.config.js`)               |
| State/data  | Zustand (persisted), TanStack Query, Axios (`src/services/api/client.ts`)    |
| Storage     | AsyncStorage (non-sensitive), Expo SecureStore (tokens)                      |
| Forms       | React Hook Form + Zod (`@hookform/resolvers`)                                |
| UI          | clsx + tailwind-merge (`cn`), Expo Vector Icons, Lucide, toast notifications |
| Device APIs | expo-image, expo-haptics, expo-clipboard, expo-local-authentication          |
| Tooling     | ESLint (flat, `eslint-config-expo`) + Prettier (Tailwind class sorting)      |
| Builds      | EAS (`eas.json`: development / preview / production)                         |

## Getting started

```bash
npm install
cp .env.example .env
npx expo start
```

Auth is mocked by default (`EXPO_PUBLIC_USE_MOCK_AUTH=true`): any valid email/password signs you in. Set it to `false` and point `EXPO_PUBLIC_API_URL` at your backend to use the real `/auth/*` endpoints.

Expo Go only includes Expo's bundled native modules. Everything here is supported in Expo Go; for a dev build run `npm run build:dev` (or `npx expo run:ios|android`).

## Scripts

| Script                           | Does                            |
| -------------------------------- | ------------------------------- |
| `npm start`                      | Start Metro                     |
| `npm run ios/android/web`        | Start on a platform             |
| `npm run typecheck`              | `tsc --noEmit`                  |
| `npm run lint`                   | ESLint (`lint:fix` to autofix)  |
| `npm run format`                 | Prettier write (`format:check`) |
| `npm run doctor`                 | expo-doctor                     |
| `npm run build:dev/preview/prod` | EAS builds                      |

## Structure

```
app/                     # routes only
  _layout.tsx            # providers, splash, auth-guarded root stack
  (auth)/                # sign-in, sign-up
  (tabs)/                # home, profile
src/
  components/ui/         # Button, Input, Card, Text
  components/common/     # Screen, FormField, ToastHost
  hooks/                 # useAuth, useBiometrics, useClipboard, useHaptics
  services/api/          # axios client + services
  services/queries/      # TanStack Query hooks
  store/                 # Zustand stores
  providers/             # App, Auth, Query providers
  lib/                   # env, cn, storage, query client, toast, validation
  styles/global.css      # Tailwind entry
  types/
```

Imports from `src/` use the `@/` alias, e.g. `import { Button } from '@/components/ui'`.

## Environment

`EXPO_PUBLIC_*` variables are inlined into the bundle and validated with Zod in `src/lib/env.ts`. Never put secrets in them. `EXPO_OWNER` and `EAS_PROJECT_ID` are read only at build time by `app.config.ts`. Run `npx eas-cli@latest init` to link the project and get an ID.

## App identity

`app.config.ts` sets the bundle ID per `EXPO_PUBLIC_APP_ENV` (`com.moodafrica.app` in production, with an env suffix otherwise), so dev, preview and production builds can live side by side. Replace the icon and splash images in `assets/` before release.
