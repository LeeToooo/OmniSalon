const { querySql } = require('../../database/db');

async function handlePromotionRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // GET /api/promotions - Danh sách chương trình ưu đãi
  if ((pathname === '/api/promotions' || pathname === '/api/coupons' || pathname === '/api/vouchers') && method === 'GET') {
    const rows = await querySql(
      `SELECT MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, DoiTuongApDung, 
              CONVERT(VARCHAR(10), NgayBatDau, 120) AS NgayBatDau, 
              CONVERT(VARCHAR(10), NgayKetThuc, 120) AS NgayKetThuc, 
              TrangThai FROM KhuyenMai ORDER BY MaKhuyenMai ASC`
    );
    const [kmDv, kmSp] = await Promise.all([
      querySql(`SELECT MaKhuyenMai, MaDichVu FROM KhuyenMai_DichVu`),
      querySql(`SELECT MaKhuyenMai, MaSanPham FROM KhuyenMai_SanPham`)
    ]);
    const result = (rows || []).map(r => ({
      ...r,
      id: r.MaKhuyenMai,
      code: r.MaKhuyenMai,
      name: r.TenKhuyenMai,
      type: r.HinhThuc,
      value: Number(r.GiaTriGiam) || 0,
      target: r.DoiTuongApDung || 'Tất cả khách hàng',
      startDate: r.NgayBatDau,
      endDate: r.NgayKetThuc,
      status: r.TrangThai || 'Đang áp dụng',
      serviceIds: (kmDv || []).filter(k => k.MaKhuyenMai === r.MaKhuyenMai).map(k => k.MaDichVu),
      productIds: (kmSp || []).filter(k => k.MaKhuyenMai === r.MaKhuyenMai).map(k => k.MaSanPham)
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
    return true;
  }

  // POST /api/promotions - Tạo chương trình khuyến mãi mới
  if (pathname === '/api/promotions' && method === 'POST') {
    const body = parsedBody || {};
    const maxKm = await querySql(`SELECT TOP 1 MaKhuyenMai FROM KhuyenMai ORDER BY LEN(MaKhuyenMai) DESC, MaKhuyenMai DESC`);
    let nextN = 1;
    if (maxKm && maxKm[0]) {
      const m = maxKm[0].MaKhuyenMai.match(/KM(d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const kmId = (body.id || body.MaKhuyenMai || body.code || ('KM' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = body.name || body.TenKhuyenMai || body.title || 'Khuyến mãi mới';
    const type = body.type || body.HinhThuc || (body.discountType === 'percent' ? `Giảm ${body.value}%` : `Giảm ${body.value}đ`);
    const value = parseFloat(body.value !== undefined ? body.value : (body.GiaTriGiam || 10));
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
        if (sId) await querySql(`INSERT INTO KhuyenMai_DichVu (MaKhuyenMai, MaDichVu) VALUES (?, ?)`, [kmId, sId]).catch(() => {});
      }
    }
    // Liên kết với các sản phẩm cụ thể nếu có
    if (Array.isArray(body.productIds)) {
      for (const pId of body.productIds) {
        if (pId) await querySql(`INSERT INTO KhuyenMai_SanPham (MaKhuyenMai, MaSanPham) VALUES (?, ?)`, [kmId, pId]).catch(() => {});
      }
    }

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ 
      success: true, 
      promotion: { 
        id: kmId, 
        code: kmId, 
        MaKhuyenMai: kmId, 
        name, 
        TenKhuyenMai: name, 
        type, 
        HinhThuc: type, 
        value, 
        GiaTriGiam: value, 
        target, 
        DoiTuongApDung: target, 
        startDate, 
        endDate, 
        status, 
        serviceIds: body.serviceIds || [], 
        productIds: body.productIds || [] 
      } 
    }));
    return true;
  }

  // PUT /api/promotions/:id - Sửa chương trình khuyến mãi
  if (pathname.startsWith('/api/promotions/') && method === 'PUT') {
    const kmId = pathname.replace('/api/promotions/', '').trim();
    const body = parsedBody || {};
    const name = body.name || body.TenKhuyenMai;
    const type = body.type || body.HinhThuc;
    const value = body.value !== undefined ? parseFloat(body.value) : (body.GiaTriGiam !== undefined ? parseFloat(body.GiaTriGiam) : null);
    const target = body.target || body.DoiTuongApDung;
    const startDate = body.startDate || body.NgayBatDau;
    const endDate = body.endDate || body.NgayKetThuc;
    const status = body.status || body.TrangThai;

    await querySql(
      `UPDATE KhuyenMai 
       SET TenKhuyenMai = COALESCE(?, TenKhuyenMai),
           HinhThuc = COALESCE(?, HinhThuc),
           GiaTriGiam = COALESCE(?, GiaTriGiam),
           DoiTuongApDung = COALESCE(?, DoiTuongApDung),
           NgayBatDau = COALESCE(?, NgayBatDau),
           NgayKetThuc = COALESCE(?, NgayKetThuc),
           TrangThai = COALESCE(?, TrangThai)
       WHERE MaKhuyenMai = ?`,
      [name || null, type || null, value !== null ? value : null, target || null, startDate || null, endDate || null, status || null, kmId]
    );

    if (Array.isArray(body.serviceIds)) {
      await querySql(`DELETE FROM KhuyenMai_DichVu WHERE MaKhuyenMai = ?`, [kmId]);
      for (const sId of body.serviceIds) {
        if (sId) await querySql(`INSERT INTO KhuyenMai_DichVu (MaKhuyenMai, MaDichVu) VALUES (?, ?)`, [kmId, sId]).catch(() => {});
      }
    }

    if (Array.isArray(body.productIds)) {
      await querySql(`DELETE FROM KhuyenMai_SanPham WHERE MaKhuyenMai = ?`, [kmId]);
      for (const pId of body.productIds) {
        if (pId) await querySql(`INSERT INTO KhuyenMai_SanPham (MaKhuyenMai, MaSanPham) VALUES (?, ?)`, [kmId, pId]).catch(() => {});
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã cập nhật khuyến mãi #' + kmId, id: kmId }));
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

  // GET /api/discount-rules - Danh sách quy tắc giảm giá cận hạn theo SQL Server
  if ((pathname === '/api/discount-rules' || pathname === '/api/admin/discount-rules') && method === 'GET') {
    const rows = await querySql(
      `SELECT MaQuyTac, TenQuyTac, SoNgayConLaiToiThieu, SoNgayConLaiToiDa, PhanTramGiam, TrangThai 
       FROM QuyTacGiamGiaTheoHan 
       ORDER BY SoNgayConLaiToiThieu DESC`
    );
    const result = (rows || []).map(r => ({
      id: r.MaQuyTac,
      MaQuyTac: r.MaQuyTac,
      name: r.TenQuyTac,
      TenQuyTac: r.TenQuyTac,
      minDays: r.SoNgayConLaiToiThieu,
      SoNgayConLaiToiThieu: r.SoNgayConLaiToiThieu,
      maxDays: r.SoNgayConLaiToiDa,
      SoNgayConLaiToiDa: r.SoNgayConLaiToiDa,
      percent: Number(r.PhanTramGiam) || 0,
      PhanTramGiam: Number(r.PhanTramGiam) || 0,
      status: r.TrangThai || 'Đang áp dụng',
      TrangThai: r.TrangThai || 'Đang áp dụng'
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
    return true;
  }

  // POST /api/discount-rules - Thêm quy tắc giảm giá mới vào SQL Server
  if (pathname === '/api/discount-rules' && method === 'POST') {
    const body = parsedBody || {};
    const maxQt = await querySql(`SELECT TOP 1 MaQuyTac FROM QuyTacGiamGiaTheoHan ORDER BY LEN(MaQuyTac) DESC, MaQuyTac DESC`);
    let nextN = 1;
    if (maxQt && maxQt[0]) {
      const m = String(maxQt[0].MaQuyTac).match(/QT0*(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const ruleId = (body.id || body.MaQuyTac || ('QT' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = (body.name || body.TenQuyTac || 'Quy tắc giảm giá mới').trim();
    const minDays = parseInt(body.minDays !== undefined ? body.minDays : (body.SoNgayConLaiToiThieu || 0), 10);
    const maxDays = parseInt(body.maxDays !== undefined ? body.maxDays : (body.SoNgayConLaiToiDa || 99999), 10);
    const percent = parseFloat(body.percent !== undefined ? body.percent : (body.PhanTramGiam || 0));
    const status = body.status || body.TrangThai || 'Đang áp dụng';

    await querySql(
      `INSERT INTO QuyTacGiamGiaTheoHan (MaQuyTac, TenQuyTac, SoNgayConLaiToiThieu, SoNgayConLaiToiDa, PhanTramGiam, TrangThai) VALUES (?, ?, ?, ?, ?, ?)`,
      [ruleId, name, minDays, maxDays, percent, status]
    );

    const created = {
      id: ruleId,
      MaQuyTac: ruleId,
      name,
      TenQuyTac: name,
      minDays,
      SoNgayConLaiToiThieu: minDays,
      maxDays,
      SoNgayConLaiToiDa: maxDays,
      percent,
      PhanTramGiam: percent,
      status,
      TrangThai: status
    };

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã tạo quy tắc giảm giá mới thành công', rule: created }));
    return true;
  }

  // PUT /api/discount-rules/:id - Sửa quy tắc giảm giá trong SQL Server
  if (pathname.startsWith('/api/discount-rules/') && method === 'PUT') {
    const ruleId = pathname.replace('/api/discount-rules/', '').trim();
    const body = parsedBody || {};
    const name = body.name || body.TenQuyTac;
    const minDays = body.minDays !== undefined ? parseInt(body.minDays, 10) : (body.SoNgayConLaiToiThieu !== undefined ? parseInt(body.SoNgayConLaiToiThieu, 10) : null);
    const maxDays = body.maxDays !== undefined ? parseInt(body.maxDays, 10) : (body.SoNgayConLaiToiDa !== undefined ? parseInt(body.SoNgayConLaiToiDa, 10) : null);
    const percent = body.percent !== undefined ? parseFloat(body.percent) : (body.PhanTramGiam !== undefined ? parseFloat(body.PhanTramGiam) : null);
    const status = body.status || body.TrangThai;

    await querySql(
      `UPDATE QuyTacGiamGiaTheoHan 
       SET TenQuyTac = COALESCE(?, TenQuyTac),
           SoNgayConLaiToiThieu = COALESCE(?, SoNgayConLaiToiThieu),
           SoNgayConLaiToiDa = COALESCE(?, SoNgayConLaiToiDa),
           PhanTramGiam = COALESCE(?, PhanTramGiam),
           TrangThai = COALESCE(?, TrangThai)
       WHERE MaQuyTac = ?`,
      [name || null, minDays !== null ? minDays : null, maxDays !== null ? maxDays : null, percent !== null ? percent : null, status || null, ruleId]
    );

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã cập nhật quy tắc giảm giá #' + ruleId, id: ruleId }));
    return true;
  }

  // DELETE /api/discount-rules/:id - Xóa quy tắc giảm giá khỏi SQL Server
  if (pathname.startsWith('/api/discount-rules/') && method === 'DELETE') {
    const ruleId = pathname.replace('/api/discount-rules/', '').trim();
    await querySql(`DELETE FROM QuyTacGiamGiaTheoHan WHERE MaQuyTac = ?`, [ruleId]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa quy tắc giảm giá thành công', id: ruleId }));
    return true;
  }

  return false;
}

module.exports = handlePromotionRoutes;
module.exports.handlePromotionRoutes = handlePromotionRoutes;
module.exports.default = handlePromotionRoutes;
