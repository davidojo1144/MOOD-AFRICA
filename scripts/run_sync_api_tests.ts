import { db } from '../backend/db';
import { FieldRecord } from '../src/types/vecdim';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runSyncAndApiTests() {
  console.log('=====================================================');
  console.log(' VECDIM SYNC & API AUTOMATED TEST SUITE');
  console.log('=====================================================\n');

  await db.init();

  // Test 1: Check Seed Data counts (Item 4: 647 alerts, 86 ALERT, 135 WARNING, 426 WATCH)
  console.log('--- Test 1: Verifying Seed Data & Alert Counts ---');
  const allAlerts = await db.getAlerts({ userRole: 'uniosun' });
  assert(
    allAlerts.length === 647,
    `Expected 647 alerts from outputs/alerts.csv, got ${allAlerts.length}`,
  );
  console.log(`✓ GET /alerts returned exactly ${allAlerts.length} items`);

  const alertCount = allAlerts.filter((a) => a.tier === 'ALERT').length;
  const warningCount = allAlerts.filter((a) => a.tier === 'WARNING').length;
  const watchCount = allAlerts.filter((a) => a.tier === 'WATCH').length;

  assert(alertCount === 86, `Expected 86 ALERT items, got ${alertCount}`);
  assert(warningCount === 135, `Expected 135 WARNING items, got ${warningCount}`);
  assert(watchCount === 426, `Expected 426 WATCH items, got ${watchCount}`);
  console.log(
    `✓ UNIOSUN Tier Counts verified: ${alertCount} ALERT, ${warningCount} WARNING, ${watchCount} WATCH (Total: ${allAlerts.length})`,
  );

  // Test 2: Idempotent Seeding (running seed script a second time changes nothing)
  console.log('\n--- Test 2: Idempotent Seed Check ---');
  await db.seed();
  const alertsAfterReSeed = await db.getAlerts({ userRole: 'uniosun' });
  assert(
    alertsAfterReSeed.length === 647,
    `Re-seeding changed count: expected 647, got ${alertsAfterReSeed.length}`,
  );
  console.log('✓ Running seed script a second time changed nothing (idempotent).');

  // Test 3: Idempotent Uploads (Send the same record twice: server holds one row)
  console.log('\n--- Test 3: Idempotent Record Upload ---');
  const testRecordId = `idemp-${Date.now()}-uuid`;
  const sampleRecord = {
    record_id: testRecordId,
    state: 'Osun',
    lga: 'Osogbo',
    ward: 'Osogbo Ward 1',
    latitude: 7.77,
    longitude: 4.56,
    gps_accuracy_m: 6.5,
    collection_date: '2026-10-07',
    species: 'An. gambiae s.s.',
    insecticide: 'Permethrin',
    n_exposed: 100,
    n_dead: 54,
    larval_density: 4,
    urban: 1,
    irs_covered: 0,
    itn_use_pct: 65,
    captured_at: '2026-10-07T09:14:22Z',
  };

  const batch1 = await db.processBatch([sampleRecord], 'u_field_03');
  assert(
    batch1.results[0]?.status === 'accepted',
    `Expected first upload to be accepted, got ${batch1.results[0]?.status}`,
  );
  console.log('✓ First submission: accepted');

  const batch2 = await db.processBatch([sampleRecord], 'u_field_03');
  assert(
    batch2.results[0]?.status === 'already_received',
    `Expected duplicate upload to return already_received, got ${batch2.results[0]?.status}`,
  );
  console.log('✓ Second submission with same record_id: marked already_received (no duplicates)');

  // Test 4: Partial Failure Handling (1 bad record in a batch of 10)
  console.log('\n--- Test 4: Partial Batch Failure (9 valid, 1 invalid) ---');
  const testRunTime = Date.now();
  const batch10: any[] = [];
  for (let i = 1; i <= 9; i++) {
    batch10.push({
      record_id: `batch-rec-${testRunTime}-${i}-valid`,
      state: 'Osun',
      lga: 'Osogbo',
      ward: `Osogbo Ward ${(i % 6) + 1}`,
      latitude: 7.77,
      longitude: 4.56,
      gps_accuracy_m: 7.0,
      collection_date: '2026-10-07',
      species: 'An. gambiae s.s.',
      insecticide: 'Permethrin',
      n_exposed: 100,
      n_dead: 40 + i,
      larval_density: 3,
      urban: 1,
      irs_covered: 0,
      itn_use_pct: 70,
      captured_at: '2026-10-07T10:00:00Z',
    });
  }

  // 10th record is deliberately invalid: n_dead (120) > n_exposed (100)
  const badRecordId = `bad-rec-${testRunTime}-dead-gt-exposed`;
  batch10.push({
    record_id: badRecordId,
    state: 'Osun',
    lga: 'Osogbo',
    ward: 'Osogbo Ward 2',
    latitude: 7.77,
    longitude: 4.56,
    gps_accuracy_m: 6.0,
    collection_date: '2026-10-07',
    species: 'An. gambiae s.s.',
    insecticide: 'Permethrin',
    n_exposed: 100,
    n_dead: 120, // Invalid!
    larval_density: 3,
    urban: 1,
    irs_covered: 0,
    itn_use_pct: 70,
    captured_at: '2026-10-07T10:00:00Z',
  });

  const batchResult = await db.processBatch(batch10, 'u_field_03');
  const acceptedItems = batchResult.results.filter(
    (r) => r.status === 'accepted' || r.status === 'accepted_with_flags',
  );
  const rejectedItems = batchResult.results.filter((r) => r.status === 'rejected');

  assert(acceptedItems.length === 9, `Expected 9 accepted, got ${acceptedItems.length}`);
  assert(rejectedItems.length === 1, `Expected 1 rejected, got ${rejectedItems.length}`);
  assert(
    rejectedItems[0]?.record_id === badRecordId,
    `Expected rejected record to be ${badRecordId}`,
  );
  assert(
    rejectedItems[0]?.errors[0]?.rule === 'n_dead_gt_n_exposed',
    `Expected n_dead_gt_n_exposed error rule`,
  );
  assert(rejectedItems[0]?.errors[0]?.field === 'n_dead', `Expected error field to be n_dead`);
  console.log('✓ 9 valid records stored successfully without rollback from bad record.');
  console.log(`✓ Bad record rejected with server error: "${rejectedItems[0]?.errors[0]?.message}"`);

  // Test 5: Resubmission under same record_id after correction
  console.log('\n--- Test 5: Correct and Resubmit Rejected Record ---');
  const correctedRecord = {
    ...batch10[9],
    n_dead: 85, // Corrected from 120
  };

  const resubmitResult = await db.processBatch([correctedRecord], 'u_field_03');
  assert(
    resubmitResult.results[0]?.status === 'accepted',
    `Expected corrected resubmission to be accepted, got ${resubmitResult.results[0]?.status}`,
  );
  assert(resubmitResult.results[0]?.record_id === badRecordId, 'Accepted under original record_id');
  console.log('✓ Corrected record accepted under the same record ID on resubmission!');

  // Test 6: Role-based scoping check
  console.log('\n--- Test 6: Role-Based Scoping (Field / VECDIM / UNIOSUN) ---');
  const osunVecdimAlerts = await db.getAlerts({
    userRole: 'vecdim',
    userState: 'Osun',
  });
  const allOsun = osunVecdimAlerts.every((a) => a.state === 'Osun');
  assert(allOsun, 'VECDIM Osun user saw records outside Osun!');
  console.log(
    `✓ VECDIM Osun user strictly confined to Osun state alerts (${osunVecdimAlerts.length} items)`,
  );

  const lagosVecdimAlerts = await db.getAlerts({
    userRole: 'vecdim',
    userState: 'Lagos',
  });
  const allLagos = lagosVecdimAlerts.every((a) => a.state === 'Lagos');
  assert(allLagos, 'VECDIM Lagos user saw records outside Lagos!');
  console.log(
    `✓ VECDIM Lagos user strictly confined to Lagos state alerts (${lagosVecdimAlerts.length} items)`,
  );

  // Test 7: Alert acknowledgment
  console.log('\n--- Test 7: Alert Acknowledgment ---');
  const sampleAlertId = allAlerts[0]!.id;
  const ackSuccess = await db.acknowledgeAlert(
    sampleAlertId,
    'u_vecdim_osun',
    'Field spraying team dispatched.',
  );
  assert(ackSuccess, 'Alert acknowledgment failed');
  const updatedAlerts = await db.getAlerts({ userRole: 'uniosun' });
  const acked = updatedAlerts.find((a) => a.id === sampleAlertId);
  assert(acked?.acknowledged === true, 'Alert was not marked acknowledged');
  assert(acked?.acknowledged_by === 'u_vecdim_osun', 'Acknowledged_by mismatch');
  console.log(
    `✓ Alert ${sampleAlertId} successfully acknowledged by ${acked?.acknowledged_by} with notes.`,
  );

  console.log('\n=====================================================');
  console.log(' ALL SYNC & BACKEND API CHECKS PASSED SUCCESSFULLY! ✓');
  console.log('=====================================================');
}

if (require.main === module) {
  runSyncAndApiTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { runSyncAndApiTests };
