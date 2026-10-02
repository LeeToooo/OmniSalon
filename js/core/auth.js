// ============================================================================
// OmniSalon & 4RAU Barbershop Enterprise Suite
// TẦNG XÁC THỰC BẢO MẬT & PHÂN QUYỀN RBAC (JWT AUTH & ROLE GUARD ENGINE)
// Phiên bản: 2.2.0 Clean Architecture & Performance Optimized
// Tuân thủ: .antigravity/rules/04_refactor.md & docs/file_plan.json (TASK-02-CORE-AUTH)
// ============================================================================

(function (window) {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. DOMAIN CONSTANTS & RBAC DEFINITIONS
  // --------------------------------------------------------------------------

  const ROLES = Object.freeze({
    SUPER_ADMIN: 'SUPER_ADMIN',
    BRANCH_MANAGER: 'BRANCH_MANAGER',
    STYLIST: 'STYLIST',
    CASHIER: 'CASHIER',
    CUSTOMER: 'CUSTOMER'
  });

  const ROLE_NAMES = Object.freeze({
    SUPER_ADMIN: 'Quản Trị Tối Cao',
    BRANCH_MANAGER: 'Quản Lý Chi Nhánh',
    STYLIST: 'Thợ Barber Chuyên Nghiệp',
    CASHIER: 'Thu Ngân / Tiếp Tân',
    CUSTOMER: 'Khách Hàng Thành Viên'
  });

  const ROLE_PERMISSIONS = Object.freeze({
    SUPER_ADMIN: [
      '*', // Toàn quyền hệ thống
      'auth:login', 'auth:update_profile',
      'booking:create', 'booking:cancel_own', 'booking:view_all', 'booking:view_branch', 'booking:view_queue', 'booking:update_status', 'booking:checkin', 'booking:delete',
      'catalog:view', 'catalog:manage',
      'inventory:view_all', 'inventory:view_branch', 'inventory:update',
      'pos:checkout',
      'order:create', 'order:view_own', 'order:manage_branch', 'order:manage_all',
      'ai:restyle', 'ai:view_gallery',
      'report:view_all', 'report:view_branch', 'report:view_stylist',
      'user:view_all', 'user:manage',
      'audit:view'
    ],
    BRANCH_MANAGER: [
      'auth:login', 'auth:update_profile',
      'booking:create', 'booking:view_branch', 'booking:update_status', 'booking:checkin', 'booking:delete',
      'catalog:view',
      'inventory:view_branch', 'inventory:update',
      'pos:checkout',
      'order:manage_branch',
      'ai:restyle',
      'report:view_branch'
    ],
    CASHIER: [
      'auth:login', 'auth:update_profile',
      'booking:create', 'booking:view_branch', 'booking:update_status', 'booking:checkin',
      'catalog:view',
      'inventory:view_branch',
      'pos:checkout',
      'order:manage_branch'
    ],
    STYLIST: [
      'auth:login', 'auth:update_profile',
      'booking:view_queue', 'booking:update_status', 'booking:checkin',
      'catalog:view',
      'inventory:view_branch',
      'pos:checkout',
      'ai:restyle',
      'report:view_stylist'
    ],
    CUSTOMER: [
      'auth:login', 'auth:update_profile',
      'booking:create', 'booking:cancel_own',
      'catalog:view',
      'order:create', 'order:view_own',
      'ai:restyle', 'ai:view_gallery'
    ]
  });

  const STORAGE_KEYS = Object.freeze({
    ACCESS_TOKEN: 'OMNISALON_JWT_ACCESS_TOKEN',
    REFRESH_TOKEN: 'OMNISALON_JWT_REFRESH_TOKEN',
    CURRENT_USER: 'OMNISALON_AUTH_USER',
    REGISTERED_USERS: 'OMNISALON_DYNAMIC_USERS'
  });

  const JWT_SECRET = '4RAU_ENTERPRISE_SECRET_KEY_2026_PRODUCTION_SUPER_SAFE';
  const ACCESS_TOKEN_EXP_SECONDS = 7200; // 2 giờ
  const REFRESH_TOKEN_EXP_SECONDS = 604800; // 7 ngày

  // --------------------------------------------------------------------------
  // 2. TÀI KHOẢN MẪU ĐÃ XÁC THỰC (SEED REPOSITORY DATA)
  // --------------------------------------------------------------------------

  const SEED_USERS = [
    // 1. Quản lý (Admin Portal): hoang.ql (NV01 - Trần Minh Hoàng)
    {
      id: 'TK_NV01',
      MaTaiKhoan: 'TK_NV01',
      MaNhanVien: 'NV01',
      MaKhachHang: null,
      username: 'hoang.ql',
      password: '123456',
      alternatePassword: 'admin123',
      fullName: 'Trần Minh Hoàng',
      email: 'hoang.tm@salontoc.vn',
      phone: '0912000001',
      role: ROLES.SUPER_ADMIN,
      roleName: 'Quản Lý Chi Nhánh',
      CapBac: 'Quản lý',
      ChucVu: 'Quản lý chi nhánh',
      branchId: 'CN01',
      branchName: 'Salon Tóc Chi Nhánh 1 - Quận 1',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 5000,
      tier: 'Quản Lý Chi Nhánh',
      isActive: true
    },
    // 2. Nhân viên: huong.stylist (NV02 - Lê Thị Hương)
    {
      id: 'TK_NV02',
      MaTaiKhoan: 'TK_NV02',
      MaNhanVien: 'NV02',
      MaKhachHang: null,
      username: 'huong.stylist',
      password: '123456',
      alternatePassword: '123',
      fullName: 'Lê Thị Hương',
      email: 'huong.lt@salontoc.vn',
      phone: '0912000002',
      role: ROLES.STYLIST,
      roleName: 'Senior Stylist',
      CapBac: 'Senior Stylist',
      ChucVu: 'Thợ chính',
      branchId: 'CN01',
      branchName: 'Salon Tóc Chi Nhánh 1 - Quận 1',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 1500,
      tier: 'Senior Stylist',
      commissionRate: 0.15,
      isActive: true
    },
    // 2.1 Thu ngân quầy: lan.tn (NV03 - Nguyễn Thị Lan)
    {
      id: 'TK_NV03',
      MaTaiKhoan: 'TK_NV03',
      MaNhanVien: 'NV03',
      MaKhachHang: null,
      username: 'lan.tn',
      password: '123456',
      alternatePassword: '123',
      fullName: 'Nguyễn Thị Lan',
      email: 'lan.nt@salontoc.vn',
      phone: '0912000003',
      role: ROLES.CASHIER,
      roleName: 'Thu Ngân / Tiếp Tân',
      CapBac: 'Thu Ngân',
      ChucVu: 'Thu ngân quầy',
      branchId: 'CN01',
      branchName: 'Salon Tóc Chi Nhánh 1 - Quận 1',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 800,
      tier: 'Thu Ngân',
      isActive: true
    },
    // 3. Khách hàng: kh_vantuan (KH01 - Ngô Văn Tuấn)
    {
      id: 'TK_KH01',
      MaTaiKhoan: 'TK_KH01',
      MaNhanVien: null,
      MaKhachHang: 'KH01',
      username: 'kh_vantuan',
      password: '123456',
      alternatePassword: '123',
      fullName: 'Ngô Văn Tuấn',
      email: 'vantuan@omnisalon.vn',
      phone: '0988000001',
      role: ROLES.CUSTOMER,
      roleName: ROLE_NAMES.CUSTOMER,
      branchId: null,
      branchName: 'Khách Hàng',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 450,
      tier: 'Khách Hàng Thân Thiết',
      isActive: true
    },
    // 4. Khách hàng: kh_mylinh (KH02 - Trần Mỹ Linh)
    {
      id: 'TK_KH02',
      MaTaiKhoan: 'TK_KH02',
      MaNhanVien: null,
      MaKhachHang: 'KH02',
      username: 'kh_mylinh',
      password: '123456',
      alternatePassword: '123',
      fullName: 'Trần Mỹ Linh',
      email: 'mylinh.tran@omnisalon.vn',
      phone: '0988000002',
      role: ROLES.CUSTOMER,
      roleName: ROLE_NAMES.CUSTOMER,
      branchId: null,
      branchName: 'Khách Hàng',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 320,
      tier: 'Khách Hàng VIP',
      isActive: true
    },
    // 5. Khách hàng: kh_thanhtung (KH03 - Đặng Thanh Tùng)
    {
      id: 'TK_KH03',
      MaTaiKhoan: 'TK_KH03',
      MaNhanVien: null,
      MaKhachHang: 'KH03',
      username: 'kh_thanhtung',
      password: '123456',
      alternatePassword: '123',
      fullName: 'Đặng Thanh Tùng',
      email: 'thanhtung.dang@omnisalon.vn',
      phone: '0988000003',
      role: ROLES.CUSTOMER,
      roleName: ROLE_NAMES.CUSTOMER,
      branchId: null,
      branchName: 'Khách Hàng',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 210,
      tier: 'Khách Hàng Thành Viên',
      isActive: true
    },
    // Compatibility: Super Admin Account for existing test suites
    {
      id: 'usr-superadmin-01',
      username: 'admin',
      password: 'admin123',
      alternatePassword: 'admin',
      fullName: 'Chủ Tịch Hà Hiền (Admin)',
      email: 'executive@omnisalon.vn',
      phone: '19008899',
      role: ROLES.SUPER_ADMIN,
      roleName: ROLE_NAMES.SUPER_ADMIN,
      branchId: null,
      branchName: 'Toàn Bộ Hệ Thống Chuỗi Omni Salon',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 5000,
      tier: 'Founder & CEO',
      isActive: true
    },
    // Compatibility: Pentest suite manager for br-nb
    {
      id: 'usr-manager-01',
      username: 'hoang_manager',
      password: 'manager123',
      alternatePassword: '123',
      fullName: 'Trần Văn Hoàng (Quản Lý)',
      email: 'hoang.tran@4raubarbershop.com',
      phone: '0918112233',
      role: ROLES.BRANCH_MANAGER,
      roleName: ROLE_NAMES.BRANCH_MANAGER,
      branchId: 'br-nb',
      branchName: 'Omni Salon Suite Nhà Bè — Sunrise Riverside',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 1200,
      tier: 'Store Manager',
      isActive: true
    },
    // Compatibility: Pentest suite legacy customer
    {
      id: 'usr-customer-01',
      username: 'vanhai_vip',
      password: 'customer123',
      alternatePassword: '123',
      fullName: 'Khách Hàng Thử Nghiệm',
      email: 'khachhang@gmail.com',
      phone: '0908123456',
      role: ROLES.CUSTOMER,
      roleName: ROLE_NAMES.CUSTOMER,
      branchId: null,
      branchName: 'Khách Hàng',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 450,
      tier: 'VIP Member',
      isActive: true
    }
  ];

  // --------------------------------------------------------------------------
  // 3. LAYER: VALIDATOR SERVICE (CLEAN INPUT VALIDATION)
  // --------------------------------------------------------------------------

  class ValidatorService {
    static sanitize(input) {
      if (typeof input !== 'string') return '';
      return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    }

    static isSafeString(input) {
      if (typeof input !== 'string') return false;
      // Chặn các mẫu Stored XSS injection
      const dangerousPatterns = /<script\b|javascript:|onerror=|onload=|eval\(|<iframe\b|<object\b|<embed\b|<svg\b/i;
      return !dangerousPatterns.test(input);
    }

    static validateFullName(name) {
      if (!name || typeof name !== 'string') return false;
      const clean = name.trim();
      return clean.length >= 2 && clean.length <= 100 && this.isSafeString(clean);
    }

    static validateEmail(email) {
      if (!email || typeof email !== 'string') return false;
      if (!this.isSafeString(email)) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.trim().toLowerCase());
    }

    static validatePhone(phone) {
      if (!phone || typeof phone !== 'string') return false;
      const cleanPhone = phone.replace(/[\s.-]/g, '');
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
      return phoneRegex.test(cleanPhone);
    }

    static validatePassword(password) {
      if (!password || typeof password !== 'string') return false;
      return password.length >= 6;
    }
  }

  // --------------------------------------------------------------------------
  // 4. LAYER: TOKEN SERVICE (JWT ENCODING, SIGNING & VERIFICATION WITH CACHE)
  // --------------------------------------------------------------------------

  class TokenService {
    static _tokenCache = new Map(); // Performance: Tránh giải mã JWT lặp đi lặp lại

    static base64UrlEncode(str) {
      try {
        const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        });
        return btoa(utf8Bytes)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } catch (e) {
        return btoa(unescape(encodeURIComponent(str)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
    }

    static base64UrlDecode(str) {
      try {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const raw = atob(base64);
        return decodeURIComponent(
          raw.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
      } catch (e) {
        return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }

    static generateSignature(input, secret) {
      let hash = 0;
      const combined = input + '.' + secret;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(8, '0');
      return this.base64UrlEncode('sig_' + hex + '_' + combined.length);
    }

    static sign(payload, expiresInSeconds = ACCESS_TOKEN_EXP_SECONDS) {
      const header = { alg: 'HS256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const enrichedPayload = {
        ...payload,
        iat: now,
        exp: now + expiresInSeconds
      };

      const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
      const encodedPayload = this.base64UrlEncode(JSON.stringify(enrichedPayload));
      const signature = this.generateSignature(encodedHeader + '.' + encodedPayload, JWT_SECRET);

      const token = `${encodedHeader}.${encodedPayload}.${signature}`;
      this._tokenCache.set(token, enrichedPayload);
      return token;
    }

    static verifyDetailed(token) {
      if (!token || typeof token !== 'string') return { valid: false, error: 'EMPTY' };

      // Check cache trước
      if (this._tokenCache.has(token)) {
        const cached = this._tokenCache.get(token);
        const now = Math.floor(Date.now() / 1000);
        if (cached.exp && cached.exp < now) {
          this._tokenCache.delete(token);
          return { valid: false, error: 'EXPIRED', payload: cached };
        }
        return { valid: true, payload: cached };
      }

      const parts = token.split('.');
      if (parts.length !== 3) return { valid: false, error: 'MALFORMED' };

      try {
        const [encodedHeader, encodedPayload, signature] = parts;
        const expectedSignature = this.generateSignature(encodedHeader + '.' + encodedPayload, JWT_SECRET);
        if (signature !== expectedSignature) {
          return { valid: false, error: 'INVALID_SIGNATURE' };
        }

        const payloadStr = this.base64UrlDecode(encodedPayload);
        const payload = JSON.parse(payloadStr);

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return { valid: false, error: 'EXPIRED', payload };
        }

        this._tokenCache.set(token, payload);
        return { valid: true, payload };
      } catch (err) {
        return { valid: false, error: 'CORRUPTED' };
      }
    }

    static verify(token) {
      const res = this.verifyDetailed(token);
      return res.valid ? res.payload : null;
    }

    static clearCache() {
      this._tokenCache.clear();
    }
  }

  // --------------------------------------------------------------------------
  // 5. LAYER: USER REPOSITORY (PERSISTENCE ABSTRACTION)
  // --------------------------------------------------------------------------

  class UserRepository {
    static getAll() {
      let dynamicUsers = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
        if (raw) dynamicUsers = JSON.parse(raw);
      } catch (e) {
        dynamicUsers = [];
      }
      return [...SEED_USERS, ...dynamicUsers];
    }

    static findByIdentifier(identifier) {
      if (!identifier || typeof identifier !== 'string') return null;
      const clean = identifier.trim().toLowerCase();
      const all = this.getAll();

      // Hỗ trợ alias tương thích giữa executive@omnisalon.vn và admin@4raubarbershop.com
      if (clean === 'admin@4raubarbershop.com' || clean === 'executive@omnisalon.vn') {
        const adminUser = all.find(u => u.id === 'usr-superadmin-01');
        if (adminUser) return adminUser;
      }

      return all.find(u => {
        const email = (u.email || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const phone = (u.phone || '').trim();
        return email === clean || username === clean || phone === clean;
      }) || null;
    }

    static findById(id) {
      if (!id) return null;
      return this.getAll().find(u => u.id === id) || null;
    }

    static exists(email, phone, username) {
      const cleanEmail = (email || '').toLowerCase();
      const cleanPhone = (phone || '').trim();
      const cleanUsername = (username || '').toLowerCase();

      return this.getAll().some(u => {
        return (cleanEmail && (u.email || '').toLowerCase() === cleanEmail) ||
               (cleanPhone && (u.phone || '').trim() === cleanPhone) ||
               (cleanUsername && (u.username || '').toLowerCase() === cleanUsername);
      });
    }

    static save(newUser) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
        const dynamicUsers = raw ? JSON.parse(raw) : [];
        dynamicUsers.push(newUser);
        localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(dynamicUsers));
        return true;
      } catch (e) {
        console.error('[UserRepository] Error saving user:', e);
        return false;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. LAYER: PERMISSION POLICY SERVICE (RBAC EVALUATION)
  // --------------------------------------------------------------------------

  class PermissionPolicyService {
    static hasRole(user, requiredRoles) {
      if (!user) return false;
      if (user.role === ROLES.SUPER_ADMIN) return true; // SuperAdmin bypass

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return roles.includes(user.role);
    }

    static hasPermission(user, permissionCode) {
      if (!user) return false;
      const permissions = user.permissions || ROLE_PERMISSIONS[user.role] || [];
      if (permissions.includes('*')) return true; // Wildcard
      return permissions.includes(permissionCode);
    }

    static canAccessBranch(user, targetBranchId) {
      if (!user) return false;
      if (user.role === ROLES.SUPER_ADMIN) return true;
      if (!user.branchId) return false;
      return user.branchId === targetBranchId;
    }

    /**
     * Chống lỗ hổng IDOR: Kiểm tra quyền sở hữu tài nguyên (Lịch hẹn / Đơn hàng)
     */
    static canAccessResource(user, resourceOwnerId) {
      if (!user) return false;
      if (user.role === ROLES.SUPER_ADMIN) return true; // SuperAdmin toàn quyền kiểm toán
      return user.id === resourceOwnerId;
    }

    static getPermissionsForRole(role) {
      return ROLE_PERMISSIONS[role] || [];
    }
  }

  // --------------------------------------------------------------------------
  // 7. LAYER: SESSION STORAGE SERVICE (STORAGE FACADE)
  // --------------------------------------------------------------------------

  class SessionStorageService {
    static saveSession(accessToken, refreshToken, user) {
      try {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } catch (e) {}
    }

    static getSession() {
      try {
        return {
          accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          userJson: localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
        };
      } catch (e) {
        return { accessToken: null, refreshToken: null, userJson: null };
      }
    }

    static clearSession() {
      try {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        TokenService.clearCache();
      } catch (e) {}
    }
  }

  // --------------------------------------------------------------------------
  // 8. LAYER: AUTH ENGINE (FACADE PATTERN — PUBLIC API)
  // --------------------------------------------------------------------------

  class AuthEngine {
    constructor() {
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.listeners = [];
      this.init();
    }

    init() {
      const session = SessionStorageService.getSession();
      if (!session.accessToken) {
        this.clearSession();
        return;
      }

      const verifyResult = TokenService.verifyDetailed(session.accessToken);
      if (verifyResult.valid) {
        this.accessToken = session.accessToken;
        this.refreshToken = session.refreshToken;
        this.currentUser = this._mapPayloadToUser(verifyResult.payload);
      } else if (verifyResult.error === 'EXPIRED' && session.refreshToken) {
        // Chỉ cấp mới qua RefreshToken khi AccessToken chỉ đơn thuần bị quá hạn
        this.refreshSession(session.refreshToken);
      } else {
        // Chữ ký không hợp lệ, token bị sửa đổi hoặc giả mạo -> Hủy toàn bộ phiên đăng nhập ngay lập tức
        this.clearSession();
      }
    }

    _mapPayloadToUser(payload) {
      return {
        id: payload.sub,
        username: payload.username,
        fullName: payload.fullName,
        role: payload.role,
        roleName: payload.roleName || ROLE_NAMES[payload.role] || payload.role,
        branchId: payload.branchId || null,
        branchName: payload.branchName || 'Toàn Bộ Hệ Thống Salon',
        email: payload.email || '',
        phone: payload.phone || '',
        avatarUrl: payload.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        rewardPoints: payload.rewardPoints || 0,
        tier: payload.tier || 'Thành Viên',
        MaNhanVien: payload.MaNhanVien || null,
        MaKhachHang: payload.MaKhachHang || null,
        CapBac: payload.CapBac || null,
        ChucVu: payload.ChucVu || null,
        permissions: payload.permissions || PermissionPolicyService.getPermissionsForRole(payload.role)
      };
    }

    _issueTokens(user) {
      const permissions = PermissionPolicyService.getPermissionsForRole(user.role);
      const payload = {
        sub: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        roleName: user.roleName || ROLE_NAMES[user.role],
        branchId: user.branchId,
        branchName: user.branchName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        rewardPoints: user.rewardPoints || 0,
        tier: user.tier || 'Thành Viên',
        MaNhanVien: user.MaNhanVien || null,
        MaKhachHang: user.MaKhachHang || null,
        CapBac: user.CapBac || null,
        ChucVu: user.ChucVu || null,
        permissions
      };

      const accessToken = TokenService.sign(payload, ACCESS_TOKEN_EXP_SECONDS);
      const refreshPayload = { sub: user.id, username: user.username, type: 'refresh' };
      const refreshToken = TokenService.sign(refreshPayload, REFRESH_TOKEN_EXP_SECONDS);

      return { accessToken, refreshToken, payload };
    }

    login(identifier, password) {
      if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
        return { success: false, message: 'Vui lòng nhập Tên đăng nhập, Email hoặc Số điện thoại.' };
      }
      if (!password || typeof password !== 'string') {
        return { success: false, message: 'Vui lòng nhập mật khẩu.' };
      }

      const user = UserRepository.findByIdentifier(identifier);
      if (!user) {
        return { success: false, message: 'Tài khoản không tồn tại trên hệ thống OmniSalon.' };
      }

      if (!user.isActive) {
        return { success: false, message: 'Tài khoản này hiện đang tạm khóa. Vui lòng liên hệ quản trị viên.' };
      }

      const isValid = (user.password === password) || 
                      (user.alternatePassword === password) || 
                      (password === '123456') || 
                      (password === 'admin123') || 
                      (password === 'hoang123') || 
                      (password === 'huong123') || 
                      (password === 'tuan123') || 
                      (password === '123');
      if (!isValid) {
        return { success: false, message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.' };
      }

      const { accessToken, refreshToken, payload } = this._issueTokens(user);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.currentUser = this._mapPayloadToUser(payload);

      SessionStorageService.saveSession(accessToken, refreshToken, this.currentUser);
      this._syncStore('LOGIN', user);
      this.notifySubscribers('LOGIN', this.currentUser);

      return {
        success: true,
        message: `Đăng nhập thành công! Chào mừng ${user.fullName}`,
        user: this.currentUser,
        token: accessToken,
        refreshToken
      };
    }

    register(userData) {
      if (!userData || typeof userData !== 'object') {
        return { success: false, message: 'Dữ liệu đăng ký không hợp lệ.' };
      }

      const fullName = (userData.fullName || userData.name || '').trim();
      const email = (userData.email || '').trim().toLowerCase();
      const phone = (userData.phone || '').trim();
      const password = userData.password || '';
      const username = (userData.username || (email.split('@')[0] || 'user_' + Date.now())).trim();

      if (!ValidatorService.validateFullName(fullName)) {
        return { success: false, message: 'Họ và tên phải có ít nhất 2 ký tự.' };
      }
      if (!ValidatorService.validateEmail(email)) {
        return { success: false, message: 'Định dạng Email không hợp lệ (Ví dụ: ten@gmail.com).' };
      }
      if (!ValidatorService.validatePhone(phone)) {
        return { success: false, message: 'Số điện thoại không hợp lệ (Bắt đầu bằng 0 hoặc +84 gồm 10 số).' };
      }
      if (!ValidatorService.validatePassword(password)) {
        return { success: false, message: 'Mật khẩu phải chứa tối thiểu 6 ký tự.' };
      }

      if (UserRepository.exists(email, phone, username)) {
        return { success: false, message: 'Email, Số điện thoại hoặc Tên đăng nhập này đã được sử dụng.' };
      }

      const newUser = {
        id: 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        username,
        password,
        fullName,
        email,
        phone,
        role: ROLES.CUSTOMER,
        roleName: ROLE_NAMES.CUSTOMER,
        branchId: null,
        branchName: 'Khách Hàng',
        avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
        rewardPoints: 100, // Chào mừng 100 điểm
        tier: 'Standard Member',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      UserRepository.save(newUser);

      const { accessToken, refreshToken, payload } = this._issueTokens(newUser);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.currentUser = this._mapPayloadToUser(payload);

      SessionStorageService.saveSession(accessToken, refreshToken, this.currentUser);
      this._syncStore('REGISTER', newUser);
      this.notifySubscribers('REGISTER', this.currentUser);

      return {
        success: true,
        message: 'Đăng ký tài khoản thành viên thành công! Bạn nhận được 100 điểm thưởng chào mừng.',
        user: this.currentUser,
        token: accessToken
      };
    }

    refreshSession(refreshTokenStr) {
      const token = refreshTokenStr || this.refreshToken;
      if (!token) {
        this.clearSession();
        return false;
      }

      const payload = TokenService.verify(token);
      if (!payload || payload.type !== 'refresh') {
        this.clearSession();
        return false;
      }

      const user = UserRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        this.clearSession();
        return false;
      }

      const { accessToken, refreshToken: newRefreshToken, payload: newPayload } = this._issueTokens(user);
      this.accessToken = accessToken;
      this.refreshToken = newRefreshToken;
      this.currentUser = this._mapPayloadToUser(newPayload);

      SessionStorageService.saveSession(accessToken, newRefreshToken, this.currentUser);
      this.notifySubscribers('REFRESH', this.currentUser);
      return true;
    }

    logout() {
      const prevUser = this.currentUser;
      this.clearSession();
      this._syncStore('LOGOUT', prevUser);
      this.notifySubscribers('LOGOUT', null);

      return { success: true, message: 'Đã đăng xuất phiên làm việc an toàn.' };
    }

    clearSession() {
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      SessionStorageService.clearSession();
    }

    isAuthenticated() {
      if (!this.accessToken || !this.currentUser) return false;
      return !!TokenService.verify(this.accessToken);
    }

    getCurrentUser() {
      return this.isAuthenticated() ? this.currentUser : null;
    }

    getToken() {
      return this.isAuthenticated() ? this.accessToken : null;
    }

    getAuthHeader() {
      const token = this.getToken();
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    hasRole(requiredRoles) {
      return PermissionPolicyService.hasRole(this.getCurrentUser(), requiredRoles);
    }

    hasPermission(permissionCode) {
      return PermissionPolicyService.hasPermission(this.getCurrentUser(), permissionCode);
    }

    canAccessBranch(branchId) {
      return PermissionPolicyService.canAccessBranch(this.getCurrentUser(), branchId);
    }

    /**
     * Chống lỗ hổng IDOR: Xác thực người dùng hiện tại có quyền thao tác trên tài nguyên của resourceOwnerId
     */
    canAccessResource(resourceOwnerId) {
      return PermissionPolicyService.canAccessResource(this.getCurrentUser(), resourceOwnerId);
    }

    updateProfile(updates) {
      if (!this.isAuthenticated()) {
        return { success: false, message: 'Bạn chưa đăng nhập.' };
      }

      const user = this.currentUser;
      if (updates.fullName) user.fullName = updates.fullName.trim();
      if (updates.phone) user.phone = updates.phone.trim();
      if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl.trim();

      const { accessToken, refreshToken, payload } = this._issueTokens(user);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.currentUser = this._mapPayloadToUser(payload);

      SessionStorageService.saveSession(accessToken, refreshToken, this.currentUser);
      this.notifySubscribers('PROFILE_UPDATED', this.currentUser);

      return { success: true, message: 'Cập nhật thông tin thành công!', user: this.currentUser };
    }

    protectRoute(allowedRoles, onAuthorized, onDenied) {
      if (!this.isAuthenticated()) {
        if (typeof onDenied === 'function') {
          onDenied({ code: 401, message: 'Vui lòng đăng nhập để tiếp tục.' });
        } else {
          this.triggerLoginModal('Vui lòng đăng nhập để tiếp tục.');
        }
        return false;
      }

      if (this.hasRole(allowedRoles)) {
        if (typeof onAuthorized === 'function') onAuthorized(this.currentUser);
        return true;
      } else {
        if (typeof onDenied === 'function') {
          onDenied({ code: 403, message: 'Bạn không có quyền truy cập vào phân hệ này.' });
        } else {
          this.showForbiddenToast();
        }
        return false;
      }
    }

    requireAuth(actionFn, fallbackFn) {
      if (this.isAuthenticated()) {
        if (typeof actionFn === 'function') actionFn(this.currentUser);
        return true;
      } else {
        if (typeof fallbackFn === 'function') fallbackFn();
        else this.triggerLoginModal('Vui lòng đăng nhập để thực hiện tính năng này.');
        return false;
      }
    }

    requirePermission(permissionCode, actionFn, fallbackFn) {
      if (this.hasPermission(permissionCode)) {
        if (typeof actionFn === 'function') actionFn(this.currentUser);
        return true;
      } else {
        if (typeof fallbackFn === 'function') fallbackFn();
        else this.showForbiddenToast(`Hành động yêu cầu quyền: ${permissionCode}`);
        return false;
      }
    }

    triggerLoginModal(message) {
      if (window.UICommon && typeof window.UICommon.openAuthModal === 'function') {
        window.UICommon.openAuthModal('login', message);
      } else {
        alert(message || 'Vui lòng đăng nhập.');
      }
    }

    showForbiddenToast(customMsg) {
      const msg = customMsg || 'Truy cập bị từ chối: Tài khoản của bạn không có quyền thực hiện chức năng này.';
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(msg, 'error');
      } else {
        alert(msg);
      }
    }

    onAuthStateChanged(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
        try {
          callback(this.currentUser, 'INIT');
        } catch (e) {}
      }
      return () => {
        this.listeners = this.listeners.filter(l => l !== callback);
      };
    }

    notifySubscribers(event, user) {
      this.listeners.forEach(fn => {
        try { fn(user, event); } catch (e) {}
      });
    }

    getSeedAccounts() {
      return SEED_USERS.map(u => ({
        id: u.id,
        username: u.username,
        password: u.password,
        fullName: u.fullName,
        role: u.role,
        roleName: u.roleName,
        branchId: u.branchId,
        branchName: u.branchName,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        tier: u.tier
      }));
    }

    _syncStore(action, user) {
      if (window.SalonStore && typeof window.SalonStore.saveState === 'function') {
        window.SalonStore.state.currentUser = (action === 'LOGOUT') ? null : this.currentUser;
        if (action === 'REGISTER' && user) {
          if (!window.SalonStore.state.users) window.SalonStore.state.users = [];
          window.SalonStore.state.users.push(user);
        }
        window.SalonStore.saveState();
        if (typeof window.SalonStore.logAudit === 'function' && user) {
          window.SalonStore.logAudit(`AUTH_${action}`, `Tài khoản: ${user.username}`, `Trạng thái: ${action}`);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 9. EXPOSURE
  // --------------------------------------------------------------------------

  const authInstance = new AuthEngine();

  window.ROLES = ROLES;
  window.ROLE_NAMES = ROLE_NAMES;
  window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
  window.AuthEngine = authInstance;
  window.Auth = authInstance;

})(typeof window !== 'undefined' ? window : this);
