const { querySql } = require('../../database/db');
const { enforceAuth, extractAuthUser, isStaffRole, hashPassword } = require('../../middlewares/auth_middleware');
const crypto = require('crypto');
const auditService = require('../../services/audit.service');
const { getLocalIsoDate } = require('../../services/helper_service');
const { clearDbSnapshotCache } = require('../auth/accounts.routes');

// Đường dẫn ảnh chân dung thợ thật từ thư mục ChanDungTho (Tho1.jpg -> Tho20.jpg)
function getBarberAvatar(id, name, fallback) {
  if (fallback && fallback.trim().length > 0 && !fallback.includes('images.unsplash.com')) {
    return fallback.trim();
  }
  const str = String(id || name || '').toUpperCase();
  const match = str.match(/(\d+)/);
  let thoIdx = 1;
  if (match) {
    const n = parseInt(match[1], 10);
    thoIdx = ((n - 1) % 20) + 1;
  }
  return `/DataPicture/ChanDungTho/Tho${thoIdx}.jpg`;
}

async function handleStaffRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // GET /api/stylists hoặc /api/admin/staff - Danh sách nhân sự / stylist
  if ((pathname === '/api/stylists' || pathname === '/api/admin/staff') && method === 'GET') {
    const isAdminEndpoint = pathname === '/api/admin/staff';
    const authUserStaff = isAdminEndpoint
      ? enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER'])
      : extractAuthUser(req);
    if (isAdminEndpoint && !authUserStaff) return true;
    const canViewContact = isStaffRole(authUserStaff);

    const branchParam = parsedUrl.searchParams.get('branch_id');
    const forBookingOnly = (parsedUrl.searchParams.get('for_booking') === 'true' || parsedUrl.searchParams.get('role') === 'stylist');
    const isPublicStylists = (pathname === '/api/stylists' && forBookingOnly);
    let q = `
      SELECT nv.MaNhanVien, nv.MaChiNhanh, nv.HoTen, nv.SoDienThoai, nv.Email, 
             nv.CapBac, nv.ChucVu, nv.TrangThai, cn.TenChiNhanh 
      FROM NhanVien nv 
      LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh
      WHERE 1=1
    `;
    const params = [];
    // Muc 24: Loai bo Quan tri toi cao khoi danh sach nhan su tai backend
    q += ` AND nv.MaNhanVien <> 'NV00' AND nv.ChucVu NOT LIKE N'%Quản trị%' AND nv.ChucVu NOT LIKE N'%Chủ tịch%'`;
    if (isPublicStylists) {
      // Đội ngũ Stylist công khai: Loại bỏ thu ngân có cấp bậc nhân viên ở tất cả chi nhánh
      q += ` AND nv.ChucVu NOT LIKE N'%Thu ngân%' AND nv.CapBac NOT LIKE N'%Nhân viên%'`;
      q += ` AND (nv.ChucVu LIKE N'%Thợ chính%' OR nv.ChucVu LIKE N'%Thợ phụ%' OR nv.ChucVu LIKE N'%Quản lý%')`;
    } else {
      q += ` AND (nv.ChucVu LIKE N'%Quản lý%' OR nv.ChucVu LIKE N'%Thợ chính%' OR nv.ChucVu LIKE N'%Thợ phụ%' OR nv.ChucVu LIKE N'%Thu ngân%')`;
    }
    if (authUserStaff) {
      const roleUpper = String(authUserStaff.role || authUserStaff.vaiTroSql || '').toUpperCase();
      const uid = String(authUserStaff.id || authUserStaff.MaNhanVien || authUserStaff.staffId || '').toUpperCase();
      const isSuper = (uid === 'NV00' || roleUpper.includes('ADMIN') || roleUpper.includes('QUẢN TRỊ') || authUserStaff.username === 'admin');
      const isMgr = !isSuper && (roleUpper.includes('QUẢN LÝ') || roleUpper.includes('BRANCH_MANAGER'));
      if (isMgr && authUserStaff.branchId && authUserStaff.branchId !== 'ALL') {
        if (branchParam && branchParam !== 'all' && branchParam !== authUserStaff.branchId) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Quản lý chỉ được xem danh sách nhân sự của chi nhánh mình phụ trách.' }));
          return true;
        }
        // Quản lý chỉ được xem nhân sự tại chi nhánh mình phụ trách
        q += ` AND nv.MaChiNhanh = ?`;
        params.push(authUserStaff.branchId);
      } else if (branchParam && branchParam !== 'all') {
        q += ` AND nv.MaChiNhanh = ?`;
        params.push(branchParam);
      }
    } else if (branchParam && branchParam !== 'all') {
      q += ` AND nv.MaChiNhanh = ?`;
      params.push(branchParam);
    }
    q += ` ORDER BY nv.MaChiNhanh ASC, nv.MaNhanVien ASC`;
    const rows = await querySql(q, params);

    // Tính điểm đánh giá sao trung bình của thợ từ các lịch hẹn đã hoàn thành
    const reviewRows = await querySql(`
      SELECT dg.SoSao, lh.MaNhanVien 
      FROM DanhGia dg 
      JOIN LichHen lh ON dg.MaLichHen = lh.MaLichHen 
      WHERE lh.MaNhanVien IS NOT NULL
    `).catch(() => []);

    const ratingMap = new Map();
    (reviewRows || []).forEach(rv => {
      if (!ratingMap.has(rv.MaNhanVien)) ratingMap.set(rv.MaNhanVien, []);
      ratingMap.get(rv.MaNhanVien).push(Number(rv.SoSao || 5));
    });

    const stylists = rows.map(r => {
      const ratings = ratingMap.get(r.MaNhanVien) || [];
      const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0;

      return {
        id: r.MaNhanVien,
        MaNhanVien: r.MaNhanVien,
        name: r.HoTen,
        HoTen: r.HoTen,
        branchId: r.MaChiNhanh,
        MaChiNhanh: r.MaChiNhanh,
        branchName: r.TenChiNhanh || `Chi Nhánh ${r.MaChiNhanh}`,
        role: r.ChucVu || 'Master Stylist',
        ChucVu: r.ChucVu || 'Master Stylist',
        level: r.CapBac || 'Senior',
        CapBac: r.CapBac || 'Senior',
        rating: avgRating,
        reviewsCount: ratings.length,
        avatar: getBarberAvatar(r.MaNhanVien, r.HoTen),
        phone: canViewContact ? r.SoDienThoai : '',
        SoDienThoai: canViewContact ? r.SoDienThoai : '',
        email: canViewContact ? r.Email : '',
        status: r.TrangThai || 'Đang làm việc'
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(stylists));
    return true;
  }

  // GET /api/stylists/:id/schedule - Lịch ca làm việc & giờ bận của thợ
  if (pathname.startsWith('/api/stylists/') && pathname.endsWith('/schedule') && method === 'GET') {
    const stylistId = decodeURIComponent(pathname.slice('/api/stylists/'.length, -'/schedule'.length)).trim();
    if (!stylistId || stylistId.includes('/')) return false;
    const dateParam = parsedUrl.searchParams.get('date') || getLocalIsoDate();

    const [shifts, bookings] = await Promise.all([
      querySql(`
        SELECT clv.MaCa, clv.MaNhanVien, CONVERT(VARCHAR(10), clv.NgayLam, 120) AS NgayLam,
               CONVERT(VARCHAR(8), clv.GioBatDau) AS GioBatDau,
               CONVERT(VARCHAR(8), clv.GioKetThuc) AS GioKetThuc,
               clv.TrangThai
        FROM CaLamViec clv
        WHERE clv.MaNhanVien = ? AND CONVERT(VARCHAR(10), clv.NgayLam, 120) = ?
        ORDER BY clv.GioBatDau ASC
      `, [stylistId, dateParam]),
      querySql(`
        SELECT CONVERT(VARCHAR(8), GioBatDau) AS GioBatDau,
               CONVERT(VARCHAR(8), GioKetThuc) AS GioKetThuc,
               TrangThai
        FROM LichHen
        WHERE MaNhanVien = ? AND CONVERT(VARCHAR(10), NgayHen, 120) = ? AND TrangThai NOT IN (N'Đã hủy')
        ORDER BY GioBatDau ASC
      `, [stylistId, dateParam])
    ]);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      stylistId,
      date: dateParam,
      shifts: shifts || [],
      bookedSlots: bookings || []
    }));
    return true;
  }

  // GET /api/stylists/:id/today-queue - Hàng đợi khách trong ngày của thợ (che PII nếu chưa xác thực nhân sự)
  if (pathname.startsWith('/api/stylists/') && pathname.endsWith('/today-queue') && method === 'GET') {
    const stylistId = decodeURIComponent(pathname.slice('/api/stylists/'.length, -'/today-queue'.length)).trim();
    if (!stylistId || stylistId.includes('/')) return false;

    const authUserQueue = extractAuthUser(req);
    const canViewPii = isStaffRole(authUserQueue);

    const rows = await querySql(`
      SELECT lh.MaLichHen, lh.MaNhanVien, lh.MaChiNhanh,
             CONVERT(VARCHAR(10), lh.NgayHen, 120) AS NgayHen,
             CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau,
             CONVERT(VARCHAR(8), lh.GioKetThuc) AS GioKetThuc,
             lh.TrangThai,
             kh.HoTen AS TenKhachHang,
             kh.SoDienThoai AS SdtKhachHang
      FROM LichHen lh
      LEFT JOIN KhachHang kh ON lh.MaKhachHang = kh.MaKhachHang
      WHERE lh.MaNhanVien = ?
        AND CONVERT(VARCHAR(10), lh.NgayHen, 120) = CONVERT(VARCHAR(10), GETDATE(), 120)
        AND lh.TrangThai NOT IN (N'Đã hủy')
      ORDER BY lh.GioBatDau ASC
    `, [stylistId]);

    const queue = (rows || []).map(r => ({
      id: r.MaLichHen,
      MaLichHen: r.MaLichHen,
      stylistId: r.MaNhanVien,
      branchId: r.MaChiNhanh,
      date: r.NgayHen,
      timeSlot: String(r.GioBatDau || '').slice(0, 5),
      endTime: String(r.GioKetThuc || '').slice(0, 5),
      status: r.TrangThai,
      customerName: canViewPii ? (r.TenKhachHang || 'Khách Hàng') : 'Khách đã đặt lịch',
      customerPhone: canViewPii ? (r.SdtKhachHang || '') : ''
    }));

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(queue));
    return true;
  }

  // GET /api/stylists/:id - Chi tiết một nhân sự / stylist
  if ((pathname.startsWith('/api/stylists/') || pathname.startsWith('/api/admin/staff/')) && method === 'GET') {
    const isAdminEndpoint = pathname.startsWith('/api/admin/staff/');
    const authUserSingle = isAdminEndpoint
      ? enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER'])
      : extractAuthUser(req);
    if (isAdminEndpoint && !authUserSingle) return true;
    const canViewContact = isStaffRole(authUserSingle);

    const prefix = isAdminEndpoint ? '/api/admin/staff/' : '/api/stylists/';
    const stylistId = decodeURIComponent(pathname.slice(prefix.length)).trim();
    if (!stylistId || stylistId.includes('/')) return false;

    const rows = await querySql(`
      SELECT nv.MaNhanVien, nv.MaChiNhanh, nv.HoTen, nv.SoDienThoai, nv.Email,
             nv.CapBac, nv.ChucVu, nv.TrangThai, cn.TenChiNhanh
      FROM NhanVien nv
      LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh
      WHERE nv.MaNhanVien = ? AND nv.MaNhanVien <> 'NV00'
    `, [stylistId]);

    if (!rows || rows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: `Không tìm thấy stylist ${stylistId}.` }));
      return true;
    }

    const r = rows[0];
    const reviewRows = await querySql(`
      SELECT dg.SoSao FROM DanhGia dg
      JOIN LichHen lh ON dg.MaLichHen = lh.MaLichHen
      WHERE lh.MaNhanVien = ?
    `, [r.MaNhanVien]).catch(() => []);
    const ratings = (reviewRows || []).map(rv => Number(rv.SoSao || 5));
    const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0;

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      id: r.MaNhanVien,
      MaNhanVien: r.MaNhanVien,
      name: r.HoTen,
      HoTen: r.HoTen,
      branchId: r.MaChiNhanh,
      MaChiNhanh: r.MaChiNhanh,
      branchName: r.TenChiNhanh || `Chi Nhánh ${r.MaChiNhanh}`,
      role: r.ChucVu || 'Master Stylist',
      ChucVu: r.ChucVu || 'Master Stylist',
      level: r.CapBac || 'Senior',
      CapBac: r.CapBac || 'Senior',
      rating: avgRating,
      reviewsCount: ratings.length,
      avatar: getBarberAvatar(r.MaNhanVien, r.HoTen),
      phone: canViewContact ? r.SoDienThoai : '',
      SoDienThoai: canViewContact ? r.SoDienThoai : '',
      email: canViewContact ? r.Email : '',
      status: r.TrangThai || 'Đang làm việc'
    }));
    return true;
  }

  // POST /api/stylists hoặc /api/admin/staff - Thêm mới nhân sự salon (chỉ Admin/Quản lý)
  if ((pathname === '/api/stylists' || pathname === '/api/admin/staff') && method === 'POST') {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER']);
    if (!authUser) return true;

    const st = parsedBody || {};
    const role = st.role || st.ChucVu || 'Thợ chính';
    const isSuper = authUser.isSuperAdmin;

    // Chỉ Quản trị viên mới có quyền phân quyền Quản lý chi nhánh
    if (role.includes('Quản lý') && !isSuper) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Chỉ Quản trị viên mới có quyền phân quyền Quản lý chi nhánh.' }));
      return true;
    }
    if (!isSuper && authUser && authUser.branchId) {
      if (st.branchId && st.branchId !== authUser.branchId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Quản lý chỉ được thêm nhân sự vào chi nhánh mình phụ trách.' }));
        return true;
      }
    }

    const maxRows = await querySql(`SELECT TOP 1 MaNhanVien FROM NhanVien ORDER BY LEN(MaNhanVien) DESC, MaNhanVien DESC`);
    let nextN = 61;
    if (maxRows && maxRows[0]) {
      const m = maxRows[0].MaNhanVien.match(/NV(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const nvId = (st.id || st.MaNhanVien || ('NV' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const branchId = st.branchId || st.MaChiNhanh || 'CN01';
    const fullName = st.name || st.HoTen || 'Thợ tóc mới';
    const phone = st.phone || st.SoDienThoai || '';
    const email = st.email || st.Email || '';
    const level = st.level || st.CapBac || 'Thợ chính';

    await querySql(
      `INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, CapBac, ChucVu, TrangThai) 
       VALUES (?, ?, ?, ?, ?, ?, ?, N'Đang làm việc')`,
      [nvId, branchId, fullName, phone, email, level, role]
    );

    const tkId = 'TK_' + nvId;
    const tempStaffPass = (st.password && String(st.password).trim().length >= 6)
      ? String(st.password).trim()
      : crypto.randomBytes(8).toString('base64url');
    const hashedStaffPass = hashPassword(tempStaffPass);
    await querySql(
      `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao) 
       VALUES (?, ?, NULL, ?, ?, ?, N'Hoạt động', GETDATE())`,
      [tkId, nvId, phone || nvId.toLowerCase(), hashedStaffPass, role === 'Quản lý chi nhánh' ? 'Quản lý' : (role === 'Thu ngân' ? 'Thu ngân' : 'Nhân viên')]
    ).catch(() => {});

    const actorName = authUser.fullName || authUser.name || authUser.username;
    const actorRole = authUser.role;
    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'CREATE_STYLIST',
      entityType: 'NhanVien',
      entityId: nvId,
      branchId,
      after: { id: nvId, name: fullName, phone, email, level, role, branchId },
      details: `${actorName} (${actorRole}) thêm nhân sự mới: ${fullName} (Mã: #${nvId}, Vai trò: ${role})`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      ...(st.password ? {} : { temporaryPassword: tempStaffPass }),
      stylist: { id: nvId, MaNhanVien: nvId, branchId, name: fullName, phone, email, level, role }
    }));
    return true;
  }

  // PUT /api/stylists/:id hoặc /api/admin/staff/:id - Cập nhật thông tin nhân viên (chỉ Admin/Quản lý)
  if ((pathname.startsWith('/api/stylists/') || pathname.startsWith('/api/admin/staff/')) && method === 'PUT') {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER']);
    if (!authUser) return true;

    const id = pathname.replace('/api/stylists/', '').replace('/api/admin/staff/', '').trim();
    const st = parsedBody || {};
    const isSuper = authUser.isSuperAdmin;

    // Kiểm tra quyền đối với vai trò Quản lý chi nhánh
    const currentRows = await querySql(`SELECT MaNhanVien, MaChiNhanh, ChucVu, CapBac FROM NhanVien WHERE MaNhanVien = ?`, [id]);
    const currentEmp = currentRows && currentRows[0] ? currentRows[0] : null;
    const oldRole = String(currentEmp?.ChucVu || '');
    const newRole = String(st.role || st.ChucVu || '');

    if (!isSuper) {
      // Quan ly chi duoc sua nhan su thuoc chi nhanh cua minh
      if (authUser && authUser.branchId && currentEmp && currentEmp.MaChiNhanh && currentEmp.MaChiNhanh !== authUser.branchId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Quản lý chỉ được chỉnh sửa nhân sự thuộc chi nhánh mình phụ trách.' }));
        return true;
      }
      // Quan ly khong the doi chi nhanh cua nhan su
      const reqBranch = st.branchId || st.MaChiNhanh;
      if (reqBranch && currentEmp && reqBranch !== currentEmp.MaChiNhanh) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Chỉ Quản trị viên mới có quyền chuyển chi nhánh công tác của nhân sự.' }));
        return true;
      }
      if (newRole && newRole.includes('Quản lý') && !oldRole.includes('Quản lý')) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Chỉ Quản trị viên mới có quyền phân quyền Quản lý chi nhánh.' }));
        return true;
      }
      // Quản lý chi nhánh được phép hạ/bỏ chức Quản lý của nhân sự xuống Thợ chính/Thợ phụ/Thu ngân, chỉ không được tự nâng thợ lên Quản lý
    }

    await querySql(
      `UPDATE NhanVien 
       SET HoTen = COALESCE(?, HoTen), 
           SoDienThoai = COALESCE(?, SoDienThoai), 
           Email = COALESCE(?, Email), 
           CapBac = COALESCE(?, CapBac), 
           ChucVu = COALESCE(?, ChucVu), 
           MaChiNhanh = COALESCE(?, MaChiNhanh), 
           TrangThai = COALESCE(?, TrangThai) 
       WHERE MaNhanVien = ?`,
      [
        st.name || st.HoTen || null,
        st.phone || st.SoDienThoai || null,
        st.email || st.Email || null,
        st.level || st.CapBac || null,
        st.role || st.ChucVu || null,
        st.branchId || st.MaChiNhanh || null,
        st.status || st.TrangThai || null,
        id
      ]
    );

    // Đồng bộ vai trò tài khoản nếu có cập nhật chức vụ
    if (st.role || st.ChucVu) {
      const finalRole = st.role || st.ChucVu;
      const vaiTroTk = finalRole.includes('Quản lý') ? 'Quản lý' : (finalRole.includes('Thu ngân') ? 'Thu ngân' : 'Nhân viên');
      await querySql(`UPDATE TaiKhoan SET VaiTro = ? WHERE MaNhanVien = ?`, [vaiTroTk, id]).catch(() => {});
    }

    const updateActor = authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên';
    const updateRole = authUser ? (authUser.role || 'BRANCH_MANAGER') : 'BRANCH_MANAGER';
    auditService.logAudit({
      actor: updateActor,
      role: updateRole,
      action: 'UPDATE_STYLIST',
      entityType: 'NhanVien',
      entityId: id,
      branchId: currentEmp?.MaChiNhanh,
      before: currentEmp,
      after: st,
      details: `${updateActor} (${updateRole}) cập nhật nhân sự #${id} (${st.name || currentEmp?.HoTen || ''})`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/stylists/:id - Cho nhân sự nghỉ việc (chỉ Admin/Quản lý chi nhánh)
  // Lưu ý: Tự động điều chuyển các lịch hẹn chưa hoàn thành sang stylist khác cùng chi nhánh
  if ((pathname.startsWith('/api/stylists/') || pathname.startsWith('/api/admin/staff/')) && method === 'DELETE') {
    const delAuthUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER']);
    if (!delAuthUser) return true;

    const id = pathname.replace('/api/stylists/', '').replace('/api/admin/staff/', '').trim();
    if (id.toUpperCase() === 'NV00') {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không thể xóa tài khoản Quản trị tối cao.' }));
      return true;
    }

    const empRows = await querySql(`SELECT MaChiNhanh FROM NhanVien WHERE MaNhanVien = ?`, [id]);
    const branchId = empRows && empRows[0] ? empRows[0].MaChiNhanh : 'CN01';
    if (!delAuthUser.isSuperAdmin && delAuthUser.branchId && branchId && branchId !== delAuthUser.branchId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Quản lý chỉ được cho nhân sự thuộc chi nhánh mình nghỉ việc.' }));
      return true;
    }

    // Cập nhật trạng thái nhân sự thành 'Đã nghỉ việc'
    await querySql(`UPDATE NhanVien SET TrangThai = N'Đã nghỉ việc' WHERE MaNhanVien = ?`, [id]);
    await querySql(`UPDATE TaiKhoan SET TrangThai = N'Khóa' WHERE MaNhanVien = ?`, [id]);

    // Tìm một thợ khác đang hoạt động cùng chi nhánh để nhận lại các lịch hẹn chưa xong
    const backupStylist = await querySql(
      `SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaChiNhanh = ? AND TrangThai = N'Đang làm việc' AND MaNhanVien <> ?`,
      [branchId, id]
    );

    let reassignMsg = '';
    if (backupStylist && backupStylist[0]) {
      const newStylistId = backupStylist[0].MaNhanVien;
      await querySql(
        `UPDATE LichHen SET MaNhanVien = ? WHERE MaNhanVien = ? AND TrangThai IN (N'Chờ xác nhận', N'Đã xác nhận', N'Chờ vào ghế')`,
        [newStylistId, id]
      );
      reassignMsg = ` Các lịch hẹn chưa hoàn thành đã được tự động chuyển sang thợ ${newStylistId}.`;
    }

    const delActor = delAuthUser.fullName || delAuthUser.name || delAuthUser.username;
    const delRole = delAuthUser.role;
    auditService.logAudit({
      actor: delActor,
      role: delRole,
      action: 'DELETE_STYLIST',
      entityType: 'NhanVien',
      entityId: id,
      branchId,
      details: `${delActor} (${delRole}) cho nhân sự #${id} nghỉ việc.${reassignMsg}`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      message: `Nhân viên ${id} đã chuyển trạng thái sang Đã nghỉ việc.${reassignMsg}`,
      id
    }));
    return true;
  }

  // GET /api/shifts - Lấy danh sách ca làm việc của thợ
  if (pathname === '/api/shifts' && method === 'GET') {
    const rows = await querySql(`
      SELECT clv.MaCa, clv.MaNhanVien, clv.NgayLam, 
             CONVERT(VARCHAR(8), clv.GioBatDau) AS GioBatDau, 
             CONVERT(VARCHAR(8), clv.GioKetThuc) AS GioKetThuc, 
             clv.TrangThai, nv.HoTen, nv.MaChiNhanh 
      FROM CaLamViec clv 
      JOIN NhanVien nv ON clv.MaNhanVien = nv.MaNhanVien
    `);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  // POST /api/shifts - Phân ca làm việc mới (bắt buộc Nhân sự/Quản lý/Admin)
  if (pathname === '/api/shifts' && method === 'POST') {
    const shiftAuthUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER', 'BARBER', 'CASHIER']);
    if (!shiftAuthUser) return true;

    const { maNhanVien, date, startTime, endTime } = parsedBody || {};
    const targetStaffId = (maNhanVien || shiftAuthUser.staffId || '').trim();
    if (!targetStaffId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Thiếu mã nhân viên xếp ca.' }));
      return true;
    }
    if ((shiftAuthUser.role === 'BARBER' || shiftAuthUser.role === 'CASHIER') && shiftAuthUser.staffId !== targetStaffId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Nhân sự chỉ được đăng ký ca cho chính mình.' }));
      return true;
    }
    if (shiftAuthUser.role === 'BRANCH_MANAGER' && shiftAuthUser.branchId) {
      const nvRows = await querySql('SELECT MaChiNhanh FROM NhanVien WHERE MaNhanVien = ?', [targetStaffId]);
      if (nvRows?.[0]?.MaChiNhanh && nvRows[0].MaChiNhanh !== shiftAuthUser.branchId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Quản lý chỉ được xếp ca cho nhân viên chi nhánh mình.' }));
        return true;
      }
    }

    const maxCa = await querySql(`SELECT TOP 1 MaCa FROM CaLamViec ORDER BY LEN(MaCa) DESC, MaCa DESC`);
    let nextCaN = 101;
    if (maxCa && maxCa[0]) {
      const m = maxCa[0].MaCa.match(/CA(\d+)/i);
      if (m) nextCaN = parseInt(m[1], 10) + 1;
    }
    const newCaId = 'CA' + nextCaN;
    const startT = (startTime || '08:30').length === 5 ? `${startTime || '08:30'}:00` : (startTime || '08:30:00');
    const endT = (endTime || '15:30').length === 5 ? `${endTime || '15:30'}:00` : (endTime || '15:30:00');

    const shiftDate = date || getLocalIsoDate();
    await querySql(
      `INSERT INTO CaLamViec (MaCa, MaNhanVien, NgayLam, GioBatDau, GioKetThuc, TrangThai) 
       VALUES (?, ?, ?, ?, ?, N'Đã xếp ca')`,
      [newCaId, targetStaffId, shiftDate, startT, endT]
    );

    const shiftActor = shiftAuthUser.fullName || shiftAuthUser.name || shiftAuthUser.username;
    const shiftRole = shiftAuthUser.role;
    auditService.logAudit({
      actor: shiftActor,
      role: shiftRole,
      action: 'REGISTER_SHIFT',
      entityType: 'CaLamViec',
      entityId: newCaId,
      after: { shiftId: newCaId, staffId: targetStaffId, date: shiftDate, startT, endT },
      details: `${shiftActor} (${shiftRole}) đăng ký/xếp ca làm việc #${newCaId} (${startT} - ${endT})`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xếp ca làm việc thành công!', shiftId: newCaId }));
    return true;
  }

  return false;
}

module.exports = handleStaffRoutes;
module.exports.handleStaffRoutes = handleStaffRoutes;
module.exports.default = handleStaffRoutes;

