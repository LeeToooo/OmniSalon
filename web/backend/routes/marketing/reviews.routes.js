const { querySql } = require('../../database/db');
const { resolveOrCreateCustomer } = require('../../services/helper_service');
const { enforceAuth, extractAuthUser, isStaffRole } = require('../../middlewares/auth_middleware');
const auditService = require('../../services/audit.service');
const { clearDbSnapshotCache } = require('../auth/accounts.routes');

function mapReviewRow(r, canSeePhone) {
  const productId = r.MaSanPham || r.MaSanPhamDon || null;
  const serviceId = r.MaDichVu || r.MaDichVuLich || null;
  const targetName =
    r.TenSanPhamDirect ||
    r.TenDichVuDirect ||
    r.TenSanPhamDon ||
    r.TenDichVuLich ||
    (r.MaLichHen ? `Lịch #${r.MaLichHen}` : (r.MaDonHang ? `Đơn #${r.MaDonHang}` : 'Omni Salon'));
  return {
    id: r.MaDanhGia,
    MaDanhGia: r.MaDanhGia,
    customerId: r.MaKhachHang,
    customerName: r.TenKhachHang || 'Khách Hàng',
    customerPhone: canSeePhone ? (r.SdtKhachHang || '') : '',
    bookingId: r.MaLichHen || null,
    MaLichHen: r.MaLichHen || null,
    orderId: r.MaDonHang || null,
    MaDonHang: r.MaDonHang || null,
    productId,
    MaSanPham: r.MaSanPham || productId,
    serviceId,
    MaDichVu: r.MaDichVu || serviceId,
    targetName,
    rating: Number(r.SoSao || 5),
    SoSao: Number(r.SoSao || 5),
    comment: r.NoiDung || '',
    NoiDung: r.NoiDung || '',
    adminReply: r.PhanHoiAdmin || '',
    PhanHoiAdmin: r.PhanHoiAdmin || '',
    replyDate: r.NgayPhanHoiStr || r.NgayPhanHoi || null,
    NgayPhanHoi: r.NgayPhanHoiStr || r.NgayPhanHoi || null,
    image: r.HinhAnh || null,
    date: r.NgayDanhGiaStr || r.NgayDanhGia,
    NgayDanhGia: r.NgayDanhGiaStr || r.NgayDanhGia,
    status: r.TrangThai || 'Hiển thị',
    TrangThai: r.TrangThai || 'Hiển thị'
  };
}

