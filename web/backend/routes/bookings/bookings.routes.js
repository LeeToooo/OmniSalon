// =========================================================================
// PHÂN HỆ ĐẶT LỊCH HẸN & KHUNG GIỜ
// Bảng CSDL chính: LichHen, ChiTietLichHen, KhachHang, NhanVien, ChiNhanh
// =========================================================================

const { querySql } = require('../../database/db');
const {
  formatTime,
  formatDate,
  computeEndTime,
  resolveOrCreateCustomer,
  generateNextBookingId,
  resolveServiceInfo
} = require('../../services/helper_service');

async function handleBookingRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // GET /api/bookings/available-slots
  // Tra cứu các khung giờ còn trống theo ngày và stylist
  // Tham số: date, stylistId
  if (pathname === '/api/bookings/available-slots' && method === 'GET') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const date = parsedUrl.searchParams.get('date') || todayIso;
    const stylistId = (parsedUrl.searchParams.get('stylistId') || '').trim();

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

    const bookedTimes = new Set(bookedRows.map(r => formatTimeStr(r.GioBatDau)));
    const allSlots = [
      '08:30', '09:30', '10:30', '11:30',
      '13:30', '14:30', '15:30', '16:30',
      '17:30', '18:30', '19:30', '20:30'
    ];
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
    res.end(JSON.stringify(slots));
    return true;
  }

  // GET /api/bookings/lookup - Tra cứu nhanh lịch hẹn theo mã, tên hoặc số điện thoại
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
                SELECT TOP 1 ISNULL(dv.TenDichVu, cb.TenCombo) 
                FROM ChiTietLichHen ctlh 
                LEFT JOIN DichVu dv ON ctlh.MaDichVu = dv.MaDichVu 
                LEFT JOIN ComboDichVu cb ON ctlh.MaCombo = cb.MaCombo
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
    res.end(JSON.stringify(rows));
    return true;
  }

  // GET /api/bookings - Danh sách toàn bộ lịch hẹn
  if (pathname === '/api/bookings' && method === 'GET') {
    const rows = await querySql(`
      SELECT lh.MaLichHen, lh.MaKhachHang, lh.MaNhanVien, lh.MaChiNhanh, 
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
      ORDER BY lh.NgayHen DESC, lh.GioBatDau DESC
    `);

    const bookings = rows.map(r => {
      const cName = r.TenKhachHang || 'Khách Hàng';
      const cPhone = r.SdtKhachHang || '';
      const sName = r.TenDichVu || 'Dịch vụ Salon';
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
    res.end(JSON.stringify(bookings));
    return true;
  }

  // POST /api/bookings - Tạo lịch hẹn mới từ giao diện khách hàng hoặc quầy tiếp tân
  // Quy trình: Phân giải khách hàng -> Chọn chi nhánh & thợ -> Tính giờ kết thúc -> Lưu CSDL
  if (pathname === '/api/bookings' && method === 'POST') {
    const booking = parsedBody || {};

    let id = booking.id || booking.bookingCode;
    if (!id || !id.startsWith('LH') || id.includes('-') || id.length > 20) {
      id = await generateNextBookingId();
    } else {
      const existing = await querySql('SELECT MaLichHen FROM LichHen WHERE MaLichHen = ?', [id]);
      if (existing && existing.length > 0) {
        id = await generateNextBookingId();
      }
    }

    const custName = (booking.customerName || 'Khách Hàng').trim();
    const custPhone = (booking.customerPhone || '').replace(/\s+/g, '').trim();
    const custEmail = (booking.customerEmail || '').trim();
    const khId = await resolveOrCreateCustomer({
      customerId: booking.customerId || booking.userId,
      customerName: custName,
      customerPhone: custPhone,
      customerEmail: custEmail
    });

    let cnId = booking.branchId || 'CN01';
    const validBranch = await querySql('SELECT MaChiNhanh FROM ChiNhanh WHERE MaChiNhanh = ?', [cnId]);
    if (!validBranch || validBranch.length === 0) {
      const firstBranch = await querySql(`SELECT TOP 1 MaChiNhanh FROM ChiNhanh WHERE TrangThai = N'Hoạt động'`);
      cnId = (firstBranch && firstBranch[0]) ? firstBranch[0].MaChiNhanh : 'CN01';
    }

    let nvId = booking.stylistId;
    if (nvId) {
      const validStylist = await querySql('SELECT MaNhanVien FROM NhanVien WHERE MaNhanVien = ?', [nvId]);
      if (!validStylist || validStylist.length === 0) nvId = null;
    }
    if (!nvId) {
      const defaultStylist = await querySql(`SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaChiNhanh = ? AND TrangThai = N'Đang làm việc'`, [cnId]);
      nvId = (defaultStylist && defaultStylist[0]) ? defaultStylist[0].MaNhanVien : 'NV02';
    }

    const srvInfo = await resolveServiceInfo(booking.serviceId, booking.serviceName);

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

    // Chặn đặt lịch ở quá khứ
    const [slotH, slotMin] = rawTime.split(':').map(Number);
    const slotMinutes = (slotH || 0) * 60 + (slotMin || 0);
    const isWalkinOrWaiting = booking.status === 'Waiting' || booking.status === 'waiting' || booking.status === 'Chờ vào ghế' || booking.status === 'In_Progress' || booking.status === 'Đang phục vụ' || booking.isWalkin;
    if (!isWalkinOrWaiting && (date < todayIso || (date === todayIso && slotMinutes < currentMinutes - 5))) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        error: `Khung giờ ${rawTime} ngày ${date} đã trôi qua so với thời gian hiện tại! Vui lòng chọn khung giờ khác.`
      }));
      return true;
    }

    const cleanNotes = (booking.notes || '').replace(/^Khách:\s*[^|;]+(\|.*)?$/i, '').trim();
    const price = parseFloat(booking.totalPrice || srvInfo.price || 120000);
    const deposit = parseFloat(booking.depositAmount || 0);

    // Trạng thái lịch hẹn trong CSDL lưu chuẩn tiếng Việt: 'Chờ vào ghế', 'Đang phục vụ', 'Đã xác nhận'
    const initialStatus = (booking.status === 'Waiting' || booking.status === 'waiting' || booking.status === 'Chờ vào ghế') ? 'Chờ vào ghế' :
      ((booking.status === 'In_Progress' || booking.status === 'in_progress' || booking.status === 'Đang phục vụ') ? 'Đang phục vụ' : 'Đã xác nhận');

    await querySql(
      `INSERT INTO LichHen (MaLichHen, MaKhachHang, MaNhanVien, MaChiNhanh, NgayHen, GioBatDau, GioKetThuc, TrangThai, TongTien, TienCoc, GhiChu, LyDoHuy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [id, khId, nvId, cnId, date, startTime, endTime, initialStatus, price, deposit, cleanNotes || null]
    );

    let itemsToInsert = [];
    if (Array.isArray(booking.servicesList) && booking.servicesList.length > 0) {
      itemsToInsert = booking.servicesList;
    } else if (Array.isArray(booking.serviceIds) && booking.serviceIds.length > 0) {
      itemsToInsert = booking.serviceIds.map(sid => ({ id: sid }));
    } else if (booking.serviceId) {
      itemsToInsert = [{ id: booking.serviceId }];
    } else {
      itemsToInsert = [{ id: 'DV01' }];
    }

    const maxCtlhRows = await querySql(
      `SELECT TOP 1 MaChiTietLichHen FROM ChiTietLichHen WHERE MaChiTietLichHen LIKE 'CTLH%' AND LEN(MaChiTietLichHen) <= 10 ORDER BY LEN(MaChiTietLichHen) DESC, MaChiTietLichHen DESC`
    );
    let nextCtlhNum = 10;
    if (maxCtlhRows && maxCtlhRows[0]) {
      const match = maxCtlhRows[0].MaChiTietLichHen.match(/CTLH(\d+)/i);
      if (match) nextCtlhNum = parseInt(match[1], 10);
    }

    for (let i = 0; i < itemsToInsert.length; i++) {
      const it = itemsToInsert[i];
      const rawId = String(it.id || it.serviceId || it.MaDichVu || it.MaCombo || '').trim();
      const upperId = rawId.toUpperCase();
      let sId = null;
      let cbId = null;
      let itPrice = parseFloat(it.price || it.DonGia || 0);

      if (upperId.startsWith('CB')) {
        cbId = upperId;
        if (!itPrice) {
          const cbRow = await querySql('SELECT GiaCombo FROM ComboDichVu WHERE MaCombo = ?', [cbId]);
          if (cbRow && cbRow[0]) itPrice = parseFloat(cbRow[0].GiaCombo || 0);
        }
      } else if (upperId.startsWith('DV')) {
        sId = upperId;
        if (!itPrice) {
          const dvRow = await querySql('SELECT Gia FROM DichVu WHERE MaDichVu = ?', [sId]);
          if (dvRow && dvRow[0]) itPrice = parseFloat(dvRow[0].Gia || 0);
        }
      } else {
        const resolved = await resolveServiceInfo(rawId, it.name);
        if (resolved.isCombo) {
          cbId = resolved.id;
          if (!itPrice) itPrice = resolved.price;
        } else {
          sId = resolved.id;
          if (!itPrice) itPrice = resolved.price;
        }
      }

      nextCtlhNum++;
      const ctlhId = 'CTLH' + (nextCtlhNum < 10 ? '0' + nextCtlhNum : nextCtlhNum);
      await querySql(
        `INSERT INTO ChiTietLichHen (MaChiTietLichHen, MaLichHen, MaDichVu, MaCombo, SoLuong, DonGia, ThanhTien) VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [ctlhId, id, sId, cbId, itPrice, itPrice]
      );
    }

    try {
      const maxTb = await querySql(`SELECT TOP 1 MaThongBao FROM ThongBao WHERE MaThongBao LIKE 'TB%' ORDER BY LEN(MaThongBao) DESC, MaThongBao DESC`).catch(() => []);
      let nextTb = 11;
      if (maxTb && maxTb[0]) {
        const m = maxTb[0].MaThongBao.match(/TB(\d+)/i);
        if (m) nextTb = parseInt(m[1], 10) + 1;
      }
      const tbId = 'TB' + (nextTb < 10 ? '0' + nextTb : nextTb);
      await querySql(
        `INSERT INTO ThongBao (MaThongBao, MaTaiKhoan, MaKhachHang, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, TrangThaiDoc) VALUES (?, NULL, ?, ?, ?, ?, GETDATE(), 0)`,
        [tbId, khId, 'Xác nhận đặt lịch hẹn thành công', `Lịch hẹn #${id} của bạn đã được xác nhận vào lúc ${startTime.slice(0, 5)} ngày ${date}. Cảm ơn bạn đã lựa chọn OmniSalon!`, 'Lịch hẹn']
      );
    } catch (e) {
      console.warn('[ThongBao] Lỗi tạo thông báo đặt lịch:', e.message);
    }

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
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
        status: initialStatus === 'Chờ vào ghế' ? 'Waiting' : (initialStatus === 'Đang phục vụ' ? 'in_progress' : 'Confirmed'),
        TrangThai: initialStatus
      }
    }));
    return true;
  }

  // PUT / PATCH / DELETE /api/bookings/:id - Cập nhật trạng thái
  if (pathname.startsWith('/api/bookings/') && (method === 'DELETE' || method === 'PUT' || method === 'PATCH')) {
    const id = pathname.replace('/api/bookings/', '').replace('/cancel', '').replace('/status', '').replace('/checkin', '').trim();
    const b = parsedBody || {};

    if (method === 'DELETE' || b.status === 'Cancelled' || b.status === 'cancelled' || b.status === 'Đã hủy' || pathname.includes('/cancel')) {
      const reason = b.cancellationReason || b.reason || 'Khách hủy lịch';
      await querySql(`UPDATE LichHen SET TrangThai = N'Đã hủy', LyDoHuy = ? WHERE MaLichHen = ?`, [reason, id]);
    } else if (pathname.includes('/checkin') || b.status === 'In_Progress' || b.status === 'in_progress' || b.status === 'Đang phục vụ') {
      await querySql(`UPDATE LichHen SET TrangThai = N'Đang phục vụ' WHERE MaLichHen = ?`, [id]);
    } else if (b.status === 'Waiting' || b.status === 'waiting' || b.status === 'Chờ vào ghế') {
      await querySql(`UPDATE LichHen SET TrangThai = N'Chờ vào ghế' WHERE MaLichHen = ?`, [id]);
    } else if (b.status === 'Completed' || b.status === 'completed' || b.status === 'Hoàn thành') {
      await querySql(`UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = ?`, [id]);
    } else if (b.status === 'Confirmed' || b.status === 'confirmed' || b.status === 'Đã xác nhận') {
      await querySql(`UPDATE LichHen SET TrangThai = N'Đã xác nhận' WHERE MaLichHen = ?`, [id]);
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
    res.end(JSON.stringify({ success: true, message: 'Đã cập nhật trạng thái lịch hẹn trong SQL Server', id }));
    return true;
  }

  return false;
}

module.exports = handleBookingRoutes;
module.exports.handleBookingRoutes = handleBookingRoutes;
module.exports.default = handleBookingRoutes;

