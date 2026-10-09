// =========================================================================
// OmniSalon & Spa — UNIFIED WIDGETS BUNDLE (MODERN HIGH-END DESIGN SYSTEM)
// Tích hợp toàn bộ 6 Widgets giao diện dùng chung trong 1 tệp duy nhất:
// 1. ServiceCardWidget       4. BookingSlotPicker
// 2. StylistCardWidget       5. StatCardWidget
// 3. TimeSlotChipsWidget     6. ShimmerLoadingWidget
// Tuân thủ: .antigravity/rules/04_refactor.md, 07_ponytail.md (Loại bỏ phân mảnh tệp)
// =========================================================================

(function (window) {
  'use strict';

  // -----------------------------------------------------------------------
  // 1. SERVICE CARD WIDGET (MATERIAL 3)
  // -----------------------------------------------------------------------
  const ServiceCardWidget = {
    render(service, options = {}) {
      if (!service) return '';

      const {
        isActive = false,
        onClickHandler = `UICommon.selectBookingService('${service.id}')`,
        isCombo = false
      } = options;

      const id = service.id || '';
      const name = window.SalonUtils ? window.SalonUtils.escapeHtml(service.name || 'Dịch Vụ Cắt Tóc') : (service.name || '');
      const price = window.SalonUtils ? window.SalonUtils.formatCurrency(service.price || 0) : `${service.price} đ`;
      const duration = service.duration || service.duration_minutes || (isCombo ? 75 : 45);
      const isVipCombo = isCombo || (service.category === 'combo') || (String(id).startsWith('cmb-'));
      
      const rawImg = service.image || service.HinhAnh || (isVipCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : 'Men_Grooming_Products/DichVu_Men/DV1.jpg');
      const thumb = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function')
        ? SalonUtils.formatImageUrl(rawImg)
        : rawImg;

      return `
        <div class="md3-service-card service-chip ${isActive ? 'active' : ''} ${isVipCombo ? 'combo-vip-highlight combo-chip' : ''}" 
             id="serviceCard_${id}" 
             onclick="${onClickHandler}">
          <img src="${thumb}" class="md3-service-card-thumb" alt="${name}" 
               onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='Men_Grooming_Products/DichVu_Men/DV1.jpg');">
          <div class="md3-service-card-content">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <h4 class="md3-service-card-title">${isVipCombo ? '👑 ' : ''}${name}</h4>
              ${isVipCombo ? `<span style="font-size: 10px; font-weight: 800; color: #b45309; background: #fef3c7; padding: 2px 6px; border-radius: 9999px;">-25%</span>` : ''}
            </div>
            <div class="md3-service-card-meta">
              <span class="md3-service-duration-chip">⏱️ ${duration} phút</span>
              <span style="font-size: 10px; color: var(--text-secondary);">• Omni Salon</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <span class="md3-service-card-price">${price}</span>
              <span style="font-size: 11px; font-weight: 800; color: var(--md3-primary);">${isActive ? '✓ Đã Chọn' : 'Chọn Ca →'}</span>
            </div>
          </div>
        </div>
      `;
    },

    renderList(services = [], activeId = null, onSelectFnName = 'UICommon.selectBookingService') {
      if (!Array.isArray(services) || services.length === 0) {
        return `<div class="staff-empty-card" style="padding: 20px;"><p style="font-size: 12px; color: #CBD5E1;">Chưa có dịch vụ nào.</p></div>`;
      }
      return `
        <div class="md3-service-list" style="display: flex; flex-direction: column; gap: 8px;">
          ${services.map(s => this.render(s, {
            isActive: s.id === activeId,
            onClickHandler: `${onSelectFnName}('${s.id}')`
          })).join('')}
        </div>
      `;
    }
  };

  // -----------------------------------------------------------------------
  // 2. STYLIST CARD WIDGET
  // -----------------------------------------------------------------------
  const StylistCardWidget = {
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
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';

      const specialties = Array.isArray(stylist.specialties) && stylist.specialties.length > 0
        ? stylist.specialties
        : (Array.isArray(stylist.tags) && stylist.tags.length > 0 ? stylist.tags : ['Fade sắc nét', 'Uốn Textured Nam', 'Nhuộm Khói Nam']);

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

          <div class="md3-stylist-rating-bar">
            <span class="gold-star">★</span>
            <span class="rating-value">${rating}</span>
            <span class="rating-reviews-tag">(${reviews})</span>
          </div>
          <div class="md3-stylist-served-metric">
            <span class="served-count-num">${reviews.toLocaleString('vi-VN')}</span> lượt phục vụ
          </div>

          <div class="md3-stylist-specialty-tags">
            ${specialties.slice(0, 3).map(tag => `<span class="stylist-tag-pill">${esc(tag)}</span>`).join('')}
          </div>

          ${isActive ? `<div class="stylist-active-badge">✓</div>` : ''}
        </div>
      `;
    },

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

  // -----------------------------------------------------------------------
  // 3. TIME SLOT CHIPS WIDGET
  // -----------------------------------------------------------------------
  const TimeSlotChipsWidget = {
    render(slots = [], selectedSlot = '', onSelectFnName = 'UICommon.selectBookingSlot') {
      if (!Array.isArray(slots) || slots.length === 0) {
        return `
          <div class="staff-empty-card" style="padding: 16px;">
            <p style="font-size: 12px; color: #CBD5E1; margin: 0;">Không có khung giờ trống trong ngày này. Vui lòng chọn ngày khác.</p>
          </div>
        `;
      }

      const availableCount = slots.filter(s => s.available).length;

      return `
        <div class="md3-time-slots-container">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: #CBD5E1; text-transform: uppercase;">
              Khung giờ khả dụng (${availableCount}/${slots.length} ca trống):
            </span>
            <span style="font-size: 10px; color: #10b981; font-weight: 700;">● Còn chỗ đặt</span>
          </div>

          <div class="md3-time-slots-grid" id="timeSlotsContainer">
            ${slots.map(s => {
              const isSelected = (selectedSlot === s.time) && s.available;
              const isDisabled = !s.available;
              const clickAction = s.available ? `${onSelectFnName}('${s.time}')` : '';
              const title = s.available 
                ? `Khung giờ ${s.time} đang trống — Bấm để chọn` 
                : `Khung giờ ${s.time} đã có khách đặt hoặc giao thoa ca khác`;

              return `
                <button type="button" 
                        class="time-slot-btn md3-time-chip slot-chip-interactive ${isSelected ? 'active' : ''} ${isDisabled ? 'disabled' : ''}"
                        ${isDisabled ? 'disabled' : `onclick="${clickAction}"`}
                        title="${title}">
                  ${s.time}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  };

  // -----------------------------------------------------------------------
  // 4. BOOKING SLOT PICKER
  // -----------------------------------------------------------------------
  const BookingSlotPicker = {
    categorizeSlots(slots = []) {
      const groups = { morning: [], afternoon: [], evening: [] };
      slots.forEach(slot => {
        const hour = parseInt(slot.time.split(':')[0], 10) || 0;
        if (hour < 12) groups.morning.push(slot);
        else if (hour < 18) groups.afternoon.push(slot);
        else groups.evening.push(slot);
      });
      return groups;
    },

    renderChip(slot, selectedSlot, onSelectFnName) {
      const isSelected = (selectedSlot === slot.time) && slot.available;
      const isDisabled = !slot.available;
      const clickAction = slot.available ? `${onSelectFnName}('${slot.time}')` : '';
      const title = slot.available 
        ? `Khung giờ ${slot.time} khả dụng — Chạm để chọn` 
        : `Khung giờ ${slot.time} đã kín lịch hoặc đã được đặt`;

      return `
        <button type="button" 
                class="time-slot-btn md3-time-chip booking-slot-chip ${isSelected ? 'active' : ''} ${isDisabled ? 'disabled' : ''}"
                ${isDisabled ? 'disabled' : `onclick="${clickAction}"`}
                title="${title}">
          ${slot.time}
        </button>
      `;
    },

    render(slots = [], selectedSlot = '', onSelectFnName = 'UICommon.selectBookingSlot') {
      if (!Array.isArray(slots) || slots.length === 0) {
        return `
          <div class="staff-empty-card" style="padding: 18px; text-align: center; color: var(--color-text-muted, #9CA3AF); background: var(--color-surface-card, #1A1D26); border-radius: var(--radius-card, 16px); border: 1px solid var(--color-border-thin, #2A2F3D);">
            <p style="font-size: 13px; margin: 0;">Không có khung giờ khả dụng cho ngày này. Quý khách vui lòng chọn ngày khác.</p>
          </div>
        `;
      }

      const availableCount = slots.filter(s => s.available).length;
      const groups = this.categorizeSlots(slots);

      const sections = [
        { key: 'morning', label: 'Buổi Sáng', timeRange: '08:00 - 11:30', icon: '🌅', items: groups.morning },
        { key: 'afternoon', label: 'Buổi Chiều', timeRange: '12:00 - 17:30', icon: '☀️', items: groups.afternoon },
        { key: 'evening', label: 'Buổi Tối', timeRange: '18:00 - 21:00', icon: '🌙', items: groups.evening }
      ];

      return `
        <div class="booking-slot-picker md3-time-slots-container" id="bookingSlotPicker">
          <div class="slot-picker-header">
            <span class="slot-picker-title">
              Khung giờ khả dụng (${availableCount}/${slots.length} ca trống):
            </span>
            <span class="slot-picker-status-indicator">
              <span class="indicator-dot">●</span> Đang mở đặt lịch
            </span>
          </div>

          <div class="slot-picker-groups-wrapper">
            ${sections.filter(sec => sec.items.length > 0).map(sec => `
              <div class="slot-period-group">
                <div class="period-group-header">
                  <span class="period-icon">${sec.icon}</span>
                  <span class="period-label">${sec.label}</span>
                  <span class="period-range">(${sec.timeRange})</span>
                </div>
                <div class="period-chips-grid">
                  ${sec.items.map(slot => this.renderChip(slot, selectedSlot, onSelectFnName)).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  };

  // -----------------------------------------------------------------------
  // 5. STAT CARD WIDGET
  // -----------------------------------------------------------------------
  const StatCardWidget = {
    render(stat = {}, options = {}) {
      if (!stat) return '';

      const esc = window.SalonUtils && window.SalonUtils.escapeHtml ? window.SalonUtils.escapeHtml : (s => s || '');
      const title = esc(stat.title || stat.label || 'Chỉ Số Hoạt Động');
      const value = esc(String(stat.value !== undefined ? stat.value : '0'));
      const growth = esc(stat.growth || stat.growthRate || '+0.0%');
      const isPositive = stat.isPositive !== undefined ? Boolean(stat.isPositive) : !growth.startsWith('-');
      const icon = stat.icon || '💎';
      const defaultGradient = 'linear-gradient(135deg, #D4AF37 0%, #996515 100%)';
      const gradient = stat.iconGradient || defaultGradient;
      const subtext = esc(stat.subtext || stat.detail || 'So với kỳ trước');
      const cardId = stat.id ? `id="statCard_${stat.id}"` : '';

      return `
        <div class="luxury-stat-card ${options.className || ''}" ${cardId}>
          <div class="stat-card-header">
            <div class="stat-card-icon-wrap" style="background: ${gradient};">
              <span class="stat-card-icon">${icon}</span>
            </div>
            <div class="stat-card-growth ${isPositive ? 'growth-positive' : 'growth-negative'}">
              <span class="growth-arrow">${isPositive ? '↗' : '↘'}</span>
              <span class="growth-percentage">${growth}</span>
            </div>
          </div>
          <div class="stat-card-content">
            <div class="stat-card-label">${title}</div>
            <div class="stat-card-value">${value}</div>
            ${subtext ? `<div class="stat-card-subtext">${subtext}</div>` : ''}
          </div>
        </div>
      `;
    },

    renderGrid(statsList = [], options = {}) {
      if (!Array.isArray(statsList) || statsList.length === 0) return '';
      return `
        <div class="luxury-stat-grid ${options.gridClassName || ''}">
          ${statsList.map(st => this.render(st, options)).join('')}
        </div>
      `;
    }
  };

  // -----------------------------------------------------------------------
  // 6. SHIMMER LOADING WIDGET
  // -----------------------------------------------------------------------
  const ShimmerLoadingWidget = {
    renderServiceListSkeleton(count = 3) {
      const items = Array.from({ length: count });
      return `
        <div class="md3-shimmer-service-list" style="display: flex; flex-direction: column; gap: 8px;">
          ${items.map(() => `
            <div class="md3-shimmer-card">
              <div class="md3-shimmer md3-shimmer-thumb"></div>
              <div style="flex: 1; min-width: 0;">
                <div class="md3-shimmer md3-shimmer-line" style="width: 75%; height: 14px;"></div>
                <div class="md3-shimmer md3-shimmer-line" style="width: 45%; height: 10px;"></div>
                <div style="display: flex; justify-content: space-between; margin-top: 6px;">
                  <div class="md3-shimmer md3-shimmer-line" style="width: 30%; height: 14px;"></div>
                  <div class="md3-shimmer md3-shimmer-line" style="width: 25%; height: 12px;"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderStylistGridSkeleton(count = 4) {
      const items = Array.from({ length: count });
      return `
        <div class="md3-stylist-grid">
          ${items.map(() => `
            <div class="md3-shimmer-card" style="flex-direction: column; align-items: center; padding: 12px 8px;">
              <div class="md3-shimmer" style="width: 58px; height: 58px; border-radius: 9999px; margin-bottom: 8px;"></div>
              <div class="md3-shimmer md3-shimmer-line" style="width: 70%; height: 12px; margin-bottom: 4px;"></div>
              <div class="md3-shimmer md3-shimmer-line" style="width: 50%; height: 10px; margin-bottom: 4px;"></div>
              <div class="md3-shimmer md3-shimmer-line" style="width: 40%; height: 10px;"></div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderTimeSlotsSkeleton(count = 8) {
      const items = Array.from({ length: count });
      return `
        <div class="md3-time-slots-grid">
          ${items.map(() => `
            <div class="md3-shimmer" style="height: 38px; border-radius: 16px;"></div>
          `).join('')}
        </div>
      `;
    },

    renderBannerSkeleton() {
      return `<div class="md3-shimmer" style="width: 100%; height: 160px; border-radius: 16px; margin-bottom: 16px;"></div>`;
    }
  };

  // -----------------------------------------------------------------------
  // EXPORTS & BACKWARD COMPATIBILITY
  // -----------------------------------------------------------------------
  window.ServiceCardWidget = ServiceCardWidget;
  window.StylistCardWidget = StylistCardWidget;
  window.TimeSlotChipsWidget = TimeSlotChipsWidget;
  window.BookingSlotPicker = BookingSlotPicker;
  window.StatCardWidget = StatCardWidget;
  window.StatCard = StatCardWidget;
  window.ShimmerLoadingWidget = ShimmerLoadingWidget;

  window.SalonWidgets = {
    StylistCard: StylistCardWidget,
    BookingSlotPicker: BookingSlotPicker,
    StatCard: StatCardWidget,
    ServiceCard: ServiceCardWidget,
    TimeSlotChips: TimeSlotChipsWidget,
    ShimmerLoading: ShimmerLoadingWidget
  };

})(typeof window !== 'undefined' ? window : this);
