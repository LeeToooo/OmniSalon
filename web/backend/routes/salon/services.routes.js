// =========================================================================
// QUẢN LÝ DỊCH VỤ & COMBO LÀM ĐẸP
// Bảng CSDL: DichVu, ComboDichVu, KhuyenMai_DichVu, DanhGia
// =========================================================================

const { querySql } = require('../../database/db');

async function handleServiceRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // -----------------------------------------------------------------------
  // DỊCH VỤ LẺ
  // -----------------------------------------------------------------------

  // GET /api/services - Lấy danh mục dịch vụ salon kèm giá khuyến mãi và số sao đánh giá
  if (pathname === '/api/services' && method === 'GET') {
    const [rows, promoRows, kmDichVuRows, reviewRows] = await Promise.all([
      querySql(`SELECT MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, HinhAnh, TrangThai, CONVERT(VARCHAR(10), NgayApDung, 120) AS NgayApDung FROM DichVu`),
      querySql(`SELECT MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, TrangThai FROM KhuyenMai WHERE TrangThai = N'Đang áp dụng'`),
      querySql(`SELECT MaKhuyenMai, MaDichVu FROM KhuyenMai_DichVu`),
      querySql(`SELECT dg.SoSao, ctlh.MaDichVu FROM DanhGia dg JOIN ChiTietLichHen ctlh ON dg.MaLichHen = ctlh.MaLichHen WHERE ctlh.MaDichVu IS NOT NULL`)
    ]);

    const ratingMap = new Map();
    (reviewRows || []).forEach(rv => {
      if (!ratingMap.has(rv.MaDichVu)) ratingMap.set(rv.MaDichVu, []);
      ratingMap.get(rv.MaDichVu).push(Number(rv.SoSao || 5));
    });

    const services = rows.map(r => {
      const origPrice = parseFloat(r.Gia || 0);

      const matchedPromoLink = (kmDichVuRows || []).find(km => km.MaDichVu === r.MaDichVu);
      const matchedPromo = matchedPromoLink ? promoRows.find(p => p.MaKhuyenMai === matchedPromoLink.MaKhuyenMai) : null;

      let finalPrice = origPrice;
      let discountPercent = 0;
      let promoInfo = null;

      if (matchedPromo) {
        if (matchedPromo.HinhThuc && matchedPromo.HinhThuc.includes('%')) {
          discountPercent = parseFloat(matchedPromo.GiaTriGiam || 0);
          finalPrice = Math.round(origPrice * (1 - (discountPercent / 100)));
        } else {
          const discountAmt = parseFloat(matchedPromo.GiaTriGiam || 0);
          finalPrice = Math.max(0, origPrice - discountAmt);
          discountPercent = origPrice > 0 ? Math.round((discountAmt / origPrice) * 100) : 0;
        }
        promoInfo = {
          code: matchedPromo.MaKhuyenMai,
          name: matchedPromo.TenKhuyenMai,
          discountPercent
        };
      }

      const ratings = ratingMap.get(r.MaDichVu) || [];
      const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 5.0;

      return {
        id: r.MaDichVu,
        MaDichVu: r.MaDichVu,
        name: r.TenDichVu,
        TenDichVu: r.TenDichVu,
        description: r.MoTa,
        MoTa: r.MoTa,
        duration: r.ThoiLuong ? `${r.ThoiLuong} phút` : '45 phút',
        durationMinutes: r.ThoiLuong || 45,
        ThoiLuong: r.ThoiLuong || 45,
        price: finalPrice,
        originalPrice: origPrice,
        Gia: origPrice,
        discountPercent,
        promotion: promoInfo,
        rating: avgRating,
        reviewCount: ratings.length,
        image: r.HinhAnh || '',
        HinhAnh: r.HinhAnh || '',
        status: r.TrangThai || 'Kinh doanh'
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(services));
    return true;
  }

  // POST /api/services - Thêm mới một dịch vụ làm đẹp
  if (pathname === '/api/services' && method === 'POST') {
    const body = parsedBody || {};
    const maxRows = await querySql(`SELECT TOP 1 MaDichVu FROM DichVu ORDER BY LEN(MaDichVu) DESC, MaDichVu DESC`);
    let nextN = 11;
    if (maxRows && maxRows[0]) {
      const m = maxRows[0].MaDichVu.match(/DV(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const dvId = (body.id || body.MaDichVu || ('DV' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = body.name || body.TenDichVu || 'Dịch vụ mới';
    const desc = body.description || body.MoTa || '';
    const duration = parseInt(body.durationMinutes || body.ThoiLuong || 45, 10);
    const price = parseFloat(body.price || body.Gia || 100000);
    const image = body.image || body.HinhAnh || '';
    const status = body.status || body.TrangThai || 'Kinh doanh';

    await querySql(
      `INSERT INTO DichVu (MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, HinhAnh, TrangThai, NgayApDung) VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())`,
      [dvId, name, desc, duration, price, image, status]
    );

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, service: { id: dvId, MaDichVu: dvId, name, price, duration, status } }));
    return true;
  }

  // PUT /api/services/:id - Cập nhật thông tin dịch vụ
  if (pathname.startsWith('/api/services/') && method === 'PUT') {
    const id = pathname.replace('/api/services/', '').trim();
    const body = parsedBody || {};
    await querySql(
      `UPDATE DichVu SET 
         TenDichVu = COALESCE(?, TenDichVu), 
         MoTa = COALESCE(?, MoTa), 
         ThoiLuong = COALESCE(?, ThoiLuong), 
         Gia = COALESCE(?, Gia), 
         HinhAnh = COALESCE(?, HinhAnh), 
         TrangThai = COALESCE(?, TrangThai) 
       WHERE MaDichVu = ?`,
      [
        body.name || body.TenDichVu || null,
        body.description || body.MoTa || null,
        body.durationMinutes || body.ThoiLuong || null,
        body.price || body.Gia || null,
        body.image || body.HinhAnh || null,
        body.status || body.TrangThai || null,
        id
      ]
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/services/:id - Ngừng kinh doanh dịch vụ
  // Lưu ý: Dùng Soft-delete nếu dịch vụ đã có dữ liệu trong Hóa đơn, Lịch hẹn, Combo hoặc Khuyến mãi
  if (pathname.startsWith('/api/services/') && method === 'DELETE') {
    const id = pathname.replace('/api/services/', '').trim();
    const hasHistory = await querySql(`
      SELECT TOP 1 MaDichVu FROM (
        SELECT MaDichVu FROM ChiTietHoaDon_DichVu WHERE MaDichVu = ?
        UNION ALL
        SELECT MaDichVu FROM ChiTietLichHen WHERE MaDichVu = ?
        UNION ALL
        SELECT MaDichVu FROM ComboDichVu_ChiTiet WHERE MaDichVu = ?
        UNION ALL
        SELECT MaDichVu FROM KhuyenMai_DichVu WHERE MaDichVu = ?
      ) t
    `, [id, id, id, id]);

    if (hasHistory && hasHistory.length > 0) {
      await querySql(`UPDATE DichVu SET TrangThai = N'Ngừng kinh doanh' WHERE MaDichVu = ?`, [id]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Dịch vụ đã có dữ liệu giao dịch hoặc lịch hẹn, đã chuyển trạng thái sang Ngừng kinh doanh.', id, softDeleted: true }));
      return true;
    }

    await querySql(`DELETE FROM DichVu WHERE MaDichVu = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa dịch vụ khỏi cơ sở dữ liệu', id }));
    return true;
  }

  // -----------------------------------------------------------------------
  // GÓI DỊCH VỤ COMBO
  // -----------------------------------------------------------------------

  // GET /api/combos - Lấy danh sách gói combo khuyến mãi trọn gói
  if (pathname === '/api/combos' && method === 'GET') {
    const rows = await querySql(`SELECT MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai FROM ComboDichVu`);
    const combos = rows.map(r => ({
      id: r.MaCombo,
      MaCombo: r.MaCombo,
      name: r.TenCombo,
      TenCombo: r.TenCombo,
      description: r.MoTa,
      MoTa: r.MoTa,
      price: parseFloat(r.GiaCombo || 0),
      GiaCombo: parseFloat(r.GiaCombo || 0),
      duration: r.ThoiLuong ? `${r.ThoiLuong} phút` : '60 phút',
      durationMinutes: r.ThoiLuong || 60,
      ThoiLuong: r.ThoiLuong || 60,
      image: r.HinhAnh || '',
      HinhAnh: r.HinhAnh || '',
      status: r.TrangThai || 'Kinh doanh'
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(combos));
    return true;
  }

  // POST /api/combos - Thêm combo gói mới
  if (pathname === '/api/combos' && method === 'POST') {
    const body = parsedBody || {};
    const maxRows = await querySql(`SELECT TOP 1 MaCombo FROM ComboDichVu ORDER BY LEN(MaCombo) DESC, MaCombo DESC`);
    let nextN = 6;
    if (maxRows && maxRows[0]) {
      const m = maxRows[0].MaCombo.match(/CB(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const cbId = (body.id || body.MaCombo || ('CB' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = body.name || body.TenCombo || 'Combo mới';
    const desc = body.description || body.MoTa || '';
    const duration = parseInt(body.durationMinutes || body.ThoiLuong || 60, 10);
    const price = parseFloat(body.price || body.GiaCombo || 200000);
    const image = body.image || body.HinhAnh || '';
    const status = body.status || body.TrangThai || 'Kinh doanh';

    await querySql(
      `INSERT INTO ComboDichVu (MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cbId, name, desc, price, duration, image, status]
    );

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, combo: { id: cbId, MaCombo: cbId, name, price, duration, status } }));
    return true;
  }

  // PUT /api/combos/:id - Sửa thông tin combo
  if (pathname.startsWith('/api/combos/') && method === 'PUT') {
    const id = pathname.replace('/api/combos/', '').trim();
    const body = parsedBody || {};
    await querySql(
      `UPDATE ComboDichVu SET 
         TenCombo = COALESCE(?, TenCombo), 
         MoTa = COALESCE(?, MoTa), 
         ThoiLuong = COALESCE(?, ThoiLuong), 
         GiaCombo = COALESCE(?, GiaCombo), 
         HinhAnh = COALESCE(?, HinhAnh), 
         TrangThai = COALESCE(?, TrangThai) 
       WHERE MaCombo = ?`,
      [
        body.name || body.TenCombo || null,
        body.description || body.MoTa || null,
        body.durationMinutes || body.ThoiLuong || null,
        body.price || body.GiaCombo || null,
        body.image || body.HinhAnh || null,
        body.status || body.TrangThai || null,
        id
      ]
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/combos/:id - Ngừng kinh doanh combo
  if (pathname.startsWith('/api/combos/') && method === 'DELETE') {
    const id = pathname.replace('/api/combos/', '').trim();
    const hasHistory = await querySql(`SELECT TOP 1 MaChiTietHDDV FROM ChiTietHoaDon_DichVu WHERE MaCombo = ?`, [id]);
    if (hasHistory && hasHistory.length > 0) {
      await querySql(`UPDATE ComboDichVu SET TrangThai = N'Ngừng kinh doanh' WHERE MaCombo = ?`, [id]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Combo đã có trong lịch sử thanh toán, đã chuyển trạng thái sang Ngừng kinh doanh.', id, softDeleted: true }));
      return true;
    }

    await querySql(`DELETE FROM ComboDichVu WHERE MaCombo = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa combo khỏi cơ sở dữ liệu', id }));
    return true;
  }

  return false;
}

module.exports = handleServiceRoutes;
module.exports.handleServiceRoutes = handleServiceRoutes;
module.exports.default = handleServiceRoutes;

