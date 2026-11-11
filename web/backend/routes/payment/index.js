const handlePaymentRoutes = require('./payment.routes');

async function handlePaymentDomain(req, res, ctx) {
  return await handlePaymentRoutes(req, res, ctx);
}

module.exports = handlePaymentDomain;
module.exports.handlePaymentDomain = handlePaymentDomain;
module.exports.default = handlePaymentDomain;

