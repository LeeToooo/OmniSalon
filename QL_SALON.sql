CREATE DATABASE QL_SALONTOC;
GO

USE QL_SALONTOC;
GO

CREATE TABLE ChiNhanh
(
    MaChiNhanh VARCHAR(20) PRIMARY KEY,
    TenChiNhanh NVARCHAR(100) NOT NULL,
    DiaChi NVARCHAR(200),
    SoDienThoai VARCHAR(15),
    GioMoCua TIME,
    GioDongCua TIME,
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
    MoTa NVARCHAR(200),
    ThoiLuong INT,
    Gia DECIMAL(18,2) NOT NULL DEFAULT 0,
    TrangThai NVARCHAR(20) DEFAULT N'Kinh doanh',
    NgayApDung DATE DEFAULT CAST(GETDATE() AS DATE)
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
    MoTa NVARCHAR(200),
    HinhAnh NVARCHAR(200),
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
    MaNhanVien VARCHAR(20) NOT NULL,
    MaNguoiDuyet VARCHAR(20) NULL,
    MaNhaCungCap VARCHAR(20) NOT NULL,
    NgayLap DATETIME DEFAULT GETDATE(),
    LyDoTuChoi NVARCHAR(200),
    TongTien DECIMAL(18,2) DEFAULT 0,
    NgayDuyet DATETIME,
    TrangThai NVARCHAR(30) DEFAULT N'Chờ duyệt',
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
    MaChiTietLichHen VARCHAR(20) PRIMARY KEY,
    MaLichHen VARCHAR(20) NOT NULL,
    MaDichVu VARCHAR(20) NOT NULL,
    SoLuong INT DEFAULT 1 CHECK (SoLuong > 0),
    DonGia DECIMAL(18,2) NOT NULL,
    ThanhTien DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_ChiTietLichHen_LichHen FOREIGN KEY (MaLichHen) REFERENCES LichHen(MaLichHen),
    CONSTRAINT FK_ChiTietLichHen_DichVu FOREIGN KEY (MaDichVu) REFERENCES DichVu(MaDichVu)
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
    MaChiTietDonHang VARCHAR(20) PRIMARY KEY,
    MaDonHang VARCHAR(20) NOT NULL,
    MaSanPham VARCHAR(20) NOT NULL,
    MaChiTietPhieuNhap VARCHAR(20) NULL,
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
    MaHoaDon VARCHAR(20) NOT NULL,
    MaDichVu VARCHAR(20) NOT NULL,
    SoLuong INT NOT NULL CHECK (SoLuong > 0),
    DonGia DECIMAL(18,2) NOT NULL,
    ThanhTien DECIMAL(18,2) NOT NULL,
    CONSTRAINT PK_ChiTietHoaDon_DichVu PRIMARY KEY (MaHoaDon, MaDichVu),
    CONSTRAINT FK_ChiTietHoaDonDichVu_HoaDon FOREIGN KEY (MaHoaDon) REFERENCES HoaDon(MaHoaDon),
    CONSTRAINT FK_ChiTietHoaDonDichVu_DichVu FOREIGN KEY (MaDichVu) REFERENCES DichVu(MaDichVu)
);
GO

CREATE TABLE ChiTietHoaDon_SanPham
(
    MaHoaDon VARCHAR(20) NOT NULL,
    MaSanPham VARCHAR(20) NOT NULL,
    MaChiTietPhieuNhap VARCHAR(20) NULL,
    SoLuong INT NOT NULL CHECK (SoLuong > 0),
    DonGiaGoc DECIMAL(18,2) NOT NULL,
    PhanTramGiamGia DECIMAL(5,2) DEFAULT 0,
    DonGiaThucTe DECIMAL(18,2) NOT NULL,
    ThanhTien DECIMAL(18,2) NOT NULL,
    CONSTRAINT PK_ChiTietHoaDon_SanPham PRIMARY KEY (MaHoaDon, MaSanPham),
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

INSERT INTO QuyTacGiamGiaTheoHan (MaQuyTac, TenQuyTac, SoNgayConLaiToiThieu, SoNgayConLaiToiDa, PhanTramGiam, TrangThai) VALUES
('QT01', N'Còn trên 6 tháng (Hạn an toàn)', 181, 99999,  0.00, N'Đang áp dụng'),
('QT02', N'Còn từ 3 đến 6 tháng (Xả kho nhẹ)', 91,   180, 20.00, N'Đang áp dụng'),
('QT03', N'Còn từ 1 đến 3 tháng (Cận hạn)',     31,    90, 40.00, N'Đang áp dụng'),
('QT04', N'Còn dưới 1 tháng (Cận hạn gấp)',      1,    30, 70.00, N'Đang áp dụng'),
('QT05', N'Đã hết hạn (Thu hồi tiêu hủy)',   -9999,     0, 100.00, N'Đang áp dụng');
GO

ALTER TABLE PhieuNhapKho ADD MaChiNhanh VARCHAR(20) NULL;
GO

ALTER TABLE PhieuNhapKho
ADD CONSTRAINT FK_PhieuNhapKho_ChiNhanh FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh);
GO

