const { querySql } = require('../../database/db');
const { enforceAuth, extractAuthUser, isStaffRole, normalizeAuthRole } = require('../../middlewares/auth_middleware');
const auditService = require('../../services/audit.service');
const { clearDbSnapshotCache } = require('../auth/accounts.routes');
const {
  formatTime,
  formatDate,
  getLocalIsoDate,
  computeEndTime,
  resolveOrCreateCustomer,
  generateNextBookingId,
  generateNextCtlhId,
  resolveServiceInfo
} = require('../../services/helper_service');
const {
  checkAndAutoCancelOnRequest,
  autoCancelOverdueBookingsAndOrders
} = require('../../services/auto_cancel_service');

async function handleBookingRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // POST /api/bookings/auto-cancel-overdue - Kích hoạt tự động hủy lịch hẹn quá hạn (chỉ Admin/Quản lý)
  if (pathname === '/api/bookings/auto-cancel-overdue' && method === 'POST') {
    const authUser = enforceAuth(req, res, ['SUPER_ADMIN', 'BRANCH_MANAGER']);
    if (!authUser) return true;

    const result = await autoCancelOverdueBookingsAndOrders();
    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
    return true;
  }

  // GET /api/bookings/available-slots
  // Tra cứu các khung giờ còn trống theo ngày và stylist
  // Tham số: date, stylistId
  if (pathname === '/api/bookings/available-slots' && method === 'GET') {
    await checkAndAutoCancelOnRequest();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const date = parsedUrl.searchParams.get('date') || todayIso;
    const stylistId = (parsedUrl.searchParams.get('stylistId') || '').trim();

    const duration = Math.max(15, parseInt(parsedUrl.searchParams.get('duration') || parsedUrl.searchParams.get('durationMinutes') || '45', 10) || 45);
    const parseTimeToMinutes = (val) => {
      if (!val) return null;
      const parts = String(val).trim().split(':');
      if (parts.length < 2) return null;
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    };

    let bookedIntervals = [];
    if (stylistId && stylistId !== 'all') {
      const rows = await querySql(
        `SELECT CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau,
                CONVERT(VARCHAR(8), lh.GioKetThuc) AS GioKetThuc
         FROM LichHen lh
         LEFT JOIN NhanVien nv ON lh.MaNhanVien = nv.MaNhanVien
         WHERE (lh.MaNhanVien = ? OR nv.HoTen LIKE ?) 
           AND CONVERT(VARCHAR(10), lh.NgayHen, 120) = ? 
           AND lh.TrangThai NOT IN (N'Đã hủy')`,
        [stylistId, `%${stylistId}%`, date]
      );
      bookedIntervals = (rows || []).map(r => {
        const startMin = parseTimeToMinutes(r.GioBatDau);
        const rawEnd = parseTimeToMinutes(r.GioKetThuc);
        const endMin = (rawEnd !== null && startMin !== null && rawEnd > startMin) ? rawEnd : (startMin !== null ? startMin + 45 : null);
        return { startMin, endMin };
      }).filter(it => it.startMin !== null && it.endMin !== null);
    } else {
      const [rows, activeStaffRows] = await Promise.all([
        querySql(
          `SELECT lh.MaNhanVien,
                  CONVERT(VARCHAR(8), lh.GioBatDau) AS GioBatDau,
                  CONVERT(VARCHAR(8), lh.GioKetThuc) AS GioKetThuc
           FROM LichHen lh
           WHERE CONVERT(VARCHAR(10), lh.NgayHen, 120) = ? AND lh.TrangThai NOT IN (N'Đã hủy')`,
          [date]
        ),
        querySql(`SELECT COUNT(*) AS TotalStaff FROM NhanVien WHERE TrangThai = N'Đang làm việc'`)
      ]);
      const totalActiveStaff = Math.max(1, parseInt(activeStaffRows?.[0]?.TotalStaff || 1, 10));
      bookedIntervals = (rows || []).map(r => {
        const startMin = parseTimeToMinutes(r.GioBatDau);
        const rawEnd = parseTimeToMinutes(r.GioKetThuc);
        const endMin = (rawEnd !== null && startMin !== null && rawEnd > startMin) ? rawEnd : (startMin !== null ? startMin + 45 : null);
        return { stylistId: r.MaNhanVien, startMin, endMin };
      }).filter(it => it.startMin !== null && it.endMin !== null);

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
        const slotEnd = slotStart + duration;
        const isPast = isPastDate || (isToday && slotStart <= currentMinutes);
        const busyStaffSet = new Set(
          bookedIntervals
            .filter(it => slotStart < it.endMin && slotEnd > it.startMin)
            .map(it => it.stylistId || '__busy')
        );
        const isBooked = busyStaffSet.size >= totalActiveStaff;
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
      const slotEnd = slotStart + duration;
      const isPast = isPastDate || (isToday && slotStart <= currentMinutes);
      const isBooked = bookedIntervals.some(it => slotStart < it.endMin && slotEnd > it.startMin);
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

  // GET /api/bookings/lookup - Tra cứu nhanh lịch hẹn (bắt buộc đăng nhập & lọc theo quyền/chủ sở hữu)
  if (pathname === '/api/bookings/lookup' && method === 'GET') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    await checkAndAutoCancelOnRequest();
    const q = (parsedUrl.searchParams.get('q') || '').trim();
    if (!q && !isStaffRole(authUser)) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify([]));
      return true;
    }

    const params = [`%${q}%`, `%${q}%`, `%${q}%`];
    let ownerFilter = '';
    if (!isStaffRole(authUser)) {
      if (!authUser.customerId) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify([]));
        return true;
      }
      ownerFilter = ' AND lh.MaKhachHang = ? ';
      params.push(authUser.customerId);
    } else if (!authUser.isSuperAdmin && authUser.branchId) {
      ownerFilter = ' AND lh.MaChiNhanh = ? ';
      params.push(authUser.branchId);
    }

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
       WHERE (lh.MaLichHen LIKE ? OR kh.SoDienThoai LIKE ? OR kh.HoTen LIKE ?)
       ${ownerFilter}
       ORDER BY 
         CASE WHEN lh.MaLichHen LIKE 'LH[0-9]%' 
              THEN CAST(SUBSTRING(lh.MaLichHen, 3, 10) AS INT) 
              ELSE 0 END DESC,
         lh.NgayHen DESC, lh.GioBatDau DESC`,
      params
    );

    const allBookingItems = await querySql(`
      SELECT ctlh.MaChiTietLichHen, ctlh.MaLichHen, ctlh.MaDichVu, ctlh.MaCombo, ctlh.SoLuong, ctlh.DonGia, ctlh.ThanhTien,
             ISNULL(dv.TenDichVu, cb.TenCombo) AS TenDichVu,
             ISNULL(dv.HinhAnh, cb.HinhAnh) AS HinhAnh,
             ISNULL(dv.ThoiLuong, cb.ThoiLuong) AS ThoiLuong,
             ISNULL(dv.Gia, cb.GiaCombo) AS Gia
      FROM ChiTietLichHen ctlh
      LEFT JOIN DichVu dv ON ctlh.MaDichVu = dv.MaDichVu
      LEFT JOIN ComboDichVu cb ON ctlh.MaCombo = cb.MaCombo
    `);

    const mapped = (rows || []).map(r => {
      const items = (allBookingItems || [])
        .filter(it => it.MaLichHen === r.MaLichHen)
        .map(it => ({
          id: it.MaChiTietLichHen,
          serviceId: it.MaDichVu || it.MaCombo,
          serviceName: it.TenDichVu || 'Dịch vụ Salon',
          name: it.TenDichVu || 'Dịch vụ Salon',
          price: parseFloat(it.ThanhTien || it.DonGia || it.Gia || 0),
          quantity: it.SoLuong || 1,
          duration: it.ThoiLuong || 30,
          image: it.HinhAnh || ''
        }));

      const isProgress = (r.TrangThai === 'Đang phục vụ' || r.TrangThai === 'In_Progress' || r.TrangThai === 'in_progress');
      const uiStatus = (r.TrangThai === 'Hoàn thành' || r.TrangThai === 'Completed') ? 'Completed' :
        ((r.TrangThai === 'Đã hủy' || r.TrangThai === 'Cancelled') ? 'Cancelled' :
        (isProgress ? 'in_progress' :
        ((r.TrangThai === 'Chờ vào ghế' || r.TrangThai === 'Waiting' || r.TrangThai === 'waiting') ? 'waiting' : 'Confirmed')));

      return {
        ...r,
        id: r.MaLichHen,
        bookingCode: r.MaLichHen,
        customerId: r.MaKhachHang,
        userId: r.MaKhachHang,
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
        serviceId: (items[0] && items[0].serviceId) || 'DV01',
        serviceName: (items[0] && items[0].serviceName) || r.TenDichVu || 'Dịch vụ Salon',
        serviceImage: (items[0] && items[0].image) || '',
        totalPrice: parseFloat(r.TongTien || 0),
        servicesList: items,
        items
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(mapped));
    return true;
  }

  // GET /api/bookings hoặc /api/bookings/my-history - Danh sách lịch hẹn (lọc theo quyền & chủ sở hữu JWT)
  if ((pathname === '/api/bookings' || pathname === '/api/bookings/my-history') && method === 'GET') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    await checkAndAutoCancelOnRequest();
    const isMyHistory = (pathname === '/api/bookings/my-history');
    const branchParam = parsedUrl.searchParams.get('branch_id');
    let effectiveBranch = branchParam;

    if (!isMyHistory && !authUser.isSuperAdmin && isStaffRole(authUser) && authUser.branchId) {
      if (branchParam && branchParam !== 'all' && branchParam !== authUser.branchId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Bạn chỉ được xem lịch hẹn của chi nhánh mình phụ trách.' }));
        return true;
      }
      effectiveBranch = authUser.branchId;
    }

    if ((isMyHistory || !isStaffRole(authUser)) && !authUser.customerId) {
      if (!isMyHistory || !authUser.staffId) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify([]));
        return true;
      }
    }

    let q = `
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
    `;
    const conditions = [];
    const params = [];
    if (isMyHistory) {
      if (authUser.customerId) {
        conditions.push(`lh.MaKhachHang = ?`);
        params.push(authUser.customerId);
      } else {
        conditions.push(`lh.MaNhanVien = ?`);
        params.push(authUser.staffId);
      }
    } else if (!isStaffRole(authUser)) {
      conditions.push(`lh.MaKhachHang = ?`);
      params.push(authUser.customerId);
    } else if (effectiveBranch && effectiveBranch !== 'all') {
      conditions.push(`lh.MaChiNhanh = ?`);
      params.push(effectiveBranch);
    }
    if (conditions.length > 0) {
      q += ` WHERE ` + conditions.join(' AND ');
    }
    q += ` ORDER BY 
         CASE WHEN lh.MaLichHen LIKE 'LH[0-9]%' 
              THEN CAST(SUBSTRING(lh.MaLichHen, 3, 10) AS INT) 
              ELSE 0 END DESC,
         lh.NgayHen DESC, lh.GioBatDau DESC`;
    const rows = await querySql(q, params);

    const allBookingItems = await querySql(`
      SELECT ctlh.MaChiTietLichHen, ctlh.MaLichHen, ctlh.MaDichVu, ctlh.MaCombo, ctlh.SoLuong, ctlh.DonGia, ctlh.ThanhTien,
             ISNULL(dv.TenDichVu, cb.TenCombo) AS TenDichVu,
             ISNULL(dv.HinhAnh, cb.HinhAnh) AS HinhAnh,
             ISNULL(dv.ThoiLuong, cb.ThoiLuong) AS ThoiLuong,
             ISNULL(dv.Gia, cb.GiaCombo) AS Gia
      FROM ChiTietLichHen ctlh
      LEFT JOIN DichVu dv ON ctlh.MaDichVu = dv.MaDichVu
      LEFT JOIN ComboDichVu cb ON ctlh.MaCombo = cb.MaCombo
    `);

    const bookings = rows.map(r => {
      const cName = r.TenKhachHang || 'Khách Hàng';
      const cPhone = r.SdtKhachHang || '';
      const items = (allBookingItems || [])
        .filter(it => it.MaLichHen === r.MaLichHen)
        .map(it => ({
          id: it.MaChiTietLichHen,
          serviceId: it.MaDichVu || it.MaCombo,
          serviceName: it.TenDichVu || 'Dịch vụ Salon',
          name: it.TenDichVu || 'Dịch vụ Salon',
          price: parseFloat(it.ThanhTien || it.DonGia || it.Gia || 0),
          quantity: it.SoLuong || 1,
          duration: it.ThoiLuong || 30,
          image: it.HinhAnh || ''
        }));

      const sName = (items[0] && items[0].serviceName) || r.TenDichVu || 'Dịch vụ Salon';
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
        userId: r.MaKhachHang,
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
        serviceId: (items[0] && items[0].serviceId) || r.MaDichVu || 'DV01',
        serviceName: sName,
        serviceImage: (items[0] && items[0].image) || '',
        totalPrice: parseFloat(r.TongTien || 0),
        notes: r.GhiChu || '',
        LyDoHuy: r.LyDoHuy,
        servicesList: items,
        items
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(bookings));
    return true;
  }

  // POST /api/bookings - Tạo lịch hẹn mới từ giao diện khách hàng hoặc quầy tiếp tân
  // Quy trình: Phân giải khách hàng -> Chọn chi nhánh & thợ -> Tính giờ kết thúc -> Lưu CSDL
  if (pathname === '/api/bookings' && method === 'POST') {
    const authUser = extractAuthUser(req);
    const booking = parsedBody || {};

    // Backend luôn là Single Source of Truth cho mã lịch hẹn (LH01 -> LH23 -> LH24...)
    // Tự sinh mã tăng dần chuẩn từ CSDL SQL Server để Web và Mobile luôn đồng đều, không nhảy cóc
    const id = await generateNextBookingId();

    const custName = (booking.customerName || authUser?.fullName || 'Khách Hàng').trim();
    const custPhone = (booking.customerPhone || authUser?.phone || '').replace(/\s+/g, '').trim();
    const custEmail = (booking.customerEmail || authUser?.email || '').trim();
    const requestedCustomerId = (authUser && !isStaffRole(authUser) && authUser.customerId)
      ? authUser.customerId
      : (booking.customerId || booking.userId);
    const khId = await resolveOrCreateCustomer({
      customerId: requestedCustomerId,
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

    let nvId = (booking.stylistId && String(booking.stylistId).toLowerCase() !== 'all' && String(booking.stylistId).toLowerCase() !== 'auto')
      ? String(booking.stylistId).trim()
      : null;
    if (nvId) {
      const validStylist = await querySql('SELECT MaNhanVien FROM NhanVien WHERE MaNhanVien = ?', [nvId]);
      if (!validStylist || validStylist.length === 0) nvId = null;
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

    // Kiểm tra trùng lịch theo giao khoảng [startTime, endTime) hoặc tự động chọn thợ rảnh trong khung giờ tại chi nhánh
    if (!nvId) {
      const freeStylist = await querySql(`
        SELECT TOP 1 nv.MaNhanVien
        FROM NhanVien nv
        WHERE nv.MaChiNhanh = ?
          AND nv.TrangThai = N'Đang làm việc'
          AND NOT EXISTS (
            SELECT 1 FROM LichHen lh
            WHERE lh.MaNhanVien = nv.MaNhanVien
              AND CONVERT(VARCHAR(10), lh.NgayHen, 120) = ?
              AND lh.TrangThai NOT IN (N'Đã hủy')
              AND CAST(? AS TIME) < ISNULL(lh.GioKetThuc, DATEADD(MINUTE, 45, lh.GioBatDau))
              AND CAST(? AS TIME) > lh.GioBatDau
          )
        ORDER BY (
          SELECT COUNT(*) FROM LichHen lh2
          WHERE lh2.MaNhanVien = nv.MaNhanVien
            AND CONVERT(VARCHAR(10), lh2.NgayHen, 120) = ?
            AND lh2.TrangThai NOT IN (N'Đã hủy')
        ) ASC
      `, [cnId, date, startTime, endTime, date]);

      if (!freeStylist || !freeStylist[0]) {
        const anyStaff = await querySql(`SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaChiNhanh = ? AND TrangThai = N'Đang làm việc'`, [cnId]);
        if (anyStaff && anyStaff[0] && !isWalkinOrWaiting) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            error: `Tất cả thợ tại chi nhánh đã kín lịch trong khung giờ ${startTime.slice(0, 5)}–${endTime.slice(0, 5)} ngày ${date}. Vui lòng chọn giờ khác.`
          }));
          return true;
        }
        nvId = (anyStaff && anyStaff[0]) ? anyStaff[0].MaNhanVien : 'NV02';
      } else {
        nvId = freeStylist[0].MaNhanVien;
      }
    } else if (!isWalkinOrWaiting) {
      const conflicts = await querySql(`
        SELECT TOP 1 MaLichHen, CONVERT(VARCHAR(5), GioBatDau, 108) AS GioBatDau, CONVERT(VARCHAR(5), ISNULL(GioKetThuc, DATEADD(MINUTE, 45, GioBatDau)), 108) AS GioKetThuc
        FROM LichHen
        WHERE MaNhanVien = ?
          AND CONVERT(VARCHAR(10), NgayHen, 120) = ?
          AND TrangThai NOT IN (N'Đã hủy')
          AND CAST(? AS TIME) < ISNULL(GioKetThuc, DATEADD(MINUTE, 45, GioBatDau))
          AND CAST(? AS TIME) > GioBatDau
      `, [nvId, date, startTime, endTime]);
      if (conflicts && conflicts.length > 0) {
        const cf = conflicts[0];
        res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: `Thợ ${nvId} đã có lịch hẹn #${cf.MaLichHen} (${cf.GioBatDau}–${cf.GioKetThuc}) ngày ${date}. Vui lòng chọn khung giờ hoặc thợ khác.`
        }));
        return true;
      }
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

      const ctlhId = await generateNextCtlhId();
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

    const actorName = authUser ? (authUser.fullName || authUser.name || authUser.username) : `${custName} (${custPhone})`;
    const actorRole = authUser ? (authUser.role || 'CUSTOMER') : 'CUSTOMER';

    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'CREATE_BOOKING',
      entityType: 'LichHen',
      entityId: id,
      branchId: cnId,
      after: { id, customer: custName, stylist: nvId, service: srvInfo.name, price, date, timeSlot: startTime.substring(0, 5) },
      details: `${actorName} tạo lịch hẹn #${id} dịch vụ ${srvInfo.name} (${date} ${startTime.substring(0, 5)})`
    }).catch(() => {});

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
    clearDbSnapshotCache();
    return true;
  }

  // POST/PUT/PATCH/DELETE /api/bookings/:id - Cập nhật trạng thái hoặc check-in (bắt buộc JWT/X-Admin-Role & kiểm tra quyền/chủ sở hữu)
  if (pathname.startsWith('/api/bookings/') && (method === 'DELETE' || method === 'PUT' || method === 'PATCH' || (method === 'POST' && (pathname.endsWith('/checkin') || pathname.endsWith('/cancel'))))) {
    let authUser = extractAuthUser(req);
    const adminRole = req.headers['x-admin-role'] || req.headers['x-operator-role'];
    const adminOperator = req.headers['x-admin-operator'] || req.headers['x-operator-name'];
    const adminBranch = req.headers['x-admin-branch'] || req.headers['x-branch-id'];

    if (!authUser || !['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'STAFF'].includes(normalizeAuthRole(authUser.role))) {
      if (adminRole && ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'STAFF', 'ADMIN'].includes(String(adminRole).toUpperCase())) {
        const normRole = String(adminRole).toUpperCase() === 'BRANCH_MANAGER' ? 'BRANCH_MANAGER' : (String(adminRole).toUpperCase() === 'CASHIER' ? 'CASHIER' : (String(adminRole).toUpperCase() === 'STAFF' ? 'STAFF' : 'SUPER_ADMIN'));
        authUser = {
          id: 'TK_ADMIN',
          username: 'admin',
          fullName: adminOperator ? decodeURIComponent(adminOperator) : 'Quản trị viên',
          role: normRole,
          branchId: adminBranch || null,
          isSuperAdmin: normRole === 'SUPER_ADMIN',
          isBranchManager: normRole === 'BRANCH_MANAGER'
        };
      } else {
        const enforced = enforceAuth(req, res);
        if (!enforced) return true;
        authUser = enforced;
      }
    } else {
      authUser = {
        ...authUser,
        role: normalizeAuthRole(authUser.role),
        branchId: authUser.branchId || adminBranch || null,
        isSuperAdmin: normalizeAuthRole(authUser.role) === 'SUPER_ADMIN',
        isBranchManager: normalizeAuthRole(authUser.role) === 'BRANCH_MANAGER'
      };
    }

    let rawId = pathname.replace('/api/bookings/', '').replace('/cancel', '').replace('/status', '').replace('/checkin', '').trim();
    rawId = decodeURIComponent(rawId).replace(/^#+/, '').trim();
    const b = parsedBody || {};

    let oldRows = await querySql(
      `SELECT TrangThai, MaChiNhanh, MaKhachHang, MaNhanVien,
              CONVERT(VARCHAR(10), NgayHen, 120) AS NgayHen,
              CONVERT(VARCHAR(8), GioBatDau) AS GioBatDau,
              CONVERT(VARCHAR(8), GioKetThuc) AS GioKetThuc,
              MaLichHen
       FROM LichHen
       WHERE MaLichHen = ? OR MaLichHen = ?`,
      [rawId, '#' + rawId]
    );

    if (!oldRows || oldRows.length === 0) {
      const numMatch = rawId.match(/^\D*(\d+)$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        const pad2 = 'LH' + String(num).padStart(2, '0');
        const pad3 = 'LH' + String(num).padStart(3, '0');
        const noPad = 'LH' + num;
        oldRows = await querySql(
          `SELECT TrangThai, MaChiNhanh, MaKhachHang, MaNhanVien,
                  CONVERT(VARCHAR(10), NgayHen, 120) AS NgayHen,
                  CONVERT(VARCHAR(8), GioBatDau) AS GioBatDau,
                  CONVERT(VARCHAR(8), GioKetThuc) AS GioKetThuc,
                  MaLichHen
           FROM LichHen
           WHERE MaLichHen = ? OR MaLichHen = ? OR MaLichHen = ?`,
          [pad2, pad3, noPad]
        );
      }
    }

    const oldData = (oldRows && oldRows[0]) ? oldRows[0] : null;
    if (!oldData) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: `Không tìm thấy lịch hẹn #${rawId}.` }));
      return true;
    }

    const id = oldData.MaLichHen;
    const rawStatus = String(b.status || b.TrangThai || '').trim();
    const lowerStatus = rawStatus.toLowerCase();
    const isCancel = (method === 'DELETE' || lowerStatus.includes('hủy') || lowerStatus === 'cancelled' || pathname.includes('/cancel'));
    const isReschedule = Boolean(!isCancel && (b.date || b.timeSlot) && !pathname.includes('/checkin') && !b.status && !b.TrangThai);
    const staffUser = isStaffRole(authUser);

    if (!staffUser) {
      if (!authUser.customerId || oldData.MaKhachHang !== authUser.customerId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Bạn chỉ được phép hủy hoặc đổi giờ lịch hẹn của chính mình.' }));
        return true;
      }
      if (!isCancel && !isReschedule) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Khách hàng không thể tự chuyển trạng thái check-in hoặc hoàn thành.' }));
        return true;
      }
    } else if (!authUser.isSuperAdmin && authUser.branchId && authUser.branchId !== 'ALL' && oldData.MaChiNhanh && oldData.MaChiNhanh !== authUser.branchId) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Bạn chỉ được thao tác lịch hẹn thuộc chi nhánh mình phụ trách.' }));
      return true;
    }

    let action = 'UPDATE_BOOKING_STATUS';
    let newStatus = 'Đã xác nhận';
    let afterData = {};

    if (isCancel) {
      const prevSt = (oldData.TrangThai || '').toLowerCase().trim();
      if (!staffUser && (prevSt.includes('đang phục vụ') || prevSt === 'in_progress' || prevSt.includes('hoàn thành') || prevSt === 'completed')) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          message: 'Không thể hủy lịch hẹn đang phục vụ tại ghế hoặc đã hoàn thành!'
        }));
        return true;
      }
      action = 'CANCEL_BOOKING';
      newStatus = 'Đã hủy';
      const reason = b.cancellationReason || b.reason || 'Khách báo bận ca đột xuất';
      await querySql(`UPDATE LichHen SET TrangThai = N'Đã hủy', LyDoHuy = ? WHERE MaLichHen = ?`, [reason, id]);
      afterData = { TrangThai: 'Đã hủy', LyDoHuy: reason };
    } else if (pathname.includes('/checkin') || lowerStatus.includes('in_progress') || lowerStatus.includes('phục vụ') || lowerStatus.includes('đang cắt') || lowerStatus.includes('vào ghế')) {
      newStatus = 'Đang phục vụ';
      if (b.date || b.timeSlot) {
        const newDate = b.date || b.bookingDate || oldData.NgayHen || getLocalIsoDate();
        const newTime = b.timeSlot ? (b.timeSlot.length === 5 ? `${b.timeSlot}:00` : b.timeSlot) : (oldData.GioBatDau || '09:00:00');
        await querySql(`UPDATE LichHen SET TrangThai = N'Đang phục vụ', NgayHen = ?, GioBatDau = ? WHERE MaLichHen = ?`, [newDate, newTime, id]);
        afterData = { TrangThai: newStatus, NgayHen: newDate, GioBatDau: newTime };
      } else {
        await querySql(`UPDATE LichHen SET TrangThai = N'Đang phục vụ' WHERE MaLichHen = ?`, [id]);
        afterData = { TrangThai: newStatus };
      }
    } else if (lowerStatus.includes('waiting') || lowerStatus.includes('chờ vào ghế') || lowerStatus.includes('chờ ghế')) {
      newStatus = 'Chờ vào ghế';
      if (b.date || b.timeSlot) {
        const newDate = b.date || b.bookingDate || oldData.NgayHen || getLocalIsoDate();
        const newTime = b.timeSlot ? (b.timeSlot.length === 5 ? `${b.timeSlot}:00` : b.timeSlot) : (oldData.GioBatDau || '09:00:00');
        await querySql(`UPDATE LichHen SET TrangThai = N'Chờ vào ghế', NgayHen = ?, GioBatDau = ? WHERE MaLichHen = ?`, [newDate, newTime, id]);
        afterData = { TrangThai: newStatus, NgayHen: newDate, GioBatDau: newTime };
      } else {
        await querySql(`UPDATE LichHen SET TrangThai = N'Chờ vào ghế' WHERE MaLichHen = ?`, [id]);
        afterData = { TrangThai: newStatus };
      }
    } else if (lowerStatus.includes('completed') || lowerStatus.includes('hoàn thành') || lowerStatus.includes('xong') || lowerStatus.includes('đã cắt')) {
      newStatus = 'Hoàn thành';
      await querySql(`UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = ?`, [id]);
      afterData = { TrangThai: newStatus };
    } else if (lowerStatus.includes('confirmed') || lowerStatus.includes('xác nhận') || lowerStatus.includes('pending')) {
      newStatus = 'Đã xác nhận';
      await querySql(`UPDATE LichHen SET TrangThai = N'Đã xác nhận' WHERE MaLichHen = ?`, [id]);
      afterData = { TrangThai: newStatus };
    } else if (b.date || b.timeSlot) {
      action = 'RESCHEDULE_BOOKING';
      const newDate = b.date || b.bookingDate || oldData.NgayHen || getLocalIsoDate();
      const newTime = b.timeSlot ? (b.timeSlot.length === 5 ? `${b.timeSlot}:00` : b.timeSlot) : (oldData.GioBatDau || '09:00:00');
      const dur = parseInt(b.duration || b.durationMinutes || 45, 10);
      const newEndTime = computeEndTime(newTime, dur);

      if (oldData.MaNhanVien) {
        const overlaps = await querySql(`
          SELECT TOP 1 MaLichHen, CONVERT(VARCHAR(5), GioBatDau, 108) AS GioBatDau
          FROM LichHen
          WHERE MaNhanVien = ?
            AND MaLichHen <> ?
            AND CONVERT(VARCHAR(10), NgayHen, 120) = ?
            AND TrangThai NOT IN (N'Đã hủy')
            AND CAST(? AS TIME) < ISNULL(GioKetThuc, DATEADD(MINUTE, 45, GioBatDau))
            AND CAST(? AS TIME) > GioBatDau
        `, [oldData.MaNhanVien, id, newDate, newTime, newEndTime]);
        if (overlaps && overlaps.length > 0) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            message: `Thợ ${oldData.MaNhanVien} đã có lịch hẹn #${overlaps[0].MaLichHen} trùng khung giờ mới. Vui lòng chọn giờ khác.`
          }));
          return true;
        }
      }

      await querySql(`UPDATE LichHen SET NgayHen = ?, GioBatDau = ?, GioKetThuc = ?, TrangThai = N'Đã xác nhận' WHERE MaLichHen = ?`, [newDate, newTime, newEndTime, id]);
      afterData = { NgayHen: newDate, GioBatDau: newTime, GioKetThuc: newEndTime, TrangThai: 'Đã xác nhận' };
    } else {
      newStatus = rawStatus || 'Đã xác nhận';
      await querySql(`UPDATE LichHen SET TrangThai = ? WHERE MaLichHen = ?`, [newStatus, id]);
      afterData = { TrangThai: newStatus };
    }

    if (b.note || b.notes || b.GhiChu) {
      const extraNote = b.note || b.notes || b.GhiChu;
      await querySql(`UPDATE LichHen SET GhiChu = ? WHERE MaLichHen = ?`, [extraNote, id]);
    }

    const actorName = authUser.fullName || authUser.name || authUser.username;
    const actorRole = authUser.role;
    const branchId = oldData.MaChiNhanh || (b.branchId || null);

    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action,
      entityType: 'LichHen',
      entityId: id,
      branchId,
      before: oldData ? { TrangThai: oldData.TrangThai, NgayHen: oldData.NgayHen, GioBatDau: oldData.GioBatDau } : null,
      after: afterData,
      details: `${actorName} (${actorRole}) ${action === 'CANCEL_BOOKING' ? 'hủy lịch' : (action === 'RESCHEDULE_BOOKING' ? 'đổi giờ' : 'cập nhật trạng thái')} lịch hẹn #${id}: ${newStatus}`
    }).catch(() => {});

    clearDbSnapshotCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã cập nhật trạng thái lịch hẹn trong SQL Server', id, status: newStatus, TrangThai: newStatus }));
    return true;
  }

  return false;
}

module.exports = handleBookingRoutes;
module.exports.handleBookingRoutes = handleBookingRoutes;
module.exports.default = handleBookingRoutes;

