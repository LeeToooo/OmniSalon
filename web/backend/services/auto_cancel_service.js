// Dịch vụ tự động hủy lịch hẹn và đơn hàng quá hạn sau 12h đêm (No-Show Auto Cancel)
const { querySql } = require('../database/db');
const auditService = require('./audit.service');

let lastRunDay = null;
let midnightTimer = null;
let intervalTimer = null;

/**
 * Tự động quét và hủy các lịch hẹn dịch vụ và đơn hàng quá hạn qua 12h đêm
 * @param {Function} customSql - Hàm thực thi truy vấn tùy chọn (phục vụ test)
 * @returns {Promise<Object>} Kết quả xử lý
 */
async function autoCancelOverdueBookingsAndOrders(customSql = null) {
  const sql = customSql || querySql;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayIso = `${y}-${m}-${d}`;

  const result = {
    success: true,
    today: todayIso,
    cancelledBookings: [],
    cancelledOrders: [],
    cancelledBookingsCount: 0,
    cancelledOrdersCount: 0,
    executedAt: now.toISOString()
  };

  try {
    // 1. Quét danh sách lịch hẹn dịch vụ quá 12h đêm (ngày hẹn < hôm nay) mà khách không đến
    // Trạng thái chưa hoàn tất: 'Chờ xác nhận', 'Đã xác nhận', 'Chờ vào ghế', 'Chờ phục vụ', 'Confirmed', 'Waiting', 'Pending'
    const overdueBookings = await sql(`
      SELECT MaLichHen, MaKhachHang, NgayHen, GioBatDau, TrangThai, TongTien
      FROM LichHen
      WHERE CONVERT(VARCHAR(10), NgayHen, 120) < ?
        AND TrangThai NOT IN (N'Đã hủy', N'Hoàn thành', 'Completed', 'Cancelled')
    `, [todayIso]);

    if (overdueBookings && overdueBookings.length > 0) {
      const bookingIds = overdueBookings.map(b => b.MaLichHen);
      for (const b of overdueBookings) {
        const bId = b.MaLichHen;
        await sql(`
          UPDATE LichHen
          SET TrangThai = N'Đã hủy',
              LyDoHuy = ISNULL(LyDoHuy, N'') + N'[Hệ Thống] Tự động hủy qua 12h đêm do khách không đến theo lịch hẹn.'
          WHERE MaLichHen = ?
        `, [bId]);
        auditService.logAudit({
          actor: 'Hệ Thống Tự Động',
          role: 'SYSTEM',
          action: 'AUTO_CANCEL_BOOKING',
          entityType: 'LichHen',
          entityId: bId,
          branchId: b.MaChiNhanh || null,
          before: { TrangThai: b.TrangThai },
          after: { TrangThai: 'Đã hủy', LyDoHuy: '[Hệ Thống] Tự động hủy qua 12h đêm do khách không đến theo lịch hẹn.' },
          details: `Hệ thống tự động hủy lịch hẹn ${bId} do khách quá hạn 12h đêm chưa đến phục vụ`
        }).catch(() => {});
      }
      result.cancelledBookings = overdueBookings;
      result.cancelledBookingsCount = overdueBookings.length;
      console.log(`[AutoCancel] Đã tự động hủy ${overdueBookings.length} lịch hẹn dịch vụ quá hạn qua 12h đêm (No-show):`, bookingIds.join(', '));
    }

    // 2. Quét danh sách đơn hàng nhận tại quầy hoặc chờ xử lý quá 12h đêm chưa hoàn tất
    const overdueOrders = await sql(`
      SELECT MaDonHang, MaKhachHang, NgayDat, TrangThai, TongTien
      FROM DonHang
      WHERE CONVERT(VARCHAR(10), NgayDat, 120) < ?
        AND TrangThai IN (
          N'Chờ xử lý', N'Chờ xác nhận', N'Chờ thanh toán', N'Chờ nhận hàng',
          N'Đang xử lý', N'Đang chuẩn bị', N'Đang đóng gói',
          'Pending', 'pending', 'Processing', 'processing'
        )
        AND TrangThai NOT IN (N'Đang giao hàng', N'Đã giao', N'Hoàn tất', N'Hoàn thành', N'Đã hủy', 'Delivering', 'Completed', 'Delivered', 'Cancelled')
    `, [todayIso]);

    if (overdueOrders && overdueOrders.length > 0) {
      const orderIds = overdueOrders.map(o => o.MaDonHang);
      for (const o of overdueOrders) {
        const oId = o.MaDonHang;
        await sql(`
          UPDATE DonHang
          SET TrangThai = N'Đã hủy',
              GhiChu = ISNULL(GhiChu, N'') + N' [Hệ Thống: Tự động hủy qua 12h đêm do khách không đến nhận hàng]'
          WHERE MaDonHang = ?
        `, [oId]);
        auditService.logAudit({
          actor: 'Hệ Thống Tự Động',
          role: 'SYSTEM',
          action: 'AUTO_CANCEL_ORDER',
          entityType: 'DonHang',
          entityId: oId,
          before: { TrangThai: o.TrangThai },
          after: { TrangThai: 'Đã hủy', GhiChu: '[Hệ Thống: Tự động hủy qua 12h đêm do khách không đến nhận hàng]' },
          details: `Hệ thống tự động hủy đơn hàng ${oId} quá hạn 12h đêm chưa thanh toán/nhận hàng`
        }).catch(() => {});
      }
      try {
        const { clearDbSnapshotCache } = require('../routes/auth/accounts.routes');
        if (typeof clearDbSnapshotCache === 'function') clearDbSnapshotCache();
      } catch (_) {}
      result.cancelledOrders = overdueOrders;
      result.cancelledOrdersCount = overdueOrders.length;
      console.log(`[AutoCancel] Đã tự động hủy ${overdueOrders.length} đơn hàng quá hạn qua 12h đêm:`, orderIds.join(', '));
    }

    lastRunDay = todayIso;
  } catch (err) {
    console.warn('[AutoCancel] Lỗi khi quét tự động hủy đơn/lịch hẹn qua đêm:', err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

/**
 * Khởi động bộ lập lịch tự động kích hoạt vào đúng 00:00:00 (12h đêm) mỗi ngày
 * @param {Function} customSql - Hàm thực thi truy vấn tùy chọn
 */
function startMidnightAutoCancelScheduler(customSql = null) {
  // 1. Chạy ngay lập tức 1 lần khi server khởi động (để dọn dẹp các lịch cũ từ hôm trước)
  autoCancelOverdueBookingsAndOrders(customSql).catch(err => {
    console.warn('[AutoCancel] Khởi động lần đầu thất bại:', err.message);
  });

  // 2. Lập lịch cho lần chạy kế tiếp lúc 00:00:05 (12h đêm)
  function scheduleNextMidnight() {
    if (midnightTimer) clearTimeout(midnightTimer);

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

    console.log(`[AutoCancel] Bộ kích hoạt tự động qua 12h đêm được lên lịch sau ${Math.round(msUntilMidnight / 60000)} phút (${nextMidnight.toLocaleString('vi-VN')}).`);

    midnightTimer = setTimeout(async () => {
      console.log('[AutoCancel] Đã qua 12h đêm -> Kích hoạt tự động hủy các lịch hẹn và đơn hàng khách không đến...');
      await autoCancelOverdueBookingsAndOrders(customSql);
      scheduleNextMidnight();
    }, msUntilMidnight);
  }

  scheduleNextMidnight();

  // 3. Interval dự phòng mỗi 30 phút kiểm tra xem ngày hệ thống đã chuyển sang ngày mới chưa
  if (intervalTimer) clearInterval(intervalTimer);
  intervalTimer = setInterval(async () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;

    if (lastRunDay && lastRunDay !== todayIso) {
      console.log(`[AutoCancel Safety Poll] Phát hiện ngày mới (${todayIso}) -> Quét tự động hủy...`);
      await autoCancelOverdueBookingsAndOrders(customSql);
    }
  }, 30 * 60 * 1000);
}

/**
 * Kiểm tra nhanh khi có request nếu phát hiện ngày mới
 */
async function checkAndAutoCancelOnRequest(customSql = null) {
  const sql = customSql || querySql;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayIso = `${y}-${m}-${d}`;

  try {
    const hasOverdue = await sql(`
      SELECT TOP 1 1 FROM (
        SELECT MaLichHen FROM LichHen 
        WHERE CONVERT(VARCHAR(10), NgayHen, 120) < ? 
          AND TrangThai NOT IN (N'Đã hủy', N'Hoàn thành', 'Completed', 'Cancelled')
        UNION ALL
        SELECT MaDonHang FROM DonHang 
        WHERE CONVERT(VARCHAR(10), NgayDat, 120) < ? 
          AND TrangThai IN (
            N'Chờ xử lý', N'Chờ xác nhận', N'Chờ nhận hàng', N'Chờ thanh toán',
            N'Đang xử lý', N'Đang chuẩn bị', N'Đang đóng gói',
            'Pending', 'pending', 'Processing', 'processing'
          )
          AND TrangThai NOT IN (N'Đang giao hàng', N'Đã giao', N'Hoàn tất', N'Hoàn thành', N'Đã hủy', 'Delivering', 'Completed', 'Delivered', 'Cancelled')
      ) t
    `, [todayIso, todayIso]);

    if (hasOverdue && hasOverdue.length > 0) {
      return await autoCancelOverdueBookingsAndOrders(sql);
    }
  } catch (err) {
    console.warn('[AutoCancel] Non-blocking check error:', err.message);
  }
  return null;
}

function stopScheduler() {
  if (midnightTimer) clearTimeout(midnightTimer);
  if (intervalTimer) clearInterval(intervalTimer);
}

module.exports = {
  autoCancelOverdueBookingsAndOrders,
  startMidnightAutoCancelScheduler,
  checkAndAutoCancelOnRequest,
  stopScheduler
};

