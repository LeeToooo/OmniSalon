// Gom các api xác thực và tài khoản
const handleAuthRoutes = require('./auth.routes');
const handleAccountsRoutes = require('./accounts.routes');

async function handleAuthDomain(req, res, ctx) {
  if (await handleAuthRoutes(req, res, ctx)) return true;
  if (await handleAccountsRoutes(req, res, ctx)) return true;
  return false;
}

module.exports = handleAuthDomain;
module.exports.handleAuthDomain = handleAuthDomain;
module.exports.default = handleAuthDomain;

