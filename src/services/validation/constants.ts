import { StateName, WHOResistanceClass } from '@/types/vecdim';

export const REF_PARITY_DATE = '2026-10-08';

export const NIGERIA_BOUNDS = {
  latMin: 4.0,
  latMax: 14.0,
  lonMin: 2.5,
  lonMax: 15.0,
};

export const STATE_BOUNDS: Record<
  StateName,
  { latMin: number; latMax: number; lonMin: number; lonMax: number }
> = {
  Lagos: { latMin: 6.3, latMax: 6.8, lonMin: 2.7, lonMax: 4.4 },
  Kano: { latMin: 11.5, latMax: 12.6, lonMin: 8.0, lonMax: 9.2 },
  Osun: { latMin: 7.0, latMax: 8.2, lonMin: 4.0, lonMax: 5.0 },
};

export interface LGAReference {
  state: StateName;
  lga: string;
  refLat: number;
  refLon: number;
  maxKm: number;
}

export const LGA_REFERENCES: LGAReference[] = [
  { state: 'Lagos', lga: 'Ikorodu', refLat: 6.62, refLon: 3.51, maxKm: 25 },
  { state: 'Lagos', lga: 'Alimosho', refLat: 6.6, refLon: 3.25, maxKm: 25 },
  { state: 'Lagos', lga: 'Epe', refLat: 6.58, refLon: 3.98, maxKm: 25 },
  { state: 'Lagos', lga: 'Badagry', refLat: 6.43, refLon: 2.88, maxKm: 25 },
  { state: 'Lagos', lga: 'Eti-Osa', refLat: 6.45, refLon: 3.6, maxKm: 25 },
  { state: 'Kano', lga: 'Dala', refLat: 12.0, refLon: 8.52, maxKm: 25 },
  { state: 'Kano', lga: 'Nasarawa', refLat: 12.0, refLon: 8.55, maxKm: 25 },
  { state: 'Kano', lga: 'Gwale', refLat: 11.98, refLon: 8.49, maxKm: 25 },
  { state: 'Kano', lga: 'Tarauni', refLat: 11.97, refLon: 8.54, maxKm: 25 },
  { state: 'Kano', lga: 'Ungogo', refLat: 12.05, refLon: 8.48, maxKm: 25 },
  { state: 'Osun', lga: 'Osogbo', refLat: 7.77, refLon: 4.56, maxKm: 25 },
  { state: 'Osun', lga: 'Ife Central', refLat: 7.48, refLon: 4.56, maxKm: 25 },
  { state: 'Osun', lga: 'Ilesa East', refLat: 7.62, refLon: 4.73, maxKm: 25 },
  { state: 'Osun', lga: 'Iwo', refLat: 7.63, refLon: 4.18, maxKm: 25 },
  { state: 'Osun', lga: 'Ede North', refLat: 7.74, refLon: 4.43, maxKm: 25 },
];

export const LGA_MAX_KM = 25;

export const STATE_LGAS: Record<StateName, string[]> = {
  Lagos: ['Ikorodu', 'Alimosho', 'Epe', 'Badagry', 'Eti-Osa'],
  Kano: ['Dala', 'Nasarawa', 'Gwale', 'Tarauni', 'Ungogo'],
  Osun: ['Osogbo', 'Ife Central', 'Ilesa East', 'Iwo', 'Ede North'],
};

export const SPECIES_OPTIONS = [
  'An. gambiae s.s.',
  'An. coluzzii',
  'An. arabiensis',
  'An. funestus',
] as const;

export const INSECTICIDE_OPTIONS = [
  'Permethrin',
  'Deltamethrin',
  'Alphacypermethrin',
  'Pirimiphos-methyl',
] as const;

/**
 * Great-circle distance between two GPS coordinates using the Haversine formula.
 * Earth radius = 6371 km (identical to R helpers.R).
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Calculates mortality percentage (rounded to 1 decimal place) and WHO resistance class.
 * Exactly matches R descriptive analysis specification:
 * >= 98.0 -> Susceptible
 * 90.0 up to < 98.0 -> Possible resistance
 * < 90.0 -> Resistant
 */
export function calculateMortalityAndClass(
  nExposed: number,
  nDead: number,
): { mortalityPct: number; whoClass: WHOResistanceClass } {
  if (nExposed <= 0) {
    return { mortalityPct: 0, whoClass: 'Resistant' };
  }
  const rawPct = (100 * nDead) / nExposed;
  const mortalityPct = Math.round(rawPct * 10) / 10;

  let whoClass: WHOResistanceClass;
  if (mortalityPct >= 98.0) {
    whoClass = 'Susceptible';
  } else if (mortalityPct >= 90.0) {
    whoClass = 'Possible resistance';
  } else {
    whoClass = 'Resistant';
  }

  return { mortalityPct, whoClass };
}
