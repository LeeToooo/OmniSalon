// Các hàm phụ trợ định dạng dữ liệu
const { querySql } = require('../database/db');

const catIcons = {
  DM01: '💈', DM02: '✨', DM03: '💨', DM04: '🧴', DM05: '🧼',
  DM06: '🌾', DM07: '🧪', DM08: '🧔', DM09: '✂'
};

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
  } catch (_) { }

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
  const rows = await querySql("SELECT TOP 1 MaLichHen FROM LichHen WHERE MaLichHen LIKE 'LH%' AND LEN(MaLichHen) <= 6 ORDER BY LEN(MaLichHen) DESC, MaLichHen DESC");
  let nextNum = 11;
  if (rows && rows.length > 0) {
    const m = rows[0].MaLichHen.match(/LH(\d+)/i);
    if (m) nextNum = parseInt(m[1], 10) + 1;
  }
  return 'LH' + (nextNum < 10 ? '0' + nextNum : nextNum);
}

async function generateNextOrderId() {
  const rows = await querySql("SELECT TOP 1 MaDonHang FROM DonHang WHERE MaDonHang LIKE 'DH%' AND LEN(MaDonHang) <= 6 ORDER BY LEN(MaDonHang) DESC, MaDonHang DESC");
  let nextNum = 11;
  if (rows && rows.length > 0) {
    const m = rows[0].MaDonHang.match(/DH(\d+)/i);
    if (m) nextNum = parseInt(m[1], 10) + 1;
  }
  return 'DH' + (nextNum < 10 ? '0' + nextNum : nextNum);
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
    chiTietDonHangRows
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
              WHERE nv.TrangThai = N'Đang làm việc'
                AND nv.MaNhanVien <> 'NV00'
                AND nv.ChucVu NOT LIKE N'%Quản trị%'
                AND nv.ChucVu NOT LIKE N'%Chủ tịch%'`),
    querySql(`SELECT MaDanhMuc, TenDanhMuc, MoTa, TrangThai FROM DanhMucSanPham`),
    querySql(`SELECT MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, DiaChi, TrangThai FROM NhaCungCap`),
    querySql(`SELECT sp.MaSanPham, sp.MaDanhMuc, sp.MaNhaCungCap, sp.TenSanPham, sp.MoTa, 
                     sp.HinhAnh, sp.GiaNhap, sp.GiaBan, sp.TrangThaiKinhDoanh,
                     dm.TenDanhMuc,
                     ISNULL((SELECT SUM(tk.SoLuongTon) FROM TonKho tk WHERE tk.MaSanPham = sp.MaSanPham), 0) AS SoLuongTon,
                     CONVERT(VARCHAR(10), ctpn.HanSuDung, 120) AS HanSuDung,
                     ctpn.SoLuongConLai
              FROM SanPham sp
              LEFT JOIN DanhMucSanPham dm ON sp.MaDanhMuc = dm.MaDanhMuc
              OUTER APPLY (
                  SELECT TOP 1 HanSuDung, SoLuongConLai 
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
                     CONVERT(VARCHAR(10), kh.NgaySinh, 120) AS NgaySinh,
                     nv.MaChiNhanh
              FROM TaiKhoan tk
              LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
              LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang`),
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
                     nv1.HoTen AS TenNguoiLap, nv2.HoTen AS TenNguoiDuyet 
              FROM PhieuNhapKho pnk 
              LEFT JOIN ChiNhanh cn ON pnk.MaChiNhanh = cn.MaChiNhanh 
              LEFT JOIN NhaCungCap ncc ON pnk.MaNhaCungCap = ncc.MaNhaCungCap 
              LEFT JOIN NhanVien nv1 ON pnk.MaNhanVien = nv1.MaNhanVien 
              LEFT JOIN NhanVien nv2 ON pnk.MaNguoiDuyet = nv2.MaNhanVien 
              ORDER BY pnk.NgayLap DESC`),
    querySql(`SELECT hd.MaHoaDon, hd.MaKhachHang, hd.MaLichHen, hd.MaDonHang, hd.MaChiNhanh, 
                     CONVERT(VARCHAR(19), hd.NgayLap, 120) AS NgayLap, 
                     hd.TongTien, hd.TrangThai, hd.MaSoHoaDon, kh.HoTen AS TenKhachHang, 
                     kh.SoDienThoai AS SdtKhachHang, cn.TenChiNhanh 
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
              JOIN SanPham sp ON ctdh.MaSanPham = sp.MaSanPham`)
  ]);

  // Chuẩn hóa danh sách đơn hàng kèm chi tiết sản phẩm chuẩn FEFO
  const mappedOrders = (orderRows || []).map(r => {
    let oStatus = 'Processing';
    const tt = (r.TrangThai || '').trim().toLowerCase();
    if (tt.includes('hủy') || tt === 'cancelled') oStatus = 'Cancelled';
    else if (tt.includes('hoàn tất') || tt.includes('đã giao') || tt === 'completed' || tt === 'delivered') oStatus = 'Completed';
    else if (tt.includes('đang giao') || tt === 'delivering' || tt === 'shipping' || (tt.includes('giao') && !tt.includes('đã giao'))) oStatus = 'Delivering';
    else if (tt.includes('chờ') || tt === 'pending') oStatus = 'Pending';
    else if (tt.includes('đóng gói') || tt.includes('đang xử lý') || tt === 'processing') oStatus = 'Processing';

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

    const isPaid = (r.TrangThai === 'Đã thanh toán' || (r.GhiChu && r.GhiChu.includes('Đã thanh toán')));

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
      totalAmount: parseFloat(r.TongTien || 0),
      TongTien: parseFloat(r.TongTien || 0),
      shippingAddress: r.DiaChiGiaoHang,
      receiveMethod: r.HinhThucNhan,
      deliveryType: (r.HinhThucNhan === 'Nhận tại quầy' || (r.DiaChiGiaoHang && r.DiaChiGiaoHang.includes('quầy'))) ? 'PICKUP_BRANCH' : 'DELIVERY',
      paymentMethod: r.HinhThucNhan === 'Nhận tại quầy' ? 'Thanh toán tại quầy' : 'VietQR',
      paymentStatus: isPaid ? 'Paid' : 'Unpaid',
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

  // Chuẩn hóa danh sách sản phẩm
  const mappedProducts = (prodRows || []).map(r => {
    const pStock = parseInt(r.SoLuongTon || 0, 10);
    const origPrice = parseFloat(r.GiaBan || 0);
    return {
      id: r.MaSanPham,
      MaSanPham: r.MaSanPham,
      name: r.TenSanPham,
      TenSanPham: r.TenSanPham,
      categoryId: r.MaDanhMuc,
      category: r.TenDanhMuc || 'Chăm sóc tóc',
      brand: detectBrand(r.TenSanPham),
      price: origPrice,
      originalPrice: origPrice,
      GiaBan: origPrice,
      costPrice: parseFloat(r.GiaNhap || 0),
      stock: pStock,
      SoLuongTon: pStock,
      inStock: pStock > 0,
      image: r.HinhAnh || '',
      HinhAnh: r.HinhAnh || '',
      description: r.MoTa,
      MoTa: r.MoTa,
      HanSuDung: r.HanSuDung,
      SoLuongConLai: r.SoLuongConLai
    };
  });

  // Chuẩn hóa danh sách chi nhánh
  const mappedBranches = (branchRows || []).map(r => ({
    id: r.MaChiNhanh,
    MaChiNhanh: r.MaChiNhanh,
    name: r.TenChiNhanh,
    TenChiNhanh: r.TenChiNhanh,
    address: r.DiaChi,
    DiaChi: r.DiaChi,
    phone: r.SoDienThoai,
    SoDienThoai: r.SoDienThoai,
    openTime: r.GioMoCua,
    closeTime: r.GioDongCua,
    image: r.HinhAnh,
    HinhAnh: r.HinhAnh,
    status: r.TrangThai,
    TrangThai: r.TrangThai
  }));

  // Chuẩn hóa danh sách dịch vụ
  const mappedServices = (serviceRows || []).map(r => ({
    id: r.MaDichVu,
    MaDichVu: r.MaDichVu,
    name: r.TenDichVu,
    TenDichVu: r.TenDichVu,
    price: parseFloat(r.Gia || 0),
    Gia: parseFloat(r.Gia || 0),
    durationMinutes: parseInt(r.ThoiLuong || 45, 10),
    ThoiLuong: parseInt(r.ThoiLuong || 45, 10),
    duration: `${r.ThoiLuong || 45} phút`,
    description: r.MoTa,
    MoTa: r.MoTa,
    image: r.HinhAnh,
    HinhAnh: r.HinhAnh,
    status: r.TrangThai,
    TrangThai: r.TrangThai,
    applyDate: r.NgayApDung,
    NgayApDung: r.NgayApDung
  }));

  // Chuẩn hóa danh sách gói combo làm đẹp
  const mappedCombos = (comboRows || []).map(r => {
    const details = (chiTietComboRows || []).filter(c => c.MaCombo === r.MaCombo);
    const serviceIds = details.map(c => c.MaDichVu);
    const sumDuration = details.reduce((sum, d) => sum + parseInt(d.ThoiLuong || 0, 10), 0);
    const finalDuration = r.ThoiLuong || sumDuration || 60;
    return {
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
      status: r.TrangThai || 'Kinh doanh',
      TrangThai: r.TrangThai || 'Kinh doanh',
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
  const mappedStylists = (stylistRows || []).map(r => ({
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
    TrangThai: r.TrangThai
  }));

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
    itemCount: 1
  }));

  return {
    branches: mappedBranches,
    services: mappedServices,
    combos: mappedCombos,
    stylists: mappedStylists,
    categories: mappedCategories,
    suppliers: suppRows,
    products: mappedProducts,
    bookings: mappedBookings,
    orders: mappedOrders,
    promotions: promoRows,
    reviews: reviewRows,
    users: userRows,
    notifications: thongBaoRows,
    shifts: caLamViecRows,
    inventory: inventoryRows,
    receipts: mappedReceipts,
    invoices: invoiceRows,
    payments: paymentRows,
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
  computeEndTime,
  resolveOrCreateCustomer,
  resolveStaffMember,
  generateNextBookingId,
  generateNextOrderId,
  resolveServiceInfo,
  getFullSqlDatabase
};

