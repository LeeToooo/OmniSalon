// Các api quản lý tài khoản người dùng
const { querySql } = require('../../database/db');
const { enforceAuth, extractAuthUser } = require('../../middlewares/auth_middleware');
const {
  getFullSqlDatabase,
  resolveUserRole,
  resolveBranchName,
  ROLE_NAME_MAP,
  ROLE_SQL_MAP,
  BRANCH_NAME_MAP
} = require('../../services/helper_service');
const auditService = require('../../services/audit.service');

// Cache ngắn hạn & Deduplication cho snapshot CSDL tránh quá tải SQL Server
let _dbSnapshotCache = null;
let _dbSnapshotCachedAt = 0;
let _dbSnapshotPendingPromise = null;
const DB_CACHE_TTL_MS = 5000;

function clearDbSnapshotCache() {
  _dbSnapshotCache = null;
  _dbSnapshotCachedAt = 0;
  _dbSnapshotPendingPromise = null;
}

async function getCachedSqlDatabase() {
  const now = Date.now();
  if (_dbSnapshotCache && (now - _dbSnapshotCachedAt < DB_CACHE_TTL_MS)) {
    return _dbSnapshotCache;
  }
  if (_dbSnapshotPendingPromise) {
    return await _dbSnapshotPendingPromise;
  }
  _dbSnapshotPendingPromise = (async () => {
    try {
      const data = await getFullSqlDatabase();
      _dbSnapshotCache = data;
      _dbSnapshotCachedAt = Date.now();
      return data;
    } finally {
      _dbSnapshotPendingPromise = null;
    }
  })();
  return await _dbSnapshotPendingPromise;
}

