(function (window) {
  'use strict';

  const CustomerBookingPayment = {
    _subModalSource: null,
    _lookupLastQuery: '',
    _pollingTimer: null,
    _currentPollingCode: null,

    /**
     * Escape chuỗi HTML an toàn
     */
    escapeHtml(str) {
      if (window.CustomerUtils && typeof window.CustomerUtils.escapeHtml === 'function') {
        return window.CustomerUtils.escapeHtml(str);
      }
      if (typeof str !== 'string') return str == null ? '' : String(str);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Bắt đầu polling tự động kiểm tra trạng thái chuyển khoản
     */
    startPaymentPolling(bookingCode) {
      this.stopPaymentPolling();
      this._currentPollingCode = bookingCode;

      const checkOnce = async () => {
        if (!this._currentPollingCode || this._currentPollingCode !== bookingCode) return;
        try {
          const res = await fetch(`/api/payment/check-status/${encodeURIComponent(bookingCode)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.isPaid) {
              this.handlePaymentConfirmed(bookingCode, data);
              return;
            }
          }
        } catch (_) {}

        // Tiếp tục poll mỗi 2.5 giây
        this._pollingTimer = setTimeout(checkOnce, 2500);
      };

      this._pollingTimer = setTimeout(checkOnce, 2000);
    },

    /**
     * Dừng polling khi đóng modal
     */
    stopPaymentPolling() {
      if (this._pollingTimer) {
        clearTimeout(this._pollingTimer);
        this._pollingTimer = null;
      }
      this._currentPollingCode = null;
    },

    /**
     * Xử lý khi phát hiện chuyển khoản thành công
     */
    async handlePaymentConfirmed(bookingCode, paymentInfo = {}) {
      this.stopPaymentPolling();

      const statusBox = document.getElementById('vqrAutoConfirmStatus');
      if (statusBox) {
        statusBox.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; border-radius: 8px; padding: 12px; color: #10B981; font-weight: 800; font-size: 13.5px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-size: 18px;">✓</span>
            <span>Chuyển khoản thành công! Lịch hẹn #${bookingCode} đã được tự động xác nhận.</span>
          </div>
        `;
      }

      if (window.store && typeof window.store.payBooking === 'function') {
        try { await window.store.payBooking(bookingCode); } catch (_) {}
      }

      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Lịch hẹn #${bookingCode} đã xác nhận thanh toán thành công!`, 'success');
      }

      // Đóng modal sau 2.5 giây để khách thấy thông báo xác nhận thành công
      setTimeout(() => {
        this.closeBookingPaymentModal();
      }, 2500);
    },

    /**
     * Kiểm tra trạng thái thanh toán thủ công
     */
    async manualCheckPayment(bookingCode) {
      const btn = document.getElementById("btnManualCheckPayment");
      const spinner = document.getElementById("manualCheckSpinner");
      if (btn) btn.disabled = true;
      if (spinner) spinner.style.display = "inline-block";

      try {
        const res = await fetch("/api/payment/check-status/" + encodeURIComponent(bookingCode));
        if (res.ok) {
          const data = await res.json();
          if (data && (data.isPaid || data.status === "PAID")) {
            this.handlePaymentConfirmed(bookingCode, data);
            return;
          }
        }
        if (window.UICommon) window.UICommon.showToast("Chưa ghi nhận tiền vào tài khoản. Hệ thống vẫn đang tiếp tục kiểm tra...", "info");
      } catch (_) {
        if (window.UICommon) window.UICommon.showToast("Lỗi kiểm tra trạng thái thanh toán.", "warning");
      } finally {
        if (btn) btn.disabled = false;
        if (spinner) spinner.style.display = "none";
      }
    },

    /**
     * Mở modal thanh toán lịch hẹn bằng mã VietQR
     * @param {string|number} bookingId 
     */
    openBookingPaymentModal(bookingId) {
      if (!bookingId) return;

      const modalSource = this._modalSource !== undefined ? this._modalSource : window.CustomerWeb?._modalSource;

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

      const bookings = (window.store && typeof window.store.getBookings === 'function')
        ? window.store.getBookings()
        : (window.store?.state?.bookings || []);
      const booking = bookings.find(b => (b.id || b.bookingCode || b.MaLichHen) === bookingId) || {};
      const amount = booking.totalPrice || 0;
      const bCode = booking.id || booking.bookingCode || booking.MaLichHen || bookingId;

      const vietQrUrl = `https://api.vietqr.io/image/970422-0900000000-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent('THANHTOAN ' + bCode)}&accountName=OMNISALON%20ENTERPRISE`;

      const escapeFn = (s) => (typeof this.escapeHtml === 'function' ? this.escapeHtml(s) : (window.CustomerWeb?.escapeHtml ? window.CustomerWeb.escapeHtml(s) : String(s ?? '')));
      const formattedAmount = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatCurrency === 'function')
        ? SalonUtils.formatCurrency(amount)
        : (Number(amount || 0).toLocaleString('vi-VN') + ' đ');

      const modalHtml = `
        <div class="order-payment-modal-box" style="max-width: 480px; margin: 0 auto; text-align: center; padding: 10px 4px;">
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">
            Thanh Toán Lịch Hẹn #${escapeFn(bCode)}
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px;">
            Quét mã VietQR bằng app ngân hàng hoặc chuyển khoản theo thông tin bên dưới:
          </p>

          <!-- Trạng thái tự động kiểm tra chuyển khoản -->
          <div id="vqrAutoConfirmStatus" style="margin-bottom: 14px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(197, 155, 39, 0.12); border: 1px solid rgba(197, 155, 39, 0.3); border-radius: 20px; padding: 5px 14px; font-size: 12px; color: #C59B27; font-weight: 700;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
              <span>Đang chờ chuyển khoản (Tự động xác nhận sau 2s)...</span>
            </div>
          </div>

          <!-- VietQR Box -->
          <div style="background: #ffffff; padding: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(0,0,0,0.08); margin-bottom: 14px; border: 1px solid #e2e8f0;">
            <img src="${vietQrUrl}" alt="Mã VietQR" style="width: 200px; height: 200px; border-radius: 8px; margin: 0 auto; display: block; object-fit: contain;">
            <div style="font-size: 11px; font-weight: 700; color: #141413; margin-top: 6px; letter-spacing: 0.5px;">VIETQR 24/7 CHUYỂN NHANH NAPAS</div>
          </div>

          <!-- Nút kiểm tra giao dịch thật -->
          <div style="margin-bottom: 14px;">
            <button type="button" id="btnManualCheckPayment" onclick="CustomerBookingPayment.manualCheckPayment('${escapeFn(bCode)}')"
                    style="padding: 8px 18px; background: #C59B27; border: 1px solid #C59B27; border-radius: 8px; color: #141413; font-size: 13px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease;">
              <span id="manualCheckSpinner" style="display: none; width: 14px; height: 14px; border: 2px solid #141413; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
              <span>Kiểm Tra Giao Dịch</span>
            </button>
          </div>

          <!-- Thông tin tài khoản nhận -->
          <div style="background: var(--surface-elevated, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; padding: 12px 16px; text-align: left; font-size: 13px; margin-bottom: 18px; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Ngân hàng:</span>
              <strong>MB BANK (Quân Đội)</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Số tài khoản:</span>
              <strong style="color: #C59B27; font-size: 14px;">0900000000</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Chủ tài khoản:</span>
              <strong>OMNISALON ENTERPRISE</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Số tiền cần trả:</span>
              <strong style="color: #C59B27; font-size: 15px;">${formattedAmount}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Nội dung chuyển khoản:</span>
              <strong style="color: #C59B27;">THANHTOAN ${escapeFn(bCode)}</strong>
            </div>
          </div>

          <!-- Nút hành động -->
          <div style="display: flex; justify-content: center;">
            <button type="button" class="btn-cancel" 
                    style="min-height: 42px; min-width: 140px; padding: 0 24px; border-radius: 6px; font-size: 13.5px; font-weight: 700; background: var(--surface-elevated, #2a2a26); color: var(--text-primary, #fff); border: 1px solid var(--border-color, #444); cursor: pointer;"
                    onclick="(window.CustomerBookingPayment || window.CustomerWeb).closeBookingPaymentModal()">
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      `;

      if (window.UICommon && typeof window.UICommon.openModal === 'function') {
        window.UICommon.openModal(modalHtml, 'payment');
      }

      // Khởi động polling tự động xác nhận chuyển khoản
      this.startPaymentPolling(bCode);
    },

    /**
     * Đóng modal thanh toán lịch hẹn và quay về modal trước đó
     */
    closeBookingPaymentModal() {
      this.stopPaymentPolling();

      const subModalSource = this._subModalSource !== undefined ? this._subModalSource : window.CustomerWeb?._subModalSource;
      const modalSource = this._modalSource !== undefined ? this._modalSource : window.CustomerWeb?._modalSource;
      const lookupLastQuery = this._lookupLastQuery !== undefined ? this._lookupLastQuery : (window.CustomerWeb?._lookupLastQuery || '');

      if (subModalSource === 'portal' || modalSource === 'portal') {
        if (typeof this.openCustomerPortalModal === 'function') {
          this.openCustomerPortalModal('bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
          window.CustomerWeb.openCustomerPortalModal('bookings');
        }
      } else if (subModalSource === 'lookup' || modalSource === 'lookup') {
        if (typeof this.openLookupModal === 'function') {
          this.openLookupModal(lookupLastQuery, 'bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
          window.CustomerWeb.openLookupModal(lookupLastQuery, 'bookings');
        }
      } else {
        if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
          window.UICommon.closeGlobalModal();
        } else {
          if (typeof this.openLookupModal === 'function') {
            this.openLookupModal();
          } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
            window.CustomerWeb.openLookupModal();
          }
        }
      }
    },

    /**
     * Xác nhận thanh toán lịch hẹn thành công thủ công
     * @param {string|number} bookingCode 
     */
    async confirmBookingPaid(bookingCode) {
      this.stopPaymentPolling();
      if (window.store && typeof window.store.payBooking === 'function') {
        await window.store.payBooking(bookingCode);
      }
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Lịch hẹn #${bookingCode} đã ghi nhận thanh toán VietQR thành công!`, 'success');
      }
      if (typeof this.closeBookingPaymentModal === 'function') {
        this.closeBookingPaymentModal();
      } else if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
        window.UICommon.closeGlobalModal();
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerBookingPayment = CustomerBookingPayment;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerBookingPayment);
  }

})(typeof window !== 'undefined' ? window : this);
