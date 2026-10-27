import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { AlertTierItem, FieldRecord, ValidationErrorItem } from '../src/types/vecdim';
import { validateRecord } from '../src/services/validation/validator';
import { calculateMortalityAndClass } from '../src/services/validation/constants';

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/vecdim';

const FALLBACK_FILE = path.resolve(__dirname, 'data/vecdim_db_store.json');

export interface BatchItemResult {
  record_id: string;
  status: 'accepted' | 'accepted_with_flags' | 'rejected' | 'already_received';
  flags: ValidationErrorItem[];
  errors: ValidationErrorItem[];
}

export class VecdimDatabase {
  private pool: Pool | null = null;
  public isPgConnected = false;

  // Embedded storage fallback
  private store: {
    users: Record<string, any>;
    records: Record<string, any>;
    validationResults: any[];
    syncBatches: any[];
    alerts: Record<string, AlertTierItem>;
    riskPoints: any[];
  } = {
    users: {},
    records: {},
    validationResults: [],
    syncBatches: [],
    alerts: {},
    riskPoints: [],
  };

  async init(): Promise<void> {
    // Attempt connecting to PostgreSQL
    try {
      this.pool = new Pool({
        connectionString: DB_URL,
        connectionTimeoutMillis: 2000,
      });
      const client = await this.pool.connect();
      client.release();
      this.isPgConnected = true;
      console.log('✓ Connected to PostgreSQL + PostGIS database.');
      await this.runMigrations();
    } catch {
      this.isPgConnected = false;
      this.pool = null;
      console.log(
        'ℹ PostgreSQL connection unavailable. Operating in persistent embedded storage mode.',
      );
      this.loadFallbackStore();
    }

    // Auto-seed if empty
    await this.seed();
  }

  private loadFallbackStore(): void {
    try {
      if (fs.existsSync(FALLBACK_FILE)) {
        const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
        this.store = JSON.parse(raw);
      } else {
        fs.mkdirSync(path.dirname(FALLBACK_FILE), { recursive: true });
        this.persistFallbackStore();
      }
    } catch (e) {
      console.error('Error loading fallback store', e);
    }
  }

