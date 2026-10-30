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
             nv.MaChiNhanh, nv.ChucVu
      FROM TaiKhoan tk
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      ORDER BY tk.NgayTao DESC
    `);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
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

  return false;
}

module.exports = handleAccountsRoutes;
module.exports.handleAccountsRoutes = handleAccountsRoutes;
module.exports.default = handleAccountsRoutes;

