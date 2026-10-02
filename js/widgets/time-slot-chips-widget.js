// =========================================================================
// OmniSalon / 4RAU Barbershop — TIME SLOT CHIPS WIDGET (MATERIAL 3)
// Tuân thủ: .antigravity/rules/04_refactor.md (widgets/ component dùng chung)
// Chuẩn Material 3: Filter Chips 16px Radius, Active Elevation & Disabled state
// =========================================================================

(function (window) {
  'use strict';

  const TimeSlotChipsWidget = {
    /**
     * Render lưới các khung giờ đặt lịch dạng Material 3 Chips
     * @param {Array<{time: string, available: boolean}>} slots - Danh sách slot từ store
     * @param {string} selectedSlot - Khung giờ đang chọn (VD: '10:30')
     * @param {string} [onSelectFnName='UICommon.selectBookingSlot'] - Tên callback khi bấm chọn slot
     * @returns {string} Chuỗi HTML component
     */
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

  window.TimeSlotChipsWidget = TimeSlotChipsWidget;

})(typeof window !== 'undefined' ? window : this);
