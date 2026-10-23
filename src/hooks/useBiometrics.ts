import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

type BiometricState = {
  isAvailable: boolean;
  isEnrolled: boolean;
  types: LocalAuthentication.AuthenticationType[];
};

export function useBiometrics() {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    isEnrolled: false,
    types: [],
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [isAvailable, isEnrolled, types] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      if (mounted) setState({ isAvailable, isEnrolled, types });
    })().catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const authenticate = useCallback(async (promptMessage = 'Confirm your identity') => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
    });
    return result.success;
  }, []);

  return { ...state, canAuthenticate: state.isAvailable && state.isEnrolled, authenticate };
}
