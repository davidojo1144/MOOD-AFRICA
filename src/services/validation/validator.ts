import { RuleId, ValidationErrorItem, ValidationSummary } from '@/types/vecdim';
import {
  haversineKm,
  LGA_MAX_KM,
  LGA_REFERENCES,
  NIGERIA_BOUNDS,
  REF_PARITY_DATE,
  STATE_BOUNDS,
} from './constants';

export interface RecordValidationInput {
  record_id?: string;
  state?: string | null;
  lga?: string | null;
  ward?: string | null;
  latitude?: number | null | string;
  longitude?: number | null | string;
  gps_accuracy_m?: number | null | string;
  collection_date?: string | null;
  species?: string | null;
  insecticide?: string | null;
  n_exposed?: number | null | string;
  n_dead?: number | null | string;
  larval_density?: number | null | string;
  urban?: number | null | string;
  irs_covered?: number | null | string;
  itn_use_pct?: number | null | string;
  slide_positivity_pct?: number | null | string;
  temp_c?: number | null | string;
  rainfall_mm?: number | null | string;
  ndvi?: number | null | string;
  is_duplicate?: boolean;
}

export interface ValidateOptions {
  mode?: 'device' | 'server' | 'parity';
  refDate?: string;
}

function isMissing(val: unknown): boolean {
  return (
    val === null ||
    val === undefined ||
    val === '' ||
    val === 'NA' ||
    val === 'null' ||
    val === 'undefined'
  );
}

function parseNumber(val: unknown): number | null {
  if (isMissing(val)) return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(num) ? null : num;
}

