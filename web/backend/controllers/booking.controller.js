// =========================================================================
// BOOKING CONTROLLER — ĐIỀU PHỐI YÊU CẦU & PHẢN HỒI ĐẶT LỊCH HẸN
// =========================================================================

const BookingService = require('../services/booking.service');
const { extractAuthUser } = require('../middlewares/auth_middleware');

const BookingController = {
  // GET /api/bookings/available-slots
  async getAvailableSlots(req, res, ctx) {
    try {
      const { parsedUrl } = ctx;
      const date = parsedUrl.searchParams.get('date');
      const stylistId = (parsedUrl.searchParams.get('stylistId') || '').trim();
      const slots = await BookingService.getAvailableSlots({ date, stylistId });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, data: slots }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: error.message }));
    }
  },

  // GET /api/bookings
  async getBookings(req, res, ctx) {
    try {
      const { parsedUrl } = ctx;
      const user = extractAuthUser(req);
      const branch = parsedUrl.searchParams.get('branch');
      const status = parsedUrl.searchParams.get('status');
      const date = parsedUrl.searchParams.get('date');
      const phone = parsedUrl.searchParams.get('phone');

      const data = await BookingService.getBookings({ branch, status, date, phone, user });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, data }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: error.message }));
    }
  },

  // POST /api/bookings
  async createBooking(req, res, ctx) {
    try {
      const { parsedBody } = ctx;
      const result = await BookingService.createBooking(parsedBody);
      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Đặt lịch thành công', data: result }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: error.message }));
    }
  },

  // PATCH / PUT /api/bookings/:id/status
  async updateStatus(req, res, ctx, bookingId) {
    try {
      const { parsedBody } = ctx;
      const { status, note } = parsedBody;
      await BookingService.updateStatus(bookingId, status, note);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Cập nhật trạng thái thành công' }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: error.message }));
    }
  },

  // POST /api/bookings/:id/cancel
  async cancelBooking(req, res, ctx, bookingId) {
    try {
      const { parsedBody } = ctx;
      const reason = parsedBody?.reason || '';
      await BookingService.cancelBooking(bookingId, reason);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Hủy lịch hẹn thành công' }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: error.message }));
    }
  }
};

module.exports = BookingController;

