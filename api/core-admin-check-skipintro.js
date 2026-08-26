import { getPool } from './core-auth-lib.js';

const EMAILS = ['adrian.m.clements@outlook.com', 'adrian.m.clements+demo@outlook.com'];

export default async function handler(req, res) {
  const token = req.headers['x-check-token'];
  if (!process.env.CHECK_TOKEN2 || token !== process.env.CHECK_TOKEN2) {
    return res.status(401).json({ error: 'Not authorized.' });
  }
  try {
    const pool = getPool();
    if (req.method === 'POST') {
      await pool.query(
        'UPDATE "User" SET "skipIntro" = false WHERE lower(email) = ANY(SELECT lower(unnest($1::text[])))',
        [EMAILS]
      );
    }
    const check = await pool.query(
      'SELECT email, "skipIntro" FROM "User" WHERE lower(email) = ANY(SELECT lower(unnest($1::text[])))',
      [EMAILS]
    );
    return res.status(200).json({ ok: true, users: check.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message, code: err.code });
  }
}
