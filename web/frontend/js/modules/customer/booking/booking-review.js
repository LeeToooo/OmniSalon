(function (window) {
  'use strict';

  const CustomerBookingReview = {
    _selectedBookingReviewRating: 5,
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
     * Lấy mô tả text của số sao
     */
    _getStarLabel(rating) {
      switch (rating) {
        case 5: return 'Tuyệt vời, vượt mong đợi! (5★)';
        case 4: return 'Hài lòng, dịch vụ tốt (4★)';
        case 3: return 'Bình thường, tạm ổn (3★)';
        case 2: return 'Chưa hài lòng lắm (2★)';
        case 1: return 'Rất thất vọng (1★)';
        default: return 'Rất hài lòng (5★)';
      }
    },

    /**
     * Thêm thẻ gợi ý nhanh vào ô nhận xét
     */
    appendReviewTag(tag, type = 'booking') {
      const textareaId = type === 'order' ? 'orderReviewCommentInput' : 'bookingReviewCommentInput';
      const textarea = document.getElementById(textareaId);
      if (!textarea) return;
      const current = textarea.value.trim();
      if (!current) {
        textarea.value = tag;
      } else if (!current.includes(tag)) {
        textarea.value = current + ', ' + tag;
      }
      textarea.focus();
    },

    /**
     * Mở modal đánh giá lịch hẹn cắt tóc
     * @param {string|number} bookingId 
     */
    openBookingReviewModal(bookingId) {
      if (!bookingId) return;

      if (document.querySelector('.customer-portal-shell') || (this._modalSource === 'portal') || (window.CustomerWeb && window.CustomerWeb._modalSource === 'portal')) {
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

      const user = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser()
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function')
          ? window.CustomerWeb.getCurrentUser()
          : null;

      const existingReview = (window.store && typeof window.store.getReviewByBookingId === 'function')
        ? window.store.getReviewByBookingId(bookingId)
        : null;

      const currentRating = existingReview ? (existingReview.rating || 5) : 5;
      const currentComment = existingReview ? (existingReview.comment || '') : '';
      this._selectedBookingReviewRating = currentRating;
      if (window.CustomerWeb) window.CustomerWeb._selectedBookingReviewRating = currentRating;

      const bookings = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : (window.store?.state?.bookings || []);
      const booking = bookings.find(b => (b.id || b.bookingCode || b.MaLichHen) === bookingId) || {};
      const svcName = booking.serviceName || 'Dịch Vụ Cắt Tóc';
      const stylName = booking.stylistName || 'Master Barber';

      const escapeFn = (typeof this.escapeHtml === 'function')
        ? this.escapeHtml.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : (str) => (typeof str !== 'string' ? (str == null ? '' : String(str)) : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

      const modalHtml = `
        <div class="review-modal-content" style="max-width: 520px; margin: 0 auto; padding: 6px 4px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 12px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);">
              ⭐
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">
              Đánh Giá Lịch Hẹn #${escapeFn(bookingId)}
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Dịch vụ: <strong style="color: var(--brand-accent);">${escapeFn(svcName)}</strong> • Stylist: <strong>${escapeFn(stylName)}</strong>
            </p>
          </div>

          <!-- Bo chon sao tuong tac -->
          <div style="margin-bottom: 20px; text-align: center; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
              Mức độ hài lòng của bạn:
            </div>
            <div id="bookingReviewRatingStarsContainer" style="display: inline-flex; gap: 10px; font-size: 34px; cursor: pointer; user-select: none;">
              ${[1, 2, 3, 4, 5].map(star => `
                <span class="star-rating-item" data-star="${star}" 
                      style="color: ${star <= currentRating ? '#f59e0b' : '#4a4a44'}; transition: transform 0.15s, color 0.15s;"
                      onclick="CustomerWeb.setBookingReviewStars(${star})"
                      onmouseover="CustomerWeb.previewBookingReviewStars(${star})"
                      onmouseleave="CustomerWeb.resetBookingReviewStars()">
                  ★
                </span>
              `).join('')}
            </div>
            <div style="margin-top: 8px;">
              <span id="bookingReviewStarTextLabel" style="font-size: 13.5px; font-weight: 700; color: #f59e0b; display: inline-block; padding: 4px 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 999px;">
                ${this._getStarLabel(currentRating)}
              </span>
            </div>
            <input type="hidden" id="bookingReviewSelectedRating" value="${currentRating}">

            <!-- Goi y nhanh nhan xet -->
            <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.08);">
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                Gợi ý nhanh, nhấn để thêm vào nhận xét:
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
                ${[
                  'Cắt tóc rất ưng ý',
                  'Stylist tư vấn nhiệt tình',
                  'Gội đầu massage cực phê',
                  'Không gian salon sạch đẹp',
                  'Đúng giờ hẹn chu đáo'
                ].map(tag => `
                  <button type="button" class="pill-btn-outline" 
                          style="font-size: 11.5px; padding: 4px 10px; border-radius: 999px; cursor: pointer; border-color: rgba(255,255,255,0.12); color: var(--text-secondary); background: rgba(255,255,255,0.03);"
                          onclick="CustomerWeb.appendReviewTag('${tag}', 'booking')">
                    + ${tag}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Khung nhap noi dung danh gia phong to -->
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">
                Nhận xét chi tiết:
              </label>
              <span style="font-size: 12px; color: var(--text-secondary);">Tối thiểu 4 ký tự</span>
            </div>
            <textarea id="bookingReviewCommentInput" 
                      class="review-textarea-large"
                      rows="7" 
                      style="width: 100%; min-height: 180px !important; height: 180px; box-sizing: border-box; background: var(--surface-card, #1c1c1a) !important; color: var(--text-primary, #FAF8F5) !important; border: 1.5px solid var(--border-color, #4A4A44) !important; border-radius: 12px !important; padding: 14px 16px !important; font-size: 15px !important; line-height: 1.6 !important; font-family: inherit; resize: vertical !important; outline: none;"
                      placeholder="Cảm nhận về tay nghề stylist, độ hài lòng kiểu tóc, không gian salon...">${escapeFn(currentComment)}</textarea>
            <div style="margin-top: 6px; font-size: 12px; color: var(--text-secondary); text-align: right;">
              Nhận xét chân thực của bạn giúp Omni Salon nâng cao tay nghề và chất lượng phục vụ.
            </div>
          </div>

          <!-- Nut hanh dong -->
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="pill-btn-outline" 
                    style="min-height: 42px; padding: 0 20px; font-size: 13.5px; font-weight: 700; color: var(--text-secondary); border-color: var(--border-color); cursor: pointer;"
                    onclick="CustomerWeb.closeBookingReviewModal()">
              Hủy Bỏ
            </button>
            <button type="button" class="btn-submit-terracotta" 
                    id="submitBookingReviewBtn"
                    style="min-height: 42px; padding: 0 24px; border-radius: 999px; font-size: 13.5px; font-weight: 800; background: #d97706; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
                    onclick="CustomerWeb.handleBookingReviewSubmit('${escapeFn(bookingId)}')">
              ✓ ${existingReview ? 'Cập Nhật Đánh Giá' : 'Gửi Đánh Giá Ngay'}
            </button>
          </div>
        </div>
      `;

      if (window.UICommon && typeof window.UICommon.openModal === 'function') {
        window.UICommon.openModal(modalHtml, 'review');
      }
    },

    /**
     * Chọn sao đánh giá
     */
    setBookingReviewStars(star) {
      this._selectedBookingReviewRating = star;
      if (window.CustomerWeb) window.CustomerWeb._selectedBookingReviewRating = star;
      const input = document.getElementById('bookingReviewSelectedRating');
      if (input) input.value = star;
      this._updateBookingStarsVisual(star);
    },

    /**
     * Hover xem trước sao
     */
    previewBookingReviewStars(star) {
      this._updateBookingStarsVisual(star);
    },

    /**
     * Trả về sao đã chọn khi rê chuột ra ngoài
     */
    resetBookingReviewStars() {
      const input = document.getElementById('bookingReviewSelectedRating');
      const star = input ? parseInt(input.value, 10) : (this._selectedBookingReviewRating || 5);
      this._updateBookingStarsVisual(star);
    },

    /**
     * Cập nhật visual hiển thị hàng sao và text label
     */
    _updateBookingStarsVisual(rating) {
      const container = document.getElementById('bookingReviewRatingStarsContainer');
      const label = document.getElementById('bookingReviewStarTextLabel');
      if (container) {
        const stars = container.querySelectorAll('.star-rating-item');
        stars.forEach((s, idx) => {
          s.style.color = (idx + 1) <= rating ? '#f59e0b' : '#4a4a44';
          s.style.transform = (idx + 1) <= rating ? 'scale(1.12)' : 'scale(1)';
        });
      }
      if (label) {
        label.textContent = this._getStarLabel(rating);
      }
    },

    /**
     * Đóng modal đánh giá lịch hẹn và quay về modal nguồn (Customer Portal hoặc Tra cứu)
     */
    closeBookingReviewModal() {
      const target = (this && typeof this.openCustomerPortalModal === 'function') ? this : (window.CustomerWeb || this);
      const subModalSource = this._subModalSource || (target && target._subModalSource);
      const modalSource = this._modalSource || (target && target._modalSource);
      const lookupQuery = this._lookupLastQuery || (target && target._lookupLastQuery) || '';

      if (subModalSource === 'portal' || modalSource === 'portal') {
        if (target && typeof target.openCustomerPortalModal === 'function') {
          target.openCustomerPortalModal('bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
          window.CustomerWeb.openCustomerPortalModal('bookings');
        }
      } else {
        if (target && typeof target.openLookupModal === 'function') {
          target.openLookupModal(lookupQuery, 'bookings');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
          window.CustomerWeb.openLookupModal(lookupQuery, 'bookings');
        }
      }
    },

    /**
     * Xử lý gửi đánh giá lịch hẹn lên hệ thống
     * @param {string|number} bookingId 
     */
    async handleBookingReviewSubmit(bookingId) {
      const ratingInput = document.getElementById('bookingReviewSelectedRating');
      const commentInput = document.getElementById('bookingReviewCommentInput');
      const btn = document.getElementById('submitBookingReviewBtn');

      const rating = ratingInput ? parseInt(ratingInput.value, 10) : 5;
      const comment = commentInput ? commentInput.value.trim() : '';

      const getUser = (this && typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function'
            ? window.CustomerWeb.getCurrentUser.bind(window.CustomerWeb)
            : null);
      const user = getUser ? getUser() : null;
      const cleanCustomerId = user ? (user.MaKhachHang || (user.id ? String(user.id).replace(/^TK_/, '') : null) || user.customerId) : null;

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang lưu vào SQL Server...';
      }

      if (window.store && typeof window.store.submitBookingReview === 'function') {
        const res = await window.store.submitBookingReview({
          bookingId,
          rating,
          comment: comment || 'Dịch vụ cắt tóc và tạo kiểu rất đẹp, thợ chu đáo!',
          customerId: cleanCustomerId,
          customerName: user ? (user.fullName || user.username) : 'Khách Hàng',
          customerPhone: (user && user.phone) ? user.phone : ''
        });

        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Gửi Đánh Giá Ngay';
        }

        if (res && res.success) {
          if (window.UICommon && typeof window.UICommon.showToast === 'function') {
            window.UICommon.showToast(res.message || 'Cảm ơn quý khách đã đánh giá dịch vụ!', 'success');
          }
          this.closeBookingReviewModal();
          const lookupContainer = document.getElementById('lookupResultsContainer');
          if (lookupContainer) {
            if (this && typeof this.searchBookingLookup === 'function') {
              this.searchBookingLookup();
            } else if (window.CustomerWeb && typeof window.CustomerWeb.searchBookingLookup === 'function') {
              window.CustomerWeb.searchBookingLookup();
            }
          }
        } else {
          if (window.UICommon && typeof window.UICommon.showToast === 'function') {
            window.UICommon.showToast(res?.error || res?.message || 'Lỗi khi gửi đánh giá lịch hẹn!', 'error');
          }
        }
      }
    },

    /**
     * Xử lý đăng xuất tài khoản người dùng an toàn
     */
    handleLogout() {
      if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản không?')) {
        if (window.AuthEngine && typeof window.AuthEngine.logout === 'function') {
          window.AuthEngine.logout();
        } else if (window.store && typeof window.store.logout === 'function') {
          window.store.logout();
        }
        if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
          window.UICommon.closeGlobalModal();
        }
        if (typeof this.renderHeader === 'function') {
          this.renderHeader();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.renderHeader === 'function') {
          window.CustomerWeb.renderHeader();
        }
        if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
          window.AppRouter.navigate('/');
        } else {
          window.location.href = '/';
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerBookingReview = CustomerBookingReview;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerBookingReview);
  }

})(typeof window !== 'undefined' ? window : this);
