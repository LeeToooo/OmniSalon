(function (window) {
  'use strict';

  // Domain constants & rbac definitions

  const ROLES = Object.freeze({
    SUPER_ADMIN: 'SUPER_ADMIN',
    BRANCH_MANAGER: 'BRANCH_MANAGER',
    STYLIST: 'STYLIST',
    BARBER: 'BARBER',
    CASHIER: 'CASHIER',
    CUSTOMER: 'CUSTOMER'
  });

  const ROLE_NAMES = Object.freeze({
    SUPER_ADMIN: 'Quản Trị Viên',
    BRANCH_MANAGER: 'Quản Lý Chi Nhánh',
    STYLIST: 'Thợ Barber Chuyên Nghiệp',
    BARBER: 'Thợ Barber Chuyên Nghiệp',
    CASHIER: 'Thu Ngân / Tiếp Tân',
    CUSTOMER: 'Khách Hàng Thành Viên'
  });

  const BRANCH_SQL_MAP = Object.freeze({
    CN01: 'Omni Salon Barber Q1 - Bến Thành',
    CN02: 'Omni Salon Barber Tân Bình - Cộng Hòa',
    CN03: 'Omni Salon Barber Bình Thạnh - Điện Biên Phủ',
    CN04: 'Omni Salon Barber Q3 - Nam Kỳ Khởi Nghĩa',
    CN05: 'Omni Salon Barber Q5 - Trần Hưng Đạo',
    CN06: 'Omni Salon Barber Q7 - Nguyễn Thị Thập',
    CN07: 'Omni Salon Barber Q10 - 3 Tháng 2',
    CN08: 'Omni Salon Barber Phú Nhuận - Phan Xích Long',
    CN09: 'Omni Salon Barber Gò Vấp - Quang Trung',
    CN10: 'Omni Salon Barber Thủ Đức - Võ Văn Ngân',
    CN11: 'Omni Salon Barber Thảo Điền - Xuân Thủy',
    CN12: 'Omni Salon Barber Q4 - Hoàng Diệu',
    CN13: 'Omni Salon Barber Q6 - Hậu Giang',
    CN14: 'Omni Salon Barber Q8 - Phạm Hùng',
    CN15: 'Omni Salon Barber Q11 - Ông Ích Khiêm',
    CN16: 'Omni Salon Barber Q12 - Lê Văn Khương',
    CN17: 'Omni Salon Barber Tân Phú - Lũy Bán Bích',
    CN18: 'Omni Salon Barber Bình Tân - Tên Lửa',
    CN19: 'Omni Salon Barber Bình Chánh - Quốc Lộ 50',
    CN20: 'Omni Salon Barber Hóc Môn - Lý Thường Kiệt'
  });

  /**
   * Helper phân giải tên chi nhánh đầy đủ một cách phòng thủ và nhất quán
   */
  function resolveFullBranchName(bId, rawBranchName, role) {
    if (role === ROLES.SUPER_ADMIN || role === 'SUPER_ADMIN') {
      return 'Toàn Bộ Hệ Thống Chuỗi Omni Salon';
    }
    if (role === ROLES.CUSTOMER || role === 'CUSTOMER') {
      return 'Khách Hàng';
    }
    const cleanId = (bId || '').toUpperCase().trim();
    if (rawBranchName && typeof rawBranchName === 'string') {
      const trimmed = rawBranchName.trim();
      if (trimmed && trimmed !== 'Chi Nhánh OmniSalon' && trimmed !== 'Omni Salon Barber' && trimmed !== 'Toàn Bộ Hệ Thống Salon' && !trimmed.startsWith('Omni Salon Barber CN')) {
        return trimmed;
      }
      const codeMatch = trimmed.match(/CN\d+/i) || (cleanId ? cleanId.match(/CN\d+/i) : null);
      if (codeMatch && BRANCH_SQL_MAP[codeMatch[0].toUpperCase()]) {
        return BRANCH_SQL_MAP[codeMatch[0].toUpperCase()];
      }
    }
    if (cleanId && BRANCH_SQL_MAP[cleanId]) {
      return BRANCH_SQL_MAP[cleanId];
    }
    if (typeof window !== 'undefined' && window.store && typeof window.store.getBranches === 'function') {
      const branches = window.store.getBranches() || [];
      const found = branches.find(b => (b.id && b.id.toUpperCase() === cleanId) || (b.MaChiNhanh && b.MaChiNhanh.toUpperCase() === cleanId));
      if (found && (found.TenChiNhanh || found.name)) {
        return (found.TenChiNhanh || found.name).trim();
      }
    }
    return cleanId ? (BRANCH_SQL_MAP[cleanId] || ('Omni Salon Barber ' + cleanId)) : 'Omni Salon Barber Q1 - Bến Thành';
  }

  function normalizeRole(value) {
    if (!value) return ROLES.CUSTOMER;
    const clean = String(value).trim().toUpperCase();
    if (clean === 'QUẢN TRỊ VIÊN' || clean === 'QUẢN TRỊ' || clean === 'QUẢN TRỊ TỐI CAO' || clean === 'SUPER_ADMIN' || clean === 'ADMIN') return ROLES.SUPER_ADMIN;
    if (clean === 'QUẢN LÝ' || clean === 'QUẢN LÝ CHI NHÁNH' || clean === 'BRANCH_MANAGER') return ROLES.BRANCH_MANAGER;
    if (clean === 'THU NGÂN' || clean === 'THU_NGÂN' || clean === 'CASHIER') return ROLES.CASHIER;
    if (clean === 'THỢ CHÍNH' || clean === 'THỢ PHỤ' || clean === 'MASTER BARBER' || clean === 'SENIOR BARBER' || clean === 'JUNIOR BARBER' || clean === 'STYLIST' || clean === 'BARBER' || clean === 'NHÂN VIÊN') return ROLES.BARBER;
    return ROLES.CUSTOMER;
  }

  function stripVietnameseTones(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase();
  }

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
    INVENTORY_MANAGER: [
      'auth:login', 'auth:update_profile',
      'catalog:view', 'catalog:manage',
      'inventory:view_all', 'inventory:view_branch', 'inventory:update',
      'report:view_all', 'report:view_branch'
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
    BARBER: [
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

  const ACCESS_TOKEN_EXP_SECONDS = 7200; // 2 giờ
  const REFRESH_TOKEN_EXP_SECONDS = 604800; // 7 ngày

  // Không lưu khóa ký JWT hay tài khoản/mật khẩu mặc định phía trình duyệt;
  // mọi xác thực tài khoản và chữ ký JWT đều thực hiện tại Backend Server.
  const SEED_USERS = [];

  // Layer: validator service

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

  // Layer: token service

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

    static verifyDetailed(token) {
      if (!token || typeof token !== 'string') return { valid: false, error: 'EMPTY' };

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
      if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
        return { valid: false, error: 'MALFORMED' };
      }

      try {
        const header = JSON.parse(this.base64UrlDecode(parts[0]));
        if (!header || header.alg !== 'HS256') {
          return { valid: false, error: 'INVALID_ALG' };
        }
        const payloadStr = this.base64UrlDecode(parts[1]);
        const payload = JSON.parse(payloadStr);

        const now = Math.floor(Date.now() / 1000);
        if (!payload || (payload.exp && payload.exp < now)) {
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

  // Layer: user repository

  class UserRepository {
    static _serverAccounts = null;

    static async syncWithServer() {
      try {
        if (typeof fetch === 'function' && window.AuthEngine && typeof window.AuthEngine.getAuthHeader === 'function') {
          const authHeader = window.AuthEngine.getAuthHeader();
          if (!authHeader || !authHeader.Authorization) return;
          const cur = window.AuthEngine.getCurrentUser();
          if (!cur || !['SUPER_ADMIN', 'BRANCH_MANAGER'].includes(String(cur.role || '').toUpperCase())) return;
          const accUrl = (typeof location !== 'undefined' && location.port === '3000') ? '/api/accounts' : 'http://localhost:3000/api/accounts';
          const res = await fetch(accUrl, { headers: authHeader });
          if (res && res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
              this._serverAccounts = list;
            }
          }
        }
      } catch (e) {}
    }

    static getAll() {
      let dynamicUsers = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
        if (raw) dynamicUsers = JSON.parse(raw);
      } catch (e) {
        dynamicUsers = [];
      }

      const serverList = (this._serverAccounts && this._serverAccounts.length > 0) ? this._serverAccounts : [];
      const userMap = new Map();
      // Luôn bảo tồn SEED_USERS, bao gồm TK_ADMIN / admin
      SEED_USERS.forEach(u => userMap.set(u.id || u.username, u));
      // Kết hợp tài khoản thành viên đăng ký cục bộ
      dynamicUsers.forEach(u => {
        const k = (u.username || u.phone || u.id || '').toLowerCase();
        if (k) userMap.set(k, u);
      });
      // Dữ liệu tài khoản từ SQL Server là nguồn chuẩn tuyệt đối
      serverList.forEach(u => {
        const k = (u.username || u.phone || u.id || '').toLowerCase();
        // Nếu đã có trong userMap, từ local/seed, đồng bộ mật khẩu & vai trò mới nhất từ SQL Server
        for (const [key, val] of userMap.entries()) {
          const valPhone = (val.phone || '').trim();
          const valEmail = (val.email || '').trim().toLowerCase();
          const valUser = (val.username || '').trim().toLowerCase();
          const uPhone = (u.phone || '').trim();
          const uEmail = (u.email || '').trim().toLowerCase();
          const uUser = (u.username || '').trim().toLowerCase();
          if ((uPhone && valPhone === uPhone) || (uEmail && valEmail === uEmail) || (uUser && valUser === uUser)) {
            val.password = u.password || val.password;
            val.alternatePassword = u.alternatePassword || u.password || val.alternatePassword;
            val.MaKhachHang = u.MaKhachHang || val.MaKhachHang;
            val.MaNhanVien = u.MaNhanVien || val.MaNhanVien;
            val.branchId = u.branchId || val.branchId;
            val.branchName = resolveFullBranchName(u.branchId || val.branchId, u.branchName || val.branchName, val.role);
            val.TenChiNhanh = u.TenChiNhanh || val.TenChiNhanh;
          }
        }
        if (k) {
          const existing = userMap.get(k);
          if (existing) {
            userMap.set(k, {
              ...existing,
              ...u,
              password: existing.password || u.password,
              alternatePassword: existing.alternatePassword || u.alternatePassword || existing.password,
              branchName: resolveFullBranchName(u.branchId || existing.branchId, u.branchName || existing.branchName, existing.role || u.role)
            });
          } else {
            userMap.set(k, {
              ...u,
              branchName: resolveFullBranchName(u.branchId, u.branchName, u.role)
            });
          }
        }
      });

      return Array.from(userMap.values());
    }

    static findByIdentifier(identifier) {
      if (!identifier || typeof identifier !== 'string') return null;
      const clean = identifier.trim().toLowerCase();
      const cleanStrip = stripVietnameseTones(clean);
      const cleanNoSpace = clean.replace(/\s+/g, '');
      const cleanStripNoSpace = cleanStrip.replace(/\s+/g, '');
      const all = this.getAll();

      // Hỗ trợ alias quản trị viên, admin, user_admin, admin@omnisalon.vn
      if (clean === 'admin' || clean === 'admin@omnisalon.vn' || clean === 'user_admin' || clean === 'executive@omnisalon.vn' || clean === 'hahien_master') {
        const adminUser = all.find(u => u.username === 'admin' || u.role === ROLES.SUPER_ADMIN || u.id === 'TK_ADMIN')
                       || SEED_USERS.find(u => u.username === 'admin');
        if (adminUser) return adminUser;
      }

      return all.find(u => {
        const email = (u.email || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const phone = (u.phone || '').trim();
        const staffId = (u.MaNhanVien || '').toLowerCase();
        const custId = (u.MaKhachHang || '').toLowerCase();
        const accId = (u.id || u.MaTaiKhoan || '').toLowerCase();
        const fullName = (u.fullName || '').toLowerCase();
        const fullNameStrip = stripVietnameseTones(fullName);
        const fullNameNoSpace = fullName.replace(/\s+/g, '');
        const fullNameStripNoSpace = fullNameStrip.replace(/\s+/g, '');

        return email === clean ||
               username === clean ||
               phone === clean ||
               staffId === clean ||
               custId === clean ||
               accId === clean ||
               fullName === clean ||
               fullNameNoSpace === cleanNoSpace ||
               fullNameStrip === cleanStrip ||
               fullNameStripNoSpace === cleanStripNoSpace;
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
      if (!newUser) return false;
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
        let dynamicUsers = raw ? JSON.parse(raw) : [];
        const cleanPhone = (newUser.phone || '').trim();
        const cleanEmail = (newUser.email || '').trim().toLowerCase();
        const cleanUsername = (newUser.username || '').trim().toLowerCase();
        const cleanId = (newUser.id || newUser.MaTaiKhoan || '').trim();

        const idx = dynamicUsers.findIndex(u => {
          if (cleanId && (u.id === cleanId || u.MaTaiKhoan === cleanId)) return true;
          if (cleanPhone && (u.phone || '').trim() === cleanPhone) return true;
          if (cleanEmail && (u.email || '').trim().toLowerCase() === cleanEmail) return true;
          if (cleanUsername && (u.username || '').trim().toLowerCase() === cleanUsername) return true;
          return false;
        });

        if (idx >= 0) {
          dynamicUsers[idx] = { ...dynamicUsers[idx], ...newUser };
        } else {
          dynamicUsers.push(newUser);
        }
        localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(dynamicUsers));

        if (this._serverAccounts && Array.isArray(this._serverAccounts)) {
          const sIdx = this._serverAccounts.findIndex(u => {
            if (cleanId && (u.id === cleanId || u.MaTaiKhoan === cleanId)) return true;
            if (cleanPhone && (u.phone || '').trim() === cleanPhone) return true;
            if (cleanEmail && (u.email || '').trim().toLowerCase() === cleanEmail) return true;
            if (cleanUsername && (u.username || '').trim().toLowerCase() === cleanUsername) return true;
            return false;
          });
          if (sIdx >= 0) {
            this._serverAccounts[sIdx] = { ...this._serverAccounts[sIdx], ...newUser };
          }
        }
        return true;
      } catch (e) {
        console.error('[UserRepository] Error saving user:', e);
        return false;
      }
    }

    static updatePassword(identifier, newPassword) {
      if (!identifier || !newPassword) return false;
      const clean = identifier.trim().toLowerCase();
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
        let dynamicUsers = raw ? JSON.parse(raw) : [];
        let updated = false;
        dynamicUsers.forEach(u => {
          const email = (u.email || '').toLowerCase();
          const username = (u.username || '').toLowerCase();
          const phone = (u.phone || '').trim();
          const id = (u.id || u.MaTaiKhoan || '').toLowerCase();
          if (email === clean || username === clean || phone === clean || id === clean) {
            u.password = newPassword;
            u.alternatePassword = newPassword;
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(dynamicUsers));
        }

        if (this._serverAccounts && Array.isArray(this._serverAccounts)) {
          this._serverAccounts.forEach(u => {
            const email = (u.email || '').toLowerCase();
            const username = (u.username || '').toLowerCase();
            const phone = (u.phone || '').trim();
            const id = (u.id || u.MaTaiKhoan || '').toLowerCase();
            if (email === clean || username === clean || phone === clean || id === clean) {
              u.password = newPassword;
              u.alternatePassword = newPassword;
            }
          });
        }
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  // Layer: permission policy service

  class PermissionPolicyService {
    static hasRole(user, requiredRoles) {
      if (!user) return false;
      if (user.role === ROLES.SUPER_ADMIN) return true; // SuperAdmin bypass

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (roles.includes(user.role)) return true;
      // Đồng nhất BARBER và STYLIST
      if ((user.role === 'BARBER' || user.role === 'STYLIST') && (roles.includes('BARBER') || roles.includes('STYLIST'))) {
        return true;
      }
      return false;
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
      const ownerIds = [user.id, user.userId, user.customerId, user.MaKhachHang, user.staffId, user.MaNhanVien].filter(Boolean);
      return ownerIds.includes(resourceOwnerId);
    }

    static getPermissionsForRole(role) {
      return ROLE_PERMISSIONS[role] || [];
    }
  }

  // Layer: session storage service

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

  // Layer: auth engine

  class AuthEngine {
    constructor() {
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.listeners = [];
      this.clientOtpStore = new Map();
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
        if (session.userJson) {
          try {
            const cachedUser = JSON.parse(session.userJson);
            if (cachedUser && (cachedUser.id === this.currentUser.id || cachedUser.username === this.currentUser.username)) {
              if (cachedUser.branchId) this.currentUser.branchId = cachedUser.branchId;
              if (cachedUser.branchName) this.currentUser.branchName = cachedUser.branchName;
              if (cachedUser.MaChiNhanh) this.currentUser.MaChiNhanh = cachedUser.MaChiNhanh;
              if (cachedUser.TenChiNhanh) this.currentUser.TenChiNhanh = cachedUser.TenChiNhanh;
              if (cachedUser.role) this.currentUser.role = cachedUser.role;
              if (cachedUser.roleName) this.currentUser.roleName = cachedUser.roleName;
            }
          } catch (_) {}
        }
        this.syncCurrentUserWithServer();
      } else {
        this.clearSession();
      }
    }

    async syncCurrentUserWithServer() {
      if (!this.accessToken) return;
      try {
        const meUrl = (typeof location !== 'undefined' && location.port === '3000') ? '/api/auth/me' : 'http://localhost:3000/api/auth/me';
        const res = await fetch(meUrl, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        if (res.status === 401 || res.status === 403) {
          this.clearSession();
          this._syncStore('LOGOUT', null);
          this.notifySubscribers('LOGOUT', null);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'guest') {
            this.clearSession();
            this._syncStore('LOGOUT', null);
            this.notifySubscribers('LOGOUT', null);
            return;
          }
          if (data && data.success && data.user) {
            const u = data.user;
            if (this.currentUser) {
              if (u.branchId && this.currentUser.branchId !== u.branchId) {
                this.currentUser.branchId = u.branchId;
                this.currentUser.branchName = u.branchName || resolveFullBranchName(u.branchId, null, this.currentUser.role);
                this.currentUser.MaChiNhanh = u.branchId;
                this.currentUser.TenChiNhanh = this.currentUser.branchName;
              }
              if (u.fullName && this.currentUser.fullName !== u.fullName) {
                this.currentUser.fullName = u.fullName;
              }
              SessionStorageService.saveSession(this.accessToken, this.refreshToken, this.currentUser);
              if (window.store && window.store.state) {
                window.store.state.currentUser = { ...this.currentUser };
                window.store.saveState();
              }
              if (typeof window.AdminWeb?.updateHeaderBranchDisplay === 'function') {
                window.AdminWeb.updateHeaderBranchDisplay();
              }
            }
          }
        }
      } catch (err) {
        // Bỏ qua lỗi mạng tạm thời, không giả mạo token
      }
    }

    _mapPayloadToUser(payload) {
      const bId = payload.branchId || null;
      const bName = resolveFullBranchName(bId, payload.branchName, payload.role);

      return {
        id: payload.id || payload.userId || payload.sub,
        username: payload.username,
        fullName: payload.fullName || payload.name || payload.username || '',
        role: payload.role,
        roleName: payload.roleName || ROLE_NAMES[payload.role] || payload.role,
        branchId: bId,
        branchName: bName,
        email: payload.email || '',
        phone: payload.phone || '',
        avatarUrl: payload.avatarUrl || '/DataPicture/ChanDungTho/Tho1.jpg',
        rewardPoints: payload.rewardPoints || 0,
        tier: payload.tier || 'Thành Viên',
        staffId: payload.staffId || payload.MaNhanVien || null,
        customerId: payload.customerId || payload.MaKhachHang || null,
        MaNhanVien: payload.staffId || payload.MaNhanVien || null,
        MaKhachHang: payload.customerId || payload.MaKhachHang || null,
        CapBac: payload.CapBac || null,
        ChucVu: payload.ChucVu || null,
        vaiTroSql: payload.vaiTroSql || (payload.role === 'SUPER_ADMIN' ? 'Quản trị viên' : (payload.role === 'BRANCH_MANAGER' ? 'Quản lý' : (payload.role === 'CASHIER' ? 'Thu ngân' : (payload.role === 'CUSTOMER' ? 'Khách hàng' : 'Nhân viên')))),
        chucVuSql: payload.chucVuSql || payload.ChucVu || null,
        capBacSql: payload.capBacSql || payload.CapBac || null,
        permissions: payload.permissions || PermissionPolicyService.getPermissionsForRole(payload.role)
      };
    }

    login(identifier, password) {
      return {
        success: false,
        message: 'Vui lòng đăng nhập trực tiếp qua máy chủ xác thực (/api/auth/login).'
      };
    }

    sendOtp(identifier) {
      return {
        success: false,
        message: 'Vui lòng gửi mã OTP qua máy chủ (/api/auth/send-otp).'
      };
    }

    verifyOtp(identifier, otp) {
      return {
        success: false,
        message: 'Vui lòng xác thực mã OTP qua máy chủ (/api/auth/verify-otp).'
      };
    }

    register() {
      return {
        success: false,
        message: 'Vui lòng đăng ký tài khoản trực tiếp qua máy chủ (/api/auth/register).'
      };
    }

    resetPassword() {
      return {
        success: false,
        message: 'Vui lòng đặt lại mật khẩu qua máy chủ (/api/auth/reset-password).'
      };
    }

    setSessionFromBackend(backendUser, token) {
      if (!backendUser || !token || typeof token !== 'string' || token.split('.').length !== 3) {
        return null;
      }
      const role = backendUser.role || ROLES.CUSTOMER;
      const bId = backendUser.branchId || backendUser.MaChiNhanh || null;
      const bName = resolveFullBranchName(bId, backendUser.branchName || backendUser.TenChiNhanh, role);

      const mappedUser = {
        id: backendUser.id || backendUser.MaTaiKhoan || ('TK_' + (backendUser.MaKhachHang || backendUser.MaNhanVien || Date.now())),
        username: backendUser.username || backendUser.TenDangNhap || backendUser.phone || '',
        fullName: backendUser.fullName || backendUser.HoTenNV || backendUser.HoTenKH || '',
        email: backendUser.email || backendUser.EmailNV || backendUser.EmailKH || '',
        phone: backendUser.phone || backendUser.SdtNV || backendUser.SdtKH || '',
        role: role,
        roleName: backendUser.roleName || backendUser.ChucVu || backendUser.chucVuSql || backendUser.vaiTroSql || 'Khách Hàng',
        staffId: backendUser.staffId || backendUser.MaNhanVien || null,
        customerId: backendUser.customerId || backendUser.MaKhachHang || null,
        MaNhanVien: backendUser.staffId || backendUser.MaNhanVien || null,
        MaKhachHang: backendUser.customerId || backendUser.MaKhachHang || null,
        CapBac: backendUser.CapBac || backendUser.capBacSql || null,
        ChucVu: backendUser.ChucVu || backendUser.chucVuSql || null,
        vaiTroSql: backendUser.vaiTroSql || null,
        branchId: bId,
        branchName: bName,
        avatarUrl: backendUser.avatarUrl || '/DataPicture/ChanDungTho/Tho1.jpg',
        rewardPoints: backendUser.rewardPoints || 100,
        tier: backendUser.tier || 'Thành Viên',
        permissions: ROLE_PERMISSIONS[role] || []
      };

      this.currentUser = mappedUser;
      this.accessToken = token;
      this.refreshToken = null;

      SessionStorageService.saveSession(this.accessToken, '', this.currentUser);
      this._syncStore('LOGIN', this.currentUser);
      this.notifySubscribers('LOGIN', this.currentUser);

      return this.currentUser;
    }

    refreshSession() {
      this.clearSession();
      return false;
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
      if (!this.currentUser || !this.accessToken) return false;
      return Boolean(TokenService.verify(this.accessToken));
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
      if (!this.currentUser) return false;
      return PermissionPolicyService.hasRole(this.currentUser, requiredRoles);
    }

    hasPermission(permissionCode) {
      return PermissionPolicyService.hasPermission(this.currentUser, permissionCode);
    }

    canAccessBranch(branchId) {
      return PermissionPolicyService.canAccessBranch(this.currentUser, branchId);
    }

    canAccessResource(resourceOwnerId) {
      return PermissionPolicyService.canAccessResource(this.currentUser, resourceOwnerId);
    }

    async updateProfile(updates) {
      if (!this.isAuthenticated()) {
        return { success: false, message: 'Bạn chưa đăng nhập.' };
      }

      const user = this.currentUser;
      const targetId = user.MaNhanVien ? `TK_${user.MaNhanVien}` : (user.MaKhachHang ? `TK_${user.MaKhachHang}` : user.id);

      try {
        const apiUrl = (typeof window !== 'undefined' && window.location.origin)
          ? `${window.location.origin}/api/auth/profile`
          : 'http://localhost:3000/api/auth/profile';
        const res = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader()
          },
          body: JSON.stringify({
            id: targetId,
            fullName: updates.fullName ? updates.fullName.trim() : user.fullName,
            phone: updates.phone ? updates.phone.trim() : user.phone,
            email: updates.email ? updates.email.trim() : user.email
          })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.success === false) {
          return { success: false, message: data?.message || 'Không thể cập nhật thông tin cá nhân.' };
        }
      } catch (e) {
        return { success: false, message: 'Lỗi kết nối máy chủ khi cập nhật hồ sơ.' };
      }

      if (updates.fullName) user.fullName = updates.fullName.trim();
      if (updates.phone) user.phone = updates.phone.trim();
      if (updates.email) user.email = updates.email.trim();
      if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl.trim();

      SessionStorageService.saveSession(this.accessToken, this.refreshToken || '', this.currentUser);
      this._syncStore('PROFILE_UPDATED', this.currentUser);
      this.notifySubscribers('PROFILE_UPDATED', this.currentUser);

      return { success: true, message: 'Cập nhật thông tin thành công!', user: this.currentUser };
    }

    protectRoute(allowedRoles, onAuthorized, onDenied) {
      if (this.isAuthenticated() && this.hasRole(allowedRoles)) {
        if (typeof onAuthorized === 'function') onAuthorized(this.currentUser);
        return true;
      }
      if (typeof onDenied === 'function') onDenied(this.currentUser);
      return false;
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
      if (this.isAuthenticated() && this.hasPermission(permissionCode)) {
        if (typeof actionFn === 'function') actionFn(this.currentUser);
        return true;
      } else if (!this.isAuthenticated()) {
        if (typeof fallbackFn === 'function') fallbackFn();
        else this.triggerLoginModal('Vui lòng đăng nhập để thực hiện tính năng này.');
        return false;
      } else {
        if (typeof fallbackFn === 'function') fallbackFn();
        return false;
      }
    }

    triggerLoginModal(message) {
      if (window.UICommon && typeof window.UICommon.openAuthModal === 'function') {
        window.UICommon.openAuthModal('login', message);
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

  // Exposure

  const authInstance = new AuthEngine();
  authInstance.normalizeRole = normalizeRole;

  window.ROLES = ROLES;
  window.ROLE_NAMES = ROLE_NAMES;
  window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
  window.normalizeRole = normalizeRole;
  window.BRANCH_SQL_MAP = BRANCH_SQL_MAP;
  window.resolveFullBranchName = resolveFullBranchName;
  window.UserRepository = UserRepository;
  window.AuthEngine = authInstance;
  window.Auth = authInstance;

})(typeof window !== 'undefined' ? window : this);

