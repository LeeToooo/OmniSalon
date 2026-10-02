// =========================================================================
// OmniSalon & Spa — BOOKING SLOT PICKER COMPONENT
// Tuân thủ: .antigravity/rules/04_refactor.md, 07_ponytail.md
// Thiết kế: Bộ chọn khung giờ Sáng / Chiều / Tối dạng Chip tương tác
// Đổi màu Accent Gold (#D4AF37) khi chọn, làm mờ (disabled) khi đã đặt
// Surface #1A1D26, Border 1px #2A2F3D, Radius 12px-16px
// =========================================================================

(function (window) {
  'use strict';

  const BookingSlotPicker = {
    /**
     * Phân loại slot thành các buổi: Sáng, Chiều, Tối
     * @param {Array<{time: string, available: boolean}>} slots
     * @returns {Object} { morning: [], afternoon: [], evening: [] }
     */
    categorizeSlots(slots = []) {
      const groups = {
        morning: [],
        afternoon: [],
        evening: []
      };

      slots.forEach(slot => {
        const hour = parseInt(slot.time.split(':')[0], 10) || 0;
        if (hour < 12) {
          groups.morning.push(slot);
        } else if (hour < 18) {
          groups.afternoon.push(slot);
        } else {
          groups.evening.push(slot);
        }
      });

      return groups;
    },

    /**
     * Render một chip khung giờ
     */
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

    /**
     * Render bộ chọn khung giờ hoàn chỉnh
     * @param {Array<{time: string, available: boolean}>} slots
     * @param {string} selectedSlot
     * @param {string} [onSelectFnName='UICommon.selectBookingSlot']
     * @returns {string} Chuỗi HTML component
     */
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
          <!-- Thanh trạng thái số lượng slot -->
          <div class="slot-picker-header">
            <span class="slot-picker-title">
              Khung giờ khả dụng (${availableCount}/${slots.length} ca trống):
            </span>
            <span class="slot-picker-status-indicator">
              <span class="indicator-dot">●</span> Đang mở đặt lịch
            </span>
          </div>

          <!-- Nhóm khung giờ sáng, chiều, tối -->
          <div class="slot-picker-groups-wrapper">
            ${sections.filter(sec => sec.items.length > 0).map(sec => `
              <div class="slot-period-group">
                <div class="slot-period-header">
                  <span class="slot-period-icon">${sec.icon}</span>
                  <span class="slot-period-name">${sec.label}</span>
                  <span class="slot-period-time-range">(${sec.timeRange})</span>
                </div>
                <div class="slot-period-grid md3-time-slots-grid">
                  ${sec.items.map(slot => this.renderChip(slot, selectedSlot, onSelectFnName)).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  };

  window.BookingSlotPicker = BookingSlotPicker;
  // Alias tương thích ngược cho TimeSlotChipsWidget
  window.TimeSlotChipsWidget = BookingSlotPicker;

})(typeof window !== 'undefined' ? window : this);
