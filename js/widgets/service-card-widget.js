// =========================================================================
// OmniSalon / 4RAU Barbershop — SERVICE CARD WIDGET (MATERIAL 3)
// Tuân thủ: .antigravity/rules/04_refactor.md (widgets/ component dùng chung)
// Chuẩn Material 3: Border Radius 16px, Elevation, Typography & Terracotta
// =========================================================================

(function (window) {
  'use strict';

  const ServiceCardWidget = {
    /**
     * Render thẻ dịch vụ hoặc Combo VIP chuẩn Material 3
     * @param {Object} service - Đối tượng dịch vụ / combo từ store
     * @param {Object} options - Tùy chọn hiển thị
     * @param {boolean} [options.isActive=false] - Trạng thái đang được chọn
     * @param {boolean} [options.showSelectAction=true] - Hiển thị hành vi click chọn
     * @param {string} [options.onClickHandler=''] - Tên callback hoặc biểu thức gọi khi tap
     * @param {boolean} [options.isCombo=false] - Có phải là gói Combo VIP không
     * @returns {string} Chuỗi HTML component
     */
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
      
      const thumb = service.image || (isVipCombo 
        ? 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80'
        : 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80');

      return `
        <div class="md3-service-card service-chip ${isActive ? 'active' : ''} ${isVipCombo ? 'combo-vip-highlight combo-chip' : ''}" 
             id="serviceCard_${id}"
             onclick="${onClickHandler}">
          <img src="${thumb}" class="md3-service-card-thumb" alt="${name}" 
               onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&q=80';">
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

    /**
     * Render danh sách lưới các dịch vụ
     */
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

  window.ServiceCardWidget = ServiceCardWidget;

})(typeof window !== 'undefined' ? window : this);