  private persistFallbackStore(): void {
    try {
      fs.mkdirSync(path.dirname(FALLBACK_FILE), { recursive: true });
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(this.store, null, 2));
    } catch (e) {
      console.error('Error persisting fallback store', e);
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.pool || !this.isPgConnected) return;
    const migrationFile = path.resolve(__dirname, 'migrations/001_initial_schema.sql');
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf-8');
      await this.pool.query(sql);
      console.log('✓ Migrations executed successfully.');
    }
  }

  async seed(): Promise<void> {
    const alertsCsv = path.resolve(__dirname, '../VECDIM_Candidate_Pack/outputs/alerts.csv');
    const usersCsv = path.resolve(__dirname, '../VECDIM_Candidate_Pack/data/demo_users.csv');
    const cleanCsv = path.resolve(__dirname, '../VECDIM_Candidate_Pack/outputs/cleaned_data.csv');
    const riskCsv = path.resolve(
      __dirname,
      '../VECDIM_Candidate_Pack/outputs/risk_predictions.csv',
    );

    // Seed Demo Users
    if (fs.existsSync(usersCsv)) {
      const usersData = this.parseCsv(fs.readFileSync(usersCsv, 'utf-8'));
      for (const u of usersData) {
        const userId = u.user_id || '';
        const name = u.name || '';
        const role = u.role || 'field';
        const state = u.state || null;
        if (this.isPgConnected && this.pool) {
          await this.pool.query(
            `INSERT INTO users (user_id, name, role, state)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId, name, role, state],
          );
        } else {
          this.store.users[userId] = { user_id: userId, name, role, state };
        }
      }
    }

    // Seed Alerts from outputs/alerts.csv
    if (fs.existsSync(alertsCsv)) {
      const alertData = this.parseCsv(fs.readFileSync(alertsCsv, 'utf-8'));
      for (const a of alertData) {
        const state = a.state || '';
        const lga = a.lga || '';
        const ym = a.ym || '';
        const id = `${state}|${lga}|${ym}`;
        const tierItem: AlertTierItem = {
          id,
          state: state as any,
          lga,
          month: ym,
          n_records: parseInt(a.n || '0', 10),
          mean_risk: parseFloat(a.mean_p_high || '0'),
          tier: (a.alert || 'WATCH') as any,
          pyrethroid_resistance_flag: a.pyrethroid_resistance_flag?.toUpperCase() === 'TRUE',
        };

        if (this.isPgConnected && this.pool) {
          await this.pool.query(
            `INSERT INTO alerts (id, state, lga, month, n_records, mean_risk, tier, pyrethroid_resistance_flag)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            [
              tierItem.id,
              tierItem.state,
              tierItem.lga,
              tierItem.month,
              tierItem.n_records,
              tierItem.mean_risk,
              tierItem.tier,
              tierItem.pyrethroid_resistance_flag,
            ],
          );
        } else {
          this.store.alerts[id] = tierItem;
        }
      }
    }

    // Seed Clean Records
    if (fs.existsSync(cleanCsv)) {
      const cleanData = this.parseCsv(fs.readFileSync(cleanCsv, 'utf-8'));
      for (const r of cleanData) {
        const recordId = r.record_id || '';
        const lat = parseFloat(r.latitude || '0');
        const lon = parseFloat(r.longitude || '0');
        if (this.isPgConnected && this.pool) {
          await this.pool.query(
            `INSERT INTO field_records (
              record_id, state, lga, ward, latitude, longitude, location,
              collection_date, species, insecticide, n_exposed, n_dead,
              mortality_pct, larval_density, urban, irs_covered, itn_use_pct,
              rainfall_mm, temp_c, ndvi, elevation_m, dist_water_km,
              slide_positivity_pct, high_risk, captured_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326),
              $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
            ) ON CONFLICT (record_id) DO NOTHING`,
            [
              recordId,
              r.state || '',
              r.lga || '',
              r.ward || '',
              lat,
              lon,
              r.collection_date || '',
              r.species || '',
              r.insecticide || '',
              parseInt(r.n_exposed || '0', 10),
              parseInt(r.n_dead || '0', 10),
              parseFloat(r.mortality_pct || '0'),
              parseInt(r.larval_density || '0', 10),
              parseInt(r.urban || '0', 10),
              parseInt(r.irs_covered || '0', 10),
              parseFloat(r.itn_use_pct || '0'),
              r.rainfall_mm ? parseFloat(r.rainfall_mm) : null,
              r.temp_c ? parseFloat(r.temp_c) : null,
              r.ndvi ? parseFloat(r.ndvi) : null,
              r.elevation_m ? parseFloat(r.elevation_m) : null,
              r.dist_water_km ? parseFloat(r.dist_water_km) : null,
              r.slide_positivity_pct ? parseFloat(r.slide_positivity_pct) : null,
              r.high_risk ? parseInt(r.high_risk, 10) : null,
              `${r.collection_date || '2026-10-07'}T12:00:00Z`,
            ],
          );
        } else {
          this.store.records[recordId] = {
            ...r,
            latitude: lat,
            longitude: lon,
            status: 'synced',
          };
        }
      }
    }

    // Seed Risk Predictions
    if (fs.existsSync(riskCsv)) {
      const riskData = this.parseCsv(fs.readFileSync(riskCsv, 'utf-8'));
      for (const rp of riskData) {
        const recordId = rp.record_id || '';
        const lat = parseFloat(rp.latitude || '0');
        const lon = parseFloat(rp.longitude || '0');
        const pHigh = parseFloat(rp.p_high || '0');
        if (this.isPgConnected && this.pool) {
          await this.pool.query(
            `INSERT INTO risk_points (record_id, state, lga, ward, latitude, longitude, location, collection_date, p_high, tier)
             VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326), $7, $8, $9)
             ON CONFLICT (record_id) DO NOTHING`,
            [
              recordId,
              rp.state || '',
              rp.lga || '',
              rp.ward || '',
              lat,
              lon,
              rp.collection_date || '',
              pHigh,
              rp.tier || 'WATCH',
            ],
          );
        } else {
          this.store.riskPoints.push({
            ...rp,
            latitude: lat,
            longitude: lon,
            p_high: pHigh,
          });
        }
      }
    }

    if (!this.isPgConnected) {
      this.persistFallbackStore();
    }
    console.log('✓ Seeding complete. Alerts, clean records, and demo users loaded.');
  }

  async processBatch(records: any[], userId?: string): Promise<{ results: BatchItemResult[] }> {
    const results: BatchItemResult[] = [];
    let nAccepted = 0;
    let nRejected = 0;

    for (const rec of records) {
      const recordId = rec.record_id;

      // 1. Check if record_id was already accepted
      let isAlreadyAccepted = false;
      if (this.isPgConnected && this.pool) {
        const checkRes = await this.pool.query(
          'SELECT record_id, status FROM field_records WHERE record_id = $1',
          [recordId],
        );
        isAlreadyAccepted =
          checkRes.rowCount !== null &&
          checkRes.rowCount > 0 &&
          checkRes.rows[0].status !== 'rejected';
      } else {
        const existing = this.store.records[recordId];
        isAlreadyAccepted = existing && existing.status !== 'rejected';
      }

      if (isAlreadyAccepted) {
        results.push({
          record_id: recordId,
          status: 'already_received',
          flags: [],
          errors: [],
        });
        nAccepted++;
        continue;
      }

      // 2. Validate on server (re-running all rules)
      const val = validateRecord(rec, { mode: 'server' });

      if (!val.isValid) {
        // Rejected: log audit, but DO NOT store into field_records
        results.push({
          record_id: recordId,
          status: 'rejected',
          flags: val.flags,
          errors: val.errors,
        });
        nRejected++;
        continue;
      }

      // 3. Accepted or accepted_with_flags: Store in its own transaction/savepoint
      const { mortalityPct, whoClass } = calculateMortalityAndClass(
        parseInt(rec.n_exposed, 10),
        parseInt(rec.n_dead, 10),
      );

      const status = val.hasWarnings ? 'accepted_with_flags' : 'accepted';
      const dbStatus = val.hasWarnings ? 'synced_with_flags' : 'synced';

      const lat = parseFloat(rec.latitude);
      const lon = parseFloat(rec.longitude);

      if (this.isPgConnected && this.pool) {
        const client = await this.pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            `INSERT INTO field_records (
              record_id, user_id, state, lga, ward, latitude, longitude, location,
              gps_accuracy_m, collection_date, species, insecticide, n_exposed, n_dead,
              mortality_pct, who_class, larval_density, urban, irs_covered, itn_use_pct,
              captured_at, status, raw_payload
            ) VALUES (
              $1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326),
              $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            ) ON CONFLICT (record_id) DO UPDATE SET
              state = EXCLUDED.state,
              lga = EXCLUDED.lga,
              ward = EXCLUDED.ward,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              location = EXCLUDED.location,
              gps_accuracy_m = EXCLUDED.gps_accuracy_m,
              collection_date = EXCLUDED.collection_date,
              species = EXCLUDED.species,
              insecticide = EXCLUDED.insecticide,
              n_exposed = EXCLUDED.n_exposed,
              n_dead = EXCLUDED.n_dead,
              mortality_pct = EXCLUDED.mortality_pct,
              who_class = EXCLUDED.who_class,
              larval_density = EXCLUDED.larval_density,
              urban = EXCLUDED.urban,
              irs_covered = EXCLUDED.irs_covered,
              itn_use_pct = EXCLUDED.itn_use_pct,
              status = EXCLUDED.status,
              received_at = NOW()`,
            [
              recordId,
              userId || null,
              rec.state,
              rec.lga,
              rec.ward,
              lat,
              lon,
              rec.gps_accuracy_m ? parseFloat(rec.gps_accuracy_m) : null,
              rec.collection_date,
              rec.species,
              rec.insecticide,
              parseInt(rec.n_exposed, 10),
              parseInt(rec.n_dead, 10),
              mortalityPct,
              whoClass,
              parseInt(rec.larval_density, 10) || 0,
              rec.urban ? 1 : 0,
              rec.irs_covered ? 1 : 0,
              parseFloat(rec.itn_use_pct) || 0,
              rec.captured_at || new Date().toISOString(),
              dbStatus,
              JSON.stringify(rec),
            ],
          );

          // Save validation flags if any
          for (const flag of val.flags) {
            await client.query(
              `INSERT INTO validation_results (record_id, rule_id, field_name, severity, message)
               VALUES ($1, $2, $3, $4, $5)`,
              [recordId, flag.rule, flag.field, flag.severity, flag.message],
            );
          }

          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Error saving record ${recordId}`, err);
          results.push({
            record_id: recordId,
            status: 'rejected',
            flags: [],
            errors: [
              {
                rule: 'GPS_zero_zero',
                field: 'record',
                message: 'Database transaction error on save',
                severity: 'Block',
              },
            ],
          });
          nRejected++;
          continue;
        } finally {
          client.release();
        }
      } else {
        this.store.records[recordId] = {
          ...rec,
          latitude: lat,
          longitude: lon,
          mortality_pct: mortalityPct,
          who_class: whoClass,
          status: dbStatus,
          user_id: userId,
          received_at: new Date().toISOString(),
        };
      }

      results.push({
        record_id: recordId,
        status,
        flags: val.flags,
        errors: [],
      });
      nAccepted++;
    }

    if (!this.isPgConnected) {
      this.persistFallbackStore();
    }

    return { results };
  }

  async getRecords(filter: {
    state?: string;
    lga?: string;
    since?: string;
    userRole?: string;
    userState?: string;
    userId?: string;
  }): Promise<any[]> {
    if (this.isPgConnected && this.pool) {
      let sql = 'SELECT * FROM field_records WHERE 1=1';
      const params: any[] = [];

      // Role scoping
      if (filter.userRole === 'field' && filter.userId) {
        params.push(filter.userId);
        sql += ` AND user_id = $${params.length}`;
      } else if (filter.userRole === 'vecdim' && filter.userState) {
        params.push(filter.userState);
        sql += ` AND state = $${params.length}`;
      }

      if (filter.state) {
        params.push(filter.state);
        sql += ` AND state = $${params.length}`;
      }
      if (filter.lga) {
        params.push(filter.lga);
        sql += ` AND lga = $${params.length}`;
      }
      if (filter.since) {
        params.push(filter.since);
        sql += ` AND collection_date >= $${params.length}`;
      }

      sql += ' ORDER BY collection_date DESC LIMIT 1000';
      const res = await this.pool.query(sql, params);
      return res.rows;
    }

    // Fallback in-memory
    let all = Object.values(this.store.records);
    if (filter.userRole === 'field' && filter.userId) {
      all = all.filter((r) => r.user_id === filter.userId);
    } else if (filter.userRole === 'vecdim' && filter.userState) {
      all = all.filter((r) => r.state === filter.userState);
    }

    if (filter.state) {
      all = all.filter((r) => r.state.toLowerCase() === filter.state!.toLowerCase());
    }
    if (filter.lga) {
      all = all.filter((r) => r.lga.toLowerCase() === filter.lga!.toLowerCase());
    }
    if (filter.since) {
      all = all.filter((r) => r.collection_date >= filter.since!);
    }
    return all.slice(0, 1000);
  }

  async getAlerts(filter: {
    state?: string;
    lga?: string;
    from?: string;
    to?: string;
    userRole?: string;
    userState?: string;
  }): Promise<AlertTierItem[]> {
    if (this.isPgConnected && this.pool) {
      let sql = 'SELECT * FROM alerts WHERE 1=1';
      const params: any[] = [];

      // Scope: VECDIM only sees their state
      if (filter.userRole === 'vecdim' && filter.userState) {
        params.push(filter.userState);
        sql += ` AND state = $${params.length}`;
      }

      if (filter.state) {
        params.push(filter.state);
        sql += ` AND state = $${params.length}`;
      }
      if (filter.lga) {
        params.push(filter.lga);
        sql += ` AND lga = $${params.length}`;
      }
      if (filter.from) {
        params.push(filter.from);
        sql += ` AND month >= $${params.length}`;
      }
      if (filter.to) {
        params.push(filter.to);
        sql += ` AND month <= $${params.length}`;
      }

      sql += ' ORDER BY month DESC, mean_risk DESC';
      const res = await this.pool.query(sql, params);
      return res.rows.map((r: any) => ({
        id: r.id,
        state: r.state,
        lga: r.lga,
        month: r.month,
        n_records: r.n_records,
        mean_risk: parseFloat(r.mean_risk),
        tier: r.tier,
        pyrethroid_resistance_flag: Boolean(r.pyrethroid_resistance_flag),
        acknowledged: Boolean(r.acknowledged),
        acknowledged_by: r.acknowledged_by,
        acknowledged_at: r.acknowledged_at,
        notes: r.notes,
      }));
    }

    let all = Object.values(this.store.alerts);
    if (filter.userRole === 'vecdim' && filter.userState) {
      all = all.filter((a) => a.state === filter.userState);
    }
    if (filter.state) {
      all = all.filter((a) => a.state.toLowerCase() === filter.state!.toLowerCase());
    }
    if (filter.lga) {
      all = all.filter((a) => a.lga.toLowerCase() === filter.lga!.toLowerCase());
    }
    if (filter.from) {
      all = all.filter((a) => a.month >= filter.from!);
    }
    if (filter.to) {
      all = all.filter((a) => a.month <= filter.to!);
    }
    return all;
  }

  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    notes?: string,
  ): Promise<boolean> {
    const now = new Date().toISOString();
    if (this.isPgConnected && this.pool) {
      const res = await this.pool.query(
        `UPDATE alerts
         SET acknowledged = TRUE, acknowledged_by = $2, acknowledged_at = $3, notes = $4
         WHERE id = $1`,
        [alertId, acknowledgedBy, now, notes || null],
      );
      return (res.rowCount ?? 0) > 0;
    }

    if (this.store.alerts[alertId]) {
      this.store.alerts[alertId]!.acknowledged = true;
      this.store.alerts[alertId]!.acknowledged_by = acknowledgedBy;
      this.store.alerts[alertId]!.acknowledged_at = now;
      this.store.alerts[alertId]!.notes = notes;
      this.persistFallbackStore();
      return true;
    }
    return false;
  }

  async getRiskPoints(bbox?: [number, number, number, number]): Promise<any[]> {
    // bbox: [minLon, minLat, maxLon, maxLat]
    if (this.isPgConnected && this.pool) {
      if (bbox) {
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const res = await this.pool.query(
          `SELECT record_id, state, lga, ward, latitude, longitude, collection_date, p_high, tier
           FROM risk_points
           WHERE location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
           LIMIT 500`,
          [minLon, minLat, maxLon, maxLat],
        );
        return res.rows;
      }
      const res = await this.pool.query(
        'SELECT record_id, state, lga, ward, latitude, longitude, collection_date, p_high, tier FROM risk_points LIMIT 500',
      );
      return res.rows;
    }

    let all = this.store.riskPoints;
    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox;
      all = all.filter(
        (rp) =>
          rp.longitude >= minLon &&
          rp.longitude <= maxLon &&
          rp.latitude >= minLat &&
          rp.latitude <= maxLat,
      );
    }
    return all.slice(0, 500);
  }

  private parseCsv(content: string): Array<Record<string, string>> {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    const headers = lines[0]!.split(',').map((h) => h.replace(/^"|"$/g, '').trim());
    return lines.slice(1).map((line) => {
      const parts = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] ?? '';
      });
      return row;
    });
  }
}

export const db = new VecdimDatabase();
