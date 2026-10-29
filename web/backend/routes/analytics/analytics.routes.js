// =========================================================================
// THỐNG KÊ DOANH THU & BÁO CÁO HIỆU SUẤT
// Bảng CSDL: HoaDon, LichHen, NhanVien, ChiNhanh
// =========================================================================

const { querySql } = require('../../database/db');

async function handleAnalyticsRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl } = ctx;

  // GET /api/analytics/revenue - Báo cáo tổng doanh thu và số lượng hóa đơn
  // Tham số: branch_id
  if (pathname === '/api/analytics/revenue' && method === 'GET') {
    const branchParam = parsedUrl.searchParams.get('branch_id');
    let q = `
      SELECT 
        ISNULL(SUM(TongTien), 0) AS TongDoanhThu,
        COUNT(*) AS TongHoaDon
      FROM HoaDon
      WHERE TrangThai = N'Đã thanh toán'
    `;
    const params = [];
    if (branchParam) {
      q += ` AND MaChiNhanh = ?`;
      params.push(branchParam);
    }
    const rows = await querySql(q, params);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      totalRevenue: parseFloat(rows[0]?.TongDoanhThu || 0),
      totalInvoices: rows[0]?.TongHoaDon || 0,
      currency: 'VND'
    }));
    return true;
  }

  // GET /api/analytics/stylists/:id/commissions - Tính tiền hoa hồng cho stylist
  // Quy tắc nghiệp vụ: Stylist nhận 20% trên tổng giá trị các lịch hẹn đã 'Hoàn thành'
  if (pathname.includes('/analytics/stylists/') && pathname.includes('/commissions')) {
    const parts = pathname.split('/');
    const stylistId = parts[4];
    const rows = await querySql(
      `SELECT COUNT(*) AS TongLich, ISNULL(SUM(TongTien), 0) AS TongTien
       FROM LichHen 
       WHERE MaNhanVien = ? AND TrangThai = N'Hoàn thành'`,
      [stylistId]
    );
    const revenue = parseFloat(rows[0]?.TongTien || 0);
    const count = rows[0]?.TongLich || 0;
    const commissionRate = 0.20; // Tỷ lệ hoa hồng 20% cố định theo chính sách salon
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      stylistId,
      completedAppointments: count,
      generatedRevenue: revenue,
      commissionRate: '20%',
      commissionAmount: Math.round(revenue * commissionRate),
      currency: 'VND'
    }));
    return true;
  }

  return false;
}

module.exports = handleAnalyticsRoutes;
module.exports.handleAnalyticsRoutes = handleAnalyticsRoutes;
module.exports.default = handleAnalyticsRoutes;

