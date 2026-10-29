// Gom các api đặt lịch
const handleBookingRoutes = require('./bookings.routes');

async function handleBookingDomain(req, res, ctx) {
  return await handleBookingRoutes(req, res, ctx);
}

module.exports = handleBookingDomain;
module.exports.handleBookingDomain = handleBookingDomain;
module.exports.default = handleBookingDomain;

