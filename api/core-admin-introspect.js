import { getPool } from './core-auth-lib.js';

export default async function handler(req, res) {
  const token = req.headers['x-inspect-token'];
  if (!process.env.INSPECT_TOKEN || token !== process.env.INSPECT_TOKEN) {
    return res.status(401).json({ error: 'Not authorized.' });
  }
  try {
    const pool = getPool();
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    return res.status(200).json({ tables: tables.rows.map(r => r.table_name) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
