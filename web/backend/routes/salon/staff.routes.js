// =========================================================================
// QUẢN LÝ NHÂN SỰ & STYLIST
// Bảng CSDL: NhanVien, CaLamViec, LichHen, ChiNhanh, TaiKhoan
// =========================================================================

const { querySql } = require('../../database/db');
const { extractAuthUser } = require('../../middlewares/auth_middleware');

const BARBER_PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
];

function getBarberAvatar(id, name, fallback) {
  if (fallback && fallback.trim().length > 0) return fallback.trim();
  const seed = (id || name || 'NV01').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BARBER_PORTRAITS[seed % BARBER_PORTRAITS.length];
}

async function handleStaffRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // GET /api/stylists hoặc /api/admin/staff - Danh sách nhân sự / stylist
  if ((pathname === '/api/stylists' || pathname === '/api/admin/staff') && method === 'GET') {
    const branchParam = parsedUrl.searchParams.get('branch_id');
    const isPublicStylists = (pathname === '/api/stylists');
    let q = `
      SELECT nv.MaNhanVien, nv.MaChiNhanh, nv.HoTen, nv.SoDienThoai, nv.Email, 
             nv.CapBac, nv.ChucVu, nv.TrangThai, cn.TenChiNhanh 
      FROM NhanVien nv 
      LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh
      WHERE 1=1
    `;
    const params = [];
    // Muc 24: Loai bo Quan tri toi cao khoi danh sach nhan su tai backend
    q += ` AND nv.MaNhanVien <> 'NV00' AND nv.ChucVu NOT LIKE N'%Quản trị%' AND nv.ChucVu NOT LIKE N'%Chủ tịch%'`;
    q += ` AND (nv.ChucVu LIKE N'%Quản lý%' OR nv.ChucVu LIKE N'%Thợ chính%' OR nv.ChucVu LIKE N'%Thợ phụ%' OR nv.ChucVu LIKE N'%Thu ngân%')`;
        const authUserStaff = extractAuthUser(req);
    if (authUserStaff) {
      const roleUpper = String(authUserStaff.role || authUserStaff.vaiTroSql || '').toUpperCase();
      const uid = String(authUserStaff.id || authUserStaff.MaNhanVien || authUserStaff.staffId || '').toUpperCase();
      const isSuper = (uid === 'NV00' || roleUpper.includes('ADMIN') || roleUpper.includes('QUẢN TRỊ') || authUserStaff.username === 'admin');
      const isMgr = !isSuper && (roleUpper.includes('QUẢN LÝ') || roleUpper.includes('BRANCH_MANAGER'));
      if (isMgr && authUserStaff.branchId && authUserStaff.branchId !== 'ALL') {
        if (branchParam && branchParam !== 'all' && branchParam !== authUserStaff.branchId) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Quản lý chỉ được xem danh sách nhân sự của chi nhánh mình phụ trách.' }));
          return true;
        }
        // Quản lý chỉ được xem nhân sự tại chi nhánh mình phụ trách
        q += ` AND nv.MaChiNhanh = ?`;
        params.push(authUserStaff.branchId);
      } else if (branchParam && branchParam !== 'all') {
        q += ` AND nv.MaChiNhanh = ?`;
        params.push(branchParam);
      }
    } else if (branchParam && branchParam !== 'all') {
      q += ` AND nv.MaChiNhanh = ?`;
      params.push(branchParam);
    }
    q += ` ORDER BY nv.MaChiNhanh ASC, nv.MaNhanVien ASC`;
    const rows = await querySql(q, params);

    // Tính điểm đánh giá sao trung bình của thợ từ các lịch hẹn đã hoàn thành
    const reviewRows = await querySql(`
      SELECT dg.SoSao, lh.MaNhanVien 
      FROM DanhGia dg 
      JOIN LichHen lh ON dg.MaLichHen = lh.MaLichHen 
      WHERE lh.MaNhanVien IS NOT NULL
    `).catch(() => []);

    const ratingMap = new Map();
    (reviewRows || []).forEach(rv => {
      if (!ratingMap.has(rv.MaNhanVien)) ratingMap.set(rv.MaNhanVien, []);
      ratingMap.get(rv.MaNhanVien).push(Number(rv.SoSao || 5));
    });

    const stylists = rows.map(r => {
      const ratings = ratingMap.get(r.MaNhanVien) || [];
      const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 4.9;

      return {
        id: r.MaNhanVien,
        MaNhanVien: r.MaNhanVien,
        name: r.HoTen,
        HoTen: r.HoTen,
        branchId: r.MaChiNhanh,
        MaChiNhanh: r.MaChiNhanh,
        branchName: r.TenChiNhanh || `Chi Nhánh ${r.MaChiNhanh}`,
        role: r.ChucVu || 'Master Stylist',
        ChucVu: r.ChucVu || 'Master Stylist',
        level: r.CapBac || 'Senior',
        CapBac: r.CapBac || 'Senior',
        rating: avgRating,
        reviewsCount: ratings.length,
        avatar: getBarberAvatar(r.MaNhanVien, r.HoTen),
        phone: r.SoDienThoai,
        SoDienThoai: r.SoDienThoai,
        email: r.Email,
        status: r.TrangThai || 'Đang làm việc'
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(stylists));
    return true;
  }

  // POST /api/stylists hoặc /api/admin/staff - Thêm mới nhân sự salon
  if ((pathname === '/api/stylists' || pathname === '/api/admin/staff') && method === 'POST') {
    const st = parsedBody || {};
    const role = st.role || st.ChucVu || 'Thợ chính';
    const authUser = extractAuthUser(req);
    const bodyRole = String(st.requestUserRole || '').toUpperCase();
    const isSuper = (authUser && (authUser.role === 'SUPER_ADMIN' || authUser.isSuperAdmin || String(authUser.vaiTroSql || '').includes('Quản trị'))) ||
                    bodyRole === 'SUPER_ADMIN';

    // Chỉ Quản trị tối cao mới có quyền phân quyền Quản lý chi nhánh
    if (role.includes('Quản lý') && !isSuper) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Chỉ Quản trị tối cao mới có quyền phân quyền Quản lý chi nhánh.' }));
      return true;
    }
    if (!isSuper && authUser && authUser.branchId) {
      if (st.branchId && st.branchId !== authUser.branchId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Quản lý chỉ được thêm nhân sự vào chi nhánh mình phụ trách.' }));
        return true;
      }
    }

    const maxRows = await querySql(`SELECT TOP 1 MaNhanVien FROM NhanVien ORDER BY LEN(MaNhanVien) DESC, MaNhanVien DESC`);
    let nextN = 61;
    if (maxRows && maxRows[0]) {
      const m = maxRows[0].MaNhanVien.match(/NV(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const nvId = (st.id || st.MaNhanVien || ('NV' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const branchId = st.branchId || st.MaChiNhanh || 'CN01';
    const fullName = st.name || st.HoTen || 'Thợ tóc mới';
    const phone = st.phone || st.SoDienThoai || '';
    const email = st.email || st.Email || '';
    const level = st.level || st.CapBac || 'Thợ chính';

    await querySql(
      `INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, HoTen, SoDienThoai, Email, CapBac, ChucVu, TrangThai) 
       VALUES (?, ?, ?, ?, ?, ?, ?, N'Đang làm việc')`,
      [nvId, branchId, fullName, phone, email, level, role]
    );

    const tkId = 'TK_' + nvId;
    await querySql(
      `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao) 
       VALUES (?, ?, NULL, ?, 'nv123', ?, N'Hoạt động', GETDATE())`,
      [tkId, nvId, phone || nvId.toLowerCase(), role === 'Quản lý chi nhánh' ? 'Quản lý' : (role === 'Thu ngân' ? 'Thu ngân' : 'Nhân viên')]
    ).catch(() => {});

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      stylist: { id: nvId, MaNhanVien: nvId, branchId, name: fullName, phone, email, level, role }
    }));
    return true;
  }

  // PUT /api/stylists/:id hoặc /api/admin/staff/:id - Cập nhật thông tin nhân viên
  if ((pathname.startsWith('/api/stylists/') || pathname.startsWith('/api/admin/staff/')) && method === 'PUT') {
    const id = pathname.replace('/api/stylists/', '').replace('/api/admin/staff/', '').trim();
    const st = parsedBody || {};
    const authUser = extractAuthUser(req);
    const bodyRole = String(st.requestUserRole || '').toUpperCase();
    const isSuper = (authUser && (authUser.role === 'SUPER_ADMIN' || authUser.isSuperAdmin || String(authUser.vaiTroSql || '').includes('Quản trị'))) ||
                    bodyRole === 'SUPER_ADMIN';

    // Kiểm tra quyền đối với vai trò Quản lý chi nhánh
    const currentRows = await querySql(`SELECT MaNhanVien, MaChiNhanh, ChucVu, CapBac FROM NhanVien WHERE MaNhanVien = ?`, [id]);
    const currentEmp = currentRows && currentRows[0] ? currentRows[0] : null;
    const oldRole = String(currentEmp?.ChucVu || '');
    const newRole = String(st.role || st.ChucVu || '');

    if (!isSuper) {
      // Quan ly chi duoc sua nhan su thuoc chi nhanh cua minh
      if (authUser && authUser.branchId && currentEmp && currentEmp.MaChiNhanh && currentEmp.MaChiNhanh !== authUser.branchId) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Quản lý chỉ được chỉnh sửa nhân sự thuộc chi nhánh mình phụ trách.' }));
        return true;
      }
      // Quan ly khong the doi chi nhanh cua nhan su
      const reqBranch = st.branchId || st.MaChiNhanh;
      if (reqBranch && currentEmp && reqBranch !== currentEmp.MaChiNhanh) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Chỉ Quản trị tối cao mới có quyền chuyển chi nhánh công tác của nhân sự.' }));
        return true;
      }
      if (newRole && newRole.includes('Quản lý') && !oldRole.includes('Quản lý')) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Chỉ Quản trị tối cao mới có quyền phân quyền Quản lý chi nhánh.' }));
        return true;
      }
      if (oldRole.includes('Quản lý') && newRole && newRole !== oldRole) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Quản lý chi nhánh không có quyền thay đổi vai trò của Quản lý.' }));
        return true;
      }
    }

    await querySql(
      `UPDATE NhanVien 
       SET HoTen = COALESCE(?, HoTen), 
           SoDienThoai = COALESCE(?, SoDienThoai), 
           Email = COALESCE(?, Email), 
           CapBac = COALESCE(?, CapBac), 
           ChucVu = COALESCE(?, ChucVu), 
           MaChiNhanh = COALESCE(?, MaChiNhanh), 
           TrangThai = COALESCE(?, TrangThai) 
       WHERE MaNhanVien = ?`,
      [
        st.name || st.HoTen || null,
        st.phone || st.SoDienThoai || null,
        st.email || st.Email || null,
        st.level || st.CapBac || null,
        st.role || st.ChucVu || null,
        st.branchId || st.MaChiNhanh || null,
        st.status || st.TrangThai || null,
        id
      ]
    );

    // Đồng bộ vai trò tài khoản nếu có cập nhật chức vụ
    if (st.role || st.ChucVu) {
      const finalRole = st.role || st.ChucVu;
      const vaiTroTk = finalRole.includes('Quản lý') ? 'Quản lý' : (finalRole.includes('Thu ngân') ? 'Thu ngân' : 'Nhân viên');
      await querySql(`UPDATE TaiKhoan SET VaiTro = ? WHERE MaNhanVien = ?`, [vaiTroTk, id]).catch(() => {});
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/stylists/:id - Cho nhân sự nghỉ việc
  // Lưu ý: Tự động điều chuyển các lịch hẹn chưa hoàn thành sang stylist khác cùng chi nhánh
  if ((pathname.startsWith('/api/stylists/') || pathname.startsWith('/api/admin/staff/')) && method === 'DELETE') {
    const id = pathname.replace('/api/stylists/', '').replace('/api/admin/staff/', '').trim();

    const empRows = await querySql(`SELECT MaChiNhanh FROM NhanVien WHERE MaNhanVien = ?`, [id]);
    const branchId = empRows && empRows[0] ? empRows[0].MaChiNhanh : 'CN01';

    // Cập nhật trạng thái nhân sự thành 'Đã nghỉ việc'
    await querySql(`UPDATE NhanVien SET TrangThai = N'Đã nghỉ việc' WHERE MaNhanVien = ?`, [id]);
    await querySql(`UPDATE TaiKhoan SET TrangThai = N'Khóa' WHERE MaNhanVien = ?`, [id]);

    // Tìm một thợ khác đang hoạt động cùng chi nhánh để nhận lại các lịch hẹn chưa xong
    const backupStylist = await querySql(
      `SELECT TOP 1 MaNhanVien FROM NhanVien WHERE MaChiNhanh = ? AND TrangThai = N'Đang làm việc' AND MaNhanVien <> ?`,
      [branchId, id]
    );

    let reassignMsg = '';
    if (backupStylist && backupStylist[0]) {
      const newStylistId = backupStylist[0].MaNhanVien;
      await querySql(
        `UPDATE LichHen SET MaNhanVien = ? WHERE MaNhanVien = ? AND TrangThai IN (N'Chờ xác nhận', N'Đã xác nhận', N'Chờ vào ghế')`,
        [newStylistId, id]
      );
      reassignMsg = ` Các lịch hẹn chưa hoàn thành đã được tự động chuyển sang thợ ${newStylistId}.`;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      message: `Nhân viên ${id} đã chuyển trạng thái sang Đã nghỉ việc.${reassignMsg}`,
      id
    }));
    return true;
  }

  // GET /api/shifts - Lấy danh sách ca làm việc của thợ
  if (pathname === '/api/shifts' && method === 'GET') {
    const rows = await querySql(`
      SELECT clv.MaCa, clv.MaNhanVien, clv.NgayLam, 
             CONVERT(VARCHAR(8), clv.GioBatDau) AS GioBatDau, 
             CONVERT(VARCHAR(8), clv.GioKetThuc) AS GioKetThuc, 
             clv.TrangThai, nv.HoTen, nv.MaChiNhanh 
      FROM CaLamViec clv 
      JOIN NhanVien nv ON clv.MaNhanVien = nv.MaNhanVien
    `);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
    return true;
  }

  // POST /api/shifts - Phân ca làm việc mới
  if (pathname === '/api/shifts' && method === 'POST') {
    const { maNhanVien, date, startTime, endTime } = parsedBody || {};
    const maxCa = await querySql(`SELECT TOP 1 MaCa FROM CaLamViec ORDER BY LEN(MaCa) DESC, MaCa DESC`);
    let nextCaN = 101;
    if (maxCa && maxCa[0]) {
      const m = maxCa[0].MaCa.match(/CA(\d+)/i);
      if (m) nextCaN = parseInt(m[1], 10) + 1;
    }
    const newCaId = 'CA' + nextCaN;
    const startT = (startTime || '08:30').length === 5 ? `${startTime || '08:30'}:00` : (startTime || '08:30:00');
    const endT = (endTime || '15:30').length === 5 ? `${endTime || '15:30'}:00` : (endTime || '15:30:00');

    await querySql(
      `INSERT INTO CaLamViec (MaCa, MaNhanVien, NgayLam, GioBatDau, GioKetThuc, TrangThai) 
       VALUES (?, ?, ?, ?, ?, N'Đã xếp ca')`,
      [newCaId, maNhanVien, date || new Date().toISOString().slice(0, 10), startT, endT]
    );

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xếp ca làm việc thành công!', shiftId: newCaId }));
    return true;
  }

  return false;
}

module.exports = handleStaffRoutes;
module.exports.handleStaffRoutes = handleStaffRoutes;
module.exports.default = handleStaffRoutes;

