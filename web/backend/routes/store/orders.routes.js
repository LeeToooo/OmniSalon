const { querySql } = require('../../database/db');
const { enforceAuth, extractAuthUser, isStaffRole, normalizeAuthRole } = require('../../middlewares/auth_middleware');
const auditService = require('../../services/audit.service');
const {
  resolveOrCreateCustomer,
  generateNextOrderId,
  generateNextCtdhId
} = require('../../services/helper_service');
const { checkAndAutoCancelOnRequest } = require('../../services/auto_cancel_service');
const { clearDbSnapshotCache } = require('../auth/accounts.routes');

async function handleOrderRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // GET /api/orders, GET /api/orders/my-orders hoặc GET /api/orders/:id - Tra cứu đơn hàng (bắt buộc JWT & kiểm tra chủ sở hữu/chi nhánh)
  if ((pathname === '/api/orders' || pathname.startsWith('/api/orders/')) && !pathname.endsWith('/cancel') && method === 'GET') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    await checkAndAutoCancelOnRequest();
    const isMyOrders = pathname === '/api/orders/my-orders';
    let orderIdParam = (!isMyOrders && pathname.startsWith('/api/orders/'))
      ? pathname.replace('/api/orders/', '').trim()
      : null;
    if (orderIdParam) {
      orderIdParam = decodeURIComponent(orderIdParam).replace(/^#+/, '').trim();
    }

    const staffUser = isStaffRole(authUser);
    if ((isMyOrders || !staffUser) && !authUser.customerId) {
      if (orderIdParam && !isMyOrders) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Bạn không có quyền truy cập đơn hàng này.' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify([]));
      }
      return true;
    }

    let queryStr = `
      SELECT dh.MaDonHang, dh.MaKhachHang, dh.MaChiNhanh, 
             CONVERT(VARCHAR(19), dh.NgayDat, 120) AS NgayDat,
             dh.TongTien, dh.DiaChiGiaoHang, dh.HinhThucNhan, dh.TrangThai, dh.GhiChu,
             kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
             cn.TenChiNhanh,
             (SELECT TOP 1 hd.TrangThai FROM HoaDon hd WHERE hd.MaDonHang = dh.MaDonHang ORDER BY (CASE WHEN hd.TrangThai = N'Đã thanh toán' THEN 1 ELSE 2 END) ASC) AS TrangThaiHoaDon,
             (SELECT TOP 1 tt.TrangThai FROM ThanhToan tt JOIN HoaDon hd2 ON tt.MaHoaDon = hd2.MaHoaDon WHERE hd2.MaDonHang = dh.MaDonHang ORDER BY (CASE WHEN tt.TrangThai = N'Thành công' THEN 1 ELSE 2 END) ASC) AS TrangThaiThanhToan
      FROM DonHang dh
      LEFT JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
      LEFT JOIN ChiNhanh cn ON dh.MaChiNhanh = cn.MaChiNhanh
    `;
    const conditions = [];
    const params = [];
    if (orderIdParam) {
      conditions.push('(dh.MaDonHang = ? OR dh.MaDonHang = ? OR dh.MaDonHang LIKE ?)');
      params.push(orderIdParam, '#' + orderIdParam, '%' + orderIdParam);
    }
    if (isMyOrders || !staffUser) {
      conditions.push('dh.MaKhachHang = ?');
      params.push(authUser.customerId);
    } else if (!authUser.isSuperAdmin && authUser.branchId) {
      conditions.push('dh.MaChiNhanh = ?');
      params.push(authUser.branchId);
    }
    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }
    if (!orderIdParam) {
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
      let oStatus = 'Pending';
      const tt = (r.TrangThai || '').trim();
      const ttLow = tt.toLowerCase();
      if (ttLow.includes('hủy') || ttLow === 'cancelled') oStatus = 'Cancelled';
      else if (ttLow.includes('đã nhận') || ttLow.includes('hoàn tất') || ttLow.includes('đã giao') || ttLow === 'completed' || ttLow === 'delivered') oStatus = 'Completed';
      else if (ttLow.includes('sẵn sàng') || ttLow === 'ready' || ttLow === 'ready_for_pickup') oStatus = 'Ready';
      else if (ttLow.includes('đang giao') || ttLow === 'delivering' || ttLow === 'shipping' || (ttLow.includes('giao') && !ttLow.includes('đã giao'))) oStatus = 'Delivering';
      else if (ttLow.includes('chuẩn bị') || ttLow.includes('đóng gói') || ttLow.includes('đang xử lý') || ttLow === 'processing') oStatus = 'Processing';
      else if (ttLow.includes('chờ') || ttLow === 'pending') oStatus = 'Pending';

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

      const isPaid = (
        r.TrangThaiHoaDon === 'Đã thanh toán' ||
        r.TrangThaiThanhToan === 'Thành công' ||
        r.TrangThai === 'Đã thanh toán' ||
        (r.GhiChu && r.GhiChu.includes('Đã thanh toán'))
      );
      const isPickup = (
        (r.HinhThucNhan && r.HinhThucNhan.toLowerCase().includes('quầy')) ||
        (r.DiaChiGiaoHang && r.DiaChiGiaoHang.toLowerCase().includes('quầy')) ||
        (r.GhiChu && r.GhiChu.toLowerCase().includes('quầy'))
      );
      const itemsTotal = items.reduce((sum, it) => sum + (parseFloat(it.price || it.GiaBan || 0) * parseInt(it.quantity || it.SoLuong || 1, 10)), 0);
      let shippingFee = 0;
      if (!isPickup) {
        const total = parseFloat(r.TongTien || 0);
        if (itemsTotal > 0 && total > itemsTotal) {
          shippingFee = total - itemsTotal;
        } else {
          shippingFee = 30000;
        }
      }

      return {
        id: r.MaDonHang,
        MaDonHang: r.MaDonHang,
        orderCode: r.MaDonHang,
        userId: r.MaKhachHang,
        customerId: r.MaKhachHang,
        MaKhachHang: r.MaKhachHang,
        phone: r.SdtKhachHang || '',
        customerName: r.TenKhachHang || 'Khách Hàng',
        customerPhone: r.SdtKhachHang || '',
        branchId: r.MaChiNhanh,
        branchName: r.TenChiNhanh || 'Omni Salon Chi Nhánh',
        orderDate: r.NgayDat,
        createdAt: r.NgayDat,
        NgayDat: r.NgayDat,
        totalAmount: parseFloat(r.TongTien || 0),
        TongTien: parseFloat(r.TongTien || 0),
        shippingFee: shippingFee,
        PhiVanChuyen: shippingFee,
        shippingAddress: r.DiaChiGiaoHang,
        receiveMethod: r.HinhThucNhan,
        deliveryType: isPickup ? 'PICKUP_BRANCH' : 'DELIVERY',
        paymentMethod: isPickup ? 'Thanh toán tại quầy' : 'VietQR',
        paymentStatus: isPaid ? 'Paid' : 'Unpaid',
        isPaid: Boolean(isPaid),
        TrangThaiHoaDon: r.TrangThaiHoaDon || (isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'),
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

    if (orderItems.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Đơn hàng phải có ít nhất 1 sản phẩm.' }));
      return true;
    }

    // Kiểm tra tồn kho khả dụng từng sản phẩm tại chi nhánh trước khi tạo đơn hàng (chỉ tính lô đã duyệt và còn hạn)
    for (let i = 0; i < orderItems.length; i++) {
      const it = orderItems[i];
      const prodId = it.productId || it.id || it.MaSanPham;
      const qty = parseInt(it.quantity || it.qty || it.SoLuong || 1, 10);
      if (!prodId || isNaN(qty) || qty <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Thông tin sản phẩm hoặc số lượng không hợp lệ.' }));
        return true;
      }
      const stockCheck = await querySql(`
        SELECT 
          ISNULL(SUM(ctpn.SoLuongConLai), 0) AS TongTonKhaDung,
          (SELECT TOP 1 TenSanPham FROM SanPham WHERE MaSanPham = ?) AS TenSanPham
        FROM ChiTietPhieuNhap ctpn
        INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
        WHERE pnk.MaChiNhanh = ?
          AND pnk.TrangThai = N'Đã duyệt'
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
          error: `Sản phẩm "${pName}" tại chi nhánh chỉ còn ${availableStock} món khả dụng, không đủ ${qty} yêu cầu!` 
        }));
        return true;
      }
    }

    // Backend luôn là Single Source of Truth cho mã đơn hàng (DH01 -> DH13 -> DH14 -> DH15...)
    const authUser = require('../../middlewares/auth_middleware').extractAuthUser(req);
    const id = await generateNextOrderId();

    const requestedCustomerId = (authUser && !isStaffRole(authUser) && authUser.customerId)
      ? authUser.customerId
      : (order.customerId || order.userId);
    const khId = await resolveOrCreateCustomer({
      customerId: requestedCustomerId,
      customerName: order.customerName || authUser?.fullName,
      customerPhone: order.customerPhone || authUser?.phone,
      customerEmail: order.customerEmail || authUser?.email
    });

    const addr = (order.shippingAddress || 'Nhận tại quầy').trim();
    const methodStr = (order.receiveMethod || 'Giao hàng tận nơi').trim();
    const notes = (order.notes || 'Đơn hàng online').trim();
    const isPickupOrder = methodStr.toLowerCase().includes('quầy') || methodStr.toLowerCase().includes('chi nhánh') || addr.toLowerCase().includes('nhận tại quầy');
    let total = 0;

    await querySql(
      `INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu) VALUES (?, ?, ?, GETDATE(), 0, ?, ?, N'Chờ xác nhận', ?)`,
      [id, khId, cnId, addr, methodStr, notes]
    );

    // Lưu chi tiết đơn hàng vào ChiTietDonHang chuẩn FEFO & tính lại tổng tiền từ CSDL
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
            `, [prodId, cnId, qty]);

            if (!ctpnRow || !ctpnRow[0]) {
              throw new Error(`Sản phẩm [${prodId}] không còn đủ lô hàng đã duyệt & còn hạn tại chi nhánh ${cnId}.`);
            }
            const loId = ctpnRow[0].MaChiTietPhieuNhap;
            const origPrice = parseFloat(ctpnRow[0].GiaBan || 0);
            const discPct = parseFloat(ctpnRow[0].PhanTramGiam || 0);
            const unitPrice = Math.round(parseFloat(ctpnRow[0].GiaBanThucTe || origPrice));

            // Trigger trg_ChiTietDonHang_TruTonKho tự động trừ SoLuongConLai & TonKho khi INSERT ChiTietDonHang
            await querySql(
              `INSERT INTO ChiTietDonHang (MaChiTietDonHang, MaDonHang, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [ctdhId, id, prodId, loId, qty, origPrice, discPct, unitPrice, unitPrice * qty]
            );
          }
        }
      }

      const sumRows = await querySql('SELECT ISNULL(SUM(ThanhTien), 0) AS ItemsTotal FROM ChiTietDonHang WHERE MaDonHang = ?', [id]);
      const itemsTotal = parseFloat(sumRows?.[0]?.ItemsTotal || 0);
      const shippingFee = (itemsTotal > 0 && !isPickupOrder) ? 30000 : 0;
      total = Math.round(itemsTotal + shippingFee);
      await querySql('UPDATE DonHang SET TongTien = ? WHERE MaDonHang = ?', [total, id]);
    } catch (detailErr) {
      // Hoàn kho qua trigger trước khi dọn chi tiết & đơn hàng lỗi giữa chừng
      await querySql("UPDATE DonHang SET TrangThai = N'Đã hủy' WHERE MaDonHang = ?", [id]).catch(() => {});
      await querySql('DELETE FROM ChiTietDonHang WHERE MaDonHang = ?', [id]).catch(() => {});
      await querySql('DELETE FROM DonHang WHERE MaDonHang = ?', [id]).catch(() => {});
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
        [tbId, khId, 'Đặt hàng thành công', `Đơn hàng #${id} trị giá ${total.toLocaleString('vi-VN')} đ đã được tiếp nhận và đang chờ xác nhận!`, 'Đơn hàng']
      );
    } catch (e) {
      console.warn('[ThongBao] Lỗi tạo thông báo đơn hàng:', e.message);
    }

    const actorName = authUser ? (authUser.fullName || authUser.name || authUser.username) : (order.customerName ? `${order.customerName} (${order.customerPhone || ''})` : `Khách Hàng (${khId})`);
    const actorRole = authUser ? (authUser.role || 'CUSTOMER') : 'CUSTOMER';
    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'CREATE_ORDER',
      entityType: 'DonHang',
      entityId: id,
      branchId: cnId,
      after: { id, customerId: khId, totalAmount: total, status: 'Pending', TrangThai: 'Chờ xác nhận' },
      details: `${actorName} tạo đơn hàng mỹ phẩm #${id} trị giá ${total.toLocaleString('vi-VN')} đ`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ 
      success: true, 
      order: { 
        id, 
        orderCode: id, 
        MaDonHang: id, 
        customerId: khId, 
        totalAmount: total, 
        status: 'Pending',
        orderStatus: 'Pending',
        TrangThai: 'Chờ xác nhận'
      } 
    }));
    return true;
  }

  // POST /api/orders/:id/cancel - Hủy đơn hàng và hoàn lại tồn kho (bắt buộc chủ sở hữu/nhân sự chi nhánh)
  if (pathname.startsWith('/api/orders/') && pathname.endsWith('/cancel') && method === 'POST') {
    let cancelAuthUser = extractAuthUser(req);
    const adminRole = req.headers['x-admin-role'] || req.headers['x-operator-role'];
    const adminOperator = req.headers['x-admin-operator'] || req.headers['x-operator-name'];
    const adminBranch = req.headers['x-admin-branch'] || req.headers['x-branch-id'];

    if (!cancelAuthUser || !['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER'].includes(normalizeAuthRole(cancelAuthUser.role))) {
      if (adminRole && ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'STAFF', 'ADMIN'].includes(String(adminRole).toUpperCase())) {
        const normRole = String(adminRole).toUpperCase() === 'BRANCH_MANAGER' ? 'BRANCH_MANAGER' : (String(adminRole).toUpperCase() === 'CASHIER' ? 'CASHIER' : 'SUPER_ADMIN');
        cancelAuthUser = {
          id: 'TK_ADMIN',
          username: 'admin',
          fullName: adminOperator ? decodeURIComponent(adminOperator) : 'Quản trị viên',
          role: normRole,
          branchId: adminBranch || null,
          isSuperAdmin: normRole === 'SUPER_ADMIN',
          isBranchManager: normRole === 'BRANCH_MANAGER'
        };
      } else {
        const enforced = enforceAuth(req, res);
        if (!enforced) return true;
        cancelAuthUser = enforced;
      }
    } else {
      cancelAuthUser = {
        ...cancelAuthUser,
        role: normalizeAuthRole(cancelAuthUser.role),
        branchId: cancelAuthUser.branchId || adminBranch || null,
        isSuperAdmin: normalizeAuthRole(cancelAuthUser.role) === 'SUPER_ADMIN',
        isBranchManager: normalizeAuthRole(cancelAuthUser.role) === 'BRANCH_MANAGER'
      };
    }

    let rawId = pathname.replace('/api/orders/', '').replace('/cancel', '').trim();
    rawId = decodeURIComponent(rawId).replace(/^#+/, '').trim();
    const reason = (parsedBody && parsedBody.reason) || 'Khách hàng yêu cầu hủy đơn';

    // Tìm kiếm đơn hàng theo mã chính xác hoặc các biến thể DH13, DH013, DH01...
    let orderRow = await querySql('SELECT MaDonHang, MaKhachHang, MaChiNhanh, TrangThai FROM DonHang WHERE MaDonHang = ? OR MaDonHang = ?', [rawId, '#' + rawId]);
    if (!orderRow || orderRow.length === 0) {
      const numMatch = rawId.match(/^\D*(\d+)$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        const pad2 = 'DH' + String(num).padStart(2, '0');
        const pad3 = 'DH' + String(num).padStart(3, '0');
        const noPad = 'DH' + num;
        orderRow = await querySql(
          'SELECT MaDonHang, MaKhachHang, MaChiNhanh, TrangThai FROM DonHang WHERE MaDonHang = ? OR MaDonHang = ? OR MaDonHang = ?',
          [pad2, pad3, noPad]
        );
      }
    }

    if (!orderRow || orderRow.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: `Không tìm thấy đơn hàng #${rawId}!` }));
      return true;
    }

    const staffUser = isStaffRole(cancelAuthUser);
    if (!staffUser) {
      if (!cancelAuthUser.customerId || orderRow[0].MaKhachHang !== cancelAuthUser.customerId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Bạn chỉ được phép hủy đơn hàng của chính mình.' }));
        return true;
      }
    } else if (!cancelAuthUser.isSuperAdmin && cancelAuthUser.branchId && orderRow[0].MaChiNhanh && orderRow[0].MaChiNhanh !== cancelAuthUser.branchId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Không thể hủy đơn hàng của chi nhánh khác.' }));
      return true;
    }

    const actualId = orderRow[0].MaDonHang;
    const currentStatus = (orderRow[0].TrangThai || '').trim();
    const cleanStatus = currentStatus.toLowerCase();
    // Chặn hủy lại nếu đơn đã hủy, và chặn khách tự hủy khi đơn đang giao / sẵn sàng tại quầy / hoàn tất
    if (cleanStatus.includes('hủy') || cleanStatus === 'cancelled') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: `Đơn hàng #${actualId} đã được hủy trước đó, không thể hủy lại.` }));
      return true;
    }
    if (!staffUser && (
      cleanStatus.includes('đang giao') ||
      cleanStatus.includes('sẵn sàng') ||
      cleanStatus.includes('hoàn tất') ||
      cleanStatus.includes('đã giao') ||
      cleanStatus.includes('đã nhận')
    )) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        error: `Đơn hàng #${actualId} đang ở trạng thái "${currentStatus}", không thể hủy!`
      }));
      return true;
    }

    const branchId = orderRow[0].MaChiNhanh || 'CN01';
    await querySql("UPDATE DonHang SET TrangThai = N'Đã hủy', GhiChu = ISNULL(GhiChu, '') + ' [Lý do hủy: ' + ? + ']' WHERE MaDonHang = ?", [reason, actualId]);
    // Trigger trg_DonHang_HuyDon_HoanTonKho trong SQL Server tự động hoàn lại ChiTietPhieuNhap & TonKho khi chuyển sang Đã hủy.

    clearDbSnapshotCache();

    const cancelActor = cancelAuthUser.fullName || cancelAuthUser.name || cancelAuthUser.username;
    const cancelRole = cancelAuthUser.role;
    auditService.logAudit({
      actor: cancelActor,
      role: cancelRole,
      action: 'CANCEL_ORDER',
      entityType: 'DonHang',
      entityId: actualId,
      branchId,
      before: { TrangThai: currentStatus },
      after: { TrangThai: 'Đã hủy', reason },
      details: `${cancelActor} (${cancelRole}) hủy đơn hàng #${actualId}. Lý do: ${reason}`
    }).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: `Đã hủy đơn hàng #${actualId} thành công!`, orderCode: actualId }));
    return true;
  }

  // PUT /api/orders/:id - Cập nhật trạng thái giao hàng và xử lý thanh toán (chỉ Thu ngân / Quản lý / Admin)
  if (pathname.startsWith('/api/orders/') && !pathname.endsWith('/cancel') && method === 'PUT') {
    let authUser = extractAuthUser(req);
    const adminRole = req.headers['x-admin-role'] || req.headers['x-operator-role'];
    const adminOperator = req.headers['x-admin-operator'] || req.headers['x-operator-name'];
    const adminBranch = req.headers['x-admin-branch'] || req.headers['x-branch-id'];

    // Nếu không có token hợp lệ hoặc token không đủ quyền nhân sự, kiểm tra xem có x-admin-role hợp lệ từ giao diện quản trị không
    if (!authUser || !['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER'].includes(normalizeAuthRole(authUser.role))) {
      if (adminRole && ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'STAFF', 'ADMIN'].includes(String(adminRole).toUpperCase())) {
        const normRole = String(adminRole).toUpperCase() === 'BRANCH_MANAGER' ? 'BRANCH_MANAGER' : (String(adminRole).toUpperCase() === 'CASHIER' ? 'CASHIER' : 'SUPER_ADMIN');
        authUser = {
          id: 'TK_ADMIN',
          username: 'admin',
          fullName: adminOperator ? decodeURIComponent(adminOperator) : 'Quản trị viên',
          role: normRole,
          branchId: adminBranch || null,
          isSuperAdmin: normRole === 'SUPER_ADMIN',
          isBranchManager: normRole === 'BRANCH_MANAGER'
        };
      } else {
        const enforced = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER']);
        if (!enforced) return true;
        authUser = enforced;
      }
    } else {
      authUser = {
        ...authUser,
        role: normalizeAuthRole(authUser.role),
        branchId: authUser.branchId || adminBranch || null,
        isSuperAdmin: normalizeAuthRole(authUser.role) === 'SUPER_ADMIN',
        isBranchManager: normalizeAuthRole(authUser.role) === 'BRANCH_MANAGER'
      };
    }

    const rawId = pathname.replace('/api/orders/', '').replace('/payment', '').replace('/status', '').trim();
    const id = decodeURIComponent(rawId).replace(/^#+/, '').trim();
    const body = parsedBody || {};

    const existingOrder = await querySql('SELECT MaDonHang, MaKhachHang, MaChiNhanh, TongTien, HinhThucNhan, DiaChiGiaoHang, TrangThai FROM DonHang WHERE MaDonHang = ? OR MaDonHang = ?', [id, '#' + id]);
    if (!existingOrder || existingOrder.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: `Không tìm thấy đơn hàng #${id} trong hệ thống!` }));
      return true;
    }
    if (!authUser.isSuperAdmin && authUser.branchId && existingOrder[0].MaChiNhanh && existingOrder[0].MaChiNhanh !== authUser.branchId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Không được phép cập nhật đơn hàng thuộc chi nhánh khác.' }));
      return true;
    }
    const actualId = existingOrder[0].MaDonHang;
    const currentTrangThai = (existingOrder[0].TrangThai || '').trim();
    const isPickupOrder = Boolean(
      (existingOrder[0].HinhThucNhan && existingOrder[0].HinhThucNhan.toLowerCase().includes('quầy')) ||
      (existingOrder[0].DiaChiGiaoHang && existingOrder[0].DiaChiGiaoHang.toLowerCase().includes('quầy'))
    );

    const statusRaw = body.status || body.TrangThai || body.orderStatus || '';
    const notes = body.notes !== undefined ? body.notes : (body.GhiChu !== undefined ? body.GhiChu : null);

    let trangThai = null;
    let isCompletedTransition = false;
    if (statusRaw) {
      const sLower = statusRaw.toLowerCase().trim();
      if (sLower === 'cancelled' || sLower.includes('hủy')) {
        trangThai = 'Đã hủy';
      } else if (sLower === 'completed' || sLower === 'delivered' || sLower.includes('đã nhận') || sLower.includes('hoàn tất') || sLower.includes('đã giao')) {
        trangThai = isPickupOrder ? 'Đã nhận tại quầy' : 'Hoàn tất';
        isCompletedTransition = true;
      } else if (sLower === 'ready' || sLower === 'ready_for_pickup' || sLower.includes('sẵn sàng')) {
        trangThai = 'Sẵn sàng tại quầy';
      } else if (sLower === 'delivering' || sLower === 'shipping' || sLower.includes('đang giao')) {
        trangThai = isPickupOrder ? 'Sẵn sàng tại quầy' : 'Đang giao hàng';
      } else if (sLower === 'processing' || sLower.includes('chuẩn bị') || sLower.includes('đóng gói') || sLower.includes('xử lý')) {
        trangThai = isPickupOrder ? 'Đang chuẩn bị' : 'Đang đóng gói';
      } else if (sLower === 'pending' || sLower.includes('chờ')) {
        trangThai = 'Chờ xác nhận';
      } else {
        trangThai = statusRaw;
      }
    }

    // Kiểm tra xem đơn hàng đã từng được ghi nhận hóa đơn/thanh toán thành công trong CSDL chưa
    const isPaymentConfirmed = Boolean(
      body.isPaymentConfirmed ||
      body.paymentStatus === 'Paid' ||
      body.isPaid ||
      body.TrangThaiThanhToan === 'Đã thanh toán' ||
      statusRaw.toLowerCase().includes('thanh toán') ||
      isCompletedTransition
    );

    const existingPaidHd = await querySql("SELECT TOP 1 MaHoaDon FROM HoaDon WHERE MaDonHang = ? AND TrangThai = N'Đã thanh toán'", [actualId]);
    const existingPaidTt = await querySql("SELECT TOP 1 tt.MaThanhToan FROM ThanhToan tt JOIN HoaDon hd ON tt.MaHoaDon = hd.MaHoaDon WHERE hd.MaDonHang = ? AND tt.TrangThai = N'Thành công'", [actualId]);
    const alreadyPaid = Boolean((existingPaidHd && existingPaidHd.length > 0) || (existingPaidTt && existingPaidTt.length > 0));

    // QUY TẮC BẢO VỆ NGHIỆP VỤ: ĐÃ TỚI BƯỚC CUỐI CÙNG VÀ ĐÃ THU TIỀN -> KHÔNG ĐƯỢC PHÉP TRỞ VỀ CÁC BƯỚC TRƯỚC
    const isCurrentFinalStep = Boolean(
      currentTrangThai === 'Hoàn tất' ||
      currentTrangThai === 'Đã nhận tại quầy' ||
      currentTrangThai === 'Completed'
    );
    if (isCurrentFinalStep && alreadyPaid) {
      const targetStepFinal = Boolean(
        trangThai === 'Hoàn tất' ||
        trangThai === 'Đã nhận tại quầy' ||
        trangThai === 'Completed'
      );
      if (!targetStepFinal) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: 'Đơn hàng đã tới bước cuối cùng và đã thu tiền thành công, không được quyền trở về các bước trước.'
        }));
        return true;
      }
    }
    const isFinalPaid = Boolean(isPaymentConfirmed || alreadyPaid || body.paymentStatus === 'Paid' || body.isPaid === true);

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
      params.push(actualId);
      await querySql(`UPDATE DonHang SET ${updateFields.join(', ')} WHERE MaDonHang = ?`, params);
    }
    // Khi TrangThai đổi từ trạng thái khác sang N'Đã hủy', trigger trg_DonHang_HuyDon_HoanTonKho tự động hoàn lại tồn kho.

    // Xử lý tạo / cập nhật hóa đơn và giao dịch thanh toán khi xác nhận thanh toán đơn hàng
    if (isPaymentConfirmed) {
      try {
        const ordRows = await querySql('SELECT MaDonHang, MaKhachHang, MaChiNhanh, TongTien FROM DonHang WHERE MaDonHang = ?', [actualId]);
        if (ordRows && ordRows[0]) {
          const ord = ordRows[0];
          let hdRows = await querySql('SELECT MaHoaDon FROM HoaDon WHERE MaDonHang = ?', [actualId]);
          let hdId = null;
          if (hdRows && hdRows[0]) {
            hdId = hdRows[0].MaHoaDon;
            await querySql("UPDATE HoaDon SET TrangThai = N'Đã thanh toán' WHERE MaHoaDon = ?", [hdId]);
          } else {
            const maxHd = await querySql("SELECT MAX(TRY_CAST(SUBSTRING(MaHoaDon, 3, 20) AS INT)) AS maxNum FROM HoaDon WHERE MaHoaDon LIKE 'HD[0-9]%'");
            const nextHd = ((maxHd && maxHd[0] && maxHd[0].maxNum) ? parseInt(maxHd[0].maxNum, 10) : 10) + 1;
            hdId = 'HD' + (nextHd < 10 ? '0' + nextHd : nextHd);
            const invNo = `HD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
            await querySql(
              `INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon)
               VALUES (?, ?, NULL, ?, ?, GETDATE(), ?, N'Đã thanh toán', ?)`,
              [hdId, ord.MaKhachHang, actualId, ord.MaChiNhanh || 'CN01', ord.TongTien || 0, invNo]
            );
          }
          if (hdId) {
            // Đảm bảo chi tiết sản phẩm của đơn hàng được lưu đầy đủ vào ChiTietHoaDon_SanPham
            const existingItems = await querySql('SELECT TOP 1 1 FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = ?', [hdId]);
            if (!existingItems || existingItems.length === 0) {
              const orderItems = await querySql(
                `SELECT MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien 
                 FROM ChiTietDonHang WHERE MaDonHang = ?`,
                [actualId]
              );
              if (orderItems && orderItems.length > 0) {
                for (let idx = 0; idx < orderItems.length; idx++) {
                  const it = orderItems[idx];
                  const cthdId = `CTHD${Date.now().toString().slice(-8)}${idx + 1}`.slice(0, 30);
                  await querySql(
                    `INSERT INTO ChiTietHoaDon_SanPham (MaChiTietHDSanPham, MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      cthdId,
                      hdId,
                      it.MaSanPham,
                      it.MaChiTietPhieuNhap || null,
                      Number(it.SoLuong || 1),
                      Number(it.DonGiaGoc || it.DonGiaThucTe || 0),
                      Number(it.PhanTramGiamGia || 0),
                      Number(it.DonGiaThucTe || 0),
                      Number(it.ThanhTien || 0)
                    ]
                  ).catch(e => console.warn('[ChiTietHoaDon_SanPham Insert]', e.message));
                }
              }
            }

            const existingPaidForHd = await querySql(
              "SELECT TOP 1 MaThanhToan FROM ThanhToan WHERE MaHoaDon = ? AND TrangThai = N'Thành công'",
              [hdId]
            );
            if (!existingPaidForHd || existingPaidForHd.length === 0) {
              const maxTt = await querySql("SELECT MAX(TRY_CAST(SUBSTRING(MaThanhToan, 3, 20) AS INT)) AS maxNum FROM ThanhToan WHERE MaThanhToan LIKE 'TT[0-9]%'");
              const nextTt = ((maxTt && maxTt[0] && maxTt[0].maxNum) ? parseInt(maxTt[0].maxNum, 10) : 10) + 1;
              const ttId = 'TT' + (nextTt < 10 ? '0' + nextTt : nextTt);
              const pMethod = body.paymentMethod || 'Chuyển khoản VietQR';

              // Xác định nhân viên thu ngân ghi nhận thanh toán
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
        }
      } catch (pErr) {
        console.warn('[Lỗi cập nhật thanh toán đơn hàng]', pErr.message);
      }
    }

    const updateActor = authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Nhân Viên / Thu Ngân';
    const updateRole = authUser ? (authUser.role || 'CASHIER') : 'CASHIER';
    const actionName = isPaymentConfirmed ? 'ORDER_PAYMENT' : 'UPDATE_ORDER_STATUS';
    auditService.logAudit({
      actor: updateActor,
      role: updateRole,
      action: actionName,
      entityType: 'DonHang',
      entityId: id,
      after: { TrangThai: trangThai, paymentStatus: isPaymentConfirmed ? 'Paid' : (body.paymentStatus || 'Unpaid') },
      details: `${updateActor} (${updateRole}) ${isPaymentConfirmed ? 'xác nhận thanh toán và ' : ''}cập nhật đơn hàng #${id}: ${trangThai || 'Trạng thái mới'}`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ 
      success: true, 
      message: `Cập nhật đơn hàng #${actualId} thành công!`, 
      TrangThai: trangThai,
      paymentStatus: isFinalPaid ? 'Paid' : (body.paymentStatus || 'Unpaid'),
      isPaid: isFinalPaid
    }));
    return true;
  }

  return false;
}

module.exports = handleOrderRoutes;
module.exports.handleOrderRoutes = handleOrderRoutes;
module.exports.default = handleOrderRoutes;

