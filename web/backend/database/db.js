// Kết nối cơ sở dữ liệu SQL Server
const sql = require('msnodesqlv8');
const fs = require('fs');
const path = require('path');

const DB_NAME = process.env.SQL_DATABASE || 'QL_SALONTOC';
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const SQL_FILE = fs.existsSync(path.join(__dirname, 'QL_SALON.sql'))
  ? path.join(__dirname, 'QL_SALON.sql')
  : (fs.existsSync(path.join(ROOT_DIR, 'web', 'backend', 'QL_SALON.sql'))
    ? path.join(ROOT_DIR, 'web', 'backend', 'QL_SALON.sql')
    : path.join(ROOT_DIR, 'QL_SALON.sql'));

const DRIVERS = [
  'ODBC Driver 17 for SQL Server',
  'SQL Server',
  'ODBC Driver 18 for SQL Server'
];

function getDynamicServerInstances() {
  const instances = [];
  if (process.env.SQL_SERVER) instances.push(process.env.SQL_SERVER);
  try {
    const scOut = require('child_process').execSync(
      'powershell -NoProfile -Command "Get-Service -Name *MSSQL* | Select-Object -ExpandProperty Name"',
      { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', timeout: 3000 }
    );
    if (scOut.includes('MSSQL$SQLEXPRESS')) instances.push('.\\SQLEXPRESS', 'localhost\\SQLEXPRESS');
    if (scOut.includes('MSSQLSERVER')) instances.push('.', 'localhost');
  } catch (_) { }
  instances.push('.\\SQLEXPRESS', 'localhost\\SQLEXPRESS', '.', 'localhost', '(local)\\SQLEXPRESS');
  return [...new Set(instances)];
}

const SERVER_INSTANCES = getDynamicServerInstances();
let activeDbConfig = null;

function querySql(queryStr, params = []) {
  return new Promise((resolve, reject) => {
    if (!activeDbConfig) {
      return reject(new Error('Chưa thiết lập kết nối tới cơ sở dữ liệu SQL Server.'));
    }
    sql.query(activeDbConfig.connStr, queryStr, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

/**
 * Tự động tạo bảng OTP và các Index tối ưu hiệu năng nếu chưa có
 */
async function applyPerformanceOptimizations() {
  if (!activeDbConfig) return;
  try {
    // Bảng lưu mã xác thực OTP
    await querySql(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'XacThucOTP')
      BEGIN
        CREATE TABLE XacThucOTP (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Identifier NVARCHAR(255) NOT NULL,
          MaOTP VARCHAR(10) NOT NULL,
          HetHanLuc DATETIME2 NOT NULL,
          TrangThai NVARCHAR(50) DEFAULT N'Chờ xác thực',
          NgayTao DATETIME2 DEFAULT GETDATE()
        );
        CREATE INDEX IX_XacThucOTP_Target ON XacThucOTP (Identifier, MaOTP, HetHanLuc);
      END
    `);

    // Index cho Lịch Hẹn
    await querySql(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LichHen_NgayHen_NhanVien')
      BEGIN
        CREATE INDEX IX_LichHen_NgayHen_NhanVien 
        ON LichHen(NgayHen, MaNhanVien, MaChiNhanh) 
        INCLUDE (GioBatDau, GioKetThuc, TrangThai);
      END
    `);

    // Index cho Hóa Đơn & Doanh Thu
    await querySql(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HoaDon_NgayLap_ChiNhanh')
      BEGIN
        CREATE INDEX IX_HoaDon_NgayLap_ChiNhanh 
        ON HoaDon(NgayLap, MaChiNhanh, TrangThai) 
        INCLUDE (TongTien);
      END
    `);

    // Index cho Tài Khoản đăng nhập
    await querySql(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaiKhoan_TenDangNhap')
      BEGIN
        CREATE INDEX IX_TaiKhoan_TenDangNhap 
        ON TaiKhoan(TenDangNhap) 
        INCLUDE (MatKhau, VaiTro, TrangThai);
      END
    `);

    // Đảm bảo có tài khoản Quản trị viên tối cao (Super Admin) trong CSDL SQL
    await querySql(`
      IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNhanVien = 'NV00')
      BEGIN
        INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, CapBac, ChucVu, TrangThai)
        VALUES ('NV00', 'CN01', N'Lê Minh Hoàng', '19008899', 'admin@omnisalon.vn', N'Chủ Tịch HĐQT', N'Quản trị viên', N'Đang làm việc');
      END;
      IF NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE TenDangNhap = 'admin')
      BEGIN
        INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao)
        VALUES ('TK_ADMIN', 'NV00', NULL, 'admin', 'admin123', N'Quản trị viên', N'Hoạt động', GETDATE());
      END;
    `);

    // Views tối ưu truy vấn Lịch hẹn hôm nay và Doanh thu
    await querySql(`
      CREATE OR ALTER VIEW vw_LichHenHomNay AS
      SELECT 
          lh.MaLichHen,
          lh.MaKhachHang,
          kh.HoTen AS TenKhachHang,
          kh.SoDienThoai AS SdtKhachHang,
          lh.MaNhanVien,
          nv.HoTen AS TenNhanVien,
          lh.MaChiNhanh,
          cn.TenChiNhanh,
          CONVERT(VARCHAR(10), lh.NgayHen, 120) AS NgayHen,
          CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau,
          CONVERT(VARCHAR(8), lh.GioKetThuc) AS GioKetThuc,
          lh.TrangThai,
          lh.TongTien,
          lh.TienCoc,
          lh.GhiChu
      FROM LichHen lh
      LEFT JOIN KhachHang kh ON lh.MaKhachHang = kh.MaKhachHang
      LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
      LEFT JOIN ChiNhanh cn ON lh.MaChiNhanh = cn.MaChiNhanh
      WHERE CAST(lh.NgayHen AS DATE) = CAST(GETDATE() AS DATE);
    `);

    await querySql(`
      CREATE OR ALTER VIEW vw_DoanhThuTheoChiNhanh AS
      SELECT 
          hd.MaChiNhanh,
          cn.TenChiNhanh,
          COUNT(hd.MaHoaDon) AS TongSoHoaDon,
          ISNULL(SUM(hd.TongTien), 0) AS TongDoanhThu,
          CAST(hd.NgayLap AS DATE) AS NgayGiaoDich
      FROM HoaDon hd
      LEFT JOIN ChiNhanh cn ON hd.MaChiNhanh = cn.MaChiNhanh
      WHERE hd.TrangThai = N'Đã thanh toán'
      GROUP BY hd.MaChiNhanh, cn.TenChiNhanh, CAST(hd.NgayLap AS DATE);
    `);

    console.log('[DB MIGRATION] Đã áp dụng các Index và View tối ưu hiệu năng thành công!');
  } catch (err) {
    console.warn('[DB MIGRATION WARNING]', err.message);
  }
}

async function initDbConnection() {
  console.log(`[SQL CONNECT] Đang dò tìm SQL Server và kết nối tới CSDL [${DB_NAME}]...`);
  for (const srv of SERVER_INSTANCES) {
    for (const drv of DRIVERS) {
      const connStr = `Server=${srv};Database=${DB_NAME};Trusted_Connection=yes;Driver={${drv}};TrustServerCertificate=yes;LoginTimeout=2;Connection Timeout=2;`;
      try {
        const rows = await new Promise((resolve, reject) => {
          let done = false;
          const t = setTimeout(() => {
            if (!done) { done = true; reject(new Error('Probe timeout')); }
          }, 2500);
          sql.query(connStr, 'SELECT 1 AS ok;', (err, res) => {
            if (done) return;
            done = true;
            clearTimeout(t);
            if (err) reject(err);
            else resolve(res);
          });
        });
        if (rows && rows.length > 0) {
          activeDbConfig = { server: srv, driver: drv, connStr, database: DB_NAME };
          console.log(`[SQL OK] Đã liên kết trực tiếp thành công!`);
          console.log(`  - Server:   ${srv}`);
          console.log(`  - Database: ${DB_NAME}`);
          console.log(`  - Driver:   ${drv}`);

          // Áp dụng các index và view mới ngầm
          applyPerformanceOptimizations();

          return activeDbConfig;
        }
      } catch (_) { }
    }
  }

  console.error(`[SQL LỖI] Không thể kết nối tới cơ sở dữ liệu [${DB_NAME}] trên SQL Server Express!`);
  return null;
}

function getActiveDbConfig() {
  return activeDbConfig;
}

module.exports = {
  DB_NAME,
  SQL_FILE,
  querySql,
  initDbConnection,
  getActiveDbConfig,
  applyPerformanceOptimizations
};