async function handleReviewRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // GET /api/reviews - Lấy danh sách đánh giá (hỗ trợ include_hidden=true cho quản trị)
  if (pathname === '/api/reviews' && method === 'GET') {
    const authUser = extractAuthUser(req);
    const canSeePhone = isStaffRole(authUser);
    const includeHidden = parsedUrl.searchParams.get('include_hidden') === 'true' && canSeePhone;
    const statusFilterClause = includeHidden ? '' : " AND (dg.TrangThai IS NULL OR dg.TrangThai <> N'Đã ẩn')";

    const orderIdParam = parsedUrl.searchParams.get('order_id') || parsedUrl.searchParams.get('orderId');
    const customerIdParam = parsedUrl.searchParams.get('customer_id') || parsedUrl.searchParams.get('customerId');
    const productIdParam = parsedUrl.searchParams.get('product_id') || parsedUrl.searchParams.get('productId');
    const serviceIdParam = parsedUrl.searchParams.get('service_id') || parsedUrl.searchParams.get('serviceId');

    const baseSelect = `
      dg.MaDanhGia, dg.MaKhachHang, dg.MaLichHen, dg.MaDonHang, dg.MaSanPham, dg.MaDichVu,
      dg.SoSao, dg.NoiDung, dg.HinhAnh, dg.NgayDanhGia,
      CONVERT(VARCHAR(19), dg.NgayDanhGia, 120) AS NgayDanhGiaStr,
      dg.TrangThai, dg.PhanHoiAdmin,
      CONVERT(VARCHAR(19), dg.NgayPhanHoi, 120) AS NgayPhanHoiStr,
      kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
      sp.TenSanPham AS TenSanPhamDirect,
      dv.TenDichVu AS TenDichVuDirect,
      (SELECT TOP 1 sp2.TenSanPham FROM ChiTietDonHang ctdh2 JOIN SanPham sp2 ON ctdh2.MaSanPham = sp2.MaSanPham WHERE ctdh2.MaDonHang = dg.MaDonHang) AS TenSanPhamDon,
      (SELECT TOP 1 ctdh2.MaSanPham FROM ChiTietDonHang ctdh2 WHERE ctdh2.MaDonHang = dg.MaDonHang) AS MaSanPhamDon,
      (SELECT TOP 1 ISNULL(dv2.TenDichVu, cb2.TenCombo) FROM ChiTietLichHen ctlh2 LEFT JOIN DichVu dv2 ON ctlh2.MaDichVu = dv2.MaDichVu LEFT JOIN ComboDichVu cb2 ON ctlh2.MaCombo = cb2.MaCombo WHERE ctlh2.MaLichHen = dg.MaLichHen) AS TenDichVuLich,
      (SELECT TOP 1 ISNULL(ctlh2.MaDichVu, ctlh2.MaCombo) FROM ChiTietLichHen ctlh2 WHERE ctlh2.MaLichHen = dg.MaLichHen) AS MaDichVuLich
    `;

    let queryStr = '';
    const params = [];

    if (productIdParam) {
      queryStr = `
        SELECT DISTINCT ${baseSelect}
        FROM DanhGia dg
        LEFT JOIN DonHang dh ON dg.MaDonHang = dh.MaDonHang
        LEFT JOIN ChiTietDonHang ctdh ON dh.MaDonHang = ctdh.MaDonHang
        LEFT JOIN KhachHang kh ON dg.MaKhachHang = kh.MaKhachHang
        LEFT JOIN SanPham sp ON dg.MaSanPham = sp.MaSanPham
        LEFT JOIN DichVu dv ON dg.MaDichVu = dv.MaDichVu
        WHERE (dg.MaSanPham = ? OR ctdh.MaSanPham = ?) ${statusFilterClause}
        ORDER BY dg.NgayDanhGia DESC
      `;
      params.push(productIdParam, productIdParam);
    } else if (serviceIdParam) {
      queryStr = `
        SELECT DISTINCT ${baseSelect}
        FROM DanhGia dg
        LEFT JOIN LichHen lh ON dg.MaLichHen = lh.MaLichHen
        LEFT JOIN ChiTietLichHen ctlh ON lh.MaLichHen = ctlh.MaLichHen
        LEFT JOIN KhachHang kh ON dg.MaKhachHang = kh.MaKhachHang
        LEFT JOIN SanPham sp ON dg.MaSanPham = sp.MaSanPham
        LEFT JOIN DichVu dv ON dg.MaDichVu = dv.MaDichVu
        WHERE (dg.MaDichVu = ? OR ctlh.MaDichVu = ? OR ctlh.MaCombo = ?) ${statusFilterClause}
        ORDER BY dg.NgayDanhGia DESC
      `;
      params.push(serviceIdParam, serviceIdParam, serviceIdParam);
    } else {
      queryStr = `
        SELECT ${baseSelect}
        FROM DanhGia dg
        LEFT JOIN KhachHang kh ON dg.MaKhachHang = kh.MaKhachHang
        LEFT JOIN SanPham sp ON dg.MaSanPham = sp.MaSanPham
        LEFT JOIN DichVu dv ON dg.MaDichVu = dv.MaDichVu
        WHERE 1 = 1 ${statusFilterClause}
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

    const rows = (await querySql(queryStr, params)) || [];
    const mapped = rows.map(r => mapReviewRow(r, canSeePhone));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(mapped));
    return true;
  }

  // POST /api/reviews - Gửi đánh giá trực tiếp cho sản phẩm / dịch vụ hoặc qua đơn hàng / lịch hẹn
  if (pathname === '/api/reviews' && method === 'POST') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    try {
      const r = parsedBody || {};
      const comment = (r.comment || r.content || r.NoiDung || '').trim();
      if (!comment || comment.length < 3) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập nội dung nhận xét ít nhất 3 ký tự.' }));
        return true;
      }
      const stars = Math.min(5, Math.max(1, parseInt(r.rating || r.SoSao || 5, 10)));
      let dhId = (r.orderId || r.MaDonHang || '').trim() || null;
      let lhId = (r.bookingId || r.MaLichHen || '').trim() || null;
      let maSanPham = (r.productId || r.MaSanPham || '').trim() || null;
      let maDichVu = (r.serviceId || r.MaDichVu || '').trim() || null;

      let rawKhId = isStaffRole(authUser)
        ? ((r.customerId || r.userId || authUser.customerId || '').trim())
        : ((authUser.customerId || r.customerId || '').trim());
      if (rawKhId.startsWith('TK_')) rawKhId = rawKhId.substring(3);

      let khId = null;
      if (rawKhId) {
        const checkKh = await querySql('SELECT MaKhachHang FROM KhachHang WHERE MaKhachHang = ?', [rawKhId]);
        if (checkKh && checkKh.length > 0) {
          khId = checkKh[0].MaKhachHang;
        }
      }

      if (!khId) {
        khId = await resolveOrCreateCustomer({
          customerId: rawKhId,
          customerName: r.customerName || authUser.fullName || 'Khách Hàng',
          customerPhone: r.customerPhone || authUser.phone || ''
        });
      }

      if (dhId) {
        const orderRows = await querySql('SELECT MaDonHang, MaKhachHang, TrangThai FROM DonHang WHERE MaDonHang = ?', [dhId]);
        if (!orderRows || orderRows.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: `Không tìm thấy đơn hàng #${dhId} để đánh giá.` }));
          return true;
        }
        if (!isStaffRole(authUser) && orderRows[0].MaKhachHang !== khId) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Bạn chỉ được đánh giá đơn hàng của chính mình.' }));
          return true;
        }
        if (String(orderRows[0].TrangThai || '').trim() === 'Đã hủy') {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Không thể gửi đánh giá cho đơn hàng đã hủy.' }));
          return true;
        }
        lhId = null;
      } else if (lhId) {
        const bookingRows = await querySql('SELECT MaLichHen, MaKhachHang, TrangThai FROM LichHen WHERE MaLichHen = ?', [lhId]);
        if (!bookingRows || !bookingRows[0]) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: `Không tìm thấy lịch hẹn #${lhId} để đánh giá.` }));
          return true;
        }
        if (!isStaffRole(authUser) && bookingRows[0].MaKhachHang !== khId) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Bạn chỉ được đánh giá lịch hẹn của chính mình.' }));
          return true;
        }
        if (String(bookingRows[0].TrangThai || '').trim() === 'Đã hủy') {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Không thể gửi đánh giá cho lịch hẹn đã hủy.' }));
          return true;
        }
        dhId = null;
      } else if (maSanPham) {
        const spCheck = await querySql('SELECT TOP 1 MaSanPham FROM SanPham WHERE MaSanPham = ?', [maSanPham]);
        if (!spCheck || !spCheck[0]) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: `Không tìm thấy sản phẩm ${maSanPham}.` }));
          return true;
        }
      } else if (maDichVu) {
        const dvCheck = await querySql('SELECT TOP 1 MaDichVu FROM DichVu WHERE MaDichVu = ?', [maDichVu]);
        if (!dvCheck || !dvCheck[0]) {
          // Nếu là Combo (CB...) thì ánh xạ sang dịch vụ thành phần đầu tiên để thỏa FK_DanhGia_DichVu
          const cbChild = await querySql('SELECT TOP 1 MaDichVu FROM ChiTietComboDichVu WHERE MaCombo = ?', [maDichVu]).catch(() => []);
          if (cbChild && cbChild[0]) {
            maDichVu = cbChild[0].MaDichVu;
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: `Không tìm thấy dịch vụ ${maDichVu}.` }));
            return true;
          }
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Thiếu thông tin sản phẩm, dịch vụ, đơn hàng hoặc lịch hẹn cần đánh giá.' }));
        return true;
      }

      // Cập nhật nếu đánh giá gắn với mã đơn hàng / mã lịch hẹn cụ thể đã tồn tại
      if (dhId) {
        const existingReview = await querySql('SELECT TOP 1 MaDanhGia FROM DanhGia WHERE MaDonHang = ?', [dhId]);
        if (existingReview && existingReview[0]) {
          const existingId = existingReview[0].MaDanhGia;
          await querySql(
            `UPDATE DanhGia SET SoSao = ?, NoiDung = ?, NgayDanhGia = GETDATE(), TrangThai = N'Hiển thị' WHERE MaDanhGia = ?`,
            [stars, comment, existingId]
          );
          clearDbSnapshotCache('review_updated');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            message: 'Cập nhật đánh giá thành công!',
            review: { id: existingId, orderId: dhId, productId: maSanPham, rating: stars, comment, customerId: khId, status: 'Hiển thị' }
          }));
          return true;
        }
      } else if (lhId) {
        const existingLhReview = await querySql('SELECT TOP 1 MaDanhGia FROM DanhGia WHERE MaLichHen = ?', [lhId]);
        if (existingLhReview && existingLhReview[0]) {
          const existingId = existingLhReview[0].MaDanhGia;
          await querySql(
            `UPDATE DanhGia SET SoSao = ?, NoiDung = ?, NgayDanhGia = GETDATE(), TrangThai = N'Hiển thị' WHERE MaDanhGia = ?`,
            [stars, comment, existingId]
          );
          clearDbSnapshotCache('review_updated');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            message: 'Cập nhật đánh giá thành công!',
            review: { id: existingId, bookingId: lhId, serviceId: maDichVu, rating: stars, comment, customerId: khId, status: 'Hiển thị' }
          }));
          return true;
        }
      }

      const allDg = await querySql(`SELECT MaDanhGia FROM DanhGia WHERE MaDanhGia LIKE 'DG%'`);
      let maxNum = 10;
      if (allDg && allDg.length > 0) {
        allDg.forEach(row => {
          const m = (row.MaDanhGia || '').match(/^DG0*(\d+)$/i);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
      }
      const nextNum = maxNum + 1;
      const dgId = 'DG' + (nextNum < 10 ? '000' + nextNum : (nextNum < 100 ? '00' + nextNum : (nextNum < 1000 ? '0' + nextNum : nextNum)));

      await querySql(
        `INSERT INTO DanhGia (MaDanhGia, MaKhachHang, MaLichHen, MaDonHang, MaSanPham, MaDichVu, SoSao, NoiDung, HinhAnh, NgayDanhGia, TrangThai, CoFlag)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, GETDATE(), N'Hiển thị', 0)`,
        [dgId, khId, lhId, dhId, maSanPham, maDichVu, stars, comment]
      );

      clearDbSnapshotCache('review_created');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        message: 'Gửi đánh giá thành công!',
        review: {
          id: dgId,
          orderId: dhId,
          bookingId: lhId,
          productId: maSanPham,
          serviceId: maDichVu,
          rating: stars,
          comment,
          customerId: khId,
          customerName: r.customerName || authUser.fullName || 'Khách Hàng',
          status: 'Hiển thị',
          date: new Date().toISOString()
        }
      }));
      return true;
    } catch (revErr) {
      console.error('[Lỗi Đánh Giá]', revErr);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: revErr.message }));
      return true;
    }
  }

  // PUT /api/reviews/:id/status - Ẩn / Hiện đánh giá (Quản trị / Quản lý)
  if (pathname.startsWith('/api/reviews/') && pathname.endsWith('/status') && (method === 'PUT' || method === 'PATCH')) {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER']);
    if (!authUser) return true;

    const id = decodeURIComponent(pathname.split('/')[3] || '').trim();
    const body = parsedBody || {};
    const existing = await querySql('SELECT MaDanhGia, TrangThai FROM DanhGia WHERE MaDanhGia = ?', [id]);
    if (!existing || !existing[0]) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: `Không tìm thấy đánh giá ${id}.` }));
      return true;
    }
    const curStatus = existing[0].TrangThai || 'Hiển thị';
    const requested = body.status || body.TrangThai;
    const newStatus = requested
      ? ((String(requested).toLowerCase().includes('ẩn') || requested === 'hidden') ? 'Đã ẩn' : 'Hiển thị')
      : (curStatus === 'Đã ẩn' ? 'Hiển thị' : 'Đã ẩn');

    await querySql('UPDATE DanhGia SET TrangThai = ? WHERE MaDanhGia = ?', [newStatus, id]);
    clearDbSnapshotCache('review_status');

    auditService.logAudit({
      actor: authUser.fullName || authUser.name || authUser.username,
      role: authUser.role || 'SUPER_ADMIN',
      action: 'MODERATE_REVIEW_STATUS',
      entityType: 'DanhGia',
      entityId: id,
      before: { TrangThai: curStatus },
      after: { TrangThai: newStatus },
      details: `${authUser.fullName || authUser.username} chuyển trạng thái đánh giá ${id} sang "${newStatus}"`
    }).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id, status: newStatus, message: `Đã chuyển trạng thái sang "${newStatus}"!` }));
    return true;
  }

  // PUT /api/reviews/:id/reply - Phản hồi đánh giá từ Salon
  if (pathname.startsWith('/api/reviews/') && pathname.endsWith('/reply') && (method === 'PUT' || method === 'POST')) {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER']);
    if (!authUser) return true;

    const id = decodeURIComponent(pathname.split('/')[3] || '').trim();
    const body = parsedBody || {};
    const replyText = String(body.reply || body.adminReply || body.PhanHoiAdmin || '').trim();
    if (!replyText) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Nội dung phản hồi không được để trống.' }));
      return true;
    }

    const existing = await querySql('SELECT MaDanhGia FROM DanhGia WHERE MaDanhGia = ?', [id]);
    if (!existing || !existing[0]) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: `Không tìm thấy đánh giá ${id}.` }));
      return true;
    }

    await querySql('UPDATE DanhGia SET PhanHoiAdmin = ?, NgayPhanHoi = GETDATE() WHERE MaDanhGia = ?', [replyText, id]);
    clearDbSnapshotCache('review_reply');

    auditService.logAudit({
      actor: authUser.fullName || authUser.name || authUser.username,
      role: authUser.role || 'SUPER_ADMIN',
      action: 'REPLY_REVIEW',
      entityType: 'DanhGia',
      entityId: id,
      after: { PhanHoiAdmin: replyText },
      details: `${authUser.fullName || authUser.username} phản hồi đánh giá ${id}`
    }).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      id,
      adminReply: replyText,
      replyDate: new Date().toISOString(),
      message: 'Đã lưu phản hồi đánh giá thành công!'
    }));
    return true;
  }

  // DELETE /api/reviews/:id - Xóa đánh giá
  if (pathname.startsWith('/api/reviews/') && method === 'DELETE') {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER']);
    if (!authUser) return true;

    const id = decodeURIComponent(pathname.split('/')[3] || '').trim();
    const existing = await querySql('SELECT MaDanhGia, NoiDung FROM DanhGia WHERE MaDanhGia = ?', [id]);
    if (!existing || !existing[0]) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: `Không tìm thấy đánh giá ${id}.` }));
      return true;
    }

    await querySql('DELETE FROM DanhGia WHERE MaDanhGia = ?', [id]);
    clearDbSnapshotCache('review_deleted');

    auditService.logAudit({
      actor: authUser.fullName || authUser.name || authUser.username,
      role: authUser.role || 'SUPER_ADMIN',
      action: 'DELETE_REVIEW',
      entityType: 'DanhGia',
      entityId: id,
      before: existing[0],
      details: `${authUser.fullName || authUser.username} xóa đánh giá ${id}`
    }).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id, message: `Đã xóa đánh giá ${id}!` }));
    return true;
  }

  return false;
}

module.exports = handleReviewRoutes;
module.exports.handleReviewRoutes = handleReviewRoutes;
module.exports.default = handleReviewRoutes;
