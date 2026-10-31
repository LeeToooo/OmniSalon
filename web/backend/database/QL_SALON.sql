USE master;
GO

IF DB_ID(N'QL_SALON') IS NOT NULL
BEGIN
    ALTER DATABASE QL_SALON SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QL_SALON;
END
GO

CREATE DATABASE QL_SALON;
GO

USE QL_SALON;
GO

-- =========================================================================
-- 1. BẢNG CƠ SỞ (CORE SCHEMA)
-- =========================================================================

CREATE TABLE ChiNhanh
(
    MaChiNhanh VARCHAR(20) PRIMARY KEY,
    TenChiNhanh NVARCHAR(100) NOT NULL,
    DiaChi NVARCHAR(200),
    SoDienThoai VARCHAR(15),
    GioMoCua TIME,
    GioDongCua TIME,
	HinhAnh NVARCHAR(300),
    TrangThai NVARCHAR(20) DEFAULT N'Hoạt động'
);
GO

CREATE TABLE NhanVien
(
    MaNhanVien VARCHAR(20) PRIMARY KEY,
    MaChiNhanh VARCHAR(20) NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(15),
    Email VARCHAR(100),
    CapBac NVARCHAR(50),
    ChucVu NVARCHAR(50),
    TrangThai NVARCHAR(20) DEFAULT N'Đang làm việc',
    CONSTRAINT FK_NhanVien_ChiNhanh FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh)
);
GO

CREATE TABLE KhachHang
(
    MaKhachHang VARCHAR(20) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(15) UNIQUE,
    Email VARCHAR(100),
    NgaySinh DATE
);
GO

CREATE TABLE TaiKhoan
(
    MaTaiKhoan VARCHAR(20) PRIMARY KEY,
    MaNhanVien VARCHAR(20) NULL,
    MaKhachHang VARCHAR(20) NULL,
    TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    MatKhau VARCHAR(255) NOT NULL,
    VaiTro NVARCHAR(30) NOT NULL,
    TrangThai NVARCHAR(20) DEFAULT N'Hoạt động',
    NgayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_TaiKhoan_NhanVien FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien),
    CONSTRAINT FK_TaiKhoan_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT CK_TaiKhoan_ChuSoHuu CHECK (
        (MaNhanVien IS NOT NULL AND MaKhachHang IS NULL) OR
        (MaNhanVien IS NULL AND MaKhachHang IS NOT NULL)
    )
);
GO

CREATE TABLE ThongBao
(
    MaThongBao VARCHAR(20) PRIMARY KEY,
    MaTaiKhoan VARCHAR(20) NULL,
    MaKhachHang VARCHAR(20) NULL,
    TieuDe NVARCHAR(200),
    NoiDung NVARCHAR(500),
    LoaiThongBao NVARCHAR(50),
    ThoiGianGui DATETIME DEFAULT GETDATE(),
    TrangThaiDoc BIT DEFAULT 0,
    CONSTRAINT FK_ThongBao_TaiKhoan FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan),
    CONSTRAINT FK_ThongBao_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT CK_ThongBao_NguoiNhan CHECK (
        (MaTaiKhoan IS NOT NULL AND MaKhachHang IS NULL) OR
        (MaTaiKhoan IS NULL AND MaKhachHang IS NOT NULL)
    )
);
GO

CREATE TABLE CaLamViec
(
    MaCa VARCHAR(20) PRIMARY KEY,
    MaNhanVien VARCHAR(20) NOT NULL,
    NgayLam DATE NOT NULL,
    GioBatDau TIME NOT NULL,
    GioKetThuc TIME NOT NULL,
    TrangThai NVARCHAR(20) DEFAULT N'Chưa diễn ra',
    CONSTRAINT FK_CaLamViec_NhanVien FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien)
);
GO

CREATE TABLE DichVu
(
    MaDichVu VARCHAR(20) PRIMARY KEY,
    TenDichVu NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(500),
    ThoiLuong INT,
    Gia DECIMAL(18,2) NOT NULL DEFAULT 0,
    HinhAnh NVARCHAR(300),
    TrangThai NVARCHAR(20) DEFAULT N'Kinh doanh',
    NgayApDung DATE DEFAULT CAST(GETDATE() AS DATE)
);
GO

CREATE TABLE ComboDichVu
(
    MaCombo VARCHAR(20) PRIMARY KEY,
    TenCombo NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(500),
    GiaCombo DECIMAL(18,2) NOT NULL DEFAULT 0,
    ThoiLuong INT,
    HinhAnh NVARCHAR(300),
    TrangThai NVARCHAR(20) DEFAULT N'Đang kinh doanh'
);
GO

CREATE TABLE ChiTietComboDichVu
(
    MaCombo VARCHAR(20) NOT NULL,
    MaDichVu VARCHAR(20) NOT NULL,
    SoLuong INT DEFAULT 1 CHECK (SoLuong > 0),
    CONSTRAINT PK_ChiTietComboDichVu PRIMARY KEY (MaCombo, MaDichVu),
    CONSTRAINT FK_ChiTietCombo_Combo FOREIGN KEY (MaCombo) REFERENCES ComboDichVu(MaCombo) ON DELETE CASCADE,
    CONSTRAINT FK_ChiTietCombo_DichVu FOREIGN KEY (MaDichVu) REFERENCES DichVu(MaDichVu)
);
GO

CREATE TABLE DanhMucSanPham
(
    MaDanhMuc VARCHAR(20) PRIMARY KEY,
    TenDanhMuc NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(200),
    TrangThai NVARCHAR(20) DEFAULT N'Hoạt động'
);
GO

CREATE TABLE NhaCungCap
(
    MaNhaCungCap VARCHAR(20) PRIMARY KEY,
    TenNhaCungCap NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(15),
    Email VARCHAR(100),
    DiaChi NVARCHAR(200),
    TrangThai NVARCHAR(20) DEFAULT N'Hoạt động'
);
GO

CREATE TABLE SanPham
(
    MaSanPham VARCHAR(20) PRIMARY KEY,
    MaDanhMuc VARCHAR(20) NOT NULL,
    MaNhaCungCap VARCHAR(20) NOT NULL,
    TenSanPham NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(500),
    HinhAnh NVARCHAR(300),
    GiaNhap DECIMAL(18,2) NOT NULL DEFAULT 0,
    GiaBan DECIMAL(18,2) NOT NULL DEFAULT 0,
    TrangThaiKinhDoanh NVARCHAR(20) DEFAULT N'Đang bán',
    CONSTRAINT FK_SanPham_DanhMuc FOREIGN KEY (MaDanhMuc) REFERENCES DanhMucSanPham(MaDanhMuc),
    CONSTRAINT FK_SanPham_NhaCungCap FOREIGN KEY (MaNhaCungCap) REFERENCES NhaCungCap(MaNhaCungCap)
);
GO

CREATE TABLE QuyTacGiamGiaTheoHan
(
    MaQuyTac VARCHAR(20) PRIMARY KEY,
    TenQuyTac NVARCHAR(100) NOT NULL,
    SoNgayConLaiToiThieu INT NOT NULL,
    SoNgayConLaiToiDa INT NOT NULL,
    PhanTramGiam DECIMAL(5,2) NOT NULL CHECK (PhanTramGiam BETWEEN 0 AND 100),
    TrangThai NVARCHAR(20) DEFAULT N'Đang áp dụng',
    CONSTRAINT CK_QuyTacGiamGia_Khoang CHECK (SoNgayConLaiToiThieu <= SoNgayConLaiToiDa)
);
GO

CREATE TABLE PhieuNhapKho
(
    MaPhieuNhap VARCHAR(20) PRIMARY KEY,
    MaChiNhanh VARCHAR(20) NOT NULL,
    MaNhanVien VARCHAR(20) NOT NULL,
    MaNguoiDuyet VARCHAR(20) NULL,
    MaNhaCungCap VARCHAR(20) NOT NULL,
    NgayLap DATETIME DEFAULT GETDATE(),
    LyDoTuChoi NVARCHAR(200),
    TongTien DECIMAL(18,2) DEFAULT 0,
    NgayDuyet DATETIME,
    TrangThai NVARCHAR(30) DEFAULT N'Chờ duyệt',
    CONSTRAINT FK_PhieuNhapKho_ChiNhanh FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh),
    CONSTRAINT FK_PhieuNhapKho_NguoiLap FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien),
    CONSTRAINT FK_PhieuNhapKho_NguoiDuyet FOREIGN KEY (MaNguoiDuyet) REFERENCES NhanVien(MaNhanVien),
    CONSTRAINT FK_PhieuNhapKho_NhaCungCap FOREIGN KEY (MaNhaCungCap) REFERENCES NhaCungCap(MaNhaCungCap)
);
GO

CREATE TABLE ChiTietPhieuNhap
(
    MaChiTietPhieuNhap VARCHAR(20) PRIMARY KEY,
    MaPhieuNhap VARCHAR(20) NOT NULL,
    MaSanPham VARCHAR(20) NOT NULL,
    SoLo NVARCHAR(50) NOT NULL,
    HanSuDung DATE NOT NULL,
    SoLuong INT NOT NULL CHECK (SoLuong > 0),
    SoLuongConLai INT NOT NULL,
    DonGiaNhap DECIMAL(18,2) NOT NULL,
    ThanhTien DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_ChiTietPhieuNhap_PhieuNhap FOREIGN KEY (MaPhieuNhap) REFERENCES PhieuNhapKho(MaPhieuNhap),
    CONSTRAINT FK_ChiTietPhieuNhap_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham),
    CONSTRAINT CK_ChiTietPhieuNhap_SoLuongConLai CHECK (SoLuongConLai >= 0 AND SoLuongConLai <= SoLuong)
);
GO

CREATE TABLE TonKho
(
    MaSanPham VARCHAR(20) NOT NULL,
    MaChiNhanh VARCHAR(20) NOT NULL,
    SoLuongTon INT NOT NULL DEFAULT 0,
    MucCanhBao INT NOT NULL DEFAULT 10,
    NgayCapNhat DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_TonKho PRIMARY KEY (MaSanPham, MaChiNhanh),
    CONSTRAINT FK_TonKho_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham),
    CONSTRAINT FK_TonKho_ChiNhanh FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh),
    CONSTRAINT CK_TonKho_SoLuongTon CHECK (SoLuongTon >= 0)
);
GO

CREATE TABLE KhuyenMai
(
    MaKhuyenMai VARCHAR(20) PRIMARY KEY,
    TenKhuyenMai NVARCHAR(100) NOT NULL,
    HinhThuc NVARCHAR(50),
    GiaTriGiam DECIMAL(18,2) NOT NULL DEFAULT 0,
    DoiTuongApDung NVARCHAR(50),
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL,
    TrangThai NVARCHAR(20) DEFAULT N'Đang áp dụng'
);
GO

CREATE TABLE KhuyenMai_DichVu
(
    MaKhuyenMai VARCHAR(20) NOT NULL,
    MaDichVu VARCHAR(20) NOT NULL,
    CONSTRAINT PK_KhuyenMai_DichVu PRIMARY KEY (MaKhuyenMai, MaDichVu),
    CONSTRAINT FK_KhuyenMaiDichVu_KhuyenMai FOREIGN KEY (MaKhuyenMai) REFERENCES KhuyenMai(MaKhuyenMai),
    CONSTRAINT FK_KhuyenMaiDichVu_DichVu FOREIGN KEY (MaDichVu) REFERENCES DichVu(MaDichVu)
);
GO

CREATE TABLE KhuyenMai_SanPham
(
    MaKhuyenMai VARCHAR(20) NOT NULL,
    MaSanPham VARCHAR(20) NOT NULL,
    CONSTRAINT PK_KhuyenMai_SanPham PRIMARY KEY (MaKhuyenMai, MaSanPham),
    CONSTRAINT FK_KhuyenMaiSanPham_KhuyenMai FOREIGN KEY (MaKhuyenMai) REFERENCES KhuyenMai(MaKhuyenMai),
    CONSTRAINT FK_KhuyenMaiSanPham_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham)
);
GO

CREATE TABLE LichHen
(
    MaLichHen VARCHAR(20) PRIMARY KEY,
    MaKhachHang VARCHAR(20) NOT NULL,
    MaNhanVien VARCHAR(20) NOT NULL,
    MaChiNhanh VARCHAR(20) NOT NULL,
    NgayHen DATE NOT NULL,
    GioBatDau TIME,
    GioKetThuc TIME,
    TrangThai NVARCHAR(30) DEFAULT N'Chờ xác nhận',
    TongTien DECIMAL(18,2) DEFAULT 0,
    TienCoc DECIMAL(18,2) DEFAULT 0,
    GhiChu NVARCHAR(200),
    LyDoHuy NVARCHAR(200),
    CONSTRAINT FK_LichHen_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT FK_LichHen_NhanVien FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien),
    CONSTRAINT FK_LichHen_ChiNhanh FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh)
);
GO


CREATE TABLE ChiTietLichHen
(
    MaChiTietLichHen VARCHAR(30) PRIMARY KEY,
    MaLichHen VARCHAR(20) NOT NULL,
    MaDichVu VARCHAR(20) NULL,
    MaCombo VARCHAR(20) NULL,
    SoLuong INT DEFAULT 1 CHECK (SoLuong > 0),
    DonGia DECIMAL(18,2) NOT NULL,
    ThanhTien DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_ChiTietLichHen_LichHen FOREIGN KEY (MaLichHen) REFERENCES LichHen(MaLichHen),
    CONSTRAINT FK_ChiTietLichHen_DichVu FOREIGN KEY (MaDichVu) REFERENCES DichVu(MaDichVu),
    CONSTRAINT FK_ChiTietLichHen_Combo FOREIGN KEY (MaCombo) REFERENCES ComboDichVu(MaCombo),
    CONSTRAINT CK_ChiTietLichHen_LoaiDichVu CHECK (
        (MaDichVu IS NOT NULL AND MaCombo IS NULL) OR
        (MaDichVu IS NULL AND MaCombo IS NOT NULL)
    )
);
GO

CREATE TABLE DonHang
(
    MaDonHang VARCHAR(20) PRIMARY KEY,
    MaKhachHang VARCHAR(20) NOT NULL,
    MaChiNhanh VARCHAR(20) NOT NULL,
    NgayDat DATETIME DEFAULT GETDATE(),
    TongTien DECIMAL(18,2) DEFAULT 0,
    DiaChiGiaoHang NVARCHAR(200),
    HinhThucNhan NVARCHAR(30),
    TrangThai NVARCHAR(30) DEFAULT N'Chờ xử lý',
    GhiChu NVARCHAR(200),
    CONSTRAINT FK_DonHang_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT FK_DonHang_ChiNhanh FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh)
);
GO

CREATE TABLE ChiTietDonHang
(
    MaChiTietDonHang VARCHAR(30) PRIMARY KEY,
    MaDonHang VARCHAR(20) NOT NULL,
    MaSanPham VARCHAR(20) NOT NULL,
    MaChiTietPhieuNhap VARCHAR(20) NOT NULL,
    SoLuong INT NOT NULL CHECK (SoLuong > 0),
    DonGiaGoc DECIMAL(18,2) NOT NULL,
    PhanTramGiamGia DECIMAL(5,2) DEFAULT 0,
    DonGiaThucTe DECIMAL(18,2) NOT NULL,
    ThanhTien DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_ChiTietDonHang_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT FK_ChiTietDonHang_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham),
    CONSTRAINT FK_ChiTietDonHang_LoNhap FOREIGN KEY (MaChiTietPhieuNhap) REFERENCES ChiTietPhieuNhap(MaChiTietPhieuNhap)
);
GO

CREATE TABLE HoaDon
(
    MaHoaDon VARCHAR(20) PRIMARY KEY,
    MaKhachHang VARCHAR(20) NOT NULL,
    MaLichHen VARCHAR(20) NULL,
    MaDonHang VARCHAR(20) NULL,
    MaChiNhanh VARCHAR(20) NOT NULL,
    NgayLap DATETIME DEFAULT GETDATE(),
    TongTien DECIMAL(18,2) DEFAULT 0,
    TrangThai NVARCHAR(30) DEFAULT N'Chưa thanh toán',
    MaSoHoaDon VARCHAR(30),
    CONSTRAINT FK_HoaDon_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT FK_HoaDon_LichHen FOREIGN KEY (MaLichHen) REFERENCES LichHen(MaLichHen),
    CONSTRAINT FK_HoaDon_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT FK_HoaDon_ChiNhanh FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh),
    CONSTRAINT CK_HoaDon_Nguon CHECK (
        (MaLichHen IS NOT NULL AND MaDonHang IS NULL) OR
        (MaLichHen IS NULL AND MaDonHang IS NOT NULL) OR
        (MaLichHen IS NULL AND MaDonHang IS NULL)
    )
);
GO

CREATE TABLE ChiTietHoaDon_DichVu
(
    MaChiTietHDDV VARCHAR(30) PRIMARY KEY,
    MaHoaDon VARCHAR(20) NOT NULL,
    MaDichVu VARCHAR(20) NULL,
    MaCombo VARCHAR(20) NULL,
    SoLuong INT NOT NULL CHECK (SoLuong > 0),
    DonGia DECIMAL(18,2) NOT NULL,
    ThanhTien DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_ChiTietHoaDonDichVu_HoaDon FOREIGN KEY (MaHoaDon) REFERENCES HoaDon(MaHoaDon),
    CONSTRAINT FK_ChiTietHoaDonDichVu_DichVu FOREIGN KEY (MaDichVu) REFERENCES DichVu(MaDichVu),
    CONSTRAINT FK_ChiTietHoaDonDichVu_Combo FOREIGN KEY (MaCombo) REFERENCES ComboDichVu(MaCombo),
    CONSTRAINT CK_ChiTietHoaDonDichVu_Loai CHECK (
        (MaDichVu IS NOT NULL AND MaCombo IS NULL) OR
        (MaDichVu IS NULL AND MaCombo IS NOT NULL)
    )
);
GO

CREATE TABLE ChiTietHoaDon_SanPham
(
    MaChiTietHDSanPham VARCHAR(30) PRIMARY KEY,
    MaHoaDon VARCHAR(20) NOT NULL,
    MaSanPham VARCHAR(20) NOT NULL,
    MaChiTietPhieuNhap VARCHAR(20) NOT NULL,
    SoLuong INT NOT NULL CHECK (SoLuong > 0),
    DonGiaGoc DECIMAL(18,2) NOT NULL,
    PhanTramGiamGia DECIMAL(5,2) DEFAULT 0,
    DonGiaThucTe DECIMAL(18,2) NOT NULL,
    ThanhTien DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_ChiTietHoaDonSanPham_HoaDon FOREIGN KEY (MaHoaDon) REFERENCES HoaDon(MaHoaDon),
    CONSTRAINT FK_ChiTietHoaDonSanPham_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham),
    CONSTRAINT FK_ChiTietHoaDon_LoNhap FOREIGN KEY (MaChiTietPhieuNhap) REFERENCES ChiTietPhieuNhap(MaChiTietPhieuNhap)
);
GO

CREATE TABLE ThanhToan
(
    MaThanhToan VARCHAR(20) PRIMARY KEY,
    MaHoaDon VARCHAR(20) NOT NULL,
    MaNhanVien VARCHAR(20) NOT NULL,
    SoTien DECIMAL(18,2) NOT NULL,
    PhuongThuc NVARCHAR(30),
    ThoiGianThanhToan DATETIME DEFAULT GETDATE(),
    TrangThai NVARCHAR(30) DEFAULT N'Thành công',
    MaGiaoDich VARCHAR(50),
    CONSTRAINT FK_ThanhToan_HoaDon FOREIGN KEY (MaHoaDon) REFERENCES HoaDon(MaHoaDon),
    CONSTRAINT FK_ThanhToan_NhanVien FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien)
);
GO

