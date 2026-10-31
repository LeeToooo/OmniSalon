// Kết nối cơ sở dữ liệu SQL Server
const sql = require('msnodesqlv8');
const fs = require('fs');
const path = require('path');

const DB_NAME = process.env.SQL_DATABASE || 'QL_SALON';
const DB_CANDIDATES = [process.env.SQL_DATABASE, 'QL_SALON', 'QL_SALONTOC'].filter(Boolean);
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
          SET TongTien = (SELECT ISNULL(SUM(ThanhTien), 0) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
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

            // Áp dụng các index và view mới ngầm
            applyPerformanceOptimizations();

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

