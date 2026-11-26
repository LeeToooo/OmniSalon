const { querySql, getActiveDbConfig, DB_NAME } = require('../../database/db');
const {
  signJwt,
  verifyJwt,
  extractAuthUser,
  enforceAuth,
  hashPassword,
  verifyPassword,
  isSuperAdmin
} = require('../../middlewares/auth_middleware');
const otpService = require('../../services/otp_service');
const {
  resolveUserRole,
  resolveBranchName,
  ROLE_NAME_MAP,
  BRANCH_NAME_MAP
} = require('../../services/helper_service');
const auditService = require('../../services/audit.service');
const { logAudit } = auditService;

// Giới hạn tần suất đăng nhập thất bại theo IP + tài khoản (tối đa 8 lần / 5 phút)
const loginAttemptTracker = new Map();
const LOGIN_MAX_FAILS = 8;
const LOGIN_LOCK_WINDOW_MS = 5 * 60 * 1000;

function checkLoginRateLimit(key) {
  const now = Date.now();
  const entry = loginAttemptTracker.get(key);
  if (!entry) return { blocked: false };
  if (now - entry.firstFailAt > LOGIN_LOCK_WINDOW_MS) {
    loginAttemptTracker.delete(key);
    return { blocked: false };
  }
  if (entry.count >= LOGIN_MAX_FAILS) {
    const waitSec = Math.ceil((LOGIN_LOCK_WINDOW_MS - (now - entry.firstFailAt)) / 1000);
    return { blocked: true, waitSec };
  }
  return { blocked: false };
}

function recordLoginFailure(key) {
  const now = Date.now();
  const entry = loginAttemptTracker.get(key);
  if (!entry || (now - entry.firstFailAt > LOGIN_LOCK_WINDOW_MS)) {
    loginAttemptTracker.set(key, { count: 1, firstFailAt: now });
  } else {
    entry.count += 1;
  }
}

