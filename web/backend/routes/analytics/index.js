// Gom các api thống kê
const handleAnalyticsRoutes = require('./analytics.routes');

async function handleAnalyticsDomain(req, res, ctx) {
  return await handleAnalyticsRoutes(req, res, ctx);
}

module.exports = handleAnalyticsDomain;
module.exports.handleAnalyticsDomain = handleAnalyticsDomain;
module.exports.default = handleAnalyticsDomain;

