// =========================================================================
// QUẢN LÝ BÁN HÀNG TẠI QUẦY POS, HÓA ĐƠN & LỊCH SỬ THANH TOÁN
// Bảng CSDL chính: HoaDon, ChiTietHoaDon_DichVu, ChiTietHoaDon_SanPham,
//                  ThanhToan, ChiTietPhieuNhap, LichHen
// =========================================================================

const { querySql } = require('../../database/db');
const {
  resolveOrCreateCustomer,
  resolveStaffMember
} = require('../../services/helper_service');

async function handlePosRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // POST /api/pos/checkout - Bán hàng và thanh toán trực tiếp tại quầy thu ngân salon
  // Lưu hóa đơn tổng hợp cả dịch vụ làm tóc lẫn mỹ phẩm mua kèm
  if ((pathname === '/api/pos/checkout' || pathname === '/api/admin/pos/checkout') && method === 'POST') {
    const pos = parsedBody || {};
    const existingHd = await querySql(`SELECT MaHoaDon FROM HoaDon`);
    let nextHdNum = 0;
    (existingHd || []).forEach(row => {
      const m = (row.MaHoaDon || '').match(/\d+/g);
      if (m) {
        const num = parseInt(m[m.length - 1], 10);
        if (num > nextHdNum) nextHdNum = num;
      }
    });
    const hdId = 'HD' + (nextHdNum + 1 < 10 ? '0' + (nextHdNum + 1) : (nextHdNum + 1));
    const khId = await resolveOrCreateCustomer({
      customerId: pos.customerId || pos.userId,
      customerName: pos.customerName,
      customerPhone: pos.customerPhone
    });
    const lhId = pos.bookingId || null;
    const cnId = pos.branchId || 'CN01';
    const staffId = await resolveStaffMember(pos.staffId || pos.cashierId || pos.stylistId, cnId);
    const total = parseFloat(pos.total || pos.totalAmount || 300000);
    const methodPay = pos.paymentMethod || 'Tiền mặt';
    const invoiceNo = `HD-${Date.now().toString().slice(-8)}`;

    await querySql(
      `INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon) VALUES (?, ?, ?, NULL, ?, GETDATE(), ?, N'Đã thanh toán', ?)`,
      [hdId, khId, lhId, cnId, total, invoiceNo]
    );

    // Lưu chi tiết dịch vụ vào ChiTietHoaDon_DichVu
    const posServices = Array.isArray(pos.services) ? pos.services : (pos.serviceId ? [{ id: pos.serviceId, price: total }] : []);
    const existingCtdv = await querySql(`SELECT MaChiTietHDDV FROM ChiTietHoaDon_DichVu`);
    let nextCtdv = 0;
    (existingCtdv || []).forEach(row => {
      const m = (row.MaChiTietHDDV || '').match(/\d+/g);
      if (m) {
        const num = parseInt(m[m.length - 1], 10);
        if (num > nextCtdv) nextCtdv = num;
      }
    });

    for (let i = 0; i < posServices.length; i++) {
      const s = posServices[i];
      const rawId = s.id || s.serviceId || s.MaDichVu || s.MaCombo;
      let sPrice = parseFloat(s.price || s.Gia || total);
      if (rawId) {
        nextCtdv++;
        const ctdvId = 'CTDV' + (nextCtdv < 10 ? '0' + nextCtdv : nextCtdv);

        let sId = null;
        let comboId = null;
        if (rawId.startsWith('CB')) {
          comboId = rawId;
          if (!sPrice) {
            const cbRow = await querySql('SELECT GiaCombo FROM ComboDichVu WHERE MaCombo = ?', [comboId]);
            if (cbRow && cbRow[0]) sPrice = parseFloat(cbRow[0].GiaCombo || 0);
          }
        } else if (rawId.startsWith('DV')) {
          sId = rawId;
          if (!sPrice) {
            const dvRows = await querySql('SELECT Gia FROM DichVu WHERE MaDichVu = ?', [sId]);
            if (dvRows && dvRows[0]) sPrice = parseFloat(dvRows[0].Gia || 0);
          }
        } else {
          const dvRows = await querySql('SELECT TOP 1 MaDichVu, Gia FROM DichVu WHERE MaDichVu = ? OR TenDichVu LIKE ?', [rawId, `%${s.name || rawId}%`]);
          if (dvRows && dvRows[0]) {
            sId = dvRows[0].MaDichVu;
            if (!sPrice) sPrice = parseFloat(dvRows[0].Gia || 0);
          } else {
            sId = 'DV01';
          }
        }
        try {
          await querySql(
            `INSERT INTO ChiTietHoaDon_DichVu (MaChiTietHDDV, MaHoaDon, MaDichVu, MaCombo, SoLuong, DonGia, ThanhTien) VALUES (?, ?, ?, ?, 1, ?, ?)`,
            [ctdvId, hdId, sId, comboId, sPrice, sPrice]
          );
        } catch (errDv) {
          console.error('[Lỗi POS lưu dịch vụ]', errDv.message);
        }
      }
    }

    // Lưu chi tiết sản phẩm vào ChiTietHoaDon_SanPham
    const posProducts = Array.isArray(pos.products) ? pos.products : (Array.isArray(pos.items) ? pos.items : []);
    for (let i = 0; i < posProducts.length; i++) {
      const p = posProducts[i];
      const rawPId = p.id || p.productId || p.MaSanPham;
      const pQty = parseInt(p.quantity || p.qty || 1, 10);
      const pPrice = parseFloat(p.price || p.GiaBan || 250000);
      if (rawPId && pQty > 0) {
        let pId = rawPId;
        if (!pId.startsWith('SP')) {
          const spRows = await querySql('SELECT TOP 1 MaSanPham FROM SanPham WHERE MaSanPham = ? OR TenSanPham LIKE ?', [pId, `%${p.name || pId}%`]);
          pId = spRows && spRows[0] ? spRows[0].MaSanPham : 'SP01';
        }
        try {
          await querySql('EXEC sp_ThemChiTietHoaDonSanPham @MaHoaDon = ?, @MaSanPham = ?, @SoLuong = ?', [hdId, pId, pQty]);
        } catch (spErr) {
          const maxCtsp = await querySql(`SELECT TOP 1 MaChiTietHDSanPham FROM ChiTietHoaDon_SanPham WHERE MaChiTietHDSanPham LIKE 'CTHD%' AND LEN(MaChiTietHDSanPham) <= 10 ORDER BY LEN(MaChiTietHDSanPham) DESC, MaChiTietHDSanPham DESC`);
          let nextCtsp = 1;
          if (maxCtsp && maxCtsp[0]) {
            const m = maxCtsp[0].MaChiTietHDSanPham.match(/CTHD(\d+)/i);
            if (m) nextCtsp = parseInt(m[1], 10) + 1;
          }
          const ctHdSpId = 'CTHD' + (nextCtsp < 10 ? '0' + nextCtsp : nextCtsp);

          // Trừ kho mỹ phẩm bán lẻ theo lô cận date nhất tại chi nhánh
          const ctpnRow = await querySql(`
            SELECT TOP 1 ctpn.MaChiTietPhieuNhap 
            FROM ChiTietPhieuNhap ctpn
            INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
            WHERE ctpn.MaSanPham = ? AND pnk.MaChiNhanh = ? AND ctpn.SoLuongConLai > 0
            ORDER BY ctpn.HanSuDung ASC
          `, [pId, cnId]);

          if (ctpnRow && ctpnRow[0]) {
            const loId = ctpnRow[0].MaChiTietPhieuNhap;
            await querySql(
              `INSERT INTO ChiTietHoaDon_SanPham (MaChiTietHDSanPham, MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
              [ctHdSpId, hdId, pId, loId, pQty, pPrice, pPrice, pPrice * pQty]
            );
            await querySql(`UPDATE ChiTietPhieuNhap SET SoLuongConLai = SoLuongConLai - ? WHERE MaChiTietPhieuNhap = ?`, [pQty, loId]);
          } else {
            console.warn(`[POS] Cảnh báo: Sản phẩm ${pId} không còn lô tồn khả dụng tại chi nhánh ${cnId}`);
          }
        }
      }
    }

    // Lưu bản ghi ThanhToan
    const existingTt = await querySql(`SELECT MaThanhToan FROM ThanhToan`);
    let nextTtNum = 0;
    (existingTt || []).forEach(row => {
      const m = (row.MaThanhToan || '').match(/\d+/g);
      if (m) {
        const num = parseInt(m[m.length - 1], 10);
        if (num > nextTtNum) nextTtNum = num;
      }
    });
    const ttId = 'TT' + (nextTtNum + 1 < 10 ? '0' + (nextTtNum + 1) : (nextTtNum + 1));
    await querySql(
      `INSERT INTO ThanhToan (MaThanhToan, MaHoaDon, MaNhanVien, SoTien, PhuongThuc, ThoiGianThanhToan, TrangThai, MaGiaoDich) VALUES (?, ?, ?, ?, ?, GETDATE(), N'Thành công', ?)`,
      [ttId, hdId, staffId, total, methodPay, `PAY-${Date.now().toString().slice(-6)}`]
    );

    if (lhId) {
      await querySql(`UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = ?`, [lhId]);
    }

    try {
      const maxTb = await querySql(`SELECT TOP 1 MaThongBao FROM ThongBao WHERE MaThongBao LIKE 'TB%' ORDER BY LEN(MaThongBao) DESC, MaThongBao DESC`).catch(() => []);
      let nextTb = 11;
      if (maxTb && maxTb[0]) {
        const m = maxTb[0].MaThongBao.match(/TB(\d+)/i);
        if (m) nextTb = parseInt(m[1], 10) + 1;
      }
      const tbId = 'TB' + (nextTb < 10 ? '0' + nextTb : nextTb);
      await querySql(
        `INSERT INTO ThongBao (MaThongBao, MaTaiKhoan, MaKhachHang, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, TrangThaiDoc) VALUES (?, NULL, ?, ?, ?, ?, GETDATE(), 0)`,
        [tbId, khId, 'Thanh toán thành công', `Hóa đơn #${hdId} trị giá ${total.toLocaleString('vi-VN')} đ đã thanh toán thành công qua hình thức ${methodPay}.`, 'Hóa đơn']
      );
    } catch (e) {
      console.warn('[ThongBao] Lỗi tạo thông báo POS:', e.message);
    }

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ 
      success: true, 
      invoiceId: hdId,
      invoiceNumber: invoiceNo,
      total,
      invoice: { 
        id: hdId, 
        orderCode: hdId, 
        invoiceNo, 
        total, 
        status: 'Completed',
        paymentId: ttId 
      } 
    }));
    return true;
  }

  // GET /api/invoices - Danh sách hóa đơn bán hàng và dịch vụ
  if ((pathname === '/api/invoices' || pathname === '/api/admin/invoices') && method === 'GET') {
    const branchParam = parsedUrl.searchParams.get('branch_id');
    let q = `
      SELECT hd.MaHoaDon, hd.MaKhachHang, hd.MaLichHen, hd.MaDonHang, hd.MaChiNhanh,
             CONVERT(VARCHAR(19), hd.NgayLap, 120) AS NgayLap,
             hd.TongTien, hd.TrangThai, hd.MaSoHoaDon,
             kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
             cn.TenChiNhanh,
             ISNULL((SELECT SUM(ThanhTien) FROM ChiTietHoaDon_DichVu WHERE MaHoaDon = hd.MaHoaDon), 0) AS TongTienDichVu,
             ISNULL((SELECT SUM(ThanhTien) FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = hd.MaHoaDon), 0) AS TongTienSanPham,
             ISNULL((SELECT TOP 1 PhuongThuc FROM ThanhToan WHERE MaHoaDon = hd.MaHoaDon ORDER BY ThoiGianThanhToan DESC), N'VietQR') AS PhuongThucThanhToan
      FROM HoaDon hd
      LEFT JOIN KhachHang kh ON hd.MaKhachHang = kh.MaKhachHang
      LEFT JOIN ChiNhanh cn ON hd.MaChiNhanh = cn.MaChiNhanh
    `;
    const params = [];
    if (branchParam) {
      q += ` WHERE hd.MaChiNhanh = ?`;
      params.push(branchParam);
    }
    q += ` ORDER BY hd.NgayLap DESC`;
    const rows = await querySql(q, params);
    const mapped = rows.map(r => ({
      ...r,
      serviceTotal: parseFloat(r.TongTienDichVu || 0),
      productTotal: parseFloat(r.TongTienSanPham || 0),
      total: parseFloat(r.TongTien || 0),
      totalAmount: parseFloat(r.TongTien || 0),
      TongThanhToan: parseFloat(r.TongTien || 0),
      paymentMethod: r.PhuongThucThanhToan || 'VietQR'
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(mapped));
    return true;
  }

  // GET /api/invoices/:id - Xem chi tiết hóa đơn
  if (pathname.startsWith('/api/invoices/') && method === 'GET') {
    const hdId = pathname.replace('/api/invoices/', '').trim();
    const hdRows = await querySql(`
      SELECT hd.MaHoaDon, hd.MaKhachHang, hd.MaLichHen, hd.MaDonHang, hd.MaChiNhanh,
             CONVERT(VARCHAR(19), hd.NgayLap, 120) AS NgayLap,
             hd.TongTien, hd.TrangThai, hd.MaSoHoaDon,
             kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang, kh.Email AS EmailKhachHang,
             cn.TenChiNhanh, cn.DiaChi AS DiaChiChiNhanh, cn.SoDienThoai AS SdtChiNhanh
      FROM HoaDon hd
      LEFT JOIN KhachHang kh ON hd.MaKhachHang = kh.MaKhachHang
      LEFT JOIN ChiNhanh cn ON hd.MaChiNhanh = cn.MaChiNhanh
      WHERE hd.MaHoaDon = ?
    `, [hdId]);

    if (!hdRows || hdRows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không tìm thấy hóa đơn' }));
      return true;
    }

    const [serviceItems, productItems, payments] = await Promise.all([
      querySql(`
        SELECT cthd.MaChiTietHDDV, cthd.MaDichVu, cthd.MaCombo, cthd.SoLuong, cthd.DonGia, cthd.ThanhTien,
               ISNULL(dv.TenDichVu, cb.TenCombo) AS TenDichVu
        FROM ChiTietHoaDon_DichVu cthd
        LEFT JOIN DichVu dv ON cthd.MaDichVu = dv.MaDichVu
        LEFT JOIN ComboDichVu cb ON cthd.MaCombo = cb.MaCombo
        WHERE cthd.MaHoaDon = ?
      `, [hdId]),
      querySql(`
        SELECT cthd.MaChiTietHDSanPham, cthd.MaSanPham, cthd.MaChiTietPhieuNhap, cthd.SoLuong,
               cthd.DonGiaGoc, cthd.PhanTramGiamGia, cthd.DonGiaThucTe, cthd.ThanhTien,
               sp.TenSanPham, sp.HinhAnh
        FROM ChiTietHoaDon_SanPham cthd
        JOIN SanPham sp ON cthd.MaSanPham = sp.MaSanPham
        WHERE cthd.MaHoaDon = ?
      `, [hdId]),
      querySql(`
        SELECT tt.MaThanhToan, tt.MaNhanVien, tt.SoTien, tt.PhuongThuc,
               CONVERT(VARCHAR(19), tt.ThoiGianThanhToan, 120) AS ThoiGianThanhToan,
               tt.TrangThai, tt.MaGiaoDich, nv.HoTen AS TenThuNgan
        FROM ThanhToan tt
        LEFT JOIN NhanVien nv ON tt.MaNhanVien = nv.MaNhanVien
        WHERE tt.MaHoaDon = ?
      `, [hdId])
    ]);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ...hdRows[0],
      services: serviceItems,
      products: productItems,
      payments: payments
    }));
    return true;
  }

  // GET /api/payments - Lịch sử các giao dịch thanh toán
  if (pathname === '/api/payments' && method === 'GET') {
    const rows = await querySql(`
      SELECT tt.MaThanhToan, tt.MaHoaDon, tt.MaNhanVien, tt.SoTien, tt.PhuongThuc,
             CONVERT(VARCHAR(19), tt.ThoiGianThanhToan, 120) AS ThoiGianThanhToan,
             tt.TrangThai, tt.MaGiaoDich,
             nv.HoTen AS TenNhanVien,
             hd.MaChiNhanh, hd.TongTien AS TongTienHoaDon, hd.MaSoHoaDon,
             kh.HoTen AS TenKhachHang
      FROM ThanhToan tt
      LEFT JOIN NhanVien nv ON tt.MaNhanVien = nv.MaNhanVien
      LEFT JOIN HoaDon hd ON tt.MaHoaDon = hd.MaHoaDon
      LEFT JOIN KhachHang kh ON hd.MaKhachHang = kh.MaKhachHang
      ORDER BY tt.ThoiGianThanhToan DESC
    `);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  return false;
}

module.exports = handlePosRoutes;
module.exports.handlePosRoutes = handlePosRoutes;
module.exports.default = handlePosRoutes;

