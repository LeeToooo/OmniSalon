// Gom các api quản lý salon
const handleBranchesRoutes = require('./branches.routes');
const handleStaffRoutes = require('./staff.routes');
const handleServiceRoutes = require('./services.routes');

async function handleSalonDomain(req, res, ctx) {
  if (await handleBranchesRoutes(req, res, ctx)) return true;
  if (await handleStaffRoutes(req, res, ctx)) return true;
  if (await handleServiceRoutes(req, res, ctx)) return true;
  return false;
}

module.exports = handleSalonDomain;
module.exports.handleSalonDomain = handleSalonDomain;
module.exports.default = handleSalonDomain;

