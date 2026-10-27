import express, { Request, Response } from 'express';
import cors from 'cors';
import { db } from './db';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to extract role and state from request headers
function getUserContext(req: Request): {
  userId: string;
  userRole: 'field' | 'vecdim' | 'uniosun';
  userState?: string;
} {
  const userId = (req.headers['x-user-id'] as string) || 'u_field_03';
  const userRole = (req.headers['x-user-role'] as any) || 'field';
  const userState = (req.headers['x-user-state'] as string) || undefined;
  return { userId, userRole, userState };
}

// 1. Health check (Must)
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: db.isPgConnected ? 'PostgreSQL + PostGIS' : 'Embedded Spatial Store',
    timestamp: new Date().toISOString(),
  });
});

// 2. Batch Record Ingestion (Must)
app.post('/api/v1/records/batch', async (req: Request, res: Response) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Request body must contain records array' });
    }

    const { userId } = getUserContext(req);
    const { results } = await db.processBatch(records, userId);

    return res.status(200).json({ results });
  } catch (err: any) {
    console.error('Batch processing error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. Query Field Records (Must)
app.get('/api/v1/records', async (req: Request, res: Response) => {
  try {
    const { state, lga, since } = req.query;
    const { userId, userRole, userState } = getUserContext(req);

    const records = await db.getRecords({
      state: state as string,
      lga: lga as string,
      since: since as string,
      userId,
      userRole,
      userState,
    });

    return res.json({ count: records.length, records });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Query Early-Warning Alerts (Must)
app.get('/api/v1/alerts', async (req: Request, res: Response) => {
  try {
    const { state, lga, from, to } = req.query;
    const { userRole, userState } = getUserContext(req);

    const alerts = await db.getAlerts({
      state: state as string,
      lga: lga as string,
      from: from as string,
      to: to as string,
      userRole,
      userState,
    });

    // Summary counts by tier
    const summary = {
      total: alerts.length,
      ALERT: alerts.filter((a) => a.tier === 'ALERT').length,
      WARNING: alerts.filter((a) => a.tier === 'WARNING').length,
      WATCH: alerts.filter((a) => a.tier === 'WATCH').length,
    };

    return res.json({ summary, count: alerts.length, alerts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Acknowledge Alert (Bonus)
app.post('/api/v1/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const alertId = decodeURIComponent(String(req.params.id || ''));
    const { notes } = req.body;
    const { userId } = getUserContext(req);

    const success = await db.acknowledgeAlert(alertId, userId, notes);
    if (!success) {
      return res.status(404).json({ error: `Alert ${alertId} not found` });
    }

    return res.json({
      success: true,
      message: `Alert ${alertId} acknowledged`,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. PostGIS Spatial Bounding-Box Query (Bonus)
app.get('/api/v1/risk-points', async (req: Request, res: Response) => {
  try {
    const { bbox } = req.query;
    let parsedBbox: [number, number, number, number] | undefined;

    if (bbox && typeof bbox === 'string') {
      const parts = bbox.split(',').map(parseFloat);
      if (parts.length === 4 && !parts.some(isNaN)) {
        parsedBbox = parts as [number, number, number, number];
      }
    }

    const points = await db.getRiskPoints(parsedBbox);
    return res.json({ count: points.length, points });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. DHIS2 DataValueSets JSON Export (Bonus)
app.get('/api/v1/export/dhis2', async (req: Request, res: Response) => {
  try {
    const { state, month } = req.query;
    const records = await db.getRecords({ state: state as string });

    // Format into standard DHIS2 dataValueSets structure
    const dataValues = records.map((r) => ({
      dataElement: 'VECDIM_MOSQUITO_MORTALITY',
      period: r.collection_date?.replace(/-/g, '').slice(0, 6) || month || '202610',
      orgUnit: `${r.state}_${r.lga}_${r.ward}`,
      value: String(r.mortality_pct ?? ''),
      storedBy: r.user_id || 'vecdim_sync',
      created: r.received_at || new Date().toISOString(),
      comment: `Species: ${r.species}, Insecticide: ${r.insecticide}, Status: ${r.who_class}`,
    }));

    return res.json({ dataValues });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Server
export async function startServer() {
  await db.init();
  return app.listen(PORT, () => {
    console.log(`✓ VECDIM Backend API running on http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`  Alerts feed:  http://localhost:${PORT}/api/v1/alerts`);
  });
}

if (require.main === module) {
  void startServer();
}

export { app };
