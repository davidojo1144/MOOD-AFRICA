export type StateName = 'Lagos' | 'Kano' | 'Osun';

export type SpeciesName = 'An. gambiae s.s.' | 'An. coluzzii' | 'An. arabiensis' | 'An. funestus';

export type InsecticideName =
  'Permethrin' | 'Deltamethrin' | 'Alphacypermethrin' | 'Pirimiphos-methyl';

export type WHOResistanceClass = 'Susceptible' | 'Possible resistance' | 'Resistant';

export type RecordStatus = 'draft' | 'pending_sync' | 'synced' | 'synced_with_flags' | 'rejected';

export type UserRole = 'field' | 'vecdim' | 'uniosun';

export interface UserProfile {
  user_id: string;
  name: string;
  role: UserRole;
  state?: StateName;
}

export type RuleId =
  | 'GPS_outside_nigeria'
  | 'GPS_zero_zero'
  | 'GPS_state_mismatch'
  | 'GPS_far_from_lga'
  | 'GPS_accuracy_poor'
  | 'GPS_accuracy_unusable'
  | 'n_dead_gt_n_exposed'
  | 'positivity_out_range'
  | 'future_date'
  | 'temp_implausible'
  | 'rainfall_implausible'
  | 'duplicate'
  | 'missing_core';

export type RuleSeverity = 'Block' | 'Warn';

export interface ValidationErrorItem {
  rule: RuleId;
  field: string;
  message: string;
  severity: RuleSeverity;
}

export interface ValidationSummary {
  isValid: boolean; // false if any Block rule fired
  hasWarnings: boolean; // true if any Warn rule fired
  errors: ValidationErrorItem[]; // Block rules
  flags: ValidationErrorItem[]; // Warn rules
  ruleFlags: Record<RuleId, boolean>;
}

export interface FieldRecord {
  record_id: string;
  state: StateName;
  lga: string;
  ward: string;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy_m: number | null;
  collection_date: string; // YYYY-MM-DD
  species: SpeciesName;
  insecticide: InsecticideName;
  n_exposed: number;
  n_dead: number;
  mortality_pct?: number;
  who_class?: WHOResistanceClass;
  larval_density: number;
  urban: number; // 0 or 1
  irs_covered: number; // 0 or 1
  itn_use_pct: number;
  captured_at: string; // ISO string

  // Server enrichment (optional / null initially)
  rainfall_mm?: number | null;
  temp_c?: number | null;
  ndvi?: number | null;
  elevation_m?: number | null;
  dist_water_km?: number | null;
  slide_positivity_pct?: number | null;
  high_risk?: number | null;

  // Local/Sync tracking
  status: RecordStatus;
  sync_attempts?: number;
  last_sync_error?: string | null;
  server_errors?: ValidationErrorItem[];
  server_flags?: ValidationErrorItem[];
  created_at?: string;
  updated_at?: string;
}

export interface AlertTierItem {
  id: string; // state|lga|ym
  state: StateName;
  lga: string;
  month: string; // YYYY-MM
  n_records: number;
  mean_risk: number;
  tier: 'ALERT' | 'WARNING' | 'WATCH';
  pyrethroid_resistance_flag: boolean;
  acknowledged?: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  notes?: string;
}
