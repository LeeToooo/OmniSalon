// =========================================================================
// OmniSalon — DIRECT SQL ENGINE & REST API SERVER (Node.js Edition)
// Dữ liệu 100% truy vấn và đồng bộ trực tiếp từ QL_SALON.sql (T-SQL RDBMS)
// =========================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const SQL_FILE = path.join(__dirname, 'QL_SALON.sql');

if (!fs.existsSync(SQL_FILE)) {
  console.error(`[ERROR] Không tìm thấy tệp CSDL: ${SQL_FILE}`);
  process.exit(1);
}

const otpStore = new Map(); // Bộ nhớ đệm lưu trữ mã OTP Email (TTL 5 phút)

// -------------------------------------------------------------------------
// CẤU HÌNH GỬI EMAIL THẬT QUA GMAIL SMTP (NODEMAILER)
// -------------------------------------------------------------------------
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

const EMAIL_CONFIG_FILE = path.join(__dirname, 'email_config.json');

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
      reason: !nodemailer ? 'Chưa cài đặt nodemailer' : 'Chưa điền thông tin Gmail (user/pass) trong email_config.json'
    };
  }

  const cleanPass = cfg.pass.replace(/\s+/g, ''); // Loại bỏ khoảng trắng nếu người dùng sao chép từ Google
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
        <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">Hệ thống bảo mật xác nhận danh tính thành viên đa nền tảng</p>
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

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px 16px; margin-bottom: 22px; font-size: 13px; line-height: 1.6; color: #94a3b8;">
        🔒 <b>Lưu ý an toàn:</b> Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai, bao gồm cả nhân viên Omni Salon. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư này hoặc liên hệ hotline để bảo vệ tài khoản.
      </div>

      <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; text-align: center; font-size: 12px; color: #64748b;">
        © 2026 Omni Salon Barber • Hệ thống 18+ Chi Nhánh Cao Cấp Toàn Quốc<br>
        Hotline hỗ trợ: 1900 8899 • Email: support@omnisalon.vn
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: toEmail,
    subject: `[OmniSalon] ${otp} là mã xác thực tài khoản của bạn`,
    text: `Mã xác thực OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho người khác.`,
    html: mailHtml
  });

  return { sentReal: true };
}

