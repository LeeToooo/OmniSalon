// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE HỦY LỊCH HẸN CẮT TÓC (CUSTOMER BOOKING CANCEL)
// File: web/frontend/js/modules/customer/booking/booking-cancel.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerBookingCancel = {
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
     * Mở modal xác nhận hủy lịch hẹn
     * @param {string|number} bookingId 
     */
    openBookingCancelModal(bookingId) {
      if (!bookingId) return;

      const user = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser()
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function')
          ? window.CustomerWeb.getCurrentUser()
          : null;

      if (!user || (!user.id && !user.phone)) {
        if (window.UICommon) {
          window.UICommon.showToast('Vui lòng đăng nhập tài khoản để thực hiện hủy lịch hẹn', 'warning');
          if (typeof window.UICommon.openAuthModal === 'function') {
            window.UICommon.openAuthModal('login');
          }
        }
        return;
      }

      const modalSource = this._modalSource || (window.CustomerWeb && window.CustomerWeb._modalSource);

      if (document.querySelector('.customer-portal-shell') || modalSource === 'portal') {
        this._subModalSource = 'portal';
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'portal';
      } else if (window.ProfilePage && document.getElementById('profileBookingsContainer')) {
        this._subModalSource = 'profile';
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'profile';
      } else {
        this._subModalSource = 'lookup';
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'lookup';
        const lookupInput = document.getElementById('lookupSearchInput');
        if (lookupInput && lookupInput.value) {
          this._lookupLastQuery = lookupInput.value;
          if (window.CustomerWeb) window.CustomerWeb._lookupLastQuery = lookupInput.value;
        }
      }

      const findBooking = (typeof this._findBookingById === 'function')
        ? this._findBookingById.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb._findBookingById === 'function')
          ? window.CustomerWeb._findBookingById.bind(window.CustomerWeb)
          : () => null;

      const booking = findBooking(bookingId) || {};
      const bCode = booking.id || booking.bookingCode || booking.MaLichHen || bookingId;
      const serviceName = booking.serviceName || 'Dịch vụ làm tóc';
      const timeSlot = booking.timeSlot || 'Giờ hẹn';
      const dateStr = booking.date || booking.bookingDate || 'Hôm nay';

      const escapeFn = (typeof this.escapeHtml === 'function')
        ? this.escapeHtml.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : (str) => (typeof str !== 'string' ? (str == null ? '' : String(str)) : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

      const fmtDate = (d) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatDate === 'function' ? SalonUtils.formatDate(d) : (d || ''));

      const modalHtml = `
        <div class="booking-cancel-modal-box" style="max-width: 480px; margin: 0 auto; padding: 4px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(239, 68, 68, 0.12); color: #ef4444; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 10px; font-weight: bold; border: 1px solid rgba(239, 68, 68, 0.25);">
              ✕
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">
              Hủy Lịch Hẹn #${escapeFn(bCode)}
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
              Quý khách có chắc chắn muốn hủy lịch hẹn này không?
            </p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: var(--text-secondary);">Mã lịch hẹn:</span>
              <strong style="color: var(--text-primary);">#${escapeFn(bCode)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: var(--text-secondary);">Dịch vụ:</span>
              <strong style="color: var(--brand-accent);">${escapeFn(serviceName)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Thời gian:</span>
              <span style="color: var(--text-primary);">${escapeFn(timeSlot)} | ${fmtDate(dateStr)}</span>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
              Lý do hủy lịch:
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
              ${[
                'Tôi có việc đột xuất bận',
                'Tôi muốn đổi sang ngày giờ khác',
                'Tôi đã tìm được salon khác gần hơn',
                'Lý do khác'
              ].map((rText, idx) => `
                <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-primary); cursor: pointer; padding: 8px 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); transition: all 0.15s;">
                  <input type="radio" name="bookingCancelReasonOption" value="${rText}" ${idx === 0 ? 'checked' : ''} onchange="CustomerWeb.onSelectCancelBookingReason(this.value)" style="accent-color: #ef4444; cursor: pointer;">
                  <span>${rText}</span>
                </label>
              `).join('')}
            </div>

            <textarea id="bookingCancelCustomReason" rows="3" 
                      style="width: 100%; box-sizing: border-box; background: var(--surface-card, #1e1e1c); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; color: var(--text-primary); font-size: 13px; resize: vertical; outline: none; line-height: 1.4;"
                      placeholder="Chi tiết lý do hủy lịch...">Tôi có việc đột xuất bận</textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="pill-btn-outline" 
                    style="min-height: 40px; padding: 0 18px; font-size: 13px; font-weight: 700; color: var(--text-secondary); border-color: var(--border-color); cursor: pointer;"
                    onclick="CustomerWeb.closeBookingCancelModal()">
              Không, Giữ Lại Lịch
            </button>
            <button type="button" class="btn-submit-terracotta" id="btnConfirmCancelBooking"
                    style="min-height: 40px; padding: 0 20px; border-radius: 999px; font-size: 13px; font-weight: 800; background: #ef4444; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
                    onclick="CustomerWeb.submitBookingCancellation('${escapeFn(bCode)}')">
              ✕ Xác Nhận Hủy Lịch
            </button>
          </div>
        </div>
      `;

      if (window.UICommon && typeof window.UICommon.openModal === 'function') {
        window.UICommon.openModal(modalHtml, 'cancel-booking');
      }
    },

    /**
     * Lựa chọn lý do hủy lịch từ radio
     * @param {string} val 
     */
    onSelectCancelBookingReason(val) {
      const textarea = document.getElementById('bookingCancelCustomReason');
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
     * Đóng modal hủy lịch và quay lại màn hình trước
     */
    closeBookingCancelModal() {
      const isPortal = (this._subModalSource === 'portal' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'portal') || (window.CustomerWeb && window.CustomerWeb._modalSource === 'portal'));
      const isProfile = (this._subModalSource === 'profile' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'profile'));

      if (isPortal) {
        if (typeof this.openCustomerPortalModal === 'function') {
          this.openCustomerPortalModal('bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
          window.CustomerWeb.openCustomerPortalModal('bookings');
        }
      } else if (isProfile) {
        if (window.UICommon) window.UICommon.closeGlobalModal();
      } else {
        const query = this._lookupLastQuery || (window.CustomerWeb && window.CustomerWeb._lookupLastQuery) || '';
        if (typeof this.openLookupModal === 'function') {
          this.openLookupModal(query, 'bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
          window.CustomerWeb.openLookupModal(query, 'bookings');
        }
      }
    },

    /**
     * Gửi yêu cầu hủy lịch hẹn lên API hoặc Store
     * @param {string|number} bookingId 
     */
    async submitBookingCancellation(bookingId) {
      if (!bookingId) return;
      const textarea = document.getElementById('bookingCancelCustomReason');
      const cleanReason = textarea ? textarea.value.trim() : 'Tôi có việc đột xuất bận';
      if (!cleanReason || cleanReason.length < 3) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng cung cấp lý do hủy cụ thể tối thiểu 3 ký tự', 'warning');
        return;
      }

      const btn = document.getElementById('btnConfirmCancelBooking');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang xử lý hủy lịch...';
      }

      if (window.SalonApi && typeof window.SalonApi.cancelBooking === 'function') {
        try {
          await window.SalonApi.cancelBooking(bookingId, cleanReason);
          if (window.UICommon) window.UICommon.showToast(`Đã hủy lịch hẹn #${bookingId} thành công!`, 'success');
        } catch (err) {
          if (window.UICommon) window.UICommon.showToast(`Lỗi hủy lịch: ${err.message}`, 'error');
        }
      } else if (window.store && typeof window.store.updateBookingStatus === 'function') {
        window.store.updateBookingStatus(bookingId, 'cancelled');
        if (window.UICommon) window.UICommon.showToast(`Đã hủy lịch hẹn #${bookingId}!`, 'success');
      }

      if (btn) {
        btn.disabled = false;
        btn.textContent = '✕ Xác Nhận Hủy Lịch';
      }

      const isPortal = (this._subModalSource === 'portal' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'portal') || (window.CustomerWeb && window.CustomerWeb._modalSource === 'portal'));
      const isProfile = (this._subModalSource === 'profile' || (window.CustomerWeb && window.CustomerWeb._subModalSource === 'profile'));

      if (isPortal) {
        if (typeof this.openCustomerPortalModal === 'function') {
          this.openCustomerPortalModal('bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
          window.CustomerWeb.openCustomerPortalModal('bookings');
        }
      } else if (isProfile) {
        if (window.UICommon) window.UICommon.closeGlobalModal();
        const profileContainer = document.getElementById('webMainContainer');
        if (window.ProfilePage && profileContainer) window.ProfilePage.render(profileContainer);
      } else {
        const query = this._lookupLastQuery || (window.CustomerWeb && window.CustomerWeb._lookupLastQuery) || '';
        if (typeof this.openLookupModal === 'function') {
          this.openLookupModal(query, 'bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
          window.CustomerWeb.openLookupModal(query, 'bookings');
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerBookingCancel = CustomerBookingCancel;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerBookingCancel);
  }

})(typeof window !== 'undefined' ? window : this);

