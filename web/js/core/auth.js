// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
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
    INVENTORY_MANAGER: 'INVENTORY_MANAGER',
    CUSTOMER: 'CUSTOMER'
  });

  const ROLE_NAMES = Object.freeze({
    SUPER_ADMIN: 'Quản Trị Tối Cao',
    BRANCH_MANAGER: 'Quản Lý Chi Nhánh',
    STYLIST: 'Thợ Barber Chuyên Nghiệp',
    CASHIER: 'Thu Ngân / Tiếp Tân',
    INVENTORY_MANAGER: 'Quản Lý Kho & Hàng Hóa',
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

  const JWT_SECRET = 'OMNI_ENTERPRISE_SECRET_KEY_2026_PRODUCTION_SUPER_SAFE';
  const ACCESS_TOKEN_EXP_SECONDS = 7200; // 2 giờ
  const REFRESH_TOKEN_EXP_SECONDS = 604800; // 7 ngày

  // --------------------------------------------------------------------------
  // 2. TÀI KHOẢN MẪU ĐÃ XÁC THỰC (SEED REPOSITORY DATA)
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // 2. 100 TÀI KHOẢN & PHÂN QUYỀN RBAC TRÍCH XUẤT 100% TỪ QL_SALON.sql
  // --------------------------------------------------------------------------

  const RAW_STAFF_SQL = [
    ["NV01","CN01","Lê Hoàng Hải","0912001001","hai.lh@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV02","CN01","Đỗ Đình Độ","0912001002","do.dd@salontoc.vn","Master Barber","Thợ chính"],
    ["NV03","CN01","Lê Hữu Luân","0912001003","luan.lh@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV61","CN01","Nguyễn Thảo My","0912021001","my.nt@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV04","CN02","Phạm Thu Thảo","0912002001","thao.pt@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV05","CN02","Trần Quốc Huy","0912002002","huy.tq@salontoc.vn","Master Barber","Thợ chính"],
    ["NV06","CN02","Nguyễn Minh Triết","0912002003","triet.nm@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV62","CN02","Trần Bích Phương","0912021002","phuong.tb@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV07","CN03","Võ Quốc Bảo","0912003001","bao.vq@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV08","CN03","Đặng Hoài Nam","0912003002","nam.dh@salontoc.vn","Senior Barber","Thợ chính"],
    ["NV09","CN03","Bùi Tuấn Anh","0912003003","anh.bt@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV63","CN03","Lê Ngọc Hân","0912021003","han.ln@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV10","CN04","Phan Thanh Tùng","0912004001","tung.pt@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV11","CN04","Hà Quốc Trọng","0912004002","trong.hq@salontoc.vn","Master Barber","Thợ chính"],
    ["NV12","CN04","Ngô Gia Huy","0912004003","huy.ng@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV64","CN04","Phạm Quỳnh Nga","0912021004","nga.pq@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV13","CN05","Trần Đức Minh","0912005001","minh.td@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV14","CN05","Dương Hoàng Long","0912005002","long.dh@salontoc.vn","Master Barber","Thợ chính"],
    ["NV15","CN05","Lê Minh Khang","0912005003","khang.lm@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV65","CN05","Hoàng Thùy Linh","0912021005","linh.ht@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV16","CN06","Nguyễn Hữu Đạt","0912006001","dat.nh@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV17","CN06","Trịnh Xuân Phong","0912006002","phong.tx@salontoc.vn","Senior Barber","Thợ chính"],
    ["NV18","CN06","Vũ Hữu Phước","0912006003","phuoc.vh@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV66","CN06","Đỗ Mỹ Linh","0912021006","linh.dm@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV19","CN07","Võ Hoàng Sơn","0912007001","son.vh@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV20","CN07","Đinh Trọng Nghĩa","0912007002","nghia.dt@salontoc.vn","Master Barber","Thợ chính"],
    ["NV21","CN07","Phạm Nhật Tân","0912007003","tan.pn@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV67","CN07","Vũ Phương Ly","0912021007","ly.vp@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV22","CN08","Lý Thành Danh","0912008001","danh.lt@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV23","CN08","Đỗ Thái Bảo","0912008002","bao.dt@salontoc.vn","Senior Barber","Thợ chính"],
    ["NV24","CN08","Trần Vĩnh Phát","0912008003","phat.tv@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV68","CN08","Đặng Thu Hà","0912021008","ha.dt@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV25","CN09","Hồ Quang Hiếu","0912009001","hieu.hq@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV26","CN09","Lâm Trường Giang","0912009002","giang.lt@salontoc.vn","Master Barber","Thợ chính"],
    ["NV27","CN09","Đoàn Văn Hậu","0912009003","hau.dv@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV69","CN09","Bùi Ánh Tuyết","0912021009","tuyet.ba@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV28","CN10","Nguyễn Quang Dũng","0912010001","dung.nq@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV29","CN10","Bùi Tiến Dũng","0912010002","dung.bt@salontoc.vn","Senior Barber","Thợ chính"],
    ["NV30","CN10","Võ Đình Trọng","0912010003","trong.vd@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV70","CN10","Ngô Thanh Vân","0912021010","van.nt@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV31","CN11","Trương Minh Tuấn","0912011001","tuan.tm@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV32","CN11","Lê Minh Nhựt","0912011002","nhut.lm@salontoc.vn","Master Barber","Thợ chính"],
    ["NV33","CN11","Trần Khải Hoàn","0912011003","hoan.tk@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV71","CN11","Dương Cẩm Lynh","0912021011","lynh.dc@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV34","CN12","Đặng Quốc Việt","0912012001","viet.dq@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV35","CN12","Cao Xuân Trường","0912012002","truong.cx@salontoc.vn","Senior Barber","Thợ chính"],
    ["NV36","CN12","Nguyễn Hữu Thắng","0912012003","thang.nh@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV72","CN12","Lý Nhã Kỳ","0912021012","ky.ln@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV37","CN13","Hà Anh Tuấn","0912013001","tuan.ha@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV38","CN13","Phan Đình Phùng","0912013002","phung.pd@salontoc.vn","Master Barber","Thợ chính"],
    ["NV39","CN13","Lương Thế Vinh","0912013003","vinh.lt@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV73","CN13","Mai Phương Thúy","0912021013","thuy.mp@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV40","CN14","Tô Hiến Thành","0912014001","thanh.th@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV41","CN14","Nguyễn Trãi","0912014002","trai.nt@salontoc.vn","Senior Barber","Thợ chính"],
    ["NV42","CN14","Lê Lợi An","0912014003","an.lla@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV74","CN14","Trịnh Kim Chi","0912021014","chi.tk@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV43","CN15","Trần Bình Trọng","0912015001","trong.tb@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV44","CN15","Phạm Ngũ Lão","0912015002","lao.pn@salontoc.vn","Master Barber","Thợ chính"],
    ["NV45","CN15","Yết Kiêu Hoàng","0912015003","hoang.yk@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV75","CN15","Hà Kiều Anh","0912021015","anh.hk@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV46","CN16","Dã Tượng Khang","0912016001","khang.dt@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV47","CN16","Trần Hưng Long","0912016002","long.th@salontoc.vn","Senior Barber","Thợ chính"],
    ["NV48","CN16","Lý Thường Kiệt B","0912016003","kiet.ltb@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV76","CN16","Trần Tiểu Vy","0912021016","vy.tt@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV49","CN17","Quang Trung Vũ","0912017001","vu.qt@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV50","CN17","Ngô Quyền Sang","0912017002","sang.nq@salontoc.vn","Master Barber","Thợ chính"],
    ["NV51","CN17","Đinh Bộ Lĩnh Đức","0912017003","duc.dbl@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV77","CN17","Lương Thùy Linh","0912021017","linh.lt@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV52","CN18","Lê Đại Hành Khôi","0912018001","khoi.ldh@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV53","CN18","Phùng Hưng Thịnh","0912018002","thinh.ph@salontoc.vn","Senior Barber","Thợ chính"],
    ["NV54","CN18","Mai Hắc Đế Cường","0912018003","cuong.mhd@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV78","CN18","Nguyễn Thúc Thùy Tiên","0912021018","tien.ntt@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV55","CN19","Triệu Quang Phục","0912019001","phuc.tqp@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV56","CN19","Lý Nam Đế Toàn","0912019002","toan.lnd@salontoc.vn","Master Barber","Thợ chính"],
    ["NV57","CN19","Khúc Thừa Dụ Tâm","0912019003","tam.ktd@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV79","CN19","Đoàn Thiên Ân","0912021019","an.dt@salontoc.vn","Nhân viên","Thu ngân"],
    ["NV58","CN20","Nguyễn Huệ Tân","0912020001","tan.nh@salontoc.vn","Quản lý","Quản lý chi nhánh"],
    ["NV59","CN20","Nguyễn Lữ Khoa","0912020002","khoa.nl@salontoc.vn","Master Barber","Thợ chính"],
    ["NV60","CN20","Nguyễn Nhạc Bình","0912020003","binh.nn@salontoc.vn","Junior Barber","Thợ phụ"],
    ["NV80","CN20","Huỳnh Thị Thanh Thủy","0912021020","thuy.htt@salontoc.vn","Nhân viên","Thu ngân"]
  ];

  const RAW_CUSTOMERS_SQL = [
    ["KH01","Ngô Văn Tuấn","0988000001","vantuan@gmail.com","1998-05-14"],
    ["KH02","Trần Mỹ Linh","0988000002","mylinh.tran@gmail.com","2001-11-20"],
    ["KH03","Đặng Thanh Tùng","0988000003","thanhtung.dang@gmail.com","1995-03-08"],
    ["KH04","Vũ Phương Thảo","0988000004","phuongthao.vu@gmail.com","2000-09-12"],
    ["KH05","Lê Minh Khôi","0988000005","minhkhoi.le@gmail.com","1992-07-24"],
    ["KH06","Hoàng Trọng Nghĩa","0988000006","nghia.ht@gmail.com","2001-09-12"],
    ["KH07","Trần Đình Phong","0988000007","phong.td@gmail.com","1999-12-05"],
    ["KH08","Nguyễn Hải Đăng","0988000008","haidang.nguyen@gmail.com","1997-04-18"],
    ["KH09","Dương Gia Bảo","0988000009","giabao.duong@gmail.com","2002-08-25"],
    ["KH10","Phan Hoàng Long","0988000010","hoanglong.phan@gmail.com","1996-10-30"],
    ["KH11","Đinh Quốc Việt","0988000011","quocviet.dinh@gmail.com","1994-01-15"],
    ["KH12","Lâm Thanh Sơn","0988000012","thanhson.lam@gmail.com","1998-12-02"],
    ["KH13","Mai Tấn Phát","0988000013","tanphat.mai@gmail.com","2003-06-19"],
    ["KH14","Trương Hoàng Phúc","0988000014","hoangphuc.truong@gmail.com","1997-02-28"],
    ["KH15","Võ Hoài Nam","0988000015","hoainam.vo@gmail.com","1995-11-11"],
    ["KH16","Đoàn Hữu Tài","0988000016","huutai.doan@gmail.com","2000-03-22"],
    ["KH17","Cao Minh Đạt","0988000017","minhdat.cao@gmail.com","1993-07-07"],
    ["KH18","Bùi Quang Huy","0988000018","quanghuy.bui@gmail.com","1999-05-09"],
    ["KH19","Hồ Văn Cường","0988000019","vancuong.ho@gmail.com","2001-10-14"],
    ["KH20","Trịnh Công Minh","0988000020","congminh.trinh@gmail.com","1996-08-08"]
  ];

  const SEED_USERS = [
    // Super Admin Hệ Thống
    {
      id: 'TK_ADMIN',
      MaTaiKhoan: 'TK_ADMIN',
      MaNhanVien: null,
      MaKhachHang: null,
      username: 'admin',
      password: 'admin123',
      fullName: 'Chủ Tịch OmniSalon',
      email: 'admin@omnisalon.vn',
      phone: '19008899',
      role: ROLES.SUPER_ADMIN,
      roleName: 'Quản Trị Tối Cao',
      CapBac: 'Chủ Tịch HĐQT',
      ChucVu: 'Tổng Giám Đốc',
      branchId: null,
      branchName: 'Toàn Bộ Hệ Thống Chuỗi Omni Salon',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 10000,
      tier: 'Chủ Tịch HĐQT',
      isActive: true
    },
    // 80 Nhân Sự chuẩn xác thực SQL (Quản lý CN: nv123 | Barber: nv123 | Thu ngân: tn123)
    ...RAW_STAFF_SQL.map(item => {
      const isManager = item[6] === 'Quản lý chi nhánh';
      const isCashier = item[6] === 'Thu ngân';
      const role = isManager ? ROLES.BRANCH_MANAGER : (isCashier ? ROLES.CASHIER : ROLES.STYLIST);
      const password = isCashier ? 'tn123' : 'nv123';
      return {
        id: `TK_${item[0]}`,
        MaTaiKhoan: `TK_${item[0]}`,
        MaNhanVien: item[0],
        MaKhachHang: null,
        username: `user_${item[0].toLowerCase()}`,
        password: password,
        fullName: item[2],
        email: item[4],
        phone: item[3],
        role: role,
        roleName: item[6],
        CapBac: item[5],
        ChucVu: item[6],
        branchId: item[1],
        branchName: `Omni Salon Barber ${item[1]}`,
        avatarUrl: isCashier
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        rewardPoints: isManager ? 5000 : (isCashier ? 1000 : 2000),
        tier: item[5],
        isActive: true
      };
    }),
    // 20 Khách Hàng chuẩn xác thực SQL (Mật khẩu: kh123)
    ...RAW_CUSTOMERS_SQL.map(item => ({
      id: `TK_${item[0]}`,
      MaTaiKhoan: `TK_${item[0]}`,
      MaNhanVien: null,
      MaKhachHang: item[0],
      username: `user_${item[0].toLowerCase()}`,
      password: 'kh123',
      fullName: item[1],
      email: item[3],
      phone: item[2],
      role: ROLES.CUSTOMER,
      roleName: 'Khách hàng',
      CapBac: null,
      ChucVu: null,
      branchId: null,
      branchName: 'Khách Hàng',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
      rewardPoints: 500,
      tier: 'Khách Hàng VIP',
      isActive: true
    }))
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
    static _serverAccounts = null;

    static async syncWithServer() {
      try {
        if (typeof fetch === 'function') {
          const res = await fetch('/api/accounts');
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
      const base = (this._serverAccounts && this._serverAccounts.length > 0) ? this._serverAccounts : SEED_USERS;
      return [...base, ...dynamicUsers];
    }

    static findByIdentifier(identifier) {
      if (!identifier || typeof identifier !== 'string') return null;
      const clean = identifier.trim().toLowerCase();
      const all = this.getAll();

      // Hỗ trợ alias quản trị tối cao (admin, user_admin, admin@omnisalon.vn)
      if (clean === 'admin' || clean === 'admin@omnisalon.vn' || clean === 'user_admin' || clean === 'executive@omnisalon.vn' || clean === 'hahien_master') {
        const adminUser = all.find(u => u.username === 'admin' || u.role === ROLES.SUPER_ADMIN);
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
      this.clientOtpStore = new Map();
      this.init();
    }

    init() {
      UserRepository.syncWithServer();
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

      const isValid = (user.password === password) || (user.alternatePassword === password);
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

    sendOtp(email) {
      if (!email || !ValidatorService.validateEmail(email)) {
        return { success: false, message: 'Địa chỉ Email không đúng định dạng.' };
      }
      const lower = email.trim().toLowerCase();
      const now = Date.now();
      const existing = this.clientOtpStore.get(lower);
      if (existing && (now - existing.lastSentAt) < 30000) {
        const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
        return { success: false, message: `Vui lòng đợi ${waitSec} giây trước khi yêu cầu gửi lại.` };
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.clientOtpStore.set(lower, {
        otp,
        expiresAt: now + 5 * 60 * 1000,
        lastSentAt: now
      });
      return {
        success: true,
        message: `Mã xác nhận 6 số đã được gửi đến email ${lower}.`,
        otp
      };
    }

    verifyOtp(email, otp) {
      if (!email || !otp) {
        return { success: false, message: 'Vui lòng nhập đầy đủ Email và Mã xác nhận OTP.' };
      }
      const lower = email.trim().toLowerCase();
      const entry = this.clientOtpStore.get(lower);
      if (!entry) {
        return { success: false, message: 'Mã xác nhận chưa được gửi hoặc đã hết hiệu lực.' };
      }
      if (Date.now() > entry.expiresAt) {
        this.clientOtpStore.delete(lower);
        return { success: false, message: 'Mã xác nhận đã hết hạn (quá 5 phút). Vui lòng yêu cầu gửi lại.' };
      }
      if (entry.otp !== String(otp).trim()) {
        return { success: false, message: 'Mã xác nhận không chính xác. Vui lòng kiểm tra lại.' };
      }
      this.clientOtpStore.delete(lower);
      return { success: true, message: 'Xác thực mã OTP thành công!' };
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

      // Xác thực OTP nếu được cung cấp
      if (userData.otp !== undefined && userData.otp !== null && userData.otp !== '') {
        const verifyRes = this.verifyOtp(email, userData.otp);
        if (!verifyRes.success) {
          return verifyRes;
        }
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

    resetPassword(resetData) {
      if (!resetData || typeof resetData !== 'object') {
        return { success: false, message: 'Dữ liệu không hợp lệ.' };
      }
      const identifier = (resetData.identifier || resetData.email || resetData.phone || '').trim();
      const email = (resetData.email || '').trim().toLowerCase();
      const otp = (resetData.otp || '').trim();
      const newPassword = (resetData.newPassword || resetData.password || '').trim();

      if (!identifier && !email) {
        return { success: false, message: 'Vui lòng cung cấp email hoặc tên đăng nhập/SĐT.' };
      }
      if (!newPassword || newPassword.length < 3) {
        return { success: false, message: 'Mật khẩu mới phải có tối thiểu 3 ký tự.' };
      }

      if (otp) {
        const verifyRes = this.verifyOtp(email || identifier, otp);
        if (!verifyRes.success) {
          return verifyRes;
        }
      }

      const user = UserRepository.findByIdentifier(identifier) || (email ? UserRepository.findByEmail(email) : null);
      if (user) {
        user.password = newPassword;
        user.alternatePassword = newPassword;
        UserRepository.save(user);
        this._syncStore('PASSWORD_RESET', user);
      }

      return {
        success: true,
        message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được lưu và cập nhật.'
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

