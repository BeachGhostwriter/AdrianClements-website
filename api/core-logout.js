const {
  clearSessionCookie,
} = require('./core-auth-lib');

module.exports = async function handler(req, res) {
  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.redirect(302, '/core/index.html');
};
