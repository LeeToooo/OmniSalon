// Các hàm phụ trợ định dạng dữ liệu
const { querySql } = require('../database/db');
const { checkAndAutoCancelOnRequest } = require('./auto_cancel_service');

/**
 * Lấy chuỗi ngày YYYY-MM-DD theo giờ local (tránh lệch ngày UTC trước 07:00 sáng VN).
 */
function getLocalIsoDate(offsetDays = 0) {
  const d = new Date(Date.now() + Number(offsetDays || 0) * 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const catIcons = {
  DM01: 'haircut', DM02: 'styling', DM03: 'haircare', DM04: 'shampoo', DM05: 'soap',
  DM06: 'treatment', DM07: 'chemical', DM08: 'beard', DM09: 'tools'
};

const BRANCH_NAME_MAP = {
  CN01: 'Omni Salon Barber Q1 - Bến Thành',
  CN02: 'Omni Salon Barber Tân Bình - Cộng Hòa',
  CN03: 'Omni Salon Barber Bình Thạnh - Điện Biên Phủ',
  CN04: 'Omni Salon Barber Q3 - Nam Kỳ Khởi Nghĩa',
  CN05: 'Omni Salon Barber Q5 - Trần Hưng Đạo',
  CN06: 'Omni Salon Barber Q7 - Nguyễn Thị Thập',
  CN07: 'Omni Salon Barber Q10 - 3 Tháng 2',
  CN08: 'Omni Salon Barber Phú Nhuận - Phan Xích Long',
  CN09: 'Omni Salon Barber Gò Vấp - Quang Trung',
  CN10: 'Omni Salon Barber Thủ Đức - Võ Văn Ngân',
  CN11: 'Omni Salon Barber Thảo Điền - Xuân Thủy',
  CN12: 'Omni Salon Barber Q4 - Hoàng Diệu',
  CN13: 'Omni Salon Barber Q6 - Hậu Giang',
  CN14: 'Omni Salon Barber Q8 - Phạm Hùng',
  CN15: 'Omni Salon Barber Q11 - Ông Ích Khiêm',
  CN16: 'Omni Salon Barber Q12 - Lê Văn Khương',
  CN17: 'Omni Salon Barber Tân Phú - Lũy Bán Bích',
  CN18: 'Omni Salon Barber Bình Tân - Tên Lửa',
  CN19: 'Omni Salon Barber Bình Chánh - Quốc Lộ 50',
  CN20: 'Omni Salon Barber Hóc Môn - Lý Thường Kiệt'
};

const ROLE_NAME_MAP = {
  SUPER_ADMIN: 'Quản trị viên',
  BRANCH_MANAGER: 'Quản lý chi nhánh',
  CASHIER: 'Thu ngân POS',
  BARBER: 'Thợ / Barber',
  CUSTOMER: 'Khách hàng'
};

const ROLE_SQL_MAP = {
  SUPER_ADMIN: 'Quản trị viên',
  ADMIN: 'Quản trị viên',
  BRANCH_MANAGER: 'Quản lý',
  CASHIER: 'Thu ngân',
  BARBER: 'Nhân viên',
  STYLIST: 'Nhân viên',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng'
};

/**
 * Phân giải chuẩn vai trò người dùng hệ thống từ nhiều nguồn dữ liệu (SQL, Session, Token)
 * Thứ tự ưu tiên phòng thủ: SUPER_ADMIN -> BRANCH_MANAGER -> CASHIER -> BARBER -> CUSTOMER
 */
function resolveUserRole(u) {
  if (!u) return 'CUSTOMER';
  const role = (u.role || '').toString().trim().toUpperCase();
  const rawRole = (u.VaiTro || u.vaiTro || u.vaiTroSql || '').toString().trim().toUpperCase();
  const chucVu = (u.ChucVu || u.chucVu || u.chucVuSql || '').toString().trim().toUpperCase();
  const username = (u.TenDangNhap || u.username || '').toString().trim().toUpperCase();
  const maNV = (u.MaNhanVien || u.staffId || '').toString().trim().toUpperCase();
  const maTK = (u.MaTaiKhoan || u.id || '').toString().trim().toUpperCase();

  // 1. Quản trị viên (SUPER_ADMIN)
  if (
    role === 'SUPER_ADMIN' || role === 'ADMIN' ||
    rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' ||
    rawRole.includes('QUẢN TRỊ') || rawRole.includes('QUAN TRI') || rawRole.includes('TỐI CAO') || rawRole.includes('TOI CAO') ||
    chucVu.includes('QUẢN TRỊ') || chucVu.includes('QUAN TRI') ||
    username === 'ADMIN' || maNV === 'NV00' || maTK === 'TK_ADMIN'
  ) {
    return 'SUPER_ADMIN';
  }

  // 2. Khách hàng: Nếu vai trò hoặc chức vụ được chỉ định là Khách hàng thì ưu tiên nhận diện là CUSTOMER
  if (
    (role === 'CUSTOMER' || rawRole === 'KHÁCH HÀNG' || rawRole === 'KHACH HANG' || rawRole === 'CUSTOMER' || chucVu === 'KHÁCH HÀNG' || chucVu === 'KHACH HANG') &&
    username !== 'ADMIN' && maNV !== 'NV00' && maTK !== 'TK_ADMIN'
  ) {
    return 'CUSTOMER';
  }

  // 3. Quản lý chi nhánh (BRANCH_MANAGER)
  if (
    role === 'BRANCH_MANAGER' ||
    rawRole === 'BRANCH_MANAGER' ||
    rawRole.includes('QUẢN LÝ') || rawRole.includes('QUAN LY') ||
    chucVu.includes('QUẢN LÝ') || chucVu.includes('QUAN LY') || chucVu.includes('BRANCH_MANAGER')
  ) {
    return 'BRANCH_MANAGER';
  }

  // 4. Thu ngân POS (CASHIER)
  if (
    role === 'CASHIER' ||
    rawRole === 'CASHIER' ||
    rawRole.includes('THU NGÂN') || rawRole.includes('THU NGAN') ||
    chucVu.includes('THU NGÂN') || chucVu.includes('THU NGAN') || chucVu.includes('TIẾP TÂN') || chucVu.includes('TIEP TAN') || chucVu.includes('CASHIER')
  ) {
    return 'CASHIER';
  }

  // 5. Thợ / Barber / Stylist / Kỹ thuật viên (BARBER)
  if (
    role === 'BARBER' || role === 'STYLIST' || role === 'STAFF' ||
    rawRole === 'BARBER' || rawRole === 'STYLIST' || rawRole === 'STAFF' ||
    rawRole.includes('THỢ') || rawRole.includes('THO') || rawRole.includes('BARBER') || rawRole.includes('STYLIST') ||
    rawRole.includes('NHÂN VIÊN') || rawRole.includes('NHAN VIEN') ||
    chucVu.includes('THỢ') || chucVu.includes('THO') || chucVu.includes('BARBER') || chucVu.includes('STYLIST') ||
    chucVu.includes('KỸ THUẬT') || chucVu.includes('KY THUAT') ||
    chucVu.includes('NHÂN VIÊN') || chucVu.includes('NHAN VIEN') ||
    Boolean(maNV) ||
    maTK.startsWith('TK_NV')
  ) {
    return 'BARBER';
  }

  // 6. Khách hàng mặc định (CUSTOMER)
  return 'CUSTOMER';
}

/**
 * Chuẩn hóa tên chi nhánh từ mã chi nhánh và dữ liệu SQL
 */
function resolveBranchName(branchCode, branchName, role = 'CUSTOMER') {
  const bCode = (branchCode || '').toString().trim().toUpperCase();
  if (branchName && typeof branchName === 'string' && branchName.trim()) {
    return branchName.trim();
  }
  if (bCode && BRANCH_NAME_MAP[bCode]) {
    return BRANCH_NAME_MAP[bCode];
  }
  if (bCode) {
    return 'Omni Salon Barber ' + bCode;
  }
  return role === 'CUSTOMER' ? 'Khách Hàng' : 'Toàn Bộ Hệ Thống Salon';
}

const brandPrefixes = [
  'DoMedia', 'Hanz de Fuko', 'Apestomen', 'Blumaan', 'Kevin Murphy', 'Reuzel',
  'Davines', 'By Vilain', 'Uppercut Deluxe',
  'L’Oréal Professionnel', 'Schwarzkopf Professional', 'Morris Motley',
  'Slick Gorilla', 'Dapper Dan', 'Suavecito', 'Proraso', 'Kerasys Homme'
];

function detectBrand(productName) {
  if (!productName || typeof productName !== 'string') return 'Omni Professional';
  const cleanName = productName.trim();
  for (const prefix of brandPrefixes) {
    if (cleanName.toLowerCase().startsWith(prefix.toLowerCase()) || cleanName.toLowerCase().includes(prefix.toLowerCase())) {
      return prefix;
    }
  }
  return 'Omni Professional';
}

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

  try {
    await querySql(
      'INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh) VALUES (?, ?, ?, ?, NULL)',
      [newKhId, fullName, cleanPhone || null, customerEmail || null]
    );
    const newTkId = 'TK_' + newKhId;
    await querySql(
      `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao)
       VALUES (?, NULL, ?, ?, 'kh123', N'Khách hàng', N'Hoạt động', GETDATE())`,
      [newTkId, newKhId, cleanPhone || newKhId]
    );
  } catch (err) {
    console.warn('[HelperService] Auto-create guest account skipped:', err.message);
  }

  return newKhId;
}

async function resolveStaffMember(staffId, branchId) {
  if (staffId) {
    let cleanId = String(staffId).trim();
    if (cleanId.startsWith('TK_NV')) cleanId = cleanId.replace('TK_', '');
    if (cleanId.startsWith('NV')) {
      const found = await querySql('SELECT MaNhanVien FROM NhanVien WHERE MaNhanVien = ?', [cleanId]);
      if (found && found.length > 0) return found[0].MaNhanVien;
    }
  }

  if (branchId) {
    const branchStaff = await querySql("SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaChiNhanh = ? AND TrangThai = N'Đang làm việc' ORDER BY MaNhanVien ASC", [branchId]);
    if (branchStaff && branchStaff.length > 0) return branchStaff[0].MaNhanVien;
  }

  const anyStaff = await querySql("SELECT TOP 1 MaNhanVien FROM NhanVien ORDER BY MaNhanVien ASC");
  return anyStaff && anyStaff.length > 0 ? anyStaff[0].MaNhanVien : 'NV01';
}

async function generateNextBookingId() {
  const rows = await querySql("SELECT MaLichHen FROM LichHen WHERE MaLichHen LIKE 'LH%'");
  let maxNum = 10;
  if (rows && rows.length > 0) {
    for (const r of rows) {
      const m = (r.MaLichHen || '').match(/LH0*(\d+)/i);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
  }
  let nextNum = maxNum;
  while (true) {
    nextNum++;
    const candidate = 'LH' + (nextNum < 10 ? '0' + nextNum : nextNum);
    const exists = await querySql("SELECT TOP 1 MaLichHen FROM LichHen WHERE MaLichHen = ?", [candidate]);
    if (!exists || exists.length === 0) {
      return candidate;
    }
  }
}

async function generateNextCtlhId() {
  const rows = await querySql("SELECT MaChiTietLichHen FROM ChiTietLichHen WHERE MaChiTietLichHen LIKE 'CTLH%'");
  let maxNum = 10;
  if (rows && rows.length > 0) {
    for (const r of rows) {
      const m = (r.MaChiTietLichHen || '').match(/CTLH0*(\d+)/i);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
  }
  let nextNum = maxNum;
  while (true) {
    nextNum++;
    const candidate = 'CTLH' + (nextNum < 10 ? '0' + nextNum : nextNum);
    const exists = await querySql("SELECT TOP 1 MaChiTietLichHen FROM ChiTietLichHen WHERE MaChiTietLichHen = ?", [candidate]);
    if (!exists || exists.length === 0) {
      return candidate;
    }
  }
}

async function generateNextOrderId() {
  const rows = await querySql("SELECT MaDonHang FROM DonHang WHERE MaDonHang LIKE 'DH%'");
  let maxNum = 10;
  if (rows && rows.length > 0) {
    for (const r of rows) {
      const m = (r.MaDonHang || '').match(/^DH0*(\d+)$/i);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
  }
  let nextNum = maxNum;
  while (true) {
    nextNum++;
    const candidate = 'DH' + (nextNum < 10 ? '0' + nextNum : nextNum);
    const exists = await querySql("SELECT TOP 1 MaDonHang FROM DonHang WHERE MaDonHang = ?", [candidate]);
    if (!exists || exists.length === 0) {
      return candidate;
    }
  }
}

async function generateNextCtdhId() {
  const rows = await querySql("SELECT MaChiTietDonHang FROM ChiTietDonHang WHERE MaChiTietDonHang LIKE 'CTDH%'");
  let maxNum = 10;
  if (rows && rows.length > 0) {
    for (const r of rows) {
      const m = (r.MaChiTietDonHang || '').match(/CTDH0*(\d+)/i);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
  }
  let nextNum = maxNum;
  while (true) {
    nextNum++;
    const candidate = 'CTDH' + (nextNum < 10 ? '0' + nextNum : nextNum);
    const exists = await querySql("SELECT TOP 1 MaChiTietDonHang FROM ChiTietDonHang WHERE MaChiTietDonHang = ?", [candidate]);
    if (!exists || exists.length === 0) {
      return candidate;
    }
  }
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

async function getFullSqlDatabase() {
  try {
    await checkAndAutoCancelOnRequest();
  } catch (err) {
    console.warn('[HelperService] Auto-cancel check skipped:', err.message);
  }
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
    thongBaoRows,
    caLamViecRows,
    kmDichVuRows,
    kmSanPhamRows,
    chiTietComboRows,
    discountRuleRows,
    receiptRows,
    invoiceRows,
    paymentRows,
    fefoLotRows,
    lowStockRows,
    inventoryRows,
    chiTietDonHangRows,
    chiTietHoaDonDichVuRows,
    chiTietHoaDonSanPhamRows,
    chiTietLichHenRows
  ] = await Promise.all([
    querySql(`SELECT MaChiNhanh, TenChiNhanh, DiaChi, SoDienThoai, 
                     CONVERT(VARCHAR(8), GioMoCua) AS GioMoCua, 
                     CONVERT(VARCHAR(8), GioDongCua) AS GioDongCua, 
                     HinhAnh, TrangThai FROM ChiNhanh`),
    querySql(`SELECT ROW_NUMBER() OVER (ORDER BY LEN(MaDichVu) ASC, MaDichVu ASC) AS stt, MaDichVu AS real_id, MaDichVu, TenDichVu, MoTa, ThoiLuong, Gia, HinhAnh, TrangThai, 
                     CONVERT(VARCHAR(10), NgayApDung, 120) AS NgayApDung FROM DichVu`),
    querySql(`SELECT ROW_NUMBER() OVER (ORDER BY LEN(MaCombo) ASC, MaCombo ASC) AS stt, MaCombo AS real_id, MaCombo, TenCombo, MoTa, GiaCombo, ThoiLuong, HinhAnh, TrangThai FROM ComboDichVu`),
    querySql(`SELECT nv.MaNhanVien, nv.MaChiNhanh, nv.HoTen, nv.SoDienThoai, nv.Email, 
                     nv.CapBac, nv.ChucVu, nv.TrangThai, cn.TenChiNhanh 
              FROM NhanVien nv 
              LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh 
              WHERE nv.TrangThai = N'Đang làm việc'
                AND nv.MaNhanVien <> 'NV00'
                AND nv.ChucVu NOT LIKE N'%Quản trị%'
                AND nv.ChucVu NOT LIKE N'%Chủ tịch%'
                AND (nv.ChucVu LIKE N'%Quản lý%' OR nv.ChucVu LIKE N'%Thợ chính%' OR nv.ChucVu LIKE N'%Thợ phụ%' OR nv.ChucVu LIKE N'%Thu ngân%')`),
    querySql(`SELECT MaDanhMuc, TenDanhMuc, MoTa, TrangThai FROM DanhMucSanPham`),
    querySql(`SELECT MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, DiaChi, TrangThai FROM NhaCungCap`),
    querySql(`SELECT sp.MaSanPham, sp.MaDanhMuc, sp.MaNhaCungCap, sp.TenSanPham, sp.MoTa, 
                     sp.HinhAnh, sp.GiaNhap, sp.GiaBan, sp.TrangThaiKinhDoanh,
                     dm.TenDanhMuc,
                     ISNULL((SELECT SUM(tk.SoLuongTon) FROM TonKho tk WHERE tk.MaSanPham = sp.MaSanPham), 0) AS SoLuongTon,
                      ISNULL((SELECT SUM(ctdh.SoLuong) FROM ChiTietDonHang ctdh WHERE ctdh.MaSanPham = sp.MaSanPham), 0) + ISNULL((SELECT SUM(cthd.SoLuong) FROM ChiTietHoaDon_SanPham cthd WHERE cthd.MaSanPham = sp.MaSanPham), 0) AS SoLuongDaBan,
                     CONVERT(VARCHAR(10), ctpn.HanSuDung, 120) AS HanSuDung,
                     ctpn.SoLuongConLai,
                     ctpn.SoLo,
                     ctpn.MaChiTietPhieuNhap,
                     ctpn.SoNgayConLai
              FROM SanPham sp
              LEFT JOIN DanhMucSanPham dm ON sp.MaDanhMuc = dm.MaDanhMuc
              OUTER APPLY (
                  SELECT TOP 1 HanSuDung, SoLuongConLai, SoLo, MaChiTietPhieuNhap,
                         DATEDIFF(DAY, CAST(GETDATE() AS DATE), HanSuDung) AS SoNgayConLai
                  FROM ChiTietPhieuNhap 
                  WHERE MaSanPham = sp.MaSanPham AND SoLuongConLai > 0
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
                       SELECT TOP 1 ISNULL(dv.TenDichVu, cb.TenCombo) 
                       FROM ChiTietLichHen ctlh 
                       LEFT JOIN DichVu dv ON ctlh.MaDichVu = dv.MaDichVu 
                       LEFT JOIN ComboDichVu cb ON ctlh.MaCombo = cb.MaCombo
                       WHERE ctlh.MaLichHen = lh.MaLichHen
                     ) AS TenDichVu,
                     (
                       SELECT TOP 1 ISNULL(ctlh.MaDichVu, ctlh.MaCombo) 
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
                     cn.TenChiNhanh,
                     (SELECT TOP 1 hd.TrangThai FROM HoaDon hd WHERE hd.MaDonHang = dh.MaDonHang ORDER BY (CASE WHEN hd.TrangThai = N'Đã thanh toán' THEN 1 ELSE 2 END) ASC) AS TrangThaiHoaDon,
                     (SELECT TOP 1 tt.TrangThai FROM ThanhToan tt JOIN HoaDon hd2 ON tt.MaHoaDon = hd2.MaHoaDon WHERE hd2.MaDonHang = dh.MaDonHang ORDER BY (CASE WHEN tt.TrangThai = N'Thành công' THEN 1 ELSE 2 END) ASC) AS TrangThaiThanhToan
              FROM DonHang dh
              LEFT JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
              LEFT JOIN ChiNhanh cn ON dh.MaChiNhanh = cn.MaChiNhanh
              ORDER BY dh.NgayDat DESC`),
    querySql(`SELECT MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, DoiTuongApDung, 
                     CONVERT(VARCHAR(10), NgayBatDau, 120) AS NgayBatDau, 
                     CONVERT(VARCHAR(10), NgayKetThuc, 120) AS NgayKetThuc, 
                     TrangThai FROM KhuyenMai`),
    querySql(`SELECT dg.MaDanhGia, dg.MaKhachHang, dg.MaLichHen, dg.MaDonHang, dg.MaSanPham, dg.MaDichVu,
                     dg.SoSao, dg.NoiDung, dg.HinhAnh,
                     CONVERT(VARCHAR(19), dg.NgayDanhGia, 120) AS NgayDanhGia,
                     dg.TrangThai, dg.PhanHoiAdmin,
                     CONVERT(VARCHAR(19), dg.NgayPhanHoi, 120) AS NgayPhanHoi,
                     kh.HoTen AS TenKhachHang, kh.SoDienThoai AS SdtKhachHang,
                     sp.TenSanPham AS TenSanPhamDirect,
                     dv.TenDichVu AS TenDichVuDirect,
                     (SELECT TOP 1 sp2.TenSanPham FROM ChiTietDonHang ctdh2 JOIN SanPham sp2 ON ctdh2.MaSanPham = sp2.MaSanPham WHERE ctdh2.MaDonHang = dg.MaDonHang) AS TenSanPhamDon,
                     (SELECT TOP 1 ctdh2.MaSanPham FROM ChiTietDonHang ctdh2 WHERE ctdh2.MaDonHang = dg.MaDonHang) AS MaSanPhamDon,
                     (SELECT TOP 1 ISNULL(dv2.TenDichVu, cb2.TenCombo) FROM ChiTietLichHen ctlh2 LEFT JOIN DichVu dv2 ON ctlh2.MaDichVu = dv2.MaDichVu LEFT JOIN ComboDichVu cb2 ON ctlh2.MaCombo = cb2.MaCombo WHERE ctlh2.MaLichHen = dg.MaLichHen) AS TenDichVuLich,
                     (SELECT TOP 1 ISNULL(ctlh2.MaDichVu, ctlh2.MaCombo) FROM ChiTietLichHen ctlh2 WHERE ctlh2.MaLichHen = dg.MaLichHen) AS MaDichVuLich
              FROM DanhGia dg
              LEFT JOIN KhachHang kh ON dg.MaKhachHang = kh.MaKhachHang
              LEFT JOIN SanPham sp ON dg.MaSanPham = sp.MaSanPham
              LEFT JOIN DichVu dv ON dg.MaDichVu = dv.MaDichVu
              ORDER BY dg.NgayDanhGia DESC`),
    querySql(`SELECT tk.MaTaiKhoan, tk.MaNhanVien, tk.MaKhachHang, tk.TenDangNhap, tk.VaiTro, tk.TrangThai,
                     ISNULL(nv.HoTen, kh.HoTen) AS HoTen,
                     ISNULL(nv.SoDienThoai, kh.SoDienThoai) AS SoDienThoai,
                     ISNULL(nv.Email, kh.Email) AS Email,
                     CONVERT(VARCHAR(10), kh.NgaySinh, 120) AS NgaySinh,
                     nv.MaChiNhanh, nv.ChucVu, nv.CapBac, cn.TenChiNhanh
              FROM TaiKhoan tk
              LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
              LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
              LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh`),
    querySql(`SELECT tb.MaThongBao, tb.MaTaiKhoan, tb.MaKhachHang, tb.TieuDe, tb.NoiDung, tb.LoaiThongBao,
                     CONVERT(VARCHAR(19), tb.ThoiGianGui, 120) AS ThoiGianGui, tb.TrangThaiDoc
               FROM ThongBao tb`),
    querySql(`SELECT clv.MaCa, clv.MaNhanVien, 
                     CONVERT(VARCHAR(10), clv.NgayLam, 120) AS NgayLam,
                     CONVERT(VARCHAR(8), clv.GioBatDau) AS GioBatDau,
                     CONVERT(VARCHAR(8), clv.GioKetThuc) AS GioKetThuc,
                     clv.TrangThai, nv.HoTen, nv.MaChiNhanh, cn.TenChiNhanh
              FROM CaLamViec clv
              LEFT JOIN NhanVien nv ON clv.MaNhanVien = nv.MaNhanVien
              LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh
              ORDER BY clv.NgayLam DESC, clv.GioBatDau ASC`),
    querySql(`SELECT MaKhuyenMai, MaDichVu FROM KhuyenMai_DichVu`),
    querySql(`SELECT MaKhuyenMai, MaSanPham FROM KhuyenMai_SanPham`),
    querySql(`SELECT ct.MaCombo, ct.MaDichVu, ct.SoLuong, dv.TenDichVu, dv.Gia, dv.ThoiLuong, dv.HinhAnh 
              FROM ChiTietComboDichVu ct 
              JOIN DichVu dv ON ct.MaDichVu = dv.MaDichVu`),
    querySql(`SELECT MaQuyTac, TenQuyTac, SoNgayConLaiToiThieu, SoNgayConLaiToiDa, PhanTramGiam, TrangThai 
              FROM QuyTacGiamGiaTheoHan ORDER BY PhanTramGiam ASC`),
    querySql(`SELECT pnk.MaPhieuNhap, pnk.MaChiNhanh, pnk.MaNhanVien, pnk.MaNguoiDuyet, pnk.MaNhaCungCap, 
                     CONVERT(VARCHAR(19), pnk.NgayLap, 120) AS NgayLap, 
                     CONVERT(VARCHAR(19), pnk.NgayDuyet, 120) AS NgayDuyet, 
                     pnk.TongTien, pnk.TrangThai, pnk.LyDoTuChoi, cn.TenChiNhanh, ncc.TenNhaCungCap, 
                     nv1.HoTen AS TenNguoiLap, nv2.HoTen AS TenNguoiDuyet,
                     (SELECT COUNT(*) FROM ChiTietPhieuNhap WHERE MaPhieuNhap = pnk.MaPhieuNhap) AS SoLuongMatHang 
              FROM PhieuNhapKho pnk 
              LEFT JOIN ChiNhanh cn ON pnk.MaChiNhanh = cn.MaChiNhanh 
              LEFT JOIN NhaCungCap ncc ON pnk.MaNhaCungCap = ncc.MaNhaCungCap 
              LEFT JOIN NhanVien nv1 ON pnk.MaNhanVien = nv1.MaNhanVien 
              LEFT JOIN NhanVien nv2 ON pnk.MaNguoiDuyet = nv2.MaNhanVien 
              ORDER BY pnk.NgayLap DESC`),
    querySql(`SELECT hd.MaHoaDon, hd.MaKhachHang, hd.MaLichHen, hd.MaDonHang, hd.MaChiNhanh, 
                     CONVERT(VARCHAR(19), hd.NgayLap, 120) AS NgayLap, 
                     hd.TongTien, hd.TrangThai, hd.MaSoHoaDon, kh.HoTen AS TenKhachHang, 
                     kh.SoDienThoai AS SdtKhachHang, cn.TenChiNhanh,
                     CASE 
                       WHEN EXISTS (SELECT 1 FROM ChiTietHoaDon_DichVu WHERE MaHoaDon = hd.MaHoaDon) THEN
                         (SELECT ISNULL(SUM(ThanhTien), 0) FROM ChiTietHoaDon_DichVu WHERE MaHoaDon = hd.MaHoaDon)
                       WHEN hd.MaLichHen IS NOT NULL THEN
                         ISNULL((SELECT SUM(ThanhTien) FROM ChiTietLichHen WHERE MaLichHen = hd.MaLichHen), hd.TongTien)
                       ELSE 0
                     END AS TienDichVu,
                     CASE 
                       WHEN EXISTS (SELECT 1 FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = hd.MaHoaDon) THEN
                         (SELECT ISNULL(SUM(ThanhTien), 0) FROM ChiTietHoaDon_SanPham WHERE MaHoaDon = hd.MaHoaDon)
                       WHEN hd.MaDonHang IS NOT NULL THEN
                         ISNULL((SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang = hd.MaDonHang), hd.TongTien)
                       ELSE 0
                     END AS TienSanPham
              FROM HoaDon hd 
              LEFT JOIN KhachHang kh ON hd.MaKhachHang = kh.MaKhachHang 
              LEFT JOIN ChiNhanh cn ON hd.MaChiNhanh = cn.MaChiNhanh 
              ORDER BY hd.NgayLap DESC`),
    querySql(`SELECT tt.MaThanhToan, tt.MaHoaDon, tt.MaNhanVien, tt.SoTien, tt.PhuongThuc, 
                     CONVERT(VARCHAR(19), tt.ThoiGianThanhToan, 120) AS ThoiGianThanhToan, 
                     tt.TrangThai, tt.MaGiaoDich, nv.HoTen AS TenNhanVien, 
                     hd.MaChiNhanh, hd.MaKhachHang, kh.HoTen AS TenKhachHang 
              FROM ThanhToan tt 
              LEFT JOIN NhanVien nv ON tt.MaNhanVien = nv.MaNhanVien 
              LEFT JOIN HoaDon hd ON tt.MaHoaDon = hd.MaHoaDon 
              LEFT JOIN KhachHang kh ON hd.MaKhachHang = kh.MaKhachHang 
              ORDER BY tt.ThoiGianThanhToan DESC`),
    querySql(`SELECT * FROM vw_GiaBanTheoLoHienTai ORDER BY SoNgayConLai ASC`).catch(() => []),
    querySql(`SELECT * FROM vw_SanPhamCanhBaoTonThap`).catch(() => []),
    querySql(`SELECT tk.MaSanPham, tk.MaChiNhanh, tk.SoLuongTon, tk.MucCanhBao, sp.TenSanPham, sp.GiaBan, sp.GiaNhap, sp.HinhAnh, cn.TenChiNhanh 
              FROM TonKho tk 
              JOIN SanPham sp ON tk.MaSanPham = sp.MaSanPham 
              JOIN ChiNhanh cn ON tk.MaChiNhanh = cn.MaChiNhanh`),
    querySql(`SELECT ctdh.MaChiTietDonHang, ctdh.MaDonHang, ctdh.MaSanPham, ctdh.MaChiTietPhieuNhap, 
                     ctdh.SoLuong, ctdh.DonGiaGoc, ctdh.PhanTramGiamGia, ctdh.DonGiaThucTe, ctdh.ThanhTien, 
                     sp.TenSanPham, sp.HinhAnh 
              FROM ChiTietDonHang ctdh 
              JOIN SanPham sp ON ctdh.MaSanPham = sp.MaSanPham`),
    querySql(`SELECT ctdv.MaChiTietHDDV, ctdv.MaHoaDon, ctdv.MaDichVu, ctdv.MaCombo, ctdv.SoLuong, ctdv.DonGia, ctdv.ThanhTien,
                     ISNULL(dv.TenDichVu, cb.TenCombo) AS TenDichVu
              FROM ChiTietHoaDon_DichVu ctdv
              LEFT JOIN DichVu dv ON ctdv.MaDichVu = dv.MaDichVu
              LEFT JOIN ComboDichVu cb ON ctdv.MaCombo = cb.MaCombo`).catch(() => []),
    querySql(`SELECT ctsp.MaChiTietHDSanPham, ctsp.MaHoaDon, ctsp.MaSanPham, ctsp.SoLuong, ctsp.DonGiaThucTe, ctsp.ThanhTien,
                     sp.TenSanPham, sp.HinhAnh
              FROM ChiTietHoaDon_SanPham ctsp
              JOIN SanPham sp ON ctsp.MaSanPham = sp.MaSanPham`).catch(() => []),
    querySql(`SELECT ctlh.MaChiTietLichHen, ctlh.MaLichHen, ctlh.MaDichVu, ctlh.MaCombo, ctlh.SoLuong, ctlh.DonGia, ctlh.ThanhTien,
                     ISNULL(dv.TenDichVu, cb.TenCombo) AS TenDichVu
              FROM ChiTietLichHen ctlh
              LEFT JOIN DichVu dv ON ctlh.MaDichVu = dv.MaDichVu
              LEFT JOIN ComboDichVu cb ON ctlh.MaCombo = cb.MaCombo`).catch(() => [])
  ]);

  // Chuẩn hóa danh sách đơn hàng kèm chi tiết sản phẩm chuẩn FEFO
  const mappedOrders = (orderRows || []).map(r => {
    let oStatus = 'Pending';
    const tt = (r.TrangThai || '').trim().toLowerCase();
    if (tt.includes('hủy') || tt === 'cancelled') oStatus = 'Cancelled';
    else if (tt.includes('đã nhận') || tt.includes('hoàn tất') || tt.includes('đã giao') || tt === 'completed' || tt === 'delivered') oStatus = 'Completed';
    else if (tt.includes('sẵn sàng') || tt === 'ready' || tt === 'ready_for_pickup') oStatus = 'Ready';
    else if (tt.includes('đang giao') || tt === 'delivering' || tt === 'shipping' || (tt.includes('giao') && !tt.includes('đã giao'))) oStatus = 'Delivering';
    else if (tt.includes('chuẩn bị') || tt.includes('đóng gói') || tt.includes('đang xử lý') || tt === 'processing') oStatus = 'Processing';
    else if (tt.includes('chờ') || tt === 'pending') oStatus = 'Pending';

    const items = (chiTietDonHangRows || [])
      .filter(it => it.MaDonHang === r.MaDonHang)
      .map(it => ({
        id: it.MaChiTietDonHang,
        productId: it.MaSanPham,
        name: it.TenSanPham || 'Sản phẩm',
        price: parseFloat(it.DonGiaThucTe || 0),
        quantity: it.SoLuong || 1,
        qty: it.SoLuong || 1,
        total: parseFloat(it.ThanhTien || 0),
        image: it.HinhAnh || ''
      }));

    const isPaid = (
      r.TrangThaiHoaDon === 'Đã thanh toán' ||
      r.TrangThaiThanhToan === 'Thành công' ||
      r.TrangThai === 'Đã thanh toán' ||
      (r.GhiChu && r.GhiChu.includes('Đã thanh toán'))
    );

    return {
      id: r.MaDonHang,
      MaDonHang: r.MaDonHang,
      orderCode: r.MaDonHang,
      customerId: r.MaKhachHang,
      customerName: r.TenKhachHang || 'Khách Hàng',
      customerPhone: r.SdtKhachHang || '',
      branchId: r.MaChiNhanh,
      branchName: r.TenChiNhanh || 'Omni Salon Chi Nhánh',
      orderDate: r.NgayDat,
      createdAt: r.NgayDat,
      NgayDat: r.NgayDat,
      totalAmount: parseFloat(r.TongTien || 0),
      TongTien: parseFloat(r.TongTien || 0),
      shippingAddress: r.DiaChiGiaoHang,
      receiveMethod: r.HinhThucNhan,
      deliveryType: (r.HinhThucNhan === 'Nhận tại quầy' || (r.DiaChiGiaoHang && r.DiaChiGiaoHang.includes('quầy'))) ? 'PICKUP_BRANCH' : 'DELIVERY',
      paymentMethod: r.HinhThucNhan === 'Nhận tại quầy' ? 'Thanh toán tại quầy' : 'VietQR',
      paymentStatus: isPaid ? 'Paid' : 'Unpaid',
      isPaid: Boolean(isPaid),
      TrangThaiHoaDon: r.TrangThaiHoaDon || (isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'),
      orderStatus: oStatus,
      TrangThai: r.TrangThai,
      notes: r.GhiChu,
      items
    };
  });

  // Chuẩn hóa danh sách lịch hẹn
  const mappedBookings = (bookingRows || []).map(r => {
    const isProgress = (r.TrangThai === 'Đang phục vụ' || r.TrangThai === 'In_Progress' || r.TrangThai === 'in_progress');
    const uiStatus = (r.TrangThai === 'Hoàn thành' || r.TrangThai === 'Completed') ? 'Completed' :
      ((r.TrangThai === 'Đã hủy' || r.TrangThai === 'Cancelled') ? 'Cancelled' :
      (isProgress ? 'in_progress' :
      ((r.TrangThai === 'Chờ vào ghế' || r.TrangThai === 'Waiting' || r.TrangThai === 'waiting') ? 'waiting' : 'Confirmed')));

    return {
      id: r.MaLichHen,
      MaLichHen: r.MaLichHen,
      bookingCode: r.MaLichHen,
      customerId: r.MaKhachHang,
      customerName: r.TenKhachHang || 'Khách Hàng',
      customerPhone: r.SdtKhachHang || '',
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
      serviceName: r.TenDichVu || 'Dịch vụ Salon',
      totalPrice: parseFloat(r.TongTien || 0),
      TongTien: parseFloat(r.TongTien || 0),
      depositAmount: parseFloat(r.TienCoc || 0),
      notes: r.GhiChu || '',
      LyDoHuy: r.LyDoHuy
    };
  });

  // Chuẩn hóa danh sách sản phẩm với quy tắc giảm giá FEFO & Khuyến mãi lũy tiến  Mục 23 
  const mappedProducts = (prodRows || []).map(r => {
    const pStock = parseInt(r.SoLuongTon || 0, 10);
    const origPrice = parseFloat(r.GiaBan || 0);
    let finalPrice = origPrice;
    let discountPercent = 0;
    let promoInfo = null;

    let fefoDiscount = 0;
    let daysLeft = 999;
    if (r.HanSuDung) {
      if (r.SoNgayConLai !== null && r.SoNgayConLai !== undefined) {
        daysLeft = parseInt(r.SoNgayConLai, 10);
      } else {
        const expParts = String(r.HanSuDung).split('T')[0].split('-');
        const expMid = new Date(parseInt(expParts[0], 10), parseInt(expParts[1], 10) - 1, parseInt(expParts[2], 10));
        const now = new Date();
        const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        daysLeft = Math.round((expMid - todayMid) / (1000 * 60 * 60 * 24));
      }

      const matchedRule = (discountRuleRows || []).find(rl => daysLeft >= rl.SoNgayConLaiToiThieu && daysLeft <= rl.SoNgayConLaiToiDa);
      if (matchedRule) {
        fefoDiscount = parseFloat(matchedRule.PhanTramGiam || 0);
      } else if (daysLeft <= 0) {
        fefoDiscount = 100;
      }
    }

    // Khuyến mãi áp dụng cho sản phẩm  ví dụ KM01 - Chào Thu Rực Rỡ 10% 
    let promoDiscount = 0;
    let matchedPromo = null;
    const nowStr = getLocalIsoDate();
    const linkedPromos = (kmSanPhamRows || []).filter(km => km.MaSanPham === r.MaSanPham);
    for (const link of linkedPromos) {
      const p = (promoRows || []).find(pr => {
        if (pr.MaKhuyenMai !== link.MaKhuyenMai) return false;
        if (pr.DoiTuongApDung && pr.DoiTuongApDung.includes('Hội viên')) return false;
        const st = (pr.TrangThai || '').trim();
        if (st !== 'Đang áp dụng' && st !== 'Áp dụng') return false;
        if (pr.NgayBatDau && String(pr.NgayBatDau).slice(0, 10) > nowStr) return false;
        if (pr.NgayKetThuc && String(pr.NgayKetThuc).slice(0, 10) < nowStr) return false;
        return true;
      });
      if (p && parseFloat(p.GiaTriGiam || 0) > promoDiscount) {
        promoDiscount = parseFloat(p.GiaTriGiam || 0);
        matchedPromo = p;
      }
    }

    // Tính mức giảm lũy tiến FEFO  Mục 23 : Mức cao hơn trước, sau đó áp tiếp mức còn lại
    if (daysLeft <= 0) {
      finalPrice = 0;
      discountPercent = 100;
      fefoDiscount = 100;
      promoInfo = {
        code: 'QT05',
        name: 'Đã hết hạn (Thu hồi tiêu hủy)',
        discountPercent: 100,
        fefoDiscount: 100
      };
    } else if (fefoDiscount > 0 && promoDiscount > 0) {
      const d1 = Math.max(fefoDiscount, promoDiscount);
      const d2 = Math.min(fefoDiscount, promoDiscount);
      const price1 = origPrice * (1 - d1 / 100);
      finalPrice = Math.round(price1 * (1 - d2 / 100));
      discountPercent = Math.round((1 - (finalPrice / origPrice)) * 100);
      promoInfo = {
        code: (matchedPromo ? matchedPromo.MaKhuyenMai : 'KM') + '_FEFO',
        name: 'Cận hạn ' + daysLeft + ' ngày (-' + fefoDiscount + '%) + ' + (matchedPromo ? (matchedPromo.TenKhuyenMai || matchedPromo.name) : 'Khuyến mãi') + ' (-' + promoDiscount + '%)',
        discountPercent,
        fefoDiscount,
        promoDiscount
      };
    } else if (fefoDiscount > 0) {
      finalPrice = Math.round(origPrice * (1 - fefoDiscount / 100));
      discountPercent = fefoDiscount;
      promoInfo = {
        code: 'FEFO',
        name: 'Xả kho cận hạn (' + daysLeft + ' ngày) - Giảm ' + fefoDiscount + '%',
        discountPercent,
        fefoDiscount
      };
    } else if (promoDiscount > 0) {
      finalPrice = Math.round(origPrice * (1 - promoDiscount / 100));
      discountPercent = promoDiscount;
      promoInfo = {
        code: matchedPromo ? matchedPromo.MaKhuyenMai : 'KM',
        name: (matchedPromo ? (matchedPromo.TenKhuyenMai || matchedPromo.name) : 'Khuyến mãi') + ' - Giảm ' + promoDiscount + '%',
        discountPercent,
        promoDiscount
      };
    }

    return {
      id: r.MaSanPham,
      MaSanPham: r.MaSanPham,
      name: r.TenSanPham,
      TenSanPham: r.TenSanPham,
      categoryId: r.MaDanhMuc,
      category: r.TenDanhMuc || 'Chăm sóc tóc',
      brand: detectBrand(r.TenSanPham),
      price: finalPrice,
      GiaBanThucTe: finalPrice,
      originalPrice: origPrice,
      GiaNiemYetGoc: origPrice,
      GiaBan: origPrice,
      costPrice: parseFloat(r.GiaNhap || 0),
      GiaNhap: parseFloat(r.GiaNhap || 0),
      status: r.TrangThaiKinhDoanh || 'Đang kinh doanh',
      TrangThaiKinhDoanh: r.TrangThaiKinhDoanh || 'Đang kinh doanh',
      discountPercent,
      PhanTramGiam: discountPercent,
      fefoDiscount,
      nearExpiryDiscount: fefoDiscount,
      promoDiscount,
      isNearExpiry: fefoDiscount > 0 && daysLeft > 0,
      isExpired: daysLeft <= 0,
      isAvailable: daysLeft > 0,
      stock: pStock,
      SoLuongTon: pStock,
      soldCount: Number(r.SoLuongDaBan) || 0,
      soLuongDaBan: Number(r.SoLuongDaBan) || 0,
      inStock: pStock > 0 && daysLeft > 0,
      image: r.HinhAnh || '',
      HinhAnh: r.HinhAnh || '',
      description: r.MoTa,
      MoTa: r.MoTa,
      lotNumber: r.SoLo || null,
      SoLo: r.SoLo || null,
      batchId: r.MaChiTietPhieuNhap || null,
      HanSuDung: r.HanSuDung,
      expiryDate: r.HanSuDung,
      SoLuongConLai: r.SoLuongConLai,
      daysLeft: (r.HanSuDung && daysLeft !== 999) ? daysLeft : null,
      daysRemaining: (r.HanSuDung && daysLeft !== 999) ? daysLeft : null,
      promo: promoInfo,
      promotion: promoInfo,
      hasPromotion: discountPercent > 0
    };
  });

  // Chuẩn hóa danh sách chi nhánh
  const mappedBranches = (branchRows || []).map(r => {
    const oT = formatTime(r.GioMoCua);
    const cT = formatTime(r.GioDongCua);
    const hoursFormatted = `${oT} - ${cT}`;
    return {
      id: r.MaChiNhanh,
      MaChiNhanh: r.MaChiNhanh,
      name: r.TenChiNhanh,
      TenChiNhanh: r.TenChiNhanh,
      address: r.DiaChi,
      DiaChi: r.DiaChi,
      phone: r.SoDienThoai,
      SoDienThoai: r.SoDienThoai,
      openTime: oT,
      closeTime: cT,
      GioMoCua: oT,
      GioDongCua: cT,
      openHours: hoursFormatted,
      hours: hoursFormatted,
      image: r.HinhAnh,
      HinhAnh: r.HinhAnh,
      status: r.TrangThai,
      TrangThai: r.TrangThai
    };
  });

  // Chuẩn hóa danh sách dịch vụ và áp dụng khuyến mãi hiện hành  Mục 16 
  const todayDateStr = getLocalIsoDate();
  const activeServicePromos = (promoRows || []).filter(p => {
    if (p.DoiTuongApDung && p.DoiTuongApDung.includes('Hội viên')) return false;
    const st = (p.TrangThai || '').trim();
    const isApp = st === 'Đang áp dụng' || st === 'Áp dụng';
    const nb = p.NgayBatDau ? String(p.NgayBatDau).slice(0, 10) : '';
    const nk = p.NgayKetThuc ? String(p.NgayKetThuc).slice(0, 10) : '';
    const inRange = (!nb || todayDateStr >= nb) && (!nk || todayDateStr <= nk);
    return isApp && inRange;
  });

  const mappedServices = (serviceRows || []).map((r, index) => {
    const origPrice = parseFloat(r.Gia || 0);
    const kmMatch = (kmDichVuRows || []).find(k => k.MaDichVu === r.MaDichVu);
    let promo = null;
    let discPercent = 0;
    if (kmMatch) {
      promo = activeServicePromos.find(p => p.MaKhuyenMai === kmMatch.MaKhuyenMai);
      if (promo) {
        discPercent = parseFloat(promo.GiaTriGiam || 0);
      }
    }

    const finalPrice = discPercent > 0 ? Math.round(origPrice * (1 - discPercent / 100)) : origPrice;

    return {
      stt: r.stt || (index + 1),
      real_id: r.real_id || r.MaDichVu,
      id: r.MaDichVu,
      MaDichVu: r.MaDichVu,
      name: r.TenDichVu,
      TenDichVu: r.TenDichVu,
      price: finalPrice,
      Gia: finalPrice,
      originalPrice: origPrice,
      GiaNiemYetGoc: origPrice,
      discountPercent: discPercent,
      hasPromotion: discPercent > 0,
      promotion: promo ? {
        id: promo.MaKhuyenMai,
        code: promo.MaKhuyenMai,
        name: promo.TenKhuyenMai,
        discount: discPercent,
        discountPercent: discPercent,
        type: promo.HinhThuc
      } : null,
      durationMinutes: parseInt(r.ThoiLuong || 45, 10),
      ThoiLuong: parseInt(r.ThoiLuong || 45, 10),
      duration: `${r.ThoiLuong || 45} phút`,
      description: r.MoTa,
      MoTa: r.MoTa,
      image: r.HinhAnh,
      HinhAnh: r.HinhAnh,
      status: r.TrangThai || 'Đang kinh doanh',
      TrangThai: r.TrangThai || 'Đang kinh doanh',
      applyDate: r.NgayApDung,
      NgayApDung: r.NgayApDung
    };
  });

  // Chuẩn hóa danh sách gói combo làm đẹp
  const mappedCombos = (comboRows || []).map((r, index) => {
    const details = (chiTietComboRows || []).filter(c => c.MaCombo === r.MaCombo);
    const serviceIds = details.map(c => c.MaDichVu);
    const sumDuration = details.reduce((sum, d) => sum + parseInt(d.ThoiLuong || 0, 10), 0);
    const finalDuration = r.ThoiLuong || sumDuration || 60;
    return {
      stt: r.stt || (index + 1),
      real_id: r.real_id || r.MaCombo,
      id: r.MaCombo,
      MaCombo: r.MaCombo,
      name: r.TenCombo,
      TenCombo: r.TenCombo,
      description: r.MoTa || '',
      MoTa: r.MoTa || '',
      price: parseFloat(r.GiaCombo || 0),
      GiaCombo: parseFloat(r.GiaCombo || 0),
      duration: finalDuration,
      durationMinutes: finalDuration,
      ThoiLuong: finalDuration,
      image: r.HinhAnh || '',
      HinhAnh: r.HinhAnh || '',
      status: r.TrangThai || 'Đang kinh doanh',
      TrangThai: r.TrangThai || 'Đang kinh doanh',
      serviceIds,
      services: details.map(d => ({
        id: d.MaDichVu,
        MaDichVu: d.MaDichVu,
        name: d.TenDichVu,
        TenDichVu: d.TenDichVu,
        duration: d.ThoiLuong,
        price: parseFloat(d.Gia || 0)
      }))
    };
  });

  // Chuẩn hóa danh mục sản phẩm, hỗ trợ cả id và MaDanhMuc
  const mappedCategories = (catRows || []).map(r => ({
    id: r.MaDanhMuc,
    MaDanhMuc: r.MaDanhMuc,
    name: r.TenDanhMuc,
    TenDanhMuc: r.TenDanhMuc,
    description: r.MoTa,
    MoTa: r.MoTa,
    status: r.TrangThai,
    TrangThai: r.TrangThai
  }));

  // Chuẩn hóa danh sách thợ cắt
  const mappedStylists = (stylistRows || []).map((r, index) => {
    const match = String(r.MaNhanVien || r.HoTen || '').match(/(\d+)/);
    const num = match ? parseInt(match[1], 10) : (index + 1);
    const thoIdx = ((num - 1) % 20) + 1;
    const avatarPath = `/DataPicture/ChanDungTho/Tho${thoIdx}.jpg`;
    return {
      id: r.MaNhanVien,
      MaNhanVien: r.MaNhanVien,
      name: r.HoTen,
      HoTen: r.HoTen,
      phone: r.SoDienThoai,
      SoDienThoai: r.SoDienThoai,
      email: r.Email,
      branchId: r.MaChiNhanh,
      MaChiNhanh: r.MaChiNhanh,
      branchName: r.TenChiNhanh,
      TenChiNhanh: r.TenChiNhanh,
      rank: r.CapBac,
      CapBac: r.CapBac,
      level: r.CapBac,
      position: r.ChucVu,
      ChucVu: r.ChucVu,
      role: r.ChucVu,
      status: r.TrangThai,
      TrangThai: r.TrangThai,
      avatar: avatarPath,
      avatarUrl: avatarPath
    };
  });

  const mappedFefoLots = (fefoLotRows || []).map(r => ({
    ...r,
    id: r.MaChiTietPhieuNhap,
    receiptDetailId: r.MaChiTietPhieuNhap,
    branchId: r.MaChiNhanh,
    branchName: r.TenChiNhanh,
    lotNumber: r.SoLo,
    productId: r.MaSanPham,
    productName: r.TenSanPham,
    originalPrice: Number(r.GiaNiemYetGoc) || 0,
    expiryDate: r.HanSuDung ? (r.HanSuDung instanceof Date ? r.HanSuDung.toISOString().split('T')[0] : String(r.HanSuDung).split('T')[0].split(' ')[0]) : '',
    remainingQuantity: Number(r.SoLuongConLai) || 0,
    daysLeft: Number(r.SoNgayConLai) || 0,
    discountPercent: Number(r.PhanTramGiam) || 0,
    actualPrice: Number(r.GiaBanThucTe) || 0,
    statusNote: r.TinhTrangHang || ''
  }));

  const mappedReceipts = (receiptRows || []).map(r => ({
    ...r,
    id: r.MaPhieuNhap,
    receiptCode: r.MaPhieuNhap,
    branchId: r.MaChiNhanh,
    branchName: r.TenChiNhanh || ('Chi Nhánh ' + r.MaChiNhanh),
    supplierId: r.MaNhaCungCap,
    supplierName: r.TenNhaCungCap || 'NCC Chính Hãng',
    staffId: r.MaNhanVien,
    staffName: r.TenNguoiLap || 'Nhân viên kho',
    approverId: r.MaNguoiDuyet,
    approverName: r.TenNguoiDuyet || '—',
    createdDate: r.NgayLap || '',
    approvedDate: r.NgayDuyet || '',
    total: Number(r.TongTien) || 0,
    totalAmount: Number(r.TongTien) || 0,
    status: r.TrangThai || 'Đã duyệt',
    rejectReason: r.LyDoTuChoi || '',
    itemCount: Number(r.SoLuongMatHang) || 1
  }));

  const mappedPromotions = (promoRows || []).map(r => {
    const sIds = (kmDichVuRows || []).filter(k => k.MaKhuyenMai === r.MaKhuyenMai).map(k => k.MaDichVu);
    const pIds = (kmSanPhamRows || []).filter(k => k.MaKhuyenMai === r.MaKhuyenMai).map(k => k.MaSanPham);
    return {
      ...r,
      id: r.MaKhuyenMai,
      code: r.MaKhuyenMai,
      name: r.TenKhuyenMai,
      type: r.HinhThuc,
      value: Number(r.GiaTriGiam) || 0,
      target: r.DoiTuongApDung || 'Tất cả khách hàng',
      startDate: r.NgayBatDau,
      endDate: r.NgayKetThuc,
      status: r.TrangThai || 'Đang áp dụng',
      serviceIds: sIds,
      productIds: pIds
    };
  });

  const mappedDiscountRules = (discountRuleRows || []).map(r => ({
    ...r,
    id: r.MaQuyTac,
    name: r.TenQuyTac,
    minDays: Number(r.SoNgayConLaiToiThieu) || 0,
    maxDays: Number(r.SoNgayConLaiToiDa) || 0,
    percent: Number(r.PhanTramGiam) || 0,
    status: r.TrangThai || 'Đang áp dụng'
  }));

  const mappedSuppliers = (suppRows || []).map(r => ({
    id: r.MaNhaCungCap,
    MaNhaCungCap: r.MaNhaCungCap,
    name: r.TenNhaCungCap,
    TenNhaCungCap: r.TenNhaCungCap,
    phone: r.SoDienThoai || '',
    SoDienThoai: r.SoDienThoai || '',
    email: r.Email || '',
    Email: r.Email || '',
    address: r.DiaChi || '',
    DiaChi: r.DiaChi || '',
    status: r.TrangThai || 'Hoạt động',
    TrangThai: r.TrangThai || 'Hoạt động'
  }));

  const mappedInvoices = (invoiceRows || []).map(hd => {
    let services = (chiTietHoaDonDichVuRows || [])
      .filter(s => s.MaHoaDon === hd.MaHoaDon)
      .map(s => ({
        id: s.MaChiTietHDDV,
        serviceId: s.MaDichVu || s.MaCombo,
        name: s.TenDichVu || 'Dịch vụ Salon',
        price: parseFloat(s.DonGia || 0),
        qty: s.SoLuong || 1,
        total: parseFloat(s.ThanhTien || 0)
      }));

    if (services.length === 0 && hd.MaLichHen) {
      services = (chiTietLichHenRows || [])
        .filter(s => s.MaLichHen === hd.MaLichHen)
        .map(s => ({
          id: s.MaChiTietLichHen,
          serviceId: s.MaDichVu || s.MaCombo,
          name: s.TenDichVu || 'Dịch vụ Salon',
          price: parseFloat(s.DonGia || 0),
          qty: s.SoLuong || 1,
          total: parseFloat(s.ThanhTien || 0)
        }));
    }

    let items = (chiTietHoaDonSanPhamRows || [])
      .filter(p => p.MaHoaDon === hd.MaHoaDon)
      .map(p => ({
        id: p.MaChiTietHDSanPham,
        productId: p.MaSanPham,
        name: p.TenSanPham || 'Sản phẩm',
        price: parseFloat(p.DonGiaThucTe || 0),
        qty: p.SoLuong || 1,
        quantity: p.SoLuong || 1,
        total: parseFloat(p.ThanhTien || 0),
        image: p.HinhAnh || ''
      }));

    if (items.length === 0 && hd.MaDonHang) {
      items = (chiTietDonHangRows || [])
        .filter(p => p.MaDonHang === hd.MaDonHang)
        .map(p => ({
          id: p.MaChiTietDonHang,
          productId: p.MaSanPham,
          name: p.TenSanPham || 'Sản phẩm',
          price: parseFloat(p.DonGiaThucTe || 0),
          qty: p.SoLuong || 1,
          quantity: p.SoLuong || 1,
          total: parseFloat(p.ThanhTien || 0),
          image: p.HinhAnh || ''
        }));
    }

    let sTotal = parseFloat(hd.TienDichVu !== undefined && hd.TienDichVu !== null ? hd.TienDichVu : 0);
    let pTotal = parseFloat(hd.TienSanPham !== undefined && hd.TienSanPham !== null ? hd.TienSanPham : 0);

    if (sTotal === 0 && services.length > 0) {
      sTotal = services.reduce((sum, s) => sum + (s.total || s.price || 0), 0);
    }
    if (pTotal === 0 && items.length > 0) {
      pTotal = items.reduce((sum, it) => sum + (it.total || it.price || 0), 0);
    }

    let totalAmount = parseFloat(hd.TongTien || (sTotal + pTotal) || 0);
    if (totalAmount === 0) {
      totalAmount = sTotal + pTotal;
    } else if (sTotal === 0 && pTotal === 0 && totalAmount > 0) {
      if (hd.MaDonHang) {
        pTotal = totalAmount;
        sTotal = 0;
      } else {
        sTotal = totalAmount;
        pTotal = 0;
      }
    }

    const payment = (paymentRows || []).find(pm => pm.MaHoaDon === hd.MaHoaDon);

    return {
      id: hd.MaHoaDon,
      MaHoaDon: hd.MaHoaDon,
      orderCode: hd.MaDonHang || null,
      bookingCode: hd.MaLichHen || null,
      MaLichHen: hd.MaLichHen || null,
      MaDonHang: hd.MaDonHang || null,
      customerId: hd.MaKhachHang,
      customerName: hd.TenKhachHang || 'Khách Vãng Lai',
      customerPhone: hd.SdtKhachHang || '',
      branchId: hd.MaChiNhanh,
      branchName: hd.TenChiNhanh || 'Omni Salon Chi Nhánh',
      createdDate: hd.NgayLap,
      NgayLap: hd.NgayLap,
      totalAmount: totalAmount,
      TongTien: totalAmount,
      serviceTotal: sTotal,
      TongTienDichVu: sTotal,
      TienDichVu: sTotal,
      productTotal: pTotal,
      TongTienSanPham: pTotal,
      TienSanPham: pTotal,
      status: hd.TrangThai || 'Đã thanh toán',
      TrangThai: hd.TrangThai || 'Đã thanh toán',
      paymentStatus: (hd.TrangThai === 'Đã thanh toán') ? 'Paid' : 'Unpaid',
      paymentMethod: (payment && payment.PhuongThuc) || (hd.MaDonHang ? 'VietQR' : 'Tiền mặt'),
      cashierName: (payment && payment.TenNhanVien) || 'Thu Ngân Quầy',
      MaSoHoaDon: hd.MaSoHoaDon || `HD-${hd.MaHoaDon}`,
      services,
      items,
      products: items
    };
  });

  const mappedUsers = (userRows || []).map(u => {
    const role = resolveUserRole(u);
    const bName = resolveBranchName(u.MaChiNhanh, u.TenChiNhanh, role);

    return {
      ...u,
      id: u.MaTaiKhoan,
      username: u.TenDangNhap,
      fullName: u.HoTen,
      phone: u.SoDienThoai,
      email: u.Email,
      role: role,
      roleName: (role === 'BARBER' && u.ChucVu) ? u.ChucVu : (ROLE_NAME_MAP[role] || role),
      branchId: u.MaChiNhanh || (role === 'CUSTOMER' ? null : 'ALL'),
      branchName: bName,
      TenChiNhanh: bName
    };
  });

  const mappedReviews = (reviewRows || []).map(r => {
    const productId = r.MaSanPham || r.MaSanPhamDon || null;
    const serviceId = r.MaDichVu || r.MaDichVuLich || null;
    const targetName = r.TenSanPhamDirect || r.TenDichVuDirect || r.TenSanPhamDon || r.TenDichVuLich || (r.MaLichHen ? `Lịch #${r.MaLichHen}` : (r.MaDonHang ? `Đơn #${r.MaDonHang}` : 'Omni Salon'));
    const targetType = r.MaSanPham || r.MaDonHang ? 'product' : 'service';
    return {
      ...r,
      id: r.MaDanhGia,
      MaDanhGia: r.MaDanhGia,
      customerId: r.MaKhachHang,
      customerName: r.TenKhachHang || 'Khách Hàng',
      customerPhone: r.SdtKhachHang || '',
      bookingId: r.MaLichHen || null,
      orderId: r.MaDonHang || null,
      productId,
      MaSanPham: r.MaSanPham || productId,
      serviceId,
      MaDichVu: r.MaDichVu || serviceId,
      targetName,
      targetType,
      rating: Number(r.SoSao || 5),
      SoSao: Number(r.SoSao || 5),
      comment: r.NoiDung || '',
      NoiDung: r.NoiDung || '',
      adminReply: r.PhanHoiAdmin || '',
      PhanHoiAdmin: r.PhanHoiAdmin || '',
      replyDate: r.NgayPhanHoi || null,
      NgayPhanHoi: r.NgayPhanHoi || null,
      date: r.NgayDanhGia,
      NgayDanhGia: r.NgayDanhGia,
      status: r.TrangThai || 'Hiển thị',
      TrangThai: r.TrangThai || 'Hiển thị'
    };
  });

  return {
    branches: mappedBranches,
    services: mappedServices,
    combos: mappedCombos,
    stylists: mappedStylists,
    categories: mappedCategories,
    suppliers: mappedSuppliers,
    products: mappedProducts,
    bookings: mappedBookings,
    orders: mappedOrders,
    promotions: mappedPromotions,
    reviews: mappedReviews,
    users: mappedUsers,
    notifications: thongBaoRows,
    shifts: caLamViecRows,
    inventory: inventoryRows,
    receipts: mappedReceipts,
    invoices: mappedInvoices,
    payments: paymentRows,
    discountRules: mappedDiscountRules,
    fefoLots: mappedFefoLots,
    lowStock: lowStockRows
  };
}

module.exports = {
  catIcons,
  brandPrefixes,
  detectBrand,
  formatTime,
  formatDate,
  getLocalIsoDate,
  computeEndTime,
  resolveOrCreateCustomer,
  resolveStaffMember,
  generateNextBookingId,
  generateNextCtlhId,
  generateNextOrderId,
  generateNextCtdhId,
  resolveServiceInfo,
  getFullSqlDatabase,
  BRANCH_NAME_MAP,
  ROLE_NAME_MAP,
  ROLE_SQL_MAP,
  resolveUserRole,
  resolveBranchName
};

