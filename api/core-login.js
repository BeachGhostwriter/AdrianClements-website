const {
  requireConfig,
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

  const userid = String(req.body?.userid || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (userid !== secrets.user.toLowerCase() || password !== secrets.pass) {
    return res.status(401).json({ error: 'Invalid user ID or password.' });
  }

  const token = encodeSession(secrets.user, secrets.secret);
  res.setHeader('Set-Cookie', sessionCookie(token));
  return res.status(200).json({ ok: true });
};
