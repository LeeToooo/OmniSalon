// Dịch vụ ghi và tra cứu nhật ký kiểm toán dùng chung (Audit Service)
const { querySql } = require('../database/db');

// Bộ nhớ đệm tạm thời hỗ trợ truy vấn nhanh và đồng bộ
const memoryAuditLogs = [];

function generateLogId() {
  return `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

/**
 * Ghi nhật ký kiểm toán dùng chung cho toàn bộ hệ thống
 * Áp dụng cho cả 6 vai trò: SUPER_ADMIN, BRANCH_MANAGER, CASHIER, STYLIST, CUSTOMER, SYSTEM
 *
 * @param {object} params
 * @param {string} params.actor - Tên hoặc ID người thao tác
 * @param {string} params.role - SUPER_ADMIN | BRANCH_MANAGER | CASHIER | STYLIST | CUSTOMER | SYSTEM
 * @param {string} params.action - Mã hành động (VD: UPDATE_PRODUCT, CREATE_BOOKING...)
 * @param {string} params.entityType - Loại đối tượng (VD: SanPham, LichHen, ChiNhanh...)
 * @param {string} params.entityId - Mã đối tượng (VD: SP01, LH12, CN01...)
 * @param {string} [params.branchId] - Chi nhánh liên quan
 * @param {any} [params.before] - Giá trị trước thao tác
 * @param {any} [params.after] - Giá trị sau thao tác
 * @param {string} [params.details] - Diễn giải tóm tắt
 * @param {string} [params.ip] - IP client
 */
async function logAudit({
  actor,
  role = 'SYSTEM',
  action,
  entityType = 'HeThong',
  entityId = '—',
  branchId = null,
  before = null,
  after = null,
  details = '',
  ip = '127.0.0.1'
}) {
  try {
    const cleanActor = String(actor || 'Hệ Thống').trim();
    const cleanRole = String(role || 'SYSTEM').trim().toUpperCase();
    const cleanAction = String(action || 'UNKNOWN_ACTION').trim().toUpperCase();
    const cleanEntityType = String(entityType || 'HeThong').trim();
    const cleanEntityId = String(entityId || '—').trim();
    const cleanBranchId = branchId ? String(branchId).trim() : null;
    const beforeStr = (before !== null && typeof before === 'object') ? JSON.stringify(before) : (before ? String(before) : null);
    const afterStr = (after !== null && typeof after === 'object') ? JSON.stringify(after) : (after ? String(after) : null);
    const cleanDetails = details ? String(details).trim() : `${cleanAction} trên ${cleanEntityType} [${cleanEntityId}]`;
    const logId = generateLogId();
    const timestamp = new Date().toISOString();

    const logEntry = {
      id: logId,
      logId,
      timestamp,
      actor: cleanActor,
      operatorName: cleanActor,
      role: cleanRole,
      operatorRole: cleanRole,
      action: cleanAction,
      entityType: cleanEntityType,
      entity: `${cleanEntityType}: ${cleanEntityId}`,
      entityId: cleanEntityId,
      branchId: cleanBranchId,
      before: beforeStr,
      after: afterStr,
      beforeData: beforeStr,
      afterData: afterStr,
      details: cleanDetails,
      ip: ip || '127.0.0.1'
    };

    // 1. Lưu vào memory cache (giữ tối đa 1000 bản ghi)
    memoryAuditLogs.unshift(logEntry);
    if (memoryAuditLogs.length > 1000) memoryAuditLogs.pop();

    // 2. Ghi trực tiếp vào bảng AuditLog trong SQL Server
    try {
      await querySql(`
        INSERT INTO AuditLog (LogId, Timestamp, Actor, Role, Action, EntityType, EntityId, BranchId, BeforeData, AfterData, Details, Ip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        logId,
        timestamp,
        cleanActor,
        cleanRole,
        cleanAction,
        cleanEntityType,
        cleanEntityId,
        cleanBranchId,
        beforeStr,
        afterStr,
        cleanDetails,
        ip || '127.0.0.1'
      ]);
    } catch (sqlErr) {
      // Ghi log lỗi không được làm hỏng nghiệp vụ chính: chỉ log cảnh báo ra console
      console.warn('[AUDIT_LOG_SQL_WARN]', sqlErr.message);
    }

    return logEntry;
  } catch (err) {
    // Không để lỗi ghi log làm gián đoạn luồng chính
    console.error('[AUDIT_LOG_ERROR]', err.message);
    return null;
  }
}

/**
 * Đọc nhật ký kiểm toán có phân quyền chặt chẽ ở BACKEND
 * - SUPER_ADMIN: xem toàn bộ log của mọi chi nhánh
 * - BRANCH_MANAGER: chỉ xem log thuộc chi nhánh của mình (lọc theo branchId ở BACKEND)
 * - CASHIER, STYLIST, CUSTOMER: không có quyền vào tab này (API trả 403)
 */
