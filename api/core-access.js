const ALLOWED_ORIGIN = process.env.CORE_ALLOWED_ORIGIN || '*';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function reply(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    reply(res, 405, { success: false, message: 'Method not allowed' });
    return;
  }

  const accessCode = String(req.body?.accessCode || '');
  const expected = process.env.CORE_ACCESS_CODE;
  if (!expected) {
    reply(res, 500, { success: false, message: 'CORE access is not configured' });
    return;
  }

  if (!accessCode || accessCode !== expected) {
    reply(res, 401, { success: false, message: 'Incorrect password' });
    return;
  }

  const liveUrl = process.env.CORE_LIVE_URL || '';
  const demoUrl = process.env.CORE_DEMO_URL || '/core.html';
  reply(res, 200, { success: true, data: { liveUrl, demoUrl } });
}