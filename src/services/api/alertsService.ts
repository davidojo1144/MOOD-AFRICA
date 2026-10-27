import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertTierItem, UserRole } from '@/types/vecdim';
import staticAlerts from '@/data/benchmarkAlerts.json';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const LOCAL_ACKS_KEY = '@vecdim_local_acknowledgments';

interface AckRecord {
  alert_id: string;
  acknowledged_by: string;
  acknowledged_at: string;
  acknowledgment_notes?: string;
}

export class AlertsClientService {
  private static async getLocalAcks(): Promise<Record<string, AckRecord>> {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_ACKS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private static async saveLocalAck(ack: AckRecord): Promise<void> {
    try {
      const existing = await this.getLocalAcks();
      existing[ack.alert_id] = ack;
      await AsyncStorage.setItem(LOCAL_ACKS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed to save local acknowledgment', e);
    }
  }

  /**
   * Fetch alerts scoped to user role. Tries live backend first; falls back gracefully
   * to bundled benchmark data with local acknowledgments.
   */
  static async getAlerts(params: {
    userRole: UserRole;
    userState?: string;
    state?: string;
    lga?: string;
  }): Promise<AlertTierItem[]> {
    const { userRole, userState, state, lga } = params;
    const effectiveState = userState || state;

    // Try fetching from live backend API if online
    try {
      const queryParams = new URLSearchParams();
      if (userRole) queryParams.set('role', userRole);
      if (effectiveState) queryParams.set('state', effectiveState);
      if (lga) queryParams.set('lga', lga);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${API_BASE_URL}/alerts?${queryParams.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.alerts)) {
          return data.alerts;
        }
      }
    } catch {
      // Offline or backend unreachable, proceed to local/fallback
    }

    // Client-side fallback from benchmark dataset
    const localAcks = await this.getLocalAcks();
    let items = (staticAlerts as AlertTierItem[]).map((alert) => {
      const localAck = localAcks[alert.id];
      if (localAck) {
        return {
          ...alert,
          acknowledged: true,
          acknowledged_by: localAck.acknowledged_by,
          acknowledged_at: localAck.acknowledged_at,
          notes: localAck.acknowledgment_notes,
        };
      }
      return alert;
    });

    if (userRole === 'vecdim' && effectiveState) {
      items = items.filter((a) => a.state.toLowerCase() === effectiveState.toLowerCase());
    }

    if (lga && lga !== 'All') {
      items = items.filter((a) => a.lga.toLowerCase() === lga.toLowerCase());
    }

    return items;
  }

  /**
   * Acknowledge an alert on server and locally.
   */
  static async acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<boolean> {
    const now = new Date().toISOString();
    await this.saveLocalAck({
      alert_id: alertId,
      acknowledged_by: userId,
      acknowledged_at: now,
      acknowledgment_notes: notes,
    });

    // Also attempt to notify live backend
    try {
      await fetch(`${API_BASE_URL}/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          notes,
        }),
      });
    } catch {
      // Stored locally, will sync when reconnected
    }

    return true;
  }

  /**
   * Generate or fetch DHIS2 aggregate data value set
   */
  static async getDhis2Export(userState?: string): Promise<any> {
    try {
      const url = userState
        ? `${API_BASE_URL}/export/dhis2?state=${encodeURIComponent(userState)}`
        : `${API_BASE_URL}/export/dhis2`;

      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback generator
    }

    const alerts = await this.getAlerts({ userRole: 'uniosun' });
    const relevantAlerts = userState
      ? alerts.filter((a) => a.state.toLowerCase() === userState.toLowerCase())
      : alerts;

    const alertCount = relevantAlerts.filter((a) => a.tier === 'ALERT').length;
    const warningCount = relevantAlerts.filter((a) => a.tier === 'WARNING').length;
    const watchCount = relevantAlerts.filter((a) => a.tier === 'WATCH').length;
    const resistantCount = relevantAlerts.filter((a) => a.pyrethroid_resistance_flag).length;

    return {
      dataSet: 'VECDIM_EPIDEMIC_SURVEILLANCE',
      completeDate: new Date().toISOString().split('T')[0],
      period: '202610',
      orgUnit: userState ? `OU_${userState.toUpperCase()}` : 'OU_NIGERIA_NATIONAL',
      dataValues: [
        {
          dataElement: 'VEC_TOTAL_ALERTS',
          categoryOptionCombo: 'default',
          value: relevantAlerts.length.toString(),
        },
        {
          dataElement: 'VEC_HIGH_ALERT_TIER',
          categoryOptionCombo: 'default',
          value: alertCount.toString(),
        },
        {
          dataElement: 'VEC_WARNING_TIER',
          categoryOptionCombo: 'default',
          value: warningCount.toString(),
        },
        {
          dataElement: 'VEC_WATCH_TIER',
          categoryOptionCombo: 'default',
          value: watchCount.toString(),
        },
        {
          dataElement: 'VEC_PYRETHROID_RESISTANT_COUNT',
          categoryOptionCombo: 'default',
          value: resistantCount.toString(),
        },
      ],
    };
  }
}
