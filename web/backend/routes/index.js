// Gom các đường dẫn api của hệ thống
const handleAuthDomain = require('./auth');
const handleSalonDomain = require('./salon');
const handleBookingDomain = require('./bookings');
const handleStoreDomain = require('./store');
const handleMarketingDomain = require('./marketing');
const handleAnalyticsDomain = require('./analytics');
const handleAiDomain = require('./ai');

/**
 * Điều phối tuần tự các yêu cầu API đến đúng phân hệ chức năng
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @param {object} ctx - Ngữ cảnh định tuyến { pathname, method, parsedUrl, parsedBody... }
 * @returns {Promise<boolean>} true nếu đã xử lý, false nếu không khớp API nào
 */
async function handleApiRoutes(req, res, ctx) {
  // Phân hệ Xác thực & Tài khoản
  if (await handleAuthDomain(req, res, ctx)) return true;

  // Phân hệ Vận hành Salon
  if (await handleSalonDomain(req, res, ctx)) return true;

  // Phân hệ Đặt lịch hẹn
  if (await handleBookingDomain(req, res, ctx)) return true;

  // Phân hệ Cửa hàng & Bán lẻ
  if (await handleStoreDomain(req, res, ctx)) return true;

  // Phân hệ Chăm sóc khách hàng & Marketing
  if (await handleMarketingDomain(req, res, ctx)) return true;

  // Phân hệ Báo cáo & Thống kê
  if (await handleAnalyticsDomain(req, res, ctx)) return true;

  // Phân hệ AI Studio
  if (await handleAiDomain(req, res, ctx)) return true;

  return false;
}

module.exports = handleApiRoutes;
module.exports.handleApiRoutes = handleApiRoutes;
module.exports.default = handleApiRoutes;

