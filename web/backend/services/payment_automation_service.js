const { querySql } = require('../database/db');

// Bộ nhớ cache tạm các giao dịch thanh toán thành công gần nhất (lưu trong 30 phút)
const recentPaymentsCache = new Map();

/**
 * Bóc tách mã lịch hẹn (LH...), đơn hàng (DH...) hoặc hóa đơn (HD...) từ nội dung chuyển khoản
 * @param {string} text - Nội dung chuyển khoản hoặc mô tả giao dịch từ ngân hàng
 * @returns {{ type: 'booking'|'order'|'invoice'|null, code: string|null }}
 */
function parsePaymentContent(text) {
  if (!text || typeof text !== 'string') return { type: null, code: null };

  const clean = text.toUpperCase().replace(/[^A-Z0-9_\-\s]/g, ' ');

  // 1. Khớp pattern THANHTOAN <MÃ>
  const ttMatch = clean.match(/THANHTOAN\s+([A-Z0-9_\-]+)/);
  if (ttMatch && ttMatch[1]) {
    const rawCode = ttMatch[1].trim();
    if (rawCode.startsWith('LH')) return { type: 'booking', code: rawCode };
    if (rawCode.startsWith('DH')) return { type: 'order', code: rawCode };
    if (rawCode.startsWith('HD')) return { type: 'invoice', code: rawCode };
    return { type: 'booking', code: rawCode };
  }

  // 2. Khớp trực tiếp mã Lịch hẹn LH[0-9]+
  const lhMatch = clean.match(/\b(LH[0-9A-Z_]+)\b/);
  if (lhMatch && lhMatch[1]) {
    return { type: 'booking', code: lhMatch[1].trim() };
  }

  // 3. Khớp trực tiếp mã Đơn hàng DH[0-9]+
  const dhMatch = clean.match(/\b(DH[0-9A-Z_]+)\b/);
  if (dhMatch && dhMatch[1]) {
    return { type: 'order', code: dhMatch[1].trim() };
  }

  // 4. Khớp mã Hóa đơn HD[0-9]+
  const hdMatch = clean.match(/\b(HD[0-9A-Z_]+)\b/);
  if (hdMatch && hdMatch[1]) {
    return { type: 'invoice', code: hdMatch[1].trim() };
  }

  return { type: null, code: null };
}

/**
 * Sinh mã thanh toán kế tiếp (TT...)
 */
