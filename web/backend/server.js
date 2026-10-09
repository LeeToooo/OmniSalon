// =========================================================================
// OmniSalon — DIRECT SQL ENGINE & REST API SERVER (Node.js Edition)
// Dữ liệu 100% kết nối TRỰC TIẾP vào Microsoft SQL Server (SSMS / SQL Express)
// Cơ sở dữ liệu: QL_SALONTOC (Khởi tạo & cấu trúc chuẩn từ QL_SALON.sql)
// =========================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const sql = require('msnodesqlv8');

const PORT = process.env.PORT || 8080;
const DB_NAME = process.env.SQL_DATABASE || 'QL_SALONTOC';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
const SQL_FILE = fs.existsSync(path.join(__dirname, 'QL_SALON.sql')) 
  ? path.join(__dirname, 'QL_SALON.sql') 
  : (fs.existsSync(path.join(ROOT_DIR, 'web', 'backend', 'QL_SALON.sql')) ? path.join(ROOT_DIR, 'web', 'backend', 'QL_SALON.sql') : path.join(ROOT_DIR, 'QL_SALON.sql'));
const EMAIL_CONFIG_FILE = fs.existsSync(path.join(__dirname, 'email_config.json')) 
  ? path.join(__dirname, 'email_config.json') 
  : path.join(ROOT_DIR, 'email_config.json');

// Danh sách các instance SQL Server thông dụng
const SERVER_INSTANCES = [
  process.env.SQL_SERVER,
  '.\\SQLEXPRESS',
  'localhost\\SQLEXPRESS',
  '(local)\\SQLEXPRESS',
  'localhost',
  '.'
].filter(Boolean);

const DRIVERS = [
  'ODBC Driver 18 for SQL Server',
  'ODBC Driver 17 for SQL Server',
  'SQL Server'
];

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

