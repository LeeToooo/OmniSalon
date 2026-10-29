// =========================================================================
// QUẢN LÝ DANH SÁCH CHI NHÁNH SALON
// Bảng CSDL: ChiNhanh, LichHen, DonHang, NhanVien, TonKho
// =========================================================================

const { querySql } = require('../../database/db');
const { formatTime } = require('../../services/helper_service');
const { enforceAuth } = require('../../middlewares/auth_middleware');

async function handleBranchesRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // GET /api/branches - Lấy danh sách 20 chi nhánh salon trên toàn quốc kèm giờ hoạt động
  if (pathname === '/api/branches' && method === 'GET') {
    const rows = await querySql(`
      SELECT MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, 
             CONVERT(VARCHAR(8), GioMoCua) AS GioMoCua, 
             CONVERT(VARCHAR(8), GioDongCua) AS GioDongCua, 
             HinhAnh, TrangThai 
      FROM ChiNhanh
    `);
    const branches = rows.map(r => {
      const addr = r.DiaChi || '';
      let city = 'Hồ Chí Minh';
      if (addr.includes('Hà Nội')) city = 'Hà Nội';
      else if (addr.includes('Đà Nẵng')) city = 'Đà Nẵng';

      return {
        id: r.MaChiNhanh,
        MaChiNhanh: r.MaChiNhanh,
        name: r.TenChiNhanh,
        TenChiNhanh: r.TenChiNhanh,
        address: addr,
        DiaChi: addr,
        phone: r.SoDienThoai,
        SoDienThoai: r.SoDienThoai,
        openHours: `${formatTime(r.GioMoCua)} - ${formatTime(r.GioDongCua)}`,
        city,
        region: city === 'Hà Nội' ? 'hn' : city === 'Đà Nẵng' ? 'dn' : 'hcm',
        image: r.HinhAnh || '',
        HinhAnh: r.HinhAnh || '',
        status: r.TrangThai || 'Hoạt động'
      };
    });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(branches));
    return true;
  }

  // POST /api/branches - Thêm mới một chi nhánh salon
  if (pathname === '/api/branches' && method === 'POST') {
    const b = parsedBody || {};
    const maxRows = await querySql(`SELECT TOP 1 MaChiNhanh FROM ChiNhanh ORDER BY LEN(MaChiNhanh) DESC, MaChiNhanh DESC`);
    let nextN = 21;
    if (maxRows && maxRows[0]) {
      const m = maxRows[0].MaChiNhanh.match(/CN(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const cnId = (b.id || b.MaChiNhanh || ('CN' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = b.name || b.TenChiNhanh || 'OmniSalon Chi Nhánh Mới';
    const address = b.address || b.DiaChi || '';
    const phone = b.phone || b.SoDienThoai || '';
    const openTime = b.openTime || '08:30:00';
    const closeTime = b.closeTime || '20:30:00';
    const image = b.image || b.HinhAnh || '';
    const status = b.status || b.TrangThai || 'Hoạt động';

    await querySql(
      `INSERT INTO ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, GioMoCua, GioDongCua, HinhAnh, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cnId, name, address, phone, openTime, closeTime, image, status]
    );

    // Tự động khởi tạo dòng tồn kho cho chi nhánh mới
    await querySql(`
      INSERT INTO TonKho (MaSanPham, MaChiNhanh, SoLuongTon, MucCanhBao, NgayCapNhat)
      SELECT sp.MaSanPham, ?, 0, 5, GETDATE()
      FROM SanPham sp
      WHERE NOT EXISTS (
        SELECT 1 FROM TonKho tk WHERE tk.MaSanPham = sp.MaSanPham AND tk.MaChiNhanh = ?
      )
    `, [cnId, cnId]).catch(() => {});

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, branch: { id: cnId, MaChiNhanh: cnId, name, address, phone, status } }));
    return true;
  }

  // PUT /api/branches/:id - Cập nhật thông tin chi nhánh
  if (pathname.startsWith('/api/branches/') && method === 'PUT') {
    const id = pathname.replace('/api/branches/', '').trim();
    const b = parsedBody || {};
    await querySql(
      `UPDATE ChiNhanh SET 
         TenChiNhanh = COALESCE(?, TenChiNhanh), 
         DiaChi = COALESCE(?, DiaChi), 
         SoDienThoai = COALESCE(?, SoDienThoai), 
         GioMoCua = COALESCE(?, GioMoCua), 
         GioDongCua = COALESCE(?, GioDongCua), 
         HinhAnh = COALESCE(?, HinhAnh), 
         TrangThai = COALESCE(?, TrangThai) 
       WHERE MaChiNhanh = ?`,
      [
        b.name || b.TenChiNhanh || null,
        b.address || b.DiaChi || null,
        b.phone || b.SoDienThoai || null,
        b.openTime || null,
        b.closeTime || null,
        b.image || b.HinhAnh || null,
        b.status || b.TrangThai || null,
        id
      ]
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/branches/:id - Ngừng hoạt động chi nhánh
  // Lưu ý: Dùng Soft-delete để tránh gãy ràng buộc khóa ngoại với Lịch hẹn và Hóa đơn
  if (pathname.startsWith('/api/branches/') && method === 'DELETE') {
    const id = pathname.replace('/api/branches/', '').trim();
    const hasHistory = await querySql(`
      SELECT TOP 1 MaChiNhanh FROM (
        SELECT MaChiNhanh FROM LichHen WHERE MaChiNhanh = ?
        UNION ALL
        SELECT MaChiNhanh FROM HoaDon WHERE MaChiNhanh = ?
        UNION ALL
        SELECT MaChiNhanh FROM DonHang WHERE MaChiNhanh = ?
        UNION ALL
        SELECT MaChiNhanh FROM NhanVien WHERE MaChiNhanh = ?
      ) t
    `, [id, id, id, id]);

    if (hasHistory && hasHistory.length > 0) {
      await querySql(`UPDATE ChiNhanh SET TrangThai = N'Ngừng hoạt động' WHERE MaChiNhanh = ?`, [id]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        message: 'Chi nhánh đã có dữ liệu hoạt động, chuyển trạng thái sang Ngừng hoạt động để bảo toàn lịch sử.',
        id,
        softDeleted: true
      }));
      return true;
    }

    await querySql(`DELETE FROM ChiNhanh WHERE MaChiNhanh = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa chi nhánh khỏi SQL Server', id }));
    return true;
  }

  return false;
}

module.exports = handleBranchesRoutes;
module.exports.handleBranchesRoutes = handleBranchesRoutes;
module.exports.handleBranchRoutes = handleBranchesRoutes;
module.exports.default = handleBranchesRoutes;

