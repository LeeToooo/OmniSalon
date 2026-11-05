// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE TIỆN ÍCH DÙNG CHUNG (CUSTOMER UTILS)
// File: web/frontend/js/modules/customer/customer-utils.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerUtils = {
    _findBookings(query) {
      if (!query) return [];
      if (window.store && typeof window.store.getBookingByPhoneOrId === 'function') {
        const res = window.store.getBookingByPhoneOrId(query);
        if (res && res.length > 0) return res;
      }
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const clean = String(query).toLowerCase().replace('#', '').trim();
      return all.filter(b =>
        (b.customerPhone && b.customerPhone.trim() === String(query).trim()) ||
        (b.customerPhone && b.customerPhone.includes(clean)) ||
        (b.id && b.id.toLowerCase().replace('#', '') === clean) ||
        (b.id && b.id.toLowerCase().includes(clean)) ||
        (b.bookingCode && b.bookingCode.toLowerCase().replace('#', '') === clean) ||
        (b.bookingCode && b.bookingCode.toLowerCase().includes(clean)) ||
        (b.MaLichHen && b.MaLichHen.toLowerCase().includes(clean))
      );
    },

    _findBookingById(id) {
      if (!id) return null;
      const clean = String(id).toLowerCase().replace('#', '').trim();
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      return all.find(b => (b.id && b.id.toLowerCase().replace('#', '') === clean) || (b.bookingCode && b.bookingCode.toLowerCase().replace('#', '') === clean)) || null;
    },

    _getUserBookings(user) {
      if (!user) return [];
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const phone = user.phone ? user.phone.trim() : null;
      const uid = user.id ? String(user.id) : null;
      return all.filter(b =>
        (phone && b.customerPhone && b.customerPhone.trim() === phone) ||
        (uid && (String(b.userId) === uid || String(b.customerId) === uid))
      );
    },

    _getUserOrders(user) {
      if (!user) return [];
      const all = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : [];
      const phone = user.phone ? user.phone.trim() : null;
      const uid = user.id ? String(user.id) : null;
      return all.filter(o =>
        (phone && o.customerPhone && o.customerPhone.trim() === phone) ||
        (uid && (String(o.userId) === uid || String(o.customerId) === uid))
      );
    },

    updateCartBadge() {
      const badges = document.querySelectorAll('.cart-badge-count');
      const cart = (window.store && typeof window.store.getCart === 'function') ? window.store.getCart() : [];
      const count = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
      if (badges.length > 0) {
        badges.forEach(badge => {
          badge.textContent = count;
          badge.style.display = count > 0 ? '' : 'none';
        });
      } else {
        if (typeof this.renderHeader === 'function') {
          this.renderHeader();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.renderHeader === 'function') {
          window.CustomerWeb.renderHeader();
        }
      }
      const dropdown = document.getElementById('headerCartDropdown');
      if (dropdown && dropdown.classList.contains('open')) {
        const renderMiniCartDropdownHTML = typeof this.renderMiniCartDropdownHTML === 'function'
          ? this.renderMiniCartDropdownHTML.bind(this)
          : (window.CustomerWeb && typeof window.CustomerWeb.renderMiniCartDropdownHTML === 'function'
              ? window.CustomerWeb.renderMiniCartDropdownHTML.bind(window.CustomerWeb)
              : null);
        if (renderMiniCartDropdownHTML) {
          dropdown.innerHTML = renderMiniCartDropdownHTML();
        }
      }
    },

    escapeHtml(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    getCurrentUser() {
      if (window.AuthEngine) {
        const u = typeof window.AuthEngine.getCurrentUser === 'function' ? window.AuthEngine.getCurrentUser() : window.AuthEngine.currentUser;
        if (u) return u;
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        const u = window.store.getCurrentUser();
        if (u) return u;
      }
      return null;
    },

    getRoleBadgeText(user) {
      if (!user) return 'Khách Vãng Lai';
      const role = String(user.role || user.vaiTroSql || user.VaiTro || '').toUpperCase();
      const chucVu = String(user.ChucVu || user.chucVuSql || '').toUpperCase();
      const uid = String(user.id || user.MaNhanVien || user.staffId || '').toUpperCase();

      if (uid === 'NV00' || role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'QUẢN TRỊ VIÊN' || chucVu === 'QUẢN TRỊ VIÊN' || user.username === 'admin') {
        return 'Quản Trị Tối Cao';
      }
      if (role === 'BRANCH_MANAGER' || role === 'QUẢN LÝ' || chucVu === 'QUẢN LÝ CHI NHÁNH' || chucVu.includes('QUẢN LÝ')) {
        return 'Quản Lý Chi Nhánh';
      }
      if (role === 'CASHIER' || role === 'THU NGÂN' || chucVu === 'THU NGÂN' || chucVu.includes('THU NGÂN')) {
        return 'Thu Ngân Tiếp Tân';
      }
      if (role === 'STYLIST' || role === 'STAFF' || role === 'NHÂN VIÊN' || chucVu === 'THỢ CHÍNH' || chucVu === 'THỢ PHỤ' || chucVu.includes('THỢ') || chucVu.includes('BARBER')) {
        return user.CapBac ? `${user.CapBac} (${user.ChucVu || 'Thợ Tóc'})` : (user.ChucVu || 'Thợ Barber Chuyên Nghiệp');
      }
      return `${user.tier && !user.tier.includes('OMNI') ? user.tier : 'Khách Hàng VIP'}`;
    },

    isAdminUser(user) {
      if (!user) return false;
      const role = String(user.role || user.vaiTroSql || user.VaiTro || '').toUpperCase();
      const chucVu = String(user.ChucVu || user.chucVuSql || '').toUpperCase();
      const username = String(user.username || '').toLowerCase();
      const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'QUẢN TRỊ VIÊN', 'QUẢN LÝ', 'QUẢN LÝ CHI NHÁNH', 'THU NGÂN', 'THỢ', 'THỢ CHÍNH', 'THỢ PHỤ', 'BARBER', 'STAFF', 'NHÂN VIÊN'];
      return staffRoles.includes(role) || role.includes('THỢ') || chucVu.includes('THỢ') || chucVu.includes('QUẢN LÝ') || chucVu.includes('THU NGÂN') || chucVu.includes('QUẢN TRỊ') || chucVu.includes('NHÂN VIÊN') || username === 'admin';
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerUtils = CustomerUtils;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerUtils);
  }

})(typeof window !== 'undefined' ? window : this);

