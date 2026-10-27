-- =====================================================================
-- VECDIM Database Schema Migration 001: Initial PostGIS Schema
-- =====================================================================

-- 1. Enable PostGIS Spatial Extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Demo & System Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('field', 'vecdim', 'uniosun')),
  state VARCHAR(20) CHECK (state IN ('Lagos', 'Kano', 'Osun') OR state IS NULL),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Field Records Table (System of Record for Mobile Submissions)
CREATE TABLE IF NOT EXISTS field_records (
  record_id UUID PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('Lagos', 'Kano', 'Osun')),
  lga VARCHAR(50) NOT NULL,
  ward VARCHAR(50) NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL CHECK (latitude >= 4.0 AND latitude <= 14.0),
  longitude NUMERIC(9, 6) NOT NULL CHECK (longitude >= 2.5 AND longitude <= 15.0),
  location GEOMETRY(Point, 4326),
  gps_accuracy_m NUMERIC(6, 2) CHECK (gps_accuracy_m IS NULL OR gps_accuracy_m <= 50.0),
  collection_date DATE NOT NULL,
  species VARCHAR(50) NOT NULL CHECK (species IN ('An. gambiae s.s.', 'An. coluzzii', 'An. arabiensis', 'An. funestus')),
  insecticide VARCHAR(50) NOT NULL CHECK (insecticide IN ('Permethrin', 'Deltamethrin', 'Alphacypermethrin', 'Pirimiphos-methyl')),
  n_exposed INTEGER NOT NULL CHECK (n_exposed >= 1 AND n_exposed <= 500),
  n_dead INTEGER NOT NULL CHECK (n_dead >= 0 AND n_dead <= n_exposed),
  mortality_pct NUMERIC(5, 1),
  who_class VARCHAR(30) CHECK (who_class IN ('Susceptible', 'Possible resistance', 'Resistant')),
  larval_density INTEGER NOT NULL CHECK (larval_density >= 0),
  urban SMALLINT NOT NULL CHECK (urban IN (0, 1)),
  irs_covered SMALLINT NOT NULL CHECK (irs_covered IN (0, 1)),
  itn_use_pct NUMERIC(5, 1) NOT NULL CHECK (itn_use_pct >= 0.0 AND itn_use_pct <= 100.0),
  captured_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(30) DEFAULT 'synced' CHECK (status IN ('synced', 'synced_with_flags', 'enrichment_pending')),
  
  -- Server Covariate Enrichments (optional/null for new field entries)
  rainfall_mm NUMERIC(7, 2) CHECK (rainfall_mm IS NULL OR (rainfall_mm >= 0.0 AND rainfall_mm <= 1500.0)),
  temp_c NUMERIC(5, 2) CHECK (temp_c IS NULL OR (temp_c >= 10.0 AND temp_c <= 50.0)),
  ndvi NUMERIC(6, 4),
  elevation_m NUMERIC(7, 2),
  dist_water_km NUMERIC(6, 2),
  slide_positivity_pct NUMERIC(5, 2) CHECK (slide_positivity_pct IS NULL OR (slide_positivity_pct >= 0.0 AND slide_positivity_pct <= 100.0)),
  high_risk SMALLINT CHECK (high_risk IS NULL OR high_risk IN (0, 1)),
  
  raw_payload JSONB
);

-- Spatial GiST Index for PostGIS queries
CREATE INDEX IF NOT EXISTS idx_field_records_location ON field_records USING GIST (location);

-- B-Tree indexes for fast query filtering
CREATE INDEX IF NOT EXISTS idx_field_records_state_lga ON field_records (state, lga);
CREATE INDEX IF NOT EXISTS idx_field_records_collection_date ON field_records (collection_date);
CREATE INDEX IF NOT EXISTS idx_field_records_user_id ON field_records (user_id);

-- 4. Validation Results Table (Audit trail of every rule fired)
CREATE TABLE IF NOT EXISTS validation_results (
  id BIGSERIAL PRIMARY KEY,
  record_id UUID REFERENCES field_records(record_id) ON DELETE CASCADE,
  rule_id VARCHAR(50) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('Block', 'Warn')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_results_record_id ON validation_results (record_id);

-- 5. Sync Batches Table (Audit log of every device sync payload and outcome)
CREATE TABLE IF NOT EXISTS sync_batches (
  batch_id UUID PRIMARY KEY,
  device_user_id VARCHAR(50),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  n_records INTEGER NOT NULL,
  n_accepted INTEGER NOT NULL,
  n_rejected INTEGER NOT NULL,
  payload JSONB NOT NULL,
  results JSONB NOT NULL
);

-- 6. Early-Warning Alerts Table (Loaded from outputs/alerts.csv)
CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(80) PRIMARY KEY, -- state|lga|ym
  state VARCHAR(20) NOT NULL CHECK (state IN ('Lagos', 'Kano', 'Osun')),
  lga VARCHAR(50) NOT NULL,
  month VARCHAR(10) NOT NULL, -- YYYY-MM
  n_records INTEGER NOT NULL,
  mean_risk NUMERIC(5, 3) NOT NULL,
  tier VARCHAR(10) NOT NULL CHECK (tier IN ('ALERT', 'WARNING', 'WATCH')),
  pyrethroid_resistance_flag BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(50),
  acknowledged_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_state ON alerts (state);
CREATE INDEX IF NOT EXISTS idx_alerts_tier ON alerts (tier);
CREATE INDEX IF NOT EXISTS idx_alerts_month ON alerts (month);

-- 7. Risk Predictions / Spatial Map Layer Table (Loaded from outputs/risk_predictions.csv)
CREATE TABLE IF NOT EXISTS risk_points (
  record_id VARCHAR(50) PRIMARY KEY,
  state VARCHAR(20) NOT NULL,
  lga VARCHAR(50) NOT NULL,
  ward VARCHAR(50) NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  location GEOMETRY(Point, 4326),
  collection_date DATE NOT NULL,
  p_high NUMERIC(5, 3) NOT NULL,
  tier VARCHAR(10) NOT NULL CHECK (tier IN ('ALERT', 'WARNING', 'WATCH'))
);

CREATE INDEX IF NOT EXISTS idx_risk_points_location ON risk_points USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_risk_points_state ON risk_points (state);
