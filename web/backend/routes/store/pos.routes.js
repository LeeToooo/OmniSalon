const { querySql } = require('../../database/db');
const { enforceAuth } = require('../../middlewares/auth_middleware');
const auditService = require('../../services/audit.service');
const {
  resolveOrCreateCustomer,
  resolveStaffMember,
  generateNextBookingId,
  generateNextCtlhId,
  generateNextOrderId,
  generateNextCtdhId
} = require('../../services/helper_service');

/**
 * Tra cứu dịch vụ hoặc combo thật trong SQL cho POS (không fallback thầm lặng sang DV01).
 */
async function resolvePosServiceItem(s) {
  const rawId = String(s?.id || s?.serviceId || s?.MaDichVu || s?.MaCombo || '').trim();
  const rawName = String(s?.name || s?.TenDichVu || s?.TenCombo || '').trim();
  if (!rawId && !rawName) return null;

  if (rawId.startsWith('CB')) {
    const cbRow = await querySql('SELECT TOP 1 MaCombo, GiaCombo FROM ComboDichVu WHERE MaCombo = ?', [rawId]);
    if (cbRow && cbRow[0]) {
      return { serviceId: null, comboId: cbRow[0].MaCombo, price: parseFloat(cbRow[0].GiaCombo || 0) };
    }
    return null;
  }
  if (rawId.startsWith('DV')) {
    const dvRow = await querySql('SELECT TOP 1 MaDichVu, Gia FROM DichVu WHERE MaDichVu = ?', [rawId]);
    if (dvRow && dvRow[0]) {
      return { serviceId: dvRow[0].MaDichVu, comboId: null, price: parseFloat(dvRow[0].Gia || 0) };
    }
    return null;
  }

  const lookup = rawName || rawId;
  const dvRows = await querySql('SELECT TOP 1 MaDichVu, Gia FROM DichVu WHERE MaDichVu = ? OR TenDichVu LIKE ?', [rawId || lookup, `%${lookup}%`]);
  if (dvRows && dvRows[0]) {
    return { serviceId: dvRows[0].MaDichVu, comboId: null, price: parseFloat(dvRows[0].Gia || 0) };
  }
  const cbRows = await querySql('SELECT TOP 1 MaCombo, GiaCombo FROM ComboDichVu WHERE MaCombo = ? OR TenCombo LIKE ?', [rawId || lookup, `%${lookup}%`]);
  if (cbRows && cbRows[0]) {
    return { serviceId: null, comboId: cbRows[0].MaCombo, price: parseFloat(cbRows[0].GiaCombo || 0) };
  }
  return null;
}

/**
 * Tra cứu mã sản phẩm thật trong SQL cho POS (không fallback thầm lặng sang SP01).
 */
async function resolvePosProductId(p) {
  const rawPId = String(p?.id || p?.productId || p?.MaSanPham || '').trim();
  if (!rawPId) return '';
  if (rawPId.startsWith('SP')) {
    const exactRows = await querySql('SELECT TOP 1 MaSanPham FROM SanPham WHERE MaSanPham = ?', [rawPId]);
    return exactRows && exactRows[0] ? exactRows[0].MaSanPham : '';
  }
  const spRows = await querySql('SELECT TOP 1 MaSanPham FROM SanPham WHERE MaSanPham = ? OR TenSanPham LIKE ?', [rawPId, `%${p.name || rawPId}%`]);
  return spRows && spRows[0] ? spRows[0].MaSanPham : '';
}

