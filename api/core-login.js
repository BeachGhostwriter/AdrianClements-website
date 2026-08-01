const {
  requireConfig,
  findUserByEmail,
  verifyPassword,
  encodeSession,
  sessionCookie,
} = require('./core-auth-lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secrets = requireConfig(res);
  if (!secrets) {
    return;
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await findUserByEmail(secrets.connectionString, email);

    if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = encodeSession(user.email, secrets.secret);
    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('CORE login error:', err);
    return res.status(500).json({ error: 'Unable to reach authentication service.' });
  }
};