CREATE TABLE DanhGia
(
    MaDanhGia VARCHAR(20) PRIMARY KEY,
    MaKhachHang VARCHAR(20) NOT NULL,
    MaLichHen VARCHAR(20) NULL,
    MaDonHang VARCHAR(20) NULL,
    SoSao INT CHECK (SoSao BETWEEN 1 AND 5),
    NoiDung NVARCHAR(500),
    HinhAnh NVARCHAR(200),
    NgayDanhGia DATETIME DEFAULT GETDATE(),
    TrangThai NVARCHAR(20) DEFAULT N'Hiển thị',
    CoFlag BIT DEFAULT 0,
    CONSTRAINT FK_DanhGia_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT FK_DanhGia_LichHen FOREIGN KEY (MaLichHen) REFERENCES LichHen(MaLichHen),
    CONSTRAINT FK_DanhGia_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT CK_DanhGia_DoiTuong CHECK (
        (MaLichHen IS NOT NULL AND MaDonHang IS NULL) OR
        (MaLichHen IS NULL AND MaDonHang IS NOT NULL)
    )
);
GO

-- =========================================================================
CREATE TABLE XacThucOTP
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Identifier NVARCHAR(255) NOT NULL,
    MaOTP VARCHAR(10) NOT NULL,
    HetHanLuc DATETIME2 NOT NULL,
    TrangThai NVARCHAR(50) DEFAULT N'Chờ xác thực',
    NgayTao DATETIME2 DEFAULT GETDATE()
);
GO

-- 2. INDEX & SEQUENCES
-- =========================================================================

CREATE INDEX IX_ChiTietPhieuNhap_FEFO 
ON ChiTietPhieuNhap(MaSanPham, HanSuDung) 
INCLUDE (SoLuongConLai, MaPhieuNhap) 
WHERE SoLuongConLai > 0;
GO

CREATE SEQUENCE seq_ChiTietDonHang AS INT START WITH 1 INCREMENT BY 1;
GO
CREATE SEQUENCE seq_ChiTietHoaDonSanPham AS INT START WITH 1 INCREMENT BY 1;
GO

-- =========================================================================
CREATE INDEX IX_LichHen_NgayHen_NhanVien 
ON LichHen(NgayHen, MaNhanVien, MaChiNhanh) 
INCLUDE (GioBatDau, GioKetThuc, TrangThai);
GO

CREATE INDEX IX_DonHang_KhachHang_NgayDat 
ON DonHang(MaKhachHang, NgayDat DESC) 
INCLUDE (TongTien, TrangThai);
GO

CREATE INDEX IX_HoaDon_NgayLap_ChiNhanh 
ON HoaDon(NgayLap, MaChiNhanh, TrangThai) 
INCLUDE (TongTien);
GO

CREATE INDEX IX_TaiKhoan_TenDangNhap 
ON TaiKhoan(TenDangNhap) 
INCLUDE (MatKhau, VaiTro, TrangThai);
GO

CREATE INDEX IX_TonKho_ChiNhanh_SanPham 
ON TonKho(MaChiNhanh, MaSanPham) 
INCLUDE (SoLuongTon, MucCanhBao);
GO

CREATE INDEX IX_XacThucOTP_Target 
ON XacThucOTP(Identifier, MaOTP, HetHanLuc);
GO

-- 3. VIEWS
-- =========================================================================

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
    AND qt.TrangThai = N'Đang áp dụng'
OUTER APPLY (
    SELECT TOP 1 km.GiaTriGiam
    FROM KhuyenMai_SanPham km_link
    INNER JOIN KhuyenMai km ON km_link.MaKhuyenMai = km.MaKhuyenMai
    WHERE km_link.MaSanPham = sp.MaSanPham
      AND km.TrangThai = N'Đang áp dụng'
      AND CAST(GETDATE() AS DATE) BETWEEN km.NgayBatDau AND km.NgayKetThuc
    ORDER BY km.GiaTriGiam DESC
) AS km_sp
WHERE ctpn.SoLuongConLai > 0;
GO

CREATE OR ALTER VIEW vw_SanPhamCanhBaoTonThap AS
SELECT 
    tk.MaSanPham, 
    sp.TenSanPham, 
    tk.MaChiNhanh, 
    cn.TenChiNhanh, 
    tk.SoLuongTon, 
    tk.MucCanhBao
FROM TonKho tk
INNER JOIN SanPham sp ON sp.MaSanPham = tk.MaSanPham
INNER JOIN ChiNhanh cn ON cn.MaChiNhanh = tk.MaChiNhanh
WHERE tk.SoLuongTon <= tk.MucCanhBao;
GO

-- =========================================================================
-- 4. TRIGGERS
-- =========================================================================

CREATE OR ALTER TRIGGER trg_PhieuNhapKho_CapNhatTonKho
ON PhieuNhapKho
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM inserted i
        JOIN deleted d ON i.MaPhieuNhap = d.MaPhieuNhap
        WHERE i.TrangThai = N'Đã duyệt' AND d.TrangThai <> N'Đã duyệt'
    )
        RETURN;

    MERGE TonKho AS tk
    USING (
        SELECT ctpn.MaSanPham, i.MaChiNhanh, SUM(ctpn.SoLuong) AS SoLuongNhap
        FROM inserted i
        JOIN deleted d ON i.MaPhieuNhap = d.MaPhieuNhap
        JOIN ChiTietPhieuNhap ctpn ON ctpn.MaPhieuNhap = i.MaPhieuNhap
        WHERE i.TrangThai = N'Đã duyệt' AND d.TrangThai <> N'Đã duyệt'
        GROUP BY ctpn.MaSanPham, i.MaChiNhanh
    ) AS src
    ON tk.MaSanPham = src.MaSanPham AND tk.MaChiNhanh = src.MaChiNhanh
    WHEN MATCHED THEN
        UPDATE SET tk.SoLuongTon = tk.SoLuongTon + src.SoLuongNhap,
                   tk.NgayCapNhat = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (MaSanPham, MaChiNhanh, SoLuongTon, MucCanhBao, NgayCapNhat)
        VALUES (src.MaSanPham, src.MaChiNhanh, src.SoLuongNhap, 10, GETDATE());
END;
GO

CREATE OR ALTER TRIGGER trg_ChiTietDonHang_TruTonKho
ON ChiTietDonHang
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ctpn
    SET ctpn.SoLuongConLai = ctpn.SoLuongConLai - i.SoLuong
    FROM ChiTietPhieuNhap ctpn
    JOIN inserted i ON i.MaChiTietPhieuNhap = ctpn.MaChiTietPhieuNhap;

    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon - agg.SoLuongBan,
        tk.NgayCapNhat = GETDATE()
    FROM TonKho tk
    JOIN (
        SELECT i.MaSanPham, dh.MaChiNhanh, SUM(i.SoLuong) AS SoLuongBan
        FROM inserted i
        JOIN DonHang dh ON dh.MaDonHang = i.MaDonHang
        GROUP BY i.MaSanPham, dh.MaChiNhanh
    ) AS agg ON tk.MaSanPham = agg.MaSanPham AND tk.MaChiNhanh = agg.MaChiNhanh;
END;
GO

CREATE OR ALTER TRIGGER trg_ChiTietHoaDonSanPham_TruTonKho
ON ChiTietHoaDon_SanPham
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH DirectSales AS (
        SELECT i.*, hd.MaChiNhanh
        FROM inserted i
        JOIN HoaDon hd ON hd.MaHoaDon = i.MaHoaDon
        WHERE hd.MaDonHang IS NULL
    )
    UPDATE ctpn
    SET ctpn.SoLuongConLai = ctpn.SoLuongConLai - ds.SoLuong
    FROM ChiTietPhieuNhap ctpn
    JOIN DirectSales ds ON ds.MaChiTietPhieuNhap = ctpn.MaChiTietPhieuNhap;

    ;WITH DirectSales AS (
        SELECT i.*, hd.MaChiNhanh
        FROM inserted i
        JOIN HoaDon hd ON hd.MaHoaDon = i.MaHoaDon
        WHERE hd.MaDonHang IS NULL
    )
    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon - agg.SoLuongBan,
        tk.NgayCapNhat = GETDATE()
    FROM TonKho tk
    JOIN (
        SELECT ds.MaSanPham, ds.MaChiNhanh, SUM(ds.SoLuong) AS SoLuongBan
        FROM DirectSales ds
        GROUP BY ds.MaSanPham, ds.MaChiNhanh
    ) AS agg ON tk.MaSanPham = agg.MaSanPham AND tk.MaChiNhanh = agg.MaChiNhanh;
END;
GO

-- Trigger tự động cập nhật Ngày Áp Dụng (NgayApDung) của Dịch vụ khi thay đổi giá (Gia)
CREATE OR ALTER TRIGGER trg_DichVu_CapNhatNgayApDung
ON DichVu
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(Gia)
    BEGIN
        UPDATE d
        SET NgayApDung = CAST(GETDATE() AS DATE)
        FROM DichVu d
        INNER JOIN inserted i ON d.MaDichVu = i.MaDichVu
        INNER JOIN deleted del ON d.MaDichVu = del.MaDichVu
        WHERE (i.Gia <> del.Gia) OR (del.Gia IS NULL AND i.Gia IS NOT NULL);
    END
END;
GO

-- =========================================================================
-- 5. PROCEDURES FEFO ĐA LÔ THEO CHI NHÁNH
-- =========================================================================

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
              AND km.TrangThai = N'Đang áp dụng'
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
GO

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
              AND km.TrangThai = N'Đang áp dụng'
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
    SET TongTien = ISNULL((SELECT SUM(ThanhTien) FROM ChiTietHoaDon_DichVu WHERE MaHoaDon = @MaHoaDon), 0) +
                   ISNULL((SELECT SUM(ThanhTien) FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = @MaHoaDon), 0)
    WHERE MaHoaDon = @MaHoaDon;
END;
GO

-- =========================================================================
-- 6. DỮ LIỆU DANH MỤC, CHI NHÁNH & NHÀ CUNG CẤP CHUẨN KẾT NỐI
-- =========================================================================

-- Quy tắc giảm giá theo hạn dùng
INSERT INTO QuyTacGiamGiaTheoHan (MaQuyTac, TenQuyTac, SoNgayConLaiToiThieu, SoNgayConLaiToiDa, PhanTramGiam, TrangThai) VALUES
('QT01', N'Còn trên 6 tháng (Hạn an toàn)', 181, 99999,   0.00, N'Đang áp dụng'),
('QT02', N'Còn từ 3 đến 6 tháng (Xả kho nhẹ)', 91,   180, 20.00, N'Đang áp dụng'),
('QT03', N'Còn từ 1 đến 3 tháng (Cận hạn)',     31,    90, 40.00, N'Đang áp dụng'),
('QT04', N'Còn dưới 1 tháng (Cận hạn gấp)',      1,    30, 70.00, N'Đang áp dụng'),
('QT05', N'Đã hết hạn (Thu hồi tiêu hủy)',   -9999,     0, 100.00, N'Đang áp dụng');
GO