async function generateNextPaymentId() {
  try {
    const rows = await querySql('SELECT MaThanhToan FROM ThanhToan');
    let maxNum = 0;
    (rows || []).forEach(r => {
      const m = (r.MaThanhToan || '').match(/\d+/g);
      if (m) {
        const n = parseInt(m[m.length - 1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `TT${String(maxNum + 1).padStart(3, '0')}`;
  } catch (e) {
    return `TT${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Sinh mã hóa đơn kế tiếp (HD...)
 */
async function generateNextInvoiceId() {
  try {
    const rows = await querySql('SELECT MaHoaDon FROM HoaDon');
    let maxNum = 0;
    (rows || []).forEach(r => {
      const m = (r.MaHoaDon || '').match(/\d+/g);
      if (m) {
        const n = parseInt(m[m.length - 1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `HD${String(maxNum + 1).padStart(3, '0')}`;
  } catch (e) {
    return `HD${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Xử lý giao dịch nhận tiền từ ngân hàng (Webhook / SePay / Casso / Simulator)
 */
async function processBankTransfer({
  gateway = 'MBBank',
  accountNumber = '0900000000',
  transferAmount = 0,
  content = '',
  referenceCode = '',
  transactionDate = new Date()
}) {
  const amount = Number(transferAmount) || 0;
  const ref = referenceCode || `VQR${Date.now().toString().slice(-8)}`;
  const { type, code } = parsePaymentContent(content);

  if (!code) {
    return {
      success: false,
      message: 'Không tìm thấy mã lịch hẹn (LH) hoặc đơn hàng (DH) trong nội dung chuyển khoản.',
      rawContent: content
    };
  }

  let matchedType = type;
  let targetRecord = null;
  let customerId = 'KH01';
  let branchId = 'CN01';
  let invoiceId = null;

  // 1. Kiểm tra Lịch Hẹn
  if (type === 'booking' || !type) {
    const lhRows = await querySql(
      'SELECT MaLichHen, MaKhachHang, MaChiNhanh, TongTien, TienCoc, TrangThai FROM LichHen WHERE MaLichHen = ?',
      [code]
    );
    if (lhRows && lhRows.length > 0) {
      targetRecord = lhRows[0];
      matchedType = 'booking';
      customerId = targetRecord.MaKhachHang || 'KH01';
      branchId = targetRecord.MaChiNhanh || 'CN01';
    }
  }

  // 2. Nếu không phải lịch hẹn, kiểm tra Đơn Hàng
  if (!targetRecord && (type === 'order' || !type)) {
    const dhRows = await querySql(
      'SELECT MaDonHang, MaKhachHang, MaChiNhanh, TongTien, TrangThai FROM DonHang WHERE MaDonHang = ?',
      [code]
    );
    if (dhRows && dhRows.length > 0) {
      targetRecord = dhRows[0];
      matchedType = 'order';
      customerId = targetRecord.MaKhachHang || 'KH01';
      branchId = targetRecord.MaChiNhanh || 'CN01';
    }
  }

  if (!targetRecord) {
    return {
      success: false,
      message: `Không tìm thấy bản ghi tương ứng với mã #${code} trong CSDL.`,
      code
    };
  }

  // 3. Cập nhật trạng thái đối tượng tương ứng
  if (matchedType === 'booking') {
    await querySql(
      `UPDATE LichHen 
       SET TrangThai = N'Đã xác nhận', 
           TienCoc = CASE WHEN TienCoc IS NULL OR TienCoc = 0 THEN ? ELSE TienCoc END 
       WHERE MaLichHen = ?`,
      [amount, code]
    );
  } else if (matchedType === 'order') {
    await querySql(
      `UPDATE DonHang 
       SET TrangThai = N'Đang đóng gói' 
       WHERE MaDonHang = ?`,
      [code]
    );
  }

  // 4. Tìm hoặc tạo Hóa Đơn (HoaDon) cho lịch hẹn / đơn hàng này
  const colName = matchedType === 'booking' ? 'MaLichHen' : 'MaDonHang';
  const hdRows = await querySql(`SELECT MaHoaDon, TongTien FROM HoaDon WHERE ${colName} = ?`, [code]);

  if (hdRows && hdRows.length > 0) {
    invoiceId = hdRows[0].MaHoaDon;
    await querySql(
      `UPDATE HoaDon SET TrangThai = N'Đã thanh toán' WHERE MaHoaDon = ?`,
      [invoiceId]
    );
  } else {
    invoiceId = await generateNextInvoiceId();
    const finalLh = matchedType === 'booking' ? code : null;
    const finalDh = matchedType === 'order' ? code : null;
    const invNo = `INV-VQR-${Date.now().toString().slice(-6)}`;
    await querySql(
      `INSERT INTO HoaDon (MaHoaDon, MaKhachHang, MaLichHen, MaDonHang, MaChiNhanh, NgayLap, TongTien, TrangThai, MaSoHoaDon)
       VALUES (?, ?, ?, ?, ?, GETDATE(), ?, N'Đã thanh toán', ?)`,
      [invoiceId, customerId, finalLh, finalDh, branchId, amount || targetRecord.TongTien || 0, invNo]
    );
  }

  // 5. Ghi nhận giao dịch vào bảng ThanhToan
  const paymentId = await generateNextPaymentId();
  const staffRows = await querySql('SELECT TOP 1 MaNhanVien FROM NhanVien ORDER BY MaNhanVien');
  const staffId = (staffRows && staffRows[0] && staffRows[0].MaNhanVien) || 'NV01';

  await querySql(
    `INSERT INTO ThanhToan (MaThanhToan, MaHoaDon, MaNhanVien, SoTien, PhuongThuc, ThoiGianThanhToan, TrangThai, MaGiaoDich)
     VALUES (?, ?, ?, ?, N'VietQR', GETDATE(), N'Thành công', ?)`,
    [paymentId, invoiceId, staffId, amount || targetRecord.TongTien || 0, ref]
  );

  // 6. Lưu vào cache nhanh để phục vụ realtime polling
  const confirmedData = {
    isPaid: true,
    code,
    type: matchedType,
    amount: amount || targetRecord.TongTien || 0,
    gateway,
    referenceCode: ref,
    invoiceId,
    paymentId,
    paidAt: new Date().toISOString()
  };
  recentPaymentsCache.set(code.toUpperCase(), confirmedData);

  return {
    success: true,
    message: `Đã tự động xác nhận thanh toán thành công cho #${code}!`,
    data: confirmedData
  };
}

/**
 * Tra cứu trạng thái thanh toán thời gian thực theo mã
 */
async function checkPaymentStatus(targetCode) {
  if (!targetCode) return { isPaid: false };
  const upper = String(targetCode).trim().toUpperCase();

  // 1. Kiểm tra cache tức thì
  if (recentPaymentsCache.has(upper)) {
    return recentPaymentsCache.get(upper);
  }

  // 2. Tra cứu trong CSDL SQL Server
  // Kiểm tra Lịch hẹn
  const lh = await querySql(
    `SELECT lh.MaLichHen, lh.TrangThai, lh.TongTien, lh.TienCoc,
            hd.MaHoaDon, hd.TrangThai AS TrangThaiHoaDon,
            tt.MaThanhToan, tt.MaGiaoDich, tt.SoTien,
            CONVERT(VARCHAR(19), tt.ThoiGianThanhToan, 120) AS ThoiGianThanhToan
     FROM LichHen lh
     LEFT JOIN HoaDon hd ON lh.MaLichHen = hd.MaLichHen
     LEFT JOIN ThanhToan tt ON hd.MaHoaDon = tt.MaHoaDon
     WHERE lh.MaLichHen = ?`,
    [upper]
  );

  if (lh && lh.length > 0) {
    const row = lh[0];
    const isPaid = (row.TrangThaiHoaDon === 'Đã thanh toán' || !!row.MaThanhToan || (row.TienCoc && row.TienCoc > 0));
    const result = {
      isPaid: Boolean(isPaid),
      code: upper,
      type: 'booking',
      amount: row.SoTien || row.TongTien || 0,
      status: isPaid ? 'Paid' : 'Unpaid',
      transactionCode: row.MaGiaoDich || null,
      paidAt: row.ThoiGianThanhToan || null
    };
    if (isPaid) recentPaymentsCache.set(upper, result);
    return result;
  }

  // Kiểm tra Đơn hàng
  const dh = await querySql(
    `SELECT dh.MaDonHang, dh.TrangThai, dh.TongTien,
            hd.MaHoaDon, hd.TrangThai AS TrangThaiHoaDon,
            tt.MaThanhToan, tt.MaGiaoDich, tt.SoTien,
            CONVERT(VARCHAR(19), tt.ThoiGianThanhToan, 120) AS ThoiGianThanhToan
     FROM DonHang dh
     LEFT JOIN HoaDon hd ON dh.MaDonHang = hd.MaDonHang
     LEFT JOIN ThanhToan tt ON hd.MaHoaDon = tt.MaHoaDon
     WHERE dh.MaDonHang = ?`,
    [upper]
  );

  if (dh && dh.length > 0) {
    const row = dh[0];
    const isPaid = (row.TrangThaiHoaDon === 'Đã thanh toán' || !!row.MaThanhToan || row.TrangThai === 'Đang đóng gói' || row.TrangThai === 'Đang giao' || row.TrangThai === 'Hoàn tất');
    const result = {
      isPaid: Boolean(isPaid),
      code: upper,
      type: 'order',
      amount: row.SoTien || row.TongTien || 0,
      status: isPaid ? 'Paid' : 'Unpaid',
      transactionCode: row.MaGiaoDich || null,
      paidAt: row.ThoiGianThanhToan || null
    };
    if (isPaid) recentPaymentsCache.set(upper, result);
    return result;
  }

  return { isPaid: false, code: upper, status: 'Not_Found' };
}

module.exports = {
  parsePaymentContent,
  processBankTransfer,
  checkPaymentStatus,
  recentPaymentsCache
};

