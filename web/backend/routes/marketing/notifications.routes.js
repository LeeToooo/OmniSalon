// =========================================================================
// QUẢN LÝ THÔNG BÁO HỆ THỐNG
// Bảng CSDL: ThongBao, KhachHang, TaiKhoan
// =========================================================================

const { querySql } = require('../../database/db');

async function handleNotificationRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // GET /api/notifications - Lấy danh sách thông báo gửi đến khách hàng hoặc nội bộ
  if (pathname === '/api/notifications' && method === 'GET') {
    const rows = await querySql(
      `SELECT tb.MaThongBao, tb.MaTaiKhoan, tb.MaKhachHang, tb.TieuDe, tb.NoiDung, tb.LoaiThongBao,
              CONVERT(VARCHAR(19), tb.ThoiGianGui, 120) AS ThoiGianGui, tb.TrangThaiDoc
       FROM ThongBao tb
       ORDER BY tb.ThoiGianGui DESC`
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  // POST /api/notifications - Tạo thông báo mới
  if (pathname === '/api/notifications' && method === 'POST') {
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

  // PUT /api/notifications/:id/read - Đánh dấu thông báo là đã đọc
  if (pathname.startsWith('/api/notifications/') && pathname.includes('/read') && method === 'PUT') {
    const parts = pathname.split('/');
    const notifId = parts[3];
    await querySql(`UPDATE ThongBao SET TrangThaiDoc = 1 WHERE MaThongBao = ?`, [notifId]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, notifId, isRead: true }));
    return true;
  }

  // DELETE /api/notifications/:id - Xóa thông báo
  if (pathname.startsWith('/api/notifications/') && method === 'DELETE') {
    const id = pathname.replace('/api/notifications/', '').replace('/read', '').trim();
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

