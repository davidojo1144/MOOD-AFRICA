import { validateRecord } from '../src/services/validation/validator';
import { calculateMortalityAndClass } from '../src/services/validation/constants';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running WHO Tube-Test Class Edge Case Tests ---');
{
  // 89.9 is Resistant
  const r899 = calculateMortalityAndClass(1000, 899);
  assert(r899.mortalityPct === 89.9, `Expected 89.9%, got ${r899.mortalityPct}`);
  assert(r899.whoClass === 'Resistant', `Expected Resistant, got ${r899.whoClass}`);
  console.log('✓ 89.9% -> Resistant');

  // 90.0 is Possible resistance
  const r900 = calculateMortalityAndClass(100, 90);
  assert(r900.mortalityPct === 90.0, `Expected 90.0%, got ${r900.mortalityPct}`);
  assert(
    r900.whoClass === 'Possible resistance',
    `Expected Possible resistance, got ${r900.whoClass}`,
  );
  console.log('✓ 90.0% -> Possible resistance');

  // 97.9 is Possible resistance
  const r979 = calculateMortalityAndClass(1000, 979);
  assert(r979.mortalityPct === 97.9, `Expected 97.9%, got ${r979.mortalityPct}`);
  assert(
    r979.whoClass === 'Possible resistance',
    `Expected Possible resistance, got ${r979.whoClass}`,
  );
  console.log('✓ 97.9% -> Possible resistance');

  // 98.0 is Susceptible
  const r980 = calculateMortalityAndClass(100, 98);
  assert(r980.mortalityPct === 98.0, `Expected 98.0%, got ${r980.mortalityPct}`);
  assert(r980.whoClass === 'Susceptible', `Expected Susceptible, got ${r980.whoClass}`);
  console.log('✓ 98.0% -> Susceptible');

  // 100.0 is Susceptible
  const r100 = calculateMortalityAndClass(100, 100);
  assert(r100.mortalityPct === 100.0, `Expected 100.0%, got ${r100.mortalityPct}`);
  assert(r100.whoClass === 'Susceptible', `Expected Susceptible, got ${r100.whoClass}`);
  console.log('✓ 100.0% -> Susceptible');
}

console.log('\n--- Running GPS Accuracy Edge Case Tests (10, 10.1, 50, 50.1 m) ---');
{
  const baseValid = {
    record_id: 'test-1',
    state: 'Osun',
    lga: 'Osogbo',
    ward: 'Osogbo Ward 1',
    latitude: 7.77,
    longitude: 4.56,
    collection_date: '2026-10-07',
    species: 'An. gambiae s.s.',
    insecticide: 'Permethrin',
    n_exposed: 100,
    n_dead: 95,
    itn_use_pct: 70,
  };

  // 10 m: Accept without warnings or errors
  const fix10 = validateRecord({ ...baseValid, gps_accuracy_m: 10 }, { mode: 'device' });
  assert(!fix10.ruleFlags.GPS_accuracy_poor, '10 m should NOT flag GPS_accuracy_poor');
  assert(!fix10.ruleFlags.GPS_accuracy_unusable, '10 m should NOT flag GPS_accuracy_unusable');
  assert(fix10.isValid, '10 m record should be valid to save');
  console.log('✓ 10.0 m -> Accepted cleanly (no warnings, no block)');

  // 10.1 m: Warning (GPS_accuracy_poor), but can still save (isValid = true)
  const fix101 = validateRecord({ ...baseValid, gps_accuracy_m: 10.1 }, { mode: 'device' });
  assert(fix101.ruleFlags.GPS_accuracy_poor, '10.1 m should flag GPS_accuracy_poor');
  assert(!fix101.ruleFlags.GPS_accuracy_unusable, '10.1 m should NOT flag GPS_accuracy_unusable');
  assert(fix101.isValid, '10.1 m record should still be valid to save (Warn only)');
  assert(fix101.hasWarnings, '10.1 m should have warnings');
  console.log('✓ 10.1 m -> Warn (GPS_accuracy_poor), allows saving');

  // 50 m: Warning (GPS_accuracy_poor), can still save (isValid = true)
  const fix50 = validateRecord({ ...baseValid, gps_accuracy_m: 50 }, { mode: 'device' });
  assert(fix50.ruleFlags.GPS_accuracy_poor, '50.0 m should flag GPS_accuracy_poor');
  assert(!fix50.ruleFlags.GPS_accuracy_unusable, '50.0 m should NOT flag GPS_accuracy_unusable');
  assert(fix50.isValid, '50.0 m record should still be valid to save (Warn only)');
  console.log('✓ 50.0 m -> Warn (GPS_accuracy_poor), allows saving');

  // 50.1 m: Block (GPS_accuracy_unusable), cannot save (isValid = false)
  const fix501 = validateRecord({ ...baseValid, gps_accuracy_m: 50.1 }, { mode: 'device' });
  assert(!fix501.ruleFlags.GPS_accuracy_poor, '50.1 m should NOT flag poor');
  assert(fix501.ruleFlags.GPS_accuracy_unusable, '50.1 m MUST flag GPS_accuracy_unusable');
  assert(!fix501.isValid, '50.1 m record MUST be blocked from saving');
  console.log('✓ 50.1 m -> Blocked (GPS_accuracy_unusable), cannot be saved');

  // null/missing accuracy: Block (GPS_accuracy_unusable)
  const fixNull = validateRecord({ ...baseValid, gps_accuracy_m: null }, { mode: 'device' });
  assert(fixNull.ruleFlags.GPS_accuracy_unusable, 'null accuracy MUST flag GPS_accuracy_unusable');
  assert(!fixNull.isValid, 'null accuracy record MUST be blocked from saving');
  console.log('✓ Missing accuracy -> Blocked (GPS_accuracy_unusable)');
}

console.log('\n--- Running LGA Far Distance Check (Ife Central with Osogbo coords) ---');
{
  // Osogbo coordinates: (7.77, 4.56)
  // Distance to Ife Central (7.48, 4.56): ~32 km (> 25 km threshold)
  const farRec = validateRecord(
    {
      record_id: 'test-far',
      state: 'Osun',
      lga: 'Ife Central',
      ward: 'Ife Central Ward 1',
      latitude: 7.77, // Osogbo coordinates
      longitude: 4.56,
      gps_accuracy_m: 6.5,
      collection_date: '2026-10-07',
      species: 'An. gambiae s.s.',
      insecticide: 'Permethrin',
      n_exposed: 100,
      n_dead: 95,
      itn_use_pct: 70,
    },
    { mode: 'device' },
  );

  assert(
    farRec.ruleFlags.GPS_far_from_lga,
    'Ife Central with Osogbo coords MUST flag GPS_far_from_lga',
  );
  assert(farRec.isValid, 'GPS_far_from_lga is a Warn rule, so record is still savable');
  assert(farRec.hasWarnings, 'Should have warnings for distance');
  console.log('✓ Ife Central with Osogbo coordinates -> Warns GPS_far_from_lga (~32 km)');
}

console.log('\nALL UNIT TESTS PASSED SUCCESSFULLY! ✓');
