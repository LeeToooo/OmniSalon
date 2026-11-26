const { querySql } = require('../../database/db');
const { enforceAuth, isStaffRole } = require('../../middlewares/auth_middleware');

async function handleNotificationRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // GET /api/notifications - Lấy danh sách thông báo theo chủ sở hữu JWT
  if (pathname === '/api/notifications' && method === 'GET') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    let rows;
    if (authUser.isSuperAdmin) {
      rows = await querySql(
        `SELECT tb.MaThongBao, tb.MaTaiKhoan, tb.MaKhachHang, tb.TieuDe, tb.NoiDung, tb.LoaiThongBao,
                CONVERT(VARCHAR(19), tb.ThoiGianGui, 120) AS ThoiGianGui, tb.TrangThaiDoc
         FROM ThongBao tb
         ORDER BY tb.ThoiGianGui DESC`
      );
    } else if (isStaffRole(authUser)) {
      rows = await querySql(
        `SELECT tb.MaThongBao, tb.MaTaiKhoan, tb.MaKhachHang, tb.TieuDe, tb.NoiDung, tb.LoaiThongBao,
                CONVERT(VARCHAR(19), tb.ThoiGianGui, 120) AS ThoiGianGui, tb.TrangThaiDoc
         FROM ThongBao tb
         WHERE tb.MaTaiKhoan = ? OR (tb.MaTaiKhoan IS NULL AND tb.MaKhachHang IS NULL)
         ORDER BY tb.ThoiGianGui DESC`,
        [authUser.id || '']
      );
    } else {
      rows = await querySql(
        `SELECT tb.MaThongBao, tb.MaTaiKhoan, tb.MaKhachHang, tb.TieuDe, tb.NoiDung, tb.LoaiThongBao,
                CONVERT(VARCHAR(19), tb.ThoiGianGui, 120) AS ThoiGianGui, tb.TrangThaiDoc
         FROM ThongBao tb
         WHERE tb.MaTaiKhoan = ? OR tb.MaKhachHang = ?
         ORDER BY tb.ThoiGianGui DESC`,
        [authUser.id || '', authUser.customerId || '']
      );
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows || []));
    return true;
  }

  // POST /api/notifications - Tạo thông báo mới (chỉ Admin/Quản lý chi nhánh)
  if (pathname === '/api/notifications' && method === 'POST') {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER']);
    if (!authUser) return true;

    const body = parsedBody || {};
    const maxTb = await querySql(`SELECT TOP 1 MaThongBao FROM ThongBao WHERE MaThongBao LIKE 'TB%' ORDER BY LEN(MaThongBao) DESC, MaThongBao DESC`).catch(() => []);
    let nextN = 11;
    if (maxTb && maxTb[0]) {
      const m = maxTb[0].MaThongBao.match(/TB(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const tbId = (body.id || body.MaThongBao || ('TB' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const khId = body.customerId || body.MaKhachHang || null;
    const tkId = body.accountId || body.MaTaiKhoan || null;
    const title = body.title || body.TieuDe || 'Thông báo mới';
    const content = body.content || body.NoiDung || '';
    const type = body.type || body.LoaiThongBao || 'Hệ thống';

    await querySql(
      `INSERT INTO ThongBao (MaThongBao, MaTaiKhoan, MaKhachHang, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, TrangThaiDoc) VALUES (?, ?, ?, ?, ?, ?, GETDATE(), 0)`,
      [tbId, tkId, khId, title, content, type]
    );
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, notification: { id: tbId, title, content, type } }));
    return true;
  }

  // PUT /api/notifications/:id/read - Đánh dấu thông báo là đã đọc (chính chủ hoặc Quản trị)
  if (pathname.startsWith('/api/notifications/') && pathname.includes('/read') && method === 'PUT') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    const parts = pathname.split('/');
    const notifId = parts[3];
    const rows = await querySql(`SELECT TOP 1 MaTaiKhoan, MaKhachHang FROM ThongBao WHERE MaThongBao = ?`, [notifId]);
    if (rows && rows.length > 0 && !authUser.isSuperAdmin && !isStaffRole(authUser)) {
      const n = rows[0];
      const isOwner = (n.MaTaiKhoan && n.MaTaiKhoan === authUser.id) || (n.MaKhachHang && n.MaKhachHang === authUser.customerId);
      if (!isOwner) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Bạn không có quyền thao tác trên thông báo này.' }));
        return true;
      }
    }
    await querySql(`UPDATE ThongBao SET TrangThaiDoc = 1 WHERE MaThongBao = ?`, [notifId]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, notifId, isRead: true }));
    return true;
  }

  // DELETE /api/notifications/:id - Xóa thông báo (chính chủ hoặc Admin/Quản lý)
  if (pathname.startsWith('/api/notifications/') && method === 'DELETE') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    const id = pathname.replace('/api/notifications/', '').replace('/read', '').trim();
    if (!authUser.isSuperAdmin && authUser.role !== 'BRANCH_MANAGER') {
      const rows = await querySql(`SELECT TOP 1 MaTaiKhoan, MaKhachHang FROM ThongBao WHERE MaThongBao = ?`, [id]);
      if (rows && rows.length > 0) {
        const n = rows[0];
        const isOwner = (n.MaTaiKhoan && n.MaTaiKhoan === authUser.id) || (n.MaKhachHang && n.MaKhachHang === authUser.customerId);
        if (!isOwner) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Bạn không có quyền xóa thông báo của người khác.' }));
          return true;
        }
      }
    }
    await querySql(`DELETE FROM ThongBao WHERE MaThongBao = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa thông báo', id }));
    return true;
  }

  return false;
}

module.exports = handleNotificationRoutes;
module.exports.handleNotificationRoutes = handleNotificationRoutes;
module.exports.default = handleNotificationRoutes;

