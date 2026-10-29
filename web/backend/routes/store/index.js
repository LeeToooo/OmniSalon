// Gom các api bán hàng và tồn kho
const handleProductRoutes = require('./products.routes');
const handleOrderRoutes = require('./orders.routes');
const handlePosRoutes = require('./pos.routes');
const handleInventoryRoutes = require('./inventory.routes');

async function handleStoreDomain(req, res, ctx) {
  if (await handleProductRoutes(req, res, ctx)) return true;
  if (await handleOrderRoutes(req, res, ctx)) return true;
  if (await handlePosRoutes(req, res, ctx)) return true;
  if (await handleInventoryRoutes(req, res, ctx)) return true;
  return false;
}

module.exports = handleStoreDomain;
module.exports.handleStoreDomain = handleStoreDomain;
module.exports.default = handleStoreDomain;

