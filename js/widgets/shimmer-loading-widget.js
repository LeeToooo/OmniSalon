// =========================================================================
// OmniSalon / 4RAU Barbershop — SHIMMER LOADING SKELETON WIDGET (MATERIAL 3)
// Tuân thủ: .antigravity/rules/04_refactor.md (widgets/ component dùng chung)
// Chuẩn Material 3: Hiệu ứng chuyển động ánh sáng mượt mà khi nạp dữ liệu
// =========================================================================

(function (window) {
  'use strict';

  const ShimmerLoadingWidget = {
    /**
     * Render khung xương dịch vụ đang tải
     * @param {number} count - Số lượng thẻ giả lập
     * @returns {string} Chuỗi HTML skeleton
     */
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

    /**
     * Render khung xương Barber/Stylist đang tải
     * @param {number} count - Số lượng thẻ
     * @returns {string} Chuỗi HTML skeleton
     */
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

    /**
     * Render khung xương khung giờ ca cắt đang tải
     * @param {number} count - Số lượng slot
     * @returns {string} Chuỗi HTML skeleton
     */
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

    /**
     * Render khung xương Banner Carousel
     */
    renderBannerSkeleton() {
      return `
        <div class="md3-shimmer" style="width: 100%; height: 160px; border-radius: 16px; margin-bottom: 16px;"></div>
      `;
    }
  };

  window.ShimmerLoadingWidget = ShimmerLoadingWidget;

})(typeof window !== 'undefined' ? window : this);