CREATE TABLE TonKho
(
    MaTonKho VARCHAR(20) PRIMARY KEY,
    MaSanPham VARCHAR(20) NOT NULL,
    MaChiNhanh VARCHAR(20) NOT NULL,
    SoLuongTon INT NOT NULL DEFAULT 0,
    MucCanhBao INT NOT NULL DEFAULT 10,
    NgayCapNhat DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_TonKho_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham),
    CONSTRAINT FK_TonKho_ChiNhanh FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh),
    CONSTRAINT UQ_TonKho_SanPham_ChiNhanh UNIQUE (MaSanPham, MaChiNhanh),
    CONSTRAINT CK_TonKho_SoLuongTon CHECK (SoLuongTon >= 0)
);
GO

CREATE OR ALTER VIEW vw_GiaBanTheoLoHienTai AS
SELECT 
    ctpn.MaChiTietPhieuNhap,
    ctpn.SoLo,
    sp.MaSanPham,
    sp.TenSanPham,
    sp.GiaBan AS GiaNiemYetGoc,
    ctpn.HanSuDung,
    ctpn.SoLuongConLai,
    DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) AS SoNgayConLai,
    ISNULL(qt.PhanTramGiam, 0) AS PhanTramGiam,
    CAST(sp.GiaBan * (1 - ISNULL(qt.PhanTramGiam, 0) / 100.0) AS DECIMAL(18,2)) AS GiaBanThucTe,
    CASE 
        WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) <= 0 THEN N'Đã hết hạn - Thu hồi'
        ELSE qt.TenQuyTac
    END AS TinhTrangHang
FROM ChiTietPhieuNhap ctpn
INNER JOIN SanPham sp ON ctpn.MaSanPham = sp.MaSanPham
LEFT JOIN QuyTacGiamGiaTheoHan qt 
    ON DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) BETWEEN qt.SoNgayConLaiToiThieu AND qt.SoNgayConLaiToiDa
WHERE ctpn.SoLuongConLai > 0
    AND (qt.TrangThai = N'Đang áp dụng' OR qt.MaQuyTac IS NULL);
GO

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
        INSERT (MaTonKho, MaSanPham, MaChiNhanh, SoLuongTon, NgayCapNhat)
        VALUES (CONCAT('TK', src.MaSanPham, src.MaChiNhanh), src.MaSanPham, src.MaChiNhanh, src.SoLuongNhap, GETDATE());
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
    JOIN inserted i ON i.MaChiTietPhieuNhap = ctpn.MaChiTietPhieuNhap
    WHERE i.MaChiTietPhieuNhap IS NOT NULL;

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

    UPDATE ctpn
    SET ctpn.SoLuongConLai = ctpn.SoLuongConLai - i.SoLuong
    FROM ChiTietPhieuNhap ctpn
    JOIN inserted i ON i.MaChiTietPhieuNhap = ctpn.MaChiTietPhieuNhap
    WHERE i.MaChiTietPhieuNhap IS NOT NULL;

    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon - agg.SoLuongBan,
        tk.NgayCapNhat = GETDATE()
    FROM TonKho tk
    JOIN (
        SELECT i.MaSanPham, hd.MaChiNhanh, SUM(i.SoLuong) AS SoLuongBan
        FROM inserted i
        JOIN HoaDon hd ON hd.MaHoaDon = i.MaHoaDon
        GROUP BY i.MaSanPham, hd.MaChiNhanh
    ) AS agg ON tk.MaSanPham = agg.MaSanPham AND tk.MaChiNhanh = agg.MaChiNhanh;
END;
GO

CREATE INDEX IX_ChiTietPhieuNhap_FEFO ON ChiTietPhieuNhap(MaSanPham, HanSuDung) INCLUDE (SoLuongConLai) WHERE SoLuongConLai > 0;
GO

CREATE SEQUENCE seq_ChiTietDonHang AS INT START WITH 1 INCREMENT BY 1;
GO

