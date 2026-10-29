// =========================================================================
// QUẢN LÝ ĐƠN HÀNG ONLINE
// Bảng CSDL chính: DonHang, ChiTietDonHang, ChiTietPhieuNhap, HoaDon, ThanhToan
// =========================================================================

const { querySql } = require('../../database/db');
const { extractAuthUser } = require('../../middlewares/auth_middleware');
const {
  resolveOrCreateCustomer,
  generateNextOrderId
} = require('../../services/helper_service');

async function handleOrderRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // GET /api/orders hoặc GET /api/orders/:id - Tra cứu danh sách hoặc chi tiết đơn hàng
  if ((pathname === '/api/orders' || pathname.startsWith('/api/orders/')) && !pathname.endsWith('/cancel') && method === 'GET') {
    const orderIdParam = pathname.startsWith('/api/orders/') ? pathname.replace('/api/orders/', '').trim() : null;
    let queryStr = `
      SELECT dh.MaDonHang, dh.MaKhachHang, dh.MaChiNhanh, 
             CONVERT(VARCHAR(19), dh.NgayDat, 120) AS NgayDat,
             dh.TongTien, dh.DiaChiGiaoHang, dh.HinhThucNhan, dh.TrangThai, dh.GhiChu,
             kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
             cn.TenChiNhanh,
             (SELECT TOP 1 hd.TrangThai FROM HoaDon hd WHERE hd.MaDonHang = dh.MaDonHang) AS TrangThaiHoaDon
      FROM DonHang dh
      LEFT JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
      LEFT JOIN ChiNhanh cn ON dh.MaChiNhanh = cn.MaChiNhanh
    `;
    const params = [];
    if (orderIdParam) {
      queryStr += ' WHERE dh.MaDonHang = ?';
      params.push(orderIdParam);
    } else {
      queryStr += ' ORDER BY dh.NgayDat DESC';
    }

    const rows = await querySql(queryStr, params);
    if (orderIdParam && (!rows || rows.length === 0)) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: `Không tìm thấy đơn hàng #${orderIdParam}!` }));
      return true;
    }

    const allOrderItems = await querySql(`
      SELECT ctdh.MaChiTietDonHang, ctdh.MaDonHang, ctdh.MaSanPham, ctdh.SoLuong, ctdh.DonGiaThucTe, ctdh.ThanhTien,
             sp.TenSanPham, sp.HinhAnh
      FROM ChiTietDonHang ctdh
      LEFT JOIN SanPham sp ON ctdh.MaSanPham = sp.MaSanPham
      ${orderIdParam ? 'WHERE ctdh.MaDonHang = ?' : ''}
    `, orderIdParam ? [orderIdParam] : []);

    const mapOrder = (r) => {
      let oStatus = 'Processing';
      const tt = (r.TrangThai || '').trim();
      const ttLow = tt.toLowerCase();
      if (ttLow.includes('hủy') || ttLow === 'cancelled') oStatus = 'Cancelled';
      else if (ttLow.includes('hoàn tất') || ttLow.includes('đã giao') || ttLow === 'completed' || ttLow === 'delivered') oStatus = 'Completed';
      else if (ttLow.includes('đang giao') || ttLow === 'delivering' || ttLow === 'shipping' || (ttLow.includes('giao') && !ttLow.includes('đã giao'))) oStatus = 'Delivering';
      else if (ttLow.includes('chờ') || ttLow === 'pending') oStatus = 'Pending';
      else if (ttLow.includes('đóng gói') || ttLow.includes('đang xử lý') || ttLow === 'processing') oStatus = 'Processing';

      const items = (allOrderItems || [])
        .filter(it => it.MaDonHang === r.MaDonHang)
        .map(it => ({
          id: it.MaChiTietDonHang,
          productId: it.MaSanPham,
          name: it.TenSanPham || 'Sản phẩm',
          price: parseFloat(it.DonGiaThucTe || 0),
          quantity: it.SoLuong || 1,
          qty: it.SoLuong || 1,
          total: parseFloat(it.ThanhTien || 0),
          image: it.HinhAnh || ''
        }));

      const isPaid = (r.TrangThaiHoaDon === 'Đã thanh toán' || r.TrangThai === 'Đã thanh toán' || (r.GhiChu && r.GhiChu.includes('Đã thanh toán')));

      return {
        id: r.MaDonHang,
        MaDonHang: r.MaDonHang,
        orderCode: r.MaDonHang,
        customerId: r.MaKhachHang,
        customerName: r.TenKhachHang || 'Khách Hàng',
        customerPhone: r.SdtKhachHang || '',
        branchId: r.MaChiNhanh,
        branchName: r.TenChiNhanh || 'Omni Salon Chi Nhánh',
        orderDate: r.NgayDat,
        totalAmount: parseFloat(r.TongTien || 0),
        TongTien: parseFloat(r.TongTien || 0),
        shippingAddress: r.DiaChiGiaoHang,
        receiveMethod: r.HinhThucNhan,
        deliveryType: (r.HinhThucNhan === 'Nhận tại quầy' || (r.DiaChiGiaoHang && r.DiaChiGiaoHang.includes('quầy'))) ? 'PICKUP_BRANCH' : 'DELIVERY',
        paymentMethod: r.HinhThucNhan === 'Nhận tại quầy' ? 'Thanh toán tại quầy' : 'VietQR',
        paymentStatus: isPaid ? 'Paid' : 'Unpaid',
        orderStatus: oStatus,
        TrangThai: r.TrangThai,
        notes: r.GhiChu,
        items
      };
    };

    if (orderIdParam) {
      const singleOrder = mapOrder(rows[0]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(singleOrder));
      return true;
    }

    const orders = rows.map(mapOrder);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(orders));
    return true;
  }

  // POST /api/orders - Tạo đơn hàng online mới
  // Kiểm tra tồn kho khả dụng tại chi nhánh -> Trừ kho theo lô hạn dùng sớm nhất
  if (pathname === '/api/orders' && method === 'POST') {
    const order = parsedBody || {};
    const cnId = order.branchId || 'CN01';
    const orderItems = Array.isArray(order.items) ? order.items : (Array.isArray(order.cartItems) ? order.cartItems : []);

    // Kiểm tra tồn kho khả dụng từng sản phẩm tại chi nhánh trước khi tạo đơn hàng
    for (let i = 0; i < orderItems.length; i++) {
      const it = orderItems[i];
      const prodId = it.productId || it.id || it.MaSanPham;
      const qty = parseInt(it.quantity || it.qty || it.SoLuong || 1, 10);
      if (prodId && qty > 0) {
        const stockCheck = await querySql(`
          SELECT 
            ISNULL(SUM(ctpn.SoLuongConLai), 0) AS TongTonKhaDung,
            (SELECT TOP 1 TenSanPham FROM SanPham WHERE MaSanPham = ?) AS TenSanPham
          FROM ChiTietPhieuNhap ctpn
          INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
          WHERE pnk.MaChiNhanh = ?
            AND ctpn.MaSanPham = ?
            AND ctpn.SoLuongConLai > 0
            AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0
        `, [prodId, cnId, prodId]);

        const availableStock = stockCheck && stockCheck[0] ? parseInt(stockCheck[0].TongTonKhaDung, 10) : 0;
        const pName = stockCheck && stockCheck[0] && stockCheck[0].TenSanPham ? stockCheck[0].TenSanPham : (it.name || prodId);

        if (availableStock < qty) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ 
            success: false, 
            error: `Sản phẩm "${pName}" tại chi nhánh chỉ còn ${availableStock} món, không đủ ${qty} yêu cầu!` 
          }));
          return true;
        }
      }
    }

    let id = order.id || order.orderCode;
    if (!id || !id.startsWith('DH') || id.length > 6 || isNaN(parseInt(id.replace('DH', ''), 10))) {
      id = await generateNextOrderId();
    } else {
      const existing = await querySql('SELECT MaDonHang FROM DonHang WHERE MaDonHang = ?', [id]);
      if (existing && existing.length > 0) {
        id = await generateNextOrderId();
      }
    }

    const khId = await resolveOrCreateCustomer({
      customerId: order.customerId || order.userId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail
    });

    const total = parseFloat(order.totalAmount || order.totalPrice || 500000);
    const addr = (order.shippingAddress || 'Nhận tại quầy').trim();
    const methodStr = (order.receiveMethod || 'Giao hàng tận nơi').trim();
    const notes = (order.notes || 'Đơn hàng online').trim();

    await querySql(
      `INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu) VALUES (?, ?, ?, GETDATE(), ?, ?, ?, N'Đang xử lý', ?)`,
      [id, khId, cnId, total, addr, methodStr, notes]
    );

    // Lưu chi tiết đơn hàng vào ChiTietDonHang chuẩn FEFO
    try {
      for (let i = 0; i < orderItems.length; i++) {
        const it = orderItems[i];
        const prodId = it.productId || it.id || it.MaSanPham;
        const qty = parseInt(it.quantity || it.qty || it.SoLuong || 1, 10);
        if (prodId && qty > 0) {
          try {
            await querySql('EXEC sp_ThemChiTietDonHang @MaDonHang = ?, @MaSanPham = ?, @SoLuong = ?', [id, prodId, qty]);
          } catch (spErr) {
            const errMsg = spErr.message || '';
            if (errMsg.includes('Tồn kho') || errMsg.includes('không đủ')) {
              throw spErr;
            }
            const maxCtdh = await querySql(`SELECT TOP 1 MaChiTietDonHang FROM ChiTietDonHang WHERE MaChiTietDonHang LIKE 'CTDH%' AND LEN(MaChiTietDonHang) <= 10 ORDER BY LEN(MaChiTietDonHang) DESC, MaChiTietDonHang DESC`);
            let nextCtdh = 11;
            if (maxCtdh && maxCtdh[0]) {
              const m = maxCtdh[0].MaChiTietDonHang.match(/CTDH(\d+)/i);
              if (m) nextCtdh = parseInt(m[1], 10) + 1;
            }
            const ctdhId = 'CTDH' + (nextCtdh < 10 ? '0' + nextCtdh : nextCtdh);
            const unitPrice = parseFloat(it.price || it.actualPrice || it.GiaBan || 250000);
            
            // Phân bổ lô hàng thực tế theo nguyên tắc FEFO
            const ctpnRow = await querySql(`
              SELECT TOP 1 ctpn.MaChiTietPhieuNhap 
              FROM ChiTietPhieuNhap ctpn
              INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
              WHERE ctpn.MaSanPham = ? AND pnk.MaChiNhanh = ? AND ctpn.SoLuongConLai > 0
              ORDER BY ctpn.HanSuDung ASC
            `, [prodId, cnId]);

            if (!ctpnRow || !ctpnRow[0]) {
              throw new Error(`Sản phẩm [${prodId}] đã hết lô hàng khả dụng tại chi nhánh ${cnId}.`);
            }
            const loId = ctpnRow[0].MaChiTietPhieuNhap;

            await querySql(
              `INSERT INTO ChiTietDonHang (MaChiTietDonHang, MaDonHang, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
              [ctdhId, id, prodId, loId, qty, unitPrice, unitPrice, unitPrice * qty]
            );

            await querySql(
              `UPDATE ChiTietPhieuNhap SET SoLuongConLai = SoLuongConLai - ? WHERE MaChiTietPhieuNhap = ?`,
              [qty, loId]
            );
          }
        }
      }
    } catch (detailErr) {
      await querySql('DELETE FROM DonHang WHERE MaDonHang = ?', [id]);
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: detailErr.message || 'Lỗi xử lý tồn kho đơn hàng!' }));
      return true;
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
        [tbId, khId, 'Đặt hàng thành công', `Đơn hàng #${id} trị giá ${total.toLocaleString('vi-VN')} đ đã được tiếp nhận và đang xử lý!`, 'Đơn hàng']
      );
    } catch (e) {
      console.warn('[ThongBao] Lỗi tạo thông báo đơn hàng:', e.message);
    }

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ 
      success: true, 
      order: { 
        id, 
        orderCode: id, 
        MaDonHang: id, 
        customerId: khId, 
        totalAmount: total, 
        status: 'Processing' 
      } 
    }));
    return true;
  }

  // POST /api/orders/:id/cancel - Khách hàng hoặc quản lý hủy đơn hàng
  // Tự động hoàn trả số lượng vào đúng các lô hàng đã trích xuất trước đó
  if (pathname.startsWith('/api/orders/') && pathname.endsWith('/cancel') && method === 'POST') {
    const id = pathname.replace('/api/orders/', '').replace('/cancel', '').trim();
    const reason = (parsedBody && parsedBody.reason) || 'Khách hàng yêu cầu hủy đơn';

    const orderRow = await querySql('SELECT MaDonHang, MaChiNhanh, TrangThai FROM DonHang WHERE MaDonHang = ?', [id]);
    if (!orderRow || orderRow.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: `Không tìm thấy đơn hàng #${id}!` }));
      return true;
    }

    const currentStatus = (orderRow[0].TrangThai || '').trim();
    if (currentStatus === 'Đã hủy' || currentStatus.toLowerCase() === 'cancelled') {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: `Đơn hàng #${id} đã được hủy trước đó, không thể hủy lại.` }));
      return true;
    }

    await querySql("UPDATE DonHang SET TrangThai = N'Đã hủy', GhiChu = ISNULL(GhiChu, '') + ' [Lý do hủy: ' + ? + ']' WHERE MaDonHang = ?", [reason, id]);

    // Hoàn lại số lượng tồn kho theo từng lô ChiTietDonHang và đồng bộ TonKho chi nhánh
    const ctdhRows = await querySql('SELECT MaChiTietPhieuNhap, SoLuong, MaSanPham FROM ChiTietDonHang WHERE MaDonHang = ?', [id]);
    const branchId = orderRow[0].MaChiNhanh || 'CN01';
    if (ctdhRows && ctdhRows.length > 0) {
      for (const item of ctdhRows) {
        if (item.SoLuong > 0) {
          if (item.MaChiTietPhieuNhap) {
            await querySql('UPDATE ChiTietPhieuNhap SET SoLuongConLai = SoLuongConLai + ? WHERE MaChiTietPhieuNhap = ?', [item.SoLuong, item.MaChiTietPhieuNhap]);
          }
          if (item.MaSanPham) {
            await querySql('UPDATE TonKho SET SoLuongTon = SoLuongTon + ?, NgayCapNhat = GETDATE() WHERE MaSanPham = ? AND MaChiNhanh = ?', [item.SoLuong, item.MaSanPham, branchId]);
          }
        }
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: `Đã hủy đơn hàng #${id} thành công!` }));
    return true;
  }

  // PUT /api/orders/:id - Cập nhật trạng thái giao hàng và xử lý thanh toán
  // Khi đơn hàng chuyển sang 'Đã thanh toán', tự động sinh hóa đơn và bản ghi thanh toán
  if (pathname.startsWith('/api/orders/') && !pathname.endsWith('/cancel') && method === 'PUT') {
    const id = pathname.replace('/api/orders/', '').replace('/payment', '').replace('/status', '').trim();
    const body = parsedBody || {};
    const statusRaw = body.status || body.TrangThai || body.orderStatus || '';
    const notes = body.notes !== undefined ? body.notes : (body.GhiChu !== undefined ? body.GhiChu : null);
    const isPaymentConfirmed = body.paymentStatus === 'Paid' || body.isPaid || body.TrangThaiThanhToan === 'Đã thanh toán' || statusRaw.toLowerCase().includes('thanh toán');

    let trangThai = null;
    if (statusRaw) {
      const sLower = statusRaw.toLowerCase();
      if (sLower === 'pending' || sLower.includes('chờ')) {
        trangThai = 'Chờ xử lý';
      } else if (sLower === 'processing' || sLower.includes('đóng gói') || sLower.includes('xử lý')) {
        trangThai = 'Đang xử lý';
      } else if (sLower === 'delivering' || sLower === 'shipping' || (sLower.includes('giao') && !sLower.includes('đã giao'))) {
        trangThai = 'Đang giao';
      } else if (sLower === 'completed' || sLower === 'delivered' || sLower.includes('hoàn tất') || sLower.includes('đã giao')) {
        trangThai = 'Đã giao';
      } else if (sLower === 'cancelled' || sLower.includes('hủy')) {
        trangThai = 'Đã hủy';
      } else {
        trangThai = statusRaw;
      }
    }

    const updateFields = [];
    const params = [];
    if (trangThai) {
      updateFields.push('TrangThai = ?');
      params.push(trangThai);
    }
    if (notes !== null) {
      updateFields.push('GhiChu = ?');
      params.push(notes);
    }

    if (updateFields.length > 0) {
      params.push(id);
      await querySql(`UPDATE DonHang SET ${updateFields.join(', ')} WHERE MaDonHang = ?`, params);
    }

    if (trangThai === 'Đã hủy') {
      const ordInfo = await querySql('SELECT MaChiNhanh FROM DonHang WHERE MaDonHang = ?', [id]);
      const branchId = ordInfo && ordInfo[0] ? ordInfo[0].MaChiNhanh : 'CN01';
      const ctdhRows = await querySql('SELECT MaChiTietPhieuNhap, SoLuong, MaSanPham FROM ChiTietDonHang WHERE MaDonHang = ?', [id]);
      if (ctdhRows && ctdhRows.length > 0) {
        for (const item of ctdhRows) {
          if (item.SoLuong > 0) {
            if (item.MaChiTietPhieuNhap) {
              await querySql('UPDATE ChiTietPhieuNhap SET SoLuongConLai = SoLuongConLai + ? WHERE MaChiTietPhieuNhap = ?', [item.SoLuong, item.MaChiTietPhieuNhap]);
            }
            if (item.MaSanPham) {
              await querySql('UPDATE TonKho SET SoLuongTon = SoLuongTon + ?, NgayCapNhat = GETDATE() WHERE MaSanPham = ? AND MaChiNhanh = ?', [item.SoLuong, item.MaSanPham, branchId]);
            }
          }
        }
      }
    }

    // Xử lý tạo / cập nhật hóa đơn và giao dịch thanh toán khi xác nhận thanh toán đơn hàng
    if (isPaymentConfirmed) {
      try {
        const ordRows = await querySql('SELECT MaDonHang, MaKhachHang, MaChiNhanh, TongTien FROM DonHang WHERE MaDonHang = ?', [id]);
        if (ordRows && ordRows[0]) {
          const ord = ordRows[0];
          let hdRows = await querySql('SELECT MaHoaDon FROM HoaDon WHERE MaDonHang = ?', [id]);
          let hdId = null;
          if (hdRows && hdRows[0]) {
            hdId = hdRows[0].MaHoaDon;
            await querySql("UPDATE HoaDon SET TrangThai = N'Đã thanh toán' WHERE MaHoaDon = ?", [hdId]);
          } else {
            const maxHd = await querySql("SELECT TOP 1 MaHoaDon FROM HoaDon WHERE MaHoaDon LIKE 'HD%' AND LEN(MaHoaDon) <= 10 ORDER BY LEN(MaHoaDon) DESC, MaHoaDon DESC");
            let nextHd = 11;
            if (maxHd && maxHd[0]) {
              const m = maxHd[0].MaHoaDon.match(/HD(\d+)/i);
              if (m) nextHd = parseInt(m[1], 10) + 1;
            }
            hdId = 'HD' + (nextHd < 10 ? '0' + nextHd : nextHd);
            const invNo = `HD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
            await querySql(
              `INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon)
               VALUES (?, ?, NULL, ?, ?, GETDATE(), ?, N'Đã thanh toán', ?)`,
              [hdId, ord.MaKhachHang, id, ord.MaChiNhanh || 'CN01', ord.TongTien || 0, invNo]
            );
          }
          if (hdId) {
            const maxTt = await querySql("SELECT TOP 1 MaThanhToan FROM ThanhToan WHERE MaThanhToan LIKE 'TT%' AND LEN(MaThanhToan) <= 10 ORDER BY LEN(MaThanhToan) DESC, MaThanhToan DESC");
            let nextTt = 11;
            if (maxTt && maxTt[0]) {
              const m = maxTt[0].MaThanhToan.match(/TT(\d+)/i);
              if (m) nextTt = parseInt(m[1], 10) + 1;
            }
            const ttId = 'TT' + (nextTt < 10 ? '0' + nextTt : nextTt);
            const pMethod = body.paymentMethod || 'Chuyển khoản VietQR';

            // Xác định nhân viên thu ngân ghi nhận thanh toán
            const authUser = extractAuthUser(req);
            let cashierStaffId = (authUser && authUser.MaNhanVien) || body.cashierId || body.staffId || null;
            if (!cashierStaffId) {
              const cashiers = await querySql(
                "SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaChiNhanh = ? AND ChucVu = N'Thu ngân' AND TrangThai = N'Đang làm việc'",
                [ord.MaChiNhanh || 'CN01']
              );
              cashierStaffId = (cashiers && cashiers[0]) ? cashiers[0].MaNhanVien : 'NV61';
            }
            await querySql(
              "INSERT INTO ThanhToan (MaThanhToan, MaHoaDon, MaNhanVien, SoTien, PhuongThuc, ThoiGianThanhToan, TrangThai, MaGiaoDich) VALUES (?, ?, ?, ?, ?, GETDATE(), N'Thành công', ?)",
              [ttId, hdId, cashierStaffId, ord.TongTien || 0, pMethod, 'TXN_' + Date.now()]
            ).catch(e => console.warn('[Payment Insert]', e.message));
          }
        }
      } catch (pErr) {
        console.warn('[Lỗi cập nhật thanh toán đơn hàng]', pErr.message);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ 
      success: true, 
      message: `Cập nhật đơn hàng #${id} thành công!`, 
      TrangThai: trangThai,
      paymentStatus: isPaymentConfirmed ? 'Paid' : (body.paymentStatus || 'Unpaid')
    }));
    return true;
  }

  return false;
}

module.exports = handleOrderRoutes;
module.exports.handleOrderRoutes = handleOrderRoutes;
module.exports.default = handleOrderRoutes;

