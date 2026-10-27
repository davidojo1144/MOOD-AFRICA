import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomModal } from '@/components/common/CustomModal';
import {
  FieldRecord,
  InsecticideName,
  SpeciesName,
  StateName,
  ValidationErrorItem,
} from '@/types/vecdim';
import {
  calculateMortalityAndClass,
  haversineKm,
  INSECTICIDE_OPTIONS,
  LGA_MAX_KM,
  LGA_REFERENCES,
  SPECIES_OPTIONS,
  STATE_BOUNDS,
  STATE_LGAS,
} from '@/services/validation/constants';
import { getCurrentGPSLocation, GPS_SIMULATIONS } from '@/services/location/locationService';
import { generateUUID } from '@/lib/storage';
import { useRecordsStore } from '@/store/recordsStore';
import { haptics } from '@/lib/haptics';
import { showToast } from '@/lib/toast';

interface EntomologyFormProps {
  initialRecord?: FieldRecord | null;
  onSaved?: (record: FieldRecord) => void;
  onCancel?: () => void;
}

export function EntomologyForm({ initialRecord, onSaved, onCancel }: EntomologyFormProps) {
  const { currentUser, saveDraft, discardDraft, saveRecord } = useRecordsStore();

  const isEditing = Boolean(initialRecord);
  const isRejected = initialRecord?.status === 'rejected';

  const defaultState: StateName = currentUser.state ?? 'Osun';
  const defaultLGA = STATE_LGAS[defaultState][0] ?? 'Osogbo';

  const [recordId] = useState<string>(initialRecord?.record_id ?? generateUUID());
  const [state, setState] = useState<StateName>(initialRecord?.state ?? defaultState);
  const [lga, setLga] = useState<string>(initialRecord?.lga ?? defaultLGA);
  const [ward, setWard] = useState<string>(initialRecord?.ward ?? `${defaultLGA} Ward 1`);

  const [latitude, setLatitude] = useState<number | null>(initialRecord?.latitude ?? 7.7712);
  const [longitude, setLongitude] = useState<number | null>(initialRecord?.longitude ?? 4.5623);
  const [accuracy, setAccuracy] = useState<number | null>(initialRecord?.gps_accuracy_m ?? 6.0);

  const [collectionDate, setCollectionDate] = useState<string>(
    initialRecord?.collection_date ?? new Date().toISOString().slice(0, 10),
  );
  const [species, setSpecies] = useState<SpeciesName>(initialRecord?.species ?? 'An. gambiae s.s.');
  const [insecticide, setInsecticide] = useState<InsecticideName>(
    initialRecord?.insecticide ?? 'Permethrin',
  );
  const [nExposed, setNExposed] = useState<string>(
    initialRecord?.n_exposed ? String(initialRecord.n_exposed) : '100',
  );
  const [nDead, setNDead] = useState<string>(
    initialRecord?.n_dead !== undefined ? String(initialRecord.n_dead) : '54',
  );

  const [larvalDensity, setLarvalDensity] = useState<string>(
    initialRecord?.larval_density !== undefined ? String(initialRecord.larval_density) : '5',
  );
  const [urban, setUrban] = useState<number>(initialRecord?.urban ?? 1);
  const [irsCovered, setIrsCovered] = useState<number>(initialRecord?.irs_covered ?? 0);
  const [itnUsePct, setItnUsePct] = useState<string>(
    initialRecord?.itn_use_pct !== undefined ? String(initialRecord.itn_use_pct) : '65',
  );

  const [isFetchingGPS, setIsFetchingGPS] = useState<boolean>(false);
  const [lastAutosaved, setLastAutosaved] = useState<string>('');
  const [formErrors, setFormErrors] = useState<ValidationErrorItem[]>(
    initialRecord?.server_errors ?? [],
  );
  const [formFlags, setFormFlags] = useState<ValidationErrorItem[]>(
    initialRecord?.server_flags ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false);

  // Autosave timer debounce
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Wards available for selected LGA
  const availableWards = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => `${lga} Ward ${i + 1}`);
  }, [lga]);

  // Live mortality & WHO calculation
  const { mortalityPct, whoClass } = useMemo(() => {
    const exposed = parseInt(nExposed, 10) || 0;
    const dead = parseInt(nDead, 10) || 0;
    return calculateMortalityAndClass(exposed, dead);
  }, [nExposed, nDead]);

  // LGA distance check
  const lgaDistanceInfo = useMemo(() => {
    if (latitude === null || longitude === null) return null;
    const ref = LGA_REFERENCES.find(
      (r) =>
        r.state.toLowerCase() === state.toLowerCase() && r.lga.toLowerCase() === lga.toLowerCase(),
    );
    if (!ref) return null;
    const km = haversineKm(latitude, longitude, ref.refLat, ref.refLon);
    return {
      distanceKm: Math.round(km * 10) / 10,
      isFar: km > LGA_MAX_KM,
      refName: ref.lga,
    };
  }, [latitude, longitude, state, lga]);

  // State bounds check
  const isOutsideStateBounds = useMemo(() => {
    if (latitude === null || longitude === null) return false;
    const b = STATE_BOUNDS[state];
    return (
      latitude < b.latMin || latitude > b.latMax || longitude < b.lonMin || longitude > b.lonMax
    );
  }, [latitude, longitude, state]);

  // Continuous Autosave
  useEffect(() => {
    if (isEditing) return; // Don't overwrite existing completed record draft

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      const draftData: Partial<FieldRecord> = {
        record_id: recordId,
        state,
        lga,
        ward,
        latitude,
        longitude,
        gps_accuracy_m: accuracy,
        collection_date: collectionDate,
        species,
        insecticide,
        n_exposed: parseInt(nExposed, 10) || 0,
        n_dead: parseInt(nDead, 10) || 0,
        larval_density: parseInt(larvalDensity, 10) || 0,
        urban,
        irs_covered: irsCovered,
        itn_use_pct: parseFloat(itnUsePct) || 0,
        captured_at: new Date().toISOString(),
        status: 'draft',
      };

      void saveDraft(draftData);
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastAutosaved(timeStr);
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    recordId,
    state,
    lga,
    ward,
    latitude,
    longitude,
    accuracy,
    collectionDate,
    species,
    insecticide,
    nExposed,
    nDead,
    larvalDensity,
    urban,
    irsCovered,
    itnUsePct,
    isEditing,
    saveDraft,
  ]);

  // GPS Recapture
  const handleRecaptureGPS = async () => {
    setIsFetchingGPS(true);
    const loc = await getCurrentGPSLocation();
    setIsFetchingGPS(false);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setAccuracy(loc.accuracy);
  };

  // Preset GPS simulation triggers
  const applySimulation = (simKey: keyof typeof GPS_SIMULATIONS) => {
    const sim = GPS_SIMULATIONS[simKey];
    haptics.selection();
    setLatitude(sim.latitude);
    setLongitude(sim.longitude);
    setAccuracy(sim.accuracy);
    if (simKey === 'osogboPointForIfeCentral') {
      setState('Osun');
      setLga('Ife Central');
      setWard('Ife Central Ward 1');
    }
    showToast.info('GPS Simulation Active', `Accuracy: ±${sim.accuracy}m`);
  };

  // Submit Handler
  const handleSave = async () => {
    setIsSubmitting(true);

    const recordToSave: FieldRecord = {
      record_id: recordId,
      state,
      lga,
      ward,
      latitude,
      longitude,
      gps_accuracy_m: accuracy,
      collection_date: collectionDate,
      species,
      insecticide,
      n_exposed: parseInt(nExposed, 10) || 0,
      n_dead: parseInt(nDead, 10) || 0,
      larval_density: parseInt(larvalDensity, 10) || 0,
      urban,
      irs_covered: irsCovered,
      itn_use_pct: parseFloat(itnUsePct) || 0,
      captured_at: initialRecord?.captured_at ?? new Date().toISOString(),
      status: 'pending_sync',
    };

    const result = await saveRecord(recordToSave);
    setIsSubmitting(false);

    if (!result.success) {
      setFormErrors(result.errors);
      setFormFlags(result.flags);
      haptics.error();
      showToast.error('Validation Blocked', result.errors[0]?.message);
      setIsValidationModalOpen(true);
    } else {
      setFormErrors([]);
      setFormFlags(result.flags);
      haptics.success();
      showToast.success(
        'Record Saved Offline',
        result.flags.length > 0
          ? 'Saved to outbox with warnings.'
          : 'Ready in outbox for automatic sync.',
      );
      onSaved?.(recordToSave);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="flex-1 bg-background px-4 py-4"
      keyboardShouldPersistTaps="handled">
      {/* Header Banner */}
      <View className="mb-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-bold uppercase tracking-wider text-primary">
              {isEditing ? 'Editing Record' : 'New Entomology Record'}
            </Text>
            <Text className="mt-1 font-mono text-xs text-muted">ID: {recordId}</Text>
          </View>
          {!isEditing && lastAutosaved && (
            <View className="flex-row items-center rounded-full bg-emerald-50 px-2.5 py-1">
              <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
              <Text className="text-xs text-emerald-700">Autosaved {lastAutosaved}</Text>
            </View>
          )}
        </View>

        {isRejected && (
          <View className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <Text className="font-semibold text-rose-900">Needs Attention (Server Rejected)</Text>
            <Text className="mt-1 text-xs text-rose-700">
              Update the highlighted fields below and tap Resubmit.
            </Text>
          </View>
        )}
      </View>

      {/* Location Hierarchy */}
      <View className="mb-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
          1. Location Selection
        </Text>

        {/* State Selection */}
        <Text className="mb-1 text-xs font-semibold text-muted">State *</Text>
        <View className="mb-3 flex-row gap-2">
          {(['Lagos', 'Kano', 'Osun'] as StateName[]).map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => {
                setState(st);
                const newLga = STATE_LGAS[st][0]!;
                setLga(newLga);
                setWard(`${newLga} Ward 1`);
              }}
              className={`flex-1 items-center rounded-lg border py-2.5 ${
                state === st ? 'border-primary bg-primary-50' : 'border-border bg-surface'
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  state === st ? 'text-primary' : 'text-foreground'
                }`}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LGA Selection */}
        <Text className="mb-1 text-xs font-semibold text-muted">Local Government Area (LGA) *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 flex-row">
          {STATE_LGAS[state].map((lgaItem) => (
            <TouchableOpacity
              key={lgaItem}
              onPress={() => {
                setLga(lgaItem);
                setWard(`${lgaItem} Ward 1`);
              }}
              className={`mr-2 rounded-lg border px-3 py-2 ${
                lga === lgaItem ? 'border-primary bg-primary' : 'border-border bg-surface'
              }`}>
              <Text
                className={`text-xs font-semibold ${
                  lga === lgaItem ? 'text-white' : 'text-foreground'
                }`}>
                {lgaItem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Ward Selection */}
        <Text className="mb-1 text-xs font-semibold text-muted">Ward *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {availableWards.map((w) => (
            <TouchableOpacity
              key={w}
              onPress={() => setWard(w)}
              className={`mr-2 rounded-lg border px-3 py-1.5 ${
                ward === w ? 'border-secondary bg-secondary' : 'border-border bg-surface'
              }`}>
              <Text
                className={`text-xs ${
                  ward === w ? 'font-semibold text-white' : 'text-foreground'
                }`}>
                {w}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* GPS Capture Card */}
      <View className="mb-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-bold uppercase tracking-wider text-foreground">
            2. GPS Capture
          </Text>
          <TouchableOpacity
            onPress={handleRecaptureGPS}
            disabled={isFetchingGPS}
            className="flex-row items-center rounded-lg bg-primary px-3 py-1.5">
            {isFetchingGPS && <ActivityIndicator size="small" color="#fff" className="mr-1.5" />}
            <Text className="text-xs font-semibold text-white">
              {isFetchingGPS ? 'Reading GPS...' : 'Recapture'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Coordinates Display */}
        <View className="rounded-lg bg-background p-3">
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Latitude: {latitude?.toFixed(5) ?? 'N/A'}</Text>
            <Text className="text-xs text-muted">Longitude: {longitude?.toFixed(5) ?? 'N/A'}</Text>
          </View>

          {/* GPS Accuracy Meter & Rules */}
          <View className="mt-3">
            {accuracy !== null ? (
              <View
                className={`rounded-lg border p-2.5 ${
                  accuracy <= 10
                    ? 'border-emerald-200 bg-emerald-50'
                    : accuracy <= 50
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-rose-200 bg-rose-50'
                }`}>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-xs font-bold ${
                      accuracy <= 10
                        ? 'text-emerald-800'
                        : accuracy <= 50
                          ? 'text-amber-800'
                          : 'text-rose-800'
                    }`}>
                    GPS Accuracy: {accuracy.toFixed(1)} m
                  </Text>
                  <Text
                    className={`text-[10px] font-semibold uppercase ${
                      accuracy <= 10
                        ? 'text-emerald-700'
                        : accuracy <= 50
                          ? 'text-amber-700'
                          : 'text-rose-700'
                    }`}>
                    {accuracy <= 10
                      ? 'Optimal (≤10 m)'
                      : accuracy <= 50
                        ? 'Warning (>10 m)'
                        : 'Unusable (>50 m)'}
                  </Text>
                </View>
                <Text
                  className={`mt-1 text-xs ${
                    accuracy <= 10
                      ? 'text-emerald-700'
                      : accuracy <= 50
                        ? 'text-amber-700'
                        : 'text-rose-700'
                  }`}>
                  {accuracy <= 10
                    ? 'High precision fix. Ready for submission.'
                    : accuracy <= 50
                      ? 'Waiting for better GPS signal. Move to open sky. (Savable with warning)'
                      : 'Unusable accuracy. Cannot be saved. Move to open sky and recapture.'}
                </Text>
              </View>
            ) : (
              <View className="rounded-lg border border-rose-200 bg-rose-50 p-2.5">
                <Text className="text-xs font-semibold text-rose-800">No GPS Accuracy Signal</Text>
                <Text className="text-xs text-rose-600">
                  Phone did not provide accuracy radius. Record cannot be saved.
                </Text>
              </View>
            )}

            {/* LGA Distance Warning */}
            {lgaDistanceInfo?.isFar && (
              <View className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
                <Text className="text-xs font-bold text-amber-900">
                  ⚠️ Far from chosen LGA ({lgaDistanceInfo.distanceKm} km)
                </Text>
                <Text className="mt-0.5 text-xs text-amber-800">
                  Your coordinates are {lgaDistanceInfo.distanceKm} km from{' '}
                  {lgaDistanceInfo.refName} reference centre (limit: {LGA_MAX_KM} km). Check LGA
                  selection or recapture.
                </Text>
              </View>
            )}

            {/* State Bounds Error */}
            {isOutsideStateBounds && (
              <View className="mt-2 rounded-lg border border-rose-300 bg-rose-50 p-2.5">
                <Text className="text-xs font-bold text-rose-900">⛔ State Boundary Mismatch</Text>
                <Text className="mt-0.5 text-xs text-rose-800">
                  Coordinates do not fall within {state} boundaries. Blocked.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* GPS Simulation / Assessment Testing Controls */}
        <View className="mt-3 border-t border-border pt-3">
          <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            Assessment Test Fix Presets:
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            <TouchableOpacity
              onPress={() => applySimulation('optimal6m')}
              className="rounded bg-emerald-100 px-2 py-1">
              <Text className="text-[11px] font-semibold text-emerald-800">Fix 6 m (Accept)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applySimulation('poor18m')}
              className="rounded bg-amber-100 px-2 py-1">
              <Text className="text-[11px] font-semibold text-amber-800">Fix 18 m (Warn)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applySimulation('unusable60m')}
              className="rounded bg-rose-100 px-2 py-1">
              <Text className="text-[11px] font-semibold text-rose-800">Fix 60 m (Block)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applySimulation('osogboPointForIfeCentral')}
              className="rounded bg-indigo-100 px-2 py-1">
              <Text className="text-[11px] font-semibold text-indigo-800">
                Ife Central in Osogbo (Far Warn)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Entomology Assay Form Fields */}
      <View className="mb-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
          3. Assay & Vector Details
        </Text>

        {/* Collection Date */}
        <Text className="mb-1 text-xs font-semibold text-muted">
          Collection Date (YYYY-MM-DD) *
        </Text>
        <TextInput
          value={collectionDate}
          onChangeText={setCollectionDate}
          placeholder="2026-10-07"
          className="mb-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />

        {/* Species Selection */}
        <Text className="mb-1 text-xs font-semibold text-muted">Vector Species *</Text>
        <View className="mb-3 flex-row flex-wrap gap-1.5">
          {SPECIES_OPTIONS.map((sp) => (
            <TouchableOpacity
              key={sp}
              onPress={() => setSpecies(sp)}
              className={`rounded-lg border px-2.5 py-1.5 ${
                species === sp ? 'border-primary bg-primary' : 'border-border bg-surface'
              }`}>
              <Text
                className={`text-xs ${
                  species === sp ? 'font-semibold text-white' : 'text-foreground'
                }`}>
                {sp}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Insecticide Selection */}
        <Text className="mb-1 text-xs font-semibold text-muted">Insecticide *</Text>
        <View className="mb-3 flex-row flex-wrap gap-1.5">
          {INSECTICIDE_OPTIONS.map((ins) => (
            <TouchableOpacity
              key={ins}
              onPress={() => setInsecticide(ins)}
              className={`rounded-lg border px-2.5 py-1.5 ${
                insecticide === ins ? 'border-secondary bg-secondary' : 'border-border bg-surface'
              }`}>
              <Text
                className={`text-xs ${
                  insecticide === ins ? 'font-semibold text-white' : 'text-foreground'
                }`}>
                {ins}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mosquito Counts (Exposed & Dead) */}
        <View className="mb-3 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-semibold text-muted">Exposed Count (1–500) *</Text>
            <TextInput
              value={nExposed}
              onChangeText={setNExposed}
              keyboardType="number-pad"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-semibold text-muted">Dead Count (0–Exposed) *</Text>
            <TextInput
              value={nDead}
              onChangeText={setNDead}
              keyboardType="number-pad"
              className={`rounded-lg border bg-background px-3 py-2 text-sm text-foreground ${
                parseInt(nDead, 10) > parseInt(nExposed, 10) ? 'border-rose-500' : 'border-border'
              }`}
            />
          </View>
        </View>

        {/* Live Mortality & WHO Classification Display */}
        <View className="rounded-xl border border-border bg-background p-3.5">
          <Text className="text-xs font-bold uppercase tracking-wider text-muted">
            Live Bioassay Mortality & WHO Class
          </Text>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">{mortalityPct.toFixed(1)}%</Text>
            <View
              className={`rounded-full border px-3 py-1 ${
                whoClass === 'Susceptible'
                  ? 'border-emerald-300 bg-emerald-100'
                  : whoClass === 'Possible resistance'
                    ? 'border-amber-300 bg-amber-100'
                    : 'border-rose-300 bg-rose-100'
              }`}>
              <Text
                className={`text-xs font-bold ${
                  whoClass === 'Susceptible'
                    ? 'text-emerald-800'
                    : whoClass === 'Possible resistance'
                      ? 'text-amber-800'
                      : 'text-rose-800'
                }`}>
                {whoClass}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-[11px] text-muted">
            {whoClass === 'Susceptible' && '≥98.0%: Vector susceptible to tested insecticide.'}
            {whoClass === 'Possible resistance' &&
              '90.0%–97.9%: Possible resistance. Confirmation required.'}
            {whoClass === 'Resistant' && '<90.0%: Resistant vector population detected.'}
          </Text>
        </View>
      </View>

      {/* Field Ecological & Intervention Factors */}
      <View className="mb-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
          4. Ecological & Protection Factors
        </Text>

        <View className="mb-3 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-semibold text-muted">
              Larval Density (per dip) *
            </Text>
            <TextInput
              value={larvalDensity}
              onChangeText={setLarvalDensity}
              keyboardType="number-pad"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-semibold text-muted">
              ITN Bed-Net Use % (0–100) *
            </Text>
            <TextInput
              value={itnUsePct}
              onChangeText={setItnUsePct}
              keyboardType="decimal-pad"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </View>
        </View>

        {/* Toggles */}
        <View className="mt-1 flex-row gap-3">
          <View className="flex-1 rounded-lg border border-border bg-background p-2.5">
            <Text className="mb-2 text-xs font-semibold text-muted">Settlement Type</Text>
            <View className="flex-row rounded border border-border bg-surface p-0.5">
              <TouchableOpacity
                onPress={() => setUrban(0)}
                className={`flex-1 items-center rounded py-1 ${urban === 0 ? 'bg-primary' : ''}`}>
                <Text className={`text-xs ${urban === 0 ? 'font-bold text-white' : 'text-muted'}`}>
                  Rural
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUrban(1)}
                className={`flex-1 items-center rounded py-1 ${urban === 1 ? 'bg-primary' : ''}`}>
                <Text className={`text-xs ${urban === 1 ? 'font-bold text-white' : 'text-muted'}`}>
                  Urban
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-1 rounded-lg border border-border bg-background p-2.5">
            <Text className="mb-2 text-xs font-semibold text-muted">IRS in last 12m</Text>
            <View className="flex-row rounded border border-border bg-surface p-0.5">
              <TouchableOpacity
                onPress={() => setIrsCovered(0)}
                className={`flex-1 items-center rounded py-1 ${
                  irsCovered === 0 ? 'bg-secondary' : ''
                }`}>
                <Text
                  className={`text-xs ${irsCovered === 0 ? 'font-bold text-white' : 'text-muted'}`}>
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIrsCovered(1)}
                className={`flex-1 items-center rounded py-1 ${
                  irsCovered === 1 ? 'bg-secondary' : ''
                }`}>
                <Text
                  className={`text-xs ${irsCovered === 1 ? 'font-bold text-white' : 'text-muted'}`}>
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Warnings Banner */}
      {formFlags.length > 0 && (
        <View className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <Text className="font-bold text-amber-900">Submission Warnings ({formFlags.length})</Text>
          {formFlags.map((flag, idx) => (
            <Text key={idx} className="mt-1 text-xs text-amber-800">
              • [{flag.field}]: {flag.message}
            </Text>
          ))}
        </View>
      )}

      {/* Errors or Warnings Banner */}
      {formErrors.length > 0 && (
        <View className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-4 shadow-sm">
          <Text className="font-bold text-rose-900">
            Cannot Save Record ({formErrors.length} Blocking Issue{formErrors.length > 1 ? 's' : ''}
            )
          </Text>
          {formErrors.map((err, idx) => (
            <Text key={idx} className="mt-1 text-xs text-rose-800">
              • [{err.field}]: {err.message}
            </Text>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View className="mb-10 flex-row gap-3">
        <TouchableOpacity
          onPress={() => setIsDiscardModalOpen(true)}
          disabled={isSubmitting}
          className="flex-1 items-center rounded-xl border border-border bg-surface py-3.5">
          <Text className="font-semibold text-muted">Cancel / Discard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-primary py-3.5 shadow-sm active:opacity-90">
          {isSubmitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-xs font-bold text-white">Validating (R Parity)...</Text>
            </View>
          ) : (
            <Text className="font-bold text-white">
              {isRejected ? 'Resubmit Record' : 'Save Record (Offline)'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Validation Blocked Modal */}
      <CustomModal
        visible={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        type="danger"
        title="Validation Blocked"
        message="This record failed national R pipeline validation rules and cannot be stored until corrected:"
        items={formErrors.map((e) => ({
          field: e.field,
          message: e.message,
        }))}
        primaryAction={{
          label: 'Review & Fix',
          onPress: () => setIsValidationModalOpen(false),
        }}
      />

      {/* Custom Discard Confirmation Modal */}
      <CustomModal
        visible={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        type="warning"
        title="Discard Field Form?"
        message="Are you sure you want to close this form? Any uncommitted data entry will be discarded."
        secondaryAction={{
          label: 'Keep Editing',
          onPress: () => setIsDiscardModalOpen(false),
        }}
        primaryAction={{
          label: 'Discard Form',
          onPress: async () => {
            setIsDiscardModalOpen(false);
            await discardDraft();
            onCancel?.();
          },
        }}
      />
    </ScrollView>
  );
}
