// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE THANH TOÁN LỊCH HẸN QUA VIETQR (BOOKING PAYMENT)
// File: web/frontend/js/modules/customer/booking-payment.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerBookingPayment = {
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

      const qrSvg = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.generateQrSvgCode === 'function')
        ? SalonUtils.generateQrSvgCode(`VIETQR-OMNISALON-BOOKING-${bCode}-${amount}`)
        : '';
      const vietQrUrl = `https://api.vietqr.io/image/970422-0900000000-compact.jpg?amount=${encodeURIComponent(amount)}&addInfo=${encodeURIComponent('THANHTOAN ' + bCode)}&accountName=${encodeURIComponent('OMNISALON ENTERPRISE')}`;

      const escapeFn = (s) => (typeof this.escapeHtml === 'function' ? this.escapeHtml(s) : (window.CustomerWeb?.escapeHtml ? window.CustomerWeb.escapeHtml(s) : String(s ?? '')));
      const formattedAmount = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatCurrency === 'function')
        ? SalonUtils.formatCurrency(amount)
        : (Number(amount || 0).toLocaleString('vi-VN') + ' đ');

      const modalHtml = `
        <div class="order-payment-modal-box" style="max-width: 480px; margin: 0 auto; text-align: center; padding: 10px 4px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10b981; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 12px;">
            💳
          </div>
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">
            Thanh Toán Lịch Hẹn #${escapeFn(bCode)}
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px;">
            Quét mã VietQR bằng app ngân hàng hoặc chuyển khoản theo thông tin bên dưới:
          </p>

          <!-- VietQR Box -->
          <div style="background: #ffffff; padding: 16px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(0,0,0,0.08); margin-bottom: 16px; border: 1px solid #e2e8f0;">
            <img src="${vietQrUrl}" alt="Mã VietQR" style="width: 190px; height: 190px; border-radius: 8px; margin: 0 auto; display: block; object-fit: contain;"
                 onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width:190px;height:190px;margin:0 auto;\\'>' + '${qrSvg ? qrSvg.replace(/'/g, "\\'") : 'VIETQR CODE'}' + '</div><div style=\\'font-size: 11px; font-weight: 700; color: #0369a1; margin-top: 6px; letter-spacing: 0.5px;\\'>VIETQR 24/7 CHUYỂN NHANH NAPAS</div>';">
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
              <strong style="color: var(--color-terracotta); font-size: 15px;">${formattedAmount}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Nội dung chuyển khoản:</span>
              <strong style="color: #b48312;">THANHTOAN ${escapeFn(bCode)}</strong>
            </div>
          </div>

          <!-- Thông báo hệ thống tự động xác nhận -->
          <div style="background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12.5px; color: #0284c7; line-height: 1.5; text-align: left;">
            ℹ️ <strong>Hệ thống tự động xác nhận:</strong> Sau khi quý khách quét mã chuyển khoản thành công, hệ thống / thu ngân sẽ tự động kiểm tra giao dịch và cập nhật trạng thái &quot;Đã Thanh Toán&quot; cho lịch hẹn. Quý khách không cần tự xác nhận.
          </div>

          <!-- Nút hành động -->
          <div style="display: flex; justify-content: center;">
            <button type="button" class="btn-cancel" 
                    style="min-height: 42px; min-width: 140px; padding: 0 24px; border-radius: 10px; font-size: 13.5px; font-weight: 700; background: var(--surface-elevated, #2a2a26); color: var(--text-primary, #fff); border: 1px solid var(--border-color, #444); cursor: pointer;"
                    onclick="(window.CustomerBookingPayment || window.CustomerWeb).closeBookingPaymentModal()">
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
     * Đóng modal thanh toán lịch hẹn và quay về modal trước đó
     */
    closeBookingPaymentModal() {
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
     * Xác nhận thanh toán lịch hẹn thành công
     * @param {string|number} bookingCode 
     */
    async confirmBookingPaid(bookingCode) {
      if (window.store && typeof window.store.payBooking === 'function') {
        await window.store.payBooking(bookingCode);
      }
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Lịch hẹn #${bookingCode} đã ghi nhận thanh toán VietQR thành công!`, 'success');
      }
      if (typeof this.closeBookingPaymentModal === 'function') {
        this.closeBookingPaymentModal();
      } else if (window.UICommon && typeof window.UICommon.closeGlobalModal === "function") { window.UICommon.closeGlobalModal();
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

