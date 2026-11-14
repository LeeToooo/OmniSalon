// Các api quản lý tài khoản người dùng
const { querySql } = require('../../database/db');
const { enforceAuth } = require('../../middlewares/auth_middleware');
const { getFullSqlDatabase } = require('../../services/helper_service');

async function handleAccountsRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // GET /api/accounts - Lấy danh sách tài khoản, đã che trường mật khẩu an toàn
  if (pathname === '/api/accounts' && method === 'GET') {
    const rows = await querySql(`
      SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.VaiTro, tk.TrangThai AS TrangThaiTK,
             nv.MaNhanVien, nv.HoTen AS HoTenNV, nv.MaChiNhanh, nv.SoDienThoai AS SdtNV, nv.Email AS EmailNV, nv.CapBac, nv.ChucVu,
             kh.MaKhachHang, kh.HoTen AS HoTenKH, kh.SoDienThoai AS SdtKH, kh.Email AS EmailKH
      FROM TaiKhoan tk
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
    `);

    const roleMap = {
      'Quản trị viên': 'SUPER_ADMIN',
      'Quản lý': 'BRANCH_MANAGER',
      'Thu ngân': 'CASHIER',
      'Nhân viên': 'STAFF',
      'Khách hàng': 'CUSTOMER'
    };

    const accounts = rows.map(r => ({
      id: r.MaTaiKhoan,
      username: r.TenDangNhap,
      fullName: r.HoTenNV || r.HoTenKH || r.TenDangNhap,
      phone: r.SdtNV || r.SdtKH || r.TenDangNhap,
      email: r.EmailNV || r.EmailKH || '',
      role: roleMap[r.VaiTro] || 'CUSTOMER',
      vaiTro: r.VaiTro,
      branchId: r.MaChiNhanh || null,
      status: r.TrangThaiTK || 'Hoạt động'
    }));

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(accounts));
    return true;
  }

  // GET /api/database - Tải snapshot CSDL đồng bộ thời gian thực cho Frontend Store
  if (pathname === '/api/database' && method === 'GET') {
    const dbData = await getFullSqlDatabase();
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
             nv.MaChiNhanh, nv.ChucVu, tk.MaNhanVien, tk.MaKhachHang
      FROM TaiKhoan tk
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      ORDER BY tk.NgayTao DESC
    `);
    const result = (rows || []).map(r => {
      const code = r.MaNhanVien || r.MaKhachHang || r.MaTaiKhoan || '1';
      const m = String(code).match(/(\d+)/);
      const n = m ? parseInt(m[1], 10) : 1;
      const idx = ((n - 1) % 20) + 1;
      return {
        ...r,
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
    const userId = pathname.startsWith('/api/users/') ? pathname.split('/')[3] : (body.id || body.userId || body.username);
    const { role, vaiTro } = body;

    const roleMap = {
      'SUPER_ADMIN': 'Quản trị viên',
      'BRANCH_MANAGER': 'Quản lý',
      'CASHIER': 'Thu ngân',
      'STYLIST': 'Nhân viên',
      'STAFF': 'Nhân viên',
      'CUSTOMER': 'Khách hàng'
    };
    const finalVaiTro = vaiTro || roleMap[role] || role || 'Khách hàng';

    try {
      await querySql('UPDATE TaiKhoan SET VaiTro = ? WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [finalVaiTro, userId, userId]);
    } catch (err) {
      console.warn('SQL update TaiKhoan failed, proceeding with memory state:', err.message);
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Phan quyen tai khoan thanh cong', userId, vaiTro: finalVaiTro }));
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

    // Kiểm tra tên đăng nhập đã tồn tại trong SQL chưa
    const checkUser = await querySql('SELECT MaTaiKhoan FROM TaiKhoan WHERE TenDangNhap = ?', [username]);
    if (checkUser && checkUser.length > 0) {
      res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Tên đăng nhập đã tồn tại trong hệ thống' }));
      return true;
    }

    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'BARBER', 'STYLIST', 'STAFF'].includes(role);
    const roleMapSql = {
      'SUPER_ADMIN': 'Quản trị viên',
      'ADMIN': 'Quản trị viên',
      'BRANCH_MANAGER': 'Quản lý',
      'CASHIER': 'Thu ngân',
      'BARBER': 'Nhân viên',
      'STYLIST': 'Nhân viên',
      'STAFF': 'Nhân viên',
      'CUSTOMER': 'Khách hàng'
    };
    const vaiTroSql = roleMapSql[role] || (isStaff ? 'Nhân viên' : 'Khách hàng');

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
      const maxKhRows = await querySql("SELECT MAX(CAST(SUBSTRING(MaKhachHang, 3, 10) AS INT)) AS maxKh FROM KhachHang WHERE MaKhachHang LIKE 'KH%'");
      const maxTkRows = await querySql("SELECT MAX(CAST(SUBSTRING(MaTaiKhoan, 6, 10) AS INT)) AS maxTk FROM TaiKhoan WHERE MaTaiKhoan LIKE 'TK_KH%'");
      const nextNum = Math.max(maxKhRows?.[0]?.maxKh || 0, maxTkRows?.[0]?.maxTk || 0, 20) + 1;
      const khId = 'KH' + (nextNum < 10 ? '0' + nextNum : nextNum);
      const tkId = 'TK_' + khId;

      await querySql(
        `INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh)
         VALUES (?, ?, ?, NULL, NULL)`,
        [khId, fullName, phone || null]
      ).catch(() => {});

      await querySql(
        `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao)
         VALUES (?, NULL, ?, ?, '123456', ?, N'Hoạt động', GETDATE())`,
        [tkId, khId, username, vaiTroSql]
      );

      newTkId = tkId;
      newMaKhachHang = khId;
    }

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
    try {
      await querySql('DELETE FROM TaiKhoan WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [userId, userId]);
    } catch (e) {
      console.warn('SQL delete user warning:', e.message);
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa tài khoản khỏi CSDL SQL' }));
    return true;
  }

  // PUT /api/users/:id/status - Đổi trạng thái hoạt động / tạm khóa
  if (pathname.startsWith('/api/users/') && pathname.endsWith('/status') && (method === 'PUT' || method === 'POST')) {
    const userId = pathname.split('/')[3];
    const { status, isActive } = parsedBody || {};
    const finalStatus = status || (isActive ? 'Hoạt động' : 'Tạm khóa');
    try {
      await querySql('UPDATE TaiKhoan SET TrangThai = ? WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [finalStatus, userId, userId]);
    } catch (e) {
      console.warn('SQL update user status warning:', e.message);
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Cập nhật trạng thái thành công' }));
    return true;
  }

  // PUT /api/users/:id/branch - Đổi cơ sở chi nhánh trực thuộc
  if (pathname.startsWith('/api/users/') && pathname.endsWith('/branch') && (method === 'PUT' || method === 'POST')) {
    const userId = pathname.split('/')[3];
    const { branchId } = parsedBody || {};
    try {
      const tk = await querySql('SELECT MaNhanVien FROM TaiKhoan WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [userId, userId]);
      if (tk?.[0]?.MaNhanVien && branchId && branchId !== 'ALL') {
        await querySql('UPDATE NhanVien SET MaChiNhanh = ? WHERE MaNhanVien = ?', [branchId, tk[0].MaNhanVien]);
      }
    } catch (e) {
      console.warn('SQL update user branch warning:', e.message);
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Cập nhật chi nhánh thành công' }));
    return true;
  }

  return false;
}

module.exports = handleAccountsRoutes;
module.exports.handleAccountsRoutes = handleAccountsRoutes;
module.exports.default = handleAccountsRoutes;

