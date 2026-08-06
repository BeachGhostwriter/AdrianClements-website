import { getPool } from './core-auth-lib.js';

// One-time schema-provisioning endpoint. Gated on MIGRATION_TOKEN, not the
// normal session cookie, since it needs to run before any user has logged
// in from this machine. Remove once the schema is provisioned.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['x-migration-token'];
  if (!process.env.MIGRATION_TOKEN || token !== process.env.MIGRATION_TOKEN) {
    return res.status(401).json({ error: 'Not authorized.' });
  }

  const dbUrl =
    process.env.CORE_DATABASE_URL ||
    process.env.core_database_DATABASE_URL ||
    process.env.Core_database_url;
  if (!dbUrl) {
    return res.status(500).json({ error: 'No database configured.' });
  }

  try {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_register (
        id SERIAL PRIMARY KEY,
        client_slug TEXT NOT NULL,
        client_name TEXT NOT NULL,
        risk_name TEXT NOT NULL,
        category TEXT,
        tts NUMERIC NOT NULL,
        velocity NUMERIC,
        acceleration NUMERIC,
        phase_index NUMERIC,
        freedom_index NUMERIC,
        urgency_rank INT,
        owner TEXT,
        next_review DATE,
        trend TEXT DEFAULT 'flat',
        snapshot_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_risk_register_client ON risk_register(client_slug);');
    const check = await pool.query("SELECT to_regclass('public.risk_register') AS t");
    return res.status(200).json({ ok: true, tableExists: !!check.rows[0].t });
  } catch (err) {
    console.error('CORE migration error:', err);
    return res.status(500).json({ error: err.message });
  }
}