function clearLoginFailures(key) {
  loginAttemptTracker.delete(key);
}

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

  // POST /api/auth/send-otp - Sinh và gửi mã OTP xác thực qua Gmail
  // Lưu ý: Có cơ chế Rate limit 30 giây chống gửi email spam
  if (pathname === '/api/auth/send-otp' && method === 'POST') {
    try {
      const { phone, email, purpose } = parsedBody || {};
      const target = (email || phone || '').trim().toLowerCase();

      if (!target) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp Email nhận mã OTP.' }));
        return true;
      }

      const result = await otpService.generateAndSaveOtp(target, purpose || 'LOGIN');
      if (!result || !result.success) {
        res.writeHead(result?.statusCode || 502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          message: result?.message || 'Không thể gửi mã OTP qua Email. Vui lòng thử lại sau.',
          target,
          sentEmail: false
        }));
        return true;
      }

      const isDevHintAllowed = process.env.SHOW_OTP_DEV === 'true' && Boolean(result.otp);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        message: result.message || `Mã OTP xác thực đã được gửi tới ${target}. Mã có hiệu lực trong 5 phút.`,
        target,
        sentEmail: result.sentEmail,
        ...(isDevHintAllowed ? { otp: result.otp } : {}),
        expiresAt: result.expiresAt
      }));
    } catch (err) {
      const status = err.statusCode || 500;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return true;
  }

  // POST /api/auth/verify-otp - Xác thực mã OTP người dùng nhập vào
  if (pathname === '/api/auth/verify-otp' && method === 'POST') {
    const { phone, email, otp, purpose } = parsedBody || {};
    const target = (email || phone || '').trim().toLowerCase();
    const otpCode = (otp || '').trim();

    if (!target || !otpCode) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập đầy đủ thông tin nhận mã và mã OTP.' }));
      return true;
    }

    const verifyResult = await otpService.verifyOtp(target, otpCode, {
      purpose: purpose || null,
      consume: true
    });
    if (!verifyResult || !verifyResult.valid) {
      const errMsg = verifyResult?.message || 'Mã OTP không đúng hoặc đã hết hạn.';
      auditService.logAudit({
        actor: target,
        role: 'SYSTEM',
        action: 'OTP_EXPIRED_OR_INVALID',
        entityType: 'XacThucOTP',
        entityId: target,
        details: `Xác thực OTP thất bại cho ${target}: ${errMsg}`
      }).catch(() => {});
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: errMsg }));
      return true;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Xác thực OTP thành công!' }));
    return true;
  }

  // POST /api/auth/register - Đăng ký tài khoản khách hàng mới (bắt buộc OTP Gmail hợp lệ)
  if (pathname === '/api/auth/register' && method === 'POST') {
    try {
      const { phone, password, fullName, email, birthday, otp } = parsedBody || {};
      const cleanPhone = (phone || '').trim();
      const cleanPass = (password || '').trim();
      const cleanName = (fullName || 'Khách Hàng').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanBirthday = normalizeDateToIso(birthday);
      const cleanOtp = (otp || '').trim();

      if (!cleanPhone || !cleanPass) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Số điện thoại và mật khẩu không được để trống.' }));
        return true;
      }

      if (cleanPass.length < 6) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' }));
        return true;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập địa chỉ Email hợp lệ để xác thực OTP.' }));
        return true;
      }

      if (!/^\d{4,10}$/.test(cleanOtp)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập mã OTP xác thực đã gửi về Email.' }));
        return true;
      }

      const otpCheck = await otpService.verifyOtp(cleanEmail, cleanOtp, { purpose: 'REGISTER', consume: true });
      if (!otpCheck || !otpCheck.valid) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: otpCheck?.message || 'Mã OTP không đúng hoặc đã hết hạn.' }));
        return true;
      }

      // 1. Kiểm tra tài khoản đã tồn tại theo số điện thoại hoặc email
      const existingTk = await querySql(
        `SELECT tk.MaTaiKhoan
         FROM TaiKhoan tk
         LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
         WHERE tk.TenDangNhap = ? OR LOWER(kh.Email) = ?`,
        [cleanPhone, cleanEmail]
      );
      if (existingTk && existingTk.length > 0) {
        res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Số điện thoại hoặc Email này đã được đăng ký tài khoản.' }));
        return true;
      }

      // 2. Tìm hoặc tạo mã khách hàng mới
      let khId = null;
      const existingKh = await querySql('SELECT MaKhachHang, Email FROM KhachHang WHERE SoDienThoai = ?', [cleanPhone]);
      if (existingKh && existingKh.length > 0) {
        const linkedTk = await querySql('SELECT MaTaiKhoan FROM TaiKhoan WHERE MaKhachHang = ?', [existingKh[0].MaKhachHang]);
        if (linkedTk && linkedTk.length > 0) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Số điện thoại này đã được liên kết với một tài khoản khác.' }));
          return true;
        }
        if (existingKh[0].Email && existingKh[0].Email.trim().toLowerCase() !== cleanEmail) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Số điện thoại này đã gắn với một địa chỉ Email khác trong hệ thống.' }));
          return true;
        }
        khId = existingKh[0].MaKhachHang;
        await querySql(
          'UPDATE KhachHang SET HoTen = ?, Email = COALESCE(?, Email), NgaySinh = COALESCE(?, NgaySinh) WHERE MaKhachHang = ?',
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

      // 3. Tạo tài khoản đăng nhập tương ứng: TK_ + MaKhachHang với mật khẩu băm scrypt
      const tkId = 'TK_' + khId;
      const passwordHash = hashPassword(cleanPass);

      const checkTk = await querySql('SELECT MaTaiKhoan FROM TaiKhoan WHERE MaTaiKhoan = ? OR TenDangNhap = ?', [tkId, cleanPhone]);
      if (checkTk && checkTk.length > 0) {
        res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Tài khoản này đã tồn tại trong hệ thống.' }));
        return true;
      }

      await querySql(
        `INSERT INTO TaiKhoan (MaTaiKhoan, MaNhanVien, MaKhachHang, TenDangNhap, MatKhau, VaiTro, TrangThai, NgayTao) 
         VALUES (?, NULL, ?, ?, ?, N'Khách hàng', N'Hoạt động', GETDATE())`,
        [tkId, khId, cleanPhone, passwordHash]
      );

      const token = signJwt({
        id: tkId,
        userId: tkId,
        customerId: khId,
        phone: cleanPhone,
        email: cleanEmail,
        name: cleanName,
        fullName: cleanName,
        role: 'CUSTOMER'
      });

      logAudit({
        actor: `${cleanName} (${cleanPhone})`,
        role: 'CUSTOMER',
        action: 'CUSTOMER_REGISTER',
        entityType: 'TaiKhoan',
        entityId: tkId,
        details: `Khách hàng [${cleanName}] đăng ký tài khoản mới qua số điện thoại ${cleanPhone}`,
        after: { phone: cleanPhone, fullName: cleanName, email: cleanEmail }
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
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        message: err.message?.includes('duplicate key')
          ? 'Số điện thoại hoặc Email này đã được đăng ký tài khoản.'
          : 'Không thể đăng ký tài khoản vào lúc này. Vui lòng thử lại.'
      }));
      return true;
    }
  }

  // POST /api/auth/change-password - Đổi mật khẩu (bắt buộc JWT & kiểm tra chủ sở hữu)
  if (pathname === '/api/auth/change-password' && method === 'POST') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    const { userId, oldPassword, newPassword } = parsedBody || {};
    const cleanOld = (oldPassword || '').trim();
    const cleanNew = (newPassword || '').trim();
    const cleanUserId = (userId || '').trim();

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

    const ownerIds = [authUser.id, authUser.userId, authUser.customerId, authUser.staffId].filter(Boolean);
    if (cleanUserId && !ownerIds.includes(cleanUserId)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Bạn chỉ được phép đổi mật khẩu cho chính tài khoản của mình.' }));
      return true;
    }

    const targetLookupId = authUser.id || authUser.userId || cleanUserId;
    const accounts = await querySql(`
      SELECT TOP 1 tk.MaTaiKhoan, tk.TenDangNhap, tk.MatKhau, tk.MaKhachHang, tk.MaNhanVien
      FROM TaiKhoan tk
      WHERE tk.MaTaiKhoan = ? OR tk.TenDangNhap = ?
    `, [targetLookupId, authUser.username || targetLookupId]);

    if (!accounts || accounts.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không tìm thấy tài khoản để đổi mật khẩu.' }));
      return true;
    }

    const acc = accounts[0];
    if (!verifyPassword(cleanOld, acc.MatKhau)) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Mật khẩu hiện tại không chính xác. Vui lòng thử lại.' }));
      return true;
    }

    const hashedNew = hashPassword(cleanNew);
    await querySql(`UPDATE TaiKhoan SET MatKhau = ? WHERE MaTaiKhoan = ?`, [hashedNew, acc.MaTaiKhoan]);

    auditService.logAudit({
      actor: authUser.fullName || acc.TenDangNhap || acc.MaTaiKhoan,
      role: authUser.role || 'CUSTOMER',
      action: 'CHANGE_PASSWORD',
      entityType: 'TaiKhoan',
      entityId: acc.MaTaiKhoan,
      details: `Người dùng ${acc.TenDangNhap || acc.MaTaiKhoan} đổi mật khẩu thành công`
    }).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      message: 'Đổi mật khẩu thành công'
    }));
    return true;
  }

  // POST /api/auth/reset-password - Đặt lại mật khẩu khi quên (bắt buộc OTP Gmail mục đích RESET_PASSWORD)
  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    const { phone, email, identifier, username, account, newPassword, password, otp } = parsedBody || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanIdent = (cleanEmail || cleanPhone || identifier || username || account || '').trim();
    const cleanNewPass = (newPassword || password || '').trim();
    const cleanOtp = (otp || '').trim();

    if (!cleanIdent || !cleanNewPass || !cleanOtp) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng cung cấp Email, mã OTP và mật khẩu mới.' }));
      return true;
    }

    if (cleanNewPass.length < 6) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }));
      return true;
    }

    const otpTarget = cleanEmail || (cleanIdent.includes('@') ? cleanIdent.toLowerCase() : '');
    if (!otpTarget) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng sử dụng Email hợp lệ đã nhận mã OTP.' }));
      return true;
    }

    const otpResult = await otpService.verifyOtp(otpTarget, cleanOtp, { purpose: 'RESET_PASSWORD', consume: true });
    if (!otpResult || !otpResult.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: otpResult?.message || 'Mã OTP không đúng hoặc đã hết hạn.' }));
      return true;
    }

    // Định vị tài khoản trong CSDL qua Email khớp OTP
    const accounts = await querySql(`
      SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MaKhachHang, tk.MaNhanVien
      FROM TaiKhoan tk
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      WHERE LOWER(kh.Email) = ? OR LOWER(nv.Email) = ?
    `, [otpTarget, otpTarget]);

    if (!accounts || accounts.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không tìm thấy tài khoản tương ứng với Email này.' }));
      return true;
    }

    const hashedPass = hashPassword(cleanNewPass);
    for (const acc of accounts) {
      await querySql(`UPDATE TaiKhoan SET MatKhau = ? WHERE MaTaiKhoan = ?`, [hashedPass, acc.MaTaiKhoan]);
      auditService.logAudit({
        actor: acc.TenDangNhap || otpTarget || acc.MaTaiKhoan,
        role: 'CUSTOMER',
        action: 'RESET_PASSWORD',
        entityType: 'TaiKhoan',
        entityId: acc.MaTaiKhoan,
        details: `Người dùng ${otpTarget} đặt lại mật khẩu mới qua mã OTP`
      }).catch(() => {});
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

    const clientIp = req.socket?.remoteAddress || 'local';
    const rateKey = `${clientIp}:${ident.toLowerCase()}`;
    const rateState = checkLoginRateLimit(rateKey);
    if (rateState.blocked) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        message: `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${rateState.waitSec} giây.`
      }));
      return true;
    }

    const rows = await querySql(`
      SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MatKhau, tk.VaiTro, tk.TrangThai AS TrangThaiTK,
             nv.MaNhanVien, nv.HoTen AS HoTenNV, nv.MaChiNhanh, nv.SoDienThoai AS SdtNV, nv.Email AS EmailNV, nv.CapBac, nv.ChucVu,
             kh.MaKhachHang, kh.HoTen AS HoTenKH, kh.SoDienThoai AS SdtKH, kh.Email AS EmailKH,
             cn.TenChiNhanh
      FROM TaiKhoan tk
      LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
      LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
      LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh
      WHERE (
        tk.TenDangNhap = ? 
        OR tk.MaTaiKhoan = ? 
        OR nv.MaNhanVien = ? 
        OR kh.MaKhachHang = ? 
        OR nv.SoDienThoai = ? 
        OR kh.SoDienThoai = ? 
        OR LOWER(nv.Email) = LOWER(?) 
        OR LOWER(kh.Email) = LOWER(?)
      )
    `, [ident, ident, ident, ident, ident, ident, ident, ident]);

    if (rows && rows.length > 0) {
      const u = rows[0];
      const isPassMatch = verifyPassword(pass, u.MatKhau);

      if (isPassMatch) {
        clearLoginFailures(rateKey);

        if (u.TrangThaiTK && u.TrangThaiTK.includes('Khóa')) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Tài khoản của bạn đang bị khóa.' }));
          return true;
        }

        // Tự động nâng cấp mật khẩu legacy sang scrypt khi đăng nhập hợp lệ
        if (!String(u.MatKhau || '').startsWith('scrypt$')) {
          await querySql('UPDATE TaiKhoan SET MatKhau = ? WHERE MaTaiKhoan = ?', [hashPassword(pass), u.MaTaiKhoan]).catch(() => {});
        }

        const sysRole = resolveUserRole(u);
        const displayName = u.HoTenNV || u.HoTenKH || u.TenDangNhap;
        const branchName = resolveBranchName(u.MaChiNhanh, u.TenChiNhanh, sysRole);
        const userObj = {
          id: u.MaTaiKhoan,
          MaTaiKhoan: u.MaTaiKhoan,
          username: u.TenDangNhap,
          name: displayName,
          fullName: displayName,
          phone: u.SdtNV || u.SdtKH || u.TenDangNhap,
          email: u.EmailNV || u.EmailKH || '',
          role: sysRole,
          roleName: (sysRole === 'BARBER' && u.ChucVu) ? u.ChucVu : (ROLE_NAME_MAP[sysRole] || u.ChucVu || u.VaiTro || 'Khách Hàng'),
          vaiTroSql: u.VaiTro,
          chucVuSql: u.ChucVu,
          capBacSql: u.CapBac,
          staffId: u.MaNhanVien,
          customerId: u.MaKhachHang,
          branchId: u.MaChiNhanh || (sysRole === 'CUSTOMER' ? null : 'CN01'),
          branchName: branchName,
          TenChiNhanh: u.TenChiNhanh || branchName
        };

        const jwtToken = signJwt(userObj);

        logAudit({
          actor: `${displayName} (${u.TenDangNhap})`,
          role: sysRole,
          action: 'AUTH_LOGIN',
          entityType: 'TaiKhoan',
          entityId: u.MaTaiKhoan,
          branchId: u.MaChiNhanh || null,
          details: `Đăng nhập hệ thống thành công với vai trò [${sysRole}]`,
          ip: req.socket?.remoteAddress || '127.0.0.1'
        });

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

    recordLoginFailure(rateKey);
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: 'Sai thông tin đăng nhập hoặc mật khẩu.' }));
    return true;
  }

  async function hydrateAuthUserFromSql(baseUser) {
    let userObj = baseUser?.user || baseUser;
    const userId = userObj?.id || userObj?.sub || userObj?.MaTaiKhoan || userObj?.username;
    try {
      if (userId) {
        const rows = await querySql(`
          SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.VaiTro,
                 nv.MaNhanVien, nv.HoTen AS HoTenNV, nv.MaChiNhanh, nv.SoDienThoai AS SdtNV, nv.Email AS EmailNV, nv.ChucVu,
                 kh.MaKhachHang, kh.HoTen AS HoTenKH, kh.SoDienThoai AS SdtKH, kh.Email AS EmailKH,
                 cn.TenChiNhanh
          FROM TaiKhoan tk
          LEFT JOIN NhanVien nv ON tk.MaNhanVien = nv.MaNhanVien
          LEFT JOIN KhachHang kh ON tk.MaKhachHang = kh.MaKhachHang
          LEFT JOIN ChiNhanh cn ON nv.MaChiNhanh = cn.MaChiNhanh
          WHERE tk.MaTaiKhoan = ? OR tk.TenDangNhap = ?
        `, [userId, userId]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          const freshBranchId = r.MaChiNhanh || userObj.branchId || null;
          const freshBranchName = r.TenChiNhanh || userObj.branchName || null;
          userObj = {
            ...userObj,
            fullName: r.HoTenNV || r.HoTenKH || userObj.fullName,
            branchId: freshBranchId,
            branchName: freshBranchName,
            MaChiNhanh: freshBranchId,
            TenChiNhanh: freshBranchName
          };
        }
      }
    } catch (e) {
      console.warn('Error refreshing user from SQL:', e.message);
    }
    return userObj;
  }

  // POST /api/auth/refresh-token - Làm mới JWT khi phiên còn hiệu lực
  if (pathname === '/api/auth/refresh-token' && method === 'POST') {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
    const rawToken = String(parsedBody?.refreshToken || parsedBody?.token || bearerToken || '').trim();
    const decoded = verifyJwt(rawToken);
    if (!decoded) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' }));
      return true;
    }
    const hydrated = await hydrateAuthUserFromSql(decoded);
    const { iat, exp, ...cleanUser } = hydrated;
    const newToken = signJwt(cleanUser);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, token: newToken, user: cleanUser }));
    return true;
  }

  // POST /api/auth/logout - Đăng xuất phiên làm việc hiện tại
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const authUser = extractAuthUser(req);
    if (authUser) {
      logAudit({
        actor: `${authUser.fullName || authUser.username || authUser.id}`,
        role: authUser.role || 'CUSTOMER',
        action: 'AUTH_LOGOUT',
        entityType: 'TaiKhoan',
        entityId: authUser.id || authUser.MaTaiKhoan || '',
        branchId: authUser.branchId || null,
        details: 'Đăng xuất phiên làm việc'
      });
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đăng xuất thành công!' }));
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

    const userObj = await hydrateAuthUserFromSql(authUser);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      status: 'authenticated',
      user: userObj
    }));
    return true;
  }

  // PUT /api/auth/profile - Cập nhật hồ sơ cá nhân (bắt buộc JWT & kiểm tra chủ sở hữu)
  if (pathname === '/api/auth/profile' && method === 'PUT') {
    const authUser = enforceAuth(req, res);
    if (!authUser) return true;

    const { id, fullName, phone, email, birthday, ngaySinh } = parsedBody || {};
    const targetId = (id || authUser.id || '').trim();
    if (!targetId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Thiếu mã tài khoản cần cập nhật.' }));
      return true;
    }

    const ownerIds = [authUser.id, authUser.userId, authUser.staffId, authUser.customerId].filter(Boolean);
    if (!isSuperAdmin(authUser) && !ownerIds.includes(targetId)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Bạn không có quyền chỉnh sửa hồ sơ của tài khoản khác.' }));
      return true;
    }

    const bday = normalizeDateToIso(birthday || ngaySinh);
    const cleanPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (fullName || '').trim();

    const targetAccRows = await querySql(
      `SELECT TOP 1 MaTaiKhoan, MaNhanVien, MaKhachHang
       FROM TaiKhoan
       WHERE MaTaiKhoan = ? OR MaNhanVien = ? OR MaKhachHang = ?`,
      [targetId, targetId, targetId]
    );
    const targetAcc = targetAccRows && targetAccRows[0] ? targetAccRows[0] : null;
    const isStaffTarget = Boolean(
      targetAcc?.MaNhanVien ||
      (!targetAcc && (targetId.startsWith('TK_NV') || targetId.startsWith('NV') || (ownerIds.includes(targetId) && authUser.staffId)))
    );

    if (isStaffTarget) {
      const nvId = targetAcc?.MaNhanVien || (ownerIds.includes(targetId) ? authUser.staffId : null) || targetId.replace(/^TK_/, '');
      if (!nvId) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Không tìm thấy hồ sơ nhân sự cần cập nhật.' }));
        return true;
      }
      if (cleanPhone) {
        const dupNv = await querySql('SELECT MaNhanVien FROM NhanVien WHERE SoDienThoai = ? AND MaNhanVien <> ?', [cleanPhone, nvId]);
        if (dupNv && dupNv.length > 0) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Số điện thoại này đã được sử dụng bởi nhân sự khác.' }));
          return true;
        }
      }
      await querySql(
        `UPDATE NhanVien SET HoTen = COALESCE(?, HoTen), SoDienThoai = COALESCE(?, SoDienThoai), Email = COALESCE(?, Email) WHERE MaNhanVien = ?`,
        [cleanName || null, cleanPhone || null, cleanEmail || null, nvId]
      );
      if (cleanPhone) {
        await querySql(`UPDATE TaiKhoan SET TenDangNhap = ? WHERE MaNhanVien = ? AND TenDangNhap <> 'admin'`, [cleanPhone, nvId]).catch(() => {});
      }
    } else {
      const khId = targetAcc?.MaKhachHang || (ownerIds.includes(targetId) ? authUser.customerId : null) || targetId.replace(/^TK_/, '');
      if (!khId) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Không tìm thấy hồ sơ khách hàng cần cập nhật.' }));
        return true;
      }
      if (cleanPhone) {
        const dupKh = await querySql('SELECT MaKhachHang FROM KhachHang WHERE SoDienThoai = ? AND MaKhachHang <> ?', [cleanPhone, khId]);
        if (dupKh && dupKh.length > 0) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Số điện thoại này đã được sử dụng bởi khách hàng khác.' }));
          return true;
        }
        const dupTk = await querySql('SELECT MaTaiKhoan FROM TaiKhoan WHERE TenDangNhap = ? AND (MaKhachHang IS NULL OR MaKhachHang <> ?)', [cleanPhone, khId]);
        if (dupTk && dupTk.length > 0) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Tên đăng nhập / số điện thoại này đã tồn tại.' }));
          return true;
        }
      }
      if (bday) {
        await querySql(
          `UPDATE KhachHang SET HoTen = COALESCE(?, HoTen), SoDienThoai = COALESCE(?, SoDienThoai), Email = COALESCE(?, Email), NgaySinh = ? WHERE MaKhachHang = ?`,
          [cleanName || null, cleanPhone || null, cleanEmail || null, bday, khId]
        );
      } else {
        await querySql(
          `UPDATE KhachHang SET HoTen = COALESCE(?, HoTen), SoDienThoai = COALESCE(?, SoDienThoai), Email = COALESCE(?, Email) WHERE MaKhachHang = ?`,
          [cleanName || null, cleanPhone || null, cleanEmail || null, khId]
        );
      }
      if (cleanPhone) {
        await querySql(`UPDATE TaiKhoan SET TenDangNhap = ? WHERE MaKhachHang = ?`, [cleanPhone, khId]);
      }
    }

    const actorName = cleanName || authUser.fullName || authUser.username || targetId;
    const actorRole = authUser.role || 'CUSTOMER';
    auditService.logAudit({
      actor: actorName,
      role: actorRole,
      action: 'UPDATE_PROFILE',
      entityType: 'TaiKhoan',
      entityId: targetId,
      branchId: authUser.branchId || null,
      after: { fullName: cleanName, phone: cleanPhone, email: cleanEmail },
      details: `${actorName} (${actorRole}) cập nhật thông tin hồ sơ cá nhân`
    }).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Cập nhật hồ sơ thành công!' }));
    return true;
  }

  return false;
}

module.exports = handleAuthRoutes;
module.exports.handleAuthRoutes = handleAuthRoutes;
module.exports.default = handleAuthRoutes;

