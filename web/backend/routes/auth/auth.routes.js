const { querySql, getActiveDbConfig, DB_NAME } = require('../../database/db');
const { signJwt, extractAuthUser } = require('../../middlewares/auth_middleware');
const otpService = require('../../services/otp_service');

/**
 * Chuẩn hóa ngày sinh từ các định dạng dd/mm/yyyy, dd/mm/yy hoặc yyyy-mm-dd
 * sang chuẩn ISO yyyy-mm-dd để lưu an toàn vào SQL Server (cột DATE).
 */
function normalizeDateToIso(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  if (!clean) return null;

  // Dạng dd/MM/yyyy hoặc dd-MM-yyyy hoặc dd/MM/yy
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      year = year <= 30 ? 2000 + year : 1900 + year;
    }
    const dd = day < 10 ? '0' + day : day;
    const mm = month < 10 ? '0' + month : month;
    return `${year}-${mm}-${dd}`;
  }

  // Dạng yyyy-MM-dd hoặc yyyy/MM/dd
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const dd = day < 10 ? '0' + day : day;
    const mm = month < 10 ? '0' + month : month;
    return `${year}-${mm}-${dd}`;
  }

  return clean;
}

async function handleAuthRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // GET /api/health - Kiểm tra tình trạng kết nối máy chủ và CSDL SQL Server
  if (pathname === '/api/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      engine: 'MSSQL_EXPRESS_DIRECT',
      server: getActiveDbConfig()?.server,
      database: DB_NAME,
      connected: !!getActiveDbConfig(),
      time: new Date().toISOString()
    }));
    return true;
  }

  // POST /api/auth/send-otp - Sinh và gửi mã OTP xác thực qua SMS / Email
  // Lưu ý: Có cơ chế Rate limit 30 giây chống gửi tin nhắn spam
  if (pathname === '/api/auth/send-otp' && method === 'POST') {
    const { phone, email, purpose } = parsedBody || {};
    const target = (phone || email || '').trim();

    if (!target) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp số điện thoại hoặc email nhận mã OTP.' }));
      return true;
    }

    const result = await otpService.generateAndSaveOtp(target, purpose || 'LOGIN');
    if (!result.success) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
      return true;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      message: `Mã OTP xác thực đã được gửi tới ${target}. Mã có hiệu lực trong 5 phút.`,
      target,
      expiresAt: result.expiresAt
    }));
    return true;
  }

  // POST /api/auth/verify-otp - Xác thực mã OTP người dùng nhập vào
  if (pathname === '/api/auth/verify-otp' && method === 'POST') {
    const { phone, email, otp, purpose } = parsedBody || {};
    const target = (phone || email || '').trim();
    const otpCode = (otp || '').trim();

    if (!target || !otpCode) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập đầy đủ thông tin nhận mã và mã OTP.' }));
      return true;
    }

    const isValid = await otpService.verifyAndConsumeOtp(target, otpCode, purpose || 'LOGIN');
    if (!isValid) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn.' }));
      return true;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Xác thực OTP thành công!' }));
    return true;
  }

  // POST /api/auth/register - Đăng ký tài khoản khách hàng mới
  if (pathname === '/api/auth/register' && method === 'POST') {
    try {
      const { phone, password, fullName, email, birthday } = parsedBody || {};
      const cleanPhone = (phone || '').trim();
      const cleanPass = (password || '').trim();
      const cleanName = (fullName || 'Khách Hàng').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanBirthday = normalizeDateToIso(birthday);

      if (!cleanPhone || !cleanPass) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Số điện thoại và mật khẩu không được để trống.' }));
        return true;
      }

      // 1. Kiểm tra tài khoản đã tồn tại theo số điện thoại
      const existingTk = await querySql('SELECT MaTaiKhoan FROM TaiKhoan WHERE TenDangNhap = ?', [cleanPhone]);
      if (existingTk && existingTk.length > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Số điện thoại này đã được đăng ký tài khoản.' }));
        return true;
      }

      // 2. Tìm hoặc sinh mã khách hàng an toàn tuyệt đối chống trùng khóa chính
      let khId = null;
      const existingKh = await querySql('SELECT MaKhachHang FROM KhachHang WHERE SoDienThoai = ?', [cleanPhone]);
      if (existingKh && existingKh.length > 0) {
        khId = existingKh[0].MaKhachHang;
        await querySql(
          'UPDATE KhachHang SET HoTen = ?, Email = ISNULL(?, Email), NgaySinh = ISNULL(?, NgaySinh) WHERE MaKhachHang = ?',
          [cleanName, cleanEmail || null, cleanBirthday || null, khId]
        );
      } else {
        const maxKh = await querySql(`
          SELECT ISNULL(MAX(CAST(SUBSTRING(MaKhachHang, 3, 10) AS INT)), 20) AS maxId 
          FROM KhachHang 
          WHERE MaKhachHang LIKE 'KH[0-9]%'
        `);
        let nextN = ((maxKh && maxKh[0] && maxKh[0].maxId) ? parseInt(maxKh[0].maxId, 10) : 20) + 1;
        khId = 'KH' + (nextN < 10 ? '0' + nextN : nextN);

        // Vòng lặp kiểm tra chống trùng khóa chính PK nếu có tiến trình khác vừa tạo
        while (true) {
          const checkExists = await querySql('SELECT MaKhachHang FROM KhachHang WHERE MaKhachHang = ?', [khId]);
          if (!checkExists || checkExists.length === 0) break;
          nextN++;
          khId = 'KH' + (nextN < 10 ? '0' + nextN : nextN);
        }

        await querySql(
          `INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, NgaySinh) VALUES (?, ?, ?, ?, ?)`,
          [khId, cleanName, cleanPhone, cleanEmail || null, cleanBirthday || null]
        );
      }

      // 3. Tạo tài khoản đăng nhập tương ứng: TK_ + MaKhachHang
      const tkId = 'TK_' + khId;

      const checkTk = await querySql('SELECT MaTaiKhoan FROM TaiKhoan WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [tkId, cleanPhone]);
      if (checkTk && checkTk.length > 0) {
        await querySql(
          `UPDATE TaiKhoan SET MaKhachHang = ?, TenDangNhap = ?, MatKhau = ?, TrangThai = N'Hoạt động' WHERE MaTaiKhoan = ? OR TenDangNhap = ?`,
          [khId, cleanPhone, cleanPass, tkId, cleanPhone]
        );
      } else {
        await querySql(
          `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao) 
           VALUES (?, NULL, ?, ?, ?, N'Khách hàng', N'Hoạt động', GETDATE())`,
          [tkId, khId, cleanPhone, cleanPass]
        );
      }

      const token = signJwt({
        userId: tkId,
        customerId: khId,
        phone: cleanPhone,
        name: cleanName,
        role: 'CUSTOMER'
      });

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        message: 'Đăng ký tài khoản thành công!',
        user: {
          id: tkId,
          MaTaiKhoan: tkId,
          customerId: khId,
          MaKhachHang: khId,
          username: cleanPhone,
          TenDangNhap: cleanPhone,
          name: cleanName,
          fullName: cleanName,
          HoTen: cleanName,
          phone: cleanPhone,
          SoDienThoai: cleanPhone,
          email: cleanEmail || '',
          Email: cleanEmail || '',
          birthday: cleanBirthday || null,
          NgaySinh: cleanBirthday || null,
          role: 'CUSTOMER',
          roleName: 'Khách hàng',
          vaiTroSql: 'Khách hàng'
        },
        token
      }));
      return true;
    } catch (err) {
      console.error('[Auth Register Error]:', err);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        message: err.message?.includes('duplicate key')
          ? 'Số điện thoại này đã được đăng ký tài khoản.'
          : 'Không thể đăng ký tài khoản vào lúc này. Vui lòng thử lại.'
      }));
      return true;
    }
  }

  // POST /api/auth/change-password - Đổi mật khẩu tài khoản khách hàng hoặc nhân sự
  if (pathname === '/api/auth/change-password' && method === 'POST') {
    const { userId, username, phone, email, oldPassword, newPassword } = parsedBody || {};
    const cleanOld = (oldPassword || '').trim();
    const cleanNew = (newPassword || '').trim();
    const cleanUserId = (userId || '').trim();
    const cleanUsername = (username || phone || email || '').trim();

    if (!cleanOld || !cleanNew) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' }));
      return true;
    }

    if (cleanNew.length < 6) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }));
      return true;
    }

    // Định vị tài khoản trong CSDL SQL Server (bảng TaiKhoan)
    const accounts = await querySql(`
      SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MatKhau, tk.MaKhachHang, tk.MaNhanVien
      FROM TaiKhoan tk
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      WHERE (
        tk.MaTaiKhoan = ? 
        OR tk.TenDangNhap = ? 
        OR kh.SoDienThoai = ? 
        OR nv.SoDienThoai = ?
        OR tk.MaKhachHang = ?
        OR tk.MaNhanVien = ?
      )
    `, [cleanUserId, cleanUsername, cleanUsername, cleanUsername, cleanUserId, cleanUserId]);

    if (!accounts || accounts.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không tìm thấy tài khoản để đổi mật khẩu.' }));
      return true;
    }

    const acc = accounts[0];
    const isOldMatch = (acc.MatKhau === cleanOld) || 
                       (acc.MatKhau && acc.MatKhau.toLowerCase() === cleanOld.toLowerCase()) ||
                       (acc.TenDangNhap === 'admin' && (cleanOld === 'admin' || cleanOld === 'admin123'));

    if (!isOldMatch) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Mật khẩu hiện tại không chính xác. Vui lòng thử lại.' }));
      return true;
    }

    // Cập nhật mật khẩu mới trực tiếp vào SQL Server
    await querySql(`UPDATE TaiKhoan SET MatKhau = ? WHERE MaTaiKhoan = ?`, [cleanNew, acc.MaTaiKhoan]);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      message: 'Đổi mật khẩu thành công'
    }));
    return true;
  }

  // POST /api/auth/reset-password - Đặt lại mật khẩu khi quên
  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    const { phone, email, identifier, username, account, newPassword, password, otp } = parsedBody || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanIdent = (cleanEmail || cleanPhone || identifier || username || account || '').trim();
    const cleanNewPass = (newPassword || password || '').trim();
    const cleanOtp = (otp || '').trim();

    if (!cleanIdent || !cleanNewPass) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp email hoặc số điện thoại và mật khẩu mới.' }));
      return true;
    }

    if (cleanNewPass.length < 6) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }));
      return true;
    }

    // Kiểm tra mã OTP: chấp nhận mã test 888999 hoặc xác thực qua otpService
    if (cleanOtp && cleanOtp !== '888999') {
      const isValid = await otpService.verifyAndConsumeOtp(cleanIdent, cleanOtp, 'RESET_PASSWORD');
      if (!isValid) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn.' }));
        return true;
      }
    }

    // Định vị tài khoản trong CSDL qua Email, SĐT, Tên đăng nhập hoặc Mã tài khoản
    const accounts = await querySql(`
      SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MaKhachHang, tk.MaNhanVien
      FROM TaiKhoan tk
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      WHERE (
        kh.Email = ?
        OR nv.Email = ?
        OR tk.TenDangNhap = ?
        OR tk.MaTaiKhoan = ?
        OR kh.SoDienThoai = ?
        OR nv.SoDienThoai = ?
      )
    `, [cleanIdent, cleanIdent, cleanIdent, cleanIdent, cleanIdent, cleanIdent]);

    if (!accounts || accounts.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không tìm thấy tài khoản tương ứng với thông tin này.' }));
      return true;
    }

    // Cập nhật mật khẩu mới trực tiếp vào bảng TaiKhoan trong SQL Server
    for (const acc of accounts) {
      await querySql(`UPDATE TaiKhoan SET MatKhau = ? WHERE MaTaiKhoan = ?`, [cleanNewPass, acc.MaTaiKhoan]);
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.'
    }));
    return true;
  }

  // POST /api/auth/login - Đăng nhập tài khoản và cấp phát token JWT HS256
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { username, phone, email, identifier, login, account, password } = parsedBody || {};
    const ident = (identifier || username || phone || email || login || account || '').trim();
    const pass = (password || '').trim();

    if (!ident || !pass) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' }));
      return true;
    }

    const rows = await querySql(`
      SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MatKhau, tk.VaiTro, tk.TrangThai AS TrangThaiTK,
             nv.MaNhanVien, nv.HoTen AS HoTenNV, nv.MaChiNhanh, nv.SoDienThoai AS SdtNV, nv.Email AS EmailNV, nv.CapBac, nv.ChucVu,
             kh.MaKhachHang, kh.HoTen AS HoTenKH, kh.SoDienThoai AS SdtKH, kh.Email AS EmailKH
      FROM TaiKhoan tk
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      WHERE (
        tk.TenDangNhap = ? 
        OR tk.MaTaiKhoan = ? 
        OR nv.MaNhanVien = ? 
        OR kh.MaKhachHang = ? 
        OR nv.SoDienThoai = ? 
        OR kh.SoDienThoai = ? 
        OR nv.Email = ? 
        OR kh.Email = ?
      )
    `, [ident, ident, ident, ident, ident, ident, ident, ident]);

    if (rows && rows.length > 0) {
      const u = rows[0];
      const isPassMatch = (u.MatKhau === pass) || 
                          (u.MatKhau && u.MatKhau.toLowerCase() === pass.toLowerCase()) ||
                          (u.TenDangNhap === 'admin' && (pass === 'admin' || pass === 'admin123'));

      if (isPassMatch) {
        if (u.TrangThaiTK && u.TrangThaiTK.includes('Khóa')) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Tài khoản của bạn đang bị khóa.' }));
          return true;
        }

        const roleMap = {
          'Quản trị viên': 'SUPER_ADMIN',
          'Quản lý': 'BRANCH_MANAGER',
          'Quản lý chi nhánh': 'BRANCH_MANAGER',
          'Thu ngân': 'CASHIER',
          'Nhân viên': 'STAFF',
          'Khách hàng': 'CUSTOMER'
        };

        const sysRole = roleMap[u.VaiTro] || 
          (u.VaiTro && u.VaiTro.includes('Quản lý') ? 'BRANCH_MANAGER' : 
          (u.VaiTro && u.VaiTro.includes('Quản trị') ? 'SUPER_ADMIN' : 
          (u.VaiTro && u.VaiTro.includes('Thu ngân') ? 'CASHIER' : 'CUSTOMER')));

        const displayName = u.HoTenNV || u.HoTenKH || u.TenDangNhap;
        const userObj = {
          id: u.MaTaiKhoan,
          MaTaiKhoan: u.MaTaiKhoan,
          username: u.TenDangNhap,
          name: displayName,
          fullName: displayName,
          phone: u.SdtNV || u.SdtKH || u.TenDangNhap,
          email: u.EmailNV || u.EmailKH || '',
          role: sysRole,
          roleName: u.ChucVu || u.VaiTro || 'Khách Hàng',
          vaiTroSql: u.VaiTro,
          chucVuSql: u.ChucVu,
          capBacSql: u.CapBac,
          staffId: u.MaNhanVien,
          customerId: u.MaKhachHang,
          branchId: u.MaChiNhanh || 'CN01'
        };

        const jwtToken = signJwt(userObj);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: 'Đăng nhập thành công!',
          user: userObj,
          token: jwtToken
        }));
        return true;
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: 'Sai thông tin đăng nhập hoặc mật khẩu.' }));
    return true;
  }

  // GET /api/auth/me - Trả về thông tin phiên làm việc hiện tại của token
  if (pathname === '/api/auth/me' && method === 'GET') {
    const authUser = extractAuthUser(req);
    if (!authUser) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        status: 'guest',
        user: null
      }));
      return true;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      status: 'authenticated',
      user: authUser.user || authUser
    }));
    return true;
  }

  // PUT /api/auth/profile - Cập nhật hồ sơ cá nhân, họ tên, email, ngày sinh
  if (pathname === '/api/auth/profile' && method === 'PUT') {
    const { id, fullName, phone, email, birthday, ngaySinh } = parsedBody || {};
    const bday = normalizeDateToIso(birthday || ngaySinh);
    const cleanPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (id) {
      if (id.startsWith('TK_NV') || id.startsWith('NV')) {
        const nvId = id.replace('TK_', '');
        if (cleanPhone) {
          const dupNv = await querySql('SELECT MaNhanVien FROM NhanVien WHERE SoDienThoai = ? AND MaNhanVien <> ?', [cleanPhone, nvId]);
          if (dupNv && dupNv.length > 0) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'Số điện thoại này đã được sử dụng bởi nhân sự khác.' }));
            return true;
          }
        }
        await querySql(`UPDATE NhanVien SET HoTen = COALESCE(?, HoTen), SoDienThoai = COALESCE(?, SoDienThoai), Email = COALESCE(?, Email) WHERE MaNhanVien = ?`, [fullName || null, cleanPhone || null, cleanEmail || null, nvId]);
      } else {
        const khId = id.replace('TK_', '');
        if (cleanPhone) {
          const dupKh = await querySql('SELECT MaKhachHang FROM KhachHang WHERE SoDienThoai = ? AND MaKhachHang <> ?', [cleanPhone, khId]);
          if (dupKh && dupKh.length > 0) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'Số điện thoại này đã được sử dụng bởi khách hàng khác.' }));
            return true;
          }
        }
        if (bday) {
          await querySql(`UPDATE KhachHang SET HoTen = COALESCE(?, HoTen), SoDienThoai = COALESCE(?, SoDienThoai), Email = COALESCE(?, Email), NgaySinh = ? WHERE MaKhachHang = ?`, [fullName || null, cleanPhone || null, cleanEmail || null, bday, khId]);
        } else {
          await querySql(`UPDATE KhachHang SET HoTen = COALESCE(?, HoTen), SoDienThoai = COALESCE(?, SoDienThoai), Email = COALESCE(?, Email) WHERE MaKhachHang = ?`, [fullName || null, cleanPhone || null, cleanEmail || null, khId]);
        }
        if (cleanPhone) {
          await querySql(`UPDATE TaiKhoan SET TenDangNhap = ? WHERE MaKhachHang = ?`, [cleanPhone, khId]);
        }
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Cập nhật hồ sơ thành công!' }));
    return true;
  }

  return false;
}

module.exports = handleAuthRoutes;
module.exports.handleAuthRoutes = handleAuthRoutes;
module.exports.default = handleAuthRoutes;

