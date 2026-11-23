const { querySql } = require('../../database/db');
const { formatTime } = require('../../services/helper_service');
const { enforceAuth, extractAuthUser } = require('../../middlewares/auth_middleware');
const auditService = require('../../services/audit.service');
const { clearDbSnapshotCache } = require('../auth/accounts.routes');

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

      const openT = formatTime(r.GioMoCua);
      const closeT = formatTime(r.GioDongCua);
      const hoursStr = `${openT} - ${closeT}`;

      return {
        id: r.MaChiNhanh,
        MaChiNhanh: r.MaChiNhanh,
        name: r.TenChiNhanh,
        TenChiNhanh: r.TenChiNhanh,
        address: addr,
        DiaChi: addr,
        phone: r.SoDienThoai,
        SoDienThoai: r.SoDienThoai,
        openTime: openT,
        closeTime: closeT,
        GioMoCua: openT,
        GioDongCua: closeT,
        openHours: hoursStr,
        hours: hoursStr,
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

    // Kiểm tra nếu chi nhánh đã tồn tại thì thực hiện UPDATE (Upsert an toàn tránh lỗi trùng khóa chính)
    const existing = await querySql(`SELECT 1 FROM ChiNhanh WHERE MaChiNhanh = ?`, [cnId]);
    if (existing && existing.length > 0) {
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
        [name, address, phone, openTime, closeTime, image, status, cnId]
      );
      clearDbSnapshotCache();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, branch: { id: cnId, MaChiNhanh: cnId, name, address, phone, status } }));
      return true;
    }

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

    const authUser = extractAuthUser(req);
    const actorName = authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên';
    const actorRole = authUser ? (authUser.role || 'SUPER_ADMIN') : 'SUPER_ADMIN';
    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'CREATE_BRANCH',
      entityType: 'ChiNhanh',
      entityId: cnId,
      branchId: cnId,
      after: { id: cnId, name, address, phone, status },
      details: `${actorName} tạo chi nhánh mới: ${name} (Mã: #${cnId})`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, branch: { id: cnId, MaChiNhanh: cnId, name, address, phone, status } }));
    return true;
  }

  // PUT /api/branches/:id - Cập nhật thông tin chi nhánh
  if (pathname.startsWith('/api/branches/') && method === 'PUT') {
    const id = pathname.replace('/api/branches/', '').trim();
    const b = parsedBody || {};
    const oldRows = await querySql(`SELECT TenChiNhanh, DiaChi, SoDienThoai, GioMoCua, GioDongCua, TrangThai FROM ChiNhanh WHERE MaChiNhanh = ?`, [id]);
    const oldBranch = (oldRows && oldRows[0]) ? oldRows[0] : null;

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
        b.openTime || b.GioMoCua || null,
        b.closeTime || b.GioDongCua || null,
        b.image || b.HinhAnh || null,
        b.status || b.TrangThai || null,
        id
      ]
    );

    const authUser = extractAuthUser(req);
    const actorName = authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên';
    const actorRole = authUser ? (authUser.role || 'SUPER_ADMIN') : 'SUPER_ADMIN';
    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'UPDATE_BRANCH',
      entityType: 'ChiNhanh',
      entityId: id,
      branchId: id,
      before: oldBranch,
      after: b,
      details: `${actorName} cập nhật thông tin chi nhánh #${id} (${b.name || oldBranch?.TenChiNhanh || ''})`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/branches/:id - Ngừng hoạt động chi nhánh
  // Lưu ý: Dùng Soft-delete để tránh gãy ràng buộc khóa ngoại với Lịch hẹn và Hóa đơn
  if (pathname.startsWith('/api/branches/') && method === 'DELETE') {
    const id = pathname.replace('/api/branches/', '').trim();
    const oldRows = await querySql(`SELECT TenChiNhanh, TrangThai FROM ChiNhanh WHERE MaChiNhanh = ?`, [id]);
    const oldBranch = (oldRows && oldRows[0]) ? oldRows[0] : null;

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

    const authUser = extractAuthUser(req);
    const actorName = authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên';
    const actorRole = authUser ? (authUser.role || 'SUPER_ADMIN') : 'SUPER_ADMIN';

    if (hasHistory && hasHistory.length > 0) {
      await querySql(`UPDATE ChiNhanh SET TrangThai = N'Ngừng hoạt động' WHERE MaChiNhanh = ?`, [id]);
      clearDbSnapshotCache();
      auditService.logAudit({
        actor: actorName,
        role: actorRole,
        action: 'DELETE_BRANCH',
        entityType: 'ChiNhanh',
        entityId: id,
        branchId: id,
        before: oldBranch,
        after: { TrangThai: 'Ngừng hoạt động' },
        details: `${actorName} chuyển trạng thái chi nhánh #${id} sang Ngừng hoạt động`
      }).catch(() => {});

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
    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'DELETE_BRANCH',
      entityType: 'ChiNhanh',
      entityId: id,
      branchId: id,
      before: oldBranch,
      details: `${actorName} xóa hoàn toàn chi nhánh #${id}`
    }).catch(() => {});

    clearDbSnapshotCache();
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

