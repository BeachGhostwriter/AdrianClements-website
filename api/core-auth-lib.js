const crypto = require('crypto');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const COOKIE_NAME = 'core_session';
const ONE_DAY_SECONDS = 60 * 60 * 24;

let pool;

function getSecrets() {
  return {
    connectionString: process.env.CORE_DATABASE_URL || process.env.DATABASE_URL,
    secret: process.env.CORE_SESSION_SECRET,
  };
}

function requireConfig(res) {
  const secrets = getSecrets();
  if (!secrets.connectionString || !secrets.secret) {
    res.status(500).json({ error: 'Core auth is not configured on the server.' });
    return null;
  }
  return secrets;
}

function getPool(connectionString) {
  if (!pool) {
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function findUserByEmail(connectionString, email) {
  const db = getPool(connectionString);
  const { rows } = await db.query(
    'SELECT id, email, "passwordHash", role, "isActive" FROM "User" WHERE lower(email) = lower($1) LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function makeSignature(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function encodeSession(email, secret) {
  const payload = JSON.stringify({
    email,
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
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
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

function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ONE_DAY_SECONDS}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function getSessionEmail(req, secret) {
  const cookies = parseCookies(req);
  const payload = decodeAndValidateSession(cookies[COOKIE_NAME], secret);
  return payload ? payload.email : null;
}

module.exports = {
  COOKIE_NAME,
  getSecrets,
  requireConfig,
  findUserByEmail,
  verifyPassword,
  encodeSession,
  sessionCookie,
  clearSessionCookie,
  getSessionEmail,
  parseCookies,
};
