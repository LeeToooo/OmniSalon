// =========================================================================
// OmniSalon & Spa — STAT CARD COMPONENT (ADMIN DASHBOARD)
// Tuân thủ: .antigravity/rules/04_refactor.md, 07_ponytail.md
// Thiết kế: Thẻ thống kê High-End với Icon Gradient, Số liệu lớn, % Tăng trưởng
// Surface #1A1D26, Border 1px #2A2F3D, Radius 16px, Text #FFFFFF & #9CA3AF
// =========================================================================

(function (window) {
  'use strict';

  const StatCardWidget = {
    /**
     * Render thẻ thống kê Admin Dashboard
     * @param {Object} stat - Dữ liệu thống kê
     * @param {string} stat.title - Tiêu đề chỉ số (VD: 'Tổng Doanh Thu Tuần')
     * @param {string|number} stat.value - Số liệu lớn (VD: '128.500.000 đ' hoặc 342)
     * @param {string} [stat.growth='+18.4%'] - Tỷ lệ phần trăm tăng trưởng
     * @param {boolean} [stat.isPositive=true] - Chiều tăng trưởng (true: tăng, false: giảm)
     * @param {string} [stat.icon='💎'] - Icon hiển thị
     * @param {string} [stat.iconGradient=''] - Gradient nền cho Icon
     * @param {string} [stat.subtext=''] - Ghi chú phụ dưới số liệu
     * @param {Object} [options={}] - Tùy chọn bổ sung
     * @returns {string} Chuỗi HTML component
     */
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
            <!-- Icon Gradient Cao Cấp -->
            <div class="stat-card-icon-wrap" style="background: ${gradient};">
              <span class="stat-card-icon">${icon}</span>
            </div>

            <!-- Huy hiệu Tỷ lệ Phần trăm Tăng trưởng -->
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

    /**
     * Render lưới nhiều StatCards trên Admin Dashboard
     * @param {Array<Object>} statsList
     * @param {Object} [options={}]
     * @returns {string} Chuỗi HTML
     */
    renderGrid(statsList = [], options = {}) {
      if (!Array.isArray(statsList) || statsList.length === 0) return '';
      return `
        <div class="luxury-stat-grid ${options.gridClassName || ''}">
          ${statsList.map(st => this.render(st, options)).join('')}
        </div>
      `;
    }
  };

  window.StatCardWidget = StatCardWidget;
  window.StatCard = StatCardWidget;

})(typeof window !== 'undefined' ? window : this);
