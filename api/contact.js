import nodemailer from 'nodemailer';

const ALLOWED_ORIGIN = process.env.CONTACT_ALLOWED_ORIGIN || '*';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'mail.adrian-clements.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS must be configured');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  const { firstName, lastName, email, message } = req.body || {};
  if (!firstName || !email || !message) {
    json(res, 422, { error: 'Missing required fields' });
    return;
  }

  const safeMsg = String(message).replace(/\n/g, '<br>');
  const fullName = `${firstName} ${lastName || ''}`.trim();

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO || 'Adrian.clements@adrian-clements.com',
      replyTo: email,
      subject: `AMC Website Enquiry - ${fullName}`,
      text: `Name: ${fullName}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><hr/><p>${safeMsg}</p>`,
    });

    json(res, 200, { ok: true });
  } catch (error) {
    console.error('Contact API error:', error?.message || error);
    json(res, 500, { error: 'Failed to send email' });
  }
}