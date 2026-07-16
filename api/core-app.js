const {
  requireConfig,
  isAuthenticated,
} = require('./core-auth-lib');

module.exports = async function handler(req, res) {
  const secrets = requireConfig(res);
  if (!secrets) {
    return;
  }

  if (!isAuthenticated(req, secrets)) {
    return res.redirect(302, '/core/index.html');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CORE Application Workspace</title>
    <style>
      body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f5f8fa; color: #1d2f3f; }
      .wrap { max-width: 900px; margin: 56px auto; padding: 0 20px; }
      .card { background: #ffffff; border: 1px solid #d9e3e9; border-radius: 16px; padding: 24px; box-shadow: 0 18px 36px rgba(17, 40, 63, 0.1); }
      h1 { margin-top: 0; }
      p { color: #536474; }
      .actions { margin-top: 18px; display: flex; gap: 10px; flex-wrap: wrap; }
      .btn { display: inline-block; border-radius: 999px; padding: 10px 14px; text-decoration: none; font-weight: 600; }
      .btn-home { border: 1px solid #b5c5d0; color: #1d2f3f; }
      .btn-logout { background: #0e6f73; color: #ffffff; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="card">
        <h1>CORE Application Workspace</h1>
        <p>You are now inside the CORE protected area on the dedicated subdomain.</p>
        <div class="actions">
          <a class="btn btn-home" href="https://adrian-clements.com">Return to Main Site</a>
          <a class="btn btn-logout" href="/logout">Sign out</a>
        </div>
      </section>
    </main>
  </body>
</html>`);
};
