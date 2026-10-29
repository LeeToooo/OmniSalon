// Kiểm tra token và phân quyền tài khoản
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'OMNI_ENTERPRISE_SECRET_KEY_2026_PRODUCTION_SUPER_SAFE';
const DEFAULT_EXPIRY_SECONDS = 7200; // 2 giờ

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
 * Xác thực và giải mã token JWT
 */
function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;

  // Hỗ trợ legacy token dạng JWT_ROLE_TIMESTAMP nếu có trong bộ nhớ
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const [encodedHeader, encodedPayload, signature] = parts;
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(unsignedToken)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Token hết hạn
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
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  if (!token) return null;

  const payload = verifyJwt(token);
  if (payload) {
    return payload;
  }

  return null;
}

/**
 * Middleware kiểm tra quyền truy cập
 */
function enforceAuth(req, res, allowedRoles = []) {
  const user = extractAuthUser(req);

  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: false,
      message: '401 Unauthorized: Vui lòng đăng nhập để thực hiện thao tác này.'
    }));
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const roleAliases = {
      'SUPER_ADMIN': ['SUPER_ADMIN', 'QUẢN TRỊ VIÊN', 'ADMIN'],
      'BRANCH_MANAGER': ['BRANCH_MANAGER', 'QUẢN LÝ', 'MANAGER'],
      'CASHIER': ['CASHIER', 'THU NGÂN'],
      'STAFF': ['STAFF', 'NHÂN VIÊN', 'STYLIST'],
      'CUSTOMER': ['CUSTOMER', 'KHÁCH HÀNG']
    };

    const userRoles = [
      (user.role || '').toUpperCase(),
      (user.vaiTroSql || '').toUpperCase(),
      (user.roleName || '').toUpperCase()
    ].filter(Boolean);

    const isSuperAdmin = userRoles.some(r => r === 'SUPER_ADMIN' || r === 'QUẢN TRỊ VIÊN' || r === 'ADMIN');
    if (isSuperAdmin) return user;

    const normalizedAllowed = allowedRoles.flatMap(r => {
      const up = r.toUpperCase();
      return roleAliases[up] || [up];
    });

    const hasRole = userRoles.some(ur => {
      if (normalizedAllowed.includes(ur)) return true;
      for (const [key, aliases] of Object.entries(roleAliases)) {
        if (aliases.includes(ur) && normalizedAllowed.includes(key)) return true;
      }
      return false;
    });

    if (!hasRole) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        message: '403 Forbidden: Tài khoản của bạn không có quyền thực hiện thao tác này.'
      }));
      return null;
    }
  }

  return user;
}

// CORS Whitelist Configuration
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8080').split(',').map(o => o.trim());

function getCorsOrigin(reqOrigin) {
  if (!reqOrigin) return ALLOWED_ORIGINS[0];
  return ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0];
}

module.exports = {
  signJwt,
  verifyJwt,
  extractAuthUser,
  enforceAuth,
  JWT_SECRET,
  ALLOWED_ORIGINS,
  getCorsOrigin
};

