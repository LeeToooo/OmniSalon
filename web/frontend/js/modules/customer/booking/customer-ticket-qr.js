(function (window) {
  'use strict';

  const CustomerTicketQr = {
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
     * Tìm thông tin lịch hẹn theo ID
     */
    _findBookingById(bookingId) {
      if (!bookingId) return null;
      // Safe delegated call to _findBookingById
      if (window.CustomerUtils && typeof window.CustomerUtils._findBookingById === "function") { return window.CustomerUtils._findBookingById(bookingId); }
      if (window.CustomerUtils && typeof window.CustomerUtils._findBookingById === 'function') {
        return window.CustomerUtils._findBookingById(bookingId);
      }
      const clean = String(bookingId).toLowerCase().replace('#', '').trim();
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      return all.find(b => (b.id && b.id.toLowerCase().replace('#', '') === clean) || (b.bookingCode && b.bookingCode.toLowerCase().replace('#', '') === clean)) || null;
    },

    /**
     * Khách hàng kích hoạt hủy lịch hẹn
     */
    cancelBookingByCustomer(bookingId) {
      if (typeof this.openBookingCancelModal === 'function') {
        this.openBookingCancelModal(bookingId);
      } else if (window.CustomerWeb && typeof window.CustomerWeb.openBookingCancelModal === 'function') {
        window.CustomerWeb.openBookingCancelModal(bookingId);
      }
    },

    /**
     * Hiển thị Vé điện tử QR check-in tại quầy salon
     */
    showTicketQr(bookingId) {
      if (!bookingId) return;

      const self = this || CustomerTicketQr;
      if (document.querySelector('.customer-portal-shell') || (window.CustomerWeb && window.CustomerWeb._modalSource === 'portal')) {
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'portal';
        self._subModalSource = 'portal';
      } else {
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'lookup';
        self._subModalSource = 'lookup';
        const lookupInput = document.getElementById('lookupSearchInput');
        if (lookupInput && lookupInput.value) {
          if (window.CustomerWeb) window.CustomerWeb._lookupLastQuery = lookupInput.value;
          self._lookupLastQuery = lookupInput.value;
        }
      }

      const booking = self._findBookingById(bookingId);
      if (!booking) return;

      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      const qrCodeText = booking.bookingCode || booking.id;
      const qrSvg = (window.SalonUtils && typeof window.SalonUtils.generateQrSvgCode === 'function')
        ? window.SalonUtils.generateQrSvgCode(qrCodeText, 180)
        : `<div style="padding: 20px; font-weight: 800; font-size: 20px; color: #111;">[QR: ${qrCodeText}]</div>`;

      const escapeFn = (typeof self.escapeHtml === 'function')
        ? self.escapeHtml.bind(self)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : (str) => (typeof str !== 'string' ? (str == null ? '' : String(str)) : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

      const fmtDate = (d) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatDate === 'function' ? SalonUtils.formatDate(d) : (d || ''));
      const maskPhone = (p) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.maskPhone === 'function' ? SalonUtils.maskPhone(p) : (p || ''));

      modalBody.innerHTML = `
        <div class="booking-wizard-wrapper" style="max-width: 480px; text-align: center;">
          <div class="badge-terracotta">VÉ ĐIỆN TỬ OMNI SALON CHECK-IN</div>
          <h2 class="booking-title" style="font-size: 20px; margin-top: 8px;">#${escapeFn(booking.id || booking.bookingCode)}</h2>
          <p class="booking-subtitle">Đưa mã QR này cho Tiếp tân hoặc Master Stylist tại quầy để check-in tức thì</p>

          <div style="background: #fff; padding: 20px; border-radius: 12px; display: inline-block; margin: 16px auto; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 2px dashed #c85a44;">
            ${qrSvg}
            <div style="font-size: 13px; font-weight: 800; color: #111; letter-spacing: 0.1em; margin-top: 8px;">
              MÃ CHECK-IN: ${escapeFn(qrCodeText)}
            </div>
          </div>

          <div style="text-align: left; background: #fafafa; border-radius: 10px; padding: 14px; font-size: 13px; line-height: 1.7; margin-bottom: 16px; border: 1px solid #eee;">
            <div><strong>Khách hàng:</strong> ${escapeFn(booking.customerName)} (<span data-phone="${escapeFn(booking.customerPhone)}">${escapeFn(maskPhone(booking.customerPhone))}</span>)</div>
            <div><strong>Dịch vụ:</strong> ${escapeFn(booking.serviceName)}</div>
            <div><strong>Chi nhánh:</strong> ${escapeFn(booking.branchName)}</div>
            <div><strong>Thời gian:</strong> <span style="color:var(--color-accent-gold); font-weight:800;">${booking.timeSlot} | ${fmtDate(booking.date || booking.bookingDate)}</span></div>
            <div><strong>Master Stylist:</strong> ${escapeFn(booking.stylistName || 'Master Stylist chỉ định')}</div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn-cancel" style="flex: 1;" onclick="CustomerWeb.closeTicketQrModal('${booking.customerPhone || ''}')">
              Quay Lại Danh Sách
            </button>
            <button class="btn-submit-terracotta" style="flex: 1;" onclick="UICommon.closeGlobalModal()">
              Xong →
            </button>
          </div>
        </div>
      `;
      modal.classList.add('active');
    },

    /**
     * Đóng modal vé QR và quay lại màn hình trước đó (Portal hoặc Lookup)
     */
    closeTicketQrModal(phone = '') {
      const isPortal = (this._subModalSource === 'portal' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'portal') || (window.CustomerWeb && window.CustomerWeb._modalSource === 'portal'));
      if (isPortal) {
        if (typeof this.openCustomerPortalModal === 'function') {
          this.openCustomerPortalModal('bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
          window.CustomerWeb.openCustomerPortalModal('bookings');
        }
      } else {
        const q = phone || this._lookupLastQuery || (window.CustomerWeb && window.CustomerWeb._lookupLastQuery) || '';
        if (typeof this.openLookupModal === 'function') {
          this.openLookupModal(q, 'bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
          window.CustomerWeb.openLookupModal(q, 'bookings');
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerTicketQr = CustomerTicketQr;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerTicketQr);
  }

})(typeof window !== 'undefined' ? window : this);