// -------------------------------------------------------------------------
// SQL DATABASE ENGINE: TRÍCH XUẤT & TRUY VẤN DỮ LIỆU TỪ QL_SALON.sql
// -------------------------------------------------------------------------
function getSqlDatabase() {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');

  // Trích xuất các ID đã bị xóa trong SQL để đảm bảo tính toàn vẹn và đồng bộ
  const deletedNvIds = new Set();
  const delNvRe = /DELETE FROM NhanVien WHERE MaNhanVien\s*=\s*'([^']+)'/gi;
  let dm;
  while ((dm = delNvRe.exec(sql)) !== null) deletedNvIds.add(dm[1]);

  const deletedSvIds = new Set();
  const delSvRe = /DELETE FROM DichVu WHERE MaDichVu\s*=\s*'([^']+)'/gi;
  while ((dm = delSvRe.exec(sql)) !== null) deletedSvIds.add(dm[1]);

  const deletedSpIds = new Set();
  const delSpRe = /DELETE FROM SanPham WHERE MaSanPham\s*=\s*'([^']+)'/gi;
  while ((dm = delSpRe.exec(sql)) !== null) deletedSpIds.add(dm[1]);

  const deletedLhIds = new Set();
  const delLhRe = /DELETE FROM LichHen WHERE MaLichHen\s*=\s*'([^']+)'/gi;
  while ((dm = delLhRe.exec(sql)) !== null) deletedLhIds.add(dm[1]);

  const deletedCnIds = new Set();
  const delCnRe = /DELETE FROM ChiNhanh WHERE MaChiNhanh\s*=\s*'([^']+)'/gi;
  while ((dm = delCnRe.exec(sql)) !== null) deletedCnIds.add(dm[1]);

  // 1. Danh mục sản phẩm
  const catRegex = /\(N?'(DM\d+)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)'\)/g;
  const catIcons = {
    DM01: '💈', DM02: '✨', DM03: '💨', DM04: '🧴', DM05: '🧼',
    DM06: '🌾', DM07: '🧪', DM08: '🧔', DM09: '✂'
  };
  const categories = [];
  const catMap = {};
  let m;
  while ((m = catRegex.exec(sql)) !== null) {
    const cId = m[1];
    const cName = m[2].replace(/''/g, "'");
    const c = {
      id: cId,
      MaDanhMuc: cId,
      name: cName,
      TenDanhMuc: cName,
      description: m[3].replace(/''/g, "'"),
      MoTa: m[3].replace(/''/g, "'"),
      icon: catIcons[cId] || '💈',
      status: m[4]
    };
    categories.push(c);
    catMap[c.id] = c.name;
  }

  // 2. Nhà cung cấp
  const nccRegex = /\(N?'(NCC\d+)',\s*N'((?:''|[^'])*)',\s*'([^']*)',\s*'([^']*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)'\)/g;
  const suppliers = [];
  while ((m = nccRegex.exec(sql)) !== null) {
    suppliers.push({
      id: m[1],
      name: m[2].replace(/''/g, "'"),
      phone: m[3],
      email: m[4],
      address: m[5].replace(/''/g, "'")
    });
  }

  // 3. Lô hàng & hạn sử dụng
  const ctpnRegex = /\(N?'(CTPN\d+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g;
  const batches = {};
  while ((m = ctpnRegex.exec(sql)) !== null) {
    const b = {
      id: m[1],
      receiptId: m[2],
      productId: m[3],
      batchCode: m[4],
      expiryDate: m[5],
      quantity: parseInt(m[6], 10),
      remainingQuantity: parseInt(m[7], 10),
      importPrice: parseFloat(m[8])
    };
    if (!batches[b.productId]) batches[b.productId] = b;
  }

  // 4. Sản phẩm
  const prodRegex = /\(N?'(SP\d+)',\s*N?'(DM\d+)',\s*N?'(NCC\d+)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*(\d+),\s*(\d+),\s*N'((?:''|[^'])*)'\)/g;
  const products = [];
  const refDate = new Date();

  const brandPrefixes = [
    'Hanz de Fuko', 'Apestomen', 'Blumaan', 'Kevin Murphy', 'Reuzel',
    'Olaplex', 'Davines', 'By Vilain', 'Uppercut Deluxe',
    'L’Oréal Professionnel', 'Schwarzkopf Professional', 'Morris Motley',
    'Slick Gorilla', 'Dapper Dan', 'Suavecito', 'Proraso', 'Kerasys Homme'
  ];

  while ((m = prodRegex.exec(sql)) !== null) {
    const spId = m[1];
    if (deletedSpIds.has(spId)) continue;
    const dmId = m[2];
    const nccId = m[3];
    const name = m[4].replace(/''/g, "'");
    const desc = m[5].replace(/''/g, "'");
    const img = m[6].replace(/''/g, "'");
    const cost = parseFloat(m[7]);
    const price = parseFloat(m[8]);
    const status = m[9];

    let brand = 'Khác';
    for (const b of brandPrefixes) {
      if (name.toLowerCase().startsWith(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    const categoryName = catMap[dmId] || 'Sản phẩm tạo kiểu';
    const batchInfo = batches[spId] || null;
    let discountPercent = 0;
    let finalPrice = price;
    let isFlashSale = false;

    if (batchInfo) {
      const expDate = new Date(batchInfo.expiryDate);
      const diffTime = expDate - refDate;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysLeft > 180) {
        discountPercent = 0;
      } else if (daysLeft >= 91) {
        discountPercent = 20;
        isFlashSale = true;
      } else if (daysLeft >= 31) {
        discountPercent = 30;
        isFlashSale = true;
      } else {
        discountPercent = 35;
        isFlashSale = true;
      }
      finalPrice = Math.round(price * (1 - (discountPercent / 100)));
    }

    products.push({
      id: spId,
      MaSanPham: spId,
      name: name,
      TenSanPham: name,
      brand: brand,
      categoryId: dmId,
      MaDanhMuc: dmId,
      category: categoryName,
      supplierId: nccId,
      MaNhaCungCap: nccId,
      price: finalPrice,
      GiaBan: finalPrice,
      GiaBanThucTe: finalPrice,
      originalPrice: price,
      GiaGoc: price,
      GiaNiemYetGoc: price,
      costPrice: cost,
      GiaNhap: cost,
      image: img,
      HinhAnh: img,
      description: desc,
      MoTa: desc,
      rating: 4.9,
      reviewCount: 120,
      stock: batchInfo ? batchInfo.remainingQuantity : 25,
      SoLuongTon: batchInfo ? batchInfo.remainingQuantity : 25,
      isFlashSale: isFlashSale,
      discountPercent: discountPercent,
      PhanTramGiam: discountPercent,
      status: (status === 'Đang bán') ? 'Available' : 'Discontinued'
    });
  }

  // 5. Dịch vụ
  const servRegex = /\('(DV\d+)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*(\d+),\s*(\d+),\s*'([^']*)',\s*N'((?:''|[^'])*)'(?:,\s*'([^']*)')?\)/g;
  const services = [];
  const serviceImgs = {
    DV01: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    DV02: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80',
    DV03: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80',
    DV04: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=600&q=80',
    DV05: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
    DV06: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    DV07: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
    DV08: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    DV09: 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=600&q=80',
    DV10: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
  };
  while ((m = servRegex.exec(sql)) !== null) {
    const svId = m[1];
    if (deletedSvIds.has(svId)) continue;
    const svName = m[2].replace(/''/g, "'");
    const svDesc = m[3].replace(/''/g, "'");
    const duration = parseInt(m[4], 10);
    const svPrice = parseFloat(m[5]);

    services.push({
      id: svId,
      MaDichVu: svId,
      name: svName,
      TenDichVu: svName,
      price: svPrice,
      Gia: svPrice,
      duration: `${duration} phút`,
      durationMinutes: duration,
      ThoiLuong: duration,
      description: svDesc,
      MoTa: svDesc,
      image: serviceImgs[svId] || serviceImgs.DV01,
      category: ['DV01', 'DV02', 'DV06'].includes(svId) ? 'Cắt & Tạo Kiểu' : ['DV03', 'DV04', 'DV05', 'DV08', 'DV09'].includes(svId) ? 'Uốn & Nhuộm' : 'Chăm Sóc & Phục Hồi',
      rating: 4.95,
      reviewCount: 280
    });
  }

  // 6. Stylists (NhanVien - Thợ chính, Thợ phụ, Quản lý)
  const nvRegex = /\(N?'(NV\d+)',\s*N?'(CN\d+)',\s*N'((?:''|[^'])*)',\s*N?'([^']*)',\s*N?'([^']*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)'\)/g;
  const stylists = [];
  const stylistAvatars = {
    NV01: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    NV02: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    NV03: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    NV04: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    NV05: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  };
  const stylistSpecialties = {
    NV01: 'Quản lý phong cách, Tư vấn định hình diện mạo toàn diện',
    NV02: 'Undercut thời trang, Fade sắc nét, Vuốt sáp texture chuyên sâu',
    NV03: 'Gội dưỡng sinh massage, Ép side tóc nam, Sấy phồng tự nhiên',
    NV04: 'Uốn tóc nam Textured, Uốn con sâu & Nhuộm tông khói thời trang',
    NV05: 'Master Fade nghệ thuật Châu Âu, Uốn Texture & Scissor Art'
  };
  while ((m = nvRegex.exec(sql)) !== null) {
    const nvId = m[1];
    if (deletedNvIds.has(nvId)) continue;
    stylists.push({
      id: nvId,
      MaNhanVien: nvId,
      branchId: m[2],
      MaChiNhanh: m[2],
      name: m[3].replace(/''/g, "'"),
      HoTen: m[3].replace(/''/g, "'"),
      level: m[6].replace(/''/g, "'"),
      title: `${m[6].replace(/''/g, "'")} • ${m[7].replace(/''/g, "'")}`,
      role: m[7].replace(/''/g, "'"),
      phone: m[4],
      email: m[5],
      avatar: stylistAvatars[nvId] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      rating: 4.95,
      reviewCount: 350,
      specialty: stylistSpecialties[nvId] || (m[7].includes('phụ') ? 'Gội đầu dưỡng sinh, Ép side & Chăm sóc tóc' : 'Tạo kiểu tóc chuyên nghiệp, Fade & Uốn'),
      isAvailable: true
    });
  }

  // 7. Chi nhánh
  const cnRegex = /\(N?'(CN\d+)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N?'([^']*)',\s*N?'([^']*)',\s*N?'([^']*)',\s*N'((?:''|[^'])*)'\)/g;
  const branches = [];
  const branchImgs = {
    CN01: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
    CN02: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
    CN03: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    CN04: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
    CN06: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
    CN07: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    CN08: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80'
  };

  const updateLhStatusMap = new Map();
  const updateLhRe = /UPDATE\s+LichHen\s+SET\s+TrangThai\s*=\s*N?'([^']+)'\s+WHERE\s+MaLichHen\s*=\s*'([^']+)'/gi;
  let um;
  while ((um = updateLhRe.exec(sql)) !== null) {
    updateLhStatusMap.set(um[2], um[1]);
  }

  while ((m = cnRegex.exec(sql)) !== null) {
    const cnId = m[1];
    if (deletedCnIds.has(cnId)) continue;
    const addr = m[3].replace(/''/g, "'");
    const city = addr.includes('Hà Nội') ? 'Hà Nội' : addr.includes('Đà Nẵng') ? 'Đà Nẵng' : 'TP. Hồ Chí Minh';
    let bName = m[2].replace(/''/g, "'");
    if (sql.includes("REPLACE(TenChiNhanh, N'Men Salon Barber', N'Omni Salon Barber')")) {
      bName = bName.replace(/Men Salon Barber/g, 'Omni Salon Barber');
    }
    branches.push({
      id: cnId,
      MaChiNhanh: cnId,
      name: bName,
      TenChiNhanh: bName,
      address: addr,
      DiaChi: addr,
      phone: m[4],
      SoDienThoai: m[4],
      openHours: `${m[5].substring(0, 5)} - ${m[6].substring(0, 5)}`,
      city: city,
      region: city === 'Hà Nội' ? 'hn' : city === 'Đà Nẵng' ? 'dn' : 'hcm',
      image: branchImgs[cnId] || branchImgs.CN01
    });
  }

  // 8. Lịch hẹn
  const lhRegex = /\(N?'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*N'((?:''|[^'])*)',\s*(\d+),\s*(\d+),\s*N'((?:''|[^'])*)',\s*([^,\)]*)\)/g;
  const bookings = [];
  while ((m = lhRegex.exec(sql)) !== null) {
    if (deletedLhIds.has(m[1])) continue;
    const rawNote = m[11].replace(/''/g, "'");
    let cName = m[2] === 'KH01' ? 'Ngô Văn Tuấn' : (m[2] === 'KH02' ? 'Trần Mỹ Linh' : (m[2] === 'KH03' ? 'Đặng Thanh Tùng' : 'Khách Hàng Omni'));
    let cPhone = m[2] === 'KH01' ? '0988000001' : (m[2] === 'KH02' ? '0988000002' : '0908888999');
    let sName = 'Dịch vụ chăm sóc tóc Omni';

    // Trích xuất tự động thông tin khách đặt từ Web hoặc Mobile lưu trong GhiChu
    const nameMatch = rawNote.match(/Khách:\s*([^|;]+)/i);
    if (nameMatch) cName = nameMatch[1].trim();

    const phoneMatch = rawNote.match(/SĐT:\s*([^|;]+)/i);
    if (phoneMatch) cPhone = phoneMatch[1].trim();

    const srvMatch = rawNote.match(/DV:\s*([^|;]+)/i);
    if (srvMatch) sName = srvMatch[1].trim();

    const stylistMap = {
      NV02: 'Đỗ Đình Độ', NV04: 'Lê Quang Huy', NV05: 'Vũ Hoàng Nam',
      NV06: 'Phạm Thu Thảo', NV07: 'Bùi Tuấn Anh'
    };
    const branchMap = {
      CN01: 'Omni Salon HQ Điện Biên Phủ',
      CN02: 'Omni Salon Nguyễn Bỉnh Khiêm',
      CN03: 'Omni Salon Quận 11 - Lãnh Binh Thăng'
    };

    let bStatus = m[8];
    if (updateLhStatusMap.has(m[1])) {
      bStatus = updateLhStatusMap.get(m[1]);
    }

    bookings.push({
      id: m[1],
      MaLichHen: m[1],
      bookingCode: m[1],
      customerId: m[2],
      customerName: cName,
      customerPhone: cPhone,
      stylistId: m[3],
      stylistName: stylistMap[m[3]] || 'Master Stylist Chuyên Nghiệp',
      branchId: m[4],
      branchName: branchMap[m[4]] || 'Omni Salon Chi Nhánh',
      bookingDate: m[5],
      date: m[5],
      timeSlot: m[6].substring(0, 5),
      status: bStatus === 'Hoàn thành' ? 'Completed' : (bStatus === 'Đã hủy' ? 'Cancelled' : (bStatus === 'In_Progress' ? 'in_progress' : 'Confirmed')),
      TrangThai: bStatus,
      serviceName: sName,
      totalPrice: parseFloat(m[9]),
      TongTien: parseFloat(m[9]),
      notes: rawNote
    });
  }

  // 9. Đơn hàng
  const dhRegex = /\(N?'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)'\)/g;
  const orders = [];
  while ((m = dhRegex.exec(sql)) !== null) {
    orders.push({
      id: m[1],
      MaDonHang: m[1],
      customerId: m[2],
      customerName: m[2] === 'KH03' ? 'Đặng Thanh Tùng' : 'Khách Hàng Omni',
      customerPhone: '0908888999',
      branchId: m[3],
      orderDate: m[4],
      totalAmount: parseFloat(m[5]),
      TongTien: parseFloat(m[5]),
      shippingAddress: m[6].replace(/''/g, "'"),
      receiveMethod: m[7].replace(/''/g, "'"),
      orderStatus: m[8] === 'Đã giao' ? 'Completed' : 'Processing',
      TrangThai: m[8],
      notes: m[9].replace(/''/g, "'"),
      items: [
        {
          productId: 'SP13',
          productName: 'Kevin Murphy Rough Rider',
          quantity: 1,
          price: parseFloat(m[5])
        }
      ]
    });
  }

  return {
    version: '4.0.0 (SQL Database Engine)',
    engine: 'T-SQL / Direct SQL Engine',
    source: 'QL_SALON.sql',
    lastUpdated: new Date().toISOString(),
    branches,
    services,
    stylists,
    categories,
    suppliers,
    products,
    bookings,
    orders
  };
}

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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`[${new Date().toLocaleTimeString('vi-VN')}] ${method} ${pathname}`);

  let body = '';
  req.on('data', chunk => { body += chunk.toString('utf8'); });
  req.on('end', async () => {
    let parsedBody = null;
    if (body) {
      try { parsedBody = JSON.parse(body); } catch (e) { }
    }

    // --- API ENDPOINTS (100% DIRECT SQL ENGINE) ---
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ status: 'ok', engine: 'SQL_SALON_DB', source: SQL_FILE, time: new Date().toISOString() }));
    }

    // --- AUTH OTP: GỬI MÃ XÁC NHẬN VỀ EMAIL ---
    if (pathname === '/api/auth/send-otp' && method === 'POST') {
      const { email } = parsedBody || {};
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Địa chỉ email không hợp lệ (Ví dụ: user@gmail.com).' }));
      }
      const lowerEmail = email.trim().toLowerCase();
      const now = Date.now();
      const existing = otpStore.get(lowerEmail);
      if (existing && (now - existing.lastSentAt) < 30000) {
        const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
        res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: `Vui lòng đợi ${waitSec} giây trước khi yêu cầu gửi lại mã.` }));
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(lowerEmail, {
        otp,
        expiresAt: now + 5 * 60 * 1000,
        lastSentAt: now
      });

      let realSendStatus = null;
      try {
        realSendStatus = await sendRealGmailOtp(lowerEmail, otp);
      } catch (err) {
        console.error(`  [GMAIL ERROR] Không thể gửi email qua Gmail SMTP:`, err.message);
        realSendStatus = { sentReal: false, error: err.message };
      }

      console.log(`\r\n=========================================================================`);
      console.log(`  [EMAIL DISPATCHER] GỬI MÃ XÁC NHẬN OTP ĐẾN: ${lowerEmail}`);
      console.log(`  >>> MÃ XÁC NHẬN (OTP 6 SỐ): [ ${otp} ] (Hiệu lực: 5 phút)`);
      if (realSendStatus?.sentReal) {
        console.log(`  >>> TRẠNG THÁI: [ ĐÃ GỬI THÀNH CÔNG VỀ HÒM THƯ GMAIL CỦA KHÁCH HÀNG ]`);
      } else {
        console.log(`  >>> TRẠNG THÁI: [ CHƯA CẤU HÌNH GMAIL THẬT HOẶC CÓ LỖI ]`);
        if (realSendStatus?.reason) console.log(`      Lý do: ${realSendStatus.reason}`);
        if (realSendStatus?.error) console.log(`      Lỗi: ${realSendStatus.error}`);
      }
      console.log(`=========================================================================\r\n`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        message: realSendStatus?.sentReal
          ? `Mã xác nhận 6 số đã được gửi trực tiếp về Gmail ${lowerEmail}. Vui lòng kiểm tra hộp thư đến hoặc mục Thư rác (Spam).`
          : `Mã xác nhận 6 số đã được khởi tạo cho ${lowerEmail}.${realSendStatus?.reason ? ' Lưu ý: ' + realSendStatus.reason : ''}`,
        email: lowerEmail,
        sentReal: !!realSendStatus?.sentReal,
        otp
      }));
    }

    // --- AUTH OTP: XÁC THỰC MÃ OTP ---
    if (pathname === '/api/auth/verify-otp' && method === 'POST') {
      const { email, otp } = parsedBody || {};
      if (!email || !otp) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Thiếu email hoặc mã xác nhận OTP.' }));
      }
      const lowerEmail = email.trim().toLowerCase();
      const entry = otpStore.get(lowerEmail);
      if (!entry) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Mã xác nhận chưa được gửi hoặc đã hết hiệu lực.' }));
      }
      if (Date.now() > entry.expiresAt) {
        otpStore.delete(lowerEmail);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Mã xác nhận đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới.' }));
      }
      if (entry.otp !== String(otp).trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Mã xác nhận không chính xác. Vui lòng thử lại.' }));
      }
      otpStore.delete(lowerEmail);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, message: 'Xác thực email thành công!' }));
    }

    // --- AUTH: ĐĂNG KÝ THÀNH VIÊN MỚI & LƯU VÀO SQL DATABASE (QL_SALON.sql) ---
    if (pathname === '/api/auth/register' && method === 'POST') {
      const data = parsedBody || {};
      const fullName = (data.fullName || data.name || '').trim();
      const phone = (data.phone || '').trim();
      const email = (data.email || '').trim().toLowerCase();
      const password = (data.password || '').trim();
      const otp = (data.otp || '').trim();

      if (!fullName || fullName.length < 2) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Họ và tên không hợp lệ (tối thiểu 2 ký tự).' }));
      }
      if (!phone || !/^[0-9]{9,11}$/.test(phone)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Số điện thoại không hợp lệ (cần 9-11 chữ số).' }));
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Địa chỉ email không đúng định dạng.' }));
      }
      if (!password || password.length < 3) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Mật khẩu phải có tối thiểu 3 ký tự.' }));
      }

      // Xác thực OTP
      if (otp) {
        const entry = otpStore.get(email);
        if (!entry || entry.otp !== otp) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: 'Mã xác nhận OTP không chính xác hoặc đã hết hạn.' }));
        }
        otpStore.delete(email);
      }

      // Đọc database SQL hiện tại để lấy ID khách hàng tiếp theo
      const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
      let maxKhNum = 20;
      const khMatch = sqlContent.matchAll(/'KH(\d+)'/g);
      for (const m of khMatch) {
        const n = parseInt(m[1], 10);
        if (n > maxKhNum) maxKhNum = n;
      }
      const nextKhNum = maxKhNum + 1;
      const khId = 'KH' + (nextKhNum < 10 ? '0' + nextKhNum : nextKhNum);
      const tkId = 'TK_' + khId;
      const username = phone;
      const safeName = fullName.replace(/'/g, "''");
      const safePass = password.replace(/'/g, "''");

      const sqlInsert = `\r\n-- [SQL THOI GIAN THUC] DANG KY KHACH HANG VA TAI KHOAN MOI: ${khId}\r\n` +
        `INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh) VALUES\r\n` +
        `('${khId}', N'${safeName}', '${phone}', '${email}', '2000-01-01');\r\n` +
        `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai) VALUES\r\n` +
        `('${tkId}', NULL, '${khId}', '${username}', '${safePass}', N'Khách hàng', N'Hoạt động');\r\n`;

      fs.appendFileSync(SQL_FILE, sqlInsert, 'utf8');
      console.log(`  -> [SQL EXEC] INSERT INTO KhachHang VALUES ('${khId}', '${safeName}', '${phone}', '${email}')`);
      console.log(`  -> [SQL EXEC] INSERT INTO TaiKhoan VALUES ('${tkId}', '${username}', '${safePass}')`);

      const newUser = {
        id: khId,
        MaKhachHang: khId,
        username,
        fullName,
        phone,
        email,
        role: 'CUSTOMER',
        roleName: 'Khách Hàng Thành Viên',
        tier: 'Standard Member',
        rewardPoints: 100,
        createdAt: new Date().toISOString()
      };

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        message: 'Đăng ký tài khoản thành công! Dữ liệu đã được lưu trực tiếp vào cơ sở dữ liệu SQL.',
        user: newUser,
        sqlExecuted: sqlInsert.trim()
      }));
    }

    // --- AUTH: ĐỔI MẬT KHẨU / QUÊN MẬT KHẨU QUA OTP GMAIL & CẬP NHẬT VÀO SQL DATABASE ---
    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const data = parsedBody || {};
      const identifier = (data.identifier || data.email || data.phone || '').trim();
      const email = (data.email || '').trim().toLowerCase();
      const otp = (data.otp || '').trim();
      const newPassword = (data.newPassword || data.password || '').trim();

      if (!email && !identifier) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp email hoặc tên đăng nhập/SĐT.' }));
      }
      if (!newPassword || newPassword.length < 3) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Mật khẩu mới phải có tối thiểu 3 ký tự.' }));
      }
      if (!otp) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập mã xác thực OTP 6 số.' }));
      }

      const lookupEmail = email || identifier.toLowerCase();
      const entry = otpStore.get(lookupEmail);
      if (!entry || entry.otp !== otp) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Mã xác nhận OTP không chính xác hoặc đã hết hạn.' }));
      }
      otpStore.delete(lookupEmail);

      const safePass = newPassword.replace(/'/g, "''");
      const safeId = identifier.replace(/'/g, "''");
      const safeMail = lookupEmail.replace(/'/g, "''");

      const sqlUpdate = `\r\n-- [SQL THOI GIAN THUC] DOI MAT KHAU TAI KHOAN: ${safeId || safeMail}\r\n` +
        `UPDATE TaiKhoan SET MatKhau = '${safePass}'\r\n` +
        `WHERE TenDangNhap = '${safeId}' OR TenDangNhap = '${safeMail}'\r\n` +
        `   OR MaKhachHang IN (SELECT MaKhachHang FROM KhachHang WHERE Email = '${safeMail}' OR SoDienThoai = '${safeId}');\r\n`;

      fs.appendFileSync(SQL_FILE, sqlUpdate, 'utf8');
      console.log(`  -> [SQL EXEC] UPDATE TaiKhoan SET MatKhau = '***' WHERE Identifier = '${safeId || safeMail}'`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được lưu trực tiếp vào cơ sở dữ liệu SQL.',
        sqlExecuted: sqlUpdate.trim()
      }));
    }

    // --- AUTH: ĐĂNG NHẬP (TRUY VẤN TÀI KHOẢN TRỰC TIẾP TỪ QL_SALON.sql) ---
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { identifier, password } = parsedBody || {};
      if (!identifier || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu.' }));
      }

      const ident = identifier.trim().toLowerCase();
      const pass = String(password).trim();

      // Quản trị tối cao Super Admin
      if ((ident === 'admin' || ident === 'quantri') && pass === 'admin123') {
        const adminUser = {
          id: 'TK_ADMIN',
          username: 'admin',
          fullName: 'Tổng Quản Trị Hệ Thống',
          role: 'SUPER_ADMIN',
          roleName: 'Quản Trị Tối Cao',
          branchId: 'ALL',
          branchName: 'Toàn Hệ Thống',
          email: 'admin@omnisalon.vn'
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: true, message: 'Đăng nhập Quản Trị thành công!', user: adminUser, token: 'JWT_SUPER_ADMIN_' + Date.now() }));
      }

      const sql = fs.readFileSync(SQL_FILE, 'utf8');

      // 1. Kiểm tra mật khẩu cập nhật qua UPDATE TaiKhoan
      const updatedPasswords = new Map();
      const updateRegex = /UPDATE TaiKhoan SET MatKhau = '([^']*)'\s*WHERE\s+([^\r\n;]+)/gi;
      let upMatch;
      while ((upMatch = updateRegex.exec(sql)) !== null) {
        const newPass = upMatch[1];
        const whereClause = upMatch[2];
        const tokens = whereClause.match(/'([^']+)'/g) || [];
        tokens.forEach(t => {
          const cleanToken = t.replace(/'/g, '').trim().toLowerCase();
          updatedPasswords.set(cleanToken, newPass);
        });
      }

      // 2. Tìm trong Nhân Viên (80 NV)
      const nvRegex = /\(N?'(NV\d+)',\s*N?'(CN\d+)',\s*N'((?:''|[^'])*)',\s*N?'([^']*)',\s*N?'([^']*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)'\)/g;
      let matchedStaff = null;
      let sMatch;
      while ((sMatch = nvRegex.exec(sql)) !== null) {
        const nvId = sMatch[1];
        const cnId = sMatch[2];
        const name = sMatch[3].replace(/''/g, "'");
        const phone = sMatch[4];
        const email = sMatch[5];
        const roleStr = sMatch[7].replace(/''/g, "'");
        const staffUsername = 'user_' + nvId.toLowerCase();

        if (ident === nvId.toLowerCase() || ident === staffUsername || ident === phone || ident === email.toLowerCase()) {
          matchedStaff = { nvId, cnId, name, phone, email, roleStr, username: staffUsername };
          break;
        }
      }

      if (matchedStaff) {
        let expectedPass = (matchedStaff.roleStr === 'Thu ngân') ? 'tn123' : 'nv123';
        if (updatedPasswords.has(matchedStaff.username)) expectedPass = updatedPasswords.get(matchedStaff.username);
        else if (updatedPasswords.has(matchedStaff.nvId.toLowerCase())) expectedPass = updatedPasswords.get(matchedStaff.nvId.toLowerCase());
        else if (updatedPasswords.has(matchedStaff.phone)) expectedPass = updatedPasswords.get(matchedStaff.phone);
        else if (updatedPasswords.has(matchedStaff.email.toLowerCase())) expectedPass = updatedPasswords.get(matchedStaff.email.toLowerCase());

        if (pass === expectedPass) {
          const roleMap = {
            'Quản lý chi nhánh': 'BRANCH_MANAGER',
            'Thợ chính': 'STYLIST',
            'Thợ phụ': 'STYLIST',
            'Thu ngân': 'CASHIER'
          };
          const userRole = roleMap[matchedStaff.roleStr] || 'STAFF';
          const staffUser = {
            id: 'TK_' + matchedStaff.nvId,
            MaNhanVien: matchedStaff.nvId,
            username: matchedStaff.username,
            fullName: matchedStaff.name,
            role: userRole,
            roleName: matchedStaff.roleStr,
            branchId: matchedStaff.cnId,
            branchName: 'Chi Nhánh ' + matchedStaff.cnId,
            phone: matchedStaff.phone,
            email: matchedStaff.email
          };
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: true, message: 'Đăng nhập thành công!', user: staffUser, token: 'JWT_STAFF_' + Date.now() }));
        }
      }

      // 3. Tìm trong Khách Hàng (Seeded + Dynamic INSERTs)
      const khRegex = /\('(KH\d+)',\s*N'((?:''|[^'])*)',\s*'([^']*)',\s*'([^']*)'(?:,\s*'([^']*)')?\)/g;
      let matchedKh = null;
      let kMatch;
      while ((kMatch = khRegex.exec(sql)) !== null) {
        const khId = kMatch[1];
        const name = kMatch[2].replace(/''/g, "'");
        const phone = kMatch[3];
        const email = kMatch[4];
        const khUsername = 'user_' + khId.toLowerCase();

        if (ident === khId.toLowerCase() || ident === khUsername || ident === phone || ident === email.toLowerCase()) {
          matchedKh = { khId, name, phone, email, username: khUsername };
        }
      }

      if (matchedKh) {
        let expectedPass = 'kh123';
        const tkRegex = new RegExp(`INSERT INTO TaiKhoan[^(]*\\([^)]*\\)\\s*VALUES\\s*\\('[^']*',\\s*NULL,\\s*'${matchedKh.khId}',\\s*'([^']*)',\\s*'([^']*)'`, 'i');
        const tkMatch = sql.match(tkRegex);
        if (tkMatch) {
          expectedPass = tkMatch[2];
        }

        if (updatedPasswords.has(matchedKh.username)) expectedPass = updatedPasswords.get(matchedKh.username);
        else if (updatedPasswords.has(matchedKh.khId.toLowerCase())) expectedPass = updatedPasswords.get(matchedKh.khId.toLowerCase());
        else if (updatedPasswords.has(matchedKh.phone)) expectedPass = updatedPasswords.get(matchedKh.phone);
        else if (updatedPasswords.has(matchedKh.email.toLowerCase())) expectedPass = updatedPasswords.get(matchedKh.email.toLowerCase());

        if (pass === expectedPass) {
          const khUser = {
            id: 'TK_' + matchedKh.khId,
            MaKhachHang: matchedKh.khId,
            username: matchedKh.username,
            fullName: matchedKh.name,
            role: 'CUSTOMER',
            roleName: 'Khách Hàng Thành Viên',
            phone: matchedKh.phone,
            email: matchedKh.email
          };
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: true, message: 'Đăng nhập thành công!', user: khUser, token: 'JWT_CUSTOMER_' + Date.now() }));
        }
      }

      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: 'Sai thông tin đăng nhập hoặc mật khẩu.' }));
    }

    if (pathname === '/api/database' && method === 'GET') {
      const db = getSqlDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(db));
    }

    if (pathname === '/api/categories' && method === 'GET') {
      const db = getSqlDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(db.categories || []));
    }

    if (pathname === '/api/products' && method === 'GET') {
      const db = getSqlDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(db.products || []));
    }

    if (pathname === '/api/services' && method === 'GET') {
      const db = getSqlDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(db.services || []));
    }

    if (pathname === '/api/stylists' && method === 'GET') {
      const db = getSqlDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(db.stylists || []));
    }

    // --- THÊM MỚI NHÂN VIÊN / THỢ (THỢ CHÍNH, THỢ PHỤ) LƯU VÀO SQL DATABASE ---
    if (pathname === '/api/stylists' && method === 'POST') {
      const st = parsedBody || {};
      const db = getSqlDatabase();
      let nextId = st.id || st.MaNhanVien;
      if (!nextId) {
        let maxNum = 60;
        (db.stylists || []).forEach(s => {
          const numMatch = (s.id || s.MaNhanVien || '').match(/^NV(\d+)$/i);
          if (numMatch) {
            const n = parseInt(numMatch[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        nextId = 'NV' + String(maxNum + 1).padStart(2, '0');
      }

      const branchId = st.branchId || st.MaChiNhanh || 'CN01';
      const name = (st.name || st.HoTen || 'Thợ Mới').trim().replace(/'/g, "''");
      const phone = (st.phone || st.SoDienThoai || '0912000000').trim().replace(/'/g, "''");
      const email = (st.email || `${nextId.toLowerCase()}@salontoc.vn`).trim().replace(/'/g, "''");
      const role = (st.role || st.ChucVu || 'Thợ chính').trim().replace(/'/g, "''");
      const level = (st.level || st.CapBac || (role === 'Thợ phụ' ? 'Junior Barber' : 'Master Barber')).trim().replace(/'/g, "''");
      const specialty = (st.specialty || (role === 'Thợ phụ' ? 'Gội đầu dưỡng sinh, Ép side & Chăm sóc tóc' : 'Tạo kiểu tóc chuyên nghiệp, Fade & Uốn')).trim();
      const avatar = st.avatar || (role === 'Thợ phụ' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');

      const sqlInsert = `\r\n-- [SQL THOI GIAN THUC] THEM NHAN VIEN: ${nextId} (${role})\r\n` +
        `INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, CapBac, ChucVu, TrangThai) VALUES\r\n` +
        `('${nextId}', '${branchId}', N'${name}', '${phone}', '${email}', N'${level}', N'${role}', N'Đang làm việc');\r\n`;

      fs.appendFileSync(SQL_FILE, sqlInsert, 'utf8');
      console.log(`  -> [SQL EXEC] INSERT INTO NhanVien VALUES ('${nextId}', '${branchId}', '${name}', '${role}')`);

      const returnStylist = {
        id: nextId,
        MaNhanVien: nextId,
        branchId: branchId,
        MaChiNhanh: branchId,
        name: name,
        HoTen: name,
        level: level,
        title: `${level} • ${role}`,
        role: role,
        phone: phone,
        email: email,
        avatar: avatar,
        rating: 4.95,
        reviewCount: 0,
        specialty: specialty,
        isAvailable: true
      };

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, stylist: returnStylist, sqlExecuted: sqlInsert.trim() }));
    }

    // --- CẬP NHẬT NHÂN VIÊN TRONG SQL DATABASE ---
    if (pathname.startsWith('/api/stylists/') && method === 'PUT') {
      const id = pathname.replace('/api/stylists/', '').trim();
      const st = parsedBody || {};
      const branchId = st.branchId || st.MaChiNhanh || 'CN01';
      const name = (st.name || st.HoTen || '').trim().replace(/'/g, "''");
      const phone = (st.phone || st.SoDienThoai || '').trim().replace(/'/g, "''");
      const email = (st.email || '').trim().replace(/'/g, "''");
      const role = (st.role || st.ChucVu || 'Thợ chính').trim().replace(/'/g, "''");
      const level = (st.level || st.CapBac || 'Master Barber').trim().replace(/'/g, "''");

      const sqlUpdate = `\r\n-- [SQL THOI GIAN THUC] CAP NHAT NHAN VIEN: ${id}\r\n` +
        `UPDATE NhanVien SET HoTen = N'${name}', MaChiNhanh = '${branchId}', SoDienThoai = '${phone}', Email = '${email}', CapBac = N'${level}', ChucVu = N'${role}' WHERE MaNhanVien = '${id}';\r\n`;

      fs.appendFileSync(SQL_FILE, sqlUpdate, 'utf8');
      console.log(`  -> [SQL EXEC] UPDATE NhanVien WHERE MaNhanVien = '${id}'`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, id, sqlExecuted: sqlUpdate.trim() }));
    }

    // --- XÓA NHÂN VIÊN KHỎI SQL DATABASE ---
    if (pathname.startsWith('/api/stylists/') && method === 'DELETE') {
      const id = pathname.replace('/api/stylists/', '').trim();
      const sqlDelete = `\r\n-- [SQL THOI GIAN THUC] XOA NHAN VIEN: ${id}\r\n` +
        `DELETE FROM NhanVien WHERE MaNhanVien = '${id}';\r\n`;

      fs.appendFileSync(SQL_FILE, sqlDelete, 'utf8');
      console.log(`  -> [SQL EXEC] DELETE FROM NhanVien WHERE MaNhanVien = '${id}'`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, message: 'Đã xóa nhân viên khỏi SQL database', id }));
    }

    // --- THÊM DỊCH VỤ VÀO SQL DATABASE ---
    if (pathname === '/api/services' && method === 'POST') {
      const srv = parsedBody || {};
      const db = getSqlDatabase();
      let nextId = srv.id || srv.MaDichVu;
      if (!nextId) {
        let maxNum = 5;
        (db.services || []).forEach(s => {
          const numMatch = (s.id || '').match(/^DV(\d+)$/i);
          if (numMatch) {
            const n = parseInt(numMatch[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        nextId = 'DV' + String(maxNum + 1).padStart(2, '0');
      }

      const name = (srv.name || srv.TenDichVu || 'Dịch vụ mới').trim().replace(/'/g, "''");
      const desc = (srv.description || srv.MoTa || 'Dịch vụ tiêu chuẩn OmniSalon').trim().replace(/'/g, "''");
      const duration = parseInt(srv.duration || srv.ThoiLuong || 45, 10);
      const price = parseFloat(srv.price || srv.Gia || 150000);
      const today = new Date().toISOString().split('T')[0];

      const sqlInsert = `\r\n-- [SQL THOI GIAN THUC] THEM DICH VU MOI: ${nextId}\r\n` +
        `INSERT INTO DichVu (MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, TrangThai, NgayApDung) VALUES\r\n` +
        `('${nextId}', N'${name}', N'${desc}', ${duration}, ${price}, N'Kinh doanh', '${today}');\r\n`;

      fs.appendFileSync(SQL_FILE, sqlInsert, 'utf8');
      console.log(`  -> [SQL EXEC] INSERT INTO DichVu VALUES ('${nextId}', '${name}', ${price} d)`);

      const returnService = {
        id: nextId,
        MaDichVu: nextId,
        name: name,
        TenDichVu: name,
        price: price,
        Gia: price,
        duration: `${duration} phút`,
        durationMinutes: duration,
        ThoiLuong: duration,
        description: desc,
        MoTa: desc,
        image: srv.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        category: srv.category || 'Cắt & Tạo Kiểu',
        rating: 5.0,
        reviewCount: 1
      };

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, service: returnService, sqlExecuted: sqlInsert.trim() }));
    }

    // --- XÓA DỊCH VỤ KHỎI SQL DATABASE ---
    if (pathname.startsWith('/api/services/') && method === 'DELETE') {
      const id = pathname.replace('/api/services/', '').trim();
      const sqlDelete = `\r\n-- [SQL THOI GIAN THUC] XOA DICH VU: ${id}\r\n` +
        `DELETE FROM DichVu WHERE MaDichVu = '${id}';\r\n`;

      fs.appendFileSync(SQL_FILE, sqlDelete, 'utf8');
      console.log(`  -> [SQL EXEC] DELETE FROM DichVu WHERE MaDichVu = '${id}'`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, message: 'Đã xóa dịch vụ khỏi SQL database', id }));
    }

    // --- THÊM SẢN PHẨM VÀO SQL DATABASE ---
    if (pathname === '/api/products' && method === 'POST') {
      const prod = parsedBody || {};
      const db = getSqlDatabase();
      let nextId = prod.id || prod.MaSanPham;
      if (!nextId) {
        let maxNum = 130;
        (db.products || []).forEach(p => {
          const numMatch = (p.id || '').match(/^SP(\d+)$/i);
          if (numMatch) {
            const n = parseInt(numMatch[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        nextId = 'SP' + String(maxNum + 1).padStart(2, '0');
      }

      const catId = prod.categoryId || prod.MaDanhMuc || 'DM01';
      const nccId = prod.supplierId || prod.MaNhaCungCap || 'NCC01';
      const name = (prod.name || prod.TenSanPham || 'Sản phẩm mới').trim().replace(/'/g, "''");
      const desc = (prod.description || prod.MoTa || 'Sản phẩm chăm sóc tóc').trim().replace(/'/g, "''");
      const img = (prod.image || prod.HinhAnh || 'Men_Grooming_Products/01_Sap_Vuot_Toc_Pomade/Hanz_de_Fuko/Hanz_de_Fuko_Claymation.jpg').trim().replace(/'/g, "''");
      const price = parseFloat(prod.price || prod.GiaBan || 250000);
      const cost = parseFloat(prod.costPrice || prod.GiaNhap || Math.round(price * 0.7));

      const sqlInsert = `\r\n-- [SQL THOI GIAN THUC] THEM SAN PHAM MOI: ${nextId}\r\n` +
        `INSERT INTO SanPham (MaSanPham, MaDanhMuc, MaNhaCungCap, TenSanPham, MoTa, HinhAnh, GiaNhap, GiaBan, TrangThaiKinhDoanh) VALUES\r\n` +
        `('${nextId}', '${catId}', '${nccId}', N'${name}', N'${desc}', N'${img}', ${cost}, ${price}, N'Đang bán');\r\n`;

      fs.appendFileSync(SQL_FILE, sqlInsert, 'utf8');
      console.log(`  -> [SQL EXEC] INSERT INTO SanPham VALUES ('${nextId}', '${name}', ${price} d)`);

      const returnProduct = {
        id: nextId,
        MaSanPham: nextId,
        name: name,
        TenSanPham: name,
        brand: prod.brand || 'CHÍNH HÃNG',
        categoryId: catId,
        price: price,
        originalPrice: price,
        stock: prod.stock || 25,
        image: img,
        description: desc
      };

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, product: returnProduct, sqlExecuted: sqlInsert.trim() }));
    }

    // --- XÓA SẢN PHẨM KHỎI SQL DATABASE ---
    if (pathname.startsWith('/api/products/') && method === 'DELETE') {
      const id = pathname.replace('/api/products/', '').trim();
      const sqlDelete = `\r\n-- [SQL THOI GIAN THUC] XOA SAN PHAM: ${id}\r\n` +
        `DELETE FROM SanPham WHERE MaSanPham = '${id}';\r\n`;

      fs.appendFileSync(SQL_FILE, sqlDelete, 'utf8');
      console.log(`  -> [SQL EXEC] DELETE FROM SanPham WHERE MaSanPham = '${id}'`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, message: 'Đã xóa sản phẩm khỏi SQL database', id }));
    }

    if (pathname === '/api/branches' && method === 'GET') {
      const db = getSqlDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(db.branches || []));
    }

    // --- THÊM CHI NHÁNH MỚI VÀO SQL DATABASE ---
    if (pathname === '/api/branches' && method === 'POST') {
      const b = parsedBody || {};
      const db = getSqlDatabase();
      let nextId = b.id || b.MaChiNhanh;
      if (!nextId) {
        let maxNum = 20;
        (db.branches || []).forEach(item => {
          const numMatch = (item.id || item.MaChiNhanh || '').match(/^CN(\d+)$/i);
          if (numMatch) {
            const n = parseInt(numMatch[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        nextId = 'CN' + String(maxNum + 1).padStart(2, '0');
      }

      const name = (b.name || b.TenChiNhanh || `Men Salon Barber Chi Nhánh ${nextId}`).trim().replace(/'/g, "''");
      const address = (b.address || b.DiaChi || 'TP. Hồ Chí Minh').trim().replace(/'/g, "''");
      const phone = (b.phone || b.SoDienThoai || '0901111000').trim().replace(/'/g, "''");
      const openTime = (b.openTime || b.GioMoCua || '08:30:00').trim();
      const closeTime = (b.closeTime || b.GioDongCua || '21:30:00').trim();
      const status = (b.status || b.TrangThai || 'Hoạt động').trim().replace(/'/g, "''");
      const city = address.includes('Hà Nội') ? 'Hà Nội' : address.includes('Đà Nẵng') ? 'Đà Nẵng' : 'TP. Hồ Chí Minh';

      const sqlInsert = `\r\n-- [SQL THOI GIAN THUC] THEM CHI NHANH MOI: ${nextId}\r\n` +
        `INSERT INTO ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, GioMoCua, GioDongCua, TrangThai) VALUES\r\n` +
        `('${nextId}', N'${name}', N'${address}', '${phone}', '${openTime}', '${closeTime}', N'${status}');\r\n`;

      fs.appendFileSync(SQL_FILE, sqlInsert, 'utf8');
      console.log(`  -> [SQL EXEC] INSERT INTO ChiNhanh VALUES ('${nextId}', '${name}', '${address}')`);

      const returnBranch = {
        id: nextId,
        MaChiNhanh: nextId,
        name: name,
        TenChiNhanh: name,
        address: address,
        DiaChi: address,
        phone: phone,
        SoDienThoai: phone,
        openHours: `${openTime.substring(0, 5)} - ${closeTime.substring(0, 5)}`,
        city: city,
        region: city === 'Hà Nội' ? 'hn' : city === 'Đà Nẵng' ? 'dn' : 'hcm',
        image: b.image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
        status: status
      };

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, branch: returnBranch, sqlExecuted: sqlInsert.trim() }));
    }

    // --- CẬP NHẬT CHI NHÁNH TRONG SQL DATABASE ---
    if (pathname.startsWith('/api/branches/') && method === 'PUT') {
      const id = pathname.replace('/api/branches/', '').trim();
      const b = parsedBody || {};
      const name = (b.name || b.TenChiNhanh || '').trim().replace(/'/g, "''");
      const address = (b.address || b.DiaChi || '').trim().replace(/'/g, "''");
      const phone = (b.phone || b.SoDienThoai || '').trim().replace(/'/g, "''");
      const openTime = (b.openTime || b.GioMoCua || '08:30:00').trim();
      const closeTime = (b.closeTime || b.GioDongCua || '21:30:00').trim();
      const status = (b.status || b.TrangThai || 'Hoạt động').trim().replace(/'/g, "''");

      const sqlUpdate = `\r\n-- [SQL THOI GIAN THUC] CAP NHAT CHI NHANH: ${id}\r\n` +
        `UPDATE ChiNhanh SET TenChiNhanh = N'${name}', DiaChi = N'${address}', SoDienThoai = '${phone}', GioMoCua = '${openTime}', GioDongCua = '${closeTime}', TrangThai = N'${status}' WHERE MaChiNhanh = '${id}';\r\n`;

      fs.appendFileSync(SQL_FILE, sqlUpdate, 'utf8');
      console.log(`  -> [SQL EXEC] UPDATE ChiNhanh WHERE MaChiNhanh = '${id}'`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, id, sqlExecuted: sqlUpdate.trim() }));
    }

    // --- XÓA CHI NHÁNH KHỎI SQL DATABASE ---
    if (pathname.startsWith('/api/branches/') && method === 'DELETE') {
      const id = pathname.replace('/api/branches/', '').trim();
      const sqlDelete = `\r\n-- [SQL THOI GIAN THUC] XOA CHI NHANH: ${id}\r\n` +
        `DELETE FROM ChiNhanh WHERE MaChiNhanh = '${id}';\r\n`;

      fs.appendFileSync(SQL_FILE, sqlDelete, 'utf8');
      console.log(`  -> [SQL EXEC] DELETE FROM ChiNhanh WHERE MaChiNhanh = '${id}'`);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, message: 'Đã xóa chi nhánh khỏi SQL database', id }));
    }

    if (pathname === '/api/bookings' && method === 'GET') {
      const db = getSqlDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(db.bookings || []));
    }

    if (pathname === '/api/bookings' && method === 'POST') {
      const booking = parsedBody || {};
      const id = booking.id || booking.bookingCode || ('LH' + Date.now());
      const khId = booking.customerId || 'KH01';
      const nvId = booking.stylistId || 'NV02';
      const cnId = booking.branchId || 'CN01';
      const date = booking.date || booking.bookingDate || new Date().toISOString().split('T')[0];
      const time = booking.timeSlot ? (booking.timeSlot.includes(':') ? (booking.timeSlot.length === 5 ? `${booking.timeSlot}:00` : booking.timeSlot) : `${booking.timeSlot}:00`) : '09:00:00';
      const price = booking.totalPrice || 120000;

      const custName = (booking.customerName || 'Khách Hàng').trim();
      const custPhone = (booking.customerPhone || '0988123456').trim();
      const srvName = (booking.serviceName || 'Dịch Vụ Cắt Tóc').trim();
      const extraNotes = (booking.notes || '').trim();

      const noteText = `Khách: ${custName} | SĐT: ${custPhone} | DV: ${srvName}${extraNotes ? ' | Ghi chú: ' + extraNotes : ''}`.replace(/'/g, "''");

      const sqlInsert = `\r\n-- [SQL THOI GIAN THUC] DAT LICH HEN MOI: ${id}\r\n` +
        `INSERT INTO LichHen (MaLichHen, MaKhachHang, MaNhanVien, MaChiNhanh, NgayHen, GioBatDau, GioKetThuc, TrangThai, TongTien, TienCoc, GhiChu, LyDoHuy) VALUES\r\n` +
        `('${id}', '${khId}', '${nvId}', '${cnId}', '${date}', '${time}', '${time}', N'Đã xác nhận', ${price}, 0, N'${noteText}', NULL);\r\n`;

      fs.appendFileSync(SQL_FILE, sqlInsert, 'utf8');
      console.log(`  -> [SQL EXEC] INSERT INTO LichHen VALUES ('${id}', '${custName}', '${date} ${time}', ${price} d)`);

      const returnBooking = {
        id,
        MaLichHen: id,
        bookingCode: id,
        customerId: khId,
        customerName: custName,
        customerPhone: custPhone,
        stylistId: nvId,
        stylistName: booking.stylistName || 'Master Stylist',
        branchId: cnId,
        branchName: booking.branchName || 'Omni Salon Chi Nhánh',
        date,
        bookingDate: date,
        timeSlot: booking.timeSlot || time.substring(0, 5),
        serviceId: booking.serviceId || 'DV01',
        serviceName: srvName,
        totalPrice: price,
        status: 'Confirmed',
        notes: noteText
      };

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, booking: returnBooking, sqlExecuted: sqlInsert.trim() }));
    }

    if (pathname.startsWith('/api/bookings/') && (method === 'DELETE' || method === 'PUT')) {
      const id = pathname.replace('/api/bookings/', '').trim();
      const body = parsedBody || {};
      let sqlUpdate = '';

      if (method === 'DELETE' || body.status === 'Cancelled' || body.status === 'Đã hủy') {
        const reason = (body.cancellationReason || body.reason || 'Khách hủy lịch').replace(/'/g, "''");
        sqlUpdate = `\r\n-- [SQL THOI GIAN THUC] HUY LICH HEN: ${id}\r\n` +
          `UPDATE LichHen SET TrangThai = N'Đã hủy', LyDoHuy = N'${reason}' WHERE MaLichHen = '${id}';\r\n`;
        console.log(`  -> [SQL EXEC] UPDATE LichHen SET TrangThai = N'Đã hủy' WHERE MaLichHen = '${id}'`);
      } else if (body.date || body.timeSlot) {
        const newDate = body.date || body.bookingDate || new Date().toISOString().split('T')[0];
        const newTime = body.timeSlot ? (body.timeSlot.length === 5 ? `${body.timeSlot}:00` : body.timeSlot) : '09:00:00';
        sqlUpdate = `\r\n-- [SQL THOI GIAN THUC] DOI LICH HEN: ${id}\r\n` +
          `UPDATE LichHen SET NgayHen = '${newDate}', GioBatDau = '${newTime}', GioKetThuc = '${newTime}', TrangThai = N'Đã xác nhận' WHERE MaLichHen = '${id}';\r\n`;
        console.log(`  -> [SQL EXEC] UPDATE LichHen SET NgayHen = '${newDate}', GioBatDau = '${newTime}' WHERE MaLichHen = '${id}'`);
      } else if (body.status === 'Completed' || body.status === 'Hoàn thành') {
        sqlUpdate = `\r\n-- [SQL THOI GIAN THUC] HOAN THANH LICH HEN: ${id}\r\n` +
          `UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = '${id}';\r\n`;
        console.log(`  -> [SQL EXEC] UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = '${id}'`);
      } else {
        sqlUpdate = `\r\n-- [SQL THOI GIAN THUC] CAP NHAT LICH HEN: ${id}\r\n` +
          `UPDATE LichHen SET TrangThai = N'${body.status || 'Đã xác nhận'}' WHERE MaLichHen = '${id}';\r\n`;
      }

      if (sqlUpdate) {
        fs.appendFileSync(SQL_FILE, sqlUpdate, 'utf8');
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, message: 'Đã cập nhật trạng thái trong SQL', id }));
    }

    if (pathname === '/api/orders' && method === 'GET') {
      const db = getSqlDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(db.orders || []));
    }

    if (pathname === '/api/orders' && method === 'POST') {
      const order = parsedBody || {};
      const id = order.id || ('DH' + Date.now());
      const khId = order.customerId || 'KH03';
      const cnId = order.branchId || 'CN01';
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const total = order.totalAmount || 500000;
      const addr = (order.shippingAddress || 'Giao tận nơi').replace(/'/g, "''");
      const methodStr = (order.receiveMethod || 'Giao tận nơi').replace(/'/g, "''");
      const notes = (order.notes || 'Đơn hàng online').replace(/'/g, "''");

      const sqlInsert = `\r\n-- [SQL THOI GIAN THUC] TAO DON HANG MOI: ${id}\r\n` +
        `INSERT INTO DonHang (MaDonHang, MaKhachHang, MaChiNhanh, NgayDat, TongTien, DiaChiGiaoHang, HinhThucNhan, TrangThai, GhiChu) VALUES\r\n` +
        `('${id}', '${khId}', '${cnId}', '${now}', ${total}, N'${addr}', N'${methodStr}', N'Đang xử lý', N'${notes}');\r\n`;

      fs.appendFileSync(SQL_FILE, sqlInsert, 'utf8');
      console.log(`  -> [SQL EXEC] INSERT INTO DonHang VALUES ('${id}', ${total} d)`);

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, order, sqlExecuted: sqlInsert.trim() }));
    }

    // --- STATIC FILES (web/index.html fallback) ---
    let filePath = (pathname === '/' || pathname === '/index.html') ? 'web/index.html' : pathname.replace(/^\//, '');
    if (filePath.startsWith('web/Men_Grooming_Products/')) {
      filePath = filePath.replace('web/', '');
    }
    let fullPath = path.join(__dirname, filePath);

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      const idx = path.join(fullPath, 'index.html');
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) {
        fullPath = idx;
      }
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      const webCandidate = path.join(__dirname, 'web', filePath);
      if (fs.existsSync(webCandidate)) {
        if (fs.statSync(webCandidate).isDirectory()) {
          const webIdx = path.join(webCandidate, 'index.html');
          if (fs.existsSync(webIdx) && fs.statSync(webIdx).isFile()) {
            fullPath = webIdx;
          }
        } else if (fs.statSync(webCandidate).isFile()) {
          fullPath = webCandidate;
        }
      }
    }

    fs.stat(fullPath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ error: 'File Not Found' }));
      }
      const ext = path.extname(fullPath).toLowerCase();
      const mime = MIME_MAP[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(fullPath).pipe(res);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================================================`);
  console.log(`  OMNISALON DIRECT SQL DATABASE & REST API SERVER DANG HOAT DONG`);
  console.log(`  - Local:    http://localhost:${PORT}`);
  console.log(`  - Database: ${SQL_FILE} (100% Truy van truc tiep tu SQL)`);
  console.log(`  - Sync:     Web PC + Web Mobile + Flutter Mobile App`);
  console.log(`=========================================================================`);
});
