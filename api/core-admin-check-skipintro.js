import pkg from 'pg';
const { Pool } = pkg;

const EMAILS = ['adrian.m.clements@outlook.com', 'adrian.m.clements+demo@outlook.com'];

export default async function handler(req, res) {
  const token = req.headers['x-check-token'];
  if (!process.env.CHECK_TOKEN2 || token !== process.env.CHECK_TOKEN2) {
    return res.status(401).json({ error: 'Not authorized.' });
  }
  const connectionString =
    process.env.CORE_DATABASE_URL ||
    process.env.core_database_DATABASE_URL ||
    process.env.Core_database_url;
  if (!connectionString) {
    return res.status(500).json({ error: 'No database configured.' });
  }
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
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
  } finally {
    await pool.end();
  }
}
