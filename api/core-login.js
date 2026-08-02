import { getPool, verifyPassword, signSession, COOKIE_NAME } from './core-auth-lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.CORE_DATABASE_URL || !process.env.CORE_AUTH_SECRET) {
    return res.status(500).json({ error: 'Core auth is not configured on the server.' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT email, name, password_hash FROM core_users WHERE lower(email) = lower($1) LIMIT 1',
      [email]
    );
    const user = rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signSession(user.email);
    const SESSION_TTL = 60 * 60 * 8;
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL}`
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('CORE login error:', err);
    return res.status(500).json({ error: 'Unable to reach authentication service.' });
  }
}
