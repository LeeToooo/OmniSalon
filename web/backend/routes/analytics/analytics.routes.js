const { querySql } = require('../../database/db');
const { extractAuthUser } = require('../../middlewares/auth_middleware');
const auditService = require('../../services/audit.service');

async function handleAnalyticsRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl } = ctx;

  // GET /api/analytics/revenue - Báo cáo tổng doanh thu và số lượng hóa đơn
  // Tham số: branch_id
  if (pathname === '/api/analytics/revenue' && method === 'GET') {
    const authUser = extractAuthUser(req);
    const branchParam = parsedUrl.searchParams.get('branch_id');
    let effectiveBranch = branchParam;

    if (authUser) {
      const roleUpper = String(authUser.role || authUser.vaiTroSql || '').toUpperCase();
      const isMgr = (roleUpper.includes('QUẢN LÝ') || roleUpper.includes('BRANCH_MANAGER')) && !roleUpper.includes('ADMIN') && !roleUpper.includes('QUẢN TRỊ');
      if (isMgr && authUser.branchId) {
        if (branchParam && branchParam !== 'all' && branchParam !== authUser.branchId) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Quản lý chỉ được xem doanh thu của chi nhánh mình phụ trách.' }));
          return true;
        }
        effectiveBranch = authUser.branchId;
      }
    }

    let q = `
      SELECT 
        ISNULL(SUM(TongTien), 0) AS TongDoanhThu,
        COUNT(*) AS TongHoaDon
      FROM HoaDon
      WHERE TrangThai = N'Đã thanh toán'
    `;
    const params = [];
    if (effectiveBranch && effectiveBranch !== 'all') {
      q += ` AND MaChiNhanh = ?`;
      params.push(effectiveBranch);
    }
    const rows = await querySql(q, params);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      totalRevenue: parseFloat(rows[0]?.TongDoanhThu || 0),
      totalInvoices: rows[0]?.TongHoaDon || 0,
      currency: 'VND'
    }));
    return true;
  }

  // GET /api/analytics/stylists/:id/commissions - Tính tiền hoa hồng cho stylist
  // Quy tắc nghiệp vụ: Stylist nhận 20% trên tổng giá trị các lịch hẹn đã 'Hoàn thành'
  if (pathname.includes('/analytics/stylists/') && pathname.includes('/commissions')) {
    const parts = pathname.split('/');
    const stylistId = parts[4];
    const rows = await querySql(
      `SELECT COUNT(*) AS TongLich, ISNULL(SUM(TongTien), 0) AS TongTien
       FROM LichHen 
       WHERE MaNhanVien = ? AND TrangThai = N'Hoàn thành'`,
      [stylistId]
    );
    const revenue = parseFloat(rows[0]?.TongTien || 0);
    const count = rows[0]?.TongLich || 0;
    const commissionRate = 0.20; // Tỷ lệ hoa hồng 20% cố định theo chính sách salon
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      stylistId,
      completedAppointments: count,
      generatedRevenue: revenue,
      commissionRate: '20%',
      commissionAmount: Math.round(revenue * commissionRate),
      currency: 'VND'
    }));
    return true;
  }

  // GET /api/audit/logs hoặc /api/audit hoặc /api/analytics/audit-logs - Xem nhật ký kiểm toán (Phân quyền: SUPER_ADMIN, BRANCH_MANAGER)
  if ((pathname === '/api/audit/logs' || pathname === '/api/audit' || pathname === '/api/analytics/audit-logs') && method === 'GET') {
    const authUser = extractAuthUser(req);
    if (!authUser) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Yêu cầu đăng nhập để truy cập nhật ký kiểm toán.' }));
      return true;
    }

    try {
      const branchId = parsedUrl.searchParams.get('branch_id');
      const role = parsedUrl.searchParams.get('role');
      const action = parsedUrl.searchParams.get('action');
      const entityType = parsedUrl.searchParams.get('entity_type');
      const q = parsedUrl.searchParams.get('q');

      const logs = await auditService.getAuditLogs({ authUser, branchId, role, action, entityType, q });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(logs));
      return true;
    } catch (err) {
      const status = err.statusCode || 500;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
      return true;
    }
  }

  // POST /api/audit/logs hoặc /api/audit - Ghi nhận nhật ký kiểm toán mới
  if ((pathname === '/api/audit/logs' || pathname === '/api/audit') && method === 'POST') {
    const authUser = extractAuthUser(req);
    const body = ctx.parsedBody || {};

    const actor = authUser ? (authUser.fullName || authUser.name || authUser.username) : (body.actor || 'Hệ Thống');
    const role = authUser ? (authUser.role || 'CUSTOMER') : (body.role || 'SYSTEM');
    const branchId = body.branchId || authUser?.branchId || null;

    const log = await auditService.logAudit({
      actor,
      role,
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      branchId,
      before: body.before,
      after: body.after,
      details: body.details,
      ip: req.socket?.remoteAddress || '127.0.0.1'
    });

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, log }));
    return true;
  }

  // Chặn sửa/xóa audit log theo ràng buộc: "Bản ghi audit chỉ được thêm, không có API sửa hoặc xóa."
  if ((pathname === '/api/audit/logs' || pathname === '/api/audit' || pathname.startsWith('/api/audit/')) && ['PUT', 'PATCH', 'DELETE'].includes(method)) {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Bản ghi kiểm toán là bất biến (Immutable), không được phép sửa hoặc xóa.' }));
    return true;
  }

  return false;
}

module.exports = handleAnalyticsRoutes;
module.exports.handleAnalyticsRoutes = handleAnalyticsRoutes;
module.exports.default = handleAnalyticsRoutes;

