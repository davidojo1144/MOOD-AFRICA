# VECDIM Demo Video Recording Script (3-Minute Guide)

**Target Duration:** Maximum 3 minutes (180 seconds)  
**Presenter:** Ojo David Ayodeji — Candidate for Lead Developer (Mobile App & Backend)  
**Audience:** UNIOSUN / VECDIM Assessment Committee

---

## Preparation Before Hitting Record

1. Ensure the backend server is running in a terminal:
   ```bash
   npm run server
   ```
2. Ensure the Expo dev server is running:
   ```bash
   npx expo start
   ```
3. Open the app in browser (`http://localhost:8081` by pressing `w`) or on your mobile device via Expo Go.
4. Have this script visible on a secondary screen or printed beside you.

---

## Timed Walkthrough

### Part 1: Offline Data Capture & Draft Recovery (0:00 – 0:45)

**Visual:** App is open on the Entomology Data Collection Form (`Field Worker: Ojo David`).

- **Action:** Tap the **"Offline"** toggle on the top right (Airplane Mode simulation).
- **Spoken Voiceover / Caption:**
  > "Hello, my name is Ojo David Ayodeji. I am presenting the VECDIM offline-first mobile app and backend system for the UNIOSUN / MOOD Africa assessment.
  >
  > First, I will demonstrate offline data capture. Notice I have switched the connection status to Offline. Field entomologists routinely work in zero-connectivity areas.
  >
  > I'll select Osun State, Osogbo LGA, and Osogbo Ward 1.
  > I enter 100 exposed mosquitoes and 42 dead. Notice the live WHO classification badge immediately displays 'Resistant (42.0%)' in red, calculating mortality and resistance on the fly."
- **Action:** Tap the top button **"Simulate App Crash / Reload"** (or refresh browser/kill app).
- **Spoken Voiceover / Caption:**
  > "Now, simulating a device shutdown or app crash in the middle of field work... when the app restarts, the continuous autosave engine detects our draft.
  > The Draft Recovery modal appears with the exact timestamp. I tap 'Resume Draft', and all form values, coordinates, and bioassay counts are instantly restored without loss."

---

### Part 2: GPS Accuracy Meter & LGA Proximity Check (0:45 – 1:20)

**Visual:** Form scrolled to the GPS Location & Accuracy Meter section.

- **Action:**
  1. Tap preset button **"Simulate 6m (Target)"**
  2. Tap preset button **"Simulate 18m (Warning)"**
  3. Tap preset button **"Simulate 60m (Unusable Block)"**
  4. Tap preset button **"Simulate Far LGA"**
- **Spoken Voiceover / Caption:**
  > "Next, our three-tier GPS accuracy meter:
  > At 6 meters, the meter glows green—Target accuracy achieved.
  > At 18 meters, it shifts to amber warning with an alert: 'Fair GPS accuracy. Acceptable for sync.'
  > At 60 meters, the meter turns red: 'GPS accuracy unusable (>50m). Record cannot be submitted.' Notice the Save button is blocked, protecting the analytical pipeline from corrupted coordinates.
  >
  > Furthermore, when I simulate coordinates in Osogbo while selecting Ife Central LGA, the system computes the geodesic Haversine distance and alerts that coordinates are 32.4 kilometers away from the LGA centroid, exceeding our 25-kilometer threshold."

---

### Part 3: Safe Sync Queue & Partial Failure Isolation (1:20 – 2:05)

**Visual:** Switch connection back to **Online**, switch to **"Field View"** tab.

- **Action:**
  1. Set GPS back to 6m, fix values, tap **"Save & Queue for Sync"**.
  2. In Field View, show records in outbox.
  3. Tap **"Simulate 9 Valid + 1 Bad Batch Sync"** button.
- **Spoken Voiceover / Caption:**
  > "Now, I restore our network connection to Online and go to the Field View outbox.
  >
  > To demonstrate partial batch failure isolation: we submit a batch of 10 records where 9 are completely valid, but the 10th record has an invalid dead count of 120 exceeding 100 exposed.
  >
  > I tap Sync. Watch the server response: 9 records are accepted and stored immediately in our PostGIS database without any transaction rollback.
  >
  > The bad record is rejected and isolated in the user's outbox with the exact server error: 'Number of dead mosquitoes cannot exceed exposed count'.
  >
  > The field worker taps 'Fix Record', corrects the dead count to 85, and resubmits. It is accepted under the exact same record UUID, ensuring idempotent tracking without duplicates."

---

### Part 4: Role-Based Dashboards & DHIS2 Export (2:05 – 2:55)

**Visual:** Use the **Role Switcher** in the header.

- **Action 1:** Switch role to **"VECDIM State Officer (Dr. Adekunle - Osun)"**
- **Spoken Voiceover / Caption:**

  > "Now let's explore our role-scoped dashboards.
  > Switching to VECDIM State Officer for Osun State: the alert feed is strictly filtered to Osun's 214 alerts.
  > Notice that pyrethroid resistance (<90% mortality) is presented as a separate indicator rather than changing the risk tier, preventing alert fatigue for officers.
  > I can tap 'Acknowledge Alert', enter an operational note—such as 'Vector spraying team deployed'—and save. The alert updates instantly with the officer's identity and timestamp."

- **Action 2:** Switch role to **"UNIOSUN National Lead (Prof. Adeleke)"**
- **Spoken Voiceover / Caption:**
  > "Finally, switching to UNIOSUN National Lead:
  > Here we see the complete national surveillance picture: exactly 86 High Alerts, 135 Warnings, and 426 Watch alerts—totaling 647, matching the R analytical model output with 100% parity.
  >
  > Below, researchers can review state-by-state risk breakdowns, filter by risk tier, and click 'Export DHIS2 Payload' to generate standard JSON ready for immediate upload to the National DHIS2 portal."

### Closing (2:55 – 3:00)

- **Spoken Voiceover / Caption:**
  > "All tests, including unit tests, API tests, and the 18,300-comparison R parity test, pass with 100% agreement.
  > Thank you very much for your time and consideration."
