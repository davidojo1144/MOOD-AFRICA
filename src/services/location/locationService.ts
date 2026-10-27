import * as Location from 'expo-location';

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  error?: string;
}

export async function getCurrentGPSLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: 7.77, // Fallback default (Osogbo)
        longitude: 4.56,
        accuracy: null,
        error: 'Location permission not granted. Please enable GPS permissions.',
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    return {
      latitude: Number(loc.coords.latitude.toFixed(5)),
      longitude: Number(loc.coords.longitude.toFixed(5)),
      accuracy: loc.coords.accuracy ? Number(loc.coords.accuracy.toFixed(1)) : null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      latitude: 7.77,
      longitude: 4.56,
      accuracy: null,
      error: `Could not obtain GPS fix: ${message}`,
    };
  }
}

export const GPS_SIMULATIONS = {
  optimal6m: {
    name: '6 m (Optimal Fix)',
    latitude: 7.7712,
    longitude: 4.5623,
    accuracy: 6.0,
    description: 'Target <= 10 m. Accepted cleanly.',
  },
  poor18m: {
    name: '18 m (Poor Warning)',
    latitude: 7.7712,
    longitude: 4.5623,
    accuracy: 18.0,
    description: 'Between 10 m and 50 m. Shows warning, allows saving.',
  },
  unusable60m: {
    name: '60 m (Unusable Block)',
    latitude: 7.7712,
    longitude: 4.5623,
    accuracy: 60.0,
    description: 'Above 50 m. Blocked from saving.',
  },
  osogboPointForIfeCentral: {
    name: 'Osogbo Point in Ife Central (LGA Far)',
    latitude: 7.77, // Osogbo centre
    longitude: 4.56,
    accuracy: 6.5,
    description: '~32 km from Ife Central reference point (> 25 km threshold). Shows warning.',
  },
};