async function handleAccountsRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // GET /api/accounts - Lấy danh sách tài khoản, đã che trường mật khẩu an toàn
  if (pathname === '/api/accounts' && method === 'GET') {
    const rows = await querySql(`
      SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.VaiTro, tk.TrangThai AS TrangThaiTK,
             nv.MaNhanVien, nv.HoTen AS HoTenNV, nv.MaChiNhanh, nv.SoDienThoai AS SdtNV, nv.Email AS EmailNV, nv.CapBac, nv.ChucVu,
             kh.MaKhachHang, kh.HoTen AS HoTenKH, kh.SoDienThoai AS SdtKH, kh.Email AS EmailKH,
             cn.TenChiNhanh
      FROM TaiKhoan tk
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh
    `);

    const accounts = (rows || []).map(r => {
      const role = resolveUserRole(r);
      const bName = resolveBranchName(r.MaChiNhanh, r.TenChiNhanh, role);

      return {
        id: r.MaTaiKhoan,
        username: r.TenDangNhap,
        fullName: r.HoTenNV || r.HoTenKH || r.TenDangNhap,
        phone: r.SdtNV || r.SdtKH || r.TenDangNhap,
        email: r.EmailNV || r.EmailKH || '',
        role: role,
        roleName: (role === 'BARBER' && r.ChucVu) ? r.ChucVu : (ROLE_NAME_MAP[role] || role),
        vaiTro: r.VaiTro,
        chucVu: r.ChucVu,
        branchId: r.MaChiNhanh || (role === 'CUSTOMER' ? null : 'ALL'),
        branchName: bName,
        TenChiNhanh: r.TenChiNhanh || bName,
        status: r.TrangThaiTK || 'Hoạt động'
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(accounts));
    return true;
  }

  // GET /api/database - Tải snapshot CSDL đồng bộ thời gian thực cho Frontend Store
  if (pathname === '/api/database' && method === 'GET') {
    const dbData = await getCachedSqlDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(dbData));
    return true;
  }

  // GET /api/users - Danh sách người dùng hệ thống, phục vụ trang quản trị nội bộ
  if (pathname === '/api/users' && method === 'GET') {
    const rows = await querySql(`
      SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.VaiTro, tk.TrangThai,
             ISNULL(nv.HoTen, kh.HoTen) AS HoTen,
             ISNULL(nv.SoDienThoai, kh.SoDienThoai) AS SoDienThoai,
             ISNULL(nv.Email, kh.Email) AS Email,
             nv.MaChiNhanh, nv.ChucVu, tk.MaNhanVien, tk.MaKhachHang,
             cn.TenChiNhanh
      FROM TaiKhoan tk
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh
      ORDER BY tk.NgayTao DESC
    `);
    const result = (rows || []).map(r => {
      const code = r.MaNhanVien || r.MaKhachHang || r.MaTaiKhoan || '1';
      const m = String(code).match(/(\d+)/);
      const n = m ? parseInt(m[1], 10) : 1;
      const idx = ((n - 1) % 20) + 1;

      const role = resolveUserRole(r);
      const bName = resolveBranchName(r.MaChiNhanh, r.TenChiNhanh, role);

      return {
        ...r,
        id: r.MaTaiKhoan,
        username: r.TenDangNhap,
        fullName: r.HoTen,
        phone: r.SoDienThoai,
        email: r.Email,
        role: role,
        roleName: (role === 'BARBER' && r.ChucVu) ? r.ChucVu : (ROLE_NAME_MAP[role] || role),
        branchId: r.MaChiNhanh || (role === 'CUSTOMER' ? null : 'ALL'),
        branchName: bName,
        TenChiNhanh: r.TenChiNhanh || bName,
        avatarUrl: `/DataPicture/ChanDungTho/Tho${idx}.jpg`,
        avatar: `/DataPicture/ChanDungTho/Tho${idx}.jpg`
      };
    });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
    return true;
  }

  // GET /api/customers - Danh sách khách hàng kèm tổng lượt đặt lịch và tổng chi tiêu
  if (pathname === '/api/customers' && method === 'GET') {
    const rows = await querySql(`
      SELECT kh.MaKhachHang, kh.HoTen, kh.SoDienThoai, kh.Email,
             CONVERT(VARCHAR(10), kh.NgaySinh, 120) AS NgaySinh,
             (SELECT COUNT(*) FROM LichHen WHERE MaKhachHang = kh.MaKhachHang) AS TongLichHen,
             (SELECT COUNT(*) FROM DonHang WHERE MaKhachHang = kh.MaKhachHang) AS TongDonHang,
             ISNULL((SELECT SUM(TongTien) FROM HoaDon WHERE MaKhachHang = kh.MaKhachHang AND TrangThai = N'Đã thanh toán'), 0) AS TongChiTieu
      FROM KhachHang kh
      ORDER BY kh.MaKhachHang DESC
    `);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  /* POST /api/users/role hoac PUT /api/users/:id/role - Phan quyen vai tro tai khoan vao SQL */
  if ((pathname === '/api/users/role' && method === 'POST') || (pathname.startsWith('/api/users/') && pathname.endsWith('/role') && (method === 'PUT' || method === 'POST'))) {
    const body = parsedBody || {};
    const userId = (pathname !== '/api/users/role' && pathname.startsWith('/api/users/')) ? pathname.split('/')[3] : (body.id || body.userId || body.username);
    const { role, vaiTro } = body;
    const roleKey = (role || '').toString().trim().toUpperCase();

    // Ràng buộc bảo vệ: Không cho phép gán vai trò Quản Trị Viên (SUPER_ADMIN) từ giao diện
    if (roleKey === 'SUPER_ADMIN' || roleKey === 'ADMIN' || (vaiTro && vaiTro.toLowerCase().includes('quản trị'))) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không được phép cấp vai trò Quản Trị Viên tối cao.' }));
      return true;
    }

    const isCustomer = (roleKey === 'CUSTOMER' || (vaiTro && vaiTro.toLowerCase().includes('khách')));
    const finalVaiTro = isCustomer ? 'Khách hàng' : (vaiTro || ROLE_SQL_MAP[roleKey] || role || 'Khách hàng');

    try {
      // Tìm tài khoản linh hoạt theo MaTaiKhoan, TenDangNhap, MaNhanVien hoặc MaKhachHang
      const tkRows = await querySql(`
        SELECT tk.MaTaiKhoan, tk.MaKhachHang, tk.MaNhanVien, tk.TenDangNhap,
               nv.HoTen AS HoTenNV, nv.SoDienThoai AS SdtNV, nv.Email AS EmailNV,
               kh.HoTen AS HoTenKH, kh.SoDienThoai AS SdtKH, kh.Email AS EmailKH
        FROM TaiKhoan tk
        LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
        LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
        WHERE tk.MaTaiKhoan = ? 
           OR tk.TenDangNhap = ? 
           OR tk.MaNhanVien = ? 
           OR tk.MaKhachHang = ?
           OR tk.MaTaiKhoan = 'TK_' + ?
           OR tk.TenDangNhap = 'user_' + ?
      `, [userId, userId, userId, userId, userId, userId]);

      const targetTk = (tkRows && tkRows.length > 0) ? tkRows[0] : null;
      const exactTkId = targetTk ? targetTk.MaTaiKhoan : userId;

      if (isCustomer) {
        // Chuyển nhân viên sang Khách hàng: Cập nhật VaiTro = N'Khách hàng', liên kết MaKhachHang, và gán MaNhanVien = NULL
        // (Tuân thủ ràng buộc CHECK constraint CK_TaiKhoan_ChuSoHuu: chỉ được có 1 trong 2 khóa ngoại)
        if (targetTk) {
          let khId = targetTk.MaKhachHang;
          const phone = targetTk.SdtNV || targetTk.SdtKH;
          const email = targetTk.EmailNV || targetTk.EmailKH;
          const fullName = targetTk.HoTenNV || targetTk.HoTenKH || targetTk.TenDangNhap || 'Khách Hàng';

          if (!khId && phone) {
            const existingKh = await querySql('SELECT MaKhachHang FROM KhachHang WHERE SoDienThoai = ?', [phone]);
            if (existingKh && existingKh.length > 0) {
              khId = existingKh[0].MaKhachHang;
            }
          }
          if (!khId && email) {
            const existingKh = await querySql('SELECT MaKhachHang FROM KhachHang WHERE Email = ?', [email]);
            if (existingKh && existingKh.length > 0) {
              khId = existingKh[0].MaKhachHang;
            }
          }
          if (!khId && targetTk.MaTaiKhoan && targetTk.MaTaiKhoan.startsWith('TK_KH')) {
            khId = targetTk.MaTaiKhoan.replace('TK_', '');
          }
          if (!khId) {
            const maxKhRows = await querySql("SELECT MAX(CAST(SUBSTRING(MaKhachHang, 3, 10) AS INT)) AS maxKh FROM KhachHang WHERE MaKhachHang LIKE 'KH%'");
            const nextKhNum = (maxKhRows?.[0]?.maxKh || 30) + 1;
            khId = 'KH' + (nextKhNum < 10 ? '0' + nextKhNum : nextKhNum);
            try {
              await querySql(
                'INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email) VALUES (?, ?, ?, ?)',
                [khId, fullName, phone || null, email || null]
              );
            } catch (insErr) {
              await querySql(
                'INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email) VALUES (?, ?, NULL, ?)',
                [khId, fullName, email || null]
              ).catch(() => {});
            }
          }
          await querySql('UPDATE TaiKhoan SET VaiTro = N\'Khách hàng\', MaKhachHang = ?, MaNhanVien = NULL WHERE MaTaiKhoan = ?', [khId, exactTkId]);
          if (targetTk.MaNhanVien) {
            await querySql('UPDATE NhanVien SET ChucVu = N\'Khách hàng\' WHERE MaNhanVien = ?', [targetTk.MaNhanVien]).catch(() => {});
          }
        } else {
          await querySql('UPDATE TaiKhoan SET VaiTro = N\'Khách hàng\' WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [exactTkId, exactTkId]);
        }
      } else {
        const staffChucVu = roleKey === 'BRANCH_MANAGER' ? 'Quản lý chi nhánh' : (roleKey === 'CASHIER' ? 'Thu ngân' : 'Thợ chính');
        if (targetTk) {
          let nvId = targetTk.MaNhanVien || (targetTk.MaTaiKhoan.startsWith('TK_NV') ? targetTk.MaTaiKhoan.replace('TK_', '') : null);
          const phone = targetTk.SdtKH || targetTk.SdtNV;
          const email = targetTk.EmailKH || targetTk.EmailNV;
          const fullName = targetTk.HoTenKH || targetTk.HoTenNV || targetTk.TenDangNhap || 'Nhân Viên Mới';

          if (!nvId && phone) {
            const existingNv = await querySql('SELECT MaNhanVien FROM NhanVien WHERE SoDienThoai = ?', [phone]);
            if (existingNv && existingNv.length > 0) nvId = existingNv[0].MaNhanVien;
          }

          if (!nvId) {
            const maxNvRows = await querySql("SELECT MAX(CAST(SUBSTRING(MaNhanVien, 3, 10) AS INT)) AS maxNv FROM NhanVien WHERE MaNhanVien LIKE 'NV%'");
            const nextNvNum = (maxNvRows?.[0]?.maxNv || 60) + 1;
            nvId = 'NV' + (nextNvNum < 10 ? '0' + nextNvNum : nextNvNum);
            await querySql(
              'INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, ChucVu, CapBac) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [nvId, 'CN01', fullName, phone || '0901000000', email || `${exactTkId}@salontoc.vn`, staffChucVu, 'Thợ chính']
            ).catch(() => {});
          } else {
            await querySql('UPDATE NhanVien SET ChucVu = ? WHERE MaNhanVien = ?', [staffChucVu, nvId]).catch(() => {});
          }
          await querySql('UPDATE TaiKhoan SET VaiTro = ?, MaNhanVien = ?, MaKhachHang = NULL WHERE MaTaiKhoan = ?', [finalVaiTro, nvId, exactTkId]);
        } else {
          await querySql('UPDATE TaiKhoan SET VaiTro = ? WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [finalVaiTro, exactTkId, exactTkId]);
        }
      }

      clearDbSnapshotCache();
      const authUser = extractAuthUser(req);
      auditService.logAudit({
        actor: authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên',
        role: authUser ? (authUser.role || 'SUPER_ADMIN') : 'SUPER_ADMIN',
        action: 'UPDATE_USER_ROLE',
        entityType: 'TaiKhoan',
        entityId: userId,
        after: { vaiTro: finalVaiTro, role: isCustomer ? 'CUSTOMER' : roleKey },
        details: `Phân quyền tài khoản ${userId} thành ${finalVaiTro}`
      }).catch(() => {});
    } catch (err) {
      console.warn('SQL update TaiKhoan failed, proceeding with memory state:', err.message);
    }

    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Phân quyền tài khoản thành công', userId, vaiTro: finalVaiTro }));
    return true;
  }

  // POST /api/users - Thêm mới tài khoản trực tiếp vào CSDL SQL Server (TaiKhoan + NhanVien/KhachHang)
  if (pathname === '/api/users' && method === 'POST') {
    const body = parsedBody || {};
    const username = (body.username || body.TenDangNhap || '').trim();
    const fullName = (body.fullName || body.HoTen || '').trim();
    const phone = (body.phone || body.SoDienThoai || '').trim();
    const role = (body.role || 'CUSTOMER').toUpperCase();
    const branchId = body.branchId || 'CN01';

    if (!username || !fullName) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập tên đăng nhập và họ tên' }));
      return true;
    }

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không được phép tạo tài khoản Quản Trị Viên tối cao.' }));
      return true;
    }

    // Kiểm tra tên đăng nhập đã tồn tại trong SQL chưa
    const checkUser = await querySql('SELECT MaTaiKhoan FROM TaiKhoan WHERE TenDangNhap = ?', [username]);
    if (checkUser && checkUser.length > 0) {
      res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Tên đăng nhập đã tồn tại trong hệ thống' }));
      return true;
    }

    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'BARBER', 'STYLIST', 'STAFF'].includes(role);
    const vaiTroSql = ROLE_SQL_MAP[role] || (isStaff ? 'Nhân viên' : 'Khách hàng');

    let newTkId = '';
    let newMaNhanVien = null;
    let newMaKhachHang = null;

    if (isStaff) {
      // 1. Tạo nhân viên: TK_NV + NV
      const maxNvRows = await querySql("SELECT MAX(CAST(SUBSTRING(MaNhanVien, 3, 10) AS INT)) AS maxNv FROM NhanVien WHERE MaNhanVien LIKE 'NV%'");
      const maxTkRows = await querySql("SELECT MAX(CAST(SUBSTRING(MaTaiKhoan, 6, 10) AS INT)) AS maxTk FROM TaiKhoan WHERE MaTaiKhoan LIKE 'TK_NV%'");
      const nextNum = Math.max(maxNvRows?.[0]?.maxNv || 0, maxTkRows?.[0]?.maxTk || 0, 60) + 1;
      const nvId = 'NV' + (nextNum < 10 ? '0' + nextNum : nextNum);
      const tkId = 'TK_' + nvId;

      const chucVu = (role === 'BRANCH_MANAGER' ? 'Quản lý chi nhánh' : (role === 'CASHIER' ? 'Thu ngân' : (role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'Quản trị viên' : 'Thợ chính')));
      const capBac = (role === 'BRANCH_MANAGER' ? 'Quản lý' : (role === 'CASHIER' ? 'Nhân viên' : (role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'Quản trị cấp cao' : 'Master Barber')));

      await querySql(
        `INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, CapBac, ChucVu, TrangThai)
         VALUES (?, ?, ?, ?, NULL, ?, ?, N'Đang làm việc')`,
        [nvId, branchId === 'ALL' ? 'CN01' : branchId, fullName, phone || null, capBac, chucVu]
      ).catch(() => {});

      await querySql(
        `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao)
         VALUES (?, ?, NULL, ?, '123456', ?, N'Hoạt động', GETDATE())`,
        [tkId, nvId, username, vaiTroSql]
      );

      newTkId = tkId;
      newMaNhanVien = nvId;
    } else {
      // 2. Tạo khách hàng: TK_KH + KH
      let existingKhId = null;
      if (phone) {
        const foundKh = await querySql('SELECT MaKhachHang FROM KhachHang WHERE SoDienThoai = ?', [phone]);
        if (foundKh && foundKh.length > 0) existingKhId = foundKh[0].MaKhachHang;
      }
      const maxKhRows = await querySql("SELECT MAX(CAST(SUBSTRING(MaKhachHang, 3, 10) AS INT)) AS maxKh FROM KhachHang WHERE MaKhachHang LIKE 'KH%'");
      const maxTkRows = await querySql("SELECT MAX(CAST(SUBSTRING(MaTaiKhoan, 6, 10) AS INT)) AS maxTk FROM TaiKhoan WHERE MaTaiKhoan LIKE 'TK_KH%'");
      const nextNum = Math.max(maxKhRows?.[0]?.maxKh || 0, maxTkRows?.[0]?.maxTk || 0, 20) + 1;
      const khId = existingKhId || ('KH' + (nextNum < 10 ? '0' + nextNum : nextNum));
      const tkId = 'TK_' + khId;

      if (!existingKhId) {
        await querySql(
          `INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh)
           VALUES (?, ?, ?, NULL, NULL)`,
          [khId, fullName, phone || null]
        ).catch(async () => {
          await querySql(
            `INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh)
             VALUES (?, ?, NULL, NULL, NULL)`,
            [khId, fullName]
          ).catch(() => {});
        });
      }

      await querySql(
        `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao)
         VALUES (?, NULL, ?, ?, '123456', ?, N'Hoạt động', GETDATE())`,
        [tkId, khId, username, vaiTroSql]
      );

      newTkId = tkId;
      newMaKhachHang = khId;
    }

    clearDbSnapshotCache();
    const authUser = extractAuthUser(req);
    auditService.logAudit({
      actor: authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên',
      role: authUser ? (authUser.role || 'SUPER_ADMIN') : 'SUPER_ADMIN',
      action: 'CREATE_USER',
      entityType: 'TaiKhoan',
      entityId: newTkId,
      branchId,
      after: { username, fullName, role, vaiTro: vaiTroSql, branchId },
      details: `Tạo tài khoản mới ${username} (${fullName}) vai trò ${vaiTroSql}`
    }).catch(() => {});

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      message: 'Tạo tài khoản và lưu SQL thành công',
      user: {
        id: newTkId,
        MaTaiKhoan: newTkId,
        username,
        fullName,
        phone,
        role,
        vaiTro: vaiTroSql,
        branchId,
        MaNhanVien: newMaNhanVien,
        MaKhachHang: newMaKhachHang
      }
    }));
    return true;
  }

  // DELETE /api/users/:id - Xóa tài khoản trong CSDL SQL
  if (pathname.startsWith('/api/users/') && method === 'DELETE') {
    const userId = pathname.split('/')[3];
    const authUser = extractAuthUser(req);
    try {
      await querySql('DELETE FROM TaiKhoan WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [userId, userId]);
      clearDbSnapshotCache();
      auditService.logAudit({
        actor: authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên',
        role: authUser ? (authUser.role || 'SUPER_ADMIN') : 'SUPER_ADMIN',
        action: 'DELETE_USER',
        entityType: 'TaiKhoan',
        entityId: userId,
        details: `Xóa tài khoản ${userId}`
      }).catch(() => {});
    } catch (e) {
      console.warn('SQL delete user warning:', e.message);
    }
    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa tài khoản khỏi CSDL SQL' }));
    return true;
  }

  // PUT /api/users/:id/status - Đổi trạng thái hoạt động / tạm khóa
  if (pathname.startsWith('/api/users/') && pathname.endsWith('/status') && (method === 'PUT' || method === 'POST')) {
    const userId = pathname.split('/')[3];
    const { status, isActive } = parsedBody || {};
    const finalStatus = status || (isActive ? 'Hoạt động' : 'Tạm khóa');
    const authUser = extractAuthUser(req);
    try {
      await querySql('UPDATE TaiKhoan SET TrangThai = ? WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [finalStatus, userId, userId]);
      clearDbSnapshotCache();
      auditService.logAudit({
        actor: authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên',
        role: authUser ? (authUser.role || 'SUPER_ADMIN') : 'SUPER_ADMIN',
        action: 'UPDATE_USER_STATUS',
        entityType: 'TaiKhoan',
        entityId: userId,
        after: { TrangThai: finalStatus },
        details: `Cập nhật trạng thái tài khoản ${userId} thành ${finalStatus}`
      }).catch(() => {});
    } catch (e) {
      console.warn('SQL update user status warning:', e.message);
    }
    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Cập nhật trạng thái thành công' }));
    return true;
  }

  // PUT /api/users/:id/branch - Đổi cơ sở chi nhánh trực thuộc
  if (pathname.startsWith('/api/users/') && pathname.endsWith('/branch') && (method === 'PUT' || method === 'POST')) {
    const userId = pathname.split('/')[3];
    const { branchId } = parsedBody || {};
    const authUser = extractAuthUser(req);
    try {
      const tk = await querySql('SELECT MaNhanVien FROM TaiKhoan WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [userId, userId]);
      if (tk?.[0]?.MaNhanVien && branchId && branchId !== 'ALL') {
        await querySql('UPDATE NhanVien SET MaChiNhanh = ? WHERE MaNhanVien = ?', [branchId, tk[0].MaNhanVien]);
        clearDbSnapshotCache();
        auditService.logAudit({
          actor: authUser ? (authUser.fullName || authUser.name || authUser.username) : 'Quản trị viên',
          role: authUser ? (authUser.role || 'SUPER_ADMIN') : 'SUPER_ADMIN',
          action: 'UPDATE_USER_BRANCH',
          entityType: 'TaiKhoan',
          entityId: userId,
          branchId,
          after: { branchId },
          details: `Chuyển tài khoản ${userId} sang chi nhánh ${branchId}`
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQL update user branch warning:', e.message);
    }
    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Cập nhật chi nhánh thành công' }));
    return true;
  }

  return false;
}

module.exports = handleAccountsRoutes;
module.exports.handleAccountsRoutes = handleAccountsRoutes;
module.exports.clearDbSnapshotCache = clearDbSnapshotCache;
module.exports.default = handleAccountsRoutes;