CREATE OR ALTER PROCEDURE sp_ThemChiTietDonHang
    @MaDonHang VARCHAR(20),
    @MaSanPham VARCHAR(20),
    @SoLuong INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaLo VARCHAR(20);
    DECLARE @GiaGoc DECIMAL(18,2);
    DECLARE @PhanTramGiam DECIMAL(5,2);
    DECLARE @GiaThucTe DECIMAL(18,2);
    DECLARE @MaChiTietDonHang VARCHAR(20);

    SELECT TOP 1
        @MaLo = ctpn.MaChiTietPhieuNhap,
        @GiaGoc = sp.GiaBan,
        @PhanTramGiam = ISNULL(qt.PhanTramGiam, 0)
    FROM ChiTietPhieuNhap ctpn
    INNER JOIN SanPham sp ON sp.MaSanPham = ctpn.MaSanPham
    LEFT JOIN QuyTacGiamGiaTheoHan qt
        ON DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) BETWEEN qt.SoNgayConLaiToiThieu AND qt.SoNgayConLaiToiDa
        AND qt.TrangThai = N'Đang áp dụng'
    WHERE ctpn.MaSanPham = @MaSanPham
        AND ctpn.SoLuongConLai >= @SoLuong
        AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0
    ORDER BY ctpn.HanSuDung ASC;

    IF @MaLo IS NULL
    BEGIN
        RAISERROR(N'Không có lô hàng nào còn đủ số lượng hoặc còn hạn sử dụng cho sản phẩm này.', 16, 1);
        RETURN;
    END

    SET @GiaThucTe = CAST(@GiaGoc * (1 - @PhanTramGiam / 100.0) AS DECIMAL(18,2));
    SET @MaChiTietDonHang = CONCAT('CTDH', CONVERT(VARCHAR(8), GETDATE(), 112), RIGHT('000000' + CAST(NEXT VALUE FOR seq_ChiTietDonHang AS VARCHAR(6)), 6));

    INSERT INTO ChiTietDonHang (MaChiTietDonHang, MaDonHang, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien)
    VALUES (@MaChiTietDonHang, @MaDonHang, @MaSanPham, @MaLo, @SoLuong, @GiaGoc, @PhanTramGiam, @GiaThucTe, @GiaThucTe * @SoLuong);
END;
GO

CREATE OR ALTER PROCEDURE sp_ThemChiTietHoaDonSanPham
    @MaHoaDon VARCHAR(20),
    @MaSanPham VARCHAR(20),
    @SoLuong INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaLo VARCHAR(20);
    DECLARE @GiaGoc DECIMAL(18,2);
    DECLARE @PhanTramGiam DECIMAL(5,2);
    DECLARE @GiaThucTe DECIMAL(18,2);

    SELECT TOP 1
        @MaLo = ctpn.MaChiTietPhieuNhap,
        @GiaGoc = sp.GiaBan,
        @PhanTramGiam = ISNULL(qt.PhanTramGiam, 0)
    FROM ChiTietPhieuNhap ctpn
    INNER JOIN SanPham sp ON sp.MaSanPham = ctpn.MaSanPham
    LEFT JOIN QuyTacGiamGiaTheoHan qt
        ON DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) BETWEEN qt.SoNgayConLaiToiThieu AND qt.SoNgayConLaiToiDa
        AND qt.TrangThai = N'Đang áp dụng'
    WHERE ctpn.MaSanPham = @MaSanPham
        AND ctpn.SoLuongConLai >= @SoLuong
        AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ctpn.HanSuDung) > 0
    ORDER BY ctpn.HanSuDung ASC;

    IF @MaLo IS NULL
    BEGIN
        RAISERROR(N'Không có lô hàng nào còn đủ số lượng hoặc còn hạn sử dụng cho sản phẩm này.', 16, 1);
        RETURN;
    END

    SET @GiaThucTe = CAST(@GiaGoc * (1 - @PhanTramGiam / 100.0) AS DECIMAL(18,2));

    INSERT INTO ChiTietHoaDon_SanPham (MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien)
    VALUES (@MaHoaDon, @MaSanPham, @MaLo, @SoLuong, @GiaGoc, @PhanTramGiam, @GiaThucTe, @GiaThucTe * @SoLuong);
END;
GO

CREATE OR ALTER VIEW vw_SanPhamCanhBaoTonThap AS
SELECT tk.MaSanPham, sp.TenSanPham, tk.MaChiNhanh, cn.TenChiNhanh, tk.SoLuongTon, tk.MucCanhBao
FROM TonKho tk
INNER JOIN SanPham sp ON sp.MaSanPham = tk.MaSanPham
INNER JOIN ChiNhanh cn ON cn.MaChiNhanh = tk.MaChiNhanh
WHERE tk.SoLuongTon <= tk.MucCanhBao;
GO


-- =========================================================================
-- 1. DANH MỤC SẢN PHẨM & NHÀ CUNG CẤP & CHI NHÁNH
-- =========================================================================
INSERT INTO ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, GioMoCua, GioDongCua, TrangThai) VALUES
('CN01', N'Salon Tóc Chi Nhánh 1 - Quận 1', N'120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM', '0901111222', '08:30:00', '21:30:00', N'Hoạt động'),
('CN02', N'Salon Tóc Chi Nhánh 2 - Tân Bình', N'45 Cộng Hòa, Phường 4, Quận Tân Bình, TP.HCM', '0903333444', '08:30:00', '21:00:00', N'Hoạt động'),
('CN03', N'Salon Tóc Chi Nhánh 3 - Bình Thạnh', N'88 Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM', '0905555666', '09:00:00', '22:00:00', N'Hoạt động');