-- =========================================================================
-- 20 CHI NHÁNH CHUỖI OMNI SALON BARBER (CN01 -> CN20) KÈM HÌNH ẢNH
-- =========================================================================
INSERT INTO ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, GioMoCua, GioDongCua, HinhAnh, TrangThai) VALUES
('CN01', N'Omni Salon Barber Q1 - Bến Thành',           N'120 Lê Lợi, P. Bến Thành, Q.1, TP.HCM',           '0901111001', '08:30:00', '21:30:00', 'ChiNhanh_Omni/CN1.jpg',  N'Hoạt động'),
('CN02', N'Omni Salon Barber Tân Bình - Cộng Hòa',      N'45 Cộng Hòa, P.4, Q.Tân Bình, TP.HCM',            '0901111002', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN2.jpg',  N'Hoạt động'),
('CN03', N'Omni Salon Barber Bình Thạnh - Điện Biên Phủ',N'88 Điện Biên Phủ, P.15, Q.Bình Thạnh, TP.HCM',   '0901111003', '09:00:00', '22:00:00', 'ChiNhanh_Omni/CN3.jpg',  N'Hoạt động'),
('CN04', N'Omni Salon Barber Q3 - Nam Kỳ Khởi Nghĩa',    N'215 Nam Kỳ Khởi Nghĩa, P.7, Q.3, TP.HCM',         '0901111004', '08:30:00', '21:30:00', 'ChiNhanh_Omni/CN4.jpg',  N'Hoạt động'),
('CN05', N'Omni Salon Barber Q5 - Trần Hưng Đạo',       N'105 Trần Hưng Đạo, P.6, Q.5, TP.HCM',             '0901111005', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN5.jpg',  N'Hoạt động'),
('CN06', N'Omni Salon Barber Q7 - Nguyễn Thị Thập',      N'480 Nguyễn Thị Thập, P.Tân Quy, Q.7, TP.HCM',     '0901111006', '09:00:00', '21:30:00', 'ChiNhanh_Omni/CN6.jpg',  N'Hoạt động'),
('CN07', N'Omni Salon Barber Q10 - 3 Tháng 2',          N'324 Ba Tháng Hai, P.12, Q.10, TP.HCM',            '0901111007', '08:30:00', '21:30:00', 'ChiNhanh_Omni/CN7.jpg',  N'Hoạt động'),
('CN08', N'Omni Salon Barber Phú Nhuận - Phan Xích Long',N'150 Phan Xích Long, P.2, Q.Phú Nhuận, TP.HCM',    '0901111008', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN8.jpg',  N'Hoạt động'),
('CN09', N'Omni Salon Barber Gò Vấp - Quang Trung',     N'68 Quang Trung, P.10, Q.Gò Vấp, TP.HCM',          '0901111009', '09:00:00', '21:30:00', 'ChiNhanh_Omni/CN9.jpg',  N'Hoạt động'),
('CN10', N'Omni Salon Barber Thủ Đức - Võ Văn Ngân',    N'98 Võ Văn Ngân, P.Linh Chiểu, TP.Thủ Đức, TP.HCM', '0901111010', '08:30:00', '21:30:00', 'ChiNhanh_Omni/CN10.jpg', N'Hoạt động'),
('CN11', N'Omni Salon Barber Thảo Điền - Xuân Thủy',    N'55 Xuân Thủy, P.Thảo Điền, TP.Thủ Đức, TP.HCM',   '0901111011', '09:00:00', '22:00:00', 'ChiNhanh_Omni/CN11.jpg', N'Hoạt động'),
('CN12', N'Omni Salon Barber Q4 - Hoàng Diệu',          N'12 Hoàng Diệu, P.9, Q.4, TP.HCM',                 '0901111012', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN12.jpg', N'Hoạt động'),
('CN13', N'Omni Salon Barber Q6 - Hậu Giang',           N'260 Hậu Giang, P.4, Q.6, TP.HCM',                 '0901111013', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN13.jpg', N'Hoạt động'),
('CN14', N'Omni Salon Barber Q8 - Phạm Hùng',           N'180 Phạm Hùng, P.5, Q.8, TP.HCM',                 '0901111014', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN14.jpg', N'Hoạt động'),
('CN15', N'Omni Salon Barber Q11 - Ông Ích Khiêm',      N'85 Ông Ích Khiêm, P.10, Q.11, TP.HCM',            '0901111015', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN15.jpg', N'Hoạt động'),
('CN16', N'Omni Salon Barber Q12 - Lê Văn Khương',      N'45 Lê Văn Khương, P.Thới An, Q.12, TP.HCM',       '0901111016', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN16.jpg', N'Hoạt động'),
('CN17', N'Omni Salon Barber Tân Phú - Lũy Bán Bích',   N'72 Lũy Bán Bích, P.Tân Thới Hòa, Q.Tân Phú, TP.HCM','0901111017','08:30:00', '21:30:00', 'ChiNhanh_Omni/CN17.jpg', N'Hoạt động'),
('CN18', N'Omni Salon Barber Bình Tân - Tên Lửa',       N'110 Tên Lửa, P.Bình Trị Đông B, Q.Bình Tân, TP.HCM','0901111018','08:30:00', '21:00:00', 'ChiNhanh_Omni/CN18.jpg', N'Hoạt động'),
('CN19', N'Omni Salon Barber Bình Chánh - Quốc Lộ 50',   N'35 Quốc lộ 50, X.Bình Hưng, H.Bình Chánh, TP.HCM', '0901111019', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN19.jpg', N'Hoạt động'),
('CN20', N'Omni Salon Barber Hóc Môn - Lý Thường Kiệt',  N'52 Lý Thường Kiệt, TT.Hóc Môn, H.Hóc Môn, TP.HCM','0901111020', '08:30:00', '21:00:00', 'ChiNhanh_Omni/CN20.jpg', N'Hoạt động');
GO


-- Kiểm tra lại kết quả
SELECT MaChiNhanh, TenChiNhanh, DiaChi FROM ChiNhanh;
GO

INSERT INTO DanhMucSanPham (MaDanhMuc, TenDanhMuc, MoTa, TrangThai) VALUES
('DM01', N'Sáp vuốt tóc - Clay & Wax', N'Các sản phẩm clay, wax và sản phẩm tạo kiểu giữ nếp cho tóc nam.', N'Hoạt động'),
('DM02', N'Pomade cổ điển & hiện đại', N'Các dòng pomade, grease, paste và clay pomade dành cho tạo kiểu tóc nam.', N'Hoạt động'),
('DM03', N'Xịt tạo phồng & Pre-Styling', N'Sản phẩm pre-styling, grooming tonic, texture spray và sản phẩm hỗ trợ tạo phồng.', N'Hoạt động'),
('DM04', N'Gôm xịt giữ nếp tóc nam', N'Các sản phẩm hairspray, finishing spray và xịt giữ nếp tóc nam.', N'Hoạt động'),
('DM05', N'Dầu gội & xả nam - trị gàu, kiểm dầu', N'Dầu gội, dầu xả và sản phẩm làm sạch/chăm sóc da đầu cho nam.', N'Hoạt động'),
('DM06', N'Bột tạo phồng', N'Các sản phẩm bột tạo phồng, tạo texture và tăng độ bám cho tóc.', N'Hoạt động'),
('DM07', N'Thuốc uốn lạnh & ép side tóc nam', N'Các sản phẩm uốn lạnh và hỗ trợ ép side tóc nam.', N'Hoạt động'),
('DM08', N'Chăm sóc râu - Beard Care', N'Các sản phẩm làm sạch, dưỡng và tạo kiểu râu nam.', N'Hoạt động'),
('DM09', N'Dụng cụ tạo kiểu nam', N'Lược, bàn chải, máy sấy và các dụng cụ hỗ trợ tạo kiểu tóc nam.', N'Hoạt động');

INSERT INTO NhaCungCap (MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, DiaChi, TrangThai) VALUES
('NCC01', N'Công ty TNHH Phân Phối Mỹ Phẩm L’Oréal Việt Nam', '02838221199', 'order@loreal.vn', N'Tầng 10, Bitexco Financial Tower, Quận 1, TP.HCM', N'Hoạt động'),
('NCC02', N'Schwarzkopf Professional Vietnam (Henkel VN)', '02839102233', 'pro-salon@schwarzkopf.vn', N'Tòa nhà Deutsches Haus, 33 Lê Duẩn, Quận 1, TP.HCM', N'Hoạt động'),
('NCC03', N'Công ty Cổ phần Davines Sài Gòn', '02838334455', 'sales@davines.vn', N'15 Trương Định, Phường Võ Thị Sáu, Quận 3, TP.HCM', N'Hoạt động'),
('NCC04', N'Công ty TNHH Mỹ Phẩm Barber Sài Gòn (Độc quyền Reuzel & Uppercut)', '02837445566', 'distributor@barbersaigon.com', N'102 Thảo Điền, TP. Thủ Đức, TP.HCM', N'Hoạt động'),
('NCC05', N'Classic Grooming Vietnam (Nhập khẩu Hanz de Fuko, Blumaan, By Vilain)', '0909888999', 'contact@classicgrooming.vn', N'71 Cao Thắng, Phường 3, Quận 3, TP.HCM', N'Hoạt động'),
('NCC06', N'Kerasys Homme Official Vietnam (Tập đoàn Aekyung)', '02838992211', 'kerasys@aekyung.vn', N'Tầng 5, Pearl Plaza, 561A Điện Biên Phủ, Bình Thạnh, TP.HCM', N'Hoạt động'),
('NCC07', N'Thế Giới Phụ Liệu Tóc & Salon Nam Á', '02838667788', 'phulieutoc@nama.vn', N'240 Cách Mạng Tháng Tám, Quận 10, TP.HCM', N'Hoạt động');

-- 10 Dịch vụ chuyên nghiệp dành riêng cho nam giới
INSERT INTO DichVu (MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, HinhAnh, TrangThai, NgayApDung) VALUES
('DV01', N'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', 
 N'Tư vấn dáng mặt, cắt fade hiện đại, cạo viền sắc nét và vuốt sáp/pomade cao cấp.', 
 45, 120000, 'DichVu_Men/DV1.jpg', N'Kinh doanh', '2026-01-01'),

('DV02', N'Cắt & Ép Side tóc nam (Down Perm Combo)', 
 N'Cắt form chuẩn kết hợp ép xẹp tóc mai và gáy bị vểnh chỉa, giữ nếp 1-2 tháng.', 
 60, 250000, 'DichVu_Men/DV2.jpg', N'Kinh doanh', '2026-01-01'),

('DV03', N'Uốn tóc xoăn Texture / Ziczac phồng Hàn Quốc', 
 N'Uốn lạnh tạo lọn sóng phồng tự nhiên, giúp tóc bồng bềnh dễ sấy tạo kiểu.', 
 90, 650000, 'DichVu_Men/DV3.jpg', N'Kinh doanh', '2026-01-01'),

('DV04', N'Nhuộm màu thời trang nam (Khói / Rêu / Bạch kim)', 
 N'Tẩy khử ánh sắc và nhuộm tông màu thời trang cao cấp bảo vệ sợi tóc.', 
 120, 950000, 'DichVu_Men/DV4.jpg', N'Kinh doanh', '2026-01-01'),

-- DV05 MỚI: Uốn con sâu / Ruffled thay cho phục hồi Olaplex
('DV05', N'Uốn tóc con sâu Dreadlocks / Uốn Ruffled phá cách', 
 N'Kỹ thuật uốn giấy bạc / uốn con sâu tạo hiệu ứng xù gai góc, phong cách hip-hop cá tính.', 
 100, 800000, 'DichVu_Men/DV5.jpg', N'Kinh doanh', '2026-01-01'),

-- DV06 MỚI: Kẻ Line Hair Tattoo thay cho gội đầu dưỡng sinh
('DV06', N'Kẻ Line Hair Tattoo nghệ thuật & Điêu khắc chân tóc', 
 N'Kỹ thuật dùng dao lam điêu khắc các họa tiết hoa văn, đường line sắc nét tạo điểm nhấn.', 
 30, 150000, 'DichVu_Men/DV6.jpg', N'Kinh doanh', '2026-01-01'),

('DV07', N'Cạo mặt, tỉa râu truyền thống & Khăn nóng', 
 N'Cạo râu bằng dao cạo bọt kem Proraso, chườm khăn nóng làm sạch lỗ chân lông.', 
 30, 80000, 'DichVu_Men/DV7.jpg', N'Kinh doanh', '2026-01-01'),

-- DV08 MỚI: Nhuộm đen phủ bạc thảo dược thay cho tẩy da chết da đầu
('DV08', N'Nhuộm đen phủ bạc thảo dược tự nhiên cho nam giới', 
 N'Phủ bạc 100% bằng chiết xuất thảo mộc không mùi hắc, trả lại màu tóc đen khỏe tự nhiên.', 
 45, 180000, 'DichVu_Men/DV8.jpg', N'Kinh doanh', '2026-01-01'),

('DV09', N'Tẩy tóc nâng tông thời trang (1 Lần)', 
 N'Nâng sáng từ 3-4 cấp độ màu chuẩn bị trước khi phủ màu khói sáng.', 
 60, 300000, 'DichVu_Men/DV9.jpg', N'Kinh doanh', '2026-01-01'),

('DV10', N'Lấy ráy tai êm ái Barber & Chăm sóc da mặt Facial', 
 N'Lấy ráy tai chuyên nghiệp bằng đèn quang học, hút bã nhờn và dưỡng ẩm da mặt.', 
 35, 100000, 'DichVu_Men/DV10.jpg', N'Kinh doanh', '2026-01-01');
-- Combo dịch vụ & Chi tiết thành phần combo
INSERT INTO ComboDichVu (MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai) VALUES
('CB01', N'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)', N'Gói dịch vụ chăm sóc hoàn chỉnh từ cắt tóc, gội dưỡng sinh đến cạo mặt khăn nóng.', 300000, 90, 'DichVu_Men/CBDV1.jpg', N'Đang kinh doanh'),
('CB02', N'Combo Đẹp Trai Toàn Diện (Cắt + Ép Side Down Perm)', N'Cắt form chuẩn kết hợp ép xẹp 2 bên mai giúp đầu vuông vức, gọn gàng.', 330000, 80, 'DichVu_Men/CBDV2.jpg', N'Đang kinh doanh'),
('CB03', N'Combo Lột Xác Phong Cách (Cắt + Uốn Texture + Gội)', N'Combo uốn phồng tóc tạo nếp Hàn Quốc kèm gội xả thư giãn.', 790000, 130, 'DichVu_Men/CBDV3.jpg', N'Đang kinh doanh'),
('CB04', N'Combo Quý Ông (Kẻ Tattoo + Cạo râu + Ráy tai Facial)', N'Gói chăm sóc gọn gàng diện mạo gồm tỉa họa tiết tóc, cạo râu bọt kem và lấy ráy tai thư giãn.', 280000, 75, 'DichVu_Men/CBDV4.jpg', N'Đang kinh doanh');
INSERT INTO ChiTietComboDichVu (MaCombo, MaDichVu, SoLuong) VALUES
-- CB01: DV01 (120k) + DV06 (150k) + DV07 (80k) = Giá lẻ 350k -> Giá Combo 300k
('CB01', 'DV01', 1),
('CB01', 'DV06', 1),
('CB01', 'DV07', 1),

-- CB02: DV01 (120k) + DV02 (250k) = Giá lẻ 370k -> Giá Combo 330k
('CB02', 'DV01', 1),
('CB02', 'DV02', 1),

-- CB03: DV01 (120k) + DV03 (650k) + DV06 (150k) = Giá lẻ 920k -> Giá Combo 790k
('CB03', 'DV01', 1),
('CB03', 'DV03', 1),
('CB03', 'DV06', 1),

-- CB04: DV06 (150k) + DV07 (80k) + DV10 (100k) = Giá lẻ 330k -> Giá Combo 280k
('CB04', 'DV06', 1),
('CB04', 'DV07', 1),
('CB04', 'DV10', 1);
GO

-- =========================================================================
-- 7. NẠP 130 SẢN PHẨM KHỚP ĐÚNG NHÀ CUNG CẤP CHUYÊN NGÀNH
-- =========================================================================
INSERT INTO SanPham (MaSanPham, MaDanhMuc, MaNhaCungCap, TenSanPham, MoTa, HinhAnh, GiaNhap, GiaBan, TrangThaiKinhDoanh) VALUES
('SP01', 'DM01', 'NCC05', N'Apestomen Volcanic Clay', N'Tạo texture, tăng độ phồng, giữ tóc vào nếp với hiệu ứng khô tự nhiên Dung tích: 80g; Loại: Clay; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình, tóc dày.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay/Apestomen_Volcanic_Clay_01.jpg', 340000, 480000, N'Đang bán'),
('SP02', 'DM01', 'NCC05', N'Hanz de Fuko Gravity Paste', N'Tạo độ phồng, texture rõ và giữ nếp chắc Dung tích: 2 oz / 56g; Loại: Paste; Giữ nếp: Cao; Finish: Matte tự nhiên; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Gravity_Paste/Hanz_de_Fuko_Gravity_Paste_01.jpg', 731000, 879000, N'Đang bán'),
('SP03', 'DM01', 'NCC05', N'Hanz de Fuko Claymation', N'Clay kết hợp wax, tạo texture mạnh và giữ nếp lâu Dung tích: 2 oz / 56g; Loại: Clay/Wax; Giữ nếp: Rất cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình, tóc dày.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Claymation/Hanz_de_Fuko_Claymation_01.jpg', 731000, 879000, N'Đang bán'),
('SP04', 'DM01', 'NCC05', N'Hanz de Fuko Heavymade', N'Giữ nếp mạnh, tạo độ bóng vừa và kiểu tóc gọn gàng Dung tích: 2 oz / 56g; Loại: Pomade; Giữ nếp: Rất cao; Finish: Shine tự nhiên; Phù hợp: Tóc trung bình – dày, slick back.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Heavymade/Hanz_de_Fuko_Heavymade_01.jpg', 520000, 690000, N'Đang bán'),
('SP05', 'DM01', 'NCC05', N'Hanz de Fuko Quicksand', N'Tạo texture, volume và cảm giác tóc khô tự nhiên Dung tích: 2 oz / 56g; Loại: Dry Wax; Giữ nếp: Cao; Finish: Dry/Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Quicksand/Hanz_de_Fuko_Quicksand_01.jpg', 731000, 879000, N'Đang bán'),
('SP06', 'DM01', 'NCC05', N'Hanz de Fuko Modify', N'Tạo kiểu linh hoạt, dễ chỉnh sửa và tạo độ bóng tự nhiên Dung tích: 2 oz / 56g; Loại: Pomade; Giữ nếp: Trung bình – cao; Finish: Natural Shine; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Modify/Hanz_de_Fuko_Modify_01.jpg', 731000, 879000, N'Đang bán'),
('SP07', 'DM01', 'NCC05', N'Hanz de Fuko Sponge Wax', N'Tạo texture, volume và giữ tóc tự nhiên Dung tích: 2 oz / 56g; Loại: Wax; Giữ nếp: Cao; Finish: Natural Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Sponge_Wax/Hanz_de_Fuko_Sponge_Wax_01.jpg', 731000, 879000, N'Đang bán'),
('SP08', 'DM01', 'NCC05', N'Blumaan Monarch Matte Paste', N'Tạo texture, volume và hiệu ứng lì tự nhiên Dung tích: 2.5 oz / 74ml; Loại: Matte Paste; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Monarch_Matte_Paste/Blumaan_Monarch_Matte_Paste_01.jpg', 499000, 615000, N'Đang bán'),
('SP09', 'DM01', 'NCC05', N'Blumaan Meraki Original Styling', N'Tăng volume, texture và tạo kiểu linh hoạt Dung tích: 2.5 oz / 74ml; Loại: Styling Wax; Giữ nếp: Trung bình – cao; Finish: Natural; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Meraki_Original_Styling/Blumaan_Meraki_Original_Styling_01.jpg', 429000, 559000, N'Đang bán'),
('SP10', 'DM01', 'NCC05', N'Blumaan Hybrid Cream Clay', N'Kết hợp độ mềm của cream và khả năng tạo texture của clay Dung tích: 2.5 oz / 75g; Loại: Cream Clay; Giữ nếp: Trung bình; Finish: Matte; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Hybrid_Cream_Clay/Blumaan_Hybrid_Cream_Clay_01.jpg', 499000, 615000, N'Đang bán'),
('SP11', 'DM01', 'NCC05', N'Blumaan Cavalier Heavy Clay', N'Clay giữ nếp mạnh, tạo texture và độ dày cho tóc Dung tích: 2.5 oz / 74ml; Loại: Heavy Clay; Giữ nếp: Rất cao; Finish: Matte; Phù hợp: Tóc dày, khó vào nếp.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Cavalier_Heavy_Clay/Blumaan_Cavalier_Heavy_Clay_01.jpg', 499000, 615000, N'Đang bán'),
('SP12', 'DM01', 'NCC05', N'Blumaan Fifth Sample Pomade', N'Tạo độ bóng nhẹ và giữ nếp linh hoạt Dung tích: 2.5 oz / 71g; Loại: Pomade; Giữ nếp: Trung bình – cao; Finish: Natural Shine; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Fifth_Sample_Pomade/Blumaan_Fifth_Sample_Pomade_01.jpg', 449000, 559000, N'Đang bán'),
('SP13', 'DM01', 'NCC05', N'Kevin Murphy Rough Rider', N'Tạo texture mạnh, tăng độ dày và cấu trúc tóc Dung tích: 100g; Loại: Clay; Giữ nếp: Rất cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình, tóc dày.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Kevin_Murphy/Kevin_Murphy_Rough_Rider/Kevin_Murphy_Rough_Rider_01.jpg', 599000, 769000, N'Đang bán'),
('SP14', 'DM01', 'NCC05', N'Kevin Murphy Easy Rider', N'Kiểm soát tóc, giảm xù và tạo kiểu tự nhiên Dung tích: 100g; Loại: Cream; Giữ nếp: Trung bình; Finish: Natural; Phù hợp: Tóc xoăn, tóc dễ xù.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Kevin_Murphy/Kevin_Murphy_Easy_Rider/Kevin_Murphy_Easy_Rider_01.jpg', 599000, 769000, N'Đang bán'),
('SP15', 'DM01', 'NCC05', N'Kevin Murphy Free Hold', N'Giữ nếp linh hoạt, tạo độ bóng tự nhiên Dung tích: 100g; Loại: Paste; Giữ nếp: Trung bình; Finish: Natural Shine; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Kevin_Murphy/Kevin_Murphy_Free_Hold/Kevin_Murphy_Free_Hold_01.jpg', 700000, 879000, N'Đang bán'),
('SP16', 'DM01', 'NCC05', N'Kevin Murphy Super Goo', N'Tạo kiểu linh hoạt, tăng độ bóng và giữ tóc vào nếp Dung tích: 100g; Loại: Gel; Giữ nếp: Cao; Finish: Shine; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Kevin_Murphy/Kevin_Murphy_Super_Goo/Kevin_Murphy_Super_Goo_01.jpg', 700000, 879000, N'Đang bán'),
('SP17', 'DM01', 'NCC05', N'Kevin Murphy Night Rider', N'Giữ nếp mạnh, tạo texture và hiệu ứng khô Dung tích: 100g; Loại: Matte Paste; Giữ nếp: Rất cao; Finish: Matte; Phù hợp: Tóc ngắn, tóc dày.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Kevin_Murphy/Kevin_Murphy_Night_Rider/Kevin_Murphy_Night_Rider_01.jpg', 599000, 769000, N'Đang bán'),
('SP18', 'DM01', 'NCC05', N'Apestomen Nitro Wax', N'Tạo texture rõ, giữ nếp tốt và dễ tạo kiểu Dung tích: 80g; Loại: Wax; Giữ nếp: Cao; Finish: Natural Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Nitro_Wax/Apestomen_Nitro_Wax_01.jpg', 340000, 459000, N'Đang bán'),
('SP19', 'DM01', 'NCC05', N'Apestomen Cola Pomade', N'Tạo độ bóng và giữ nếp theo phong cách cổ điển Dung tích: 80g; Loại: Pomade; Giữ nếp: Cao; Finish: High Shine; Phù hợp: Slick back, pompadour.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Cola_Pomade/Apestomen_Cola_Pomade_01.jpg', 340000, 459000, N'Đang bán'),
('SP20', 'DM01', 'NCC05', N'Apestomen Treatment Matte Paste', N'Tạo texture, giữ nếp và hoàn thiện lì tự nhiên Dung tích: 80g; Loại: Matte Paste; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Treatment_Matte_Paste/Apestomen_Treatment_Matte_Paste_01.jpg', 410000, 525000, N'Đang bán'),
('SP21', 'DM01', 'NCC05', N'By Vilain Dynamite Clay', N'Tạo texture, volume và giúp tóc trông dày hơn Dung tích: 65ml; Loại: Clay; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/By_Vilain/By_Vilain_Dynamite_Clay/By_Vilain_Dynamite_Clay_01.jpg', 642000, 802000, N'Đang bán'),
('SP22', 'DM01', 'NCC05', N'By Vilain Revolution', N'Tạo volume, texture và giữ nếp linh hoạt Dung tích: 65ml; Loại: Wax/Paste; Giữ nếp: Cao; Finish: Natural Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/By_Vilain/By_Vilain_Revolution/By_Vilain_Revolution_01.jpg', 642000, 802000, N'Đang bán'),
('SP23', 'DM01', 'NCC05', N'By Vilain Gold Digger', N'Giữ nếp mạnh, tạo texture và độ dày Dung tích: 65ml; Loại: Wax; Giữ nếp: Rất cao; Finish: Matte; Phù hợp: Tóc dày, tóc khó vào nếp.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/By_Vilain/By_Vilain_Gold_Digger/By_Vilain_Gold_Digger_01.jpg', 642000, 802000, N'Đang bán'),
('SP24', 'DM01', 'NCC05', N'By Vilain Silver Fox', N'Giữ nếp chắc, tạo độ bóng nhẹ và vẻ ngoài gọn gàng Dung tích: 65ml; Loại: Wax; Giữ nếp: Cao; Finish: Natural Shine; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/By_Vilain/By_Vilain_Silver_Fox/By_Vilain_Silver_Fox_01.jpg', 642000, 802000, N'Đang bán'),
('SP25', 'DM02', 'NCC05', N'Shear Revival Crystal Lake', N'Pomade linh hoạt, giữ nếp vừa và tạo độ bóng nhẹ Dung tích: 4 oz / 113g; Loại: Water-Based Pomade; Giữ nếp: Trung bình; Finish: Natural Shine; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Shear_Revival/Shear_Revival_Crystal_Lake/Shear_Revival_Crystal_Lake_01.jpg', 624000, 769000, N'Đang bán'),
('SP26', 'DM02', 'NCC05', N'Shear Revival Easy Tiger', N'Tạo texture và giữ nếp tự nhiên Dung tích: 4 oz / 113g; Loại: Paste; Giữ nếp: Trung bình – cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Shear_Revival/Shear_Revival_Easy_Tiger/Shear_Revival_Easy_Tiger_01.jpg', 624000, 769000, N'Đang bán'),
('SP27', 'DM02', 'NCC05', N'Shear Revival Gray Ghost', N'Giữ nếp tốt, tạo texture và hiệu ứng khô Dung tích: 4 oz / 113g; Loại: Matte Pomade; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Shear_Revival/Shear_Revival_Gray_Ghost/Shear_Revival_Gray_Ghost_01.jpg', 624000, 769000, N'Đang bán'),
('SP28', 'DM02', 'NCC05', N'Shear Revival American Gardens', N'Tạo texture, volume và vẻ ngoài tự nhiên Dung tích: 4 oz / 113g; Loại: Clay; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Shear_Revival/Shear_Revival_American_Gardens/Shear_Revival_American_Gardens_01.jpg', 624000, 769000, N'Đang bán'),
('SP29', 'DM02', 'NCC05', N'Shear Revival Northern Lights', N'Tạo texture, volume và giữ nếp tốt Dung tích: 4 oz / 113g; Loại: Paste; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Shear_Revival/Shear_Revival_Northern_Lights/Shear_Revival_Northern_Lights_01.jpg', 624000, 769000, N'Đang bán'),
('SP30', 'DM02', 'NCC04', N'Reuzel Green Medium Hold Grease', N'Giữ nếp vừa, tạo độ bóng cổ điển Dung tích: 95g / 3.38 oz; Loại: Grease Pomade; Giữ nếp: Trung bình; Finish: High Shine; Phù hợp: Slick back, pompadour.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Green_Medium_Hold_Grease/Reuzel_Green_Medium_Hold_Grease_01.jpg', 549000, 692000, N'Đang bán'),
('SP31', 'DM02', 'NCC04', N'Reuzel Red High Sheen Pomade', N'Giữ nếp tốt, độ bóng cao và dễ tạo kiểu cổ điển Dung tích: 95g / 3.38 oz; Loại: Pomade; Giữ nếp: Cao; Finish: High Shine; Phù hợp: Slick back, pompadour.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Red_High_Sheen_Pomade/Reuzel_Red_High_Sheen_Pomade_01.jpg', 549000, 692000, N'Đang bán'),
('SP32', 'DM02', 'NCC04', N'Reuzel Extreme Hold Matte Pomade', N'Giữ nếp cực mạnh, hiệu ứng lì và ít bóng Dung tích: 95g / 3.38 oz; Loại: Matte Pomade; Giữ nếp: Rất cao; Finish: Matte; Phù hợp: Tóc dày, khó vào nếp.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Extreme_Hold_Matte_Pomade/Reuzel_Extreme_Hold_Matte_Pomade_01.jpg', 575000, 714000, N'Đang bán'),
('SP33', 'DM02', 'NCC04', N'Reuzel Clay Matte Pomade', N'Tạo texture, độ lì và giữ nếp tốt Dung tích: 95g / 3.38 oz; Loại: Clay Pomade; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Clay_Matte_Pomade/Reuzel_Clay_Matte_Pomade_01.jpg', 575000, 714000, N'Đang bán'),
('SP34', 'DM02', 'NCC04', N'Reuzel Blue Strong Hold Pomade', N'Giữ nếp mạnh và tạo độ bóng cao Dung tích: 95g / 3.38 oz; Loại: Pomade; Giữ nếp: Rất cao; Finish: High Shine; Phù hợp: Tóc dày, slick back.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Blue_Strong_Hold_Pomade/Reuzel_Blue_Strong_Hold_Pomade_01.jpg', 549000, 692000, N'Đang bán'),
('SP35', 'DM02', 'NCC04', N'Reuzel Fiber Pomade', N'Tạo texture, volume và giữ nếp linh hoạt Dung tích: 95g / 3.38 oz; Loại: Fiber Pomade; Giữ nếp: Cao; Finish: Low Shine; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Fiber_Pomade/Reuzel_Fiber_Pomade_01.jpg', 575000, 714000, N'Đang bán'),
('SP36', 'DM02', 'NCC04', N'Reuzel Pink Heavy Hold Grease', N'Giữ nếp rất mạnh, tạo độ bóng cao Dung tích: 95g / 3.38 oz; Loại: Grease Pomade; Giữ nếp: Rất cao; Finish: High Shine; Phù hợp: Tóc dày, kiểu cổ điển.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Pink_Heavy_Hold_Grease/Reuzel_Pink_Heavy_Hold_Grease_01.jpg', 549000, 692000, N'Đang bán'),
('SP37', 'DM02', 'NCC04', N'Suavecito Firme Hold Pomade', N'Giữ nếp mạnh, tạo độ bóng và dễ tạo kiểu Dung tích: 4 oz / 113g; Loại: Pomade; Giữ nếp: Rất cao; Finish: High Shine; Phù hợp: Tóc trung bình – dày.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Suavecito/Suavecito_Firme_Hold_Pomade/Suavecito_Firme_Hold_Pomade_01.jpg', 392000, 503000, N'Đang bán'),
('SP38', 'DM02', 'NCC04', N'Suavecito Whiskey Bar Pomade', N'Giữ nếp tốt, phong cách pomade cổ điển Dung tích: 4 oz / 113g; Loại: Pomade; Giữ nếp: Cao; Finish: Shine; Phù hợp: Slick back, pompadour.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Suavecito/Suavecito_Whiskey_Bar_Pomade/Suavecito_Whiskey_Bar_Pomade_01.jpg', 392000, 503000, N'Đang bán'),
('SP39', 'DM02', 'NCC04', N'Suavecito Original Hold Pomade', N'Giữ nếp vừa, dễ sử dụng và dễ gội sạch Dung tích: 4 oz / 113g; Loại: Pomade; Giữ nếp: Trung bình – cao; Finish: High Shine; Phù hợp: Sử dụng hằng ngày.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Suavecito/Suavecito_Original_Hold_Pomade/Suavecito_Original_Hold_Pomade_01.jpg', 392000, 503000, N'Đang bán'),
('SP40', 'DM02', 'NCC04', N'Suavecito Matte Pomade', N'Giữ nếp và tạo texture mà không tạo độ bóng Dung tích: 4 oz / 113g; Loại: Matte Pomade; Giữ nếp: Trung bình – cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Suavecito/Suavecito_Matte_Pomade/Suavecito_Matte_Pomade_01.jpg', 392000, 503000, N'Đang bán'),
('SP41', 'DM02', 'NCC04', N'Uppercut Deluxe Clay', N'Tạo texture, độ lì và giữ nếp mạnh Dung tích: 100g; Loại: Clay; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn, tóc dày.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Uppercut_Deluxe/Uppercut_Deluxe_Clay/Uppercut_Deluxe_Clay_01.jpg', 573000, 714000, N'Đang bán'),
('SP42', 'DM02', 'NCC04', N'Uppercut Deluxe Featherweight', N'Tạo volume và texture nhưng không làm tóc nặng Dung tích: 80g; Loại: Wax; Giữ nếp: Trung bình – cao; Finish: Matte; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Uppercut_Deluxe/Uppercut_Deluxe_Featherweight/Uppercut_Deluxe_Featherweight_01.jpg', 573000, 714000, N'Đang bán'),
('SP43', 'DM02', 'NCC04', N'Uppercut Deluxe Monster Hold', N'Giữ nếp mạnh, phù hợp tóc dày Dung tích: 100g; Loại: Pomade; Giữ nếp: Rất cao; Finish: Shine; Phù hợp: Tóc dày, khó vào nếp.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Uppercut_Deluxe/Uppercut_Deluxe_Monster_Hold/Uppercut_Deluxe_Monster_Hold_01.jpg', 573000, 714000, N'Đang bán'),
('SP44', 'DM02', 'NCC04', N'Uppercut Deluxe Pomade', N'Tạo độ bóng và giữ nếp tốt Dung tích: 100g; Loại: Pomade; Giữ nếp: Cao; Finish: Medium Shine; Phù hợp: Slick back, pompadour.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Uppercut_Deluxe/Uppercut_Deluxe_Pomade/Uppercut_Deluxe_Pomade_01.jpg', 573000, 714000, N'Đang bán'),
('SP45', 'DM02', 'NCC04', N'Uppercut Deluxe Matt Clay', N'Tạo texture, volume và hiệu ứng lì Dung tích: 80g; Loại: Clay; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Uppercut_Deluxe/Uppercut_Deluxe_Matt_Clay/Uppercut_Deluxe_Matt_Clay_01.jpg', 573000, 714000, N'Đang bán'),
('SP46', 'DM02', 'NCC04', N'Schmiere Pomade Hart', N'Pomade giữ nếp mạnh, tạo độ bóng Dung tích: 250ml; Loại: Pomade; Giữ nếp: Cao; Finish: Shine; Phù hợp: Tóc trung bình – dày.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Schmiere/Schmiere_Pomade_Hart/Schmiere_Pomade_Hart_01.jpg', 630000, 769000, N'Đang bán'),
('SP47', 'DM02', 'NCC04', N'Schmiere Pomade Knueppelhart', N'Giữ nếp rất mạnh, phù hợp tóc khó vào nếp Dung tích: 250ml; Loại: Pomade; Giữ nếp: Rất cao; Finish: Shine; Phù hợp: Tóc dày, khó vào nếp.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Schmiere/Schmiere_Pomade_Knueppelhart/Schmiere_Pomade_Knueppelhart_01.jpg', 630000, 769000, N'Đang bán'),
('SP48', 'DM02', 'NCC04', N'Schmiere Pomade Mittel', N'Giữ nếp trung bình, dễ điều chỉnh Dung tích: 250ml; Loại: Pomade; Giữ nếp: Trung bình; Finish: Shine; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Schmiere/Schmiere_Pomade_Mittel/Schmiere_Pomade_Mittel_01.jpg', 450000, 592000, N'Đang bán'),
('SP49', 'DM02', 'NCC04', N'Schmiere Pomade Weich', N'Pomade mềm, dễ sử dụng và dễ điều chỉnh Dung tích: 250ml; Loại: Pomade; Giữ nếp: Thấp – trung bình; Finish: Natural Shine; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Schmiere/Schmiere_Pomade_Weich/Schmiere_Pomade_Weich_01.jpg', 450000, 592000, N'Đang bán'),
('SP50', 'DM03', 'NCC05', N'Blumaan Ascend Volume Cream', N'Tạo phồng, tăng texture và hỗ trợ định hình tóc Dung tích: 100ml; Loại: Volume Cream; Giữ nếp: Trung bình; Finish: Natural; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Blumaan_Ascend/Blumaan_Ascend_Volume_Cream/Blumaan_Ascend_Volume_Cream_01.jpg', 449000, 592000, N'Đang bán'),
('SP51', 'DM03', 'NCC04', N'Reuzel Grooming Tonic', N'Hỗ trợ sấy phồng, tạo texture và chuẩn bị tóc trước tạo kiểu Dung tích: 100ml; Loại: Grooming Tonic; Giữ nếp: Nhẹ – trung bình; Finish: Natural; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic_01.jpg', 549000, 692000, N'Đang bán'),
('SP52', 'DM03', 'NCC04', N'Reuzel Spray Grooming Tonic', N'Xịt hỗ trợ sấy, tăng volume và texture Dung tích: 100ml; Loại: Grooming Spray; Giữ nếp: Nhẹ – trung bình; Finish: Natural; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Reuzel_Grooming_Tonic/Reuzel_Spray_Grooming_Tonic/Reuzel_Spray_Grooming_Tonic_01.jpg', 549000, 692000, N'Đang bán'),
('SP53', 'DM03', 'NCC04', N'Reuzel Surf Tonic', N'Tạo texture và volume theo phong cách tóc tự nhiên Dung tích: 100ml; Loại: Sea Salt/Texture Tonic; Giữ nếp: Trung bình; Finish: Matte; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Reuzel_Grooming_Tonic/Reuzel_Surf_Tonic/Reuzel_Surf_Tonic_01.jpg', 549000, 692000, N'Đang bán'),
('SP54', 'DM03', 'NCC07', N'Bona Fide Texture Spray', N'Tạo texture, volume và hỗ trợ tạo kiểu Dung tích: 237ml; Loại: Texture Spray; Giữ nếp: Trung bình; Finish: Natural Matte; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Bona_Fide/Bona_Fide_Texture_Spray/Bona_Fide_Texture_Spray_01.jpg', 395000, 503000, N'Đang bán'),
('SP55', 'DM03', 'NCC07', N'Bona Fide Pre-Styling Travel Size', N'Dạng nhỏ gọn, hỗ trợ tạo volume trước khi dùng sản phẩm tạo kiểu Dung tích: 50ml; Loại: Pre-Styling Spray; Giữ nếp: Nhẹ – trung bình; Finish: Natural; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Bona_Fide/Bona_Fide_Pre-styling_Travel_Size_50ml/Bona_Fide_Pre-styling_Travel_Size_50ml_01.jpg', 229000, 344000, N'Đang bán'),
('SP56', 'DM03', 'NCC05', N'By Vilain Sidekick Pre-Styling Spray', N'Tăng volume và hỗ trợ sấy tạo kiểu Dung tích: 150ml; Loại: Pre-Styling Spray; Giữ nếp: Trung bình; Finish: Natural; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/By_Vilain_Sidekick/By_Vilain_Sidekick_Pre-Styling_Spray/By_Vilain_Sidekick_Pre-Styling_Spray_01.jpg', 429000, 559000, N'Đang bán'),
('SP57', 'DM03', 'NCC05', N'By Vilain Sidekick Zero', N'Hỗ trợ tạo volume, texture trước khi dùng wax/clay Dung tích: 150ml; Loại: Pre-Styling Spray; Giữ nếp: Trung bình; Finish: Matte; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/By_Vilain_Sidekick/By_Vilain_Sidekick_Zero/By_Vilain_Sidekick_Zero_01.jpg', 429000, 559000, N'Đang bán'),
('SP58', 'DM04', 'NCC07', N'Butterfly Shadow Extra Strong Hold', N'Gôm giữ nếp mạnh, cố định kiểu tóc lâu Dung tích: 600ml; Loại: Hairspray; Giữ nếp: Rất cao; Finish: Natural; Phù hợp: Tóc dày, kiểu cần giữ lâu.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Butterfly_Shadow/Butterfly_Shadow_Extra_Strong_Hold_600ml/Butterfly_Shadow_Extra_Strong_Hold_600ml_01.jpg', 349000, 459000, N'Đang bán'),
('SP59', 'DM04', 'NCC07', N'Butterfly Shadow Hard Hold Hairspray', N'Giữ nếp chắc và hỗ trợ hoàn thiện kiểu tóc Dung tích: 320ml; Loại: Hairspray; Giữ nếp: Cao; Finish: Natural; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Butterfly_Shadow/Butterfly_Shadow_Hard_Hold_Hairspray_320ml/Butterfly_Shadow_Hard_Hold_Hairspray_320ml_01.jpg', 299000, 401000, N'Đang bán'),
('SP60', 'DM04', 'NCC01', N'L''Oréal Professionnel Infinium Pure Soft', N'Giữ nếp mềm, tóc vẫn linh hoạt và tự nhiên Dung tích: 500ml; Loại: Hairspray; Giữ nếp: Nhẹ; Finish: Natural; Phù hợp: Tóc mỏng – trung bình.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/LOreal_Infinium/LOreal_Professionnel_Infinium_Pure_Soft/LOreal_Professionnel_Infinium_Pure_Soft_01.jpg', 379000, 503000, N'Đang bán'),
('SP61', 'DM04', 'NCC01', N'L''Oréal Professionnel Infinium Pure Strong', N'Cố định kiểu tóc nhưng vẫn giữ độ tự nhiên Dung tích: 500ml; Loại: Hairspray; Giữ nếp: Cao; Finish: Natural; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/LOreal_Infinium/LOreal_Professionnel_Infinium_Pure_Strong/LOreal_Professionnel_Infinium_Pure_Strong_01.jpg', 379000, 503000, N'Đang bán'),
('SP62', 'DM04', 'NCC01', N'L''Oréal Professionnel Infinium Pure Extra Strong', N'Giữ nếp rất mạnh, phù hợp kiểu tóc cần cố định lâu Dung tích: 500ml; Loại: Hairspray; Giữ nếp: Rất cao; Finish: Natural; Phù hợp: Tóc dày, kiểu cầu kỳ.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/LOreal_Infinium/LOreal_Professionnel_Infinium_Pure_Extra_Strong/LOreal_Professionnel_Infinium_Pure_Extra_Strong_01.jpg', 399000, 525000, N'Đang bán'),
('SP63', 'DM04', 'NCC02', N'OSiS+ Freeze Finish', N'Cố định và hoàn thiện kiểu tóc Dung tích: 300ml; Loại: Hairspray; Giữ nếp: Cao; Finish: Natural; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Osis_Plus_Schwarzkopf/Osis_Plus_Freeze_Finish/Osis_Plus_Freeze_Finish_01.jpg', 280000, 401000, N'Đang bán'),
('SP64', 'DM04', 'NCC02', N'OSiS+ Session Extreme Hold', N'Hairspray giữ nếp cực mạnh, phù hợp tạo kiểu chuyên nghiệp Dung tích: 300ml; Loại: Hairspray; Giữ nếp: Rất cao; Finish: Natural; Phù hợp: Tóc dày, kiểu cầu kỳ.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Osis_Plus_Schwarzkopf/Osis_Plus_Session_Extreme_Hold/Osis_Plus_Session_Extreme_Hold_01.jpg', 320000, 459000, N'Đang bán'),
('SP65', 'DM04', 'NCC02', N'OSiS+ Sparkler', N'Tạo độ bóng và hoàn thiện bề mặt tóc Dung tích: 300ml; Loại: Shine Spray; Giữ nếp: Nhẹ; Finish: High Shine; Phù hợp: Tóc xỉn, tóc khô.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Osis_Plus_Schwarzkopf/Osis_Plus_Sparkler/Osis_Plus_Sparkler_01.jpg', 349000, 459000, N'Đang bán'),
('SP66', 'DM04', 'NCC02', N'OSiS+ Freeze Pump', N'Xịt giữ nếp dạng pump, giúp cố định tóc lâu Dung tích: 200ml; Loại: Pump Spray; Giữ nếp: Cao; Finish: Natural; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Osis_Plus_Schwarzkopf/Osis_Plus_Freeze_Pump/Osis_Plus_Freeze_Pump_01.jpg', 399000, 525000, N'Đang bán'),
('SP67', 'DM04', 'NCC05', N'TIGI Bed Head Hard Head Hairspray', N'Giữ nếp mạnh và cố định kiểu tóc lâu Dung tích: 313ml; Loại: Hairspray; Giữ nếp: Rất cao; Finish: Natural; Phù hợp: Tóc dày, kiểu cần giữ lâu.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Tigi_Bed_Head_Men/TIGI_Bed_Head_Hard_Head_Hairspray/TIGI_Bed_Head_Hard_Head_Hairspray_01.jpg', 450000, 559000, N'Đang bán'),
('SP68', 'DM04', 'NCC05', N'TIGI Bed Head Masterpiece Hairspray', N'Giữ nếp kết hợp tạo độ bóng Dung tích: 313ml; Loại: Hairspray; Giữ nếp: Cao; Finish: Shine; Phù hợp: Nhiều loại tóc.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Tigi_Bed_Head_Men/TIGI_Bed_Head_Masterpiece_Hairspray/TIGI_Bed_Head_Masterpiece_Hairspray_01.jpg', 399000, 503000, N'Đang bán'),
('SP69', 'DM04', 'NCC05', N'TIGI Bed Head For Men Matte Separation Workable Wax', N'Tạo texture, tách sợi và hiệu ứng lì tự nhiên Dung tích: 100ml; Loại: Wax; Giữ nếp: Cao; Finish: Matte; Phù hợp: Tóc ngắn – trung bình.', N'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/Tigi_Bed_Head_Men/TIGI_Bed_Head_For_Men_Matte_Separation_Workable_Wax/TIGI_Bed_Head_For_Men_Matte_Separation_Workable_Wax_01.jpg', 450000, 592000, N'Đang bán'),
('SP70', 'DM05', 'NCC06', N'Kerasys Homme Deep Cleansing Cool Shampoo', N'Làm sạch sâu, tạo cảm giác mát và thông thoáng da đầu Dung tích: 550ml; Loại: Shampoo; Giữ nếp: —; Finish: —; Phù hợp: Nam, da đầu dầu.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Kerasys_Homme/Kerasys_Homme_Deep_Cleansing_Cool_Shampoo/Kerasys_Homme_Deep_Cleansing_Cool_Shampoo_01.jpg', 214500, 286000, N'Đang bán'),
('SP71', 'DM05', 'NCC06', N'Kerasys Homme Scalp Care Shampoo', N'Làm sạch và chăm sóc da đầu, duy trì cảm giác thông thoáng Dung tích: 550ml; Loại: Shampoo; Giữ nếp: —; Finish: —; Phù hợp: Nam, da đầu dầu/nhạy cảm.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Kerasys_Homme/Kerasys_Homme_Scalp_Care_Shampoo/Kerasys_Homme_Scalp_Care_Shampoo_01.jpg', 214500, 286000, N'Đang bán'),
('SP72', 'DM05', 'NCC03', N'Davines Purifying Gel', N'Hỗ trợ làm sạch và chăm sóc da đầu nhiều dầu/gàu Dung tích: 150ml; Loại: Scalp Treatment Gel; Giữ nếp: —; Finish: —; Phù hợp: Da đầu dầu, có gàu.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Davines_Purifying/Davines_Purifying_Gel/Davines_Purifying_Gel_01.jpg', 315000, 424000, N'Đang bán'),
('SP73', 'DM05', 'NCC03', N'Davines Purifying Shampoo', N'Làm sạch da đầu và hỗ trợ chăm sóc da đầu có vấn đề Dung tích: 250ml; Loại: Shampoo; Giữ nếp: —; Finish: —; Phù hợp: Da đầu dầu, gàu.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Davines_Purifying/Davines_Purifying_Shampoo/Davines_Purifying_Shampoo_01.jpg', 315000, 424000, N'Đang bán'),
('SP74', 'DM05', 'NCC03', N'Davines Rebalancing Shampoo', N'Làm sạch và hỗ trợ cân bằng lượng dầu trên da đầu Dung tích: 250ml; Loại: Shampoo; Giữ nếp: —; Finish: —; Phù hợp: Da đầu dầu.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Davines_Purifying/Davines_Rebalancing_Shampoo/Davines_Rebalancing_Shampoo_01.jpg', 315000, 424000, N'Đang bán'),
('SP75', 'DM05', 'NCC04', N'Reuzel Scrub Shampoo', N'Làm sạch sâu dầu thừa và cặn sản phẩm tạo kiểu Dung tích: 350ml; Loại: Deep Cleansing Shampoo; Giữ nếp: —; Finish: —; Phù hợp: Da đầu nhiều dầu, thường xuyên dùng wax/pomade.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Reuzel_Scrub/Reuzel_Scrub_Shampoo/Reuzel_Scrub_Shampoo_01.jpg', 549000, 692000, N'Đang bán'),
('SP76', 'DM05', 'NCC04', N'Reuzel 3-in-1 Tea Tree Shampoo', N'Làm sạch tóc, da đầu và cơ thể trong một sản phẩm Dung tích: 350ml; Loại: 3-in-1 Shampoo; Giữ nếp: —; Finish: —; Phù hợp: Người thích sản phẩm đa năng.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Reuzel_Scrub/Reuzel_3-in-1_Tea_Tree_Shampoo/Reuzel_3-in-1_Tea_Tree_Shampoo_01.jpg', 299000, 401000, N'Đang bán'),
('SP77', 'DM05', 'NCC04', N'Reuzel Daily Conditioner', N'Làm mềm tóc, hỗ trợ dưỡng ẩm và dễ chải Dung tích: 350ml; Loại: Conditioner; Giữ nếp: —; Finish: —; Phù hợp: Tóc khô, tóc thường.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Reuzel_Scrub/Reuzel_Daily_Conditioner/Reuzel_Daily_Conditioner_01.jpg', 399000, 525000, N'Đang bán'),
('SP78', 'DM05', 'NCC04', N'Reuzel Daily Shampoo', N'Làm sạch tóc nhẹ nhàng để sử dụng hằng ngày Dung tích: 350ml; Loại: Shampoo; Giữ nếp: —; Finish: —; Phù hợp: Tóc thường – da đầu thường.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Reuzel_Scrub/Reuzel_Daily_Shampoo/Reuzel_Daily_Shampoo_01.jpg', 399000, 525000, N'Đang bán'),
('SP79', 'DM05', 'NCC05', N'TIGI Bed Head For Men Clean Up Peppermint Conditioner', N'Dầu xả bạc hà giúp tóc mềm, dễ chải và tạo cảm giác sạch mát Dung tích: 250ml; Loại: Conditioner; Giữ nếp: —; Finish: —; Phù hợp: Nam, tóc thường – khô.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Tigi_Clean_Up/TIGI_Bed_Head_For_Men_Clean_Up_Peppermint_Conditioner/TIGI_Bed_Head_For_Men_Clean_Up_Peppermint_Conditioner_01.jpg', 399000, 503000, N'Đang bán'),
('SP80', 'DM05', 'NCC05', N'TIGI Bed Head For Men Clean Up Daily Shampoo', N'Dầu gội hằng ngày giúp làm sạch tóc và da đầu Dung tích: 250ml; Loại: Shampoo; Giữ nếp: —; Finish: —; Phù hợp: Nam, tóc thường – dầu.', N'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Tigi_Clean_Up/TIGI_Bed_Head_For_Men_Clean_Up_Daily_Shampoo/TIGI_Bed_Head_For_Men_Clean_Up_Daily_Shampoo_01.jpg', 399000, 503000, N'Đang bán'),
('SP81', 'DM06', 'NCC02', N'Osis+ Dust It Mattifying Powder 10g', N'Bột tạo phồng và hiệu ứng lì cho tóc. Dung tích: 10g; Loại: Powder; Giữ nếp: —; Finish: Matte; Phù hợp: Nam, tóc cần tạo phồng.', N'Men_Grooming_Products/06_Bot_Tao_Phong_Texture_Powder/Osis_Dust_It/Osis_Dust_It_Mattifying_Powder_10g/Osis_Dust_It_Mattifying_Powder_10g_01.jpg', 300000, 390000, N'Đang bán'),
('SP82', 'DM06', 'NCC05', N'Slick Gorilla Hair Styling Powder 20g', N'Bột tạo phồng cho tóc, hiệu ứng lì. Dung tích: 20g; Loại: Powder; Giữ nếp: —; Finish: Matte; Phù hợp: Nam, tóc cần tạo phồng.', N'Men_Grooming_Products/06_Bot_Tao_Phong_Texture_Powder/Slick_Gorilla/Slick_Gorilla_Hair_Styling_Powder_20g/Slick_Gorilla_Hair_Styling_Powder_20g_01.jpg', 323000, 420000, N'Đang bán'),
('SP83', 'DM06', 'NCC04', N'Uppercut Deluxe Styling Powder 20g', N'Bột tạo phồng và texture cho tóc nam. Dung tích: 20g; Loại: Powder; Giữ nếp: —; Finish: Matte; Phù hợp: Nam, tóc cần tạo phồng.', N'Men_Grooming_Products/06_Bot_Tao_Phong_Texture_Powder/Uppercut_Deluxe_Powder/Uppercut_Deluxe_Styling_Powder_20g/Uppercut_Deluxe_Styling_Powder_20g_01.jpg', 300000, 390000, N'Đang bán'),
('SP84', 'DM06', 'NCC05', N'Sevich Hair Volume Powder 8g', N'Bột tạo phồng chân tóc. Dung tích: 8g; Loại: Powder; Giữ nếp: —; Finish: —; Phù hợp: Nam, tóc cần tạo phồng.', N'Men_Grooming_Products/06_Bot_Tao_Phong_Texture_Powder/Sevich/Sevich_Hair_Volume_Powder_8g/Sevich_Hair_Volume_Powder_8g_01.jpg', 38000, 50000, N'Đang bán'),
('SP85', 'DM06', 'NCC05', N'12Reasons The Absolute Volume Powder 12g', N'Bột tạo phồng tóc. Dung tích: 12g; Loại: Powder; Giữ nếp: —; Finish: —; Phù hợp: Nam, tóc cần tạo phồng.', N'Men_Grooming_Products/06_Bot_Tao_Phong_Texture_Powder/12Reasons/12Reasons_The_Absolute_Volume_Powder_12g/12Reasons_The_Absolute_Volume_Powder_12g_01.jpg', 381000, 495000, N'Đang bán'),
('SP86', 'DM06', 'NCC05', N'12Reasons The Absolute Texturiser Powder 12g', N'Bột tạo texture cho tóc, có nhiều màu. Dung tích: 12g; Loại: Powder; Giữ nếp: —; Finish: —; Phù hợp: Nam, tóc cần tạo texture.', N'Men_Grooming_Products/06_Bot_Tao_Phong_Texture_Powder/12Reasons/12Reasons_The_Absolute_Texturiser_Powder_12g/12Reasons_The_Absolute_Texturiser_Powder_12g_01.jpg', 309000, 402000, N'Đang bán'),
('SP87', 'DM06', 'NCC04', N'Reuzel Matte Texture Powder 15g', N'Bột tạo texture hiệu ứng lì cho tóc nam. Dung tích: 15g; Loại: Powder; Giữ nếp: —; Finish: Matte; Phù hợp: Nam, tóc cần tạo phồng.', N'Men_Grooming_Products/06_Bot_Tao_Phong_Texture_Powder/Reuzel_Powder/Reuzel_Matte_Texture_Powder_15g/Reuzel_Matte_Texture_Powder_15g_01.jpg', 380000, 494000, N'Đang bán'),
('SP88', 'DM07', 'NCC07', N'British M Men''s Style Down Perm 200g', N'Kem ép side tóc nam, giúp tóc mai và tóc gáy vào nếp. Dung tích: 200g; Loại: Kem ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam, tóc vểnh, khó vào nếp.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/British_M_Men_Down_Perm/British_M_Mens_Style_Down_Perm_200g/British_M_Mens_Style_Down_Perm_200g_01.jpg', 346000, 450000, N'Đang bán'),
('SP89', 'DM07', 'NCC07', N'British M Men''s Style Down Perm Mild 1 200g', N'Kem ép side bản dịu nhẹ. Dung tích: 200g; Loại: Kem ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam, tóc yếu, tẩy, nhuộm, da đầu nhạy cảm.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/British_M_Men_Down_Perm/British_M_Mens_Style_Down_Perm_Mild_200g/British_M_Mens_Style_Down_Perm_Mild_200g_01.jpg', 277000, 360000, N'Đang bán'),
('SP90', 'DM07', 'NCC05', N'Forbeaut Mud Up&Down Multi Cream 100ml', N'Kem tạo kiểu đa năng, hỗ trợ ép side và tạo phồng. Dung tích: 100ml; Loại: Kem tạo kiểu / ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/For_Beaut_Down_Perm/Forbeaut_Mud_Up_And_Down_Multi_Cream_100ml/Forbeaut_Mud_Up_And_Down_Multi_Cream_100ml_01.jpg', 516000, 671000, N'Đang bán'),
('SP91', 'DM07', 'NCC05', N'Dashu For Men Ultra Bond Gel Down Perm', N'Gel ép side tại nhà dành cho nam. Dung tích: 100–150ml (tùy bản); Loại: Gel ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/Dashu/Dashu_For_Men_Ultra_Bond_Gel_Down_Perm_150ml/Dashu_For_Men_Ultra_Bond_Gel_Down_Perm_150ml_01.jpg', 443000, 576000, N'Đang bán'),
('SP92', 'DM07', 'NCC05', N'Dashu For Men Premium Fast Down Perm 100ml', N'Kem ép side tác dụng nhanh. Dung tích: 100ml; Loại: Kem ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/Dashu/Dashu_For_Men_Premium_Fast_Down_Perm_100ml/Dashu_For_Men_Premium_Fast_Down_Perm_100ml_01.jpg', 423000, 550000, N'Đang bán'),
('SP93', 'DM07', 'NCC05', N'Dashu For Men Easy Button Down Perm 20ml', N'Kem ép side dạng nhỏ gọn. Dung tích: 20ml; Loại: Kem ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/Dashu/Dashu_For_Men_Easy_Button_Down_Perm_20ml/Dashu_For_Men_Easy_Button_Down_Perm_20ml_01.jpg', 619000, 805000, N'Đang bán'),
('SP94', 'DM07', 'NCC05', N'Dashu For Men Protein Down Cream Perm 100ml', N'Kem ép side chứa protein. Dung tích: 100ml; Loại: Kem ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/Dashu/Dashu_For_Men_Protein_Down_Cream_Perm_100ml/Dashu_For_Men_Protein_Down_Cream_Perm_100ml_01.jpg', 342000, 445000, N'Đang bán'),
('SP95', 'DM07', 'NCC07', N'Alonzo Keratin Straight A & B 1000ml', N'Kem duỗi ép tóc 2 bước (A và B), dùng cho salon. Dung tích: 1000ml; Loại: Kem duỗi / ép tóc; Giữ nếp: —; Finish: —; Phù hợp: Nam, nữ.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/Alonzo/Alonzo_Keratin_Straight_A_B_1000ml/Alonzo_Keratin_Straight_A_B_1000ml_01.jpg', 480000, 620000, N'Đang bán'),
('SP96', 'DM07', 'NCC05', N'Sdolz Self Down Perm for Men 100ml', N'Kem tự ép side tại nhà cho nam. Dung tích: 100ml; Loại: Kem ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/Sdolz/Sdolz_Self_Down_Perm_for_Men_100ml/Sdolz_Self_Down_Perm_for_Men_100ml_01.jpg', 190000, 260000, N'Đang bán'),
('SP97', 'DM07', 'NCC05', N'ALTTAB Down Killer 180g', N'Sản phẩm ép side tóc. Dung tích: 180g; Loại: Down perm; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/ALTTAB/ALTTAB_Down_Killer_Down_Perm_180g/ALTTAB_Down_Killer_Down_Perm_180g_01.jpg', 220000, 310000, N'Đang bán'),
('SP98', 'DM07', 'NCC05', N'Moremo Keratin Self Down Perm 100ml', N'Kem tự ép side chứa keratin. Dung tích: 100ml; Loại: Kem ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/Moremo/Moremo_Keratin_Self_Down_Perm_100ml/Moremo_Keratin_Self_Down_Perm_100ml_01.jpg', 455000, 592000, N'Đang bán'),
('SP99', 'DM07', 'NCC05', N'Grafen Original Down Perm 100ml', N'Kem ép side tạo kiểu tóc nam. Dung tích: 100ml; Loại: Kem ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/Grafen/Grafen_Original_Down_Perm_100ml/Grafen_Original_Down_Perm_100ml_01.jpg', 342000, 445000, N'Đang bán'),
('SP100', 'DM07', 'NCC05', N'DPERM Serum Concentrate Down Perm Kit', N'Bộ kit ép side tại nhà. Dung tích: —; Loại: Kit ép side; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/DPERM/DPERM_Serum_Concentrate_Down_Perm_Kit/DPERM_Serum_Concentrate_Down_Perm_Kit_01.jpg', 1960000, 2548000, N'Đang bán'),
('SP101', 'DM07', 'NCC01', N'L''Oréal Professionnel X-Tenso Oleoshape', N'Kem duỗi tóc dùng cho salon. Dung tích: 400ml x 2 (bộ); Loại: Kem duỗi / ép tóc; Giữ nếp: —; Finish: —; Phù hợp: Nam, nữ.', N'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/LOreal_X_Tenso/LOreal_Professionnel_X_Tenso_Oleoshape/LOreal_Professionnel_X_Tenso_Oleoshape_01.jpg', 764000, 993000, N'Đang bán'),
('SP102', 'DM08', 'NCC05', N'Proraso Pre-Shave Cream 100ml', N'Kem dùng trước khi cạo râu. Dung tích: 100ml; Loại: Pre-shave cream; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_Pre_Shave_Cream_100ml/Proraso_Pre_Shave_Cream_100ml_01.jpg', 256000, 333000, N'Đang bán'),
('SP103', 'DM08', 'NCC05', N'Proraso Shaving Soap Jar', N'Xà phòng cạo râu dạng hũ. Dung tích: 150ml; Loại: Shaving soap; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_Shaving_Soap_Jar/Proraso_Shaving_Soap_Jar_01.jpg', 160000, 208000, N'Đang bán'),
('SP104', 'DM08', 'NCC05', N'Proraso Shaving Cream Tube 150ml', N'Kem cạo râu dạng tuýp. Dung tích: 150ml; Loại: Shaving cream; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_Shaving_Cream_Tube_150ml/Proraso_Shaving_Cream_Tube_150ml_01.jpg', 202000, 262000, N'Đang bán'),
('SP105', 'DM08', 'NCC05', N'Proraso After Shave Balm 100ml', N'Balm dưỡng da sau khi cạo râu. Dung tích: 100ml; Loại: After shave balm; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_After_Shave_Balm_100ml/Proraso_After_Shave_Balm_100ml_01.jpg', 362000, 470000, N'Đang bán'),
('SP106', 'DM08', 'NCC05', N'Proraso Beard Wash', N'Sữa rửa râu. Dung tích: 200ml; Loại: Beard wash; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_Beard_Wash/Proraso_Beard_Wash_01.jpg', 342000, 445000, N'Đang bán'),
('SP107', 'DM08', 'NCC05', N'Proraso Beard Oil Wood & Spice', N'Dầu dưỡng râu mùi Wood & Spice. Dung tích: 30ml; Loại: Beard oil; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_Beard_Oil_Wood_And_Spice/Proraso_Beard_Oil_Wood_And_Spice_01.jpg', 322000, 419000, N'Đang bán'),
('SP108', 'DM08', 'NCC05', N'Proraso Beard Balm Wood & Spice 100ml', N'Balm dưỡng và tạo kiểu râu mùi Wood & Spice. Dung tích: 100ml; Loại: Beard balm; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_Beard_Balm_Wood_And_Spice_100ml/Proraso_Beard_Balm_Wood_And_Spice_100ml_01.jpg', 408000, 530000, N'Đang bán'),
('SP109', 'DM08', 'NCC05', N'Proraso Beard Exfoliating Paste 100ml', N'Kem tẩy da chết cho vùng râu và mặt. Dung tích: 100ml; Loại: Exfoliating paste; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_Beard_Exfoliating_Paste_100ml/Proraso_Beard_Exfoliating_Paste_100ml_01.jpg', 408000, 530000, N'Đang bán'),
('SP110', 'DM08', 'NCC05', N'Honest Amish Beard Balm 2oz', N'Balm dưỡng râu. Dung tích: 2oz; Loại: Beard balm; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Honest_Amish/Honest_Amish_Beard_Balm_2oz/Honest_Amish_Beard_Balm_2oz_01.jpg', 280000, 364000, N'Đang bán'),
('SP111', 'DM08', 'NCC05', N'Honest Amish Heavy Duty Beard Balm', N'Balm dưỡng và tạo kiểu râu, độ giữ cao hơn. Dung tích: 2oz (có bản 4oz); Loại: Beard balm; Giữ nếp: Cao; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Honest_Amish/Honest_Amish_Heavy_Duty_Beard_Balm/Honest_Amish_Heavy_Duty_Beard_Balm_01.jpg', 259000, 337000, N'Đang bán'),
('SP112', 'DM08', 'NCC05', N'Honest Amish Classic Beard Oil 2oz', N'Dầu dưỡng râu. Dung tích: 2oz; Loại: Beard oil; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Honest_Amish/Honest_Amish_Classic_Beard_Oil_2oz/Honest_Amish_Classic_Beard_Oil_2oz_01.jpg', 252000, 327000, N'Đang bán'),
('SP113', 'DM08', 'NCC05', N'Honest Amish Premium Beard Oil 2oz', N'Dầu dưỡng râu dòng Premium. Dung tích: 2oz; Loại: Beard oil; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Honest_Amish/Honest_Amish_Premium_Beard_Oil_2oz/Honest_Amish_Premium_Beard_Oil_2oz_01.jpg', 398000, 517000, N'Đang bán'),
('SP114', 'DM08', 'NCC05', N'Honest Amish Pure Beard Oil 2oz', N'Dầu dưỡng râu không mùi. Dung tích: 2oz; Loại: Beard oil; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Honest_Amish/Honest_Amish_Pure_Beard_Oil_2oz/Honest_Amish_Pure_Beard_Oil_2oz_01.jpg', 279000, 363000, N'Đang bán'),
('SP115', 'DM08', 'NCC05', N'Honest Amish Original Beard Wax 2oz', N'Sáp tạo kiểu và giữ nếp râu. Dung tích: 2oz; Loại: Beard wax; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Honest_Amish/Honest_Amish_Original_Beard_Wax_2oz/Honest_Amish_Original_Beard_Wax_2oz_01.jpg', 257000, 334000, N'Đang bán'),
('SP116', 'DM08', 'NCC04', N'Reuzel Beard Balm 35g', N'Balm dưỡng và tạo kiểu râu. Dung tích: 35g; Loại: Beard balm; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Reuzel_Beard/Reuzel_Beard_Balm_35g/Reuzel_Beard_Balm_35g_01.jpg', 362000, 470000, N'Đang bán'),
('SP117', 'DM08', 'NCC04', N'Reuzel Beard Foam', N'Bọt làm sạch và dưỡng râu. Dung tích: 70ml; Loại: Beard foam; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Reuzel_Beard/Reuzel_Beard_Foam/Reuzel_Beard_Foam_01.jpg', 352000, 458000, N'Đang bán'),
('SP118', 'DM08', 'NCC04', N'Reuzel Beard Wash 200ml', N'Sữa rửa râu. Dung tích: 200ml; Loại: Beard wash; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Reuzel_Beard/Reuzel_Beard_Wash_200ml/Reuzel_Beard_Wash_200ml_01.jpg', 394000, 512000, N'Đang bán'),
('SP119', 'DM08', 'NCC04', N'Reuzel Refresh No Rinse Beard Wash 100ml', N'Sữa rửa râu không cần xả lại. Dung tích: 100ml; Loại: Beard wash (no rinse); Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Reuzel_Beard/Reuzel_Refresh_No_Rinse_Beard_Wash_100ml/Reuzel_Refresh_No_Rinse_Beard_Wash_100ml_01.jpg', 291000, 378000, N'Đang bán'),
('SP120', 'DM08', 'NCC04', N'Reuzel Beard Oil', N'Dầu dưỡng râu. Dung tích: —; Loại: Beard oil; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Reuzel_Beard/Reuzel_Beard_Oil/Reuzel_Beard_Oil_01.jpg', 452000, 588000, N'Đang bán'),
('SP121', 'DM08', 'NCC04', N'Reuzel Wood & Spice Beard Foam 70ml', N'Bọt làm sạch và dưỡng râu mùi Wood & Spice. Dung tích: 70ml; Loại: Beard foam; Giữ nếp: —; Finish: —; Phù hợp: Nam, có râu.', N'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Reuzel_Beard/Reuzel_Wood_And_Spice_Beard_Foam_70ml/Reuzel_Wood_And_Spice_Beard_Foam_70ml_01.jpg', 367000, 477000, N'Đang bán'),
('SP122', 'DM09', 'NCC07', N'Blue Zoo Afro Pick', N'Lược chải pomade. Dung tích: —; Loại: Lược chải pomade; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/Luoc_Ban_Cha_Pomade/Luoc_Ban_Cha_Pomade_Blue_Zoo_Afro_Pick/Luoc_Ban_Cha_Pomade_Blue_Zoo_Afro_Pick_01.jpg', 50000, 75000, N'Đang bán'),
('SP123', 'DM09', 'NCC04', N'Uppercut Deluxe CT9 Styling Comb', N'Lược tạo kiểu tóc nam. Dung tích: —; Loại: Lược tạo kiểu; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/Luoc_Ban_Cha_Pomade/Luoc_Ban_Cha_Pomade_Uppercut_Deluxe_CT9_Styling_Comb/Luoc_Ban_Cha_Pomade_Uppercut_Deluxe_CT9_Styling_Comb_01.jpg', 299000, 389000, N'Đang bán'),
('SP124', 'DM09', 'NCC05', N'Suavecito Deluxe Amber Texture Comb', N'Lược tạo texture và chải pomade. Dung tích: —; Loại: Lược tạo texture; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/Luoc_Ban_Cha_Pomade/Luoc_Ban_Cha_Pomade_Suavecito_Deluxe_Amber_Texture_Comb/Luoc_Ban_Cha_Pomade_Suavecito_Deluxe_Amber_Texture_Comb_01.jpg', 281000, 365000, N'Đang bán'),
('SP125', 'DM09', 'NCC07', N'Y.S. Park Dragon Air Vent Styler', N'Lược sấy tạo kiểu thoáng khí. Dung tích: —; Loại: Lược sấy tạo kiểu; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/Luoc_Ban_Nguyet/Luoc_Ban_Nguyet_YS_Park_Dragon_Air_Vent_Styler/Luoc_Ban_Nguyet_YS_Park_Dragon_Air_Vent_Styler_01.jpg', 663000, 862000, N'Đang bán'),
('SP126', 'DM09', 'NCC07', N'Chaoba Lược Bán Nguyệt', N'Lược bán nguyệt sấy tạo phồng tóc nam. Dung tích: —; Loại: Lược bán nguyệt; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/Luoc_Ban_Nguyet/Luoc_Ban_Nguyet_Chaoba/Luoc_Ban_Nguyet_Chaoba_01.jpg', 25000, 45000, N'Đang bán'),
('SP127', 'DM09', 'NCC07', N'Denman D4 Large Styling Brush 9 Row', N'Lược chải tạo kiểu 9 hàng. Dung tích: —; Loại: Lược chải tạo kiểu; Giữ nếp: —; Finish: —; Phù hợp: Nam.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/Luoc_Ban_Nguyet/Luoc_Ban_Nguyet_Denman_D4_Large_Styling_Brush_9_Row/Luoc_Ban_Nguyet_Denman_D4_Large_Styling_Brush_9_Row_01.jpg', 426000, 554000, N'Đang bán'),
('SP128', 'DM09', 'NCC07', N'Panasonic Nanoe EH-NA7M-H645 1600W', N'Máy sấy tóc tạo kiểu Nanoe. Dung tích: —; Loại: Máy sấy tóc (1600W); Giữ nếp: —; Finish: —; Phù hợp: Nam, nữ.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/May_Say_Toc_Tao_Kieu/May_Say_Toc_Tao_Kieu_Panasonic_Nanoe_EH_NA7M_H645/May_Say_Toc_Tao_Kieu_Panasonic_Nanoe_EH_NA7M_H645_01.jpg', 1685000, 2190000, N'Đang bán'),
('SP129', 'DM09', 'NCC07', N'Panasonic EH_NA67', N'Máy sấy và tạo kiểu tóc 3 trong 1. Dung tích: —; Loại: Máy sấy tạo kiểu; Giữ nếp: —; Finish: —; Phù hợp: Nam, nữ.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/May_Say_Toc_Tao_Kieu/May_Say_Toc_Tao_Kieu_Panasonic_EH_NA67/May_Say_Toc_Tao_Kieu_Panasonic_EH_NA67_01.jpg', 2010000, 2613000, N'Đang bán'),
('SP130', 'DM09', 'NCC07', N'Philips BHD350/10', N'Máy sấy tóc ion 2100W. Dung tích: —; Loại: Máy sấy tóc (2100W); Giữ nếp: —; Finish: —; Phù hợp: Nam, nữ.', N'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/May_Say_Toc_Tao_Kieu/May_Say_Toc_Tao_Kieu_Philips_BHD350_10/May_Say_Toc_Tao_Kieu_Philips_BHD350_10_01.jpg', 838000, 1090000, N'Đang bán');

-- =========================================================================
-- 8. 80 NHÂN VIÊN, 20 KHÁCH HÀNG & 100 TÀI KHOẢN
-- =========================================================================

-- 80 Nhân sự (20 Quản lý, 20 Thợ chính, 20 Thợ phụ, 20 Thu ngân)
INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, CapBac, ChucVu, TrangThai) VALUES
('NV00', 'CN01', N'Lê Minh Hoàng',     '19008899',   'admin@omnisalon.vn',   N'Chủ Tịch HĐQT',  N'Quản trị viên',     N'Đang làm việc'),
-- CN01
('NV01', 'CN01', N'Lê Hoàng Hải',     '0912001001', 'hai.lh@salontoc.vn',    N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV02', 'CN01', N'Đỗ Đình Độ',       '0912001002', 'do.dd@salontoc.vn',     N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV03', 'CN01', N'Lê Hữu Luân',      '0912001003', 'luan.lh@salontoc.vn',   N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV61', 'CN01', N'Nguyễn Thảo My',    '0912021001', 'my.nt@salontoc.vn',     N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN02
('NV04', 'CN02', N'Phạm Thu Thảo',    '0912002001', 'thao.pt@salontoc.vn',   N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV05', 'CN02', N'Trần Quốc Huy',    '0912002002', 'huy.tq@salontoc.vn',    N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV06', 'CN02', N'Nguyễn Minh Triết','0912002003', 'triet.nm@salontoc.vn', N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV62', 'CN02', N'Trần Bích Phương',  '0912021002', 'phuong.tb@salontoc.vn', N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN03
('NV07', 'CN03', N'Võ Quốc Bảo',      '0912003001', 'bao.vq@salontoc.vn',    N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV08', 'CN03', N'Đặng Hoài Nam',    '0912003002', 'nam.dh@salontoc.vn',    N'Senior Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV09', 'CN03', N'Bùi Tuấn Anh',     '0912003003', 'anh.bt@salontoc.vn',    N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV63', 'CN03', N'Lê Ngọc Hân',       '0912021003', 'han.ln@salontoc.vn',    N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN04
('NV10', 'CN04', N'Phan Thanh Tùng',  '0912004001', 'tung.pt@salontoc.vn',   N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV11', 'CN04', N'Hà Quốc Trọng',    '0912004002', 'trong.hq@salontoc.vn',  N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV12', 'CN04', N'Ngô Gia Huy',      '0912004003', 'huy.ng@salontoc.vn',    N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV64', 'CN04', N'Phạm Quỳnh Nga',    '0912021004', 'nga.pq@salontoc.vn',    N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN05
('NV13', 'CN05', N'Trần Đức Minh',    '0912005001', 'minh.td@salontoc.vn',   N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV14', 'CN05', N'Dương Hoàng Long', '0912005002', 'long.dh@salontoc.vn',  N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV15', 'CN05', N'Lê Minh Khang',    '0912005003', 'khang.lm@salontoc.vn',  N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV65', 'CN05', N'Hoàng Thùy Linh',   '0912021005', 'linh.ht@salontoc.vn',   N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN06
('NV16', 'CN06', N'Nguyễn Hữu Đạt',   '0912006001', 'dat.nh@salontoc.vn',    N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV17', 'CN06', N'Trịnh Xuân Phong', '0912006002', 'phong.tx@salontoc.vn', N'Senior Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV18', 'CN06', N'Vũ Hữu Phước',     '0912006003', 'phuoc.vh@salontoc.vn',  N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV66', 'CN06', N'Đỗ Mỹ Linh',        '0912021006', 'linh.dm@salontoc.vn',   N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN07
('NV19', 'CN07', N'Võ Hoàng Sơn',     '0912007001', 'son.vh@salontoc.vn',    N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV20', 'CN07', N'Đinh Trọng Nghĩa', '0912007002', 'nghia.dt@salontoc.vn', N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV21', 'CN07', N'Phạm Nhật Tân',    '0912007003', 'tan.pn@salontoc.vn',    N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV67', 'CN07', N'Vũ Phương Ly',      '0912021007', 'ly.vp@salontoc.vn',     N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN08
('NV22', 'CN08', N'Lý Thành Danh',    '0912008001', 'danh.lt@salontoc.vn',   N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV23', 'CN08', N'Đỗ Thái Bảo',      '0912008002', 'bao.dt@salontoc.vn',    N'Senior Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV24', 'CN08', N'Trần Vĩnh Phát',   '0912008003', 'phat.tv@salontoc.vn',   N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV68', 'CN08', N'Đặng Thu Hà',       '0912021008', 'ha.dt@salontoc.vn',     N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN09
('NV25', 'CN09', N'Hồ Quang Hiếu',    '0912009001', 'hieu.hq@salontoc.vn',   N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV26', 'CN09', N'Lâm Trường Giang', '0912009002', 'giang.lt@salontoc.vn', N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV27', 'CN09', N'Đoàn Văn Hậu',     '0912009003', 'hau.dv@salontoc.vn',    N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV69', 'CN09', N'Bùi Ánh Tuyết',     '0912021009', 'tuyet.ba@salontoc.vn',  N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN10
('NV28', 'CN10', N'Nguyễn Quang Dũng','0912010001', 'dung.nq@salontoc.vn',  N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV29', 'CN10', N'Bùi Tiến Dũng',    '0912010002', 'dung.bt@salontoc.vn',   N'Senior Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV30', 'CN10', N'Võ Đình Trọng',    '0912010003', 'trong.vd@salontoc.vn',  N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV70', 'CN10', N'Ngô Thanh Vân',     '0912021010', 'van.nt@salontoc.vn',    N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN11
('NV31', 'CN11', N'Trương Minh Tuấn', '0912011001', 'tuan.tm@salontoc.vn',  N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV32', 'CN11', N'Lê Minh Nhựt',     '0912011002', 'nhut.lm@salontoc.vn',   N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV33', 'CN11', N'Trần Khải Hoàn',   '0912011003', 'hoan.tk@salontoc.vn',   N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV71', 'CN11', N'Dương Cẩm Lynh',    '0912021011', 'lynh.dc@salontoc.vn',   N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN12
('NV34', 'CN12', N'Đặng Quốc Việt',   '0912012001', 'viet.dq@salontoc.vn',   N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV35', 'CN12', N'Cao Xuân Trường',  '0912012002', 'truong.cx@salontoc.vn', N'Senior Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV36', 'CN12', N'Nguyễn Hữu Thắng', '0912012003', 'thang.nh@salontoc.vn', N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV72', 'CN12', N'Lý Nhã Kỳ',         '0912021012', 'ky.ln@salontoc.vn',     N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN13
('NV37', 'CN13', N'Hà Anh Tuấn',      '0912013001', 'tuan.ha@salontoc.vn',   N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV38', 'CN13', N'Phan Đình Phùng',  '0912013002', 'phung.pd@salontoc.vn',  N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV39', 'CN13', N'Lương Thế Vinh',   '0912013003', 'vinh.lt@salontoc.vn',   N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV73', 'CN13', N'Mai Phương Thúy',   '0912021013', 'thuy.mp@salontoc.vn',   N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN14
('NV40', 'CN14', N'Tô Hiến Thành',    '0912014001', 'thanh.th@salontoc.vn',  N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV41', 'CN14', N'Nguyễn Trãi',      '0912014002', 'trai.nt@salontoc.vn',   N'Senior Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV42', 'CN14', N'Lê Lợi An',        '0912014003', 'an.lla@salontoc.vn',    N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV74', 'CN14', N'Trịnh Kim Chi',     '0912021014', 'chi.tk@salontoc.vn',    N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN15
('NV43', 'CN15', N'Trần Bình Trọng',  '0912015001', 'trong.tb@salontoc.vn',  N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV44', 'CN15', N'Phạm Ngũ Lão',     '0912015002', 'lao.pn@salontoc.vn',    N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV45', 'CN15', N'Yết Kiêu Hoàng',   '0912015003', 'hoang.yk@salontoc.vn',  N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV75', 'CN15', N'Hà Kiều Anh',       '0912021015', 'anh.hk@salontoc.vn',    N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN16
('NV46', 'CN16', N'Dã Tượng Khang',   '0912016001', 'khang.dt@salontoc.vn',  N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV47', 'CN16', N'Trần Hưng Long',   '0912016002', 'long.th@salontoc.vn',   N'Senior Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV48', 'CN16', N'Lý Thường Kiệt B', '0912016003', 'kiet.ltb@salontoc.vn', N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV76', 'CN16', N'Trần Tiểu Vy',      '0912021016', 'vy.tt@salontoc.vn',     N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN17
('NV49', 'CN17', N'Quang Trung Vũ',   '0912017001', 'vu.qt@salontoc.vn',     N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV50', 'CN17', N'Ngô Quyền Sang',   '0912017002', 'sang.nq@salontoc.vn',   N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV51', 'CN17', N'Đinh Bộ Lĩnh Đức', '0912017003', 'duc.dbl@salontoc.vn',  N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV77', 'CN17', N'Lương Thùy Linh',   '0912021017', 'linh.lt@salontoc.vn',   N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN18
('NV52', 'CN18', N'Lê Đại Hành Khôi', '0912018001', 'khoi.ldh@salontoc.vn', N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV53', 'CN18', N'Phùng Hưng Thịnh', '0912018002', 'thinh.ph@salontoc.vn', N'Senior Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV54', 'CN18', N'Mai Hắc Đế Cường', '0912018003', 'cuong.mhd@salontoc.vn',N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV78', 'CN18', N'Nguyễn Thúc Thùy Tiên', '0912021018', 'tien.ntt@salontoc.vn', N'Nhân viên', N'Thu ngân',          N'Đang làm việc'),
-- CN19
('NV55', 'CN19', N'Triệu Quang Phục', '0912019001', 'phuc.tqp@salontoc.vn', N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV56', 'CN19', N'Lý Nam Đế Toàn',   '0912019002', 'toan.lnd@salontoc.vn', N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV57', 'CN19', N'Khúc Thừa Dụ Tâm', '0912019003', 'tam.ktd@salontoc.vn',  N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV79', 'CN19', N'Đoàn Thiên Ân',     '0912021019', 'an.dt@salontoc.vn',    N'Nhân viên',      N'Thu ngân',          N'Đang làm việc'),
-- CN20
('NV58', 'CN20', N'Nguyễn Huệ Tân',   '0912020001', 'tan.nh@salontoc.vn',    N'Quản lý',        N'Quản lý chi nhánh', N'Đang làm việc'),
('NV59', 'CN20', N'Nguyễn Lữ Khoa',   '0912020002', 'khoa.nl@salontoc.vn',   N'Master Barber',  N'Thợ chính',         N'Đang làm việc'),
('NV60', 'CN20', N'Nguyễn Nhạc Bình', '0912020003', 'binh.nn@salontoc.vn',   N'Junior Barber',  N'Thợ phụ',           N'Đang làm việc'),
('NV80', 'CN20', N'Huỳnh Thị Thanh Thủy', '0912021020', 'thuy.htt@salontoc.vn', N'Nhân viên', N'Thu ngân',          N'Đang làm việc');

-- 20 Khách hàng
INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh) VALUES
('KH01', N'Ngô Văn Tuấn',    '0988000001', 'vantuan@gmail.com',    '1998-05-14'),
('KH02', N'Trần Mỹ Linh',    '0988000002', 'mylinh.tran@gmail.com','2001-11-20'),
('KH03', N'Đặng Thanh Tùng', '0988000003', 'thanhtung.dang@gmail.com','1995-03-08'),
('KH04', N'Vũ Phương Thảo',  '0988000004', 'phuongthao.vu@gmail.com','2000-09-12'),
('KH05', N'Lê Minh Khôi',    '0988000005', 'minhkhoi.le@gmail.com','1992-07-24'),
('KH06', N'Hoàng Trọng Nghĩa','0988000006', 'nghia.ht@gmail.com',  '2001-09-12'),
('KH07', N'Trần Đình Phong', '0988000007', 'phong.td@gmail.com',   '1999-12-05'),
('KH08', N'Nguyễn Hải Đăng', '0988000008', 'haidang.nguyen@gmail.com','1997-04-18'),
('KH09', N'Dương Gia Bảo',   '0988000009', 'giabao.duong@gmail.com','2002-08-25'),
('KH10', N'Phan Hoàng Long', '0988000010', 'hoanglong.phan@gmail.com','1996-10-30'),
('KH11', N'Đinh Quốc Việt',  '0988000011', 'quocviet.dinh@gmail.com','1994-01-15'),
('KH12', N'Lâm Thanh Sơn',   '0988000012', 'thanhson.lam@gmail.com','1998-12-02'),
('KH13', N'Mai Tấn Phát',    '0988000013', 'tanphat.mai@gmail.com', '2003-06-19'),
('KH14', N'Trương Hoàng Phúc','0988000014','hoangphuc.truong@gmail.com','1997-02-28'),
('KH15', N'Võ Hoài Nam',     '0988000015', 'hoainam.vo@gmail.com', '1995-11-11'),
('KH16', N'Đoàn Hữu Tài',    '0988000016', 'huutai.doan@gmail.com', '2000-03-22'),
('KH17', N'Cao Minh Đạt',    '0988000017', 'minhdat.cao@gmail.com', '1993-07-07'),
('KH18', N'Bùi Quang Huy',   '0988000018', 'quanghuy.bui@gmail.com','1999-05-09'),
('KH19', N'Hồ Văn Cường',    '0988000019', 'vancuong.ho@gmail.com', '2001-10-14'),
('KH20', N'Trịnh Công Minh', '0988000020', 'congminh.trinh@gmail.com','1996-08-08');

-- 100 Tài khoản (80 Nhân sự + 20 Khách hàng)
-- =========================================================================
-- 8.1. KHỞI TẠO TƯỜNG MINH 100 TÀI KHOẢN (80 NHÂN VIÊN + 20 KHÁCH HÀNG)
-- =========================================================================

-- 1. TÀI KHOẢN 80 NHÂN SỰ (20 Quản lý, 40 Thợ cắt/Barber, 20 Thu ngân)
INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao) VALUES
('TK_ADMIN', 'NV00', NULL, 'admin', 'admin123',     N'Quản trị viên', N'Hoạt động', '2026-01-01 08:00:00'),
-- CN01
('TK_NV01', 'NV01', NULL, 'user_nv01', 'LeHoangHai',     N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV02', 'NV02', NULL, 'user_nv02', 'DoDinhDo',       N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV03', 'NV03', NULL, 'user_nv03', 'LeHuuLuan',      N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV61', 'NV61', NULL, 'user_nv61', 'NguyenThaoMy',   N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN02
('TK_NV04', 'NV04', NULL, 'user_nv04', 'PhamThuThao',   N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV05', 'NV05', NULL, 'user_nv05', 'TranQuocHuy',   N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV06', 'NV06', NULL, 'user_nv06', 'NguyenMinhTriet',N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV62', 'NV62', NULL, 'user_nv62', 'TranBichPhuong', N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN03
('TK_NV07', 'NV07', NULL, 'user_nv07', 'VoQuocBao',     N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV08', 'NV08', NULL, 'user_nv08', 'DangHoaiNam',   N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV09', 'NV09', NULL, 'user_nv09', 'BuiTuanAnh',    N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV63', 'NV63', NULL, 'user_nv63', 'LeNgocHan',     N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN04
('TK_NV10', 'NV10', NULL, 'user_nv10', 'PhanThanhTung', N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV11', 'NV11', NULL, 'user_nv11', 'HaQuocTrong',   N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV12', 'NV12', NULL, 'user_nv12', 'NgoGiaHuy',     N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV64', 'NV64', NULL, 'user_nv64', 'PhamQuynhNga',  N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN05
('TK_NV13', 'NV13', NULL, 'user_nv13', 'TranDucMinh',   N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV14', 'NV14', NULL, 'user_nv14', 'DuongHoangLong',N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV15', 'NV15', NULL, 'user_nv15', 'LeMinhKhang',   N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV65', 'NV65', NULL, 'user_nv65', 'HoangThuyLinh', N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN06
('TK_NV16', 'NV16', NULL, 'user_nv16', 'NguyenHuuDat',  N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV17', 'NV17', NULL, 'user_nv17', 'TrinhXuanPhong',N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV18', 'NV18', NULL, 'user_nv18', 'VuHuuPhuoc',    N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV66', 'NV66', NULL, 'user_nv66', 'DoMyLinh',      N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN07
('TK_NV19', 'NV19', NULL, 'user_nv19', 'VoHoangSon',    N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV20', 'NV20', NULL, 'user_nv20', 'DinhTrongNghia',N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV21', 'NV21', NULL, 'user_nv21', 'PhamNhatTan',   N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV67', 'NV67', NULL, 'user_nv67', 'VuPhuongLy',    N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN08
('TK_NV22', 'NV22', NULL, 'user_nv22', 'LyThanhDanh',   N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV23', 'NV23', NULL, 'user_nv23', 'DoThaiBao',     N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV24', 'NV24', NULL, 'user_nv24', 'TranVinhPhat',  N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV68', 'NV68', NULL, 'user_nv68', 'DangThuHa',     N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN09
('TK_NV25', 'NV25', NULL, 'user_nv25', 'HoQuangHieu',   N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV26', 'NV26', NULL, 'user_nv26', 'LamTruongGiang',N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV27', 'NV27', NULL, 'user_nv27', 'DoanVanHau',    N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV69', 'NV69', NULL, 'user_nv69', 'BuiAnhTuyet',   N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN10
('TK_NV28', 'NV28', NULL, 'user_nv28', 'NguyenQuangDung',N'Quản lý',  N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV29', 'NV29', NULL, 'user_nv29', 'BuiTienDung',   N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV30', 'NV30', NULL, 'user_nv30', 'VoDinhTrong',   N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV70', 'NV70', NULL, 'user_nv70', 'NgoThanhVan',   N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN11
('TK_NV31', 'NV31', NULL, 'user_nv31', 'TruongMinhTuan',N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV32', 'NV32', NULL, 'user_nv32', 'LeMinhNhut',    N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV33', 'NV33', NULL, 'user_nv33', 'TranKhaiHoan',  N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV71', 'NV71', NULL, 'user_nv71', 'DuongCamLynh',  N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN12
('TK_NV34', 'NV34', NULL, 'user_nv34', 'DangQuocViet',  N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV35', 'NV35', NULL, 'user_nv35', 'CaoXuanTruong', N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV36', 'NV36', NULL, 'user_nv36', 'NguyenHuuThang',N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV72', 'NV72', NULL, 'user_nv72', 'LyNhaKy',       N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN13
('TK_NV37', 'NV37', NULL, 'user_nv37', 'HaAnhTuan',     N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV38', 'NV38', NULL, 'user_nv38', 'PhanDinhPhung', N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV39', 'NV39', NULL, 'user_nv39', 'LuongTheVinh',  N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV73', 'NV73', NULL, 'user_nv73', 'MaiPhuongThuy', N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN14
('TK_NV40', 'NV40', NULL, 'user_nv40', 'ToHienThanh',   N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV41', 'NV41', NULL, 'user_nv41', 'NguyenTrai',    N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV42', 'NV42', NULL, 'user_nv42', 'LeLoiAn',       N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV74', 'NV74', NULL, 'user_nv74', 'TrinhKimChi',   N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN15
('TK_NV43', 'NV43', NULL, 'user_nv43', 'TranBinhTrong', N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV44', 'NV44', NULL, 'user_nv44', 'PhamNguLao',    N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV45', 'NV45', NULL, 'user_nv45', 'YetKieuHoang',  N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV75', 'NV75', NULL, 'user_nv75', 'HaKieuAnh',     N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN16
('TK_NV46', 'NV46', NULL, 'user_nv46', 'DaTuongKhang',  N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV47', 'NV47', NULL, 'user_nv47', 'TranHungLong',  N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV48', 'NV48', NULL, 'user_nv48', 'LyThuongKietB', N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV76', 'NV76', NULL, 'user_nv76', 'TranTieuVy',    N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN17
('TK_NV49', 'NV49', NULL, 'user_nv49', 'QuangTrungVu',  N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV50', 'NV50', NULL, 'user_nv50', 'NgoQuyenSang',  N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV51', 'NV51', NULL, 'user_nv51', 'DinhBoLinhDuc', N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV77', 'NV77', NULL, 'user_nv77', 'LuongThuyLinh', N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN18
('TK_NV52', 'NV52', NULL, 'user_nv52', 'LeDaiHanhKhoi',N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV53', 'NV53', NULL, 'user_nv53', 'PhungHungThinh',N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV54', 'NV54', NULL, 'user_nv54', 'MaiHacDeCuong', N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV78', 'NV78', NULL, 'user_nv78', 'NguyenThucThuyTien', N'Thu ngân', N'Hoạt động', '2026-01-01 08:00:00'),
-- CN19
('TK_NV55', 'NV55', NULL, 'user_nv55', 'TrieuQuangPhuc',N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV56', 'NV56', NULL, 'user_nv56', 'LyNamDeToan',  N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV57', 'NV57', NULL, 'user_nv57', 'KhucThuaDuTam', N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV79', 'NV79', NULL, 'user_nv79', 'DoanThienAn',   N'Thu ngân',  N'Hoạt động', '2026-01-01 08:00:00'),
-- CN20
('TK_NV58', 'NV58', NULL, 'user_nv58', 'NguyenHueTan',  N'Quản lý',   N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV59', 'NV59', NULL, 'user_nv59', 'NguyenLuKhoa',  N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV60', 'NV60', NULL, 'user_nv60', 'NguyenNhacBinh',N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV80', 'NV80', NULL, 'user_nv80', 'HuynhThiThanhThuy', N'Thu ngân', N'Hoạt động', '2026-01-01 08:00:00');

-- 2. TÀI KHOẢN 20 KHÁCH HÀNG (KH01 -> KH20)
INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao) VALUES
('TK_KH01', NULL, 'KH01', 'user_kh01', 'NgoVanTuan',     N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH02', NULL, 'KH02', 'user_kh02', 'TranMyLinh',     N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH03', NULL, 'KH03', 'user_kh03', 'DangThanhTung',  N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH04', NULL, 'KH04', 'user_kh04', 'VuPhuongThao',   N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH05', NULL, 'KH05', 'user_kh05', 'LeMinhKhoi',     N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH06', NULL, 'KH06', 'user_kh06', 'HoangTrongNghia',N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH07', NULL, 'KH07', 'user_kh07', 'TranDinhPhong',  N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH08', NULL, 'KH08', 'user_kh08', 'NguyenHaiDang',  N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH09', NULL, 'KH09', 'user_kh09', 'DuongGiaBao',    N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH10', NULL, 'KH10', 'user_kh10', 'PhanHoangLong',  N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH11', NULL, 'KH11', 'user_kh11', 'DinhQuocViet',   N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH12', NULL, 'KH12', 'user_kh12', 'LamThanhSon',    N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH13', NULL, 'KH13', 'user_kh13', 'MaiTanPhat',     N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH14', NULL, 'KH14', 'user_kh14', 'TruongHoangPhuc',N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH15', NULL, 'KH15', 'user_kh15', 'VoHoaiNam',      N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH16', NULL, 'KH16', 'user_kh16', 'DoanHuuTai',     N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH17', NULL, 'KH17', 'user_kh17', 'CaoMinhDat',     N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH18', NULL, 'KH18', 'user_kh18', 'BuiQuangHuy',    N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH19', NULL, 'KH19', 'user_kh19', 'HoVanCuong',     N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00'),
('TK_KH20', NULL, 'KH20', 'user_kh20', 'TrinhCongMinh',  N'Khách hàng', N'Hoạt động', '2026-02-01 08:00:00');
GO

INSERT INTO ThongBao (MaThongBao, MaTaiKhoan, MaKhachHang, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, TrangThaiDoc) VALUES
('TB01', 'TK_NV01', NULL, N'Thông báo họp định kỳ', N'Họp tổng kết tuần chi nhánh Q1 vào sáng thứ 2', N'Nội bộ', '2026-09-20 08:30:00', 1),
('TB02', NULL, 'KH01', N'Xác nhận lịch hẹn làm tóc', N'Lịch hẹn của bạn vào ngày 2026-09-25 lúc 09:00 đã được tiếp nhận', N'Lịch hẹn', '2026-09-24 15:00:00', 1),
('TB03', NULL, 'KH02', N'Khuyến mãi tháng 10', N'Nhận ngay voucher giảm giá 15% cho dịch vụ nhuộm tóc', N'Khuyến mãi', '2026-10-01 09:00:00', 0);

INSERT INTO CaLamViec (MaCa, MaNhanVien, NgayLam, GioBatDau, GioKetThuc, TrangThai) VALUES
('CA01', 'NV02', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA02', 'NV05', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA03', 'NV08', '2026-10-08', '09:00:00', '18:00:00', N'Đang diễn ra'),
('CA04', 'NV11', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA05', 'NV14', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA06', 'NV17', '2026-10-08', '09:00:00', '18:00:00', N'Đang diễn ra'),
('CA07', 'NV20', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA08', 'NV23', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA09', 'NV26', '2026-10-08', '09:00:00', '18:00:00', N'Đang diễn ra'),
('CA10', 'NV29', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA11', 'NV32', '2026-10-08', '09:00:00', '18:00:00', N'Đang diễn ra'),
('CA12', 'NV35', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA13', 'NV38', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA14', 'NV41', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA15', 'NV44', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA16', 'NV47', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA17', 'NV50', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA18', 'NV53', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA19', 'NV56', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra'),
('CA20', 'NV59', '2026-10-08', '08:30:00', '17:30:00', N'Đang diễn ra');

INSERT INTO KhuyenMai (MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, DoiTuongApDung, NgayBatDau, NgayKetThuc, TrangThai) VALUES
('KM01', N'Chào Thu Rực Rỡ', N'Giảm giá %', 10.00, N'Tất cả khách hàng', '2026-09-01', '2026-10-31', N'Đang áp dụng'),
('KM02', N'Đặc quyền Salon VIP', N'Giảm giá %', 15.00, N'Hội viên thân thiết', '2026-01-01', '2026-12-31', N'Đang áp dụng');

INSERT INTO KhuyenMai_DichVu (MaKhuyenMai, MaDichVu) VALUES
('KM01', 'DV03'),
('KM01', 'DV04'),
('KM02', 'DV05');

INSERT INTO KhuyenMai_SanPham (MaKhuyenMai, MaSanPham) VALUES
('KM01', 'SP01'),
('KM02', 'SP06');

-- =========================================================================
-- 9. PHIẾU NHẬP KHO & 2.600 CHI TIẾT NHẬP (130 SẢN PHẨM PHỦ ĐỦ 20 CHI NHÁNH)
-- =========================================================================
ALTER TABLE PhieuNhapKho DISABLE TRIGGER trg_PhieuNhapKho_CapNhatTonKho;

-- Khởi tạo 20 Phiếu nhập kho cho 20 chi nhánh
INSERT INTO PhieuNhapKho (MaPhieuNhap, MaChiNhanh, MaNhanVien, MaNguoiDuyet, MaNhaCungCap, NgayLap, LyDoTuChoi, TongTien, NgayDuyet, TrangThai) VALUES
('PN01', 'CN01', 'NV03', 'NV01', 'NCC05', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN02', 'CN02', 'NV06', 'NV04', 'NCC05', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN03', 'CN03', 'NV09', 'NV07', 'NCC05', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN04', 'CN04', 'NV12', 'NV10', 'NCC05', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN05', 'CN05', 'NV15', 'NV13', 'NCC04', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN06', 'CN06', 'NV18', 'NV16', 'NCC04', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN07', 'CN07', 'NV21', 'NV19', 'NCC04', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN08', 'CN08', 'NV24', 'NV22', 'NCC05', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN09', 'CN09', 'NV27', 'NV25', 'NCC01', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN10', 'CN10', 'NV30', 'NV28', 'NCC02', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN11', 'CN11', 'NV33', 'NV31', 'NCC06', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN12', 'CN12', 'NV36', 'NV34', 'NCC04', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN13', 'CN13', 'NV39', 'NV37', 'NCC04', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN14', 'CN14', 'NV42', 'NV40', 'NCC07', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN15', 'CN15', 'NV45', 'NV43', 'NCC05', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN16', 'CN16', 'NV48', 'NV46', 'NCC01', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN17', 'CN17', 'NV51', 'NV49', 'NCC05', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN18', 'CN18', 'NV54', 'NV52', 'NCC05', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN19', 'CN19', 'NV57', 'NV55', 'NCC04', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt'),
('PN20', 'CN20', 'NV60', 'NV58', 'NCC07', '2026-09-01 09:00:00', NULL, 0, '2026-09-01 10:00:00', N'Đã duyệt');

-- CROSS JOIN giữa 20 Chi nhánh và 130 Sản phẩm
;WITH MatHangChiNhanh AS (
    SELECT 
        cn.MaChiNhanh,
        CAST(SUBSTRING(cn.MaChiNhanh, 3, 10) AS INT) AS BranchIndex,
        sp.MaSanPham,
        CAST(SUBSTRING(sp.MaSanPham, 3, 10) AS INT) AS ProductIndex,
        sp.GiaNhap,
        CASE 
            -- SP01: Chi nhánh CN01 có 20 cái, Chi nhánh CN02 có 10 cái
            WHEN cn.MaChiNhanh = 'CN01' AND sp.MaSanPham = 'SP01' THEN 20
            WHEN cn.MaChiNhanh = 'CN02' AND sp.MaSanPham = 'SP01' THEN 10
            -- Các sản phẩm và chi nhánh còn lại biến thiên từ 8 đến 35 sản phẩm
            ELSE 8 + ((CAST(SUBSTRING(sp.MaSanPham, 3, 10) AS INT) * 19 + CAST(SUBSTRING(cn.MaChiNhanh, 3, 10) AS INT) * 29 + 7) % 28)
        END AS SoLuongTinhToan
    FROM ChiNhanh cn
    CROSS JOIN SanPham sp
)
INSERT INTO ChiTietPhieuNhap 
(
    MaChiTietPhieuNhap, 
    MaPhieuNhap, 
    MaSanPham, 
    SoLo, 
    HanSuDung, 
    SoLuong, 
    SoLuongConLai, 
    DonGiaNhap, 
    ThanhTien
)
SELECT 
    CONCAT('CTPN', RIGHT('00' + CAST(BranchIndex AS VARCHAR(2)), 2), RIGHT('000' + CAST(ProductIndex AS VARCHAR(3)), 3)),
    CONCAT('PN', RIGHT('00' + CAST(BranchIndex AS VARCHAR(2)), 2)),
    MaSanPham,
    CONCAT('LO2026', RIGHT('00' + CAST(BranchIndex AS VARCHAR(2)), 2), 'A', RIGHT('000' + CAST(ProductIndex AS VARCHAR(3)), 3)),
    DATEADD(DAY, 240 + ((ProductIndex * 5 + BranchIndex * 7) % 180), '2026-10-01'),
    SoLuongTinhToan,
    SoLuongTinhToan,
    GiaNhap,
    GiaNhap * SoLuongTinhToan
FROM MatHangChiNhanh;

-- Rút hạn sử dụng lô CTPN01001 (SP01 tại CN01) về ngày 20/11/2026 để kiểm thử quy tắc giảm 40% QT03
UPDATE ChiTietPhieuNhap
SET HanSuDung = '2026-11-20'
WHERE MaChiTietPhieuNhap = 'CTPN01001';

-- Cập nhật tổng tiền sổ sách cho 20 phiếu nhập kho
UPDATE pnk
SET TongTien = c.Tong
FROM PhieuNhapKho pnk
JOIN (
    SELECT MaPhieuNhap, SUM(ThanhTien) AS Tong
    FROM ChiTietPhieuNhap
    GROUP BY MaPhieuNhap
) c ON pnk.MaPhieuNhap = c.MaPhieuNhap;

ALTER TABLE PhieuNhapKho ENABLE TRIGGER trg_PhieuNhapKho_CapNhatTonKho;

-- =========================================================================
-- 10. TỒN KHO THEO CHI NHÁNH (TỔNG CỘNG ĐỦ 2.600 DÒNG TỒN KHO)
-- =========================================================================
INSERT INTO TonKho (MaSanPham, MaChiNhanh, SoLuongTon, MucCanhBao, NgayCapNhat)
SELECT 
    ctpn.MaSanPham,
    pnk.MaChiNhanh,
    SUM(ctpn.SoLuongConLai),
    5,
    GETDATE()
FROM ChiTietPhieuNhap ctpn
JOIN PhieuNhapKho pnk ON ctpn.MaPhieuNhap = pnk.MaPhieuNhap
GROUP BY ctpn.MaSanPham, pnk.MaChiNhanh;

-- =========================================================================
-- 11. GIAO DỊCH LỊCH HẸN, ĐƠN HÀNG, HÓA ĐƠN & ĐÁNH GIÁ (ĐỒNG BỘ MÃ LÔ MỚI)
-- =========================================================================

-- 10 Lịch hẹn cho 10 chi nhánh (CN01 -> CN10)
INSERT INTO LichHen (MaLichHen, MaKhachHang, MaNhanVien, MaChiNhanh, NgayHen, GioBatDau, GioKetThuc, TrangThai, TongTien, TienCoc, GhiChu, LyDoHuy) VALUES
('LH01', 'KH01', 'NV02', 'CN01', '2026-10-10', '09:00:00', '10:00:00', N'Đã xác nhận', 120000, 0, N'Cắt Fade ngắn cao vuốt sáp', NULL),
('LH02', 'KH02', 'NV05', 'CN02', '2026-10-10', '10:00:00', '11:00:00', N'Đã xác nhận', 250000, 50000, N'Cắt & tạo kiểu layer', NULL),
('LH03', 'KH03', 'NV08', 'CN03', '2026-10-11', '14:00:00', '16:00:00', N'Đã xác nhận', 650000, 100000, N'Uốn tóc phồng Hàn Quốc', NULL),
('LH04', 'KH04', 'NV11', 'CN04', '2026-10-11', '15:00:00', '17:30:00', N'Đã xác nhận', 950000, 100000, N'Nhuộm tông xám khói', NULL),
('LH05', 'KH05', 'NV14', 'CN05', '2026-10-12', '09:30:00', '11:00:00', N'Đã xác nhận', 800000, 100000, N'Uốn tóc con sâu Dreadlocks cá tính', NULL),
('LH06', 'KH06', 'NV17', 'CN06', '2026-10-12', '10:30:00', '11:30:00', N'Đã xác nhận', 120000, 0, N'Khách quen đặt cắt định kỳ', NULL),
('LH07', 'KH07', 'NV20', 'CN07', '2026-10-13', '13:30:00', '15:30:00', N'Đã xác nhận', 650000, 100000, N'Uốn lọn xoăn Texture', NULL),
('LH08', 'KH08', 'NV23', 'CN08', '2026-10-13', '14:00:00', '15:00:00', N'Đã xác nhận', 250000, 50000, N'Cắt tỉa gọn tóc dài', NULL),
('LH09', 'KH09', 'NV26', 'CN09', '2026-10-14', '09:00:00', '11:30:00', N'Đã xác nhận', 950000, 100000, N'Nhuộm nâu hạt dẻ sáng', NULL),
('LH10', 'KH10', 'NV29', 'CN10', '2026-10-14', '16:00:00', '17:30:00', N'Đã xác nhận', 800000, 100000, N'Uốn tóc Ruffled phong cách hip-hop', NULL);


INSERT INTO ChiTietLichHen (MaChiTietLichHen, MaLichHen, MaDichVu, MaCombo, SoLuong, DonGia, ThanhTien) VALUES
('CTLH01', 'LH01', 'DV01', NULL,   1, 120000, 120000),
('CTLH02', 'LH02', NULL,   'CB01', 1, 300000, 300000),
('CTLH03', 'LH03', 'DV03', NULL,   1, 650000, 650000),
('CTLH04', 'LH04', 'DV04', NULL,   1, 950000, 950000),
('CTLH05', 'LH05', 'DV05', NULL,   1, 800000, 800000),
('CTLH06', 'LH06', 'DV01', NULL,   1, 120000, 120000),
('CTLH07', 'LH07', NULL,   'CB02', 1, 330000, 330000),
('CTLH08', 'LH08', 'DV02', NULL,   1, 250000, 250000),
('CTLH09', 'LH09', 'DV04', NULL,   1, 950000, 950000),
('CTLH10', 'LH10', NULL,   'CB03', 1, 790000, 790000);
GO

-- 10 Đơn hàng cho 10 chi nhánh (CN11 -> CN20)
ALTER TABLE ChiTietDonHang DISABLE TRIGGER trg_ChiTietDonHang_TruTonKho;

INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu) VALUES
('DH01', 'KH11', 'CN11', '2026-10-05 09:30:00', 286000, N'55 Xuân Thủy, P.Thảo Điền, TP.Thủ Đức', N'Giao hàng tận nơi', N'Đang giao', N'Giao giờ hành chính'),
('DH02', 'KH12', 'CN12', '2026-10-05 10:15:00', 525000, N'12 Hoàng Diệu, P.9, Q.4, TP.HCM',      N'Tại quầy',         N'Đã giao',   N'Khách nhận tại quầy CN12'),
('DH03', 'KH13', 'CN13', '2026-10-05 11:00:00', 390000, N'260 Hậu Giang, P.4, Q.6, TP.HCM',       N'Giao hàng tận nơi', N'Đang giao', N'Gọi trước khi giao'),
('DH04', 'KH14', 'CN14', '2026-10-06 14:20:00', 360000, N'180 Phạm Hùng, P.5, Q.8, TP.HCM',       N'Giao hàng tận nơi', N'Đã giao',   N'Để tại lễ tân chung cư'),
('DH05', 'KH15', 'CN15', '2026-10-06 15:45:00', 620000, N'85 Ông Ích Khiêm, P.10, Q.11, TP.HCM',   N'Tại quầy',         N'Đã giao',   N'Khách lấy sau khi tan làm'),
('DH06', 'KH16', 'CN16', '2026-10-07 09:10:00', 993000, N'45 Lê Văn Khương, P.Thới An, Q.12',     N'Giao hàng tận nơi', N'Chờ xử lý', N'Đóng gói cẩn thận chống sốc'),
('DH07', 'KH17', 'CN17', '2026-10-07 10:30:00', 419000, N'72 Lũy Bán Bích, P.Tân Thới Hòa, Tân Phú', N'Tại quầy',     N'Đang giao', N'Nhận vào buổi chiều'),
('DH08', 'KH18', 'CN18', '2026-10-07 13:00:00', 517000, N'110 Tên Lửa, P.Bình Trị Đông B, Bình Tân', N'Giao hàng tận nơi', N'Đang giao', N'Giao trước 18h tối'),
('DH09', 'KH19', 'CN19', '2026-10-07 14:15:00', 378000, N'35 Quốc lộ 50, X.Bình Hưng, Bình Chánh', N'Tại quầy',         N'Chờ xử lý', N'Khách qua salon lấy trực tiếp'),
('DH10', 'KH20', 'CN20', '2026-10-07 16:00:00', 862000, N'52 Lý Thường Kiệt, TT.Hóc Môn, Hóc Môn', N'Giao hàng tận nơi', N'Chờ xử lý', N'Giao vào sáng mai');

-- Mã lô liên kết chính xác theo chi nhánh nhận đơn: CTPN + [Mã CN] + [Mã SP]
INSERT INTO ChiTietDonHang (MaChiTietDonHang, MaDonHang, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES
('CTDH01', 'DH01', 'SP71',  'CTPN11071', 1, 286000, 0.00, 286000, 286000),
('CTDH02', 'DH02', 'SP77',  'CTPN12077', 1, 525000, 0.00, 525000, 525000),
('CTDH03', 'DH03', 'SP83',  'CTPN13083', 1, 390000, 0.00, 390000, 390000),
('CTDH04', 'DH04', 'SP89',  'CTPN14089', 1, 360000, 0.00, 360000, 360000),
('CTDH05', 'DH05', 'SP95',  'CTPN15095', 1, 620000, 0.00, 620000, 620000),
('CTDH06', 'DH06', 'SP101', 'CTPN16101', 1, 993000, 0.00, 993000, 993000),
('CTDH07', 'DH07', 'SP107', 'CTPN17107', 1, 419000, 0.00, 419000, 419000),
('CTDH08', 'DH08', 'SP113', 'CTPN18113', 1, 517000, 0.00, 517000, 517000),
('CTDH09', 'DH09', 'SP119', 'CTPN19119', 1, 378000, 0.00, 378000, 378000),
('CTDH10', 'DH10', 'SP125', 'CTPN20125', 1, 862000, 0.00, 862000, 862000);

-- Trừ tồn kho 1 đơn vị cho các lô tương ứng của đơn hàng
UPDATE ctpn
SET ctpn.SoLuongConLai = ctpn.SoLuongConLai - 1
FROM ChiTietPhieuNhap ctpn
WHERE ctpn.MaChiTietPhieuNhap IN ('CTPN11071', 'CTPN12077', 'CTPN13083', 'CTPN14089', 'CTPN15095', 'CTPN16101', 'CTPN17107', 'CTPN18113', 'CTPN19119', 'CTPN20125');

UPDATE tk
SET tk.SoLuongTon = tk.SoLuongTon - 1
FROM TonKho tk
WHERE (tk.MaSanPham = 'SP71'  AND tk.MaChiNhanh = 'CN11')
   OR (tk.MaSanPham = 'SP77'  AND tk.MaChiNhanh = 'CN12')
   OR (tk.MaSanPham = 'SP83'  AND tk.MaChiNhanh = 'CN13')
   OR (tk.MaSanPham = 'SP89'  AND tk.MaChiNhanh = 'CN14')
   OR (tk.MaSanPham = 'SP95'  AND tk.MaChiNhanh = 'CN15')
   OR (tk.MaSanPham = 'SP101' AND tk.MaChiNhanh = 'CN16')
   OR (tk.MaSanPham = 'SP107' AND tk.MaChiNhanh = 'CN17')
   OR (tk.MaSanPham = 'SP113' AND tk.MaChiNhanh = 'CN18')
   OR (tk.MaSanPham = 'SP119' AND tk.MaChiNhanh = 'CN19')
   OR (tk.MaSanPham = 'SP125' AND tk.MaChiNhanh = 'CN20');

ALTER TABLE ChiTietDonHang ENABLE TRIGGER trg_ChiTietDonHang_TruTonKho;
GO

-- Hóa đơn thanh toán
ALTER TABLE ChiTietHoaDon_SanPham DISABLE TRIGGER trg_ChiTietHoaDonSanPham_TruTonKho;

INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon) VALUES
('HD01', 'KH01', 'LH01', NULL,   'CN01', '2026-10-10 10:15:00', 408000, N'Đã thanh toán', 'HD-20261010-001'),
('HD02', 'KH11', NULL,   'DH01', 'CN11', '2026-10-05 10:00:00', 286000, N'Đã thanh toán', 'HD-20261005-002');

INSERT INTO ChiTietHoaDon_DichVu (MaChiTietHDDV, MaHoaDon, MaDichVu, MaCombo, SoLuong, DonGia, ThanhTien) VALUES
('CTHDDV01', 'HD01', 'DV01', NULL, 1, 120000, 120000);

-- HD01: SP01 lấy từ lô CTPN01001 (CN01). HD02: SP71 lấy từ CTPN11071 (CN11)
INSERT INTO ChiTietHoaDon_SanPham (MaChiTietHDSanPham, MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES
('CTHD20261010000001', 'HD01', 'SP01', 'CTPN01001', 1, 480000, 40.00, 288000, 288000),
('CTHD20261005000002', 'HD02', 'SP71', 'CTPN11071', 1, 286000,  0.00, 286000, 286000);

UPDATE ChiTietPhieuNhap 
SET SoLuongConLai = SoLuongConLai - 1 
WHERE MaChiTietPhieuNhap = 'CTPN01001';

UPDATE TonKho 
SET SoLuongTon = SoLuongTon - 1 
WHERE MaSanPham = 'SP01' AND MaChiNhanh = 'CN01';

ALTER TABLE ChiTietHoaDon_SanPham ENABLE TRIGGER trg_ChiTietHoaDonSanPham_TruTonKho;

-- Thanh toán: NV61 (CN01) và NV71 (CN11)
INSERT INTO ThanhToan (MaThanhToan, MaHoaDon, MaNhanVien, SoTien, PhuongThuc, ThoiGianThanhToan, TrangThai, MaGiaoDich) VALUES
('TT01', 'HD01', 'NV61', 408000, N'Chuyển khoản QR', '2026-10-10 10:20:00', N'Thành công', 'VNPAY9872123'),
('TT02', 'HD02', 'NV71', 286000, N'Tiền mặt',        '2026-10-05 10:05:00', N'Thành công', 'CASH001');

-- Đánh giá phản hồi khách hàng (Gồm cả Lịch Hẹn dịch vụ & Đơn Hàng mỹ phẩm đã mua)
INSERT INTO DanhGia (MaDanhGia, MaKhachHang, MaLichHen, MaDonHang, SoSao, NoiDung, HinhAnh, NgayDanhGia, TrangThai, CoFlag) VALUES
-- 1. Đánh giá đơn hàng mỹ phẩm mua trực tuyến / tại quầy (MaDonHang NOT NULL, MaLichHen NULL):
('DG01', 'KH11', NULL,   'DH01', 5, N'Giao hàng siêu nhanh trong 2h, dầu gội Kerasys đóng gói cẩn thận 3 lớp chống sốc, có tem chống hàng giả chuẩn Omni Salon.', NULL, '2026-10-06 18:00:00', N'Hiển thị', 0),
('DG02', 'KH12', NULL,   'DH02', 5, N'Sáp Pomade Brosh chính hãng độ giữ nếp cực tốt cả ngày, mùi hương nam tính cổ điển rất sang trọng. Nhận tại quầy CN12 phục vụ rất chu đáo.', NULL, '2026-10-06 19:30:00', N'Hiển thị', 0),
('DG03', 'KH13', NULL,   'DH03', 5, N'Gôm xịt Silhouette Schwarzkopf khóa nếp tóc rất tự nhiên, không bị bết rít hay để lại vảy trắng. Đóng gói rất kỹ.', NULL, '2026-10-07 08:45:00', N'Hiển thị', 0),
('DG04', 'KH14', NULL,   'DH04', 5, N'Tinh dầu Moroccanoil dưỡng bóng mượt tóc tẩy nhuộm, mùi thơm nhẹ dễ chịu lưu hương cả ngày. Đáng tiền từng xu!', NULL, '2026-10-07 15:20:00', N'Hiển thị', 0),
('DG05', 'KH15', NULL,   'DH05', 4, N'Bột tạo phồng Dapper Dan hút dầu cực tốt cho mùa hè, texture tóc lên rất tự nhiên. Nhân viên tư vấn cách vuốt nhiệt tình.', NULL, '2026-10-07 17:10:00', N'Hiển thị', 0),
('DG06', 'KH16', NULL,   'DH06', 5, N'Bộ sản phẩm Proraso Italy nguyên seal chính hãng, cạo râu êm mượt không rát da. Giao hàng đúng hẹn.', NULL, '2026-10-08 09:00:00', N'Hiển thị', 0),
('DG07', 'KH17', NULL,   'DH07', 5, N'Reuzel Blue Pomade gội rửa cực kỳ dễ dàng, giữ phom Pompadour chuẩn chỉ cả ngày dài làm việc. 5 sao cho shop!', NULL, '2026-10-08 11:30:00', N'Hiển thị', 0),
('DG08', 'KH18', NULL,   'DH08', 5, N'Xịt muối biển Suavecito tạo độ phồng và độ nhám chuẩn chỉnh trước khi sấy tóc. Ship nhanh, tư vấn nhiệt tình.', NULL, '2026-10-08 14:00:00', N'Hiển thị', 0),
('DG09', 'KH19', NULL,   'DH09', 5, N'Kevin Murphy Rough Rider giữ nếp cực khủng, không bóng bẩy, lên form tóc Crop cực chất. Rất hài lòng.', NULL, '2026-10-08 16:30:00', N'Hiển thị', 0),
('DG10', 'KH20', NULL,   'DH10', 5, N'Bộ dao cạo Feather Nhật Bản sắc bén và hoàn thiện cơ khí tinh xảo, cạo rất ngọt và ôm sát chân râu. Hàng chuẩn 100%.', NULL, '2026-10-08 18:15:00', N'Hiển thị', 0),

-- 2. Đánh giá trải nghiệm dịch vụ cắt tóc / combo VIP (MaLichHen NOT NULL, MaDonHang NULL):
('DG11', 'KH01', 'LH01', NULL,   5, N'Master Stylist cắt tóc kỹ lưỡng, đường fade sắc nét và vuốt sáp tạo kiểu rất hợp với gương mặt mình.', NULL, '2026-10-10 11:30:00', N'Hiển thị', 0),
('DG12', 'KH02', 'LH02', NULL,   5, N'Gói Combo VIP làm tóc thư giãn tuyệt vời, không gian phòng ốc sang trọng, nhạc jazz và trà thảo mộc rất chill.', NULL, '2026-10-10 14:00:00', N'Hiển thị', 0),
('DG13', 'KH03', 'LH03', NULL,   5, N'Uốn tóc xoăn Texture tự nhiên, lọn tóc mềm mại không bị xơ khô. Stylist hướng dẫn chăm sóc tại nhà rất chi tiết.', NULL, '2026-10-10 16:30:00', N'Hiển thị', 0),
('DG14', 'KH04', 'LH04', NULL,   5, N'Màu nhuộm khói sáng lên đều chuẩn tone mẫu tóc, da đầu không hề bị xót. Dịch vụ chuyên nghiệp hàng đầu thành phố.', NULL, '2026-10-10 18:00:00', N'Hiển thị', 0),
('DG15', 'KH05', 'LH05', NULL,   5, N'Uốn con sâu Dreads bồng bềnh cá tính, thời gian hoàn thành đúng cam kết và form tóc giữ được rất lâu.', NULL, '2026-10-10 19:45:00', N'Hiển thị', 0);
GO