import { getPool } from './core-auth-lib.js';

export default async function handler(req, res) {
  const token = req.headers['x-migration-token'];
  if (!process.env.MIGRATION_TOKEN4 || token !== process.env.MIGRATION_TOKEN4) {
    return res.status(401).json({ error: 'Not authorized.' });
  }
  try {
    const pool = getPool();
    await pool.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "skipIntro" BOOLEAN NOT NULL DEFAULT false;');
    const check = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'User' AND column_name = 'skipIntro';
    `);
    return res.status(200).json({ ok: true, columnExists: check.rows.length > 0 });
  } catch (err) {
    console.error('skipIntro migration error:', err);
    return res.status(500).json({ error: err.message, code: err.code });
  }
}
