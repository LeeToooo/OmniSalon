// =========================================================================
// OmniSalon & Spa — STYLIST CARD COMPONENT (MODERN HIGH-END SALON & SPA)
// Tuân thủ: .antigravity/rules/04_refactor.md, 07_ponytail.md
// Thiết kế: Avatar tròn viền Gold, Rating ★, Lượt phục vụ, Tags chuyên môn
// Surface #1A1D26, Border 1px #2A2F3D, Radius 16px, Accent Gold #D4AF37
// =========================================================================

(function (window) {
  'use strict';

  const StylistCardWidget = {
    /**
     * Render thẻ Barber / Stylist đẳng cấp High-End Salon & Spa
     * @param {Object} stylist - Thông tin stylist từ store/API
     * @param {Object} [options={}] - Tùy chọn hiển thị
     * @param {boolean} [options.isActive=false] - Trạng thái đang chọn
     * @param {string} [options.onClickHandler=''] - Callback khi click
     * @returns {string} Chuỗi HTML component
     */
    render(stylist, options = {}) {
      if (!stylist) return '';

      const {
        isActive = false,
        onClickHandler = `UICommon.selectBookingStylist('${stylist.id}')`
      } = options;

      const id = stylist.id || '';
      const esc = window.SalonUtils && window.SalonUtils.escapeHtml ? window.SalonUtils.escapeHtml : (str => str || '');
      const name = esc(stylist.name || 'Master Stylist');
      const level = esc(stylist.level || stylist.role || 'Senior Stylist & Colorist');
      const rating = (stylist.rating !== undefined ? Number(stylist.rating) : 4.9).toFixed(1);
      const reviews = Number(stylist.reviewsCount || stylist.reviews_count || 120);
      
      const avatar = stylist.avatar || stylist.avatar_url || 
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

      // Chuyên môn mặc định phong cách High-End Salon
      const specialties = Array.isArray(stylist.specialties) && stylist.specialties.length > 0
        ? stylist.specialties
        : (Array.isArray(stylist.tags) && stylist.tags.length > 0 ? stylist.tags : ['Cắt layer', 'Uốn phục hồi', 'Nhuộm tẩy']);

      return `
        <div class="md3-stylist-card luxury-stylist-card ${isActive ? 'active' : ''}" 
             id="stylistCard_${id}" 
             onclick="${onClickHandler}" 
             title="Chọn Stylist: ${name}">
          <div class="md3-stylist-avatar-wrap">
            <img src="${avatar}" class="md3-stylist-avatar" alt="${name}" 
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';">
            <span class="md3-stylist-status-dot" title="Sẵn sàng nhận lịch"></span>
          </div>

          <div class="md3-stylist-name">${name}</div>
          <div class="md3-stylist-level-badge">${level}</div>

          <!-- Đánh giá sao & Số lượt phục vụ -->
          <div class="md3-stylist-rating-bar">
            <span class="gold-star">★</span>
            <span class="rating-value">${rating}</span>
            <span class="rating-reviews-tag">(${reviews})</span>
          </div>
          <div class="md3-stylist-served-metric">
            <span class="served-count-num">${reviews.toLocaleString('vi-VN')}</span> lượt phục vụ
          </div>

          <!-- Tags chuyên môn Salon & Spa (Cắt layer, Uốn phục hồi, Nhuộm tẩy) -->
          <div class="md3-stylist-specialty-tags">
            ${specialties.slice(0, 3).map(tag => `<span class="stylist-tag-pill">${esc(tag)}</span>`).join('')}
          </div>

          ${isActive ? `
            <div class="stylist-active-badge">✓</div>
          ` : ''}
        </div>
      `;
    },

    /**
     * Render lưới nhiều Stylist
     */
    renderGrid(stylists = [], activeId = null, onSelectFnName = 'UICommon.selectBookingStylist') {
      if (!Array.isArray(stylists) || stylists.length === 0) {
        return `
          <div class="staff-empty-card" style="padding: 24px; text-align: center; color: var(--color-text-muted, #9CA3AF);">
            <p style="font-size: 13px; margin: 0;">Hiện chưa có chuyên gia Stylist khả dụng tại chi nhánh này.</p>
          </div>
        `;
      }
      return `
        <div class="md3-stylist-grid luxury-stylist-grid">
          ${stylists.map(st => this.render(st, {
            isActive: st.id === activeId,
            onClickHandler: `${onSelectFnName}('${st.id}')`
          })).join('')}
        </div>
      `;
    }
  };

  window.StylistCardWidget = StylistCardWidget;
  window.StylistCard = StylistCardWidget;

})(typeof window !== 'undefined' ? window : this);
