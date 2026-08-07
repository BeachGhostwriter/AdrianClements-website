import { getPool } from './core-auth-lib.js';

export default async function handler(req, res) {
  const token = req.headers['x-check-token'];
  if (!process.env.CHECK_TOKEN || token !== process.env.CHECK_TOKEN) {
    return res.status(401).json({ error: 'Not authorized.' });
  }
  try {
    const pool = getPool();
    const result = await pool.query('SELECT email FROM core_users ORDER BY email');
    return res.status(200).json({ emails: result.rows.map(r => r.email) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
