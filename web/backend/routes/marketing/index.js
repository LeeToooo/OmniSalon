// Gom các api marketing và chăm sóc khách hàng
const handlePromotionRoutes = require('./promotions.routes');
const handleReviewRoutes = require('./reviews.routes');
const handleNotificationRoutes = require('./notifications.routes');

async function handleMarketingDomain(req, res, ctx) {
  if (await handlePromotionRoutes(req, res, ctx)) return true;
  if (await handleReviewRoutes(req, res, ctx)) return true;
  if (await handleNotificationRoutes(req, res, ctx)) return true;
  return false;
}

module.exports = handleMarketingDomain;
module.exports.handleMarketingDomain = handleMarketingDomain;
module.exports.default = handleMarketingDomain;