INSERT INTO DanhMucSanPham (MaDanhMuc, TenDanhMuc, MoTa, TrangThai) VALUES
('DM01', N'Dầu gội & Dầu xả', N'Chăm sóc làm sạch sâu và cấp ẩm da đầu', N'Hoạt động'),
('DM02', N'Tinh dầu & Dưỡng tóc', N'Serum, tinh dầu phục hồi và chống nhiệt', N'Hoạt động'),
('DM03', N'Kem ủ & Mặt nạ tóc', N'Phục hồi hư tổn tóc xơ rối do hóa chất', N'Hoạt động'),
('DM04', N'Sáp vuốt tóc & Pomade', N'Tạo kiểu giữ nếp tóc nam', N'Hoạt động'),
('DM05', N'Xịt giữ nếp & Gôm xịt tóc', N'Tạo kiểu định hình tóc thời trang', N'Hoạt động'),
('DM06', N'Nhuộm & Tẩy tóc chuyên nghiệp', N'Màu nhuộm thời trang cao cấp', N'Hoạt động');

INSERT INTO NhaCungCap (MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, DiaChi, TrangThai) VALUES
('NCC01', N'Công ty TNHH Phân Phối Mỹ Phẩm L’Oréal VN', '02838221199', 'contact@loreal.vn', N'Tầng 10, Bitexco, Q.1, TP.HCM', N'Hoạt động'),
('NCC02', N'Moroccanoil Việt Nam', '02839102233', 'support@moroccanoil.vn', N'26 Nguyễn Thị Minh Khai, Q.1, TP.HCM', N'Hoạt động'),
('NCC03', N'Công ty Cổ phần Davines Sài Gòn', '02838334455', 'sales@davines.vn', N'15 Trương Định, Q.3, TP.HCM', N'Hoạt động'),
('NCC04', N'Hãng Phân Phối Olaplex Hair Care', '02837445566', 'service@olaplex.vn', N'102 Thảo Điền, TP. Thủ Đức, TP.HCM', N'Hoạt động');

