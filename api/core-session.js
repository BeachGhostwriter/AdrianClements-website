import { verifySession, parseCookies, COOKIE_NAME } from './core-auth-lib.js';

export default function handler(req, res) {
  if (!process.env.CORE_AUTH_SECRET) {
    return res.status(200).json({ authenticated: false });
  }
  const cookies = parseCookies(req.headers.cookie);
  const email = verifySession(cookies[COOKIE_NAME]);
  return res.status(200).json({ authenticated: !!email, email: email || undefined });
}
