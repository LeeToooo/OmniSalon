(function (window) {
  'use strict';

  const CustomerOrderPayment = {
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
     * Mở modal thanh toán đơn hàng mỹ phẩm qua cổng VietQR
     * @param {string|number} orderId 
     */
    openOrderPaymentModal(orderId) {
      if (!orderId) return;

      const modalSource = this._modalSource || (window.CustomerWeb && window.CustomerWeb._modalSource);

      if (document.querySelector('.customer-portal-shell') || modalSource === 'portal') {
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
      const order = orders.find(o => (o.id || o.orderCode || o.MaDonHang) === orderId) || {};
      const amount = order.totalAmount || order.TongTien || 0;
      const oCode = order.id || order.orderCode || order.MaDonHang || orderId;

      const qrSvg = (window.SalonUtils && typeof window.SalonUtils.generateQrSvgCode === 'function')
        ? window.SalonUtils.generateQrSvgCode(`VIETQR-OMNISALON-ORDER-${oCode}-${amount}`)
        : '';

      const escapeFn = (typeof this.escapeHtml === 'function')
        ? this.escapeHtml.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : (str) => (typeof str !== 'string' ? (str == null ? '' : String(str)) : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

      const fmtCurr = (c) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatCurrency === 'function' ? SalonUtils.formatCurrency(c) : `${c} đ`);

      const modalHtml = `
        <div class="order-payment-modal-box" style="max-width: 480px; margin: 0 auto; text-align: center; padding: 10px 4px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10b981; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 12px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          </div>
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">
            Thanh Toán Đơn Hàng #${escapeFn(oCode)}
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px;">
            Quét mã VietQR bằng app ngân hàng hoặc chuyển khoản theo thông tin bên dưới:
          </p>

          <!-- VietQR Box -->
          <div style="background: #ffffff; padding: 16px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(0,0,0,0.08); margin-bottom: 16px; border: 1px solid #e2e8f0;">
            ${qrSvg ? `
              <div style="width: 190px; height: 190px; margin: 0 auto;">${qrSvg}</div>
            ` : `
              <div style="width: 190px; height: 190px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 8px; font-weight: 800; color: #0284c7;">
                VIETQR CODE
              </div>
            `}
            <div style="font-size: 11px; font-weight: 700; color: #0369a1; margin-top: 6px; letter-spacing: 0.5px;">VIETQR 24/7 CHUYỂN NHANH NAPAS</div>
          </div>

          <!-- Thông tin tài khoản nhận -->
          <div style="background: var(--surface-elevated, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; padding: 12px 16px; text-align: left; font-size: 13px; margin-bottom: 18px; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Ngân hàng:</span>
              <strong>MB BANK (Quân Đội)</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Số tài khoản:</span>
              <strong style="color: #0284c7; font-size: 14px;">0900000000</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Chủ tài khoản:</span>
              <strong>OMNISALON ENTERPRISE</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Số tiền cần trả:</span>
              <strong style="color: var(--color-terracotta, #c85a44); font-size: 15px;">${fmtCurr(amount)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Nội dung chuyển khoản:</span>
              <strong style="color: #b48312;">THANHTOAN ${escapeFn(oCode)}</strong>
            </div>
          </div>

          <!-- Nút hành động -->
          <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center;">
            <button type="button" class="btn-vnpay"
                    style="min-height: 44px; width: 100%; max-width: 320px; padding: 0 20px; border-radius: 10px; font-size: 14px; font-weight: 700; background: #0284c7; color: #ffffff; border: none; cursor: pointer; transition: background 0.2s;"
                    onclick="(window.CustomerOrderPayment || window.CustomerWeb).payWithVNPay('${escapeFn(oCode)}', ${amount})">
              Thanh Toán Trực Tuyến Qua VNPAY
            </button>
            <button type="button" class="btn-cancel" 
                    style="min-height: 40px; min-width: 140px; padding: 0 24px; border-radius: 10px; font-size: 13.5px; font-weight: 700; background: var(--surface-elevated, #2a2a26); color: var(--text-primary, #fff); border: 1px solid var(--border-color, #444); cursor: pointer;"
                    onclick="CustomerWeb.closeOrderPaymentModal()">
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      `;

      if (window.UICommon && typeof window.UICommon.openModal === 'function') {
        window.UICommon.openModal(modalHtml, 'payment');
      }
    },

    /**
     * Chuyển hướng thanh toán qua cổng VNPAY Sandbox
     */
    async payWithVNPay(orderId, amount) {
      if (!orderId || !amount) {
        if (window.UICommon) window.UICommon.showToast('Thông tin đơn hàng không hợp lệ.', 'error');
        return;
      }
      try {
        if (window.UICommon) window.UICommon.showToast('Đang kết nối cổng thanh toán VNPAY...', 'info');
        const resp = await fetch('/api/payment/vnpay-create-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: String(orderId),
            amount: Number(amount),
            orderInfo: `Thanh toan don hang ${orderId}`
          })
        });
        const data = await resp.json();
        if (data && data.success && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          if (window.UICommon) window.UICommon.showToast(data?.message || 'Không thể tạo liên kết VNPAY', 'error');
        }
      } catch (err) {
        if (window.UICommon) window.UICommon.showToast('Lỗi kết nối cổng VNPAY: ' + err.message, 'error');
      }
    },

    /**
     * Đóng modal thanh toán đơn hàng và quay lại màn hình trước
     */
    closeOrderPaymentModal() {
      const isPortal = (this._subModalSource === 'portal' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'portal') || (window.CustomerWeb && window.CustomerWeb._modalSource === 'portal'));

      if (isPortal) {
        if (typeof this.openCustomerPortalModal === 'function') {
          this.openCustomerPortalModal('orders');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
          window.CustomerWeb.openCustomerPortalModal('orders');
        }
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
     * Xác nhận thanh toán đơn hàng (Mock / Demo / Sandbox)
     * @param {string|number} orderId 
     */
    async confirmOrderPaidMock(orderId) {
      if (!orderId) return;
      if (window.store && typeof window.store.confirmOrderPayment === 'function') {
        const res = await window.store.confirmOrderPayment(orderId, 'VietQR');
        if (res && res.success !== false) {
          if (window.UICommon) window.UICommon.showToast(`Đơn hàng #${orderId} đã xác nhận thanh toán VietQR thành công!`, 'success');
          this.closeOrderPaymentModal();
        } else {
          if (window.UICommon) window.UICommon.showToast(res?.error || 'Có lỗi khi xác nhận thanh toán!', 'error');
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerOrderPayment = CustomerOrderPayment;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerOrderPayment);
  }

})(typeof window !== 'undefined' ? window : this);

