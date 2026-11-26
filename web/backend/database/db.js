// Kết nối cơ sở dữ liệu SQL Server
const sql = require('msnodesqlv8');
const fs = require('fs');
const path = require('path');

const DB_NAME = process.env.SQL_DATABASE || 'QL_SALON';
const DB_CANDIDATES = [process.env.SQL_DATABASE || 'QL_SALON'];
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
    if (scOut.includes('MSSQLSERVER')) instances.push('.', 'localhost');
    if (scOut.includes('MSSQL$SQLEXPRESS')) instances.push('.\\SQLEXPRESS', 'localhost\\SQLEXPRESS');
  } catch (err) {
    console.warn('[SQL Discovery] Cannot query Windows services, using default instances:', err.message);
  }
  instances.push('.', 'localhost', '.\\SQLEXPRESS', 'localhost\\SQLEXPRESS', '(local)\\SQLEXPRESS');
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

    // Bảng lưu nhật ký kiểm toán hệ thống (Audit Log) cho cả 6 vai trò
    await querySql(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
      BEGIN
        CREATE TABLE AuditLog (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          LogId VARCHAR(60) NOT NULL UNIQUE,
          Timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
          Actor NVARCHAR(120) NOT NULL,
          Role VARCHAR(50) NOT NULL,
          Action VARCHAR(100) NOT NULL,
          EntityType NVARCHAR(60) NOT NULL,
          EntityId NVARCHAR(100) NOT NULL,
          BranchId VARCHAR(50) NULL,
          BeforeData NVARCHAR(MAX) NULL,
          AfterData NVARCHAR(MAX) NULL,
          Details NVARCHAR(MAX) NULL,
          Ip VARCHAR(50) NULL
        );
        CREATE INDEX IX_AuditLog_Branch_Time ON AuditLog (BranchId, Timestamp DESC);
        CREATE INDEX IX_AuditLog_Role ON AuditLog (Role);
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

    // Đảm bảo có tài khoản Quản trị viên tối cao, Super Admin trong CSDL SQL
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

    // Chuẩn hóa MaTaiKhoan khách hàng theo định dạng TK_ + MaKhachHang (sửa tự động các mã cũ như TK101 -> TK_KH22)
    await querySql(`
      UPDATE TaiKhoan
      SET MaTaiKhoan = 'TK_' + MaKhachHang
      WHERE MaKhachHang IS NOT NULL
        AND (MaTaiKhoan LIKE 'TK[0-9]%' OR MaTaiKhoan NOT LIKE 'TK_KH%')
        AND NOT EXISTS (SELECT 1 FROM TaiKhoan tk2 WHERE tk2.MaTaiKhoan = 'TK_' + TaiKhoan.MaKhachHang);
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

    // Cập nhật View Định giá lô hàng FEFO & khuyến mãi lũy tiến (Mục 23)
    await querySql(`
      CREATE OR ALTER VIEW vw_GiaBanTheoLoHienTai AS
      SELECT 
          ctpn.MaChiTietPhieuNhap,
          pnk.MaChiNhanh,
          cn.TenChiNhanh,
          ctpn.SoLo,
          sp.MaSanPham,
          sp.TenSanPham,
          sp.GiaBan AS GiaNiemYetGoc,
          ctpn.HanSuDung,
          ctpn.SoLuongConLai,
          DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) AS SoNgayConLai,
          CASE 
              WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) <= 0 THEN 100.00
              WHEN ISNULL(qt.PhanTramGiam, 0.00) > 0 AND ISNULL(km_sp.GiaTriGiam, 0.00) > 0 
                  THEN CAST(ISNULL(qt.PhanTramGiam, 0.00) + ISNULL(km_sp.GiaTriGiam, 0.00) - (ISNULL(qt.PhanTramGiam, 0.00) * ISNULL(km_sp.GiaTriGiam, 0.00) / 100.0) AS DECIMAL(5,2))
              WHEN ISNULL(qt.PhanTramGiam, 0.00) > 0 THEN ISNULL(qt.PhanTramGiam, 0.00)
              WHEN ISNULL(km_sp.GiaTriGiam, 0.00) > 0 THEN ISNULL(km_sp.GiaTriGiam, 0.00)
              ELSE 0.00
          END AS PhanTramGiam,
          CAST(
              CASE 
                  WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) <= 0 THEN 0.00
                  ELSE ROUND(sp.GiaBan * (1.0 - ISNULL(qt.PhanTramGiam, 0.00) / 100.0) * (1.0 - ISNULL(km_sp.GiaTriGiam, 0.00) / 100.0), 0)
              END 
          AS DECIMAL(18,2)) AS GiaBanThucTe,
          CASE 
              WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) <= 0 THEN N'Đã hết hạn - Thu hồi'
              ELSE qt.TenQuyTac
          END AS TinhTrangHang
      FROM ChiTietPhieuNhap ctpn
      INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
      INNER JOIN ChiNhanh cn ON pnk.MaChiNhanh = cn.MaChiNhanh
      INNER JOIN SanPham sp ON ctpn.MaSanPham = sp.MaSanPham
      LEFT JOIN QuyTacGiamGiaTheoHan qt 
          ON DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) BETWEEN qt.SoNgayConLaiToiThieu AND qt.SoNgayConLaiToiDa
          AND (qt.TrangThai = N'Đang áp dụng' OR qt.TrangThai = N'Áp dụng')
      OUTER APPLY (
          SELECT TOP 1 km.GiaTriGiam
          FROM KhuyenMai_SanPham km_link
          INNER JOIN KhuyenMai km ON km_link.MaKhuyenMai = km.MaKhuyenMai
          WHERE km_link.MaSanPham = sp.MaSanPham
            AND (km.TrangThai = N'Đang áp dụng' OR km.TrangThai = N'Áp dụng')
            AND CAST(GETDATE() AS DATE) BETWEEN km.NgayBatDau AND km.NgayKetThuc
          ORDER BY km.GiaTriGiam DESC
      ) AS km_sp
      WHERE ctpn.SoLuongConLai > 0;
    `);

    // Stored Procedure trích xuất lô FEFO cho Đơn Hàng
    await querySql(`
      CREATE OR ALTER PROCEDURE sp_ThemChiTietDonHang
          @MaDonHang VARCHAR(20),
          @MaSanPham VARCHAR(20),
          @SoLuong INT
      AS
      BEGIN
          SET NOCOUNT ON;

          DECLARE @MaChiNhanh VARCHAR(20);
          SELECT @MaChiNhanh = MaChiNhanh FROM DonHang WHERE MaDonHang = @MaDonHang;

          IF @MaChiNhanh IS NULL
          BEGIN
              RAISERROR(N'Không tìm thấy đơn hàng hoặc đơn hàng chưa gán chi nhánh.', 16, 1);
              RETURN;
          END

          DECLARE @TongTonKhaDung INT;
          SELECT @TongTonKhaDung = ISNULL(SUM(ctpn.SoLuongConLai), 0)
          FROM ChiTietPhieuNhap ctpn
          INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
          WHERE pnk.MaChiNhanh = @MaChiNhanh
            AND pnk.TrangThai = N'Đã duyệt'
            AND ctpn.MaSanPham = @MaSanPham
            AND ctpn.SoLuongConLai > 0
            AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0;

          IF @TongTonKhaDung < @SoLuong
          BEGIN
              RAISERROR(N'Tồn kho khả dụng tại chi nhánh không đủ đáp ứng số lượng yêu cầu.', 16, 1);
              RETURN;
          END

          DECLARE @GiaGoc DECIMAL(18,2);
          SELECT @GiaGoc = GiaBan FROM SanPham WHERE MaSanPham = @MaSanPham;

          DECLARE cur_FEFO CURSOR LOCAL FAST_FORWARD FOR
              SELECT 
                  ctpn.MaChiTietPhieuNhap, 
                  ctpn.SoLuongConLai,
                  CASE 
                      WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) <= 0 THEN 100.00
                      WHEN ISNULL(qt.PhanTramGiam, 0.00) > 0 AND ISNULL(km_sp.GiaTriGiam, 0.00) > 0 
                          THEN CAST(ISNULL(qt.PhanTramGiam, 0.00) + ISNULL(km_sp.GiaTriGiam, 0.00) - (ISNULL(qt.PhanTramGiam, 0.00) * ISNULL(km_sp.GiaTriGiam, 0.00) / 100.0) AS DECIMAL(5,2))
                      WHEN ISNULL(qt.PhanTramGiam, 0.00) > 0 THEN ISNULL(qt.PhanTramGiam, 0.00)
                      WHEN ISNULL(km_sp.GiaTriGiam, 0.00) > 0 THEN ISNULL(km_sp.GiaTriGiam, 0.00)
                      ELSE 0.00
                  END AS PhanTramGiam
              FROM ChiTietPhieuNhap ctpn
              INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
              LEFT JOIN QuyTacGiamGiaTheoHan qt 
                  ON DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) BETWEEN qt.SoNgayConLaiToiThieu AND qt.SoNgayConLaiToiDa
                  AND (qt.TrangThai = N'Đang áp dụng' OR qt.TrangThai = N'Áp dụng')
              OUTER APPLY (
                  SELECT TOP 1 km.GiaTriGiam
                  FROM KhuyenMai_SanPham km_link
                  INNER JOIN KhuyenMai km ON km_link.MaKhuyenMai = km.MaKhuyenMai
                  WHERE km_link.MaSanPham = @MaSanPham
                    AND (km.TrangThai = N'Đang áp dụng' OR km.TrangThai = N'Áp dụng')
                    AND CAST(GETDATE() AS DATE) BETWEEN km.NgayBatDau AND km.NgayKetThuc
                  ORDER BY km.GiaTriGiam DESC
              ) AS km_sp
              WHERE pnk.MaChiNhanh = @MaChiNhanh
                AND pnk.TrangThai = N'Đã duyệt'
                AND ctpn.MaSanPham = @MaSanPham
                AND ctpn.SoLuongConLai > 0
                AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0
              ORDER BY ctpn.HanSuDung ASC;

          OPEN cur_FEFO;

          DECLARE @MaLo VARCHAR(20);
          DECLARE @SoLuongConLai INT;
          DECLARE @PhanTramGiam DECIMAL(5,2);
          DECLARE @SoLuongCanLay INT = @SoLuong;
          DECLARE @SoLuongTrichXuat INT;
          DECLARE @GiaThucTe DECIMAL(18,2);
          DECLARE @MaChiTietDonHang VARCHAR(30);

          DECLARE @NextNum INT;
          SELECT @NextNum = ISNULL(MAX(TRY_CAST(SUBSTRING(MaChiTietDonHang, 5, 10) AS INT)), 0)
          FROM ChiTietDonHang
          WHERE MaChiTietDonHang LIKE 'CTDH%' AND LEN(MaChiTietDonHang) <= 10;

          FETCH NEXT FROM cur_FEFO INTO @MaLo, @SoLuongConLai, @PhanTramGiam;

          WHILE @@FETCH_STATUS = 0 AND @SoLuongCanLay > 0
          BEGIN
              IF @SoLuongConLai >= @SoLuongCanLay
                  SET @SoLuongTrichXuat = @SoLuongCanLay;
              ELSE
                  SET @SoLuongTrichXuat = @SoLuongConLai;

              SET @GiaThucTe = CAST(ROUND(@GiaGoc * (1.0 - @PhanTramGiam / 100.0), 0) AS DECIMAL(18,2));
              SET @NextNum = @NextNum + 1;
              SET @MaChiTietDonHang = 'CTDH' + CASE WHEN @NextNum < 10 THEN '0' + CAST(@NextNum AS VARCHAR(10)) ELSE CAST(@NextNum AS VARCHAR(10)) END;

              INSERT INTO ChiTietDonHang 
                  (MaChiTietDonHang, MaDonHang, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien)
              VALUES 
                  (@MaChiTietDonHang, @MaDonHang, @MaSanPham, @MaLo, @SoLuongTrichXuat, @GiaGoc, @PhanTramGiam, @GiaThucTe, @GiaThucTe * @SoLuongTrichXuat);

              SET @SoLuongCanLay = @SoLuongCanLay - @SoLuongTrichXuat;

              FETCH NEXT FROM cur_FEFO INTO @MaLo, @SoLuongConLai, @PhanTramGiam;
          END

          CLOSE cur_FEFO;
          DEALLOCATE cur_FEFO;

          UPDATE DonHang 
          SET TongTien = (
              SELECT ISNULL(SUM(ThanhTien), 0) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang
          ) + CASE 
              WHEN HinhThucNhan = N'Tại quầy' OR DiaChiGiaoHang LIKE N'%Nhận tại quầy%' THEN 0 
              ELSE 30000 
          END
          WHERE MaDonHang = @MaDonHang;
      END;
    `);

    // Stored Procedure trích xuất lô FEFO cho Hóa Đơn POS
    await querySql(`
      CREATE OR ALTER PROCEDURE sp_ThemChiTietHoaDonSanPham
          @MaHoaDon VARCHAR(20),
          @MaSanPham VARCHAR(20),
          @SoLuong INT
      AS
      BEGIN
          SET NOCOUNT ON;

          DECLARE @MaChiNhanh VARCHAR(20);
          SELECT @MaChiNhanh = MaChiNhanh FROM HoaDon WHERE MaHoaDon = @MaHoaDon;

          IF @MaChiNhanh IS NULL
          BEGIN
              RAISERROR(N'Không tìm thấy hóa đơn hoặc hóa đơn chưa gán chi nhánh.', 16, 1);
              RETURN;
          END

          DECLARE @TongTonKhaDung INT;
          SELECT @TongTonKhaDung = ISNULL(SUM(ctpn.SoLuongConLai), 0)
          FROM ChiTietPhieuNhap ctpn
          INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
          WHERE pnk.MaChiNhanh = @MaChiNhanh
            AND pnk.TrangThai = N'Đã duyệt'
            AND ctpn.MaSanPham = @MaSanPham
            AND ctpn.SoLuongConLai > 0
            AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0;

          IF @TongTonKhaDung < @SoLuong
          BEGIN
              RAISERROR(N'Tồn kho khả dụng tại chi nhánh không đủ đáp ứng số lượng bán lẻ.', 16, 1);
              RETURN;
          END

          DECLARE @GiaGoc DECIMAL(18,2);
          SELECT @GiaGoc = GiaBan FROM SanPham WHERE MaSanPham = @MaSanPham;

          DECLARE cur_FEFO_HD CURSOR LOCAL FAST_FORWARD FOR
              SELECT 
                  ctpn.MaChiTietPhieuNhap, 
                  ctpn.SoLuongConLai,
                  CASE 
                      WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) <= 0 THEN 100.00
                      WHEN ISNULL(qt.PhanTramGiam, 0.00) > 0 AND ISNULL(km_sp.GiaTriGiam, 0.00) > 0 
                          THEN CAST(ISNULL(qt.PhanTramGiam, 0.00) + ISNULL(km_sp.GiaTriGiam, 0.00) - (ISNULL(qt.PhanTramGiam, 0.00) * ISNULL(km_sp.GiaTriGiam, 0.00) / 100.0) AS DECIMAL(5,2))
                      WHEN ISNULL(qt.PhanTramGiam, 0.00) > 0 THEN ISNULL(qt.PhanTramGiam, 0.00)
                      WHEN ISNULL(km_sp.GiaTriGiam, 0.00) > 0 THEN ISNULL(km_sp.GiaTriGiam, 0.00)
                      ELSE 0.00
                  END AS PhanTramGiam
              FROM ChiTietPhieuNhap ctpn
              INNER JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
              LEFT JOIN QuyTacGiamGiaTheoHan qt 
                  ON DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) BETWEEN qt.SoNgayConLaiToiThieu AND qt.SoNgayConLaiToiDa
                  AND (qt.TrangThai = N'Đang áp dụng' OR qt.TrangThai = N'Áp dụng')
              OUTER APPLY (
                  SELECT TOP 1 km.GiaTriGiam
                  FROM KhuyenMai_SanPham km_link
                  INNER JOIN KhuyenMai km ON km_link.MaKhuyenMai = km.MaKhuyenMai
                  WHERE km_link.MaSanPham = @MaSanPham
                    AND (km.TrangThai = N'Đang áp dụng' OR km.TrangThai = N'Áp dụng')
                    AND CAST(GETDATE() AS DATE) BETWEEN km.NgayBatDau AND km.NgayKetThuc
                  ORDER BY km.GiaTriGiam DESC
              ) AS km_sp
              WHERE pnk.MaChiNhanh = @MaChiNhanh
                AND pnk.TrangThai = N'Đã duyệt'
                AND ctpn.MaSanPham = @MaSanPham
                AND ctpn.SoLuongConLai > 0
                AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0
              ORDER BY ctpn.HanSuDung ASC;

          OPEN cur_FEFO_HD;

          DECLARE @MaLo VARCHAR(20);
          DECLARE @SoLuongConLai INT;
          DECLARE @PhanTramGiam DECIMAL(5,2);
          DECLARE @SoLuongCanLay INT = @SoLuong;
          DECLARE @SoLuongTrichXuat INT;
          DECLARE @GiaThucTe DECIMAL(18,2);
          DECLARE @MaChiTietHDSanPham VARCHAR(30);

          DECLARE @NextNumHD INT;
          SELECT @NextNumHD = ISNULL(MAX(TRY_CAST(SUBSTRING(MaChiTietHDSanPham, 5, 10) AS INT)), 0)
          FROM ChiTietHoaDon_SanPham
          WHERE MaChiTietHDSanPham LIKE 'CTHD%' AND LEN(MaChiTietHDSanPham) <= 10;

          FETCH NEXT FROM cur_FEFO_HD INTO @MaLo, @SoLuongConLai, @PhanTramGiam;

          WHILE @@FETCH_STATUS = 0 AND @SoLuongCanLay > 0
          BEGIN
              IF @SoLuongConLai >= @SoLuongCanLay
                  SET @SoLuongTrichXuat = @SoLuongCanLay;
              ELSE
                  SET @SoLuongTrichXuat = @SoLuongConLai;

              SET @GiaThucTe = CAST(ROUND(@GiaGoc * (1.0 - @PhanTramGiam / 100.0), 0) AS DECIMAL(18,2));
              SET @NextNumHD = @NextNumHD + 1;
              SET @MaChiTietHDSanPham = 'CTHD' + CASE WHEN @NextNumHD < 10 THEN '0' + CAST(@NextNumHD AS VARCHAR(10)) ELSE CAST(@NextNumHD AS VARCHAR(10)) END;

              INSERT INTO ChiTietHoaDon_SanPham 
                  (MaChiTietHDSanPham, MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien)
              VALUES 
                  (@MaChiTietHDSanPham, @MaHoaDon, @MaSanPham, @MaLo, @SoLuongTrichXuat, @GiaGoc, @PhanTramGiam, @GiaThucTe, @GiaThucTe * @SoLuongTrichXuat);

              SET @SoLuongCanLay = @SoLuongCanLay - @SoLuongTrichXuat;

              FETCH NEXT FROM cur_FEFO_HD INTO @MaLo, @SoLuongConLai, @PhanTramGiam;
          END

          CLOSE cur_FEFO_HD;
          DEALLOCATE cur_FEFO_HD;

          UPDATE HoaDon 
          SET TongTien = (
              ISNULL((SELECT SUM(ThanhTien) FROM ChiTietHoaDon_DichVu WHERE MaHoaDon = @MaHoaDon), 0) +
              ISNULL((SELECT SUM(ThanhTien) FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = @MaHoaDon), 0)
          )
          WHERE MaHoaDon = @MaHoaDon;
      END;
    `);

    // Đảm bảo trigger tự hoàn tồn kho khi đơn hàng chuyển sang Đã hủy luôn tồn tại trên SQL Server
    await querySql(`
      CREATE OR ALTER TRIGGER trg_DonHang_HuyDon_HoanTonKho
      ON DonHang
      AFTER UPDATE
      AS
      BEGIN
          SET NOCOUNT ON;
          IF EXISTS (
              SELECT 1 FROM inserted i
              JOIN deleted d ON i.MaDonHang = d.MaDonHang
              WHERE i.TrangThai = N'Đã hủy' AND d.TrangThai <> N'Đã hủy'
          )
          BEGIN
              ;WITH CancelledQty AS (
                  SELECT ctdh.MaChiTietPhieuNhap, SUM(ctdh.SoLuong) AS SoLuongHoan
                  FROM ChiTietDonHang ctdh
                  JOIN inserted i ON ctdh.MaDonHang = i.MaDonHang
                  JOIN deleted d ON i.MaDonHang = d.MaDonHang
                  WHERE i.TrangThai = N'Đã hủy' AND d.TrangThai <> N'Đã hủy'
                    AND ctdh.MaChiTietPhieuNhap IS NOT NULL
                  GROUP BY ctdh.MaChiTietPhieuNhap
              )
              UPDATE ctpn
              SET ctpn.SoLuongConLai = CASE
                  WHEN ctpn.SoLuongConLai + cq.SoLuongHoan > ctpn.SoLuong THEN ctpn.SoLuong
                  ELSE ctpn.SoLuongConLai + cq.SoLuongHoan
              END
              FROM ChiTietPhieuNhap ctpn
              JOIN CancelledQty cq ON ctpn.MaChiTietPhieuNhap = cq.MaChiTietPhieuNhap;

              UPDATE tk
              SET tk.SoLuongTon = tk.SoLuongTon + agg.SoLuongHoan,
                  tk.NgayCapNhat = GETDATE()
              FROM TonKho tk
              JOIN (
                  SELECT ctdh.MaSanPham, i.MaChiNhanh, SUM(ctdh.SoLuong) AS SoLuongHoan
                  FROM ChiTietDonHang ctdh
                  JOIN inserted i ON ctdh.MaDonHang = i.MaDonHang
                  JOIN deleted d ON i.MaDonHang = d.MaDonHang
                  WHERE i.TrangThai = N'Đã hủy' AND d.TrangThai <> N'Đã hủy'
                  GROUP BY ctdh.MaSanPham, i.MaChiNhanh
              ) AS agg ON tk.MaSanPham = agg.MaSanPham AND tk.MaChiNhanh = agg.MaChiNhanh;
          END
      END;
    `);

    // Mở rộng bảng DanhGia hỗ trợ đánh giá trực tiếp Sản Phẩm / Dịch Vụ & Phản hồi Admin (tách riêng batch SQL Server)
    await querySql(`
      IF COL_LENGTH('DanhGia', 'MaSanPham') IS NULL
          ALTER TABLE DanhGia ADD MaSanPham VARCHAR(20) NULL;
      IF COL_LENGTH('DanhGia', 'MaDichVu') IS NULL
          ALTER TABLE DanhGia ADD MaDichVu VARCHAR(20) NULL;
      IF COL_LENGTH('DanhGia', 'PhanHoiAdmin') IS NULL
          ALTER TABLE DanhGia ADD PhanHoiAdmin NVARCHAR(500) NULL;
      IF COL_LENGTH('DanhGia', 'NgayPhanHoi') IS NULL
          ALTER TABLE DanhGia ADD NgayPhanHoi DATETIME NULL;
    `);

    await querySql(`
      IF OBJECT_ID('FK_DanhGia_SanPham', 'F') IS NULL AND OBJECT_ID('SanPham', 'U') IS NOT NULL
          ALTER TABLE DanhGia ADD CONSTRAINT FK_DanhGia_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham);
      IF OBJECT_ID('FK_DanhGia_DichVu', 'F') IS NULL AND OBJECT_ID('DichVu', 'U') IS NOT NULL
          ALTER TABLE DanhGia ADD CONSTRAINT FK_DanhGia_DichVu FOREIGN KEY (MaDichVu) REFERENCES DichVu(MaDichVu);

      IF OBJECT_ID('CK_DanhGia_DoiTuong', 'C') IS NOT NULL
          ALTER TABLE DanhGia DROP CONSTRAINT CK_DanhGia_DoiTuong;
      ALTER TABLE DanhGia ADD CONSTRAINT CK_DanhGia_DoiTuong CHECK (
          MaLichHen IS NOT NULL OR MaDonHang IS NOT NULL OR MaSanPham IS NOT NULL OR MaDichVu IS NOT NULL
      );
    `);

    // Tự động dọn dẹp các đơn hàng quá hạn qua 12h đêm chưa hoàn tất sang Đã hủy
    await querySql(`
      UPDATE DonHang
      SET TrangThai = N'Đã hủy',
          GhiChu = ISNULL(GhiChu, N'') + N' [Hệ Thống: Tự động hủy qua 12h đêm do khách không đến nhận hàng]'
      WHERE CONVERT(VARCHAR(10), NgayDat, 120) < CONVERT(VARCHAR(10), GETDATE(), 120)
        AND TrangThai IN (
          N'Chờ xử lý', N'Chờ xác nhận', N'Chờ nhận hàng', N'Chờ thanh toán',
          N'Đang xử lý', N'Đang chuẩn bị', N'Đang đóng gói',
          'Pending', 'pending', 'Processing', 'processing'
        )
        AND TrangThai NOT IN (N'Đang giao hàng', N'Đã giao', N'Hoàn tất', N'Hoàn thành', N'Đã hủy', 'Delivering', 'Completed', 'Delivered', 'Cancelled');
    `).catch(() => {});

    // Đồng bộ hóa đơn & giao dịch thanh toán cho các đơn hàng đã hoàn tất (bao gồm DH02, DH04, DH05)
    const completedUnpaidOrders = await querySql(`
      SELECT dh.MaDonHang, dh.MaKhachHang, dh.MaChiNhanh, dh.NgayDat, dh.TongTien
      FROM DonHang dh
      WHERE (dh.TrangThai IN (N'Hoàn tất', N'Đã giao', N'Đã nhận tại quầy') OR dh.MaDonHang IN ('DH02', 'DH04', 'DH05'))
        AND dh.TrangThai <> N'Đã hủy'
        AND (
          NOT EXISTS (SELECT 1 FROM HoaDon hd WHERE hd.MaDonHang = dh.MaDonHang AND hd.TrangThai = N'Đã thanh toán')
          OR NOT EXISTS (
            SELECT 1 FROM ThanhToan tt
            JOIN HoaDon hd2 ON tt.MaHoaDon = hd2.MaHoaDon
            WHERE hd2.MaDonHang = dh.MaDonHang AND tt.TrangThai = N'Thành công'
          )
        )
    `).catch(() => []);

    for (const ord of (completedUnpaidOrders || [])) {
      try {
        let hdRows = await querySql('SELECT TOP 1 MaHoaDon FROM HoaDon WHERE MaDonHang = ?', [ord.MaDonHang]);
        let hdId = hdRows && hdRows[0] ? hdRows[0].MaHoaDon : null;
        if (hdId) {
          await querySql("UPDATE HoaDon SET TrangThai = N'Đã thanh toán' WHERE MaHoaDon = ?", [hdId]);
        } else {
          const maxHd = await querySql("SELECT MAX(TRY_CAST(SUBSTRING(MaHoaDon, 3, 20) AS INT)) AS maxNum FROM HoaDon WHERE MaHoaDon LIKE 'HD[0-9]%'");
          let nextHd = ((maxHd && maxHd[0] && maxHd[0].maxNum) ? parseInt(maxHd[0].maxNum, 10) : 10) + 1;
          hdId = 'HD' + (nextHd < 10 ? '0' + nextHd : nextHd);
          const invNo = `HD-SYNC-${ord.MaDonHang}`;
          await querySql(
            `INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon)
             VALUES (?, ?, NULL, ?, ?, ISNULL(?, GETDATE()), ?, N'Đã thanh toán', ?)`,
            [hdId, ord.MaKhachHang, ord.MaDonHang, ord.MaChiNhanh || 'CN01', ord.NgayDat, ord.TongTien || 0, invNo]
          );
        }

        if (hdId) {
          const existingHdItems = await querySql('SELECT TOP 1 1 FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = ?', [hdId]);
          if (!existingHdItems || existingHdItems.length === 0) {
            const oItems = await querySql('SELECT MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien FROM ChiTietDonHang WHERE MaDonHang = ?', [ord.MaDonHang]);
            for (let i = 0; i < (oItems || []).length; i++) {
              const it = oItems[i];
              const cthdId = `CTHDS_${ord.MaDonHang}_${i + 1}`.slice(0, 30);
              await querySql(
                `INSERT INTO ChiTietHoaDon_SanPham (MaChiTietHDSanPham, MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [cthdId, hdId, it.MaSanPham, it.MaChiTietPhieuNhap || null, Number(it.SoLuong || 1), Number(it.DonGiaGoc || it.DonGiaThucTe || 0), Number(it.PhanTramGiamGia || 0), Number(it.DonGiaThucTe || 0), Number(it.ThanhTien || 0)]
              ).catch(() => {});
            }
          }

          const hasTt = await querySql("SELECT TOP 1 MaThanhToan FROM ThanhToan WHERE MaHoaDon = ? AND TrangThai = N'Thành công'", [hdId]);
          if (!hasTt || hasTt.length === 0) {
            const maxTt = await querySql("SELECT MAX(TRY_CAST(SUBSTRING(MaThanhToan, 3, 20) AS INT)) AS maxNum FROM ThanhToan WHERE MaThanhToan LIKE 'TT[0-9]%'");
            let nextTt = ((maxTt && maxTt[0] && maxTt[0].maxNum) ? parseInt(maxTt[0].maxNum, 10) : 10) + 1;
            const ttId = 'TT' + (nextTt < 10 ? '0' + nextTt : nextTt);
            const cashiers = await querySql("SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaChiNhanh = ? AND ChucVu = N'Thu ngân'", [ord.MaChiNhanh || 'CN01']).catch(() => []);
            const staffId = (cashiers && cashiers[0]) ? cashiers[0].MaNhanVien : 'NV61';
            await querySql(
              `INSERT INTO ThanhToan (MaThanhToan, MaHoaDon, MaNhanVien, SoTien, PhuongThuc, ThoiGianThanhToan, TrangThai, MaGiaoDich)
               VALUES (?, ?, ?, ?, N'Tiền mặt', ISNULL(?, GETDATE()), N'Thành công', ?)`,
              [ttId, hdId, staffId, ord.TongTien || 0, ord.NgayDat, `SYNC_${ord.MaDonHang}`]
            ).catch(() => {});
          }
        }
      } catch (syncErr) {
        console.warn('[Order Payment Sync]', ord.MaDonHang, syncErr.message);
      }
    }

    console.log('[DB MIGRATION] Đã áp dụng các Index và View tối ưu hiệu năng thành công!');
  } catch (err) {
    console.warn('[DB MIGRATION WARNING]', err.message);
  }
}

async function initDbConnection() {
  console.log(`[SQL CONNECT] Đang dò tìm SQL Server và kết nối tới CSDL (${DB_CANDIDATES.join(' / ')})...`);
  for (const srv of SERVER_INSTANCES) {
    for (const drv of DRIVERS) {
      for (const targetDb of DB_CANDIDATES) {
        const connStr = `Server=${srv};Database=${targetDb};Trusted_Connection=yes;Driver={${drv}};TrustServerCertificate=yes;LoginTimeout=2;Connection Timeout=2;`;
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
            activeDbConfig = { server: srv, driver: drv, connStr, database: targetDb };
            console.log(`[SQL OK] Đã liên kết trực tiếp thành công!`);
            console.log(`  - Server:   ${srv}`);
            console.log(`  - Database: ${targetDb}`);
            console.log(`  - Driver:   ${drv}`);

            // Áp dụng các bảng, index và view mới đảm bảo schema hoàn tất trước khi xử lý nghiệp vụ
            await applyPerformanceOptimizations();

            return activeDbConfig;
          }
        } catch (_) { }
      }
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

