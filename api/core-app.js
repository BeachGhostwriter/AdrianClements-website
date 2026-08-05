import { verifySession, parseCookies, COOKIE_NAME } from './core-auth-lib.js';
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const email = verifySession(cookies[COOKIE_NAME]);

  if (!email) {
    return res.redirect(302, '/');
  }

  const appPath = path.join(process.cwd(), 'core', 'app.html');
  try {
    const html = fs.readFileSync(appPath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html><html><head><title>CORE Workspace</title></head>
<body style="font-family:sans-serif;padding:40px">
<h1>CORE Application Workspace</h1>
<p>Signed in as <strong>${email}</strong>.</p>
<p><a href="/core/CCORD_Graph_Prototype.html">Open CCORD Graph</a></p>
<p><a href="/api/core-logout">Sign out</a></p>
</body></html>`);
  }
}
