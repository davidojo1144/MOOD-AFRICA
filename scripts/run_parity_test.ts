import * as fs from 'fs';
import * as path from 'path';
import { validateRecord, RecordValidationInput } from '../src/services/validation/validator';
import { RuleId } from '../src/types/vecdim';

const DATA_FILE = path.resolve(
  __dirname,
  '../VECDIM_Candidate_Pack/data/vecdim_dummy_entomology_data.csv',
);
const EXPECTED_FLAGS_FILE = path.resolve(
  __dirname,
  '../VECDIM_Candidate_Pack/outputs/validation_flags_all.csv',
);
const OUTPUT_FILE = path.resolve(
  __dirname,
  '../VECDIM_Candidate_Pack/outputs/parity_test_results.txt',
);

const PARITY_RULES: RuleId[] = [
  'GPS_outside_nigeria',
  'GPS_zero_zero',
  'GPS_state_mismatch',
  'GPS_far_from_lga',
  'n_dead_gt_n_exposed',
  'positivity_out_range',
  'future_date',
  'temp_implausible',
  'rainfall_implausible',
  'duplicate',
  'missing_core',
];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]!).map((h) => h.replace(/^"|"$/g, '').trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    const values = parseCSVLine(line).map((v) => v.replace(/^"|"$/g, '').trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

export function runParityTest(): {
  totalRows: number;
  totalComparisons: number;
  differences: number;
  ruleMatches: Record<string, { matches: number; mismatches: number }>;
} {
  const dataContent = fs.readFileSync(DATA_FILE, 'utf-8');
  const expectedContent = fs.readFileSync(EXPECTED_FLAGS_FILE, 'utf-8');

  const rawRows = parseCSV(dataContent);
  const expectedRows = parseCSV(expectedContent);

  if (rawRows.length !== expectedRows.length) {
    throw new Error(
      `Row count mismatch! Raw rows: ${rawRows.length}, Expected rows: ${expectedRows.length}`,
    );
  }

  // Pre-calculate duplicate key with earliest record_id kept (identical to R logic)
  const indicesSorted = rawRows
    .map((_, i) => i)
    .sort((a, b) => (rawRows[a]!.record_id! > rawRows[b]!.record_id! ? 1 : -1));

  const seenKeys = new Set<string>();
  const isDuplicate = new Array<boolean>(rawRows.length).fill(false);

  for (const idx of indicesSorted) {
    const r = rawRows[idx]!;
    const key = `${r.ward}|${r.collection_date}|${r.species}|${r.insecticide}|${r.n_exposed}|${r.n_dead}`;
    if (seenKeys.has(key)) {
      isDuplicate[idx] = true;
    } else {
      seenKeys.add(key);
    }
  }

  let totalComparisons = 0;
  let differences = 0;
  const ruleMatches: Record<string, { matches: number; mismatches: number }> = {};

  for (const rule of [...PARITY_RULES, 'any_flag']) {
    ruleMatches[rule] = { matches: 0, mismatches: 0 };
  }

  const logLines: string[] = [];
  logLines.push('=====================================================');
  logLines.push(' VECDIM VALIDATION ENGINE PARITY TEST REPORT');
  logLines.push(` Timestamp: ${new Date().toISOString()}`);
  logLines.push(` Benchmark records tested: ${rawRows.length}`);
  logLines.push(' Reference date: 2026-10-08');
  logLines.push('=====================================================\n');

  rawRows.forEach((raw, i) => {
    const exp = expectedRows[i]!;
    if (raw.record_id !== exp.record_id) {
      throw new Error(`Record ID mismatch at row ${i}: ${raw.record_id} vs ${exp.record_id}`);
    }

    const input: RecordValidationInput = {
      record_id: raw.record_id,
      state: raw.state,
      lga: raw.lga,
      ward: raw.ward,
      latitude: raw.latitude,
      longitude: raw.longitude,
      collection_date: raw.collection_date,
      species: raw.species,
      insecticide: raw.insecticide,
      n_exposed: raw.n_exposed,
      n_dead: raw.n_dead,
      larval_density: raw.larval_density,
      urban: raw.urban,
      irs_covered: raw.irs_covered,
      itn_use_pct: raw.itn_use_pct,
      slide_positivity_pct: raw.slide_positivity_pct,
      temp_c: raw.temp_c,
      rainfall_mm: raw.rainfall_mm,
      ndvi: raw.ndvi,
      is_duplicate: isDuplicate[i],
    };

    const res = validateRecord(input, { mode: 'parity', refDate: '2026-10-08' });

    let rowHasMismatch = false;

    for (const rule of PARITY_RULES) {
      totalComparisons++;
      const actualVal = Boolean(res.ruleFlags[rule]);
      const expectedVal = exp[rule]?.toUpperCase() === 'TRUE';

      if (actualVal === expectedVal) {
        ruleMatches[rule]!.matches++;
      } else {
        ruleMatches[rule]!.mismatches++;
        differences++;
        rowHasMismatch = true;
        logLines.push(
          `MISMATCH at ${raw.record_id} for rule [${rule}]: expected ${expectedVal}, got ${actualVal}`,
        );
      }
    }

    // any_flag check
    totalComparisons++;
    const actualAny = PARITY_RULES.some((r) => res.ruleFlags[r]);
    const expectedAny = exp.any_flag?.toUpperCase() === 'TRUE';
    if (actualAny === expectedAny) {
      ruleMatches.any_flag!.matches++;
    } else {
      ruleMatches.any_flag!.mismatches++;
      differences++;
      rowHasMismatch = true;
      logLines.push(
        `MISMATCH at ${raw.record_id} for [any_flag]: expected ${expectedAny}, got ${actualAny}`,
      );
    }
  });

  logLines.push('\nRULE PARITY BREAKDOWN:');
  logLines.push('-----------------------------------------------------');
  for (const [rule, stats] of Object.entries(ruleMatches)) {
    const pct = ((stats.matches / (stats.matches + stats.mismatches)) * 100).toFixed(2);
    logLines.push(
      `${rule.padEnd(25)}: ${stats.matches} matched, ${stats.mismatches} mismatches (${pct}%)`,
    );
  }
  logLines.push('-----------------------------------------------------');
  logLines.push(`TOTAL COMPARISONS : ${totalComparisons}`);
  logLines.push(`TOTAL MISMATCHES  : ${differences}`);
  logLines.push(
    `OVERALL PARITY    : ${(((totalComparisons - differences) / totalComparisons) * 100).toFixed(4)}%`,
  );

  const report = logLines.join('\n');
  console.log(report);
  fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');

  return {
    totalRows: rawRows.length,
    totalComparisons,
    differences,
    ruleMatches,
  };
}

runParityTest();
