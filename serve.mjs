import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.pdf':  'application/pdf',
};

// Nodemailer transporter — cPanel SMTP
// Set SMTP_USER (full email address) and SMTP_PASS (cPanel email password) as
// environment variables before starting the server.
// SMTP_HOST defaults to mail.<your-domain> — override if your cPanel shows a different hostname.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.adrian-clements.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',   // true only for port 465 (SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function handleContactPost(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { firstName, lastName, email, message } = data;
  if (!firstName || !email || !message) {
    res.writeHead(422, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing required fields' }));
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: 'Adrian.clements@adrian-clements.com',
    replyTo: email,
    subject: `AMC Website Enquiry — ${firstName} ${lastName || ''}`.trim(),
    text: `Name: ${firstName} ${lastName || ''}\nEmail: ${email}\n\n${message}`,
    html: `
      <p><strong>Name:</strong> ${firstName} ${lastName || ''}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <hr/>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('Nodemailer error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to send email' }));
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'POST' && req.url === '/api/contact') {
    await handleContactPost(req, res);
    return;
  }

  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(__dirname, urlPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('WARNING: SMTP_USER or SMTP_PASS not set — email sending will fail.');
  }
});
