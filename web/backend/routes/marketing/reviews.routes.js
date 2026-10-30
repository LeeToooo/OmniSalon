// =========================================================================
// QUẢN LÝ ĐÁNH GIÁ & PHẢN HỒI KHÁCH HÀNG
// Bảng CSDL: DanhGia, KhachHang, DonHang, LichHen
// =========================================================================

const { querySql } = require('../../database/db');
const { resolveOrCreateCustomer } = require('../../services/helper_service');

async function handleReviewRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // GET /api/reviews - Lấy danh sách đánh giá (lọc theo productId, orderId hoặc customerId)
  if (pathname === '/api/reviews' && method === 'GET') {
    const orderIdParam = parsedUrl.searchParams.get('order_id') || parsedUrl.searchParams.get('orderId');
    const customerIdParam = parsedUrl.searchParams.get('customer_id') || parsedUrl.searchParams.get('customerId');
    const productIdParam = parsedUrl.searchParams.get('product_id') || parsedUrl.searchParams.get('productId');

    let queryStr = '';
    const params = [];

    if (productIdParam) {
      queryStr = `
        SELECT DISTINCT dg.MaDanhGia, dg.MaKhachHang, dg.MaLichHen, dg.MaDonHang, dg.SoSao, dg.NoiDung, dg.HinhAnh,
               dg.NgayDanhGia,
               CONVERT(VARCHAR(19), dg.NgayDanhGia, 120) AS NgayDanhGiaStr,
               dg.TrangThai,
               kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang
        FROM DanhGia dg
        LEFT JOIN DonHang dh ON dg.MaDonHang = dh.MaDonHang
        LEFT JOIN ChiTietDonHang ctdh ON dh.MaDonHang = ctdh.MaDonHang
        LEFT JOIN KhachHang kh ON dg.MaKhachHang = kh.MaKhachHang
        WHERE dg.TrangThai = N'Hiển thị' AND (ctdh.MaSanPham = ? OR dg.NoiDung LIKE ?)
        ORDER BY dg.NgayDanhGia DESC
      `;
      params.push(productIdParam, `%${productIdParam}%`);
    } else {
      queryStr = `
        SELECT dg.MaDanhGia, dg.MaKhachHang, dg.MaLichHen, dg.MaDonHang, dg.SoSao, dg.NoiDung, dg.HinhAnh,
               CONVERT(VARCHAR(19), dg.NgayDanhGia, 120) AS NgayDanhGia,
               dg.TrangThai,
               kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang
        FROM DanhGia dg
        LEFT JOIN KhachHang kh ON dg.MaKhachHang = kh.MaKhachHang
        WHERE dg.TrangThai = N'Hiển thị'
      `;
      if (orderIdParam) {
        queryStr += ' AND dg.MaDonHang = ?';
        params.push(orderIdParam);
      } else if (customerIdParam) {
        queryStr += ' AND dg.MaKhachHang = ?';
        params.push(customerIdParam);
      }
      queryStr += ' ORDER BY dg.NgayDanhGia DESC';
    }

    const rows = await querySql(queryStr, params);
    const mapped = rows.map(r => ({
      id: r.MaDanhGia,
      MaDanhGia: r.MaDanhGia,
      customerId: r.MaKhachHang,
      customerName: r.TenKhachHang || 'Khách Hàng',
      customerPhone: r.SdtKhachHang || '',
      bookingId: r.MaLichHen,
      orderId: r.MaDonHang,
      rating: r.SoSao,
      comment: r.NoiDung,
      image: r.HinhAnh,
      date: r.NgayDanhGiaStr || r.NgayDanhGia,
      status: r.TrangThai
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(mapped));
    return true;
  }

  // POST /api/reviews - Gửi đánh giá phản hồi
  if (pathname === '/api/reviews' && method === 'POST') {
    try {
      const r = parsedBody || {};
      const comment = (r.comment || r.content || r.NoiDung || 'Dịch vụ và sản phẩm rất tốt!').trim();
      const stars = Math.min(5, Math.max(1, parseInt(r.rating || r.SoSao || 5, 10)));
      let dhId = (r.orderId || r.MaDonHang || '').trim() || null;
      let lhId = (r.bookingId || r.MaLichHen || '').trim() || null;

      // Chuẩn hóa mã khách hàng nếu có tiền tố tài khoản
      let rawKhId = (r.customerId || r.userId || '').trim();
      if (rawKhId.startsWith('TK_')) rawKhId = rawKhId.substring(3);

      let khId = null;
      if (rawKhId) {
        const checkKh = await querySql('SELECT MaKhachHang FROM KhachHang WHERE MaKhachHang = ?', [rawKhId]);
        if (checkKh && checkKh.length > 0) {
          khId = checkKh[0].MaKhachHang;
        }
      }

      // Ràng buộc CSDL: Mỗi đánh giá chỉ thuộc về đơn hàng HOẶC lịch hẹn
      if (dhId) {
        let orderRows = await querySql('SELECT MaDonHang, MaKhachHang, TrangThai FROM DonHang WHERE MaDonHang = ?', [dhId]);
        if (orderRows && orderRows.length > 0) {
          if (!khId) khId = orderRows[0].MaKhachHang;
        } else {
          if (!khId) {
            khId = await resolveOrCreateCustomer({
              customerId: rawKhId,
              customerName: r.customerName || 'Khách Hàng',
              customerPhone: r.customerPhone || ''
            });
          }
          await querySql(
            `INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu)
             VALUES (?, ?, 'CN01', GETDATE(), 432000, N'Nhận tại chi nhánh Omni Salon', N'Nhận tại quầy', N'Đã giao', N'Đồng bộ đánh giá khách hàng')`,
            [dhId, khId]
          ).catch(() => {});
        }
        lhId = null;
      } else if (lhId) {
        const bookingRows = await querySql('SELECT MaLichHen, MaKhachHang FROM LichHen WHERE MaLichHen = ?', [lhId]);
        if (bookingRows && bookingRows[0] && !khId) {
          khId = bookingRows[0].MaKhachHang;
        } else if (!bookingRows || bookingRows.length === 0) {
          if (!khId) {
            khId = await resolveOrCreateCustomer({
              customerId: rawKhId,
              customerName: r.customerName || 'Khách Hàng',
              customerPhone: r.customerPhone || ''
            });
          }
          await querySql(
            `INSERT INTO LichHen (MaLichHen, MaKhachHang, MaChiNhanh, MaNhanVien, NgayHen, GioBatDau, GioKetThuc, TongTien, TrangThai, GhiChu)
             VALUES (?, ?, 'CN01', 'NV02', CAST(GETDATE() AS DATE), '10:00:00', '10:45:00', 330000, N'Đã hoàn thành', N'Đồng bộ đánh giá lịch hẹn')`,
            [lhId, khId]
          ).catch(() => {});
        }
        dhId = null;
      }

      if (!khId) {
        khId = await resolveOrCreateCustomer({
          customerId: rawKhId,
          customerName: r.customerName || 'Khách Hàng',
          customerPhone: r.customerPhone || ''
        });
      }

      // Nếu đơn hàng hoặc lịch hẹn này đã có đánh giá trước đó -> Cập nhật nội dung
      if (dhId) {
        const existingReview = await querySql('SELECT TOP 1 MaDanhGia FROM DanhGia WHERE MaDonHang = ?', [dhId]);
        if (existingReview && existingReview.length > 0) {
          const existingId = existingReview[0].MaDanhGia;
          await querySql(
            `UPDATE DanhGia SET SoSao = ?, NoiDung = ?, NgayDanhGia = GETDATE(), TrangThai = N'Hiển thị' WHERE MaDanhGia = ?`,
            [stars, comment, existingId]
          );
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            message: 'Cập nhật đánh giá thành công!',
            review: { id: existingId, orderId: dhId, rating: stars, comment, customerId: khId }
          }));
          return true;
        }
      } else if (lhId) {
        const existingLhReview = await querySql('SELECT TOP 1 MaDanhGia FROM DanhGia WHERE MaLichHen = ?', [lhId]);
        if (existingLhReview && existingLhReview.length > 0) {
          const existingId = existingLhReview[0].MaDanhGia;
          await querySql(
            `UPDATE DanhGia SET SoSao = ?, NoiDung = ?, NgayDanhGia = GETDATE(), TrangThai = N'Hiển thị' WHERE MaDanhGia = ?`,
            [stars, comment, existingId]
          );
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            message: 'Cập nhật đánh giá thành công!',
            review: { id: existingId, bookingId: lhId, rating: stars, comment, customerId: khId }
          }));
          return true;
        }
      }

      // Tạo mã đánh giá tự tăng
      const allDg = await querySql(`SELECT MaDanhGia FROM DanhGia WHERE MaDanhGia LIKE 'DG%'`);
      let maxNum = 10;
      if (allDg && allDg.length > 0) {
        allDg.forEach(row => {
          const m = (row.MaDanhGia || '').match(/DG(\d+)/i);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
      }
      const dgId = 'DG' + (maxNum + 1 < 10 ? '0' + (maxNum + 1) : (maxNum + 1));

      await querySql(
        `INSERT INTO DanhGia (MaDanhGia, MaKhachHang, MaLichHen, MaDonHang, SoSao, NoiDung, HinhAnh, NgayDanhGia, TrangThai, CoFlag) 
         VALUES (?, ?, ?, ?, ?, ?, NULL, GETDATE(), N'Hiển thị', 0)`,
        [dgId, khId, lhId, dhId, stars, comment]
      );

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Gửi đánh giá thành công!',
        review: { id: dgId, orderId: dhId, bookingId: lhId, rating: stars, comment, customerId: khId } 
      }));
      return true;
    } catch (revErr) {
      console.error('[Lỗi Đánh Giá]', revErr);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: revErr.message }));
      return true;
    }
  }

  return false;
}

module.exports = handleReviewRoutes;
module.exports.handleReviewRoutes = handleReviewRoutes;
module.exports.default = handleReviewRoutes;

