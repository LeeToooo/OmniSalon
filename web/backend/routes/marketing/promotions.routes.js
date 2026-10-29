// =========================================================================
// QUẢN LÝ KHUYẾN MÃI & MÃ GIẢM GIÁ
// Bảng CSDL: KhuyenMai, KhuyenMai_DichVu, KhuyenMai_SanPham
// =========================================================================

const { querySql } = require('../../database/db');

async function handlePromotionRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // GET /api/promotions - Danh sách chương trình ưu đãi
  if ((pathname === '/api/promotions' || pathname === '/api/coupons' || pathname === '/api/vouchers') && method === 'GET') {
    const rows = await querySql(
      `SELECT MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, DoiTuongApDung, 
              CONVERT(VARCHAR(10), NgayBatDau, 120) AS NgayBatDau, 
              CONVERT(VARCHAR(10), NgayKetThuc, 120) AS NgayKetThuc, 
              TrangThai FROM KhuyenMai`
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  // POST /api/promotions - Tạo chương trình khuyến mãi mới
  if (pathname === '/api/promotions' && method === 'POST') {
    const body = parsedBody || {};
    const maxKm = await querySql(`SELECT TOP 1 MaKhuyenMai FROM KhuyenMai ORDER BY LEN(MaKhuyenMai) DESC, MaKhuyenMai DESC`);
    let nextN = 6;
    if (maxKm && maxKm[0]) {
      const m = maxKm[0].MaKhuyenMai.match(/KM(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const kmId = (body.id || body.MaKhuyenMai || body.code || ('KM' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = body.name || body.TenKhuyenMai || body.title || 'Khuyến mãi mới';
    const type = body.type || body.HinhThuc || (body.discountType === 'percent' ? `Giảm ${body.value}%` : `Giảm ${body.value}đ`);
    const value = parseFloat(body.value || body.GiaTriGiam || 10);
    const target = body.target || body.DoiTuongApDung || 'Tất cả khách hàng';
    const startDate = body.startDate || body.NgayBatDau || new Date().toISOString().split('T')[0];
    const endDate = body.endDate || body.NgayKetThuc || '2027-12-31';
    const status = body.status || body.TrangThai || 'Đang áp dụng';

    await querySql(
      `INSERT INTO KhuyenMai (MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, DoiTuongApDung, NgayBatDau, NgayKetThuc, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [kmId, name, type, value, target, startDate, endDate, status]
    );

    // Liên kết với các dịch vụ cụ thể nếu có
    if (Array.isArray(body.serviceIds)) {
      for (const sId of body.serviceIds) {
        await querySql(`INSERT INTO KhuyenMai_DichVu (MaKhuyenMai, MaDichVu) VALUES (?, ?)`, [kmId, sId]).catch(() => {});
      }
    }
    // Liên kết với các sản phẩm cụ thể nếu có
    if (Array.isArray(body.productIds)) {
      for (const pId of body.productIds) {
        await querySql(`INSERT INTO KhuyenMai_SanPham (MaKhuyenMai, MaSanPham) VALUES (?, ?)`, [kmId, pId]).catch(() => {});
      }
    }

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, promotion: { id: kmId, code: kmId, name, type, value, startDate, endDate, status } }));
    return true;
  }

  // DELETE /api/promotions/:id - Xóa chương trình khuyến mãi
  if (pathname.startsWith('/api/promotions/') && method === 'DELETE') {
    const id = pathname.replace('/api/promotions/', '').trim();
    await querySql(`DELETE FROM KhuyenMai_DichVu WHERE MaKhuyenMai = ?`, [id]);
    await querySql(`DELETE FROM KhuyenMai_SanPham WHERE MaKhuyenMai = ?`, [id]);
    await querySql(`DELETE FROM KhuyenMai WHERE MaKhuyenMai = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa khuyến mãi thành công', id }));
    return true;
  }

  return false;
}

module.exports = handlePromotionRoutes;
module.exports.handlePromotionRoutes = handlePromotionRoutes;
module.exports.default = handlePromotionRoutes;

