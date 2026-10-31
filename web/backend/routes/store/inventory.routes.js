// =========================================================================
// QUẢN LÝ KHO HÀNG, PHIẾU NHẬP & NHÀ CUNG CẤP
// Bảng CSDL: TonKho, PhieuNhapKho, ChiTietPhieuNhap, NhaCungCap, QuyTacGiamGiaTheoHan
// =========================================================================

const { querySql } = require('../../database/db');

async function handleInventoryRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // GET /api/inventory - Báo cáo tồn kho theo từng chi nhánh salon
  if ((pathname === '/api/inventory' || pathname === '/api/admin/inventory') && method === 'GET') {
    const branchParam = parsedUrl.searchParams.get('branch_id');
    let q = `
      SELECT tk.MaSanPham, tk.MaChiNhanh, tk.SoLuongTon, tk.MucCanhBao,
             sp.TenSanPham, sp.GiaBan, sp.GiaNhap, sp.HinhAnh,
             cn.TenChiNhanh
      FROM TonKho tk
      JOIN SanPham sp ON tk.MaSanPham = sp.MaSanPham
      JOIN ChiNhanh cn ON tk.MaChiNhanh = cn.MaChiNhanh
    `;
    const params = [];
    if (branchParam) {
      q += ` WHERE tk.MaChiNhanh = ?`;
      params.push(branchParam);
    }
    const rows = await querySql(q, params);
    const mapped = (rows || []).map(r => ({
      ...r,
      id: r.MaChiTietPhieuNhap,
      receiptDetailId: r.MaChiTietPhieuNhap,
      branchId: r.MaChiNhanh,
      branchName: r.TenChiNhanh,
      lotNumber: r.SoLo,
      productId: r.MaSanPham,
      productName: r.TenSanPham,
      originalPrice: Number(r.GiaNiemYetGoc) || 0,
      expiryDate: r.HanSuDung ? (r.HanSuDung instanceof Date ? r.HanSuDung.toISOString().split('T')[0] : String(r.HanSuDung).split('T')[0].split(' ')[0]) : '',
      remainingQuantity: Number(r.SoLuongConLai) || 0,
      daysLeft: Number(r.SoNgayConLai) || 0,
      discountPercent: Number(r.PhanTramGiam) || 0,
      actualPrice: Number(r.GiaBanThucTe) || 0,
      statusNote: r.TinhTrangHang || ''
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(mapped));
    return true;
  }

  // PUT /api/inventory/:productId/stock - Cập nhật thủ công số lượng tồn kho
  if (pathname.includes('/inventory/') && pathname.includes('/stock') && method === 'PUT') {
    const parts = pathname.split('/');
    const prodId = parts[3];
    const { stock, branchId } = parsedBody || {};
    const bId = branchId || 'CN01';
    await querySql(
      `UPDATE TonKho SET SoLuongTon = ?, NgayCapNhat = GETDATE() WHERE MaSanPham = ? AND MaChiNhanh = ?`,
      [stock, prodId, bId]
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, productId: prodId, newStock: stock }));
    return true;
  }

  // GET /api/inventory/receipts - Danh sách các phiếu nhập hàng từ nhà cung cấp
  if (pathname === '/api/inventory/receipts' && method === 'GET') {
    const branchParam = parsedUrl.searchParams.get('branch_id');
    let q = `
      SELECT pnk.MaPhieuNhap, pnk.MaChiNhanh, pnk.MaNhanVien, pnk.MaNguoiDuyet, pnk.MaNhaCungCap, 
             CONVERT(VARCHAR(19), pnk.NgayLap, 120) AS NgayLap, 
             CONVERT(VARCHAR(19), pnk.NgayDuyet, 120) AS NgayDuyet, 
             pnk.TongTien, pnk.TrangThai, pnk.LyDoTuChoi, 
             cn.TenChiNhanh, ncc.TenNhaCungCap, 
             nv1.HoTen AS TenNguoiLap, nv2.HoTen AS TenNguoiDuyet,
             (SELECT COUNT(*) FROM ChiTietPhieuNhap WHERE MaPhieuNhap = pnk.MaPhieuNhap) AS SoLuongMatHang 
      FROM PhieuNhapKho pnk 
      LEFT JOIN ChiNhanh cn ON pnk.MaChiNhanh = cn.MaChiNhanh 
      LEFT JOIN NhaCungCap ncc ON pnk.MaNhaCungCap = ncc.MaNhaCungCap 
      LEFT JOIN NhanVien nv1 ON pnk.MaNhanVien = nv1.MaNhanVien 
      LEFT JOIN NhanVien nv2 ON pnk.MaNguoiDuyet = nv2.MaNhanVien
    `;
    const params = [];
    if (branchParam && branchParam !== 'all') {
      q += ` WHERE pnk.MaChiNhanh = ?`;
      params.push(branchParam);
    }
    q += ` ORDER BY pnk.NgayLap DESC`;
    const rows = await querySql(q, params);
    const receipts = rows.map(r => ({
      id: r.MaPhieuNhap,
      MaPhieuNhap: r.MaPhieuNhap,
      branchId: r.MaChiNhanh,
      MaChiNhanh: r.MaChiNhanh,
      branchName: r.TenChiNhanh || `Chi Nhánh ${r.MaChiNhanh}`,
      supplierId: r.MaNhaCungCap,
      MaNhaCungCap: r.MaNhaCungCap,
      supplierName: r.TenNhaCungCap || 'Nhà Cung Cấp',
      staffId: r.MaNhanVien,
      MaNhanVien: r.MaNhanVien,
      staffName: r.TenNguoiLap || 'Quản lý kho',
      approverId: r.MaNguoiDuyet,
      MaNguoiDuyet: r.MaNguoiDuyet,
      approverName: r.TenNguoiDuyet || null,
      createdDate: r.NgayLap,
      NgayLap: r.NgayLap,
      approvedDate: r.NgayDuyet,
      NgayDuyet: r.NgayDuyet,
      total: parseFloat(r.TongTien || 0),
      TongTien: parseFloat(r.TongTien || 0),
      status: r.TrangThai || 'Đã duyệt',
      TrangThai: r.TrangThai || 'Đã duyệt',
      rejectReason: r.LyDoTuChoi || null,
      LyDoTuChoi: r.LyDoTuChoi || null,
      itemCount: r.SoLuongMatHang || 0
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(receipts));
    return true;
  }

  // GET /api/inventory/receipts/:id - Xem chi tiết các lô hàng và giá nhập trong phiếu
  if (pathname.startsWith('/api/inventory/receipts/') && method === 'GET') {
    const receiptId = pathname.replace('/api/inventory/receipts/', '').trim();
    const pnkRows = await querySql(
      `SELECT pnk.*, cn.TenChiNhanh, ncc.TenNhaCungCap, nv1.HoTen AS TenNguoiLap, nv2.HoTen AS TenNguoiDuyet
       FROM PhieuNhapKho pnk
       LEFT JOIN ChiNhanh cn ON pnk.MaChiNhanh = cn.MaChiNhanh
       LEFT JOIN NhaCungCap ncc ON pnk.MaNhaCungCap = ncc.MaNhaCungCap
       LEFT JOIN NhanVien nv1 ON pnk.MaNhanVien = nv1.MaNhanVien
       LEFT JOIN NhanVien nv2 ON pnk.MaNguoiDuyet = nv2.MaNhanVien
       WHERE pnk.MaPhieuNhap = ?`,
      [receiptId]
    );
    if (pnkRows.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Không tìm thấy phiếu nhập' }));
      return true;
    }
    const r = pnkRows[0];
    const itemRows = await querySql(
      `SELECT ct.*, sp.TenSanPham, sp.HinhAnh, sp.GiaBan
       FROM ChiTietPhieuNhap ct
       JOIN SanPham sp ON ct.MaSanPham = sp.MaSanPham
       WHERE ct.MaPhieuNhap = ?`,
      [receiptId]
    );
    const receiptDetail = {
      id: r.MaPhieuNhap,
      MaPhieuNhap: r.MaPhieuNhap,
      branchId: r.MaChiNhanh,
      branchName: r.TenChiNhanh,
      supplierId: r.MaNhaCungCap,
      supplierName: r.TenNhaCungCap,
      staffId: r.MaNhanVien,
      staffName: r.TenNguoiLap,
      approverName: r.TenNguoiDuyet,
      createdDate: r.NgayLap,
      approvedDate: r.NgayDuyet,
      total: parseFloat(r.TongTien || 0),
      status: r.TrangThai,
      items: itemRows.map(it => ({
        id: it.MaChiTietPhieuNhap,
        productId: it.MaSanPham,
        productName: it.TenSanPham,
        lotNumber: it.SoLo,
        expiryDate: it.HanSuDung ? new Date(it.HanSuDung).toISOString().split('T')[0] : null,
        quantity: it.SoLuong,
        remainingQuantity: it.SoLuongConLai,
        costPrice: parseFloat(it.DonGiaNhap || 0),
        total: parseFloat(it.ThanhTien || 0),
        image: it.HinhAnh
      }))
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(receiptDetail));
    return true;
  }

  // POST /api/inventory/receipts - Nhập lô hàng mới vào kho
  if (pathname === '/api/inventory/receipts' && method === 'POST') {
    const { branchId, supplierId, staffId, items, total, status } = parsedBody || {};
    const bId = branchId || 'CN01';
    const sId = supplierId || 'NCC01';
    const stId = staffId || 'NV01';
    const stt = status || 'Đã duyệt';
    const tot = parseFloat(total || 0);

    const countRows = await querySql(`SELECT MaPhieuNhap FROM PhieuNhapKho`);
    let maxNum = 0;
    countRows.forEach(row => {
      const m = (row.MaPhieuNhap || '').match(/^PN0*(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const nextPnId = `PN${String(maxNum + 1).padStart(2, '0')}`;

    await querySql(
      `INSERT INTO PhieuNhapKho (MaPhieuNhap, MaChiNhanh, MaNhanVien, MaNguoiDuyet, MaNhaCungCap, NgayLap, NgayDuyet, TongTien, TrangThai)
       VALUES (?, ?, ?, ?, ?, GETDATE(), GETDATE(), ?, ?)`,
      [nextPnId, bId, stId, stId, sId, tot, stt]
    );

    if (Array.isArray(items) && items.length > 0) {
      const detailCountRows = await querySql(`SELECT MaChiTietPhieuNhap FROM ChiTietPhieuNhap`);
      let maxCtNum = 0;
      detailCountRows.forEach(row => {
        const m = (row.MaChiTietPhieuNhap || '').match(/^CTPN0*(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxCtNum) maxCtNum = n;
        }
      });

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        maxCtNum++;
        const ctpnId = `CTPN${String(maxCtNum).padStart(2, '0')}`;
        const pId = it.productId || it.id || 'SP01';
        const qty = parseInt(it.quantity || it.qty || 10, 10);
        const cost = parseFloat(it.costPrice || it.price || 100000);
        const lineTotal = cost * qty;
        const lotNum = it.lotNumber || `LOT-${nextPnId}-${i + 1}`;
        const expDate = it.expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];

        await querySql(
          `INSERT INTO ChiTietPhieuNhap (MaChiTietPhieuNhap, MaPhieuNhap, MaSanPham, SoLo, HanSuDung, SoLuong, SoLuongConLai, DonGiaNhap, ThanhTien)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ctpnId, nextPnId, pId, lotNum, expDate, qty, qty, cost, lineTotal]
        );

        if (stt === 'Đã duyệt') {
          await querySql(
            `IF EXISTS (SELECT 1 FROM TonKho WHERE MaSanPham = ? AND MaChiNhanh = ?)
               UPDATE TonKho SET SoLuongTon = SoLuongTon + ?, NgayCapNhat = GETDATE() WHERE MaSanPham = ? AND MaChiNhanh = ?
             ELSE
               INSERT INTO TonKho (MaSanPham, MaChiNhanh, SoLuongTon, MucCanhBao, NgayCapNhat) VALUES (?, ?, ?, 5, GETDATE())`,
            [pId, bId, qty, pId, bId, pId, bId, qty]
          );
        }
      }
    }

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id: nextPnId, MaPhieuNhap: nextPnId, total: tot, status: stt }));
    return true;
  }

  // POST /api/inventory/receipts/:id/approve - Quản lý duyệt phiếu nhập kho
  if (pathname.startsWith('/api/inventory/receipts/') && pathname.endsWith('/approve') && method === 'POST') {
    const id = pathname.replace('/api/inventory/receipts/', '').replace('/approve', '').trim();
    const approverId = (parsedBody && parsedBody.approverId) || 'NV01';

    const pnkRows = await querySql('SELECT MaPhieuNhap, MaChiNhanh, TrangThai FROM PhieuNhapKho WHERE MaPhieuNhap = ?', [id]);
    if (!pnkRows || pnkRows.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Không tìm thấy phiếu nhập #' + id }));
      return true;
    }

    const bId = pnkRows[0].MaChiNhanh;
    await querySql("UPDATE PhieuNhapKho SET TrangThai = N'Đã duyệt', NgayDuyet = GETDATE(), MaNguoiDuyet = ? WHERE MaPhieuNhap = ?", [approverId, id]);

    // Cộng tồn kho cho từng sản phẩm trong phiếu nhập
    const ctpnRows = await querySql('SELECT MaSanPham, SoLuong FROM ChiTietPhieuNhap WHERE MaPhieuNhap = ?', [id]);
    if (ctpnRows && ctpnRows.length > 0) {
      for (const it of ctpnRows) {
        await querySql(
          `IF EXISTS (SELECT 1 FROM TonKho WHERE MaSanPham = ? AND MaChiNhanh = ?)
             UPDATE TonKho SET SoLuongTon = SoLuongTon + ?, NgayCapNhat = GETDATE() WHERE MaSanPham = ? AND MaChiNhanh = ?
           ELSE
             INSERT INTO TonKho (MaSanPham, MaChiNhanh, SoLuongTon, MucCanhBao, NgayCapNhat) VALUES (?, ?, ?, 5, GETDATE())`,
          [it.MaSanPham, bId, it.SoLuong, it.MaSanPham, bId, it.MaSanPham, bId, it.SoLuong]
        );
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã duyệt phiếu nhập #' + id + ' thành công!' }));
    return true;
  }

  // POST /api/inventory/receipts/:id/reject - Quản lý từ chối phiếu nhập kho kèm lý do bắt buộc
  if (pathname.startsWith('/api/inventory/receipts/') && pathname.endsWith('/reject') && method === 'POST') {
    const id = pathname.replace('/api/inventory/receipts/', '').replace('/reject', '').trim();
    const approverId = (parsedBody && parsedBody.approverId) || 'NV01';
    const reason = (parsedBody && parsedBody.reason) || 'Thông tin lô hàng hoặc giá nhập không hợp lệ';

    await querySql("UPDATE PhieuNhapKho SET TrangThai = N'Đã từ chối', LyDoTuChoi = ?, NgayDuyet = GETDATE(), MaNguoiDuyet = ? WHERE MaPhieuNhap = ?", [reason, approverId, id]);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã từ chối phiếu nhập #' + id + '!' }));
    return true;
  }

  // GET /api/inventory/low-stock - View cảnh báo các mặt hàng sắp hết tồn kho
  if (pathname === '/api/inventory/low-stock' && method === 'GET') {
    const rows = await querySql(`SELECT * FROM vw_SanPhamCanhBaoTonThap`);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  // GET /api/inventory/lots - Danh sách các lô hàng kèm ngày hết hạn
  if ((pathname === '/api/inventory/lots' || pathname === '/api/admin/fefo') && method === 'GET') {
    const branchParam = parsedUrl.searchParams.get('branch_id');
    let q = `SELECT * FROM vw_GiaBanTheoLoHienTai`;
    const params = [];
    if (branchParam) {
      q += ` WHERE MaChiNhanh = ?`;
      params.push(branchParam);
    }
    const rows = await querySql(q, params);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  // -----------------------------------------------------------------------
  // NHÀ CUNG CẤP
  // -----------------------------------------------------------------------

  // GET /api/suppliers - Danh sách nhà cung cấp
  if (pathname === '/api/suppliers' && method === 'GET') {
    const rows = await querySql(`SELECT MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, DiaChi, TrangThai FROM NhaCungCap`);
    const suppliers = rows.map(r => ({
      id: r.MaNhaCungCap,
      MaNhaCungCap: r.MaNhaCungCap,
      name: r.TenNhaCungCap,
      TenNhaCungCap: r.TenNhaCungCap,
      phone: r.SoDienThoai,
      SoDienThoai: r.SoDienThoai,
      email: r.Email,
      Email: r.Email,
      address: r.DiaChi,
      DiaChi: r.DiaChi,
      status: r.TrangThai || 'Hoạt động',
      TrangThai: r.TrangThai || 'Hoạt động'
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(suppliers));
    return true;
  }

  // POST /api/suppliers - Thêm nhà cung cấp mới
  if (pathname === '/api/suppliers' && method === 'POST') {
    const body = parsedBody || {};
    const maxRows = await querySql(`SELECT TOP 1 MaNhaCungCap FROM NhaCungCap ORDER BY LEN(MaNhaCungCap) DESC, MaNhaCungCap DESC`);
    let nextN = 6;
    if (maxRows && maxRows[0]) {
      const m = maxRows[0].MaNhaCungCap.match(/NCC(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const nccId = (body.id || body.MaNhaCungCap || ('NCC' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = body.name || body.TenNhaCungCap || 'Nhà cung cấp mới';
    const phone = body.phone || body.SoDienThoai || '';
    const email = body.email || body.Email || '';
    const address = body.address || body.DiaChi || '';
    const status = body.status || body.TrangThai || 'Hoạt động';

    await querySql(
      `INSERT INTO NhaCungCap (MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, DiaChi, TrangThai) VALUES (?, ?, ?, ?, ?, ?)`,
      [nccId, name, phone, email, address, status]
    );
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, supplier: { id: nccId, MaNhaCungCap: nccId, name, phone, email, address, status } }));
    return true;
  }

  // PUT /api/suppliers/:id - Sửa nhà cung cấp
  if (pathname.startsWith('/api/suppliers/') && method === 'PUT') {
    const id = pathname.replace('/api/suppliers/', '').trim();
    const body = parsedBody || {};
    await querySql(
      `UPDATE NhaCungCap SET TenNhaCungCap = COALESCE(?, TenNhaCungCap), SoDienThoai = COALESCE(?, SoDienThoai), Email = COALESCE(?, Email), DiaChi = COALESCE(?, DiaChi), TrangThai = COALESCE(?, TrangThai) WHERE MaNhaCungCap = ?`,
      [body.name || body.TenNhaCungCap || null, body.phone || body.SoDienThoai || null, body.email || body.Email || null, body.address || body.DiaChi || null, body.status || body.TrangThai || null, id]
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/suppliers/:id - Xóa nhà cung cấp, Soft delete nếu có phiếu nhập
  if (pathname.startsWith('/api/suppliers/') && method === 'DELETE') {
    const id = pathname.replace('/api/suppliers/', '').trim();
    const linkedReceipts = await querySql('SELECT TOP 1 MaPhieuNhap FROM PhieuNhapKho WHERE MaNhaCungCap = ?', [id]);
    if (linkedReceipts && linkedReceipts.length > 0) {
      await querySql(`UPDATE NhaCungCap SET TrangThai = N'Ngừng hợp tác' WHERE MaNhaCungCap = ?`, [id]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Đã chuyển trạng thái nhà cung cấp sang Ngừng hợp tác vì có phiếu nhập liên kết', id, softDeleted: true }));
      return true;
    }
    await querySql(`DELETE FROM NhaCungCap WHERE MaNhaCungCap = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa nhà cung cấp khỏi SQL Server', id }));
    return true;
  }

  // -----------------------------------------------------------------------
  // QUY TẮC GIẢM GIÁ THEO HẠN SỬ DỤNG
  // -----------------------------------------------------------------------

  // GET /api/inventory/discount-rules - Xem quy tắc tự động giảm giá xả hàng cận date
  if (pathname === '/api/inventory/discount-rules' && method === 'GET') {
    const rows = await querySql(`SELECT MaQuyTac, TenQuyTac, SoNgayConLaiToiThieu, SoNgayConLaiToiDa, PhanTramGiam, TrangThai FROM QuyTacGiamGiaTheoHan ORDER BY PhanTramGiam ASC`);
    const rules = rows.map(r => ({
      id: r.MaQuyTac,
      MaQuyTac: r.MaQuyTac,
      name: r.TenQuyTac,
      TenQuyTac: r.TenQuyTac,
      minDays: r.SoNgayConLaiToiThieu,
      SoNgayConLaiToiThieu: r.SoNgayConLaiToiThieu,
      maxDays: r.SoNgayConLaiToiDa,
      SoNgayConLaiToiDa: r.SoNgayConLaiToiDa,
      discountPercent: parseFloat(r.PhanTramGiam || 0),
      PhanTramGiam: parseFloat(r.PhanTramGiam || 0),
      status: r.TrangThai,
      TrangThai: r.TrangThai
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rules));
    return true;
  }

  // POST /api/inventory/discount-rules - Thêm quy tắc giảm giá cận hạn mới
  if (pathname === '/api/inventory/discount-rules' && method === 'POST') {
    const body = parsedBody || {};
    const maxRules = await querySql(`SELECT TOP 1 MaQuyTac FROM QuyTacGiamGiaTheoHan ORDER BY LEN(MaQuyTac) DESC, MaQuyTac DESC`);
    let nextN = 6;
    if (maxRules && maxRules[0]) {
      const m = maxRules[0].MaQuyTac.match(/QT(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const qtId = (body.id || body.MaQuyTac || ('QT' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = body.name || body.TenQuyTac || 'Quy tắc mới';
    const minDays = body.minDays ?? body.SoNgayConLaiToiThieu ?? 0;
    const maxDays = body.maxDays ?? body.SoNgayConLaiToiDa ?? 30;
    const discountPercent = parseFloat(body.discountPercent ?? body.PhanTramGiam ?? 10);
    const status = body.status || body.TrangThai || 'Áp dụng';

    await querySql(
      `INSERT INTO QuyTacGiamGiaTheoHan (MaQuyTac, TenQuyTac, SoNgayConLaiToiThieu, SoNgayConLaiToiDa, PhanTramGiam, TrangThai) VALUES (?, ?, ?, ?, ?, ?)`,
      [qtId, name, minDays, maxDays, discountPercent, status]
    );
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, rule: { id: qtId, MaQuyTac: qtId, name, minDays, maxDays, discountPercent, status } }));
    return true;
  }

  // PUT /api/inventory/discount-rules/:id - Sửa quy tắc giảm giá cận hạn
  if (pathname.startsWith('/api/inventory/discount-rules/') && method === 'PUT') {
    const id = pathname.replace('/api/inventory/discount-rules/', '').trim();
    const body = parsedBody || {};
    await querySql(
      `UPDATE QuyTacGiamGiaTheoHan SET TenQuyTac = COALESCE(?, TenQuyTac), SoNgayConLaiToiThieu = COALESCE(?, SoNgayConLaiToiThieu), SoNgayConLaiToiDa = COALESCE(?, SoNgayConLaiToiDa), PhanTramGiam = COALESCE(?, PhanTramGiam), TrangThai = COALESCE(?, TrangThai) WHERE MaQuyTac = ?`,
      [body.name || body.TenQuyTac || null, body.minDays ?? body.SoNgayConLaiToiThieu ?? null, body.maxDays ?? body.SoNgayConLaiToiDa ?? null, body.discountPercent ?? body.PhanTramGiam ?? null, body.status || body.TrangThai || null, id]
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/inventory/discount-rules/:id - Xóa quy tắc giảm giá cận hạn
  if (pathname.startsWith('/api/inventory/discount-rules/') && method === 'DELETE') {
    const id = pathname.replace('/api/inventory/discount-rules/', '').trim();
    await querySql(`DELETE FROM QuyTacGiamGiaTheoHan WHERE MaQuyTac = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa quy tắc giảm giá khỏi SQL Server', id }));
    return true;
  }

  return false;
}

module.exports = handleInventoryRoutes;
module.exports.handleInventoryRoutes = handleInventoryRoutes;
module.exports.default = handleInventoryRoutes;