async function initDbConnection() {
  console.log(`[SQL CONNECT] Đang dò tìm SQL Server Express và kết nối tới CSDL [${DB_NAME}]...`);
  for (const srv of SERVER_INSTANCES) {
    for (const drv of DRIVERS) {
      const connStr = `Server=${srv};Database=${DB_NAME};Trusted_Connection=yes;Driver={${drv}};TrustServerCertificate=yes;`;
      try {
        const rows = await new Promise((resolve, reject) => {
          sql.query(connStr, 'SELECT 1 AS ok;', (err, res) => {
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
          return activeDbConfig;
        }
      } catch (e) {
        // Tiếp tục thử driver/instance kế tiếp
      }
    }
  }

  console.error(`[SQL LỖI] Không thể kết nối tới cơ sở dữ liệu [${DB_NAME}] trên SQL Server Express!`);
  return null;
}

// -------------------------------------------------------------------------
// CẤU HÌNH GỬI EMAIL THẬT QUA GMAIL SMTP (NODEMAILER)
// -------------------------------------------------------------------------
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

const otpStore = new Map();

function getEmailConfig() {
  let config = {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || '',
    fromName: 'OmniSalon Barber Suite'
  };
  if (fs.existsSync(EMAIL_CONFIG_FILE)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(EMAIL_CONFIG_FILE, 'utf8'));
      if (fileData.user) config.user = fileData.user.trim();
      if (fileData.pass) config.pass = fileData.pass.trim();
      if (fileData.fromName) config.fromName = fileData.fromName.trim();
    } catch (e) {
      console.warn('[EMAIL] Không thể đọc email_config.json:', e.message);
    }
  }
  return config;
}

async function sendRealGmailOtp(toEmail, otp) {
  const cfg = getEmailConfig();
  if (!nodemailer || !cfg.user || !cfg.pass) {
    return {
      sentReal: false,
      reason: !nodemailer ? 'Chưa cài đặt nodemailer' : 'Chưa điền thông tin Gmail trong email_config.json'
    };
  }

  const cleanPass = cfg.pass.replace(/\s+/g, '');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: cfg.user,
      pass: cleanPass
    }
  });

  const mailHtml = `
    <div style="max-width: 560px; margin: 0 auto; background: #0f141f; color: #ffffff; padding: 36px 28px; border-radius: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border: 1px solid rgba(255, 255, 255, 0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background: rgba(180, 131, 18, 0.2); color: #f59e0b; border: 1px solid rgba(180, 131, 18, 0.4); padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1px;">
          OMNI SALON BARBER SUITE
        </span>
        <h2 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 14px 0 6px;">MÃ XÁC THỰC BẢO MẬT</h2>
        <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">Hệ thống bảo mật xác nhận danh tính thành viên kết nối SSMS</p>
      </div>
      <div style="background: #171d2b; border: 1px dashed #f59e0b; border-radius: 14px; padding: 24px; text-align: center; margin: 26px 0;">
        <div style="font-size: 12px; color: #cbd5e1; font-weight: 600; margin-bottom: 8px; letter-spacing: 1.5px; text-transform: uppercase;">
          MÃ XÁC THỰC OTP (HIỆU LỰC 5 PHÚT)
        </div>
        <div style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #f59e0b; font-family: 'Courier New', Courier, monospace; margin: 6px 0;">
          ${otp}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          Vui lòng nhập mã này vào trang web để hoàn tất quá trình
        </div>
      </div>
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; text-align: center; font-size: 12px; color: #64748b;">
        © 2026 Omni Salon Barber • Hệ thống CSDL SQL Server QL_SALONTOC
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: toEmail,
    subject: `[OmniSalon] ${otp} là mã xác thực tài khoản của bạn`,
    text: `Mã xác thực OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`,
    html: mailHtml
  });

  return { sentReal: true };
}

// -------------------------------------------------------------------------
// ASSETS & HÌNH ẢNH MẶC ĐỊNH
// -------------------------------------------------------------------------
const branchImgs = {
  CN01: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
  CN02: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
  CN03: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
  CN04: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
  CN06: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
  CN07: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
  CN08: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80'
};

const serviceImgs = {
  DV01: 'Men_Grooming_Products/DichVu_Men/DV1.jpg',
  DV02: 'Men_Grooming_Products/DichVu_Men/DV2.jpg',
  DV03: 'Men_Grooming_Products/DichVu_Men/DV3.jpg',
  DV04: 'Men_Grooming_Products/DichVu_Men/DV4.jpg',
  DV05: 'Men_Grooming_Products/DichVu_Men/DV5.jpg',
  DV06: 'Men_Grooming_Products/DichVu_Men/DV6.jpg',
  DV07: 'Men_Grooming_Products/DichVu_Men/DV7.jpg',
  DV08: 'Men_Grooming_Products/DichVu_Men/DV8.jpg',
  DV09: 'Men_Grooming_Products/DichVu_Men/DV9.jpg',
  DV10: 'Men_Grooming_Products/DichVu_Men/DV10.jpg'
};

const comboImgs = {
  CB01: 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg',
  CB02: 'Men_Grooming_Products/DichVu_Men/CBDV2.jpg',
  CB03: 'Men_Grooming_Products/DichVu_Men/CBDV3.jpg',
  CB04: 'Men_Grooming_Products/DichVu_Men/CBDV4.jpg'
};

const stylistAvatars = {
  NV01: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  NV02: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  NV03: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  NV04: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  NV05: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
};

const catIcons = {
  DM01: '💈', DM02: '✨', DM03: '💨', DM04: '🧴', DM05: '🧼',
  DM06: '🌾', DM07: '🧪', DM08: '🧔', DM09: '✂'
};

const brandPrefixes = [
  'Hanz de Fuko', 'Apestomen', 'Blumaan', 'Kevin Murphy', 'Reuzel',
  'Olaplex', 'Davines', 'By Vilain', 'Uppercut Deluxe',
  'L’Oréal Professionnel', 'Schwarzkopf Professional', 'Morris Motley',
  'Slick Gorilla', 'Dapper Dan', 'Suavecito', 'Proraso', 'Kerasys Homme'
];

function formatTime(val) {
  if (!val) return '08:30';
  if (typeof val === 'string') return val.substring(0, 5);
  if (val instanceof Date) return val.toTimeString().substring(0, 5);
  return String(val).substring(0, 5);
}

function formatDate(val) {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).substring(0, 10);
}

// -------------------------------------------------------------------------
// HÀM LẤY TOÀN BỘ SNAPSHOT DATABASE TỪ SQL SERVER CHO FRONTEND
// -------------------------------------------------------------------------
async function getFullSqlDatabase() {
  const [
    branchRows,
    serviceRows,
    comboRows,
    stylistRows,
    catRows,
    suppRows,
    prodRows,
    bookingRows,
    orderRows,
    promoRows,
    reviewRows,
    userRows
  ] = await Promise.all([
    querySql(`SELECT MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, 
                     CONVERT(VARCHAR(8), GioMoCua) AS GioMoCua, 
                     CONVERT(VARCHAR(8), GioDongCua) AS GioDongCua, 
                     TrangThai FROM ChiNhanh`),
    querySql(`SELECT MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, HinhAnh, TrangThai, 
                     CONVERT(VARCHAR(10), NgayApDung, 120) AS NgayApDung FROM DichVu`),
    querySql(`SELECT MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai FROM ComboDichVu`),
    querySql(`SELECT nv.MaNhanVien, nv.MaChiNhanh, nv.HoTen, nv.SoDienThoai, nv.Email, 
                     nv.CapBac, nv.ChucVu, nv.TrangThai, cn.TenChiNhanh 
              FROM NhanVien nv 
              LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh 
              WHERE nv.TrangThai = N'Đang làm việc'`),
    querySql(`SELECT MaDanhMuc, TenDanhMuc, MoTa, TrangThai FROM DanhMucSanPham`),
    querySql(`SELECT MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, DiaChi FROM NhaCungCap`),
    querySql(`SELECT sp.MaSanPham, sp.MaDanhMuc, sp.MaNhaCungCap, sp.TenSanPham, sp.MoTa, 
                     sp.HinhAnh, sp.GiaNhap, sp.GiaBan, sp.TrangThaiKinhDoanh,
                     dm.TenDanhMuc,
                     ISNULL((SELECT SUM(tk.SoLuongTon) FROM TonKho tk WHERE tk.MaSanPham = sp.MaSanPham), 25) AS SoLuongTon,
                     CONVERT(VARCHAR(10), ctpn.HanSuDung, 120) AS HanSuDung,
                     ctpn.SoLuongConLai
              FROM SanPham sp
              LEFT JOIN DanhMucSanPham dm ON sp.MaDanhMuc = dm.MaDanhMuc
              OUTER APPLY (
                  SELECT TOP 1 HanSuDung, SoLuongConLai 
                  FROM ChiTietPhieuNhap 
                  WHERE MaSanPham = sp.MaSanPham 
                  ORDER BY HanSuDung ASC
              ) ctpn`),
    querySql(`SELECT lh.MaLichHen, lh.MaKhachHang, lh.MaNhanVien, lh.MaChiNhanh, 
                     CONVERT(VARCHAR(10), lh.NgayHen, 120) AS NgayHen,
                     CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau,
                     CONVERT(VARCHAR(8), lh.GioKetThuc) AS GioKetThuc,
                     lh.TrangThai, lh.TongTien, lh.TienCoc, lh.GhiChu, lh.LyDoHuy,
                     kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
                     nv.HoTen AS TenNhanVien,
                     cn.TenChiNhanh
              FROM LichHen lh
              LEFT JOIN KhachHang kh ON lh.MaKhachHang = kh.MaKhachHang
              LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
              LEFT JOIN ChiNhanh cn ON lh.MaChiNhanh = cn.MaChiNhanh
              ORDER BY lh.NgayHen DESC, lh.GioBatDau DESC`),
    querySql(`SELECT dh.MaDonHang, dh.MaKhachHang, dh.MaChiNhanh, 
                     CONVERT(VARCHAR(19), dh.NgayDat, 120) AS NgayDat,
                     dh.TongTien, dh.DiaChiGiaoHang, dh.HinhThucNhan, dh.TrangThai, dh.GhiChu,
                     kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
                     cn.TenChiNhanh
              FROM DonHang dh
              LEFT JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
              LEFT JOIN ChiNhanh cn ON dh.MaChiNhanh = cn.MaChiNhanh
              ORDER BY dh.NgayDat DESC`),
    querySql(`SELECT MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, DoiTuongApDung, 
                     CONVERT(VARCHAR(10), NgayBatDau, 120) AS NgayBatDau, 
                     CONVERT(VARCHAR(10), NgayKetThuc, 120) AS NgayKetThuc, 
                     TrangThai FROM KhuyenMai`),
    querySql(`SELECT dg.MaDanhGia, dg.MaKhachHang, dg.MaLichHen, dg.MaDonHang, dg.SoSao, 
                     dg.NoiDung, dg.HinhAnh, CONVERT(VARCHAR(19), dg.NgayDanhGia, 120) AS NgayDanhGia, 
                     dg.TrangThai, kh.HoTen AS TenKhachHang 
              FROM DanhGia dg 
              LEFT JOIN KhachHang kh ON dg.MaKhachHang = kh.MaKhachHang`),
    querySql(`SELECT tk.MaTaiKhoan, tk.MaNhanVien, tk.MaKhachHang, tk.TenDangNhap, tk.VaiTro, tk.TrangThai,
                     ISNULL(nv.HoTen, kh.HoTen) AS HoTen,
                     ISNULL(nv.SoDienThoai, kh.SoDienThoai) AS SoDienThoai,
                     ISNULL(nv.Email, kh.Email) AS Email,
                     nv.MaChiNhanh
              FROM TaiKhoan tk
              LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
              LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang`)
  ]);

  const branches = branchRows.map(r => {
    const addr = r.DiaChi || '';
    const city = addr.includes('Hà Nội') ? 'Hà Nội' : addr.includes('Đà Nẵng') ? 'Đà Nẵng' : 'TP. Hồ Chí Minh';
    return {
      id: r.MaChiNhanh,
      MaChiNhanh: r.MaChiNhanh,
      name: r.TenChiNhanh,
      TenChiNhanh: r.TenChiNhanh,
      address: addr,
      DiaChi: addr,
      phone: r.SoDienThoai,
      SoDienThoai: r.SoDienThoai,
      openHours: `${formatTime(r.GioMoCua)} - ${formatTime(r.GioDongCua)}`,
      city,
      region: city === 'Hà Nội' ? 'hn' : city === 'Đà Nẵng' ? 'dn' : 'hcm',
      image: branchImgs[r.MaChiNhanh] || branchImgs.CN01,
      status: r.TrangThai || 'Hoạt động'
    };
  });

  const services = serviceRows.map(r => ({
    id: r.MaDichVu,
    MaDichVu: r.MaDichVu,
    name: r.TenDichVu,
    TenDichVu: r.TenDichVu,
    price: parseFloat(r.Gia || 0),
    Gia: parseFloat(r.Gia || 0),
    duration: `${r.ThoiLuong || 45} phút`,
    durationMinutes: parseInt(r.ThoiLuong || 45, 10),
    ThoiLuong: parseInt(r.ThoiLuong || 45, 10),
    description: r.MoTa,
    MoTa: r.MoTa,
    image: r.HinhAnh || serviceImgs[r.MaDichVu] || 'Men_Grooming_Products/DichVu_Men/DV1.jpg',
    HinhAnh: r.HinhAnh || serviceImgs[r.MaDichVu] || 'Men_Grooming_Products/DichVu_Men/DV1.jpg',
    category: ['DV01', 'DV02', 'DV06'].includes(r.MaDichVu) ? 'Cắt & Tạo Kiểu' : ['DV03', 'DV04', 'DV05', 'DV08', 'DV09'].includes(r.MaDichVu) ? 'Uốn & Nhuộm' : 'Chăm Sóc & Phục Hồi',
    rating: 4.95,
    reviewCount: 280,
    status: r.TrangThai
  }));

  const combos = comboRows.map(r => ({
    id: r.MaCombo,
    MaCombo: r.MaCombo,
    name: r.TenCombo,
    TenCombo: r.TenCombo,
    price: parseFloat(r.GiaCombo || 0),
    GiaCombo: parseFloat(r.GiaCombo || 0),
    duration: `${r.ThoiLuong || 90} phút`,
    durationMinutes: r.ThoiLuong || 90,
    description: r.MoTa,
    MoTa: r.MoTa,
    image: r.HinhAnh || comboImgs[r.MaCombo] || 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg',
    HinhAnh: r.HinhAnh || comboImgs[r.MaCombo] || 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg',
    status: r.TrangThai
  }));

  const stylists = stylistRows.map(r => ({
    id: r.MaNhanVien,
    MaNhanVien: r.MaNhanVien,
    branchId: r.MaChiNhanh,
    MaChiNhanh: r.MaChiNhanh,
    branchName: r.TenChiNhanh || `Chi Nhánh ${r.MaChiNhanh}`,
    name: r.HoTen,
    HoTen: r.HoTen,
    phone: r.SoDienThoai,
    email: r.Email,
    level: r.CapBac || 'Master Barber',
    title: `${r.CapBac || 'Master Barber'} • ${r.ChucVu || 'Thợ chính'}`,
    role: r.ChucVu || 'Thợ chính',
    avatar: stylistAvatars[r.MaNhanVien] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: 4.95,
    reviewCount: 350,
    specialty: r.ChucVu?.includes('phụ') ? 'Gội đầu dưỡng sinh, Ép side & Chăm sóc tóc' : 'Tạo kiểu tóc chuyên nghiệp, Fade & Uốn',
    isAvailable: r.TrangThai === 'Đang làm việc'
  }));

  const categories = catRows.map(r => ({
    id: r.MaDanhMuc,
    MaDanhMuc: r.MaDanhMuc,
    name: r.TenDanhMuc,
    TenDanhMuc: r.TenDanhMuc,
    description: r.MoTa,
    MoTa: r.MoTa,
    icon: catIcons[r.MaDanhMuc] || '💈',
    status: r.TrangThai
  }));

  const suppliers = suppRows.map(r => ({
    id: r.MaNhaCungCap,
    name: r.TenNhaCungCap,
    phone: r.SoDienThoai,
    email: r.Email,
    address: r.DiaChi
  }));

  const refDate = new Date();
  const products = prodRows.map(r => {
    let brand = 'Khác';
    for (const b of brandPrefixes) {
      if (r.TenSanPham.toLowerCase().startsWith(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    const price = parseFloat(r.GiaBan || 0);
    let discountPercent = 0;
    let isFlashSale = false;
    let finalPrice = price;

    if (r.HanSuDung) {
      const expDate = new Date(r.HanSuDung);
      const diffTime = expDate - refDate;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) {
        discountPercent = 35;
        isFlashSale = true;
      } else if (daysLeft <= 90) {
        discountPercent = 30;
        isFlashSale = true;
      } else if (daysLeft <= 180) {
        discountPercent = 20;
        isFlashSale = true;
      }
      if (discountPercent > 0) {
        finalPrice = Math.round(price * (1 - (discountPercent / 100)));
      }
    }

    return {
      id: r.MaSanPham,
      MaSanPham: r.MaSanPham,
      name: r.TenSanPham,
      TenSanPham: r.TenSanPham,
      brand,
      categoryId: r.MaDanhMuc,
      MaDanhMuc: r.MaDanhMuc,
      category: r.TenDanhMuc || 'Sản phẩm tạo kiểu',
      supplierId: r.MaNhaCungCap,
      MaNhaCungCap: r.MaNhaCungCap,
      price: finalPrice,
      GiaBan: finalPrice,
      GiaBanThucTe: finalPrice,
      originalPrice: price,
      GiaGoc: price,
      GiaNiemYetGoc: price,
      costPrice: parseFloat(r.GiaNhap || 0),
      GiaNhap: parseFloat(r.GiaNhap || 0),
      image: r.HinhAnh,
      HinhAnh: r.HinhAnh,
      description: r.MoTa,
      MoTa: r.MoTa,
      rating: 4.9,
      reviewCount: 120,
      stock: parseInt(r.SoLuongTon || 25, 10),
      SoLuongTon: parseInt(r.SoLuongTon || 25, 10),
      isFlashSale,
      discountPercent,
      PhanTramGiam: discountPercent,
      status: (r.TrangThaiKinhDoanh === 'Đang bán') ? 'Available' : 'Discontinued'
    };
  });

  const bookings = bookingRows.map(r => {
    let cName = r.TenKhachHang || 'Khách Hàng Omni';
    let cPhone = r.SdtKhachHang || '0908888999';
    let sName = 'Dịch vụ chăm sóc tóc Omni';
    const rawNote = r.GhiChu || '';

    const nameMatch = rawNote.match(/Khách:\s*([^|;]+)/i);
    if (nameMatch) cName = nameMatch[1].trim();

    const phoneMatch = rawNote.match(/SĐT:\s*([^|;]+)/i);
    if (phoneMatch) cPhone = phoneMatch[1].trim();

    const srvMatch = rawNote.match(/DV:\s*([^|;]+)/i);
    if (srvMatch) sName = srvMatch[1].trim();

    const st = r.TrangThai;
    const uiStatus = st === 'Hoàn thành' ? 'Completed' : (st === 'Đã hủy' ? 'Cancelled' : (st === 'In_Progress' ? 'in_progress' : 'Confirmed'));

    return {
      id: r.MaLichHen,
      MaLichHen: r.MaLichHen,
      bookingCode: r.MaLichHen,
      customerId: r.MaKhachHang,
      customerName: cName,
      customerPhone: cPhone,
      stylistId: r.MaNhanVien,
      stylistName: r.TenNhanVien || 'Master Stylist Chuyên Nghiệp',
      branchId: r.MaChiNhanh,
      branchName: r.TenChiNhanh || 'Omni Salon Chi Nhánh',
      bookingDate: formatDate(r.NgayHen),
      date: formatDate(r.NgayHen),
      timeSlot: formatTime(r.GioBatDau),
      status: uiStatus,
      TrangThai: st,
      serviceName: sName,
      totalPrice: parseFloat(r.TongTien || 0),
      TongTien: parseFloat(r.TongTien || 0),
      notes: rawNote,
      LyDoHuy: r.LyDoHuy
    };
  });

  const orders = orderRows.map(r => ({
    id: r.MaDonHang,
    MaDonHang: r.MaDonHang,
    customerId: r.MaKhachHang,
    customerName: r.TenKhachHang || 'Khách Hàng Omni',
    customerPhone: r.SdtKhachHang || '0908888999',
    branchId: r.MaChiNhanh,
    branchName: r.TenChiNhanh,
    orderDate: r.NgayDat,
    totalAmount: parseFloat(r.TongTien || 0),
    TongTien: parseFloat(r.TongTien || 0),
    shippingAddress: r.DiaChiGiaoHang,
    receiveMethod: r.HinhThucNhan,
    orderStatus: r.TrangThai === 'Đã giao' ? 'Completed' : 'Processing',
    TrangThai: r.TrangThai,
    notes: r.GhiChu
  }));

  const promotions = promoRows.map(r => ({
    id: r.MaKhuyenMai,
    name: r.TenKhuyenMai,
    type: r.HinhThuc,
    value: parseFloat(r.GiaTriGiam || 0),
    target: r.DoiTuongApDung,
    startDate: r.NgayBatDau,
    endDate: r.NgayKetThuc,
    status: r.TrangThai
  }));

  const reviews = reviewRows.map(r => ({
    id: r.MaDanhGia,
    customerId: r.MaKhachHang,
    customerName: r.TenKhachHang || 'Khách Hàng',
    bookingId: r.MaLichHen,
    orderId: r.MaDonHang,
    rating: r.SoSao,
    comment: r.NoiDung,
    image: r.HinhAnh,
    date: r.NgayDanhGia,
    status: r.TrangThai
  }));

  const users = userRows.map(r => ({
    id: r.MaTaiKhoan,
    username: r.TenDangNhap,
    fullName: r.HoTen,
    phone: r.SoDienThoai,
    email: r.Email,
    role: r.VaiTro === 'Quản lý' ? 'BRANCH_MANAGER' : (r.VaiTro === 'Thu ngân' ? 'CASHIER' : (r.VaiTro === 'Nhân viên' ? 'STYLIST' : 'CUSTOMER')),
    roleName: r.VaiTro,
    branchId: r.MaChiNhanh || 'ALL',
    status: r.TrangThai
  }));

  return {
    version: '5.2.0 (SSMS 20 Complete Schema Engine)',
    engine: 'Microsoft SQL Server (T-SQL Direct)',
    server: activeDbConfig?.server || '.\\SQLEXPRESS',
    database: DB_NAME,
    lastUpdated: new Date().toISOString(),
    branches,
    services,
    combos,
    stylists,
    categories,
    suppliers,
    products,
    bookings,
    orders,
    promotions,
    reviews,
    users
  };
}

// -------------------------------------------------------------------------
// HTTP SERVER & REST API ROUTER
// -------------------------------------------------------------------------
const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  let body = '';
  req.on('data', chunk => { body += chunk.toString('utf8'); });
  req.on('end', async () => {
    let parsedBody = null;
    if (body) {
      try { parsedBody = JSON.parse(body); } catch (e) { }
    }

    try {
      // --- 1. HEALTH CHECK ---
      if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          status: 'ok',
          engine: 'MSSQL_EXPRESS_DIRECT',
          server: activeDbConfig?.server,
          database: DB_NAME,
          connected: !!activeDbConfig,
          time: new Date().toISOString()
        }));
      }

      // --- 2. AUTH: SEND OTP ---
      if (pathname === '/api/auth/send-otp' && method === 'POST') {
        const { email } = parsedBody || {};
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: 'Địa chỉ email không hợp lệ.' }));
        }
        const lowerEmail = email.trim().toLowerCase();
        const now = Date.now();
        const existing = otpStore.get(lowerEmail);
        if (existing && (now - existing.lastSentAt) < 30000) {
          const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
          res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: `Vui lòng đợi ${waitSec} giây trước khi gửi lại mã.` }));
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(lowerEmail, { otp, expiresAt: now + 5 * 60 * 1000, lastSentAt: now });

        let realSendStatus = null;
        try {
          realSendStatus = await sendRealGmailOtp(lowerEmail, otp);
        } catch (err) {
          realSendStatus = { sentReal: false, error: err.message };
        }

        console.log(`[OTP] Gửi mã xác nhận ${otp} đến ${lowerEmail}`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          message: realSendStatus?.sentReal
            ? `Mã xác nhận đã gửi về ${lowerEmail}. Vui lòng kiểm tra hộp thư đến hoặc Spam.`
            : `Mã OTP xác thực: ${otp}`,
          email: lowerEmail,
          otp
        }));
      }

      // --- 3. AUTH: VERIFY OTP ---
      if (pathname === '/api/auth/verify-otp' && method === 'POST') {
        const { email, otp } = parsedBody || {};
        const lowerEmail = (email || '').trim().toLowerCase();
        const entry = otpStore.get(lowerEmail);
        if (!entry || Date.now() > entry.expiresAt || entry.otp !== String(otp).trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn.' }));
        }
        otpStore.delete(lowerEmail);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Xác thực email thành công!' }));
      }

      // --- 4. AUTH: REGISTER ---
      if (pathname === '/api/auth/register' && method === 'POST') {
        const data = parsedBody || {};
        const fullName = (data.fullName || data.name || '').trim();
        const phone = (data.phone || '').trim();
        const email = (data.email || '').trim().toLowerCase();
        const password = (data.password || '').trim();

        if (!fullName || !phone || !email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: 'Vui lòng điền đầy đủ thông tin đăng ký.' }));
        }

        const maxKhRows = await querySql(`SELECT TOP 1 MaKhachHang FROM KhachHang WHERE MaKhachHang LIKE 'KH%' ORDER BY LEN(MaKhachHang) DESC, MaKhachHang DESC`);
        let nextNum = 21;
        if (maxKhRows && maxKhRows[0]) {
          const numMatch = maxKhRows[0].MaKhachHang.match(/KH(\d+)/i);
          if (numMatch) nextNum = parseInt(numMatch[1], 10) + 1;
        }
        const khId = 'KH' + (nextNum < 10 ? '0' + nextNum : nextNum);
        const tkId = 'TK_' + khId;

        await querySql(
          `INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh) VALUES (?, ?, ?, ?, '2000-01-01');`,
          [khId, fullName, phone, email]
        );
        await querySql(
          `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai) VALUES (?, NULL, ?, ?, ?, N'Khách hàng', N'Hoạt động');`,
          [tkId, khId, phone, password]
        );

        console.log(`[SQL EXEC] Đăng ký thành công ${khId} (${fullName}) vào SQL Server!`);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Đăng ký tài khoản thành công! Dữ liệu đã lưu trực tiếp vào CSDL SQL Server.',
          user: {
            id: tkId,
            MaKhachHang: khId,
            username: phone,
            fullName,
            phone,
            email,
            role: 'CUSTOMER',
            roleName: 'Khách Hàng Thành Viên'
          }
        }));
      }

      // --- 5. AUTH: RESET PASSWORD ---
      if (pathname === '/api/auth/reset-password' && method === 'POST') {
        const data = parsedBody || {};
        const identifier = (data.identifier || data.email || data.phone || '').trim();
        const newPassword = (data.newPassword || data.password || '').trim();

        if (!identifier || !newPassword) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: 'Thiếu thông tin đổi mật khẩu.' }));
        }

        await querySql(
          `UPDATE TaiKhoan 
           SET MatKhau = ? 
           WHERE TenDangNhap = ? 
              OR MaKhachHang IN (SELECT MaKhachHang FROM KhachHang WHERE Email = ? OR SoDienThoai = ?);`,
          [newPassword, identifier, identifier, identifier]
        );

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật trực tiếp vào SQL Server.'
        }));
      }

      // --- 6. AUTH: LOGIN ---
      if (pathname === '/api/auth/login' && method === 'POST') {
        const { identifier, password } = parsedBody || {};
        if (!identifier || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu.' }));
        }

        const ident = identifier.trim().toLowerCase();
        const pass = String(password).trim();

        if ((ident === 'admin' || ident === 'quantri') && pass === 'admin123') {
          return res.end(JSON.stringify({
            success: true,
            message: 'Đăng nhập Quản Trị thành công!',
            user: {
              id: 'TK_ADMIN',
              username: 'admin',
              fullName: 'Tổng Quản Trị Hệ Thống',
              role: 'SUPER_ADMIN',
              roleName: 'Quản Trị Tối Cao',
              branchId: 'ALL',
              branchName: 'Toàn Hệ Thống',
              email: 'admin@omnisalon.vn'
            },
            token: 'JWT_SUPER_ADMIN_' + Date.now()
          }));
        }

        const userRows = await querySql(
          `SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MatKhau, tk.VaiTro, tk.TrangThai AS TrangThaiTK,
                  nv.MaNhanVien, nv.HoTen AS HoTenNV, nv.MaChiNhanh, nv.SoDienThoai AS SdtNV, nv.Email AS EmailNV, nv.CapBac, nv.ChucVu,
                  kh.MaKhachHang, kh.HoTen AS HoTenKH, kh.SoDienThoai AS SdtKH, kh.Email AS EmailKH
           FROM TaiKhoan tk
           LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
           LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
           WHERE LOWER(tk.TenDangNhap) = ? 
              OR LOWER(tk.MaTaiKhoan) = ?
              OR LOWER(nv.MaNhanVien) = ? 
              OR nv.SoDienThoai = ? 
              OR LOWER(nv.Email) = ?
              OR LOWER(kh.MaKhachHang) = ? 
              OR kh.SoDienThoai = ? 
              OR LOWER(kh.Email) = ?`,
          [ident, ident, ident, ident, ident, ident, ident, ident]
        );

        if (userRows && userRows.length > 0) {
          const matched = userRows.find(u => u.MatKhau === pass);
          if (matched) {
            let role = 'CUSTOMER';
            let roleName = 'Khách Hàng Thành Viên';
            let userObj = {};

            if (matched.MaNhanVien) {
              const roleMap = {
                'Quản lý chi nhánh': 'BRANCH_MANAGER',
                'Thợ chính': 'STYLIST',
                'Thợ phụ': 'STYLIST',
                'Thu ngân': 'CASHIER'
              };
              role = roleMap[matched.ChucVu] || 'STAFF';
              roleName = matched.ChucVu || 'Nhân Viên';
              userObj = {
                id: matched.MaTaiKhoan,
                MaNhanVien: matched.MaNhanVien,
                username: matched.TenDangNhap,
                fullName: matched.HoTenNV,
                role,
                roleName,
                branchId: matched.MaChiNhanh,
                branchName: 'Chi Nhánh ' + matched.MaChiNhanh,
                phone: matched.SdtNV,
                email: matched.EmailNV
              };
            } else {
              userObj = {
                id: matched.MaTaiKhoan,
                MaKhachHang: matched.MaKhachHang,
                username: matched.TenDangNhap,
                fullName: matched.HoTenKH,
                role: 'CUSTOMER',
                roleName: 'Khách Hàng Thành Viên',
                phone: matched.SdtKH,
                email: matched.EmailKH
              };
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
              success: true,
              message: 'Đăng nhập thành công từ SQL Server!',
              user: userObj,
              token: 'JWT_' + role + '_' + Date.now()
            }));
          }
        }

        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Sai thông tin đăng nhập hoặc mật khẩu.' }));
      }

      // --- 7. DATABASE SNAPSHOT ---
      if (pathname === '/api/database' && method === 'GET') {
        const dbData = await getFullSqlDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(dbData));
      }

      // --- 8. BRANCHES ---
      if (pathname === '/api/branches' && method === 'GET') {
        const rows = await querySql(`SELECT MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, 
                                            CONVERT(VARCHAR(8), GioMoCua) AS GioMoCua, 
                                            CONVERT(VARCHAR(8), GioDongCua) AS GioDongCua, 
                                            TrangThai FROM ChiNhanh`);
        const branches = rows.map(r => ({
          id: r.MaChiNhanh,
          MaChiNhanh: r.MaChiNhanh,
          name: r.TenChiNhanh,
          TenChiNhanh: r.TenChiNhanh,
          address: r.DiaChi,
          DiaChi: r.DiaChi,
          phone: r.SoDienThoai,
          SoDienThoai: r.SoDienThoai,
          openHours: `${formatTime(r.GioMoCua)} - ${formatTime(r.GioDongCua)}`,
          image: branchImgs[r.MaChiNhanh] || branchImgs.CN01,
          status: r.TrangThai || 'Hoạt động'
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(branches));
      }

      if (pathname === '/api/branches' && method === 'POST') {
        const b = parsedBody || {};
        const maxCn = await querySql(`SELECT TOP 1 MaChiNhanh FROM ChiNhanh WHERE MaChiNhanh LIKE 'CN%' ORDER BY LEN(MaChiNhanh) DESC, MaChiNhanh DESC`);
        let nextN = 21;
        if (maxCn && maxCn[0]) {
          const nm = maxCn[0].MaChiNhanh.match(/CN(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const cnId = b.id || b.MaChiNhanh || ('CN' + (nextN < 10 ? '0' + nextN : nextN));
        const name = b.name || b.TenChiNhanh || `Omni Salon Chi Nhánh ${cnId}`;
        const addr = b.address || b.DiaChi || 'TP. Hồ Chí Minh';
        const phone = b.phone || b.SoDienThoai || '0901111000';
        const openTime = b.openTime || b.GioMoCua || '08:30:00';
        const closeTime = b.closeTime || b.GioDongCua || '21:30:00';

        await querySql(
          `INSERT INTO ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, GioMoCua, GioDongCua, TrangThai) VALUES (?, ?, ?, ?, ?, ?, N'Hoạt động')`,
          [cnId, name, addr, phone, openTime, closeTime]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          branch: { id: cnId, MaChiNhanh: cnId, name, TenChiNhanh: name, address: addr, phone, openHours: `${openTime} - ${closeTime}` }
        }));
      }

      if (pathname.startsWith('/api/branches/') && method === 'PUT') {
        const id = pathname.replace('/api/branches/', '').trim();
        const b = parsedBody || {};
        await querySql(
          `UPDATE ChiNhanh SET TenChiNhanh = ?, DiaChi = ?, SoDienThoai = ? WHERE MaChiNhanh = ?`,
          [b.name || b.TenChiNhanh, b.address || b.DiaChi, b.phone || b.SoDienThoai, id]
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, id }));
      }

      if (pathname.startsWith('/api/branches/') && method === 'DELETE') {
        const id = pathname.replace('/api/branches/', '').trim();
        await querySql(`DELETE FROM ChiNhanh WHERE MaChiNhanh = ?`, [id]);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Đã xóa chi nhánh khỏi SQL Server', id }));
      }

      // --- 9. STYLISTS / NHÂN VIÊN ---
      if (pathname === '/api/stylists' && method === 'GET') {
        const branchParam = parsedUrl.searchParams.get('branch_id');
        let q = `SELECT nv.MaNhanVien, nv.MaChiNhanh, nv.HoTen, nv.SoDienThoai, nv.Email, 
                        nv.CapBac, nv.ChucVu, nv.TrangThai, cn.TenChiNhanh 
                 FROM NhanVien nv 
                 LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh 
                 WHERE nv.TrangThai = N'Đang làm việc'`;
        const params = [];
        if (branchParam) {
          q += ` AND nv.MaChiNhanh = ?`;
          params.push(branchParam);
        }
        const rows = await querySql(q, params);
        const stylists = rows.map(r => ({
          id: r.MaNhanVien,
          MaNhanVien: r.MaNhanVien,
          branchId: r.MaChiNhanh,
          MaChiNhanh: r.MaChiNhanh,
          branchName: r.TenChiNhanh,
          name: r.HoTen,
          HoTen: r.HoTen,
          phone: r.SoDienThoai,
          email: r.Email,
          level: r.CapBac,
          title: `${r.CapBac} • ${r.ChucVu}`,
          role: r.ChucVu,
          avatar: stylistAvatars[r.MaNhanVien] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          rating: 4.95,
          reviewCount: 350,
          specialty: r.ChucVu?.includes('phụ') ? 'Gội đầu dưỡng sinh, Ép side & Chăm sóc tóc' : 'Tạo kiểu tóc chuyên nghiệp, Fade & Uốn',
          isAvailable: true
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(stylists));
      }

      if (pathname === '/api/stylists' && method === 'POST') {
        const st = parsedBody || {};
        const maxNv = await querySql(`SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaNhanVien LIKE 'NV%' ORDER BY LEN(MaNhanVien) DESC, MaNhanVien DESC`);
        let nextN = 81;
        if (maxNv && maxNv[0]) {
          const nm = maxNv[0].MaNhanVien.match(/NV(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const nvId = st.id || st.MaNhanVien || ('NV' + (nextN < 10 ? '0' + nextN : nextN));
        const branchId = st.branchId || st.MaChiNhanh || 'CN01';
        const name = st.name || st.HoTen || 'Thợ Mới';
        const phone = st.phone || st.SoDienThoai || '0912000000';
        const email = st.email || `${nvId.toLowerCase()}@salontoc.vn`;
        const role = st.role || st.ChucVu || 'Thợ chính';
        const level = st.level || st.CapBac || (role === 'Thợ phụ' ? 'Junior Barber' : 'Master Barber');

        await querySql(
          `INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, CapBac, ChucVu, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, N'Đang làm việc')`,
          [nvId, branchId, name, phone, email, level, role]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          stylist: { id: nvId, MaNhanVien: nvId, branchId, name, level, role, phone, email }
        }));
      }

      if (pathname.startsWith('/api/stylists/') && method === 'PUT') {
        const id = pathname.replace('/api/stylists/', '').trim();
        const st = parsedBody || {};
        await querySql(
          `UPDATE NhanVien SET HoTen = ?, MaChiNhanh = ?, SoDienThoai = ?, Email = ?, CapBac = ?, ChucVu = ? WHERE MaNhanVien = ?`,
          [st.name || st.HoTen, st.branchId || st.MaChiNhanh, st.phone || st.SoDienThoai, st.email, st.level || st.CapBac, st.role || st.ChucVu, id]
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, id }));
      }

      if (pathname.startsWith('/api/stylists/') && method === 'DELETE') {
        const id = pathname.replace('/api/stylists/', '').trim();
        await querySql(`DELETE FROM NhanVien WHERE MaNhanVien = ?`, [id]);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Đã xóa nhân viên khỏi SQL Server', id }));
      }

      // --- 10. SERVICES / DỊCH VỤ ---
      if (pathname === '/api/services' && method === 'GET') {
        const rows = await querySql(`SELECT MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, HinhAnh, TrangThai FROM DichVu`);
        const services = rows.map(r => ({
          id: r.MaDichVu,
          MaDichVu: r.MaDichVu,
          name: r.TenDichVu,
          TenDichVu: r.TenDichVu,
          price: parseFloat(r.Gia || 0),
          Gia: parseFloat(r.Gia || 0),
          duration: `${r.ThoiLuong} phút`,
          durationMinutes: r.ThoiLuong,
          description: r.MoTa,
          MoTa: r.MoTa,
          image: r.HinhAnh || serviceImgs[r.MaDichVu] || 'Men_Grooming_Products/DichVu_Men/DV1.jpg',
          HinhAnh: r.HinhAnh || serviceImgs[r.MaDichVu] || 'Men_Grooming_Products/DichVu_Men/DV1.jpg',
          category: ['DV01', 'DV02', 'DV06'].includes(r.MaDichVu) ? 'Cắt & Tạo Kiểu' : ['DV03', 'DV04', 'DV05', 'DV08', 'DV09'].includes(r.MaDichVu) ? 'Uốn & Nhuộm' : 'Chăm Sóc & Phục Hồi',
          rating: 4.95,
          reviewCount: 280
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(services));
      }

      if (pathname === '/api/services' && method === 'POST') {
        const srv = parsedBody || {};
        const maxDv = await querySql(`SELECT TOP 1 MaDichVu FROM DichVu WHERE MaDichVu LIKE 'DV%' ORDER BY LEN(MaDichVu) DESC, MaDichVu DESC`);
        let nextN = 11;
        if (maxDv && maxDv[0]) {
          const nm = maxDv[0].MaDichVu.match(/DV(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const dvId = srv.id || srv.MaDichVu || ('DV' + (nextN < 10 ? '0' + nextN : nextN));
        const name = srv.name || srv.TenDichVu || 'Dịch vụ mới';
        const desc = srv.description || srv.MoTa || 'Dịch vụ chuẩn Omni';
        const duration = parseInt(srv.duration || srv.ThoiLuong || 45, 10);
        const price = parseFloat(srv.price || srv.Gia || 150000);

        await querySql(
          `INSERT INTO DichVu (MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, TrangThai, NgayApDung) VALUES (?, ?, ?, ?, ?, N'Kinh doanh', GETDATE())`,
          [dvId, name, desc, duration, price]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          service: { id: dvId, MaDichVu: dvId, name, TenDichVu: name, price, duration: `${duration} phút`, description: desc }
        }));
      }

      if (pathname.startsWith('/api/services/') && method === 'DELETE') {
        const id = pathname.replace('/api/services/', '').trim();
        await querySql(`DELETE FROM DichVu WHERE MaDichVu = ?`, [id]);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Đã xóa dịch vụ khỏi SQL Server', id }));
      }

      // --- 11. COMBOS / GÓI COMBO VIP ---
      if (pathname === '/api/combos' && method === 'GET') {
        const rows = await querySql(`SELECT MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai FROM ComboDichVu`);
        const combos = rows.map(r => ({
          id: r.MaCombo,
          MaCombo: r.MaCombo,
          name: r.TenCombo,
          TenCombo: r.TenCombo,
          price: parseFloat(r.GiaCombo || 0),
          GiaCombo: parseFloat(r.GiaCombo || 0),
          duration: `${r.ThoiLuong || 90} phút`,
          durationMinutes: r.ThoiLuong || 90,
          description: r.MoTa,
          MoTa: r.MoTa,
          image: r.HinhAnh || comboImgs[r.MaCombo] || 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg',
          HinhAnh: r.HinhAnh || comboImgs[r.MaCombo] || 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg',
          status: r.TrangThai
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(combos));
      }

      if (pathname === '/api/combos' && method === 'POST') {
        const cb = parsedBody || {};
        const maxCb = await querySql(`SELECT TOP 1 MaCombo FROM ComboDichVu WHERE MaCombo LIKE 'CB%' ORDER BY LEN(MaCombo) DESC, MaCombo DESC`);
        let nextN = 5;
        if (maxCb && maxCb[0]) {
          const nm = maxCb[0].MaCombo.match(/CB(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const cbId = cb.id || cb.MaCombo || ('CB' + (nextN < 10 ? '0' + nextN : nextN));
        const name = cb.name || cb.TenCombo || 'Combo mới';
        const desc = cb.description || cb.MoTa || 'Combo dịch vụ cao cấp';
        const price = parseFloat(cb.price || cb.GiaCombo || 300000);
        const duration = parseInt(cb.duration || cb.ThoiLuong || 90, 10);
        const img = cb.image || cb.HinhAnh || 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg';

        await querySql(
          `INSERT INTO ComboDichVu (MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai) VALUES (?, ?, ?, ?, ?, ?, N'Đang kinh doanh')`,
          [cbId, name, desc, price, duration, img]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, combo: { id: cbId, name, price, duration, description: desc } }));
      }

      if (pathname.startsWith('/api/combos/') && method === 'DELETE') {
        const id = pathname.replace('/api/combos/', '').trim();
        await querySql(`DELETE FROM ComboDichVu WHERE MaCombo = ?`, [id]);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Đã xóa combo khỏi SQL Server', id }));
      }

      // --- 12. PRODUCTS / SẢN PHẨM ---
      if (pathname === '/api/products' && method === 'GET') {
        const rows = await querySql(`SELECT sp.MaSanPham, sp.MaDanhMuc, sp.MaNhaCungCap, sp.TenSanPham, sp.MoTa, 
                                            sp.HinhAnh, sp.GiaNhap, sp.GiaBan, sp.TrangThaiKinhDoanh,
                                            dm.TenDanhMuc,
                                            ISNULL((SELECT SUM(tk.SoLuongTon) FROM TonKho tk WHERE tk.MaSanPham = sp.MaSanPham), 25) AS SoLuongTon,
                                            CONVERT(VARCHAR(10), ctpn.HanSuDung, 120) AS HanSuDung
                                     FROM SanPham sp
                                     LEFT JOIN DanhMucSanPham dm ON sp.MaDanhMuc = dm.MaDanhMuc
                                     OUTER APPLY (
                                         SELECT TOP 1 HanSuDung FROM ChiTietPhieuNhap WHERE MaSanPham = sp.MaSanPham ORDER BY HanSuDung ASC
                                     ) ctpn`);
        const refDate = new Date();
        const products = rows.map(r => {
          let brand = 'Khác';
          for (const b of brandPrefixes) {
            if (r.TenSanPham.toLowerCase().startsWith(b.toLowerCase())) {
              brand = b;
              break;
            }
          }
          const price = parseFloat(r.GiaBan || 0);
          let discountPercent = 0;
          let isFlashSale = false;
          let finalPrice = price;

          if (r.HanSuDung) {
            const expDate = new Date(r.HanSuDung);
            const diffTime = expDate - refDate;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysLeft <= 30) { discountPercent = 35; isFlashSale = true; }
            else if (daysLeft <= 90) { discountPercent = 30; isFlashSale = true; }
            else if (daysLeft <= 180) { discountPercent = 20; isFlashSale = true; }
            if (discountPercent > 0) finalPrice = Math.round(price * (1 - (discountPercent / 100)));
          }

          return {
            id: r.MaSanPham,
            MaSanPham: r.MaSanPham,
            name: r.TenSanPham,
            TenSanPham: r.TenSanPham,
            brand,
            categoryId: r.MaDanhMuc,
            category: r.TenDanhMuc || 'Sản phẩm tạo kiểu',
            price: finalPrice,
            originalPrice: price,
            image: r.HinhAnh,
            description: r.MoTa,
            stock: parseInt(r.SoLuongTon || 25, 10),
            isFlashSale,
            discountPercent
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(products));
      }

      if (pathname === '/api/products' && method === 'POST') {
        const prod = parsedBody || {};
        const maxSp = await querySql(`SELECT TOP 1 MaSanPham FROM SanPham WHERE MaSanPham LIKE 'SP%' ORDER BY LEN(MaSanPham) DESC, MaSanPham DESC`);
        let nextN = 131;
        if (maxSp && maxSp[0]) {
          const nm = maxSp[0].MaSanPham.match(/SP(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const spId = prod.id || prod.MaSanPham || ('SP' + (nextN < 10 ? '0' + nextN : nextN));
        const catId = prod.categoryId || prod.MaDanhMuc || 'DM01';
        const nccId = prod.supplierId || prod.MaNhaCungCap || 'NCC01';
        const name = prod.name || prod.TenSanPham || 'Sản phẩm mới';
        const desc = prod.description || prod.MoTa || 'Sản phẩm chăm sóc tóc';
        const img = prod.image || prod.HinhAnh || 'Men_Grooming_Products/01_Sap_Vuot_Toc_Pomade/Hanz_de_Fuko/Hanz_de_Fuko_Claymation.jpg';
        const price = parseFloat(prod.price || prod.GiaBan || 250000);
        const cost = parseFloat(prod.costPrice || prod.GiaNhap || Math.round(price * 0.7));

        await querySql(
          `INSERT INTO SanPham (MaSanPham, MaDanhMuc, MaNhaCungCap, TenSanPham, MoTa, HinhAnh, GiaNhap, GiaBan, TrangThaiKinhDoanh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, N'Đang bán')`,
          [spId, catId, nccId, name, desc, img, cost, price]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          product: { id: spId, MaSanPham: spId, name, TenSanPham: name, price, originalPrice: price, image: img, description: desc }
        }));
      }

      if (pathname.startsWith('/api/products/') && method === 'DELETE') {
        const id = pathname.replace('/api/products/', '').trim();
        await querySql(`DELETE FROM SanPham WHERE MaSanPham = ?`, [id]);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Đã xóa sản phẩm khỏi SQL Server', id }));
      }

      // --- 13. INVENTORY / KHO HÀNG ---
      if (pathname === '/api/inventory' && method === 'GET') {
        const branchParam = parsedUrl.searchParams.get('branch_id');
        let q = `SELECT tk.MaSanPham, tk.MaChiNhanh, tk.SoLuongTon, tk.MucCanhBao,
                        sp.TenSanPham, sp.GiaBan, sp.GiaNhap, sp.HinhAnh,
                        cn.TenChiNhanh
                 FROM TonKho tk
                 JOIN SanPham sp ON tk.MaSanPham = sp.MaSanPham
                 JOIN ChiNhanh cn ON tk.MaChiNhanh = cn.MaChiNhanh`;
        const params = [];
        if (branchParam) {
          q += ` WHERE tk.MaChiNhanh = ?`;
          params.push(branchParam);
        }
        const rows = await querySql(q, params);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      if (pathname.includes('/inventory/') && pathname.includes('/stock') && method === 'PUT') {
        const parts = pathname.split('/');
        const prodId = parts[3];
        const { stock, branchId } = parsedBody || {};
        const bId = branchId || 'CN01';
        await querySql(
          `UPDATE TonKho SET SoLuongTon = ?, NgayCapNhat = GETDATE() WHERE MaSanPham = ? AND MaChiNhanh = ?`,
          [stock, prodId, bId]
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, productId: prodId, newStock: stock }));
      }

      // --- 14. CATEGORIES ---
      if (pathname === '/api/categories' && method === 'GET') {
        const rows = await querySql(`SELECT MaDanhMuc, TenDanhMuc, MoTa, TrangThai FROM DanhMucSanPham`);
        const categories = rows.map(r => ({
          id: r.MaDanhMuc,
          MaDanhMuc: r.MaDanhMuc,
          name: r.TenDanhMuc,
          TenDanhMuc: r.TenDanhMuc,
          description: r.MoTa,
          MoTa: r.MoTa,
          icon: catIcons[r.MaDanhMuc] || '💈',
          status: r.TrangThai
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(categories));
      }

      // --- 15. BOOKINGS / ĐẶT LỊCH ---
      if (pathname === '/api/bookings/available-slots' && method === 'GET') {
        const date = parsedUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const stylistId = parsedUrl.searchParams.get('stylistId') || 'NV02';
        const bookedRows = await querySql(
          `SELECT CONVERT(VARCHAR(8), GioBatDau) AS GioBatDau 
           FROM LichHen 
           WHERE MaNhanVien = ? AND CONVERT(VARCHAR(10), NgayHen, 120) = ? AND TrangThai NOT IN (N'Đã hủy')`,
          [stylistId, date]
        );
        const bookedTimes = new Set(bookedRows.map(r => formatTime(r.GioBatDau)));
        const allSlots = ['08:30', '09:15', '10:00', '10:45', '11:30', '13:30', '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '18:45', '19:30', '20:15'];
        const slots = allSlots.map(t => ({
          time: t,
          available: !bookedTimes.has(t)
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(slots));
      }

      if (pathname === '/api/bookings/lookup' && method === 'GET') {
        const q = parsedUrl.searchParams.get('q') || '';
        const rows = await querySql(
          `SELECT lh.MaLichHen, lh.NgayHen, lh.GioBatDau, lh.TrangThai, lh.TongTien, lh.GhiChu,
                  kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
                  nv.HoTen AS TenNhanVien, cn.TenChiNhanh
           FROM LichHen lh
           LEFT JOIN KhachHang kh ON lh.MaKhachHang = kh.MaKhachHang
           LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
           LEFT JOIN ChiNhanh cn ON lh.MaChiNhanh = cn.MaChiNhanh
           WHERE lh.MaLichHen LIKE ? OR kh.SoDienThoai LIKE ? OR kh.HoTen LIKE ?`,
          [`%${q}%`, `%${q}%`, `%${q}%`]
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      if (pathname === '/api/bookings' && method === 'GET') {
        const rows = await querySql(`SELECT lh.MaLichHen, lh.MaKhachHang, lh.MaNhanVien, lh.MaChiNhanh, 
                                            CONVERT(VARCHAR(10), lh.NgayHen, 120) AS NgayHen,
                                            CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau,
                                            CONVERT(VARCHAR(8), lh.GioKetThuc) AS GioKetThuc,
                                            lh.TrangThai, lh.TongTien, lh.TienCoc, lh.GhiChu, lh.LyDoHuy,
                                            kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
                                            nv.HoTen AS TenNhanVien,
                                            cn.TenChiNhanh
                                     FROM LichHen lh
                                     LEFT JOIN KhachHang kh ON lh.MaKhachHang = kh.MaKhachHang
                                     LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
                                     LEFT JOIN ChiNhanh cn ON lh.MaChiNhanh = cn.MaChiNhanh
                                     ORDER BY lh.NgayHen DESC, lh.GioBatDau DESC`);
        const bookings = rows.map(r => {
          let cName = r.TenKhachHang || 'Khách Hàng Omni';
          let cPhone = r.SdtKhachHang || '0908888999';
          let sName = 'Dịch vụ chăm sóc tóc Omni';
          const rawNote = r.GhiChu || '';
          const nameMatch = rawNote.match(/Khách:\s*([^|;]+)/i);
          if (nameMatch) cName = nameMatch[1].trim();
          const phoneMatch = rawNote.match(/SĐT:\s*([^|;]+)/i);
          if (phoneMatch) cPhone = phoneMatch[1].trim();
          const srvMatch = rawNote.match(/DV:\s*([^|;]+)/i);
          if (srvMatch) sName = srvMatch[1].trim();

          const uiStatus = r.TrangThai === 'Hoàn thành' ? 'Completed' : (r.TrangThai === 'Đã hủy' ? 'Cancelled' : (r.TrangThai === 'In_Progress' ? 'in_progress' : 'Confirmed'));

          return {
            id: r.MaLichHen,
            MaLichHen: r.MaLichHen,
            bookingCode: r.MaLichHen,
            customerId: r.MaKhachHang,
            customerName: cName,
            customerPhone: cPhone,
            stylistId: r.MaNhanVien,
            stylistName: r.TenNhanVien || 'Master Stylist',
            branchId: r.MaChiNhanh,
            branchName: r.TenChiNhanh || 'Omni Salon Chi Nhánh',
            bookingDate: formatDate(r.NgayHen),
            date: formatDate(r.NgayHen),
            timeSlot: formatTime(r.GioBatDau),
            status: uiStatus,
            TrangThai: r.TrangThai,
            serviceName: sName,
            totalPrice: parseFloat(r.TongTien || 0),
            notes: rawNote
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(bookings));
      }

      if (pathname === '/api/bookings' && method === 'POST') {
        const booking = parsedBody || {};
        const id = booking.id || booking.bookingCode || ('LH' + Date.now().toString().slice(-8));
        const khId = booking.customerId || 'KH01';
        const nvId = booking.stylistId || 'NV02';
        const cnId = booking.branchId || 'CN01';
        const date = booking.date || booking.bookingDate || new Date().toISOString().split('T')[0];
        const time = booking.timeSlot ? (booking.timeSlot.includes(':') ? (booking.timeSlot.length === 5 ? `${booking.timeSlot}:00` : booking.timeSlot) : `${booking.timeSlot}:00`) : '09:00:00';
        const price = parseFloat(booking.totalPrice || 120000);
        const custName = (booking.customerName || 'Khách Hàng').trim();
        const custPhone = (booking.customerPhone || '0988123456').trim();
        const srvName = (booking.serviceName || 'Dịch Vụ Cắt Tóc').trim();
        const extraNotes = (booking.notes || '').trim();
        const noteText = `Khách: ${custName} | SĐT: ${custPhone} | DV: ${srvName}${extraNotes ? ' | Ghi chú: ' + extraNotes : ''}`;

        await querySql(
          `INSERT INTO LichHen (MaLichHen, MaKhachHang, MaNhanVien, MaChiNhanh, NgayHen, GioBatDau, GioKetThuc, TrangThai, TongTien, TienCoc, GhiChu, LyDoHuy) VALUES (?, ?, ?, ?, ?, ?, ?, N'Đã xác nhận', ?, 0, ?, NULL)`,
          [id, khId, nvId, cnId, date, time, time, price, noteText]
        );

        console.log(`[SQL EXEC] Đặt lịch hẹn mới ${id} (${custName}) thành công vào SQL Server!`);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          booking: {
            id,
            MaLichHen: id,
            bookingCode: id,
            customerName: custName,
            customerPhone: custPhone,
            date,
            timeSlot: time.substring(0, 5),
            totalPrice: price,
            status: 'Confirmed'
          }
        }));
      }

      if (pathname.startsWith('/api/bookings/') && (method === 'DELETE' || method === 'PUT' || method === 'PATCH')) {
        const id = pathname.replace('/api/bookings/', '').replace('/cancel', '').replace('/status', '').replace('/checkin', '').trim();
        const b = parsedBody || {};
        if (method === 'DELETE' || b.status === 'Cancelled' || b.status === 'Đã hủy' || pathname.includes('/cancel')) {
          const reason = b.cancellationReason || b.reason || 'Khách hủy lịch';
          await querySql(`UPDATE LichHen SET TrangThai = N'Đã hủy', LyDoHuy = ? WHERE MaLichHen = ?`, [reason, id]);
        } else if (pathname.includes('/checkin') || b.status === 'In_Progress' || b.status === 'in_progress') {
          await querySql(`UPDATE LichHen SET TrangThai = N'In_Progress' WHERE MaLichHen = ?`, [id]);
        } else if (b.status === 'Completed' || b.status === 'Hoàn thành') {
          await querySql(`UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = ?`, [id]);
        } else if (b.date || b.timeSlot) {
          const newDate = b.date || b.bookingDate || new Date().toISOString().split('T')[0];
          const newTime = b.timeSlot ? (b.timeSlot.length === 5 ? `${b.timeSlot}:00` : b.timeSlot) : '09:00:00';
          await querySql(`UPDATE LichHen SET NgayHen = ?, GioBatDau = ?, GioKetThuc = ?, TrangThai = N'Đã xác nhận' WHERE MaLichHen = ?`, [newDate, newTime, newTime, id]);
        } else {
          await querySql(`UPDATE LichHen SET TrangThai = ? WHERE MaLichHen = ?`, [b.status || 'Đã xác nhận', id]);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Đã cập nhật trạng thái lịch hẹn trong SQL Server', id }));
      }

      // --- 16. ORDERS / ĐƠN HÀNG ONLINE ---
      if (pathname === '/api/orders' && method === 'GET') {
        const rows = await querySql(`SELECT dh.MaDonHang, dh.MaKhachHang, dh.MaChiNhanh, 
                                            CONVERT(VARCHAR(19), dh.NgayDat, 120) AS NgayDat,
                                            dh.TongTien, dh.DiaChiGiaoHang, dh.HinhThucNhan, dh.TrangThai, dh.GhiChu,
                                            kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
                                            cn.TenChiNhanh
                                     FROM DonHang dh
                                     LEFT JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
                                     LEFT JOIN ChiNhanh cn ON dh.MaChiNhanh = cn.MaChiNhanh
                                     ORDER BY dh.NgayDat DESC`);
        const orders = rows.map(r => ({
          id: r.MaDonHang,
          MaDonHang: r.MaDonHang,
          customerId: r.MaKhachHang,
          customerName: r.TenKhachHang || 'Khách Hàng Omni',
          customerPhone: r.SdtKhachHang || '0908888999',
          branchId: r.MaChiNhanh,
          branchName: r.TenChiNhanh,
          orderDate: r.NgayDat,
          totalAmount: parseFloat(r.TongTien || 0),
          TongTien: parseFloat(r.TongTien || 0),
          shippingAddress: r.DiaChiGiaoHang,
          receiveMethod: r.HinhThucNhan,
          orderStatus: r.TrangThai === 'Đã giao' ? 'Completed' : 'Processing',
          TrangThai: r.TrangThai,
          notes: r.GhiChu
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(orders));
      }

      if (pathname === '/api/orders' && method === 'POST') {
        const order = parsedBody || {};
        const id = order.id || ('DH' + Date.now().toString().slice(-8));
        const khId = order.customerId || 'KH03';
        const cnId = order.branchId || 'CN01';
        const total = parseFloat(order.totalAmount || 500000);
        const addr = order.shippingAddress || 'Giao tận nơi';
        const methodStr = order.receiveMethod || 'Giao tận nơi';
        const notes = order.notes || 'Đơn hàng online';

        await querySql(
          `INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu) VALUES (?, ?, ?, GETDATE(), ?, ?, ?, N'Đang xử lý', ?)`,
          [id, khId, cnId, total, addr, methodStr, notes]
        );

        console.log(`[SQL EXEC] Tạo đơn hàng mới ${id} thành công vào SQL Server!`);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, order: { id, totalAmount: total, status: 'Processing' } }));
      }

      // --- 17. POS CHECKOUT (HÓA ĐƠN & THANH TOÁN TẠI QUẦY) ---
      if (pathname === '/api/pos/checkout' && method === 'POST') {
        const pos = parsedBody || {};
        const maxHd = await querySql(`SELECT TOP 1 MaHoaDon FROM HoaDon WHERE MaHoaDon LIKE 'HD%' ORDER BY LEN(MaHoaDon) DESC, MaHoaDon DESC`);
        let nextN = 3;
        if (maxHd && maxHd[0]) {
          const nm = maxHd[0].MaHoaDon.match(/HD(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const hdId = 'HD' + (nextN < 10 ? '0' + nextN : nextN);
        const khId = pos.customerId || 'KH01';
        const lhId = pos.bookingId || null;
        const cnId = pos.branchId || 'CN01';
        const staffId = pos.staffId || 'NV61';
        const total = parseFloat(pos.total || pos.totalAmount || 300000);
        const methodPay = pos.paymentMethod || 'Chuyển khoản QR';
        const invoiceNo = `HD-${Date.now().toString().slice(-8)}`;

        await querySql(
          `INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon) VALUES (?, ?, ?, NULL, ?, GETDATE(), ?, N'Đã thanh toán', ?)`,
          [hdId, khId, lhId, cnId, total, invoiceNo]
        );

        const ttId = 'TT' + Date.now().toString().slice(-6);
        await querySql(
          `INSERT INTO ThanhToan (MaThanhToan, MaHoaDon, MaNhanVien, SoTien, PhuongThuc, ThoiGianThanhToan, TrangThai, MaGiaoDich) VALUES (?, ?, ?, ?, ?, GETDATE(), N'Thành công', ?)`,
          [ttId, hdId, staffId, total, methodPay, `PAY-${Date.now().toString().slice(-6)}`]
        );

        if (lhId) {
          await querySql(`UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = ?`, [lhId]);
        }

        console.log(`[SQL EXEC] POS Thanh toán thành công hóa đơn ${hdId} (${total} đ)!`);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, invoice: { id: hdId, invoiceNo, total, status: 'Completed' } }));
      }

      // --- 18. REVENUE ANALYTICS ---
      if (pathname === '/api/analytics/revenue' && method === 'GET') {
        const branchParam = parsedUrl.searchParams.get('branch_id');
        let q = `SELECT 
                   ISNULL(SUM(TongTien), 0) AS TongDoanhThu,
                   COUNT(*) AS TongHoaDon
                 FROM HoaDon
                 WHERE TrangThai = N'Đã thanh toán'`;
        const params = [];
        if (branchParam) {
          q += ` AND MaChiNhanh = ?`;
          params.push(branchParam);
        }
        const rows = await querySql(q, params);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          totalRevenue: parseFloat(rows[0]?.TongDoanhThu || 0),
          totalInvoices: rows[0]?.TongHoaDon || 0,
          currency: 'VND'
        }));
      }

      // --- 19. USERS LIST ---
      if (pathname === '/api/users' && method === 'GET') {
        const rows = await querySql(
          `SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.VaiTro, tk.TrangThai,
                  ISNULL(nv.HoTen, kh.HoTen) AS HoTen,
                  ISNULL(nv.SoDienThoai, kh.SoDienThoai) AS SoDienThoai,
                  ISNULL(nv.Email, kh.Email) AS Email,
                  nv.MaChiNhanh
           FROM TaiKhoan tk
           LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
           LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang`
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      // --- 20. REVIEWS / ĐÁNH GIÁ ---
      if (pathname === '/api/reviews' && method === 'GET') {
        const rows = await querySql(
          `SELECT dg.MaDanhGia, dg.MaKhachHang, dg.SoSao, dg.NoiDung, dg.HinhAnh,
                  CONVERT(VARCHAR(19), dg.NgayDanhGia, 120) AS NgayDanhGia,
                  kh.HoTen AS TenKhachHang
           FROM DanhGia dg
           LEFT JOIN KhachHang kh ON dg.MaKhachHang = kh.MaKhachHang
           WHERE dg.TrangThai = N'Hiển thị'`
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      if (pathname === '/api/reviews' && method === 'POST') {
        const r = parsedBody || {};
        const maxDg = await querySql(`SELECT TOP 1 MaDanhGia FROM DanhGia WHERE MaDanhGia LIKE 'DG%' ORDER BY LEN(MaDanhGia) DESC, MaDanhGia DESC`);
        let nextN = 3;
        if (maxDg && maxDg[0]) {
          const nm = maxDg[0].MaDanhGia.match(/DG(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const dgId = 'DG' + (nextN < 10 ? '0' + nextN : nextN);
        const khId = r.customerId || 'KH01';
        const stars = parseInt(r.rating || 5, 10);
        const comment = r.comment || 'Dịch vụ rất tốt!';

        await querySql(
          `INSERT INTO DanhGia (MaDanhGia, MaKhachHang, MaLichHen, MaDonHang, SoSao, NoiDung, HinhAnh, NgayDanhGia, TrangThai, CoFlag) VALUES (?, ?, NULL, NULL, ?, ?, NULL, GETDATE(), N'Hiển thị', 0)`,
          [dgId, khId, stars, comment]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, review: { id: dgId, rating: stars, comment } }));
      }

      // --- 21. PROMOTIONS / KHUYẾN MÃI ---
      if (pathname === '/api/promotions' && method === 'GET') {
        const rows = await querySql(
          `SELECT MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, DoiTuongApDung, 
                  CONVERT(VARCHAR(10), NgayBatDau, 120) AS NgayBatDau, 
                  CONVERT(VARCHAR(10), NgayKetThuc, 120) AS NgayKetThuc, 
                  TrangThai FROM KhuyenMai`
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      // --- 22. WORK SHIFTS / CA LÀM VIỆC ---
      if (pathname === '/api/shifts' && method === 'GET') {
        const rows = await querySql(
          `SELECT cv.MaCa, cv.MaNhanVien, CONVERT(VARCHAR(10), cv.NgayLam, 120) AS NgayLam,
                  CONVERT(VARCHAR(8), cv.GioBatDau) AS GioBatDau,
                  CONVERT(VARCHAR(8), cv.GioKetThuc) AS GioKetThuc,
                  cv.TrangThai, nv.HoTen AS TenNhanVien
           FROM CaLamViec cv
           JOIN NhanVien nv ON cv.MaNhanVien = nv.MaNhanVien`
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      // --- 23. AUTH PROFILE & CURRENT USER ---
      if (pathname === '/api/auth/me' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, status: 'authenticated' }));
      }

      if (pathname === '/api/auth/profile' && method === 'PUT') {
        const { id, fullName, phone, email } = parsedBody || {};
        if (id) {
          if (id.startsWith('TK_NV') || id.startsWith('NV')) {
            const nvId = id.replace('TK_', '');
            await querySql(`UPDATE NhanVien SET HoTen = ISNULL(?, HoTen), SoDienThoai = ISNULL(?, SoDienThoai), Email = ISNULL(?, Email) WHERE MaNhanVien = ?`, [fullName, phone, email, nvId]);
          } else {
            const khId = id.replace('TK_', '');
            await querySql(`UPDATE KhachHang SET HoTen = ISNULL(?, HoTen), SoDienThoai = ISNULL(?, SoDienThoai), Email = ISNULL(?, Email) WHERE MaKhachHang = ?`, [fullName, phone, email, khId]);
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Cập nhật thông tin thành công vào SQL Server!' }));
      }

      // --- 24. STYLIST COMMISSIONS ANALYTICS ---
      if (pathname.includes('/analytics/stylists/') && pathname.includes('/commissions')) {
        const parts = pathname.split('/');
        const stylistId = parts[4];
        const rows = await querySql(
          `SELECT COUNT(*) AS TongLich, ISNULL(SUM(TongTien), 0) AS TongTien
           FROM LichHen 
           WHERE MaNhanVien = ? AND TrangThai = N'Hoàn thành'`,
          [stylistId]
        );
        const revenue = parseFloat(rows[0]?.TongTien || 0);
        const count = rows[0]?.TongLich || 0;
        const commissionRate = 0.20;
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          stylistId,
          completedAppointments: count,
          generatedRevenue: revenue,
          commissionRate: '20%',
          commissionAmount: Math.round(revenue * commissionRate),
          currency: 'VND'
        }));
      }

      // --- 21. STATIC FILES & SPA FALLBACK (WEB FRONTEND) ---
      let relPath = pathname.replace(/^\//, '');
      // Chuẩn hóa đường dẫn: loại bỏ tiền tố web/, frontend/, web/frontend/
      relPath = relPath.replace(/^web\/frontend\//, '').replace(/^frontend\//, '').replace(/^web\//, '');

      // 1. Phục vụ ảnh DichVu_Men (lấy trực tiếp và duy nhất từ Men_Grooming_Products/DichVu_Men)
      if (relPath.includes('DichVu_Men')) {
        const fileName = path.basename(relPath);
        const targetPath = path.join(ROOT_DIR, 'Men_Grooming_Products', 'DichVu_Men', fileName);
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
          const ext = path.extname(targetPath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'image/jpeg' });
          return fs.createReadStream(targetPath).pipe(res);
        }
      }

      // 2. Phục vụ ảnh Men_Grooming_Products
      if (relPath.startsWith('Men_Grooming_Products/')) {
        const prodPath = path.join(ROOT_DIR, relPath);
        if (fs.existsSync(prodPath) && fs.statSync(prodPath).isFile()) {
          const ext = path.extname(prodPath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'image/jpeg' });
          return fs.createReadStream(prodPath).pipe(res);
        }
      }

      // 3. Tìm file tĩnh trong FRONTEND_DIR
      let fullPath = path.join(FRONTEND_DIR, relPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        const mime = MIME_MAP[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        return fs.createReadStream(fullPath).pipe(res);
      }

      // 4. SPA Fallback: Phục vụ index.html cho các route (/services, /booking, /shop, /stylists, /admin...)
      const fileExt = path.extname(relPath).toLowerCase();
      if (!fileExt || fileExt === '.html') {
        const indexPath = path.join(FRONTEND_DIR, 'index.html');
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return fs.createReadStream(indexPath).pipe(res);
        }
      }

      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'File Not Found', path: pathname }));

    } catch (err) {
      console.error(`[API LỖI] Lỗi xử lý yêu cầu ${method} ${pathname}:`, err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
  });
});

async function startServer() {
  await initDbConnection();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[LỖI CỔNG] Cổng ${PORT} đang bị chiếm dụng bởi một tiến trình Node khác.`);
      console.error(`Giải pháp: Hãy đóng cửa sổ CMD/Terminal cũ hoặc chạy lại start_server.bat để tự động giải phóng cổng.\n`);
      process.exit(1);
    } else {
      console.error('[SERVER LỖI]', err);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================================================`);
    console.log(`  OMNISALON DIRECT SQL SERVER (SSMS 20) BACKEND DANG HOAT DONG`);
    console.log(`  - Local Web Portal:  http://localhost:${PORT}`);
    console.log(`  - SQL Server:        ${activeDbConfig?.server || '.\\SQLEXPRESS'}`);
    console.log(`  - Database:          ${DB_NAME} (100% Ket noi SSMS truc tiep)`);
    console.log(`  - API Health:        http://localhost:${PORT}/api/health`);
    console.log(`=========================================================================`);
  });
}

startServer();