async function getAuditLogs({ authUser, branchId, role, action, entityType, q }) {
  if (!authUser) {
    const err = new Error('Yêu cầu xác thực tài khoản để xem nhật ký kiểm toán.');
    err.statusCode = 401;
    throw err;
  }

  const userRole = String(authUser.role || authUser.vaiTroSql || '').toUpperCase();
  const isSuperAdmin = userRole.includes('SUPER_ADMIN') || userRole.includes('QUẢN TRỊ') || authUser.isSuperAdmin;
  const isBranchManager = (userRole.includes('BRANCH_MANAGER') || userRole.includes('QUẢN LÝ')) && !isSuperAdmin;

  // CASHIER, STYLIST, CUSTOMER: trả HTTP 403 Forbidden
  if (!isSuperAdmin && !isBranchManager) {
    const err = new Error('Bạn không có quyền truy cập nhật ký kiểm toán.');
    err.statusCode = 403;
    throw err;
  }

  // BRANCH_MANAGER chỉ xem log thuộc chi nhánh của mình
  let effectiveBranchId = null;
  if (isBranchManager) {
    effectiveBranchId = authUser.branchId || 'CN01';
  } else if (branchId && branchId !== 'all') {
    effectiveBranchId = branchId;
  }

  let logs = [];
  try {
    let sqlQuery = `SELECT * FROM AuditLog WHERE 1=1`;
    const params = [];

    if (effectiveBranchId) {
      if (isBranchManager) {
        sqlQuery += ` AND (BranchId = ? OR BranchId = 'ALL')`;
      } else {
        sqlQuery += ` AND (BranchId = ? OR BranchId IS NULL OR BranchId = '' OR BranchId = 'ALL')`;
      }
      params.push(effectiveBranchId);
    }
    if (role && role !== 'all') {
      sqlQuery += ` AND Role = ?`;
      params.push(role);
    }
    if (action && action !== 'all') {
      sqlQuery += ` AND Action LIKE ?`;
      params.push(`%${action}%`);
    }
    if (entityType && entityType !== 'all') {
      sqlQuery += ` AND EntityType = ?`;
      params.push(entityType);
    }

    sqlQuery += ` ORDER BY Timestamp DESC`;

    const rows = await querySql(sqlQuery, params);
    if (rows && rows.length > 0) {
      logs = rows.map(r => ({
        id: r.LogId || `log-${r.Id}`,
        logId: r.LogId || `log-${r.Id}`,
        timestamp: r.Timestamp ? new Date(r.Timestamp).toISOString() : new Date().toISOString(),
        actor: r.Actor,
        operatorName: r.Actor,
        role: r.Role,
        operatorRole: r.Role,
        action: r.Action,
        entityType: r.EntityType,
        entity: `${r.EntityType}: ${r.EntityId}`,
        entityId: r.EntityId,
        branchId: r.BranchId,
        before: r.BeforeData,
        after: r.AfterData,
        beforeData: r.BeforeData,
        afterData: r.AfterData,
        details: r.Details,
        ip: r.Ip || '127.0.0.1'
      }));
    }
  } catch (sqlErr) {
    console.warn('[GET_AUDIT_LOGS_SQL_WARN]', sqlErr.message);
  }

  // Nếu CSDL rỗng hoặc chưa kịp insert, đồng bộ từ bộ nhớ memoryAuditLogs
  if (logs.length === 0 && memoryAuditLogs.length > 0) {
    logs = [...memoryAuditLogs];
    if (effectiveBranchId) {
      logs = logs.filter(l => !l.branchId || l.branchId === effectiveBranchId);
    }
    if (role && role !== 'all') {
      logs = logs.filter(l => (l.role || '').toUpperCase() === role.toUpperCase());
    }
    if (action && action !== 'all') {
      logs = logs.filter(l => (l.action || '').toUpperCase().includes(action.toUpperCase()));
    }
    if (entityType && entityType !== 'all') {
      logs = logs.filter(l => (l.entityType || '').toUpperCase() === entityType.toUpperCase());
    }
  }

  // Lọc theo từ khóa tìm kiếm q
  if (q) {
    const norm = str => (str || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const nq = norm(q);
    logs = logs.filter(l =>
      norm(l.actor).includes(nq) ||
      norm(l.action).includes(nq) ||
      norm(l.entity).includes(nq) ||
      norm(l.details).includes(nq) ||
      norm(l.role).includes(nq) ||
      norm(l.entityId).includes(nq)
    );
  }

  return logs;
}

module.exports = {
  logAudit,
  getAuditLogs,
  memoryAuditLogs
};
