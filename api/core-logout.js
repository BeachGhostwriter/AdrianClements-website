import { COOKIE_NAME } from './core-auth-lib.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
  return res.redirect(302, '/');
}
