const { getSecrets, getSessionEmail } = require('./core-auth-lib');

module.exports = async function handler(req, res) {
  const secrets = getSecrets();
  if (!secrets.connectionString || !secrets.secret) {
    return res.status(200).json({ authenticated: false });
  }

  const email = getSessionEmail(req, secrets.secret);
  return res.status(200).json({ authenticated: !!email });
};
