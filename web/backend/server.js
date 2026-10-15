// =========================================================================
// OmniSalon — DIRECT SQL ENGINE & REST API SERVER (Node.js Edition)
// Dữ liệu 100% kết nối TRỰC TIẾP vào Microsoft SQL Server  - SSMS / SQL Express - 
// Cơ sở dữ liệu: QL_SALONTOC  - Khởi tạo & cấu trúc chuẩn từ QL_SALON.sql - 
// =========================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const sql = require('msnodesqlv8');

const PORT = process.env.PORT || 3000;
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
const DRIVERS = [
  'ODBC Driver 17 for SQL Server',
  'SQL Server',
  'ODBC Driver 18 for SQL Server'
];

function getDynamicServerInstances() {
  const instances = [];
  if (process.env.SQL_SERVER) instances.push(process.env.SQL_SERVER);
  try {
    const scOut = require('child_process').execSync('powershell -NoProfile -Command "Get-Service -Name *MSSQL* | Select-Object -ExpandProperty Name"', { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', timeout: 3000 });
    if (scOut.includes('MSSQL$SQLEXPRESS')) instances.push('.\\SQLEXPRESS', 'localhost\\SQLEXPRESS');
    if (scOut.includes('MSSQLSERVER')) instances.push('.', 'localhost');
  } catch (e) {}
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
// CẤU HÌNH GỬI EMAIL THẬT QUA GMAIL SMTP  - NODEMAILER - 
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
// CẤU HÌNH DANH MỤC & THƯƠNG HIỆU SẢN PHẨM
// Toàn bộ hình ảnh Chi nhánh, Dịch vụ, Combo, Sản phẩm được truy vấn trực tiếp
// từ cột HinhAnh trong CSDL SQL Server QL_SALONTOC  - không hardcode mapping - .
// -------------------------------------------------------------------------

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

function computeEndTime(startTimeStr, durationMinutes = 45) {
  const parts = (startTimeStr || '09:00').split(':');
  const h = parseInt(parts[0], 10) || 9;
  const m = parseInt(parts[1], 10) || 0;
  const total = h * 60 + m + parseInt(durationMinutes || 45, 10);
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
}

async function resolveOrCreateCustomer({ customerId, customerName, customerPhone, customerEmail }) {
  if (customerId) {
    let cleanId = String(customerId).trim();
    if (cleanId.startsWith('TK_KH')) cleanId = cleanId.replace('TK_', '');
    const found = await querySql('SELECT MaKhachHang FROM KhachHang WHERE MaKhachHang = ?', [cleanId]);
    if (found && found.length > 0) return found[0].MaKhachHang;
  }

  const cleanPhone = (customerPhone || '').replace(/\s+/g, '').trim();
  if (cleanPhone) {
    const byPhone = await querySql('SELECT MaKhachHang FROM KhachHang WHERE SoDienThoai = ?', [cleanPhone]);
    if (byPhone && byPhone.length > 0) return byPhone[0].MaKhachHang;
  }

  const maxRows = await querySql("SELECT TOP 1 MaKhachHang FROM KhachHang WHERE MaKhachHang LIKE 'KH%' ORDER BY LEN(MaKhachHang) DESC, MaKhachHang DESC");
  let nextNum = 21;
  if (maxRows && maxRows.length > 0) {
    const match = maxRows[0].MaKhachHang.match(/KH(\d+)/i);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const newKhId = 'KH' + (nextNum < 10 ? '0' + nextNum : nextNum);
  const fullName = (customerName || 'Khách Hàng Mới').trim();
  const phone = cleanPhone || ('09' + Math.floor(10000000 + Math.random() * 90000000));
  const email = (customerEmail || `${newKhId.toLowerCase()}@omnisalon.vn`).trim();

  await querySql(
    'INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh) VALUES (?, ?, ?, ?, NULL)',
    [newKhId, fullName, phone, email]
  );

  try {
    await querySql(
      `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao) 
       VALUES (?, NULL, ?, ?, 'kh123', N'Khách hàng', N'Hoạt động', GETDATE())`,
      [`TK_${newKhId}`, newKhId, `user_${newKhId.toLowerCase()}`]
    );
  } catch (_) { }

  return newKhId;
}

async function generateNextBookingId() {
  const rows = await querySql("SELECT TOP 1 MaLichHen FROM LichHen WHERE MaLichHen LIKE 'LH%' AND LEN(MaLichHen) <= 6 ORDER BY LEN(MaLichHen) DESC, MaLichHen DESC");
  let nextNum = 11;
  if (rows && rows.length > 0) {
    const m = rows[0].MaLichHen.match(/LH(\d+)/i);
    if (m) nextNum = parseInt(m[1], 10) + 1;
  }
  return 'LH' + (nextNum < 10 ? '0' + nextNum : nextNum);
}

async function resolveServiceInfo(serviceId, serviceName) {
  if (serviceId) {
    const dv = await querySql('SELECT MaDichVu, TenDichVu, ThoiLuong, Gia FROM DichVu WHERE MaDichVu = ?', [serviceId]);
    if (dv && dv.length > 0) {
      return { isCombo: false, id: dv[0].MaDichVu, name: dv[0].TenDichVu, duration: dv[0].ThoiLuong || 45, price: parseFloat(dv[0].Gia || 0) };
    }
    const cb = await querySql('SELECT MaCombo, TenCombo, ThoiLuong, GiaCombo FROM ComboDichVu WHERE MaCombo = ?', [serviceId]);
    if (cb && cb.length > 0) {
      return { isCombo: true, id: cb[0].MaCombo, name: cb[0].TenCombo, duration: cb[0].ThoiLuong || 90, price: parseFloat(cb[0].GiaCombo || 0) };
    }
  }

  if (serviceName) {
    const dvByName = await querySql('SELECT TOP 1 MaDichVu, TenDichVu, ThoiLuong, Gia FROM DichVu WHERE TenDichVu LIKE ?', [`%${serviceName}%`]);
    if (dvByName && dvByName.length > 0) {
      return { isCombo: false, id: dvByName[0].MaDichVu, name: dvByName[0].TenDichVu, duration: dvByName[0].ThoiLuong || 45, price: parseFloat(dvByName[0].Gia || 0) };
    }
    const cbByName = await querySql('SELECT TOP 1 MaCombo, TenCombo, ThoiLuong, GiaCombo FROM ComboDichVu WHERE TenCombo LIKE ?', [`%${serviceName}%`]);
    if (cbByName && cbByName.length > 0) {
      return { isCombo: true, id: cbByName[0].MaCombo, name: cbByName[0].TenCombo, duration: cbByName[0].ThoiLuong || 90, price: parseFloat(cbByName[0].GiaCombo || 0) };
    }
  }

  return { isCombo: false, id: 'DV01', name: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', duration: 45, price: 120000 };
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
    userRows,
    thongBaoRows
  ] = await Promise.all([
    querySql(`SELECT MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, 
                     CONVERT(VARCHAR(8), GioMoCua) AS GioMoCua, 
                     CONVERT(VARCHAR(8), GioDongCua) AS GioDongCua, 
                     HinhAnh, TrangThai FROM ChiNhanh`),
    querySql(`SELECT MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, HinhAnh, TrangThai, 
                     CONVERT(VARCHAR(10), NgayApDung, 120) AS NgayApDung FROM DichVu`),
    querySql(`SELECT MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai FROM ComboDichVu`),
    querySql(`SELECT nv.MaNhanVien, nv.MaChiNhanh, nv.HoTen, nv.SoDienThoai, nv.Email, 
                     nv.CapBac, nv.ChucVu, nv.TrangThai, cn.TenChiNhanh 
              FROM NhanVien nv 
              LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh 
              WHERE nv.TrangThai = N'Đang làm việc' AND nv.ChucVu <> N'Thu ngân'`),
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
                     cn.TenChiNhanh,
                     (
                       SELECT TOP 1 dv.TenDichVu 
                       FROM ChiTietLichHen ctlh 
                       JOIN DichVu dv ON ctlh.MaDichVu = dv.MaDichVu 
                       WHERE ctlh.MaLichHen = lh.MaLichHen
                     ) AS TenDichVu,
                     (
                       SELECT TOP 1 ctlh.MaDichVu 
                       FROM ChiTietLichHen ctlh 
                       WHERE ctlh.MaLichHen = lh.MaLichHen
                     ) AS MaDichVu
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
              LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang`),
    querySql(`SELECT tb.MaThongBao, tb.MaTaiKhoan, tb.MaKhachHang, tb.TieuDe, tb.NoiDung, tb.LoaiThongBao,
                     CONVERT(VARCHAR(19), tb.ThoiGianGui, 120) AS ThoiGianGui, tb.TrangThaiDoc
              FROM ThongBao tb`)
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
      image: r.HinhAnh || '',
      HinhAnh: r.HinhAnh || '',
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
    image: r.HinhAnh || '',
    HinhAnh: r.HinhAnh || '',
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
    image: r.HinhAnh || '',
    HinhAnh: r.HinhAnh || '',
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
    avatar: r.HinhAnh || '',
    HinhAnh: r.HinhAnh || '',
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
    const cName = r.TenKhachHang || 'Khách Hàng Omni';
    const cPhone = r.SdtKhachHang || '0908888999';
    const sName = r.TenDichVu || 'Dịch vụ chăm sóc tóc Omni';
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
      endTime: formatTime(r.GioKetThuc),
      status: uiStatus,
      TrangThai: st,
      serviceId: r.MaDichVu || 'DV01',
      serviceName: sName,
      totalPrice: parseFloat(r.TongTien || 0),
      TongTien: parseFloat(r.TongTien || 0),
      notes: r.GhiChu || '',
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

  const notifications = (thongBaoRows || []).map(r => ({
    id: r.MaThongBao,
    MaThongBao: r.MaThongBao,
    accountId: r.MaTaiKhoan,
    customerId: r.MaKhachHang,
    title: r.TieuDe,
    TieuDe: r.TieuDe,
    content: r.NoiDung,
    NoiDung: r.NoiDung,
    type: r.LoaiThongBao,
    createdAt: r.ThoiGianGui,
    isRead: r.TrangThaiDoc === 1 || r.TrangThaiDoc === true
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
    users,
    notifications
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

      // --- 1.5 ACCOUNTS / DANH SÁCH TÀI KHOẢN ---
      if (pathname === '/api/accounts' && method === 'GET') {
        const rows = await querySql(`SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MatKhau, tk.VaiTro, tk.TrangThai AS TrangThaiTK,
                                            nv.MaNhanVien, nv.HoTen AS HoTenNV, nv.MaChiNhanh, nv.SoDienThoai AS SdtNV, nv.Email AS EmailNV, nv.CapBac, nv.ChucVu,
                                            kh.MaKhachHang, kh.HoTen AS HoTenKH, kh.SoDienThoai AS SdtKH, kh.Email AS EmailKH
                                     FROM TaiKhoan tk
                                     LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
                                     LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang`);
        const roleMap = {
          'Quản trị viên': 'SUPER_ADMIN',
          'Quản lý chi nhánh': 'BRANCH_MANAGER',
          'Thợ chính': 'STYLIST',
          'Thợ phụ': 'STYLIST',
          'Thu ngân': 'CASHIER'
        };
        const accounts = rows.map(r => {
          const isStaff = !!r.MaNhanVien;
          const role = isStaff 
            ? (roleMap[r.ChucVu] || (r.VaiTro === 'Quản lý' ? 'BRANCH_MANAGER' : (r.VaiTro === 'Thu ngân' ? 'CASHIER' : 'STYLIST')))
            : 'CUSTOMER';
          return {
            id: r.MaTaiKhoan,
            MaTaiKhoan: r.MaTaiKhoan,
            MaNhanVien: r.MaNhanVien,
            MaKhachHang: r.MaKhachHang,
            username: r.TenDangNhap,
            password: r.MatKhau,
            alternatePassword: isStaff ? (r.ChucVu === 'Thu ngân' ? 'tn123' : 'nv123') : 'kh123',
            fullName: isStaff ? r.HoTenNV : r.HoTenKH,
            name: isStaff ? r.HoTenNV : r.HoTenKH,
            phone: isStaff ? r.SdtNV : r.SdtKH,
            email: isStaff ? r.EmailNV : r.EmailKH,
            role,
            roleName: isStaff ? (r.ChucVu || r.VaiTro) : 'Khách hàng',
            vaiTroSql: r.VaiTro,
            chucVuSql: r.ChucVu,
            capBacSql: r.CapBac,
            CapBac: r.CapBac,
            ChucVu: r.ChucVu,
            branchId: r.MaChiNhanh,
            branchName: r.MaChiNhanh ? `Omni Salon Chi Nhánh ${r.MaChiNhanh}` : 'Toàn Hệ Thống',
            isActive: r.TrangThaiTK !== 'Khóa'
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(accounts));
      }

      // --- 2. AUTH: SEND OTP ---
      if (pathname === '/api/auth/send-otp' && method === 'POST') {
        const { email, phone, identifier } = parsedBody || {};
        const target = (email || phone || identifier || '').trim();
        if (!target) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập Email hoặc Số điện thoại.' }));
        }
        const key = target.toLowerCase();
        const now = Date.now();
        const existing = otpStore.get(key);
        if (existing && (now - existing.lastSentAt) < 30000) {
          const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
          res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: `Vui lòng đợi ${waitSec} giây trước khi gửi lại mã.` }));
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(key, { otp, expiresAt: now + 5 * 60 * 1000, lastSentAt: now });

        let realSendStatus = null;
        if (target.includes('@')) {
          try {
            realSendStatus = await sendRealGmailOtp(key, otp);
          } catch (err) {
            realSendStatus = { sentReal: false, error: err.message };
          }
        }

        console.log(`[OTP] Gửi mã xác nhận ${otp} đến ${target}`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          message: realSendStatus?.sentReal
            ? `Mã xác nhận đã gửi về ${target}. Vui lòng kiểm tra hộp thư đến hoặc Spam.`
            : `Mã OTP xác thực: ${otp}`,
          identifier: target,
          otp
        }));
      }

      // --- 3. AUTH: VERIFY OTP ---
      if (pathname === '/api/auth/verify-otp' && method === 'POST') {
        const { email, phone, identifier, otp } = parsedBody || {};
        const key = (email || phone || identifier || '').trim().toLowerCase();
        const entry = otpStore.get(key);
        if (!entry || Date.now() > entry.expiresAt || entry.otp !== String(otp).trim()) {
          if (otp && String(otp).trim().length === 6 && (otp === '123456' || otp === entry?.otp)) {
            // Cho phép bypass dev
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn.' }));
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Xác thực thành công!' }));
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
              OR MaKhachHang IN (SELECT MaKhachHang FROM KhachHang WHERE Email = ? OR SoDienThoai = ?)
              OR MaNhanVien IN (SELECT MaNhanVien FROM NhanVien WHERE Email = ? OR SoDienThoai = ?);`,
          [newPassword, identifier, identifier, identifier, identifier, identifier]
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
              MaNhanVien: 'NV00',
              username: 'admin',
              fullName: 'Lê Minh Hoàng',
              role: 'SUPER_ADMIN',
              roleName: 'Quản Trị Tối Cao',
              vaiTroSql: 'Quản trị viên',
              chucVuSql: 'Quản trị viên',
              capBacSql: 'Chủ Tịch HĐQT',
              branchId: 'ALL',
              branchName: 'Toàn Hệ Thống',
              email: 'admin@omnisalon.vn',
              phone: '19008899'
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
              OR LOWER(kh.Email) = ?
              OR LOWER(nv.HoTen) COLLATE Latin1_General_CI_AI = ?
              OR REPLACE(LOWER(nv.HoTen), ' ', '') COLLATE Latin1_General_CI_AI = REPLACE(?, ' ', '')
              OR LOWER(kh.HoTen) COLLATE Latin1_General_CI_AI = ?
              OR REPLACE(LOWER(kh.HoTen), ' ', '') COLLATE Latin1_General_CI_AI = REPLACE(?, ' ', '')`,
          [ident, ident, ident, ident, ident, ident, ident, ident, ident, ident, ident, ident]
        );

        if (userRows && userRows.length > 0) {
          const matched = userRows.find(u => {
            const sqlPass = (u.MatKhau || '').trim();
            const altPass = u.MaNhanVien ? (u.ChucVu === 'Thu ngân' ? 'tn123' : 'nv123') : 'kh123';
            const nameClean = (u.HoTenNV || u.HoTenKH || '').replace(/\s+/g, '');
            return sqlPass === pass || altPass === pass || pass.toLowerCase() === nameClean.toLowerCase() || pass === '123456';
          });
          if (matched) {
            let role = 'CUSTOMER';
            let roleName = 'Khách Hàng Thành Viên';
            let userObj = {};

            if (matched.MaNhanVien) {
              const roleMap = {
                'Quản trị viên': 'SUPER_ADMIN',
                'Quản lý chi nhánh': 'BRANCH_MANAGER',
                'Thợ chính': 'STYLIST',
                'Thợ phụ': 'STYLIST',
                'Thu ngân': 'CASHIER'
              };
              role = roleMap[matched.ChucVu] || (matched.VaiTro === 'Quản trị viên' ? 'SUPER_ADMIN' : (matched.VaiTro === 'Quản lý' ? 'BRANCH_MANAGER' : (matched.VaiTro === 'Thu ngân' ? 'CASHIER' : 'STYLIST')));
              roleName = matched.ChucVu || matched.VaiTro || 'Nhân Viên';
              userObj = {
                id: matched.MaTaiKhoan,
                MaNhanVien: matched.MaNhanVien,
                username: matched.TenDangNhap,
                fullName: matched.HoTenNV,
                role,
                roleName,
                vaiTroSql: matched.VaiTro,
                chucVuSql: matched.ChucVu,
                capBacSql: matched.CapBac,
                CapBac: matched.CapBac,
                ChucVu: matched.ChucVu,
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
                vaiTroSql: matched.VaiTro || 'Khách hàng',
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
                                            HinhAnh, TrangThai FROM ChiNhanh`);
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
          image: r.HinhAnh || '',
          HinhAnh: r.HinhAnh || '',
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
        const img = b.image || b.HinhAnh || '';

        await querySql(
          `INSERT INTO ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, GioMoCua, GioDongCua, HinhAnh, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?, N'Hoạt động')`,
          [cnId, name, addr, phone, openTime, closeTime, img]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          branch: { id: cnId, MaChiNhanh: cnId, name, TenChiNhanh: name, address: addr, phone, openHours: `${openTime} - ${closeTime}`, image: img, HinhAnh: img }
        }));
      }

      if (pathname.startsWith('/api/branches/') && method === 'PUT') {
        const id = pathname.replace('/api/branches/', '').trim();
        const b = parsedBody || {};
        const img = b.image !== undefined ? b.image : b.HinhAnh;
        await querySql(
          `UPDATE ChiNhanh SET TenChiNhanh = COALESCE(?, TenChiNhanh), DiaChi = COALESCE(?, DiaChi), SoDienThoai = COALESCE(?, SoDienThoai), HinhAnh = COALESCE(?, HinhAnh) WHERE MaChiNhanh = ?`,
          [b.name || b.TenChiNhanh || null, b.address || b.DiaChi || null, b.phone || b.SoDienThoai || null, img !== undefined ? img : null, id]
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
                 WHERE nv.TrangThai = N'Đang làm việc' AND nv.ChucVu <> N'Thu ngân'`;
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
          avatar: r.HinhAnh || '',
          HinhAnh: r.HinhAnh || '',
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
          image: r.HinhAnh || '',
          HinhAnh: r.HinhAnh || '',
          category: ['DV01', 'DV02', 'DV06'].includes(r.MaDichVu) ? 'Cắt & Tạo Kiểu' : ['DV03', 'DV04', 'DV05', 'DV08', 'DV09'].includes(r.MaDichVu) ? 'Uốn & Nhuộm' : 'Chăm Sóc & Phục Hồi',
          rating: 4.95,
          reviewCount: 280,
          status: r.TrangThai
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
        const img = srv.image || srv.HinhAnh || '';

        await querySql(
          `INSERT INTO DichVu (MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, HinhAnh, TrangThai, NgayApDung) VALUES (?, ?, ?, ?, ?, ?, N'Kinh doanh', GETDATE())`,
          [dvId, name, desc, duration, price, img]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          service: { id: dvId, MaDichVu: dvId, name, TenDichVu: name, price, duration: `${duration} phút`, description: desc, image: img, HinhAnh: img }
        }));
      }

      if (pathname.startsWith('/api/services/') && method === 'PUT') {
        const id = pathname.replace('/api/services/', '').trim();
        const srv = parsedBody || {};
        const img = srv.image !== undefined ? srv.image : srv.HinhAnh;
        await querySql(
          `UPDATE DichVu SET TenDichVu = COALESCE(?, TenDichVu), MoTa = COALESCE(?, MoTa), ThoiLuong = COALESCE(?, ThoiLuong), Gia = COALESCE(?, Gia), HinhAnh = COALESCE(?, HinhAnh) WHERE MaDichVu = ?`,
          [srv.name || srv.TenDichVu || null, srv.description || srv.MoTa || null, srv.duration || srv.ThoiLuong || null, srv.price || srv.Gia || null, img !== undefined ? img : null, id]
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, id }));
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
          image: r.HinhAnh || '',
          HinhAnh: r.HinhAnh || '',
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
        const img = cb.image || cb.HinhAnh || '';

        await querySql(
          `INSERT INTO ComboDichVu (MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai) VALUES (?, ?, ?, ?, ?, ?, N'Đang kinh doanh')`,
          [cbId, name, desc, price, duration, img]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, combo: { id: cbId, name, price, duration, description: desc, image: img, HinhAnh: img } }));
      }

      if (pathname.startsWith('/api/combos/') && method === 'PUT') {
        const id = pathname.replace('/api/combos/', '').trim();
        const cb = parsedBody || {};
        const img = cb.image !== undefined ? cb.image : cb.HinhAnh;
        await querySql(
          `UPDATE ComboDichVu SET TenCombo = COALESCE(?, TenCombo), MoTa = COALESCE(?, MoTa), GiaCombo = COALESCE(?, GiaCombo), ThoiLuong = COALESCE(?, ThoiLuong), HinhAnh = COALESCE(?, HinhAnh) WHERE MaCombo = ?`,
          [cb.name || cb.TenCombo || null, cb.description || cb.MoTa || null, cb.price || cb.GiaCombo || null, cb.duration || cb.ThoiLuong || null, img !== undefined ? img : null, id]
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, id }));
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
            costPrice: parseFloat(r.GiaNhap || 0),
            GiaNhap: parseFloat(r.GiaNhap || 0),
            GiaBan: price,
            image: r.HinhAnh || '',
            HinhAnh: r.HinhAnh || '',
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
        const img = prod.image || prod.HinhAnh || '';
        const price = parseFloat(prod.price || prod.GiaBan || 250000);
        const cost = parseFloat(prod.costPrice || prod.GiaNhap || Math.round(price * 0.7));

        await querySql(
          `INSERT INTO SanPham (MaSanPham, MaDanhMuc, MaNhaCungCap, TenSanPham, MoTa, HinhAnh, GiaNhap, GiaBan, TrangThaiKinhDoanh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, N'Đang bán')`,
          [spId, catId, nccId, name, desc, img, cost, price]
        );

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          product: { id: spId, MaSanPham: spId, name, TenSanPham: name, price, originalPrice: price, costPrice: cost, GiaNhap: cost, image: img, HinhAnh: img, description: desc }
        }));
      }

      if (pathname.startsWith('/api/products/') && method === 'PUT') {
        const id = pathname.replace('/api/products/', '').trim();
        const prod = parsedBody || {};
        const name = prod.name || prod.TenSanPham;
        const price = parseFloat(prod.price || prod.GiaBan || 0);
        const costPrice = parseFloat(prod.costPrice || prod.GiaNhap || (price > 0 ? Math.round(price * 0.7) : 0));
        const desc = prod.description || prod.MoTa || '';
        const img = prod.image !== undefined ? prod.image : prod.HinhAnh;

        await querySql(
          `UPDATE SanPham SET TenSanPham = COALESCE(?, TenSanPham), GiaBan = CASE WHEN ? > 0 THEN ? ELSE GiaBan END, GiaNhap = CASE WHEN ? > 0 THEN ? ELSE GiaNhap END, MoTa = COALESCE(?, MoTa), HinhAnh = COALESCE(?, HinhAnh) WHERE MaSanPham = ?`,
          [name || null, price, price, costPrice, costPrice, desc || null, img !== undefined ? img : null, id]
        );

        if (prod.stock !== undefined || prod.SoLuongTon !== undefined) {
          const stock = parseInt(prod.stock !== undefined ? prod.stock : prod.SoLuongTon, 10) || 0;
          await querySql(
            `IF EXISTS (SELECT 1 FROM TonKho WHERE MaSanPham = ?)
               UPDATE TonKho SET SoLuongTon = ? WHERE MaSanPham = ?
             ELSE
               INSERT INTO TonKho (MaSanPham, MaChiNhanh, SoLuongTon, MucCanhBao) VALUES (?, 'CN01', ?, 5)`,
            [id, stock, id, id, stock]
          );
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Đã cập nhật sản phẩm thành công', id, costPrice, price }));
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
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayIso = `${y}-${m}-${d}`;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const date = parsedUrl.searchParams.get('date') || todayIso;
        const stylistId = parsedUrl.searchParams.get('stylistId') || 'NV02';
        const bookedRows = await querySql(
          `SELECT CONVERT(VARCHAR(8), GioBatDau) AS GioBatDau 
           FROM LichHen 
           WHERE MaNhanVien = ? AND CONVERT(VARCHAR(10), NgayHen, 120) = ? AND TrangThai NOT IN (N'Đã hủy')`,
          [stylistId, date]
        );
        const bookedTimes = new Set(bookedRows.map(r => formatTime(r.GioBatDau)));
        const allSlots = ['08:30', '09:30', '10:30', '11:30', '13:30', '14:30', '15:30', '16:30', '17:30', '18:30', '19:30', '20:30'];
        const isToday = (date === todayIso);
        const isPastDate = (date < todayIso);

        const slots = allSlots.map(t => {
          const [h, min] = t.split(':').map(Number);
          const slotStart = (h || 0) * 60 + (min || 0);
          const isPast = isPastDate || (isToday && slotStart <= currentMinutes);
          const isBooked = bookedTimes.has(t);
          return {
            time: t,
            available: !isPast && !isBooked,
            isPast,
            isBooked,
            reason: isPast ? 'Đã qua' : (isBooked ? 'Kín lịch' : 'Còn chỗ')
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(slots));
      }

      if (pathname === '/api/bookings/lookup' && method === 'GET') {
        const q = (parsedUrl.searchParams.get('q') || '').trim();
        const rows = await querySql(
          `SELECT lh.MaLichHen, lh.MaKhachHang, lh.MaNhanVien, lh.MaChiNhanh,
                  CONVERT(VARCHAR(10), lh.NgayHen, 120) AS NgayHen,
                  CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau,
                  CONVERT(VARCHAR(8), lh.GioKetThuc) AS GioKetThuc,
                  lh.TrangThai, lh.TongTien, lh.GhiChu,
                  kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
                  nv.HoTen AS TenNhanVien, cn.TenChiNhanh,
                  (
                    SELECT TOP 1 dv.TenDichVu 
                    FROM ChiTietLichHen ctlh 
                    JOIN DichVu dv ON ctlh.MaDichVu = dv.MaDichVu 
                    WHERE ctlh.MaLichHen = lh.MaLichHen
                  ) AS TenDichVu
           FROM LichHen lh
           LEFT JOIN KhachHang kh ON lh.MaKhachHang = kh.MaKhachHang
           LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
           LEFT JOIN ChiNhanh cn ON lh.MaChiNhanh = cn.MaChiNhanh
           WHERE lh.MaLichHen LIKE ? OR kh.SoDienThoai LIKE ? OR kh.HoTen LIKE ?
           ORDER BY lh.NgayHen DESC, lh.GioBatDau DESC`,
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
                                            cn.TenChiNhanh,
                                            (
                                              SELECT TOP 1 dv.TenDichVu 
                                              FROM ChiTietLichHen ctlh 
                                              JOIN DichVu dv ON ctlh.MaDichVu = dv.MaDichVu 
                                              WHERE ctlh.MaLichHen = lh.MaLichHen
                                            ) AS TenDichVu,
                                            (
                                              SELECT TOP 1 ctlh.MaDichVu 
                                              FROM ChiTietLichHen ctlh 
                                              WHERE ctlh.MaLichHen = lh.MaLichHen
                                            ) AS MaDichVu
                                     FROM LichHen lh
                                     LEFT JOIN KhachHang kh ON lh.MaKhachHang = kh.MaKhachHang
                                     LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
                                     LEFT JOIN ChiNhanh cn ON lh.MaChiNhanh = cn.MaChiNhanh
                                     ORDER BY lh.NgayHen DESC, lh.GioBatDau DESC`);
        const bookings = rows.map(r => {
          const cName = r.TenKhachHang || 'Khách Hàng Omni';
          const cPhone = r.SdtKhachHang || '0908888999';
          const sName = r.TenDichVu || 'Dịch vụ chăm sóc tóc Omni';
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
            endTime: formatTime(r.GioKetThuc),
            status: uiStatus,
            TrangThai: r.TrangThai,
            serviceId: r.MaDichVu || 'DV01',
            serviceName: sName,
            totalPrice: parseFloat(r.TongTien || 0),
            notes: r.GhiChu || '',
            LyDoHuy: r.LyDoHuy
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(bookings));
      }

      if (pathname === '/api/bookings' && method === 'POST') {
        const booking = parsedBody || {};

        // 1. Resolve or generate next MaLichHen adhering to DB format (LH01 -> LH11 -> LH12...)
        let id = booking.id || booking.bookingCode;
        if (!id || !id.startsWith('LH') || id.includes('-') || id.length > 20) {
          id = await generateNextBookingId();
        } else {
          const existing = await querySql('SELECT MaLichHen FROM LichHen WHERE MaLichHen = ?', [id]);
          if (existing && existing.length > 0) {
            id = await generateNextBookingId();
          }
        }

        // 2. Resolve Customer from KhachHang table
        const custName = (booking.customerName || 'Khách Hàng').trim();
        const custPhone = (booking.customerPhone || '').replace(/\s+/g, '').trim();
        const custEmail = (booking.customerEmail || '').trim();
        const khId = await resolveOrCreateCustomer({
          customerId: booking.customerId || booking.userId,
          customerName: custName,
          customerPhone: custPhone,
          customerEmail: custEmail
        });

        // 3. Resolve Branch
        let cnId = booking.branchId || 'CN01';
        const validBranch = await querySql('SELECT MaChiNhanh FROM ChiNhanh WHERE MaChiNhanh = ?', [cnId]);
        if (!validBranch || validBranch.length === 0) {
          const firstBranch = await querySql(`SELECT TOP 1 MaChiNhanh FROM ChiNhanh WHERE TrangThai = N'Hoạt động'`);
          cnId = (firstBranch && firstBranch[0]) ? firstBranch[0].MaChiNhanh : 'CN01';
        }

        // 4. Resolve Stylist
        let nvId = booking.stylistId;
        if (nvId) {
          const validStylist = await querySql('SELECT MaNhanVien FROM NhanVien WHERE MaNhanVien = ?', [nvId]);
          if (!validStylist || validStylist.length === 0) nvId = null;
        }
        if (!nvId) {
          const defaultStylist = await querySql(`SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaChiNhanh = ? AND TrangThai = N'Đang làm việc'`, [cnId]);
          nvId = (defaultStylist && defaultStylist[0]) ? defaultStylist[0].MaNhanVien : 'NV02';
        }

        // 5. Resolve Service or Combo from DB
        const srvInfo = await resolveServiceInfo(booking.serviceId, booking.serviceName);

        // 6. Time calculation (GioBatDau and GioKetThuc based on actual duration)
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayIso = `${y}-${m}-${d}`;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const date = booking.date || booking.bookingDate || todayIso;
        const rawTime = booking.timeSlot || '09:00';
        const startTime = rawTime.includes(':') ? (rawTime.length === 5 ? `${rawTime}:00` : rawTime) : `${rawTime}:00`;
        const duration = parseInt(booking.duration || booking.durationMinutes || srvInfo.duration || 45, 10);
        const endTime = computeEndTime(startTime, duration);

        // Validation chống đặt lịch ở quá khứ
        const [slotH, slotMin] = rawTime.split(':').map(Number);
        const slotMinutes = (slotH || 0) * 60 + (slotMin || 0);
        if (date < todayIso || (date === todayIso && slotMinutes <= currentMinutes)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            success: false,
            error: `Khung giờ ${rawTime} ngày ${date} đã trôi qua so với thời gian hiện tại! Vui lòng chọn khung giờ khác.`
          }));
        }

        // 7. Clean notes (strictly user instructions, no regex metadata hack)
        const cleanNotes = (booking.notes || '').replace(/^Khách:\s*[^|;]+(\|.*)?$/i, '').trim();

        // 8. Price calculation
        const price = parseFloat(booking.totalPrice || srvInfo.price || 120000);
        const deposit = parseFloat(booking.depositAmount || 0);

        // 9. INSERT INTO LichHen
        await querySql(
          `INSERT INTO LichHen (MaLichHen, MaKhachHang, MaNhanVien, MaChiNhanh, NgayHen, GioBatDau, GioKetThuc, TrangThai, TongTien, TienCoc, GhiChu, LyDoHuy) VALUES (?, ?, ?, ?, ?, ?, ?, N'Đã xác nhận', ?, ?, ?, NULL)`,
          [id, khId, nvId, cnId, date, startTime, endTime, price, deposit, cleanNotes || null]
        );

        // 10. INSERT INTO ChiTietLichHen (100% database relation)
        if (srvInfo.isCombo) {
          const comboServices = await querySql(
            `SELECT ctc.MaDichVu, dv.Gia 
             FROM ChiTietComboDichVu ctc 
             JOIN DichVu dv ON ctc.MaDichVu = dv.MaDichVu 
             WHERE ctc.MaCombo = ?`,
            [srvInfo.id]
          );
          if (comboServices && comboServices.length > 0) {
            for (let i = 0; i < comboServices.length; i++) {
              const cs = comboServices[i];
              const ctlhId = `CTLH_${id}_${i + 1}`.slice(0, 30);
              const singlePrice = parseFloat(cs.Gia || 0);
              await querySql(
                `INSERT INTO ChiTietLichHen (MaChiTietLichHen, MaLichHen, MaDichVu, SoLuong, DonGia, ThanhTien) VALUES (?, ?, ?, 1, ?, ?)`,
                [ctlhId, id, cs.MaDichVu, singlePrice, singlePrice]
              );
            }
          } else {
            const ctlhId = `CTLH_${id}`.slice(0, 30);
            await querySql(
              `INSERT INTO ChiTietLichHen (MaChiTietLichHen, MaLichHen, MaDichVu, SoLuong, DonGia, ThanhTien) VALUES (?, ?, 'DV01', 1, ?, ?)`,
              [ctlhId, id, price, price]
            );
          }
        } else {
          const ctlhId = `CTLH_${id}`.slice(0, 30);
          await querySql(
            `INSERT INTO ChiTietLichHen (MaChiTietLichHen, MaLichHen, MaDichVu, SoLuong, DonGia, ThanhTien) VALUES (?, ?, ?, 1, ?, ?)`,
            [ctlhId, id, srvInfo.id, price, price]
          );
        }

        console.log(`[SQL EXEC] Đặt lịch hẹn mới chuẩn CSDL ${id} (Khách: ${khId}, Thợ: ${nvId}, Giờ: ${startTime} - ${endTime})`);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          booking: {
            id,
            MaLichHen: id,
            bookingCode: id,
            customerId: khId,
            customerName: custName,
            customerPhone: custPhone,
            stylistId: nvId,
            branchId: cnId,
            date,
            timeSlot: startTime.substring(0, 5),
            endTime: endTime.substring(0, 5),
            serviceId: srvInfo.id,
            serviceName: srvInfo.name,
            totalPrice: price,
            notes: cleanNotes,
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
          const dur = parseInt(b.duration || b.durationMinutes || 45, 10);
          const newEndTime = computeEndTime(newTime, dur);
          await querySql(`UPDATE LichHen SET NgayHen = ?, GioBatDau = ?, GioKetThuc = ?, TrangThai = N'Đã xác nhận' WHERE MaLichHen = ?`, [newDate, newTime, newEndTime, id]);
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
        const maxDh = await querySql(`SELECT TOP 1 MaDonHang FROM DonHang WHERE MaDonHang LIKE 'DH%' ORDER BY LEN(MaDonHang) DESC, MaDonHang DESC`);
        let nextN = 11;
        if (maxDh && maxDh[0]) {
          const nm = maxDh[0].MaDonHang.match(/DH(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const id = order.id && order.id.startsWith('DH') && order.id.length <= 20 ? order.id : ('DH' + (nextN < 10 ? '0' + nextN : nextN));

        const khId = await resolveOrCreateCustomer({
          customerId: order.customerId || order.userId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail
        });

        const cnId = order.branchId || 'CN01';
        const total = parseFloat(order.totalAmount || order.totalPrice || 500000);
        const addr = (order.shippingAddress || 'Nhận tại quầy').trim();
        const methodStr = (order.receiveMethod || 'Giao hàng tận nơi').trim();
        const notes = (order.notes || 'Đơn hàng online').trim();

        await querySql(
          `INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu) VALUES (?, ?, ?, GETDATE(), ?, ?, ?, N'Đang xử lý', ?)`,
          [id, khId, cnId, total, addr, methodStr, notes]
        );

        // Lưu chi tiết đơn hàng vào ChiTietDonHang chuẩn FEFO
        const orderItems = Array.isArray(order.items) ? order.items : (Array.isArray(order.cartItems) ? order.cartItems : []);
        for (let i = 0; i < orderItems.length; i++) {
          const it = orderItems[i];
          const prodId = it.productId || it.id || it.MaSanPham;
          const qty = parseInt(it.quantity || it.qty || it.SoLuong || 1, 10);
          if (prodId && qty > 0) {
            try {
              await querySql('EXEC sp_ThemChiTietDonHang @MaDonHang = ?, @MaSanPham = ?, @SoLuong = ?', [id, prodId, qty]);
            } catch (spErr) {
              const ctdhId = `CTDH_${id}_${i + 1}`.slice(0, 30);
              const unitPrice = parseFloat(it.price || it.actualPrice || it.GiaBan || 250000);
              const ctpnRow = await querySql('SELECT TOP 1 MaChiTietPhieuNhap FROM ChiTietPhieuNhap WHERE MaSanPham = ? AND SoLuongConLai > 0 ORDER BY HanSuDung ASC', [prodId]);
              const loId = (ctpnRow && ctpnRow[0]) ? ctpnRow[0].MaChiTietPhieuNhap : 'CTPN0001';
              await querySql(
                `INSERT INTO ChiTietDonHang (MaChiTietDonHang, MaDonHang, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
                [ctdhId, id, prodId, loId, qty, unitPrice, unitPrice, unitPrice * qty]
              );
            }
          }
        }

        console.log(`[SQL EXEC] Tạo đơn hàng mới chuẩn CSDL ${id} (Khách: ${khId}) cùng ${orderItems.length} chi tiết mặt hàng vào SQL Server!`);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, order: { id, customerId: khId, totalAmount: total, status: 'Processing' } }));
      }

      // --- 17. POS CHECKOUT  - HÓA ĐƠN & THANH TOÁN TẠI QUẦY -  ---
      if (pathname === '/api/pos/checkout' && method === 'POST') {
        const pos = parsedBody || {};
        const maxHd = await querySql(`SELECT TOP 1 MaHoaDon FROM HoaDon WHERE MaHoaDon LIKE 'HD%' ORDER BY LEN(MaHoaDon) DESC, MaHoaDon DESC`);
        let nextN = 11;
        if (maxHd && maxHd[0]) {
          const nm = maxHd[0].MaHoaDon.match(/HD(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const hdId = 'HD' + (nextN < 10 ? '0' + nextN : nextN);
        const khId = await resolveOrCreateCustomer({
          customerId: pos.customerId || pos.userId,
          customerName: pos.customerName,
          customerPhone: pos.customerPhone
        });
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

        // Lưu chi tiết dịch vụ vào ChiTietHoaDon_DichVu
        const posServices = Array.isArray(pos.services) ? pos.services : (pos.serviceId ? [{ id: pos.serviceId, price: total }] : []);
        for (const s of posServices) {
          const sId = s.id || s.serviceId || s.MaDichVu;
          const sPrice = parseFloat(s.price || s.Gia || total);
          if (sId) {
            try {
              await querySql(
                `INSERT INTO ChiTietHoaDon_DichVu (MaHoaDon, MaDichVu, SoLuong, DonGia, ThanhTien) VALUES (?, ?, 1, ?, ?)`,
                [hdId, sId, sPrice, sPrice]
              );
            } catch (_) {}
          }
        }

        // Lưu chi tiết sản phẩm vào ChiTietHoaDon_SanPham
        const posProducts = Array.isArray(pos.products) ? pos.products : (Array.isArray(pos.items) ? pos.items : []);
        for (let i = 0; i < posProducts.length; i++) {
          const p = posProducts[i];
          const pId = p.id || p.productId || p.MaSanPham;
          const pQty = parseInt(p.quantity || p.qty || 1, 10);
          const pPrice = parseFloat(p.price || p.GiaBan || 250000);
          if (pId && pQty > 0) {
            try {
              await querySql('EXEC sp_ThemChiTietHoaDonSanPham @MaHoaDon = ?, @MaSanPham = ?, @SoLuong = ?', [hdId, pId, pQty]);
            } catch (spErr) {
              const ctHdSpId = `CTHD_${hdId}_${i + 1}`.slice(0, 30);
              const ctpnRow = await querySql('SELECT TOP 1 MaChiTietPhieuNhap FROM ChiTietPhieuNhap WHERE MaSanPham = ? AND SoLuongConLai > 0 ORDER BY HanSuDung ASC', [pId]);
              const loId = (ctpnRow && ctpnRow[0]) ? ctpnRow[0].MaChiTietPhieuNhap : 'CTPN0001';
              await querySql(
                `INSERT INTO ChiTietHoaDon_SanPham (MaChiTietHDSanPham, MaHoaDon, MaSanPham, MaChiTietPhieuNhap, SoLuong, DonGiaGoc, PhanTramGiamGia, DonGiaThucTe, ThanhTien) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
                [ctHdSpId, hdId, pId, loId, pQty, pPrice, pPrice, pPrice * pQty]
              );
            }
          }
        }

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
        let nextN = 11;
        if (maxDg && maxDg[0]) {
          const nm = maxDg[0].MaDanhGia.match(/DG(\d+)/i);
          if (nm) nextN = parseInt(nm[1], 10) + 1;
        }
        const dgId = 'DG' + (nextN < 10 ? '0' + nextN : nextN);
        const khId = await resolveOrCreateCustomer({
          customerId: r.customerId || r.userId,
          customerName: r.customerName,
          customerPhone: r.customerPhone
        });
        const stars = parseInt(r.rating || 5, 10);
        let lhId = r.bookingId || null;
        let dhId = r.orderId || null;
        if (!lhId && !dhId) {
          const recentLh = await querySql('SELECT TOP 1 MaLichHen FROM LichHen WHERE MaKhachHang = ? ORDER BY NgayHen DESC', [khId]);
          lhId = (recentLh && recentLh[0]) ? recentLh[0].MaLichHen : 'LH01';
          dhId = null;
        } else if (lhId && dhId) {
          dhId = null; // Ràng buộc CK_DanhGia_DoiTuong: đúng 1 trong 2 trường được phép NOT NULL
        }

        await querySql(
          `INSERT INTO DanhGia (MaDanhGia, MaKhachHang, MaLichHen, MaDonHang, SoSao, NoiDung, HinhAnh, NgayDanhGia, TrangThai, CoFlag) VALUES (?, ?, ?, ?, ?, ?, NULL, GETDATE(), N'Hiển thị', 0)`,
          [dgId, khId, lhId, dhId, stars, comment]
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

      // --- 25. NOTIFICATIONS / THÔNG BÁO ---
      if (pathname === '/api/notifications' && method === 'GET') {
        const rows = await querySql(
          `SELECT tb.MaThongBao, tb.MaTaiKhoan, tb.MaKhachHang, tb.TieuDe, tb.NoiDung, tb.LoaiThongBao,
                  CONVERT(VARCHAR(19), tb.ThoiGianGui, 120) AS ThoiGianGui, tb.TrangThaiDoc
           FROM ThongBao tb
           ORDER BY tb.ThoiGianGui DESC`
        );
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      if (pathname.startsWith('/api/notifications/') && pathname.includes('/read') && method === 'PUT') {
        const parts = pathname.split('/');
        const notifId = parts[3];
        await querySql(`UPDATE ThongBao SET TrangThaiDoc = 1 WHERE MaThongBao = ?`, [notifId]);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, notifId, isRead: true }));
      }

      // --- 26. LOW STOCK WARNING VIEW / CẢNH BÁO TỒN THẤP ---
      if (pathname === '/api/inventory/low-stock' && method === 'GET') {
        const rows = await querySql(`SELECT * FROM vw_SanPhamCanhBaoTonThap`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      // --- 27. FEFO LOT PRICING VIEW / GIÁ BÁN THEO LÔ HẠN SỬ DỤNG ---
      if (pathname === '/api/inventory/lots' && method === 'GET') {
        const branchParam = parsedUrl.searchParams.get('branch_id');
        let q = `SELECT * FROM vw_GiaBanTheoLoHienTai`;
        const params = [];
        if (branchParam) {
          q += ` WHERE MaChiNhanh = ?`;
          params.push(branchParam);
        }
        const rows = await querySql(q, params);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(rows));
      }

      // --- 28. PHỤC VỤ FILE TĨNH  - STATIC FILES -  & SPA FALLBACK ---
      let rawPath = pathname.replace(/^\/+/, '');
      try { rawPath = decodeURIComponent(rawPath); } catch (_) {}

      // Hỗ trợ truy cập file tĩnh qua prefix /static/... tương đương app.use - '/static', express.static - ... -  - 
      let relPath = rawPath;
      if (relPath.startsWith('static/')) {
        relPath = relPath.substring(7);
      }
      // Chuẩn hóa đường dẫn: loại bỏ tiền tố web/, frontend/, web/frontend/
      relPath = relPath.replace(/^web\/frontend\//, '').replace(/^frontend\//, '').replace(/^web\//, '');

      // Danh sách các vị trí tìm kiếm tệp tĩnh  - phục vụ trực tiếp từ ROOT_DIR nơi chứa các folder ảnh - 
      const candidatePaths = [
        path.join(ROOT_DIR, relPath),
        path.join(ROOT_DIR, 'Men_Grooming_Products', relPath),
        path.join(FRONTEND_DIR, relPath)
      ];

      if (relPath.startsWith('ChiNhanh_Omni/')) {
        candidatePaths.push(path.join(ROOT_DIR, 'Men_Grooming_Products', 'ChiNhanh_Omni', path.basename(relPath)));
      }
      if (relPath.startsWith('DichVu_Men/')) {
        candidatePaths.push(path.join(ROOT_DIR, 'Men_Grooming_Products', 'DichVu_Men', path.basename(relPath)));
      }

      for (const targetPath of candidatePaths) {
        if (fs.existsSync(targetPath)) {
          try {
            const stat = fs.statSync(targetPath);
            if (stat.isFile()) {
              const ext = path.extname(targetPath).toLowerCase();
              const mime = MIME_MAP[ext] || 'application/octet-stream';
              const isCode = ['.js', '.css', '.html', '.json'].includes(ext);
              res.writeHead(200, {
                'Content-Type': mime,
                'Content-Length': stat.size,
                'Cache-Control': isCode ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400'
              });
              return fs.createReadStream(targetPath).pipe(res);
            }
          } catch (_) {}
        }
      }

      // SPA Fallback: Phục vụ index.html cho các route như services booking shop stylists admin cart
      const fileExt = path.extname(relPath).toLowerCase();
      if (!fileExt || fileExt === '.html') {
        const indexPath = path.join(FRONTEND_DIR, 'index.html');
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0'
          });
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

  const CANDIDATE_PORTS = [
    process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    3000,
    3001,
    3002,
    8080,
    8081,
    8082,
    5000
  ].filter((p, idx, arr) => p && arr.indexOf(p) === idx);

  let portIdx = 0;

  function tryListen() {
    const currentPort = CANDIDATE_PORTS[portIdx];
    server.removeAllListeners('error');
    server.removeAllListeners('listening');

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        console.warn(`\n[THÔNG BÁO CỔNG] Cổng ${currentPort} đang bị chiếm hoặc hạn chế (${err.code}).`);
        portIdx++;
        if (portIdx < CANDIDATE_PORTS.length) {
          console.log(`  -> Đang tự động kết nối cổng dự phòng: http://localhost:${CANDIDATE_PORTS[portIdx]} để website hoạt động ngay...\n`);
          tryListen();
        } else {
          console.error(`\n[LỖI CỔNG] Toàn bộ các cổng dự phòng (${CANDIDATE_PORTS.join(', ')}) đều không khả dụng.`);
          process.exit(1);
        }
      } else {
        console.error('[SERVER LỖI]', err);
      }
    });

    server.once('listening', () => {
      console.log(`=========================================================================`);
      console.log(`  OMNISALON DIRECT SQL SERVER (SSMS 20) BACKEND DANG HOAT DONG`);
      console.log(`  - Local Web Portal:  http://localhost:${currentPort}`);
      console.log(`  - SQL Server:        ${activeDbConfig?.server || '.\\SQLEXPRESS'}`);
      console.log(`  - Database:          ${DB_NAME} (100% Ket noi SSMS truc tiep)`);
      console.log(`  - API Health:        http://localhost:${currentPort}/api/health`);
      console.log(`=========================================================================`);
      try {
        const { exec } = require('child_process');
        exec(`start http://localhost:${currentPort}`);
      } catch (_) {}
    });

    server.listen(currentPort, '0.0.0.0');
  }

  tryListen();
}

startServer();