export function validateRecord(
  data: RecordValidationInput,
  options: ValidateOptions = {},
): ValidationSummary {
  const mode = options.mode ?? 'device';
  const refDate =
    mode === 'parity'
      ? REF_PARITY_DATE
      : (options.refDate ?? new Date().toISOString().slice(0, 10));

  const errors: ValidationErrorItem[] = [];
  const flags: ValidationErrorItem[] = [];

  const ruleFlags: Record<RuleId, boolean> = {
    GPS_outside_nigeria: false,
    GPS_zero_zero: false,
    GPS_state_mismatch: false,
    GPS_far_from_lga: false,
    GPS_accuracy_poor: false,
    GPS_accuracy_unusable: false,
    n_dead_gt_n_exposed: false,
    positivity_out_range: false,
    future_date: false,
    temp_implausible: false,
    rainfall_implausible: false,
    duplicate: false,
    missing_core: false,
  };

  const lat = parseNumber(data.latitude);
  const lon = parseNumber(data.longitude);
  const accuracy = parseNumber(data.gps_accuracy_m);
  const nExposed = parseNumber(data.n_exposed);
  const nDead = parseNumber(data.n_dead);
  const posPct = parseNumber(data.slide_positivity_pct);
  const tempC = parseNumber(data.temp_c);
  const rainMm = parseNumber(data.rainfall_mm);
  const ndvi = parseNumber(data.ndvi);
  const itnUse = parseNumber(data.itn_use_pct);

  const state = data.state?.trim() ?? '';
  const lga = data.lga?.trim() ?? '';
  const species = data.species?.trim() ?? '';
  const collectionDate = data.collection_date?.trim() ?? '';

  // 1. GPS_outside_nigeria (Block)
  const isOutsideNigeria =
    lat === null ||
    lon === null ||
    lat < NIGERIA_BOUNDS.latMin ||
    lat > NIGERIA_BOUNDS.latMax ||
    lon < NIGERIA_BOUNDS.lonMin ||
    lon > NIGERIA_BOUNDS.lonMax;

  if (isOutsideNigeria) {
    ruleFlags.GPS_outside_nigeria = true;
    errors.push({
      rule: 'GPS_outside_nigeria',
      field: 'latitude',
      message:
        'Captured coordinates are outside Nigeria borders (lat 4–14, lon 2.5–15). Move to open sky and recapture.',
      severity: 'Block',
    });
  }

  // 2. GPS_zero_zero (Block)
  const isZeroZero = lat === 0 && lon === 0;
  if (isZeroZero) {
    ruleFlags.GPS_zero_zero = true;
    errors.push({
      rule: 'GPS_zero_zero',
      field: 'latitude',
      message: 'GPS coordinates cannot be (0, 0) Island. Recapture accurate device location.',
      severity: 'Block',
    });
  }

  // 3. GPS_state_mismatch (Block)
  const stateBounds = STATE_BOUNDS[state as keyof typeof STATE_BOUNDS];
  const isStateMismatch =
    !stateBounds ||
    lat === null ||
    lon === null ||
    lat < stateBounds.latMin ||
    lat > stateBounds.latMax ||
    lon < stateBounds.lonMin ||
    lon > stateBounds.lonMax;

  if (isStateMismatch) {
    ruleFlags.GPS_state_mismatch = true;
    errors.push({
      rule: 'GPS_state_mismatch',
      field: 'state',
      message: `Captured location (${lat?.toFixed(3)}, ${lon?.toFixed(3)}) does not lie within the boundary of ${state || 'selected state'}.`,
      severity: 'Block',
    });
  }

  // 4. GPS_far_from_lga (Warn)
  const lgaRef = LGA_REFERENCES.find(
    (r) =>
      r.state.toLowerCase() === state.toLowerCase() && r.lga.toLowerCase() === lga.toLowerCase(),
  );

  let distKm = 0;
  let isFarFromLga = false;
  if (!lgaRef || lat === null || lon === null) {
    isFarFromLga = true;
  } else {
    distKm = haversineKm(lat, lon, lgaRef.refLat, lgaRef.refLon);
    if (distKm > LGA_MAX_KM) {
      isFarFromLga = true;
    }
  }

  if (isFarFromLga) {
    ruleFlags.GPS_far_from_lga = true;
    flags.push({
      rule: 'GPS_far_from_lga',
      field: 'lga',
      message: `Your location is ${distKm.toFixed(1)} km from ${lga || 'selected LGA'} reference point (threshold: ${LGA_MAX_KM} km). Check the LGA, or recapture location.`,
      severity: 'Warn',
    });
  }

  // GPS Accuracy checks (mode: device or server when field provided)
  if (accuracy !== null) {
    if (accuracy > 10 && accuracy <= 50) {
      ruleFlags.GPS_accuracy_poor = true;
      flags.push({
        rule: 'GPS_accuracy_poor',
        field: 'gps_accuracy_m',
        message: `GPS accuracy is ${accuracy.toFixed(1)} m (recommended 10 m or better). You can still save, but consider moving to an open area.`,
        severity: 'Warn',
      });
    } else if (accuracy > 50) {
      ruleFlags.GPS_accuracy_unusable = true;
      errors.push({
        rule: 'GPS_accuracy_unusable',
        field: 'gps_accuracy_m',
        message: `GPS accuracy is ${accuracy.toFixed(1)} m (must be 50 m or better). Please wait for a better satellite fix or move to open sky.`,
        severity: 'Block',
      });
    }
  } else if (mode === 'device') {
    ruleFlags.GPS_accuracy_unusable = true;
    errors.push({
      rule: 'GPS_accuracy_unusable',
      field: 'gps_accuracy_m',
      message: 'No GPS accuracy reading received from phone. Move outdoors and tap Recapture.',
      severity: 'Block',
    });
  }

  // 5. n_dead_gt_n_exposed (Block)
  if (nDead !== null && nExposed !== null && nDead > nExposed) {
    ruleFlags.n_dead_gt_n_exposed = true;
    errors.push({
      rule: 'n_dead_gt_n_exposed',
      field: 'n_dead',
      message: `Number of dead mosquitoes (${nDead}) cannot exceed exposed count (${nExposed}). Please correct n_dead.`,
      severity: 'Block',
    });
  }

  // 6. positivity_out_range (Server / Parity Block)
  if (posPct !== null && (posPct < 0 || posPct > 100)) {
    ruleFlags.positivity_out_range = true;
    if (mode !== 'device') {
      errors.push({
        rule: 'positivity_out_range',
        field: 'slide_positivity_pct',
        message: `Slide positivity percentage (${posPct}%) must be between 0 and 100%.`,
        severity: 'Block',
      });
    }
  }

  // 7. future_date (Block)
  if (!isMissing(collectionDate) && collectionDate > refDate) {
    ruleFlags.future_date = true;
    errors.push({
      rule: 'future_date',
      field: 'collection_date',
      message: `Collection date (${collectionDate}) cannot be in the future (reference date: ${refDate}).`,
      severity: 'Block',
    });
  }

  // 8. temp_implausible (Server / Parity Block)
  if (tempC !== null && (tempC < 10 || tempC > 50)) {
    ruleFlags.temp_implausible = true;
    if (mode !== 'device') {
      errors.push({
        rule: 'temp_implausible',
        field: 'temp_c',
        message: `Temperature reading (${tempC}°C) is implausible (must be 10°C to 50°C).`,
        severity: 'Block',
      });
    }
  }

  // 9. rainfall_implausible (Server / Parity Block)
  if (rainMm !== null && (rainMm < 0 || rainMm > 1500)) {
    ruleFlags.rainfall_implausible = true;
    if (mode !== 'device') {
      errors.push({
        rule: 'rainfall_implausible',
        field: 'rainfall_mm',
        message: `Rainfall reading (${rainMm} mm) is implausible (must be 0 to 1500 mm).`,
        severity: 'Block',
      });
    }
  }

  // 10. duplicate (Warn)
  if (data.is_duplicate) {
    ruleFlags.duplicate = true;
    flags.push({
      rule: 'duplicate',
      field: 'ward',
      message:
        'A record with identical ward, date, species, insecticide, exposed and dead counts already exists. Later entries are flagged.',
      severity: 'Warn',
    });
  }

  // 11. missing_core (Block)
  // In parity mode: checks all 4 (ndvi, rainfall_mm, itn_use_pct, species)
  // In device mode: checks species and itn_use_pct (form fields)
  let isMissingCore = false;
  if (mode === 'parity') {
    isMissingCore = isMissing(ndvi) || isMissing(rainMm) || isMissing(itnUse) || isMissing(species);
  } else if (mode === 'device') {
    isMissingCore = isMissing(itnUse) || isMissing(species);
  } else {
    // server mode: itn_use_pct and species required; ndvi/rain flagged as enrichment_pending if missing
    isMissingCore = isMissing(itnUse) || isMissing(species);
  }

  if (isMissingCore) {
    ruleFlags.missing_core = true;
    errors.push({
      rule: 'missing_core',
      field: isMissing(species) ? 'species' : 'itn_use_pct',
      message:
        'Core required fields are incomplete. Please ensure species and ITN bed-net usage % are filled.',
      severity: 'Block',
    });
  }

  return {
    isValid: errors.length === 0,
    hasWarnings: flags.length > 0,
    errors,
    flags,
    ruleFlags,
  };
}
