import pkg from 'pg';
const { Pool } = pkg;

const CANDIDATES = ['Core_database_url', 'DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING'];

export default async function handler(req, res) {
  const token = req.headers['x-inspect-token'];
  if (!process.env.INSPECT_TOKEN || token !== process.env.INSPECT_TOKEN) {
    return res.status(401).json({ error: 'Not authorized.' });
  }
  const results = {};
  for (const name of CANDIDATES) {
    const cs = process.env[name];
    if (!cs) { results[name] = { set: false }; continue; }
    let host = null;
    try { host = new URL(cs).hostname; } catch {}
    const pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });
    try {
      const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
      results[name] = { set: true, host, tables: tables.rows.map(r => r.table_name) };
    } catch (err) {
      results[name] = { set: true, host, error: err.message };
    } finally {
      await pool.end();
    }
  }
  return res.status(200).json(results);
}