-- =========================================================================
-- 2. SẢN PHẨM (20 SẢN PHẨM CÓ ẢNH TRỰC TIẾP TỪ WEB)
-- =========================================================================
INSERT INTO SanPham (MaSanPham, MaDanhMuc, MaNhaCungCap, TenSanPham, MoTa, HinhAnh, GiaNhap, GiaBan, TrangThaiKinhDoanh) VALUES
('SP01', 'DM01', 'NCC01', N'Dầu gội L’Oréal Professionnel Absolut Repair 500ml', N'Phục hồi tóc hư tổn nặng với Protein diêm mạch vàng', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600', 360000, 480000, N'Đang bán'),
('SP02', 'DM01', 'NCC01', N'Dầu xả L’Oréal Absolut Repair Gold Conditioner 500ml', N'Cung cấp độ bóng mượt vượt trội mà không làm nặng tóc', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600', 380000, 510000, N'Đang bán'),
('SP03', 'DM01', 'NCC03', N'Dầu gội Davines Naturaltech Purifying Anti-Dandruff 250ml', N'Dầu gội đặc trị gàu và cân bằng tuyến dầu da đầu', 'https://images.unsplash.com/photo-1608248597359-597546e9dfd0?w=600', 290000, 395000, N'Đang bán'),
('SP04', 'DM01', 'NCC04', N'Dầu gội phục hồi liên kết tóc Olaplex No.4 Bond Maintenance 250ml', N'Tái tạo cấu trúc tóc yếu, dễ gãy rụng do uốn nhuộm', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', 520000, 690000, N'Đang bán'),
('SP05', 'DM01', 'NCC04', N'Dầu xả Olaplex No.5 Bond Maintenance Conditioner 250ml', N'Cấp ẩm chuyên sâu và bảo vệ biểu bì tóc chắc khỏe', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600', 520000, 690000, N'Đang bán'),
('SP06', 'DM02', 'NCC02', N'Tinh dầu dưỡng tóc Moroccanoil Treatment Original 100ml', N'Tinh chất dầu Argan tự nhiên nuôi dưỡng ngọn tóc suôn mềm', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600', 650000, 890000, N'Đang bán'),
('SP07', 'DM02', 'NCC02', N'Tinh dầu Moroccanoil Light Treatment 100ml', N'Công thức chuyên biệt dành cho tóc tẩy, mỏng và sáng màu', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', 650000, 890000, N'Đang bán'),
('SP08', 'DM02', 'NCC04', N'Dầu dưỡng tái tạo tóc Olaplex No.7 Bonding Oil 30ml', N'Bảo vệ tóc trước nhiệt độ cao tới 230 độ C và tia UV', 'https://images.unsplash.com/photo-1608248597359-597546e9dfd0?w=600', 490000, 670000, N'Đang bán'),
('SP09', 'DM02', 'NCC01', N'Serum dưỡng tóc L’Oréal Mythic Oil Huile Originale 100ml', N'Chiết xuất dầu bơ và hạt nho tăng cường độ đàn hồi', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600', 320000, 440000, N'Đang bán'),
('SP10', 'DM03', 'NCC04', N'Kem ủ tái kết nối Olaplex No.3 Hair Perfector 100ml', N'Sản phẩm điều trị cấu trúc phân tử tóc bán chạy nhất', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', 520000, 690000, N'Đang bán'),
('SP11', 'DM03', 'NCC02', N'Mặt nạ tóc Moroccanoil Intense Hydrating Mask 250ml', N'Ủ tóc dưỡng ẩm sâu cho tóc xoăn lọn và tóc khô ráp', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600', 580000, 780000, N'Đang bán'),
('SP12', 'DM03', 'NCC03', N'Mặt nạ Davines The Renaissance Circle 250ml', N'Mặt nạ phục hồi kỳ diệu cho tóc hư tổn do xử lý nhiệt', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600', 380000, 520000, N'Đang bán'),
('SP13', 'DM04', 'NCC01', N'Sáp vuốt tóc nam L’Oréal Homme Clay Strong Hold 50ml', N'Độ giữ nếp cực cao, hoàn thiện mờ tự nhiên không bóng', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600', 210000, 310000, N'Đang bán'),
('SP14', 'DM04', 'NCC01', N'Sáp vuốt tóc Volcanic Clay Version V5 80ml', N'Giữ nếp trên 14 tiếng, hút dầu thừa tốt cho khí hậu nóng', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600', 230000, 340000, N'Đang bán'),
('SP15', 'DM04', 'NCC02', N'Pomade tạo kiểu Moroccanoil Styling Clay 75ml', N'Tạo kiểu linh hoạt, dễ gội rửa với thành phần dầu Argan', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600', 390000, 540000, N'Đang bán'),
('SP16', 'DM05', 'NCC01', N'Gôm xịt tóc L’Oréal Infinium Pure Strong 500ml', N'Keo xịt giữ nếp chuẩn salon, khô tức thì, không để lại bụi', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600', 250000, 360000, N'Đang bán'),
('SP17', 'DM05', 'NCC02', N'Xịt bóng Moroccanoil Glimmer Shine Spray 100ml', N'Lớp phủ hoàn thiện tạo hiệu ứng bắt sáng rạng rỡ cho tóc', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', 430000, 590000, N'Đang bán'),
('SP18', 'DM06', 'NCC01', N'Kem nhuộm tóc L’Oréal Majirel Cool Cover 50ml', N'Màu nhuộm phủ bạc và ánh sắc lạnh bền lâu không hại tóc', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600', 160000, 240000, N'Đang bán'),
('SP19', 'DM06', 'NCC01', N'Bột tẩy tóc L’Oréal Blond Studio 9 Levels 500g', N'Bột tẩy nâng sáng lên đến 9 tông nhẹ dịu với da đầu', 'https://images.unsplash.com/photo-1585232351009-aa87416fca90?w=600', 580000, 790000, N'Đang bán'),
('SP20', 'DM06', 'NCC03', N'Màu nhuộm tóc Davines Mask with Vibrachrom 100ml', N'Màu nhuộm hữu cơ chứa tinh dầu hạt diêm mạch bảo vệ sợi tóc', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600', 180000, 270000, N'Đang bán');

-- =========================================================================
-- 3. NHÂN VIÊN & KHÁCH HÀNG & TÀI KHOẢN
-- =========================================================================
INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, CapBac, ChucVu, TrangThai) VALUES
('NV01', 'CN01', N'Trần Minh Hoàng', '0912000001', 'hoang.tm@salontoc.vn', N'Quản lý', N'Quản lý chi nhánh', N'Đang làm việc'),
('NV02', 'CN01', N'Lê Thị Hương', '0912000002', 'huong.lt@salontoc.vn', N'Senior Stylist', N'Thợ chính', N'Đang làm việc'),
('NV03', 'CN01', N'Nguyễn Văn Nam', '0912000003', 'nam.nv@salontoc.vn', N'Junior Stylist', N'Thợ phụ', N'Đang làm việc'),
('NV04', 'CN02', N'Phạm Thu Thảo', '0912000004', 'thao.pt@salontoc.vn', N'Senior Stylist', N'Thợ chính', N'Đang làm việc'),
('NV05', 'CN03', N'Võ Quốc Bảo', '0912000005', 'bao.vq@salontoc.vn', N'Master Stylist', N'Thợ chính', N'Đang làm việc');

INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh) VALUES
('KH01', N'Ngô Văn Tuấn', '0988000001', 'vantuan@gmail.com', '1998-05-14'),
('KH02', N'Trần Mỹ Linh', '0988000002', 'mylinh.tran@gmail.com', '2001-11-20'),
('KH03', N'Đặng Thanh Tùng', '0988000003', 'thanhtung.dang@gmail.com', '1995-03-08'),
('KH04', N'Vũ Phương Thảo', '0988000004', 'phuongthao.vu@gmail.com', '2000-09-12'),
('KH05', N'Lê Minh Khôi', '0988000005', 'minhkhoi.le@gmail.com', '1992-07-24');

-- TaiKhoan (Tuân thủ CK_TaiKhoan_ChuSoHuu: Hoặc NV hoặc KH)
INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao) VALUES
('TK_NV01', 'NV01', NULL, 'hoang.ql', 'e10adc3949ba59abbe56e057f20f883e', N'Quản lý', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_NV02', 'NV02', NULL, 'huong.stylist', 'e10adc3949ba59abbe56e057f20f883e', N'Nhân viên', N'Hoạt động', '2026-01-01 08:00:00'),
('TK_KH01', NULL, 'KH01', 'kh_vantuan', 'e10adc3949ba59abbe56e057f20f883e', N'Khách hàng', N'Hoạt động', '2026-02-10 09:30:00'),
('TK_KH02', NULL, 'KH02', 'kh_mylinh', 'e10adc3949ba59abbe56e057f20f883e', N'Khách hàng', N'Hoạt động', '2026-02-15 14:20:00'),
('TK_KH03', NULL, 'KH03', 'kh_thanhtung', 'e10adc3949ba59abbe56e057f20f883e', N'Khách hàng', N'Hoạt động', '2026-03-01 10:00:00');

-- =========================================================================
-- 4. THÔNG BÁO & CA LÀM VIỆC & DỊCH VỤ
-- =========================================================================
INSERT INTO ThongBao (MaThongBao, MaTaiKhoan, MaKhachHang, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, TrangThaiDoc) VALUES
('TB01', 'TK_NV01', NULL, N'Thông báo họp định kỳ', N'Họp tổng kết tuần chi nhánh Q1 vào sáng thứ 2', N'Nội bộ', '2026-09-20 08:30:00', 1),
('TB02', NULL, 'KH01', N'Xác nhận lịch hẹn làm tóc', N'Lịch hẹn của bạn vào ngày 2026-10-02 lúc 09:00 đã được tiếp nhận', N'Lịch hẹn', '2026-09-30 15:00:00', 0),
('TB03', NULL, 'KH02', N'Khuyến mãi tháng 10', N'Nhận ngay voucher giảm giá 15% cho dịch vụ nhuộm tóc', N'Khuyến mãi', '2026-10-01 09:00:00', 0);

INSERT INTO CaLamViec (MaCa, MaNhanVien, NgayLam, GioBatDau, GioKetThuc, TrangThai) VALUES
('CA01', 'NV01', '2026-10-02', '08:30:00', '17:30:00', N'Đã hoàn thành'),
('CA02', 'NV02', '2026-10-02', '09:00:00', '18:00:00', N'Đã hoàn thành'),
('CA03', 'NV03', '2026-10-02', '12:00:00', '21:00:00', N'Đang diễn ra'),
('CA04', 'NV04', '2026-10-03', '08:30:00', '17:30:00', N'Chưa diễn ra'),
('CA05', 'NV05', '2026-10-03', '12:30:00', '21:30:00', N'Chưa diễn ra');

INSERT INTO DichVu (MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, TrangThai, NgayApDung) VALUES
('DV01', N'Cắt tóc nam thời trang', N'Bao gồm gội, massage và tạo kiểu bằng sáp cao cấp', 45, 120000, N'Kinh doanh', '2026-01-01'),
('DV02', N'Cắt & Tạo kiểu tóc nữ', N'Tư vấn kiểu tóc hợp khuôn mặt, tỉa layer chuẩn form', 60, 250000, N'Kinh doanh', '2026-01-01'),
('DV03', N'Uốn tóc phục hồi sóng lơi', N'Sử dụng thuốc uốn hữu cơ không khô xơ, tặng hấp collagen', 120, 650000, N'Kinh doanh', '2026-01-01'),
('DV04', N'Nhuộm màu thời trang Balayage/Ombre', N'Kỹ thuật phối màu chuẩn Tây kèm khử ánh sắc', 150, 950000, N'Kinh doanh', '2026-01-01'),
('DV05', N'Liệu trình phục hồi Olaplex chuyên sâu', N'Phục hồi cấp tốc 5 bước cho tóc nát, tóc xơ tẩy', 90, 800000, N'Kinh doanh', '2026-01-01');

-- =========================================================================
-- 5. PHIẾU NHẬP KHO & CHI TIẾT PHIẾU NHẬP (LÔ HÀNG CẬN HẠN & DÀI HẠN)
-- =========================================================================
-- Tắt trigger tạm để dữ liệu được nạp kiểm soát chính xác theo script
ALTER TABLE PhieuNhapKho DISABLE TRIGGER trg_PhieuNhapKho_CapNhatTonKho;

INSERT INTO PhieuNhapKho (MaPhieuNhap, MaNhanVien, MaNguoiDuyet, MaNhaCungCap, MaChiNhanh, NgayLap, LyDoTuChoi, TongTien, NgayDuyet, TrangThai) VALUES
('PN01', 'NV02', 'NV01', 'NCC01', 'CN01', '2026-08-01 09:00:00', NULL, 15300000, '2026-08-01 11:30:00', N'Đã duyệt'),
('PN02', 'NV03', 'NV01', 'NCC04', 'CN01', '2026-08-15 14:00:00', NULL, 15600000, '2026-08-15 16:00:00', N'Đã duyệt'),
('PN03', 'NV04', 'NV01', 'NCC02', 'CN02', '2026-09-01 10:00:00', NULL, 13000000, '2026-09-01 11:00:00', N'Đã duyệt');

INSERT INTO ChiTietPhieuNhap (MaChiTietPhieuNhap, MaPhieuNhap, MaSanPham, SoLo, HanSuDung, SoLuong, SoLuongConLai, DonGiaNhap, ThanhTien) VALUES
-- Lô SP01: Hạn đến tháng 11/2026 (~45 ngày: cận hạn áp dụng giảm 40%)
('CTPN01', 'PN01', 'SP01', 'LO2608A1', '2026-11-15', 20, 15, 360000, 7200000),
-- Lô SP02: Hạn dài 2027 (> 180 ngày: áp dụng 0%)
('CTPN02', 'PN01', 'SP02', 'LO2608A2', '2027-08-01', 15, 12, 380000, 5700000),
-- Lô SP13: Hạn dài 2027
('CTPN03', 'PN01', 'SP13', 'LO2608A3', '2027-10-20', 10, 8,  210000, 2100000),
-- Lô SP04: Hạn đến tháng 1/2027 (~110 ngày: giảm 20%)
('CTPN04', 'PN02', 'SP04', 'LO2608B1', '2027-01-20', 15, 10, 520000, 7800000),
-- Lô SP08: Hạn dài 2027
('CTPN05', 'PN02', 'SP08', 'LO2608B2', '2027-12-30', 10, 8,  490000, 4900000),
-- Lô SP10: Hạn dài 2027
('CTPN06', 'PN02', 'SP10', 'LO2608B3', '2027-12-30', 5,  4,  520000, 2600000),
-- Lô SP06: Hạn dài 2028
('CTPN07', 'PN03', 'SP06', 'LO2609C1', '2028-02-15', 20, 18, 650000, 13000000);

ALTER TABLE PhieuNhapKho ENABLE TRIGGER trg_PhieuNhapKho_CapNhatTonKho;

-- =========================================================================
-- 6. TỒN KHO TỔNG THEO CHI NHÁNH
-- =========================================================================
INSERT INTO TonKho (MaTonKho, MaSanPham, MaChiNhanh, SoLuongTon, MucCanhBao, NgayCapNhat) VALUES
('TK_SP01_CN01', 'SP01', 'CN01', 15, 5, GETDATE()),
('TK_SP02_CN01', 'SP02', 'CN01', 12, 5, GETDATE()),
('TK_SP04_CN01', 'SP04', 'CN01', 10, 5, GETDATE()),
('TK_SP06_CN01', 'SP06', 'CN01', 5,  5, GETDATE()),
('TK_SP08_CN01', 'SP08', 'CN01', 8,  3, GETDATE()),
('TK_SP10_CN01', 'SP10', 'CN01', 4,  5, GETDATE()),
('TK_SP13_CN01', 'SP13', 'CN01', 8,  5, GETDATE()),
('TK_SP06_CN02', 'SP06', 'CN02', 18, 5, GETDATE());

-- =========================================================================
-- 7. KHUYẾN MÃI DỊCH VỤ & SẢN PHẨM
-- =========================================================================
INSERT INTO KhuyenMai (MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, DoiTuongApDung, NgayBatDau, NgayKetThuc, TrangThai) VALUES
('KM01', N'Chào Thu Rực Rỡ', N'Giảm giá trực tiếp', 50000, N'Tất cả khách hàng', '2026-09-01', '2026-10-31', N'Đang áp dụng'),
('KM02', N'Đặc quyền Salon VIP', N'Giảm giá trực tiếp', 100000, N'Hội viên thân thiết', '2026-01-01', '2026-12-31', N'Đang áp dụng');

INSERT INTO KhuyenMai_DichVu (MaKhuyenMai, MaDichVu) VALUES
('KM01', 'DV03'),
('KM01', 'DV04'),
('KM02', 'DV05');

INSERT INTO KhuyenMai_SanPham (MaKhuyenMai, MaSanPham) VALUES
('KM01', 'SP01'),
('KM02', 'SP06');

-- =========================================================================
-- 8. LỊCH HẸN & CHI TIẾT LỊCH HẸN
-- =========================================================================
INSERT INTO LichHen (MaLichHen, MaKhachHang, MaNhanVien, MaChiNhanh, NgayHen, GioBatDau, GioKetThuc, TrangThai, TongTien, TienCoc, GhiChu, LyDoHuy) VALUES
('LH01', 'KH01', 'NV02', 'CN01', '2026-09-25', '09:00:00', '10:00:00', N'Hoàn thành', 120000, 0, N'Khách hẹn cắt ngắn 2 bên', NULL),
('LH02', 'KH02', 'NV02', 'CN01', '2026-09-28', '14:00:00', '16:30:00', N'Hoàn thành', 1600000, 200000, N'Nhuộm tông nâu lạnh + uốn', NULL),
('LH03', 'KH03', 'NV04', 'CN02', '2026-10-05', '10:00:00', '11:30:00', N'Đã xác nhận', 800000, 100000, N'Phục hồi Olaplex', NULL);

INSERT INTO ChiTietLichHen (MaChiTietLichHen, MaLichHen, MaDichVu, SoLuong, DonGia, ThanhTien) VALUES
('CTLH01', 'LH01', 'DV01', 1, 120000, 120000),
('CTLH02', 'LH02', 'DV03', 1, 650000, 650000),
('CTLH03', 'LH02', 'DV04', 1, 950000, 950000),
('CTLH04', 'LH03', 'DV05', 1, 800000, 800000);

-- =========================================================================
-- 9. ĐƠN HÀNG SẢN PHẨM & CHI TIẾT ĐƠN HÀNG
-- =========================================================================
ALTER TABLE ChiTietDonHang DISABLE TRIGGER trg_ChiTietDonHang_TruTonKho;

INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu) VALUES
('DH01', 'KH03', 'CN01', '2026-09-26 10:15:00', 340000, N'88 Cách Mạng Tháng 8, Q.3, TP.HCM', N'Giao hàng tận nơi', N'Đã giao', N'Giao giờ hành chính'),
('DH02', 'KH04', 'CN01', '2026-09-29 16:30:00', 552000, N'Nhận tại quầy CN01', N'Tại quầy', N'Đã giao', N'Mua kèm tinh dầu dưỡng');

-- Chi tiết đơn hàng: SP04 còn ~110 ngày hạn (giảm 20% từ 690k -> 552k)
INSERT INTO ChiTietDonHang (MaChiTietDonHang, MaDonHang, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES
('CTDH01', 'DH01', 'SP13', 'CTPN03', 1, 310000, 0.00, 310000, 310000),
('CTDH02', 'DH02', 'SP04', 'CTPN04', 1, 690000, 20.00, 552000, 552000);

ALTER TABLE ChiTietDonHang ENABLE TRIGGER trg_ChiTietDonHang_TruTonKho;

-- =========================================================================
-- 10. HÓA ĐƠN & CHI TIẾT HÓA ĐƠN & THANH TOÁN
-- =========================================================================
ALTER TABLE ChiTietHoaDon_SanPham DISABLE TRIGGER trg_ChiTietHoaDonSanPham_TruTonKho;

-- HD01: Hóa đơn từ Lịch hẹn LH01 (Thực hiện DV01 và mua thêm dầu gội SP01 cận hạn giảm 40%)
-- HD02: Hóa đơn từ Đơn hàng online DH01
INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon) VALUES
('HD01', 'KH01', 'LH01', NULL, 'CN01', '2026-09-25 10:10:00', 408000, N'Đã thanh toán', 'HD-20260925-001'),
('HD02', 'KH03', NULL, 'DH01', 'CN01', '2026-09-26 10:30:00', 310000, N'Đã thanh toán', 'HD-20260926-002');

INSERT INTO ChiTietHoaDon_DichVu (MaHoaDon, MaDichVu, SoLuong, DonGia, ThanhTien) VALUES
('HD01', 'DV01', 1, 120000, 120000);

-- SP01 giá gốc 480k, giảm 40% (cận hạn) còn 288k -> Tổng bill HD01 = 120k + 288k = 408k
INSERT INTO ChiTietHoaDon_SanPham (MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES
('HD01', 'SP01', 'CTPN01', 1, 480000, 40.00, 288000, 288000),
('HD02', 'SP13', 'CTPN03', 1, 310000, 0.00,  310000, 310000);

ALTER TABLE ChiTietHoaDon_SanPham ENABLE TRIGGER trg_ChiTietHoaDonSanPham_TruTonKho;

INSERT INTO ThanhToan (MaThanhToan, MaHoaDon, MaNhanVien, SoTien, PhuongThuc, ThoiGianThanhToan, TrangThai, MaGiaoDich) VALUES
('TT01', 'HD01', 'NV01', 408000, N'Chuyển khoản QR', '2026-09-25 10:15:00', N'Thành công', 'VNPAY9872123'),
('TT02', 'HD02', 'NV01', 310000, N'Tiền mặt', '2026-09-26 10:35:00', N'Thành công', 'CASH001');

-- =========================================================================
-- 11. ĐÁNH GIÁ (FEEDBACK)
-- =========================================================================
INSERT INTO DanhGia (MaDanhGia, MaKhachHang, MaLichHen, MaDonHang, SoSao, NoiDung, HinhAnh, NgayDanhGia, TrangThai, CoFlag) VALUES
('DG01', 'KH01', 'LH01', NULL, 5, N'Thợ cắt rất có tâm, tư vấn kỹ dáng mặt và vuốt sáp đẹp.', NULL, '2026-09-25 11:30:00', N'Hiển thị', 0),
('DG02', 'KH03', NULL, 'DH01', 4, N'Sản phẩm đóng gói cẩn thận, sáp giữ nếp tốt tự nhiên.', NULL, '2026-09-27 18:00:00', N'Hiển thị', 0);
GO