async function handlePosRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // POST /api/pos/checkout - Bán hàng và thanh toán trực tiếp tại quầy (bắt buộc Thu ngân / Quản lý / Admin)
  if ((pathname === '/api/pos/checkout' || pathname === '/api/admin/pos/checkout') && method === 'POST') {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER']);
    if (!authUser) return true;

    const pos = parsedBody || {};
    if (!authUser.isSuperAdmin && authUser.branchId && pos.branchId && pos.branchId !== authUser.branchId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Bạn chỉ được thanh toán tại chi nhánh mình phụ trách.' }));
      return true;
    }
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
    let lhId = pos.bookingId || null;
    let dhId = pos.orderId || null;
    const cnId = pos.branchId || 'CN01';
    const staffId = await resolveStaffMember(pos.staffId || pos.cashierId || pos.stylistId, cnId);
    const clientTotal = parseFloat(pos.total || pos.totalAmount || 0);
    const methodPay = pos.paymentMethod || 'Tiền mặt';
    const invoiceNo = `HD-${Date.now().toString().slice(-8)}`;

    const posServices = Array.isArray(pos.services) ? pos.services : (pos.serviceId ? [{ id: pos.serviceId, price: clientTotal }] : []);
    const posProducts = Array.isArray(pos.products) ? pos.products : (Array.isArray(pos.items) ? pos.items : []);

    // Xác thực danh mục dịch vụ & sản phẩm + kiểm tra tồn kho khả dụng (lô đã duyệt và còn hạn) trước khi lập hóa đơn POS
    const resolvedServices = [];
    for (let i = 0; i < posServices.length; i++) {
      const s = posServices[i];
      const rawLabel = s?.name || s?.TenDichVu || s?.id || s?.serviceId || s?.MaDichVu || s?.MaCombo || '';
      if (!rawLabel) continue;
      const resolved = await resolvePosServiceItem(s);
      if (!resolved) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: `Không tìm thấy dịch vụ "${rawLabel}" trong hệ thống.` }));
        return true;
      }
      resolvedServices.push(resolved);
    }

    const resolvedProducts = [];
    for (let i = 0; i < posProducts.length; i++) {
      const p = posProducts[i];
      const rawPId = p.id || p.productId || p.MaSanPham;
      const pQty = parseInt(p.quantity || p.qty || 1, 10);
      if (rawPId && pQty > 0) {
        const pId = await resolvePosProductId(p);
        if (!pId) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: `Không tìm thấy sản phẩm "${p.name || rawPId}" trong hệ thống.` }));
          return true;
        }
        const stockRows = await querySql(`
          SELECT ISNULL(SUM(ctpn.SoLuongConLai), 0) AS TongTonKhaDung,
                 (SELECT TOP 1 TenSanPham FROM SanPham WHERE MaSanPham = ?) AS TenSanPham
          FROM ChiTietPhieuNhap ctpn
          INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
          WHERE pnk.MaChiNhanh = ?
            AND pnk.TrangThai = N'Đã duyệt'
            AND ctpn.MaSanPham = ?
            AND ctpn.SoLuongConLai > 0
            AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0
        `, [pId, cnId, pId]);
        const avail = parseInt(stockRows?.[0]?.TongTonKhaDung || 0, 10);
        if (avail < pQty) {
          const prodName = stockRows?.[0]?.TenSanPham || p.name || pId;
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: `Sản phẩm "${prodName}" tại chi nhánh ${cnId} chỉ còn ${avail}, không đủ ${pQty}!` }));
          return true;
        }
        resolvedProducts.push({ productId: pId, qty: pQty });
      }
    }

    let total = clientTotal > 0 ? clientTotal : 0;

    // Tự động tạo Lịch Hẹn (LichHen & ChiTietLichHen) nếu POS có dịch vụ mà chưa có mã lịch hẹn
    if (resolvedServices.length > 0 && !lhId) {
      lhId = await generateNextBookingId();
      try {
        await querySql(
          `INSERT INTO LichHen (MaLichHen, MaKhachHang, MaNhanVien, MaChiNhanh, NgayHen, GioBatDau, GioKetThuc, TrangThai, TongTien, TienCoc, GhiChu) 
           VALUES (?, ?, ?, ?, CAST(GETDATE() AS DATE), CONVERT(VARCHAR(5), GETDATE(), 108), CONVERT(VARCHAR(5), DATEADD(minute, 60, GETDATE()), 108), N'Hoàn thành', 0, 0, N'Tạo từ Quầy thu ngân POS')`,
          [lhId, khId, staffId, cnId]
        );

        let servicesTotal = 0;
        for (let i = 0; i < resolvedServices.length; i++) {
          const rs = resolvedServices[i];
          const ctlhId = await generateNextCtlhId();
          servicesTotal += rs.price;
          await querySql(
            `INSERT INTO ChiTietLichHen (MaChiTietLichHen, MaLichHen, MaDichVu, MaCombo, SoLuong, DonGia, ThanhTien) 
             VALUES (?, ?, ?, ?, 1, ?, ?)`,
            [ctlhId, lhId, rs.serviceId, rs.comboId, rs.price, rs.price]
          );
        }
        await querySql('UPDATE LichHen SET TongTien = ? WHERE MaLichHen = ?', [servicesTotal, lhId]);
      } catch (errLh) {
        console.error('[POS] Lỗi tạo LichHen tự động:', errLh.message);
      }
    }

    // Nếu POS chỉ có sản phẩm bán lẻ (không có dịch vụ) và chưa có đơn hàng: tự động tạo DonHang & ChiTietDonHang
    if (resolvedServices.length === 0 && resolvedProducts.length > 0 && !dhId) {
      dhId = await generateNextOrderId();
      try {
        await querySql(
          `INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu) 
           VALUES (?, ?, ?, GETDATE(), 0, N'Nhận tại quầy chi nhánh', N'Tại quầy', N'Đã giao', N'Bán trực tiếp tại Quầy thu ngân POS')`,
          [dhId, khId, cnId]
        );

        let productsTotal = 0;
        for (let i = 0; i < resolvedProducts.length; i++) {
          const { productId: pId, qty: pQty } = resolvedProducts[i];
          const ctdhId = await generateNextCtdhId();
            const ctpnRow = await querySql(`
              SELECT TOP 1 ctpn.MaChiTietPhieuNhap, sp.GiaBan,
                     ISNULL(v.PhanTramGiam, 0) AS PhanTramGiam,
                     ISNULL(v.GiaBanThucTe, sp.GiaBan) AS GiaBanThucTe
              FROM ChiTietPhieuNhap ctpn
              INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
              INNER JOIN SanPham sp ON ctpn.MaSanPham = sp.MaSanPham
              LEFT JOIN vw_GiaBanTheoLoHienTai v ON v.MaChiTietPhieuNhap = ctpn.MaChiTietPhieuNhap
              WHERE ctpn.MaSanPham = ?
                AND pnk.MaChiNhanh = ?
                AND pnk.TrangThai = N'Đã duyệt'
                AND ctpn.SoLuongConLai >= ?
                AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0
              ORDER BY ctpn.HanSuDung ASC
            `, [pId, cnId, pQty]);
            if (!ctpnRow || !ctpnRow[0]) {
              throw new Error(`Sản phẩm [${pId}] hết lô hàng đã duyệt & còn hạn tại ${cnId}.`);
            }
            const loId = ctpnRow[0].MaChiTietPhieuNhap;
            const origP = parseFloat(ctpnRow[0].GiaBan || 0);
            const discP = parseFloat(ctpnRow[0].PhanTramGiam || 0);
            const pPrice = Math.round(parseFloat(ctpnRow[0].GiaBanThucTe || origP));
            productsTotal += (pPrice * pQty);

            // Trigger trg_ChiTietDonHang_TruTonKho tự trừ kho cho ChiTietDonHang
            await querySql(
              `INSERT INTO ChiTietDonHang (MaChiTietDonHang, MaDonHang, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [ctdhId, dhId, pId, loId, pQty, origP, discP, pPrice, pPrice * pQty]
            );
        }
        await querySql('UPDATE DonHang SET TongTien = ? WHERE MaDonHang = ?', [productsTotal, dhId]);
      } catch (errDh) {
        console.error('[POS] Lỗi tạo DonHang tự động:', errDh.message);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: errDh.message }));
        return true;
      }
    }

    // Đảm bảo tuân thủ ràng buộc toàn vẹn CK_HoaDon_Nguon: chỉ MaLichHen HOẶC MaDonHang được có giá trị (không đồng thời cả 2)
    const finalLhId = lhId || null;
    const finalDhId = (!lhId && dhId) ? dhId : null;

    await querySql(
      `INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon) VALUES (?, ?, ?, ?, ?, GETDATE(), 0, N'Đã thanh toán', ?)`,
      [hdId, khId, finalLhId, finalDhId, cnId, invoiceNo]
    );

    // Lưu chi tiết dịch vụ vào ChiTietHoaDon_DichVu (ưu tiên đơn giá từ CSDL)
    const existingCtdv = await querySql(`SELECT MaChiTietHDDV FROM ChiTietHoaDon_DichVu`);
    let nextCtdv = 0;
    (existingCtdv || []).forEach(row => {
      const m = (row.MaChiTietHDDV || '').match(/\d+/g);
      if (m) {
        const num = parseInt(m[m.length - 1], 10);
        if (num > nextCtdv) nextCtdv = num;
      }
    });

    for (let i = 0; i < resolvedServices.length; i++) {
      const rs = resolvedServices[i];
      nextCtdv++;
      const ctdvId = 'CTDV' + (nextCtdv < 10 ? '0' + nextCtdv : nextCtdv);
      try {
        await querySql(
          `INSERT INTO ChiTietHoaDon_DichVu (MaChiTietHDDV, MaHoaDon, MaDichVu, MaCombo, SoLuong, DonGia, ThanhTien) VALUES (?, ?, ?, ?, 1, ?, ?)`,
          [ctdvId, hdId, rs.serviceId, rs.comboId, rs.price, rs.price]
        );
      } catch (errDv) {
        console.error('[Lỗi POS lưu dịch vụ]', errDv.message);
      }
    }

    // Lưu chi tiết sản phẩm vào ChiTietHoaDon_SanPham
    for (let i = 0; i < resolvedProducts.length; i++) {
      const { productId: pId, qty: pQty } = resolvedProducts[i];
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

        // Trừ kho mỹ phẩm bán lẻ theo lô cận date nhất đã duyệt tại chi nhánh (Trigger trg_ChiTietHoaDonSanPham_TruTonKho tự trừ nếu hd.MaDonHang IS NULL)
        const ctpnRow = await querySql(`
          SELECT TOP 1 ctpn.MaChiTietPhieuNhap, sp.GiaBan,
                 ISNULL(v.PhanTramGiam, 0) AS PhanTramGiam,
                 ISNULL(v.GiaBanThucTe, sp.GiaBan) AS GiaBanThucTe
          FROM ChiTietPhieuNhap ctpn
          INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
          INNER JOIN SanPham sp ON ctpn.MaSanPham = sp.MaSanPham
          LEFT JOIN vw_GiaBanTheoLoHienTai v ON v.MaChiTietPhieuNhap = ctpn.MaChiTietPhieuNhap
          WHERE ctpn.MaSanPham = ?
            AND pnk.MaChiNhanh = ?
            AND pnk.TrangThai = N'Đã duyệt'
            AND ctpn.SoLuongConLai >= ?
            AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0
          ORDER BY ctpn.HanSuDung ASC
        `, [pId, cnId, pQty]);

        if (!ctpnRow || !ctpnRow[0]) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: `Sản phẩm ${pId} không còn lô tồn đã duyệt khả dụng tại chi nhánh ${cnId}.` }));
          return true;
        }

        const loId = ctpnRow[0].MaChiTietPhieuNhap;
        const origP = parseFloat(ctpnRow[0].GiaBan || 0);
        const discP = parseFloat(ctpnRow[0].PhanTramGiam || 0);
        const pPrice = Math.round(parseFloat(ctpnRow[0].GiaBanThucTe || origP));
        await querySql(
          `INSERT INTO ChiTietHoaDon_SanPham (MaChiTietHDSanPham, MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ctHdSpId, hdId, pId, loId, pQty, origP, discP, pPrice, pPrice * pQty]
        );
      }
    }

    // Tính tổng tiền chính xác từ CSDL thay vì tin tổng tiền client gửi lên
    const hdSumRows = await querySql(`
      SELECT
        ISNULL((SELECT SUM(ThanhTien) FROM ChiTietHoaDon_DichVu WHERE MaHoaDon = ?), 0) +
        ISNULL((SELECT SUM(ThanhTien) FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = ?), 0) AS ComputedTotal
    `, [hdId, hdId]);
    let computedTotal = parseFloat(hdSumRows?.[0]?.ComputedTotal || 0);
    if (computedTotal <= 0 && finalLhId) {
      const lhTot = await querySql('SELECT TongTien, ISNULL(TienCoc, 0) AS TienCoc FROM LichHen WHERE MaLichHen = ?', [finalLhId]);
      if (lhTot && lhTot[0]) computedTotal = Math.max(0, parseFloat(lhTot[0].TongTien || 0) - parseFloat(lhTot[0].TienCoc || 0));
    } else if (computedTotal <= 0 && finalDhId) {
      const dhTot = await querySql('SELECT TongTien FROM DonHang WHERE MaDonHang = ?', [finalDhId]);
      if (dhTot && dhTot[0]) computedTotal = parseFloat(dhTot[0].TongTien || 0);
    }
    total = computedTotal > 0 ? Math.round(computedTotal) : Math.round(clientTotal || 0);
    await querySql('UPDATE HoaDon SET TongTien = ? WHERE MaHoaDon = ?', [total, hdId]);

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

    if (finalLhId) {
      await querySql(`UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = ?`, [finalLhId]);
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

    const actorName = authUser.fullName || authUser.name || authUser.username;
    const actorRole = authUser.role;
    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'POS_CHECKOUT',
      entityType: 'HoaDon',
      entityId: hdId,
      branchId: cnId,
      after: { invoiceId: hdId, total, method: methodPay, customerId: khId },
      details: `${actorName} hoàn tất thanh toán hóa đơn POS #${hdId} trị giá ${total.toLocaleString('vi-VN')} đ (${methodPay})`
    }).catch(() => {});

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

  // GET /api/invoices - Danh sách hóa đơn bán hàng và dịch vụ (chỉ Thu ngân / Quản lý / Thợ / Admin)
  if ((pathname === '/api/invoices' || pathname === '/api/admin/invoices') && method === 'GET') {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'BARBER']);
    if (!authUser) return true;

    const branchParam = parsedUrl.searchParams.get('branch_id');
    let effectiveBranch = branchParam;
    if (!authUser.isSuperAdmin && authUser.branchId) {
      if (branchParam && branchParam !== 'all' && branchParam !== authUser.branchId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Chỉ được xem hóa đơn của chi nhánh mình phụ trách.' }));
        return true;
      }
      effectiveBranch = authUser.branchId;
    }
    let q = `
      SELECT hd.MaHoaDon, hd.MaKhachHang, hd.MaLichHen, hd.MaDonHang, hd.MaChiNhanh,
             CONVERT(VARCHAR(19), hd.NgayLap, 120) AS NgayLap,
             hd.TongTien, hd.TrangThai, hd.MaSoHoaDon,
             kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
             cn.TenChiNhanh,
             CASE 
               WHEN EXISTS (SELECT 1 FROM ChiTietHoaDon_DichVu WHERE MaHoaDon = hd.MaHoaDon) THEN
                 (SELECT ISNULL(SUM(ThanhTien), 0) FROM ChiTietHoaDon_DichVu WHERE MaHoaDon = hd.MaHoaDon)
               WHEN hd.MaLichHen IS NOT NULL THEN
                 ISNULL((SELECT SUM(ThanhTien) FROM ChiTietLichHen WHERE MaLichHen = hd.MaLichHen), hd.TongTien)
               ELSE 0
             END AS TongTienDichVu,
             CASE 
               WHEN EXISTS (SELECT 1 FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = hd.MaHoaDon) THEN
                 (SELECT ISNULL(SUM(ThanhTien), 0) FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = hd.MaHoaDon)
               WHEN hd.MaDonHang IS NOT NULL THEN
                 ISNULL((SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang = hd.MaDonHang), hd.TongTien)
               ELSE 0
             END AS TongTienSanPham,
             ISNULL((SELECT TOP 1 PhuongThuc FROM ThanhToan WHERE MaHoaDon = hd.MaHoaDon ORDER BY ThoiGianThanhToan DESC), N'VietQR') AS PhuongThucThanhToan
      FROM HoaDon hd
      LEFT JOIN KhachHang kh ON hd.MaKhachHang = kh.MaKhachHang
      LEFT JOIN ChiNhanh cn ON hd.MaChiNhanh = cn.MaChiNhanh
    `;
    const params = [];
    if (effectiveBranch && effectiveBranch !== 'all') {
      q += ` WHERE hd.MaChiNhanh = ?`;
      params.push(effectiveBranch);
    }
    q += ` ORDER BY hd.NgayLap DESC`;
    const rows = await querySql(q, params);
    const mapped = rows.map(r => {
      let sTotal = parseFloat(r.TongTienDichVu || 0);
      let pTotal = parseFloat(r.TongTienSanPham || 0);
      let total = parseFloat(r.TongTien || 0);
      if (total === 0) {
        total = sTotal + pTotal;
      } else if (sTotal === 0 && pTotal === 0 && total > 0) {
        if (r.MaDonHang) {
          pTotal = total;
          sTotal = 0;
        } else {
          sTotal = total;
          pTotal = 0;
        }
      }
      return {
        ...r,
        serviceTotal: sTotal,
        TongTienDichVu: sTotal,
        TienDichVu: sTotal,
        productTotal: pTotal,
        TongTienSanPham: pTotal,
        TienSanPham: pTotal,
        total: total,
        totalAmount: total,
        TongThanhToan: total,
        paymentMethod: r.PhuongThucThanhToan || 'VietQR'
      };
    });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(mapped));
    return true;
  }

  // GET /api/invoices/:id - Xem chi tiết hóa đơn (nhân sự chi nhánh hoặc khách hàng chủ sở hữu)
  if (pathname.startsWith('/api/invoices/') && method === 'GET') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

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

    const inv = hdRows[0];
    const staffRoles = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'BARBER', 'STAFF'];
    const isStaff = staffRoles.includes(authUser.role);
    if (!isStaff) {
      if (!authUser.customerId || inv.MaKhachHang !== authUser.customerId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Bạn không có quyền xem hóa đơn của người khác.' }));
        return true;
      }
    } else if (!authUser.isSuperAdmin && authUser.branchId && inv.MaChiNhanh && inv.MaChiNhanh !== authUser.branchId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không thể xem hóa đơn của chi nhánh khác.' }));
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

  // GET /api/payments - Lịch sử các giao dịch thanh toán (chỉ Thu ngân / Quản lý / Admin)
  if (pathname === '/api/payments' && method === 'GET') {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER']);
    if (!authUser) return true;

    let payQuery = `
      SELECT tt.MaThanhToan, tt.MaHoaDon, tt.MaNhanVien, tt.SoTien, tt.PhuongThuc,
             CONVERT(VARCHAR(19), tt.ThoiGianThanhToan, 120) AS ThoiGianThanhToan,
             tt.TrangThai, tt.MaGiaoDich,
             nv.HoTen AS TenNhanVien,
             hd.MaChiNhanh, hd.TongTien AS TongTienHoaDon, hd.MaSoHoaDon,
             kh.HoTen AS TenKhachHang
      FROM ThanhToan tt
      LEFT JOIN NhanVien nv ON tt.MaNhanVien = nv.MaNhanVien
      LEFT JOIN HoaDon hd ON tt.MaHoaDon = hd.MaHoaDon
      LEFT JOIN KhachHang kh ON hd.MaKhachHang = kh.MaKhachHang`;
    const payParams = [];
    if (!authUser.isSuperAdmin && authUser.branchId) {
      payQuery += ` WHERE hd.MaChiNhanh = ?`;
      payParams.push(authUser.branchId);
    }
    payQuery += ` ORDER BY tt.ThoiGianThanhToan DESC`;

    const rows = await querySql(payQuery, payParams);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  // POST hoặc PUT /api/invoices/:id/cancel - Hủy hóa đơn (CASHIER / MANAGER / ADMIN)
  if (pathname.startsWith('/api/invoices/') && pathname.endsWith('/cancel') && (method === 'POST' || method === 'PUT')) {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER']);
    if (!authUser) return true;

    const rawId = pathname.replace('/api/invoices/', '').replace('/cancel', '').trim();
    const hdId = decodeURIComponent(rawId).replace(/^#+/, '').trim();
    const reason = (parsedBody && parsedBody.reason) || 'Thu ngân hủy hóa đơn theo yêu cầu';

    const currentRows = await querySql('SELECT MaHoaDon, MaChiNhanh, TrangThai, TongTien FROM HoaDon WHERE MaHoaDon = ?', [hdId]);
    const current = currentRows?.[0];
    if (!current) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không tìm thấy hóa đơn' }));
      return true;
    }
    if (!authUser.isSuperAdmin && authUser.branchId && current.MaChiNhanh && current.MaChiNhanh !== authUser.branchId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không được hủy hóa đơn thuộc chi nhánh khác.' }));
      return true;
    }

    await querySql('UPDATE HoaDon SET TrangThai = N\'Đã hủy\' WHERE MaHoaDon = ?', [hdId]);
    const actorName = authUser.fullName || authUser.name || authUser.username;
    const actorRole = authUser.role;

    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'CANCEL_INVOICE',
      entityType: 'HoaDon',
      entityId: hdId,
      branchId: current.MaChiNhanh,
      before: { TrangThai: current.TrangThai },
      after: { TrangThai: 'Đã hủy', reason },
      details: `${actorName} (${actorRole}) hủy hóa đơn #${hdId}. Lý do: ${reason}`
    }).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: `Đã hủy hóa đơn #${hdId} thành công!` }));
    return true;
  }

  // POST hoặc PUT /api/invoices/:id/refund - Hoàn tiền hóa đơn (CASHIER / MANAGER / ADMIN)
  if (pathname.startsWith('/api/invoices/') && pathname.endsWith('/refund') && (method === 'POST' || method === 'PUT')) {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER']);
    if (!authUser) return true;

    const rawId = pathname.replace('/api/invoices/', '').replace('/refund', '').trim();
    const hdId = decodeURIComponent(rawId).replace(/^#+/, '').trim();
    const { amount, reason } = parsedBody || {};

    const currentRows = await querySql('SELECT MaHoaDon, MaChiNhanh, TrangThai, TongTien FROM HoaDon WHERE MaHoaDon = ?', [hdId]);
    const current = currentRows?.[0];
    if (!current) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không tìm thấy hóa đơn' }));
      return true;
    }
    if (!authUser.isSuperAdmin && authUser.branchId && current.MaChiNhanh && current.MaChiNhanh !== authUser.branchId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không được hoàn tiền hóa đơn thuộc chi nhánh khác.' }));
      return true;
    }

    const refundAmount = amount || current.TongTien || 0;
    await querySql('UPDATE HoaDon SET TrangThai = N\'Đã hoàn tiền\' WHERE MaHoaDon = ?', [hdId]);

    const actorName = authUser.fullName || authUser.name || authUser.username;
    const actorRole = authUser.role;

    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'REFUND_PAYMENT',
      entityType: 'HoaDon',
      entityId: hdId,
      branchId: current.MaChiNhanh,
      before: { TrangThai: current.TrangThai },
      after: { TrangThai: 'Đã hoàn tiền', refundAmount, reason: reason || 'Hoàn tiền cho khách hàng' },
      details: `${actorName} (${actorRole}) hoàn tiền ${Number(refundAmount).toLocaleString('vi-VN')} đ cho hóa đơn #${hdId}`
    }).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: `Đã hoàn tiền hóa đơn #${hdId} thành công!`, refundAmount }));
    return true;
  }

  return false;
}

module.exports = handlePosRoutes;
module.exports.handlePosRoutes = handlePosRoutes;
module.exports.default = handlePosRoutes;

