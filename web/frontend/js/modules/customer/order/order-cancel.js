// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE HỦY ĐƠN HÀNG MỸ PHẨM (CUSTOMER ORDER CANCEL)
// File: web/frontend/js/modules/customer/order/order-cancel.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerOrderCancel = {
    _subModalSource: null,
    _lookupLastQuery: '',

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
     * Lấy tài khoản người dùng hiện tại
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
     * Mở modal xác nhận hủy đơn hàng mỹ phẩm
     * @param {string|number} orderId 
     * @param {string} source 
     */
    openOrderCancelModal(orderId, source = '') {
      if (!orderId) return;

      const user = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser()
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function')
          ? window.CustomerWeb.getCurrentUser()
          : null;

      if (!user || (!user.id && !user.phone)) {
        if (window.UICommon) {
          window.UICommon.showToast('Vui lòng đăng nhập tài khoản để thực hiện hủy đơn hàng', 'warning');
          if (typeof window.UICommon.openAuthModal === 'function') {
            window.UICommon.openAuthModal('login');
          }
        }
        return;
      }

      const modalSource = this._modalSource || (window.CustomerWeb && window.CustomerWeb._modalSource);

      if (source === 'profile' || (!source && window.ProfilePage && document.getElementById('profileOrdersContainer'))) {
        this._subModalSource = 'profile';
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'profile';
      } else if (document.querySelector('.customer-portal-shell') || modalSource === 'portal') {
        this._subModalSource = 'portal';
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'portal';
      } else {
        this._subModalSource = 'lookup';
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'lookup';
        const lookupInput = document.getElementById('lookupSearchInput');
        if (lookupInput && lookupInput.value) {
          this._lookupLastQuery = lookupInput.value;
          if (window.CustomerWeb) window.CustomerWeb._lookupLastQuery = lookupInput.value;
        }
      }

      const orders = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : [];
      const cleanId = String(orderId).replace(/^#+/, '').trim().toLowerCase();
      const order = orders.find(o =>
        String(o.id || '').replace(/^#+/, '').trim().toLowerCase() === cleanId ||
        String(o.orderCode || '').replace(/^#+/, '').trim().toLowerCase() === cleanId ||
        String(o.MaDonHang || '').replace(/^#+/, '').trim().toLowerCase() === cleanId
      ) || {};
      const oCode = order.id || order.orderCode || order.MaDonHang || orderId;
      const amount = order.totalAmount || order.TongTien || 0;
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsSummary = items.map(it => `${it.name || it.TenSanPham || 'Sản phẩm'} × ${it.qty || it.quantity || 1}`).join(', ');

      const escapeFn = (typeof this.escapeHtml === 'function')
        ? this.escapeHtml.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : (str) => (typeof str !== 'string' ? (str == null ? '' : String(str)) : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

      const fmtCurr = (c) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatCurrency === 'function' ? SalonUtils.formatCurrency(c) : `${c} đ`);

      const modalHtml = `
        <div class="order-cancel-modal-box" style="max-width: 480px; margin: 0 auto; padding: 4px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(239, 68, 68, 0.12); color: #ef4444; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 10px; font-weight: bold; border: 1px solid rgba(239, 68, 68, 0.25);">
              ✕
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">
              Xác Nhận Hủy Đơn Hàng #${escapeFn(oCode)}
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
              Quý khách có chắc chắn muốn hủy đơn hàng này không?
            </p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: var(--text-secondary);">Mã đơn hàng:</span>
              <strong style="color: var(--text-primary);">#${escapeFn(oCode)}</strong>
            </div>
            ${itemsSummary ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: var(--text-secondary);">Sản phẩm:</span>
                <span style="color: var(--text-primary); max-width: 65%; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeFn(itemsSummary)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Tổng thanh toán:</span>
              <strong style="color: var(--brand-accent); font-size: 14px;">${fmtCurr(amount)}</strong>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
              Lý do hủy đơn hàng:
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
              ${[
                'Tôi muốn thay đổi địa chỉ hoặc sản phẩm',
                'Tôi đặt nhầm đơn hàng hoặc không còn nhu cầu',
                'Thời gian giao hàng quá lâu',
                'Tôi tìm thấy sản phẩm khác phù hợp hơn',
                'Lý do khác'
              ].map((rText, idx) => `
                <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-primary); cursor: pointer; padding: 8px 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); transition: all 0.15s;">
                  <input type="radio" name="orderCancelReasonOption" value="${rText}" ${idx === 0 ? 'checked' : ''} onchange="CustomerWeb.onSelectCancelOrderReason(this.value)" style="accent-color: #ef4444; cursor: pointer;">
                  <span>${rText}</span>
                </label>
              `).join('')}
            </div>

            <textarea id="orderCancelCustomReason" rows="3" 
                      style="width: 100%; box-sizing: border-box; background: var(--surface-card, #1e1e1c); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; color: var(--text-primary); font-size: 13px; resize: vertical; outline: none; line-height: 1.4;"
                      placeholder="Chi tiết lý do hủy đơn hàng...">Tôi muốn thay đổi địa chỉ hoặc sản phẩm</textarea>
          </div>

          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 10px 14px; margin-bottom: 18px; font-size: 12px; color: #ef4444; line-height: 1.5; text-align: left;">
            ⚠️ <strong>Lưu ý:</strong> Đơn hàng sau khi hủy sẽ không thể phục hồi. Sản phẩm sẽ được hoàn lại kho.
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="pill-btn-outline" 
                    style="min-height: 40px; padding: 0 18px; font-size: 13px; font-weight: 700; color: var(--text-secondary); border-color: var(--border-color); cursor: pointer;"
                    onclick="CustomerWeb.closeOrderCancelModal()">
              Không, Giữ Lại Đơn
            </button>
            <button type="button" class="btn-submit-terracotta" id="btnConfirmCancelOrder"
                    style="min-height: 40px; padding: 0 20px; border-radius: 999px; font-size: 13px; font-weight: 800; background: #ef4444; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
                    onclick="CustomerWeb.submitOrderCancellation('${escapeFn(oCode)}')">
              ✕ Xác Nhận Hủy Đơn
            </button>
          </div>
        </div>
      `;

      if (window.UICommon && typeof window.UICommon.openModal === 'function') {
        window.UICommon.openModal(modalHtml, 'cancel-order');
      }
    },

    /**
     * Lựa chọn lý do hủy đơn từ radio
     * @param {string} val 
     */
    onSelectCancelOrderReason(val) {
      const textarea = document.getElementById('orderCancelCustomReason');
      if (!textarea) return;
      if (val === 'Lý do khác') {
        textarea.value = '';
        textarea.placeholder = 'Vui lòng nhập lý do cụ thể...';
        textarea.focus();
      } else {
        textarea.value = val;
      }
    },

    /**
     * Đóng modal hủy đơn hàng và quay về màn hình trước
     */
    closeOrderCancelModal() {
      const isPortal = (this._subModalSource === 'portal' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'portal') || (window.CustomerWeb && window.CustomerWeb._modalSource === 'portal'));
      const isProfile = (this._subModalSource === 'profile' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'profile'));

      if (isPortal) {
        if (typeof this.openCustomerPortalModal === 'function') {
          this.openCustomerPortalModal('orders');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
          window.CustomerWeb.openCustomerPortalModal('orders');
        }
      } else if (isProfile) {
        if (window.UICommon) window.UICommon.closeGlobalModal();
      } else {
        const query = this._lookupLastQuery || (window.CustomerWeb && window.CustomerWeb._lookupLastQuery) || '';
        if (typeof this.openLookupModal === 'function') {
          this.openLookupModal(query, 'orders');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
          window.CustomerWeb.openLookupModal(query, 'orders');
        }
      }
    },

    /**
     * Gửi yêu cầu hủy đơn hàng lên Store
     * @param {string|number} orderId 
     */
    async submitOrderCancellation(orderId) {
      if (!orderId) return;
      const textarea = document.getElementById('orderCancelCustomReason');
      const cleanReason = textarea ? textarea.value.trim() : 'Tôi muốn thay đổi địa chỉ hoặc sản phẩm';
      if (!cleanReason || cleanReason.length < 3) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng cung cấp lý do hủy cụ thể tối thiểu 3 ký tự', 'warning');
        return;
      }

      const btn = document.getElementById('btnConfirmCancelOrder');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang xử lý hủy đơn...';
      }

      if (window.store && typeof window.store.cancelOrder === 'function') {
        const res = await window.store.cancelOrder(orderId, cleanReason);
        if (btn) {
          btn.disabled = false;
          btn.textContent = '✕ Xác Nhận Hủy Đơn';
        }
        if (res && res.success) {
          if (window.UICommon) window.UICommon.showToast(res.message || `Đã hủy đơn hàng #${orderId} thành công!`, 'success');
          
          const isPortal = (this._subModalSource === 'portal' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'portal') || (window.CustomerWeb && window.CustomerWeb._modalSource === 'portal'));
          const isProfile = (this._subModalSource === 'profile' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'profile'));

          if (isPortal) {
            if (typeof this.openCustomerPortalModal === 'function') {
              this.openCustomerPortalModal('orders');
            } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
              window.CustomerWeb.openCustomerPortalModal('orders');
            }
          } else if (isProfile) {
            if (window.UICommon) window.UICommon.closeGlobalModal();
            const profileContainer = document.getElementById('webMainContainer');
            if (window.ProfilePage && profileContainer) window.ProfilePage.render(profileContainer);
          } else {
            const query = this._lookupLastQuery || (window.CustomerWeb && window.CustomerWeb._lookupLastQuery) || '';
            if (typeof this.openLookupModal === 'function') {
              this.openLookupModal(query, 'orders');
            } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
              window.CustomerWeb.openLookupModal(query, 'orders');
            }
          }
        } else {
          if (window.UICommon) window.UICommon.showToast(res?.error || 'Lỗi khi hủy đơn hàng!', 'error');
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerOrderCancel = CustomerOrderCancel;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerOrderCancel);
  }

})(typeof window !== 'undefined' ? window : this);

