// Kiểm tra token và phân quyền tài khoản
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Tải khóa ký JWT từ biến môi trường hoặc tạo ngẫu nhiên vào file config/jwt_secret.key (gitignored)
 */
function loadJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 32) {
    return process.env.JWT_SECRET.trim();
  }
  const secretFile = path.join(__dirname, '..', 'config', 'jwt_secret.key');
  try {
    if (fs.existsSync(secretFile)) {
      const stored = fs.readFileSync(secretFile, 'utf8').trim();
      if (stored.length >= 32) return stored;
    }
    const generated = crypto.randomBytes(48).toString('hex');
    fs.mkdirSync(path.dirname(secretFile), { recursive: true });
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
    return generated;
  } catch (_) {
    return crypto.randomBytes(48).toString('hex');
  }
}

const JWT_SECRET = loadJwtSecret();
const DEFAULT_EXPIRY_SECONDS = 86400; // 24 giờ

/**
 * Băm mật khẩu an toàn bằng scrypt với salt ngẫu nhiên 16 byte
 */
function hashPassword(plainPassword) {
  const raw = String(plainPassword || '');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(raw, salt, 32).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * So sánh mật khẩu nhập vào với chuỗi băm scrypt hoặc mật khẩu legacy trong SQL
 */
function verifyPassword(plainPassword, storedPassword) {
  const raw = String(plainPassword || '');
  const stored = String(storedPassword || '');
  if (!raw || !stored) return false;

  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const [, salt, hexHash] = parts;
    if (!salt || !hexHash) return false;
    try {
      const derived = crypto.scryptSync(raw, salt, 32);
      const target = Buffer.from(hexHash, 'hex');
      if (derived.length !== target.length) return false;
      return crypto.timingSafeEqual(derived, target);
    } catch (_) {
      return false;
    }
  }

  const a = Buffer.from(raw, 'utf8');
  const b = Buffer.from(stored, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Chuẩn hóa mã vai trò sang chuẩn hệ thống
 */
function normalizeAuthRole(role) {
  const raw = String(role || '').trim().toUpperCase();
  if (!raw) return 'CUSTOMER';
  if (raw === 'SUPER_ADMIN' || raw === 'ADMIN' || raw === 'QUẢN TRỊ VIÊN') return 'SUPER_ADMIN';
  if (raw === 'BRANCH_MANAGER' || raw === 'MANAGER' || raw === 'QUẢN LÝ CHI NHÁNH' || raw === 'QUẢN LÝ') return 'BRANCH_MANAGER';
  if (raw === 'CASHIER' || raw === 'THU NGÂN') return 'CASHIER';
  if (raw === 'BARBER' || raw === 'STYLIST' || raw === 'THỢ CẮT' || raw === 'KỸ THUẬT VIÊN') return 'BARBER';
  if (raw === 'STAFF' || raw === 'NHÂN VIÊN') return 'STAFF';
  return 'CUSTOMER';
}

function isSuperAdmin(user) {
  return normalizeAuthRole(user?.role) === 'SUPER_ADMIN';
}

function isBranchManager(user) {
  return normalizeAuthRole(user?.role) === 'BRANCH_MANAGER';
}

function isStaffRole(user) {
  return ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'BARBER', 'STAFF'].includes(normalizeAuthRole(user?.role));
}

function base64UrlEncode(strOrBuffer) {
  const buf = Buffer.isBuffer(strOrBuffer) ? strOrBuffer : Buffer.from(strOrBuffer, 'utf8');
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Tạo token JWT HS256 chuẩn
 */
function signJwt(payload, expiresInSeconds = DEFAULT_EXPIRY_SECONDS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const enriched = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(enriched));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(unsignedToken)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signature}`;
}

/**
 * Xác thực và giải mã token JWT HS256 an toàn thời gian hằng
 */
function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const [encodedHeader, encodedPayload, signature] = parts;
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    if (!header || header.alg !== 'HS256' || (header.typ && header.typ !== 'JWT')) {
      return null;
    }

    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(unsignedToken)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (!payload) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp !== undefined) {
      const expNum = Number(payload.exp);
      if (Number.isNaN(expNum)) return null;
      const expSec = expNum > 1e12 ? Math.floor(expNum / 1000) : expNum;
      if (expSec < now) return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Trích xuất người dùng từ Authorization Bearer Header của HTTP request
 */
function extractAuthUser(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (!authHeader || typeof authHeader !== 'string') return null;

  let token = authHeader.trim();
  if (token.startsWith('Bearer ') || token.startsWith('bearer ')) {
    token = token.slice(7).trim();
  } else {
    return null;
  }

  if (!token) return null;

  const payload = verifyJwt(token);
  if (payload) {
    return payload;
  }

  return null;
}

/**
 * Middleware bắt buộc xác thực JWT và kiểm tra vai trò hợp lệ
 */
function enforceAuth(req, res, allowedRoles = []) {
  const user = extractAuthUser(req);
  if (!user) {
    if (res && !res.headersSent) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
      }));
    }
    return null;
  }

  const normalizedRole = normalizeAuthRole(user.role);
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(normalizeAuthRole);
    const hasAccess = normalizedAllowed.includes(normalizedRole) ||
      (normalizedAllowed.includes('STAFF') && isStaffRole(user));
    if (!hasAccess) {
      if (res && !res.headersSent) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền thực hiện thao tác này.'
        }));
      }
      return null;
    }
  }

  return {
    ...user,
    role: normalizedRole,
    isSuperAdmin: normalizedRole === 'SUPER_ADMIN',
    isBranchManager: normalizedRole === 'BRANCH_MANAGER'
  };
}

// Cấu hình CORS cho phép web và mobile
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8080').split(',').map(o => o.trim());

function getCorsOrigin(reqOrigin) {
  if (!reqOrigin) return '*';
  const trimmed = reqOrigin.trim();
  if (
    trimmed.startsWith('http://localhost:') ||
    trimmed.startsWith('https://localhost:') ||
    trimmed.startsWith('http://127.0.0.1:') ||
    trimmed.startsWith('https://127.0.0.1:') ||
    trimmed.startsWith('http://10.0.2.2:') ||
    trimmed.startsWith('https://10.0.2.2:') ||
    ALLOWED_ORIGINS.includes(trimmed)
  ) {
    return trimmed;
  }
  return ALLOWED_ORIGINS[0] || '*';
}

module.exports = {
  signJwt,
  verifyJwt,
  extractAuthUser,
  enforceAuth,
  normalizeAuthRole,
  isSuperAdmin,
  isBranchManager,
  isStaffRole,
  hashPassword,
  verifyPassword,
  JWT_SECRET,
  ALLOWED_ORIGINS,
  getCorsOrigin
};

