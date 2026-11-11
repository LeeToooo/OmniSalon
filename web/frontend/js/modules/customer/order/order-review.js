(function (window) {
  'use strict';

  const CustomerOrderReview = {
    _selectedReviewRating: 5,
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
     * Nhãn hiển thị mô tả số sao đánh giá đơn hàng
     */
    _getStarLabel(stars) {
      // Safe delegated call to _getStarLabel
      // Local star label formatting
      switch (stars) {
        case 5: return 'Tuyệt vời! Rất hài lòng ★★★★★';
        case 4: return 'Hài lòng, chất lượng tốt ★★★★☆';
        case 3: return 'Bình thường, tạm ổn ★★★☆☆';
        case 2: return 'Chưa hài lòng ★★☆☆☆';
        case 1: return 'Rất không hài lòng ★☆☆☆☆';
        default: return 'Rất hài lòng ★★★★★';
      }
    },

    /**
     * Mở modal đánh giá đơn hàng mỹ phẩm
     * @param {string|number} orderId 
     */
    openOrderReviewModal(orderId) {
      if (!orderId) return;

      const modalSource = this._modalSource !== undefined ? this._modalSource : window.CustomerWeb?._modalSource;

      if (document.querySelector('.customer-portal-shell') || modalSource === 'portal') {
        this._subModalSource = 'portal';
        if (window.CustomerWeb) window.CustomerWeb._subModalSource = 'portal';
      } else if (window.ProfilePage && document.getElementById('profileOrdersContainer')) {
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

      const getUser = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function'
            ? window.CustomerWeb.getCurrentUser.bind(window.CustomerWeb)
            : null);
      const user = getUser ? getUser() : (window.store && typeof window.store.getCurrentUser === 'function' ? window.store.getCurrentUser() : null);

      const existingReview = (window.store && typeof window.store.getReviewByOrderId === 'function')
        ? window.store.getReviewByOrderId(orderId)
        : null;

      const currentRating = existingReview ? (existingReview.rating || 5) : 5;
      const currentComment = existingReview ? (existingReview.comment || '') : '';
      this._selectedReviewRating = currentRating;
      if (window.CustomerWeb) window.CustomerWeb._selectedReviewRating = currentRating;

      const orders = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : [];
      const order = orders.find(o => (o.id || o.orderCode || o.MaDonHang) === orderId) || {};
      const items = order.items || [];
      const itemsSummary = items.map(it => it.name || it.TenSanPham || 'Sản phẩm').join(', ');

      const escapeFn = (s) => (typeof this.escapeHtml === 'function' ? this.escapeHtml(s) : (window.CustomerWeb?.escapeHtml ? window.CustomerWeb.escapeHtml(s) : String(s ?? '')));
      const getStarLabelFn = (s) => (typeof this._getStarLabel === 'function' ? this._getStarLabel(s) : (window.CustomerWeb?._getStarLabel ? window.CustomerWeb._getStarLabel(s) : `${s} sao`));

      const modalHtml = `
        <div class="review-modal-content" style="max-width: 680px; width: 100%; margin: 0 auto; padding: 10px 4px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 12px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);">
              ⭐
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">
              Đánh Giá Đơn Hàng #${escapeFn(orderId)}
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              ${itemsSummary ? `Sản phẩm: <strong style="color: var(--brand-accent);">${escapeFn(itemsSummary)}</strong>` : 'Chia sẻ trải nghiệm sử dụng mỹ phẩm chính hãng từ Omni Salon'}
            </p>
          </div>

          <!-- Bộ chọn sao đánh giá -->
          <div style="margin-bottom: 20px; text-align: center; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
              Mức độ hài lòng của bạn:
            </div>
            <div id="reviewRatingStarsContainer" style="display: inline-flex; gap: 10px; font-size: 34px; cursor: pointer; user-select: none;">
              ${[1, 2, 3, 4, 5].map(star => `
                <span class="star-rating-item" data-star="${star}" 
                      style="color: ${star <= currentRating ? '#f59e0b' : '#4a4a44'}; transition: transform 0.15s, color 0.15s;"
                      onclick="(window.CustomerOrderReview || window.CustomerWeb).setOrderReviewStars(${star})"
                      onmouseover="(window.CustomerOrderReview || window.CustomerWeb).previewOrderReviewStars(${star})"
                      onmouseleave="(window.CustomerOrderReview || window.CustomerWeb).resetOrderReviewStars()">
                  ★
                </span>
              `).join('')}
            </div>
            <div style="margin-top: 8px;">
              <span id="reviewStarTextLabel" style="font-size: 13.5px; font-weight: 700; color: #f59e0b; display: inline-block; padding: 4px 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 999px;">
                ${getStarLabelFn(currentRating)}
              </span>
            </div>
            <input type="hidden" id="orderReviewSelectedRating" value="${currentRating}">

            <!-- Gợi ý nhanh nhận xét -->
            <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.08);">
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                Gợi ý nhanh, nhấn để thêm vào nhận xét:
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
                ${[
                  'Sản phẩm chính hãng xịn',
                  'Giữ nếp rất tốt',
                  'Mùi hương thơm lâu',
                  'Đóng gói cẩn thận',
                  'Giao hàng nhanh chóng'
                ].map(tag => `
                  <button type="button" class="pill-btn-outline" 
                          style="font-size: 11.5px; padding: 4px 10px; border-radius: 999px; cursor: pointer; border-color: rgba(255,255,255,0.12); color: var(--text-secondary); background: rgba(255,255,255,0.03);"
                          onclick="(window.CustomerOrderReview || window.CustomerWeb).appendReviewTag('${tag}', 'order')">
                    + ${tag}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Khung nhập nội dung đánh giá -->
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">
                Nhận xét chi tiết:
              </label>
              <span style="font-size: 12px; color: var(--text-secondary);">Tối thiểu 4 ký tự</span>
            </div>
            <textarea id="orderReviewCommentInput" 
                      class="review-textarea-large"
                      rows="7" 
                      style="width: 100%; min-height: 180px !important; height: 180px; box-sizing: border-box; background: var(--surface-card, #1c1c1a) !important; color: var(--text-primary, #FAF8F5) !important; border: 1.5px solid var(--border-color, #4A4A44) !important; border-radius: 12px !important; padding: 14px 16px !important; font-size: 15px !important; line-height: 1.6 !important; font-family: inherit; resize: vertical !important; outline: none;"
                      placeholder="Chất lượng sản phẩm, độ giữ nếp hoặc mùi hương, thời gian giao hàng và quy cách đóng hộp...">${escapeFn(currentComment)}</textarea>
            <div style="margin-top: 6px; font-size: 12px; color: var(--text-secondary); text-align: right;">
              💡 Nhận xét chân thực của bạn giúp Omni Salon không ngừng nâng cao chất lượng.
            </div>
          </div>

          <!-- Nút hành động -->
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="pill-btn-outline" 
                    style="min-height: 42px; padding: 0 20px; font-size: 13.5px; font-weight: 700; color: var(--text-secondary); border-color: var(--border-color); cursor: pointer;"
                    onclick="(window.CustomerOrderReview || window.CustomerWeb).closeOrderReviewModal()">
              Hủy Bỏ
            </button>
            <button type="button" class="btn-submit-terracotta" 
                    id="submitOrderReviewBtn"
                    style="min-height: 42px; padding: 0 24px; border-radius: 999px; font-size: 13.5px; font-weight: 800; background: #d97706; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
                    onclick="(window.CustomerOrderReview || window.CustomerWeb).handleOrderReviewSubmit('${escapeFn(orderId)}')">
              ✓ ${existingReview ? 'Cập Nhật Đánh Giá' : 'Gửi Đánh Giá Ngay'}
            </button>
          </div>
        </div>
      `;

      if (window.UICommon && typeof window.UICommon.openModal === 'function') {
        window.UICommon.openModal(modalHtml, 'review');
        const modal = document.getElementById('globalModal');
        if (modal) {
          const shell = modal.querySelector('.modal-content-shell');
          if (shell) {
            shell.style.maxWidth = '680px';
            shell.style.width = '94vw';
          }
        }
      }
    },

    /**
     * Đính kèm nhanh nhãn gợi ý vào ô nhận xét
     */
    appendReviewTag(tag, type = 'order') {
      const inputId = type === 'booking' ? 'bookingReviewCommentInput' : 'orderReviewCommentInput';
      const textarea = document.getElementById(inputId);
      if (!textarea) return;
      const currentVal = textarea.value.trim();
      if (!currentVal) {
        textarea.value = tag;
      } else if (!currentVal.toLowerCase().includes(tag.toLowerCase())) {
        textarea.value = currentVal + ', ' + tag.toLowerCase();
      }
      textarea.focus();
    },

    /**
     * Thiết lập số sao đánh giá
     */
    setOrderReviewStars(star) {
      this._selectedReviewRating = star;
      if (window.CustomerWeb) window.CustomerWeb._selectedReviewRating = star;
      const input = document.getElementById('orderReviewSelectedRating');
      if (input) input.value = star;
      if (typeof this._updateStarsVisual === 'function') {
        this._updateStarsVisual(star);
      } else if (window.CustomerWeb && typeof window.CustomerWeb._updateStarsVisual === 'function') {
        window.CustomerWeb._updateStarsVisual(star);
      }
    },

    /**
     * Xem trước visual số sao khi hover chuột
     */
    previewOrderReviewStars(star) {
      if (typeof this._updateStarsVisual === 'function') {
        this._updateStarsVisual(star);
      } else if (window.CustomerWeb && typeof window.CustomerWeb._updateStarsVisual === 'function') {
        window.CustomerWeb._updateStarsVisual(star);
      }
    },

    /**
     * Khôi phục số sao đã chọn khi rê chuột ra ngoài
     */
    resetOrderReviewStars() {
      const input = document.getElementById('orderReviewSelectedRating');
      const currentSelected = this._selectedReviewRating !== undefined
        ? this._selectedReviewRating
        : (window.CustomerWeb?._selectedReviewRating || 5);
      const star = input ? parseInt(input.value, 10) : currentSelected;
      if (typeof this._updateStarsVisual === 'function') {
        this._updateStarsVisual(star);
      } else if (window.CustomerWeb && typeof window.CustomerWeb._updateStarsVisual === 'function') {
        window.CustomerWeb._updateStarsVisual(star);
      }
    },

    /**
     * Cập nhật visual màu sắc & kích thước icon sao theo rating
     */
    _updateStarsVisual(rating) {
      const container = document.getElementById('reviewRatingStarsContainer');
      const label = document.getElementById('reviewStarTextLabel');
      if (container) {
        const stars = container.querySelectorAll('.star-rating-item');
        stars.forEach((s, idx) => {
          s.style.color = (idx + 1) <= rating ? '#f59e0b' : '#4a4a44';
          s.style.transform = (idx + 1) <= rating ? 'scale(1.12)' : 'scale(1)';
        });
      }
      if (label) {
        const getStarLabelFn = (typeof this._getStarLabel === 'function')
          ? this._getStarLabel.bind(this)
          : (window.CustomerWeb && typeof window.CustomerWeb._getStarLabel === 'function'
              ? window.CustomerWeb._getStarLabel.bind(window.CustomerWeb)
              : null);
        label.textContent = getStarLabelFn ? getStarLabelFn(rating) : `${rating} sao`;
      }
    },

    /**
     * Đóng modal đánh giá đơn hàng và quay về modal nguồn
     */
    closeOrderReviewModal() {
      const subModalSource = this._subModalSource !== undefined ? this._subModalSource : window.CustomerWeb?._subModalSource;
      const modalSource = this._modalSource !== undefined ? this._modalSource : window.CustomerWeb?._modalSource;
      const lookupLastQuery = this._lookupLastQuery !== undefined ? this._lookupLastQuery : (window.CustomerWeb?._lookupLastQuery || '');

      if (subModalSource === 'portal' || modalSource === 'portal') {
        if (typeof this.openCustomerPortalModal === 'function') {
          this.openCustomerPortalModal('orders');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
          window.CustomerWeb.openCustomerPortalModal('orders');
        }
      } else {
        if (typeof this.openLookupModal === 'function') {
          this.openLookupModal(lookupLastQuery, 'orders');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
          window.CustomerWeb.openLookupModal(lookupLastQuery, 'orders');
        }
      }
    },

    /**
     * Gửi đánh giá đơn hàng mỹ phẩm lên SQL Server
     * @param {string|number} orderId 
     */
    async handleOrderReviewSubmit(orderId) {
      const ratingInput = document.getElementById('orderReviewSelectedRating');
      const commentInput = document.getElementById('orderReviewCommentInput');
      const btn = document.getElementById('submitOrderReviewBtn');

      const rating = ratingInput ? parseInt(ratingInput.value, 10) : 5;
      const comment = commentInput ? commentInput.value.trim() : '';

      const getUser = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function'
            ? window.CustomerWeb.getCurrentUser.bind(window.CustomerWeb)
            : null);
      const user = getUser ? getUser() : (window.store && typeof window.store.getCurrentUser === 'function' ? window.store.getCurrentUser() : null);
      const cleanCustomerId = user ? (user.MaKhachHang || (user.id ? String(user.id).replace(/^TK_/, '') : null) || user.customerId) : null;

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang lưu vào SQL Server...';
      }

      if (window.store && typeof window.store.submitOrderReview === 'function') {
        const res = await window.store.submitOrderReview({
          orderId,
          rating,
          comment: comment || 'Đơn hàng rất chuẩn, sáp và sản phẩm chính hãng dùng rất thích!',
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
            window.UICommon.showToast(res.message || 'Cảm ơn quý khách đã đánh giá đơn hàng!', 'success');
          }
          if (typeof this.closeOrderReviewModal === 'function') {
            this.closeOrderReviewModal();
          } else if (window.UICommon && typeof window.UICommon.closeGlobalModal === "function") { window.UICommon.closeGlobalModal();
          }

          const lookupContainer = document.getElementById('lookupResultsContainer');
          if (lookupContainer) {
            if (typeof this.searchOrderLookup === 'function') {
              this.searchOrderLookup();
            } else if (window.CustomerWeb && typeof window.CustomerWeb.searchOrderLookup === 'function') {
              window.CustomerWeb.searchOrderLookup();
            }
          }
        } else {
          if (window.UICommon && typeof window.UICommon.showToast === 'function') {
            window.UICommon.showToast(res?.error || res?.message || 'Lỗi khi gửi đánh giá đơn hàng!', 'error');
          }
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerOrderReview = CustomerOrderReview;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerOrderReview);
  }

})(typeof window !== 'undefined' ? window : this);

