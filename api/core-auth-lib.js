const crypto = require('crypto');

const COOKIE_NAME = 'core_session';
const ONE_DAY_SECONDS = 60 * 60 * 24;

function getSecrets() {
  return {
    user: process.env.CORE_ADMIN_USER,
    pass: process.env.CORE_ADMIN_PASSWORD,
    secret: process.env.CORE_SESSION_SECRET,
  };
}

function makeSignature(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) {
      return acc;
    }
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    acc[key] = decodeURIComponent(val);
    return acc;
  }, {});
}

function encodeSession(userid, secret) {
  const payload = JSON.stringify({
    userid,
    exp: Date.now() + ONE_DAY_SECONDS * 1000,
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = makeSignature(encoded, secret);
  return `${encoded}.${sig}`;
}

function decodeAndValidateSession(raw, secret) {
  if (!raw || !raw.includes('.')) {
    return null;
  }
  const [encoded, sig] = raw.split('.');
  const expected = makeSignature(encoded, secret);
  if (sig !== expected) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ONE_DAY_SECONDS}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function requireConfig(res) {
  const secrets = getSecrets();
  if (!secrets.user || !secrets.pass || !secrets.secret) {
    res.status(500).json({ error: 'Core auth is not configured on the server.' });
    return null;
  }
  return secrets;
}

function isAuthenticated(req, secrets) {
  const cookies = parseCookies(req);
  const payload = decodeAndValidateSession(cookies[COOKIE_NAME], secrets.secret);
  if (!payload) {
    return false;
  }
  return payload.userid === secrets.user;
}

module.exports = {
  COOKIE_NAME,
  getSecrets,
  requireConfig,
  encodeSession,
  sessionCookie,
  clearSessionCookie,
  isAuthenticated,
};
