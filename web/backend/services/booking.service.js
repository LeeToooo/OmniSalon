const { querySql } = require('../database/db');
const {
  formatTime,
  formatDate,
  computeEndTime,
  resolveOrCreateCustomer,
  generateNextBookingId,
  generateNextCtlhId,
  resolveServiceInfo
} = require('./helper_service');

const BookingService = {
  // Lấy các khung giờ còn trống
  async getAvailableSlots({ date, stylistId }) {
    let bookedRows = [];
    if (stylistId && stylistId !== 'all') {
      bookedRows = await querySql(
        `SELECT CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau 
         FROM LichHen lh
         LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
         WHERE (lh.MaNhanVien = ? OR nv.HoTen LIKE ?) 
           AND CONVERT(VARCHAR(10), lh.NgayHen, 120) = ? 
           AND lh.TrangThai NOT IN (N'Đã hủy')`,
        [stylistId, `%${stylistId}%`, date]
      );
    } else {
      bookedRows = await querySql(
        `SELECT CONVERT(VARCHAR(8), GioBatDau) AS GioBatDau 
         FROM LichHen 
         WHERE CONVERT(VARCHAR(10), NgayHen, 120) = ? AND TrangThai NOT IN (N'Đã hủy')`,
        [date]
      );
    }

    const formatTimeStr = (val) => {
      if (!val) return '';
      const str = String(val).trim();
      const parts = str.split(':');
      return parts.length >= 2 ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : str.substring(0, 5);
    };

    const bookedSlotSet = new Set(
      bookedRows.map(r => formatTimeStr(r.GioBatDau)).filter(Boolean)
    );

    const fullSlots = [
      '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
      '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
    ];

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return fullSlots.map(time => {
      let isAvailable = !bookedSlotSet.has(time);
      if (date === todayIso) {
        const [h, min] = time.split(':').map(Number);
        if (h * 60 + min <= currentMinutes) {
          isAvailable = false;
        }
      }
      return { time, available: isAvailable };
    });
  },

  // Danh sách lịch hẹn
  async getBookings({ branch, status, date, phone, user }) {
    let sql = `
      SELECT 
        lh.MaLichHen,
        CONVERT(VARCHAR(10), lh.NgayHen, 120) AS NgayHen,
        CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau,
        CONVERT(VARCHAR(8), lh.GioKetThuc) AS GioKetThuc,
        lh.TrangThai,
        lh.GhiChu,
        lh.MaKhachHang,
        kh.HoTen AS TenKhachHang,
        kh.SoDienThoai,
        lh.MaNhanVien,
        nv.HoTen AS TenNhanVien,
        lh.MaChiNhanh,
        cn.TenChiNhanh,
        (
          SELECT 
            dv.TenDichVu,
            dv.GiaTien,
            ct.GhiChu
          FROM ChiTietLichHen ct
          JOIN DichVu dv ON ct.MaDichVu = dv.MaDichVu
          WHERE ct.MaLichHen = lh.MaLichHen
          FOR JSON PATH
        ) AS DanhSachDichVuJson
      FROM LichHen lh
      LEFT JOIN KhachHang kh ON lh.MaKhachHang = kh.MaKhachHang
      LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
      LEFT JOIN ChiNhanh cn ON lh.MaChiNhanh = cn.MaChiNhanh
      WHERE 1=1
    `;
    const params = [];

    if (user && user.role === 'STAFF') {
      sql += ' AND lh.MaNhanVien = ?';
      params.push(user.maNhanVien || user.id);
    }

    if (branch && branch !== 'all') {
      sql += ' AND lh.MaChiNhanh = ?';
      params.push(branch);
    }
    if (status && status !== 'all') {
      sql += ' AND lh.TrangThai = ?';
      params.push(status);
    }
    if (date) {
      sql += ' AND CONVERT(VARCHAR(10), lh.NgayHen, 120) = ?';
      params.push(date);
    }
    if (phone) {
      sql += ' AND kh.SoDienThoai LIKE ?';
      params.push(`%${phone}%`);
    }

    sql += ' ORDER BY lh.NgayHen DESC, lh.GioBatDau DESC';
    const rows = await querySql(sql, params);

    return rows.map(r => {
      let services = [];
      try {
        services = r.DanhSachDichVuJson ? JSON.parse(r.DanhSachDichVuJson) : [];
      } catch (e) {
        services = [];
      }
      return {
        id: r.MaLichHen,
        date: formatDate(r.NgayHen),
        startTime: formatTime(r.GioBatDau),
        endTime: formatTime(r.GioKetThuc),
        status: r.TrangThai,
        note: r.GhiChu,
        customer: {
          id: r.MaKhachHang,
          name: r.TenKhachHang,
          phone: r.SoDienThoai
        },
        stylist: {
          id: r.MaNhanVien,
          name: r.TenNhanVien
        },
        branch: {
          id: r.MaChiNhanh,
          name: r.TenChiNhanh
        },
        services
      };
    });
  },

  // Tạo lịch hẹn mới
  async createBooking(body) {
    const {
      customerName,
      customerPhone,
      stylistId,
      branchId,
      date,
      time,
      serviceIds = [],
      note = '',
      items = []
    } = body;

    if (!customerPhone || !date || !time) {
      throw new Error('Thiếu thông tin bắt buộc: số điện thoại, ngày hẹn, giờ hẹn');
    }

    const customerId = await resolveOrCreateCustomer(customerPhone, customerName);
    const newBookingId = await generateNextBookingId();
    const endTime = computeEndTime(time, 45);

    let finalStylistId = stylistId;
    if (!finalStylistId || finalStylistId === 'all') {
      const availableStylists = await querySql(
        `SELECT TOP 1 MaNhanVien FROM NhanVien WHERE TrangThaiLamViec = N'Đang làm việc' AND (MaChiNhanh = ? OR ? IS NULL)`,
        [branchId || null, branchId || null]
      );
      finalStylistId = availableStylists.length > 0 ? availableStylists[0].MaNhanVien : null;
    }

    await querySql(
      `INSERT INTO LichHen (MaLichHen, MaKhachHang, MaNhanVien, MaChiNhanh, NgayHen, GioBatDau, GioKetThuc, TrangThai, GhiChu)
       VALUES (?, ?, ?, ?, ?, ?, ?, N'Chờ xác nhận', ?)`,
      [newBookingId, customerId, finalStylistId, branchId || 'CN01', date, time, endTime, note]
    );

    let allServicesToAdd = [];
    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      allServicesToAdd = serviceIds.map(id => ({ id, type: 'service' }));
    } else if (Array.isArray(items) && items.length > 0) {
      allServicesToAdd = items;
    }

    for (const item of allServicesToAdd) {
      const itemId = typeof item === 'object' ? item.id : item;
      const ctlhId = await generateNextCtlhId();
      const serviceInfo = await resolveServiceInfo(itemId);
      if (serviceInfo) {
        await querySql(
          `INSERT INTO ChiTietLichHen (MaChiTietLH, MaLichHen, MaDichVu, DonGiaTaiThoiDiem, GhiChu)
           VALUES (?, ?, ?, ?, ?)`,
          [ctlhId, newBookingId, serviceInfo.id, serviceInfo.price, note]
        );
      }
    }

    return { bookingId: newBookingId, status: 'Chờ xác nhận' };
  },

  // Cập nhật trạng thái
  async updateStatus(bookingId, status, note = null) {
    if (!bookingId || !status) {
      throw new Error('Thiếu mã lịch hẹn hoặc trạng thái');
    }
    const updateSql = note !== null
      ? `UPDATE LichHen SET TrangThai = ?, GhiChu = ? WHERE MaLichHen = ?`
      : `UPDATE LichHen SET TrangThai = ? WHERE MaLichHen = ?`;
    const params = note !== null ? [status, note, bookingId] : [status, bookingId];
    await querySql(updateSql, params);
    return true;
  },

  // Hủy lịch hẹn
  async cancelBooking(bookingId, reason = '') {
    if (!bookingId) {
      throw new Error('Thiếu mã lịch hẹn');
    }
    await querySql(
      `UPDATE LichHen SET TrangThai = N'Đã hủy', GhiChu = CONCAT(ISNULL(GhiChu, ''), N' [Lý do hủy: ', ?, N']') WHERE MaLichHen = ?`,
      [reason, bookingId]
    );
    return true;
  }
};

module.exports = BookingService;

