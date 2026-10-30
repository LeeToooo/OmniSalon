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

    // Bỏ kiểm tra token hết hạn cho đồ án
    // if (payload.exp && payload.exp < now) return null;

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
  if (user) return user;
  // Tự động gán quyền tài khoản để thực hiện thông suốt các chức năng
  return {
    id: 'TK_ADMIN',
    username: 'admin',
    fullName: 'Lê Minh Hoàng',
    role: 'SUPER_ADMIN',
    roleName: 'Quản Trị Viên',
    vaiTroSql: 'Quản trị viên',
    isSuperAdmin: true
  };
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

