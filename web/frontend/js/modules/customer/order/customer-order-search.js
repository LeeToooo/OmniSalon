// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE TRA CỨU ĐƠN HÀNG MỸ PHẨM (CUSTOMER ORDER SEARCH)
// File: web/frontend/js/modules/customer/customer-order-search.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerOrderSearch = {
    /**
     * Escape chuỗi HTML an toàn
     */
    escapeHtml(str) {
      if (window.CustomerUtils && typeof window.CustomerUtils.escapeHtml === "function") { return window.CustomerUtils.escapeHtml(str); }
      if (typeof str !== 'string') return str == null ? '' : String(str);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Lấy thông tin tài khoản người dùng hiện tại
     */
    getCurrentUser() {
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        const u = window.AuthEngine.getCurrentUser();
        if (u) return u;
      }
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        return window.AuthEngine.getCurrentUser();
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        return window.store.getCurrentUser();
      }
      return null;
    },

    /**
     * Kiểm tra người dùng có quyền quản trị/nhân viên hay không
     */
    isAdminUser(user) {
      // Safe delegated call to isAdminUser
      if (window.CustomerUtils && typeof window.CustomerUtils.isAdminUser === "function") { return window.CustomerUtils.isAdminUser(user); }
      if (!user) return false;
      const role = String(user.role || user.vaiTroSql || user.VaiTro || '').toUpperCase();
      const chucVu = String(user.ChucVu || user.chucVuSql || '').toUpperCase();
      const username = String(user.username || '').toLowerCase();
      const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'QUẢN TRỊ VIÊN', 'QUẢN LÝ', 'QUẢN LÝ CHI NHÁNH', 'THU NGÂN', 'THỢ', 'THỢ CHÍNH', 'THỢ PHỤ', 'BARBER', 'STAFF', 'NHÂN VIÊN'];
      return staffRoles.includes(role) || role.includes('THỢ') || chucVu.includes('THỢ') || chucVu.includes('QUẢN LÝ') || chucVu.includes('THU NGÂN') || chucVu.includes('QUẢN TRỊ') || chucVu.includes('NHÂN VIÊN') || username === 'admin';
    },

    /**
     * Tra cứu chi tiết tiến trình đơn hàng mỹ phẩm theo SĐT hoặc mã đơn hàng
     */
    searchOrderLookup() {
      const container = document.getElementById('lookupResultsContainer');
      const input = document.getElementById('lookupSearchInput');
      if (!container) return;

      const getUser = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function'
            ? window.CustomerWeb.getCurrentUser.bind(window.CustomerWeb)
            : null);
      const user = getUser ? getUser() : null;

      const checkAdmin = (typeof this.isAdminUser === 'function')
        ? this.isAdminUser.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.isAdminUser === 'function'
            ? window.CustomerWeb.isAdminUser.bind(window.CustomerWeb)
            : null);
      const isAdmin = checkAdmin ? checkAdmin(user) : false;
      const isCustomer = user && !isAdmin;

      const rawQuery = isCustomer ? (user.phone || user.id || '') : (input ? input.value.trim() : '');
      const query = rawQuery.toLowerCase();

      const escapeFn = (s) => (typeof this.escapeHtml === 'function' ? this.escapeHtml(s) : (window.CustomerWeb?.escapeHtml ? window.CustomerWeb.escapeHtml(s) : String(s ?? '')));

      // Nếu chưa đăng nhập và ô tìm kiếm trống thì hiện hướng dẫn, tránh lộ đơn hàng người khác
      if (!isCustomer && (!query || query.length < 3)) {
        container.innerHTML = `
          <div style="padding: 32px 20px; text-align: center; background: var(--surface-elevated); border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
            <div style="font-size: 16px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">Tra Cứu Đơn Hàng Mỹ Phẩm</div>
            <div style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; max-width: 420px; margin: 0 auto 16px;">
              Vui lòng nhập <strong>Số điện thoại</strong> hoặc <strong>Mã đơn hàng</strong> (VD: DH11) vào ô tìm kiếm ở trên để tra cứu tiến trình đơn hàng của bạn.
            </div>
            <div style="font-size: 12px; color: #94a3b8; background: rgba(255,255,255,0.03); padding: 8px 14px; border-radius: 8px; display: inline-block;">
              💡 Vui lòng nhập đúng số điện thoại hoặc mã đơn để tra cứu trạng thái đơn hàng.
            </div>
          </div>
        `;
        return;
      }

      const orders = (window.store && typeof window.store.getOrders === 'function')
        ? window.store.getOrders()
        : (window.store && window.store.state && window.store.state.orders ? window.store.state.orders : []);

      let matches = [];
      if (isCustomer) {
        matches = orders.filter(o => {
          const userPhone = (user.phone || '').trim().toLowerCase();
          const oPhone = (o.customerPhone || '').trim().toLowerCase();
          const uId = (o.userId || '').trim().toLowerCase();
          const currentUserId = (user.id || '').trim().toLowerCase();
          return (userPhone && oPhone === userPhone) || (currentUserId && uId === currentUserId);
        });
      } else {
        // Lọc theo số điện thoại hoặc mã đơn hàng
        matches = orders.filter(o => {
          const oCode = (o.orderCode || o.id || o.MaDonHang || '').toLowerCase();
          const cPhone = (o.customerPhone || '').toLowerCase();
          return oCode === query || cPhone === query || (query.length >= 4 && (oCode.includes(query) || cPhone.includes(query)));
        });
      }

      if (!matches || matches.length === 0) {
        container.innerHTML = `
          <div style="padding: 28px 20px; text-align: center; background: var(--surface-elevated); border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 15px; font-weight: 700; color: #f59e0b; margin-bottom: 6px;">
              ${isCustomer ? 'Quý khách chưa có đơn hàng mỹ phẩm nào.' : `Không tìm thấy đơn hàng nào khớp với "${escapeFn(rawQuery)}".`}
            </div>
            <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">
              ${isCustomer ? 'Mời quý khách ghé thăm danh mục sáp vuốt và mỹ phẩm chính hãng tại Omni Salon.' : 'Quý khách vui lòng kiểm tra lại số điện thoại hoặc mã đơn hàng.'}
            </div>
            <div>
              <button class="btn-submit-terracotta" style="padding: 10px 24px; font-size: 13.5px; font-weight: 800; border-radius: 10px;" onclick="UICommon.closeGlobalModal(); if(window.AppRouter) window.AppRouter.navigate('/shop'); else CustomerWeb.switchTab('shop');">
                + Mua Mỹ Phẩm Ngay
              </button>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="font-size: 12px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px;">
          ${isCustomer ? `Đơn hàng của bạn (${matches.length} đơn):` : `Tìm thấy ${matches.length} đơn hàng:`}
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 420px; overflow-y: auto;">
          ${matches.map(o => {
        const isUserLoggedIn = !!(user && (user.id || user.phone));
        const oCode = o.orderCode || o.id || o.MaDonHang || 'DH';
        const rawStatus = o.orderStatus || o.TrangThai || o.status || 'Processing';
        const statusInfo = (window.SalonUtils && typeof window.SalonUtils.formatOrderStatus === 'function')
          ? window.SalonUtils.formatOrderStatus(rawStatus)
          : { label: 'Đang xử lý', cssClass: 'status-confirmed', key: 'processing' };
        const isCancelled = statusInfo.key === 'cancelled';
        const isPaid = (o.paymentStatus === 'Paid' || o.TrangThai === 'Đã thanh toán' || o.TrangThaiThanhToan === 'Đã thanh toán');
        // Kiểm tra trạng thái đơn: cho phép hủy ở mọi trạng thái trừ khi đã hủy
        const isCancellable = (window.SalonUtils && typeof window.SalonUtils.canCancelOrder === 'function')
          ? window.SalonUtils.canCancelOrder(o)
          : (!isCancelled);
        const items = Array.isArray(o.items) ? o.items : [];
        const rawDate = o.createdAt || o.orderDate || o.NgayDat;
        const formattedDate = rawDate ? (window.SalonUtils ? window.SalonUtils.formatDateTime(rawDate) : String(rawDate).split('T')[0]) : 'Hôm nay';

        const statusLabel = statusInfo.label;
        const statusBadgeClass = statusInfo.cssClass;

        return `
              <div class="lookup-card-result" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; opacity: ${isCancelled ? '0.75' : '1'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); font-family: monospace;">
                    #${escapeFn(oCode)}
                  </span>
                  <span class="status-pill-pulse ${statusBadgeClass}">
                    <span class="pulse-dot"></span> ${statusLabel}
                  </span>
                </div>
                <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
                  <div><strong style="color: var(--text-primary);">Ngày đặt:</strong> ${formattedDate}</div>
                  <div><strong style="color: var(--text-primary);">Người nhận:</strong> ${escapeFn(o.customerName || 'Khách hàng')} (${escapeFn(o.customerPhone || '')})</div>
                  <div><strong style="color: var(--text-primary);">Hình thức:</strong> ${escapeFn(o.shippingAddress || (o.deliveryType === 'PICKUP_BRANCH' ? 'Nhận tại quầy' : 'Giao tận nơi'))}</div>
                  <div style="margin-top: 6px; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Sản phẩm (${items.length}):</div>
                    ${items.map(it => `
                      <div style="display: flex; justify-content: space-between; font-size: 12.5px;">
                        <span>• ${escapeFn(it.name || it.TenSanPham || 'Mỹ phẩm')} × ${it.qty || it.quantity || 1}</span>
                        <strong style="color: var(--brand-accent);">${typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency ? SalonUtils.formatCurrency((Number(it.price) || 0) * (Number(it.qty) || 1)) : ((Number(it.price) || 0) * (Number(it.qty) || 1)).toLocaleString('vi-VN') + ' đ'}</strong>
                      </div>
                    `).join('')}
                  </div>
                  <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: var(--text-primary);">Tổng thanh toán:</strong>
                    <strong style="color: var(--brand-accent); font-size: 16px;">${typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency ? SalonUtils.formatCurrency(o.totalAmount || 0) : Number(o.totalAmount || 0).toLocaleString('vi-VN') + ' đ'}</strong>
                  </div>
                </div>

                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                  <div>
                    <span style="font-size: 12.5px; color: ${isPaid ? '#10B981' : '#f59e0b'}; font-weight: 700;">
                      ${isPaid ? '✓ Đã Thanh Toán' : '⏳ Chưa Thanh Toán'}
                    </span>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    ${(!isPaid && !isCancelled) ? `
                      <button type="button" class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;" onclick="CustomerWeb.openOrderPaymentModal('${oCode}')">
                        <span>💳 Thanh Toán Ngay (VietQR)</span>
                      </button>
                    ` : ''}
                    ${isCancellable ? `
                      <button type="button" class="btn-cancel" style="padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 8px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="${isUserLoggedIn ? `CustomerWeb.cancelOrderByCustomer('${oCode}')` : `CustomerWeb.promptLoginToCancelOrder('${oCode}')`}">
                        Hủy Đơn Hàng
                      </button>
                    ` : ''}
                  </div>
                </div>

                ${(window.store && window.store.getReviewByOrderId && window.store.getReviewByOrderId(oCode)) ? `
                  <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color); font-size: 12.5px; display: flex; align-items: center; gap: 6px;">
                    <span style="color: #f59e0b; font-size: 13px;">${'★'.repeat(window.store.getReviewByOrderId(oCode).rating || 5)}${'☆'.repeat(5 - (window.store.getReviewByOrderId(oCode).rating || 5))}</span>
                    <span style="color: var(--text-secondary); font-size: 12px; font-style: italic;">"${escapeFn(window.store.getReviewByOrderId(oCode).comment || 'Rất hài lòng')}"</span>
                  </div>
                ` : ''}
              </div>
            `;
      }).join('')}
        </div>
      `;
    },

    /**
     * Khách hàng kích hoạt hủy đơn hàng
     * @param {string|number} orderId 
     */
    cancelOrderByCustomer(orderId) {
      if (typeof this.openOrderCancelModal === 'function') {
        this.openOrderCancelModal(orderId);
      } else if (window.CustomerWeb && typeof window.CustomerWeb.openOrderCancelModal === 'function') {
        window.CustomerWeb.openOrderCancelModal(orderId);
      }
    },

    /**
     * Nhắc khách đăng nhập tài khoản trước khi thực hiện hủy đơn
     * @param {string|number} orderId 
     */
    promptLoginToCancelOrder(orderId) {
      if (window.UICommon) {
        window.UICommon.showToast('Vui lòng đăng nhập tài khoản để thực hiện hủy đơn hàng', 'warning');
        if (typeof window.UICommon.openAuthModal === 'function') {
          window.UICommon.openAuthModal('login');
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerOrderSearch = CustomerOrderSearch;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerOrderSearch);
  }

})(typeof window !== 'undefined' ? window : this);

