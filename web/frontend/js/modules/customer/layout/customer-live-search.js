// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE TÌM KIẾM TRỰC TIẾP LIVE SEARCH (CUSTOMER LIVE SEARCH)
// File: web/frontend/js/modules/customer/customer-live-search.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerLiveSearch = {
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
     * Xử lý tìm kiếm trực tiếp dịch vụ và sản phẩm, hiển thị popup dropdown
     * @param {string} query 
     */
    handleLiveSearch(query) {
      const dropdown = document.getElementById('webSearchDropdown');
      if (!dropdown) return;

      if (!query || query.trim().length < 1) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      const cleanQuery = query.trim();
      const results = (window.store && typeof window.store.searchServicesAndProducts === 'function')
        ? window.store.searchServicesAndProducts(cleanQuery)
        : { services: [], products: [] };

      const hasServices = results.services && results.services.length > 0;
      const hasProducts = results.products && results.products.length > 0;

      const escapeFn = (s) => (typeof this.escapeHtml === 'function' ? this.escapeHtml(s) : (window.CustomerWeb?.escapeHtml ? window.CustomerWeb.escapeHtml(s) : String(s ?? '')));

      if (!hasServices && !hasProducts) {
        dropdown.innerHTML = `
          <div style="padding: 16px; text-align: center; color: #888; font-size: 13px;">
            Không tìm thấy dịch vụ hoặc sản phẩm khớp với "<strong>${escapeFn(cleanQuery)}</strong>"
          </div>
        `;
        dropdown.classList.add('active');
        return;
      }

      let html = '';

      if (hasServices) {
        html += `<div class="search-result-group-title">Dịch Vụ &amp; Combo Trọn Gói (${results.services.length})</div>`;
        results.services.slice(0, 5).forEach(s => {
          const imgUrl = (typeof SalonUtils !== 'undefined' && SalonUtils.formatImageUrl)
            ? SalonUtils.formatImageUrl(s.image || (s.isCombo ? 'DichVu_Men/CBDV1.jpg' : 'DichVu_Men/DV1.jpg'))
            : (s.image || 'DichVu_Men/DV1.jpg');
          const priceText = (typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency)
            ? SalonUtils.formatCurrency(s.price)
            : (Number(s.price || 0).toLocaleString('vi-VN') + ' đ');

          html += `
            <div class="search-result-item" onclick="CustomerWeb.selectSearchResultService('${s.id}')">
              <img src="${imgUrl}" class="search-item-thumb" alt="${escapeFn(s.name)}" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=120&q=80');">
              <div class="search-item-info">
                <div class="search-item-name" title="${escapeFn(s.name)}">${escapeFn(s.name)}</div>
                <div class="search-item-meta">
                  <span class="search-item-price">${priceText}</span>
                  <span class="search-item-sub">• ${s.duration || 45} phút ${s.isCombo ? '• Combo' : ''}</span>
                </div>
              </div>
              <span class="search-item-action-tag">Đặt →</span>
            </div>
          `;
        });
      }

      if (hasProducts) {
        html += `<div class="search-result-group-title">Sản Phẩm Tóc Chính Hãng (${results.products.length})</div>`;
        results.products.slice(0, 6).forEach(p => {
          const pImg = (typeof SalonUtils !== 'undefined' && SalonUtils.formatImageUrl)
            ? SalonUtils.formatImageUrl(p.image || p.HinhAnh)
            : (p.image || p.HinhAnh);
          const priceText = (typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency)
            ? SalonUtils.formatCurrency(p.price)
            : (Number(p.price || 0).toLocaleString('vi-VN') + ' đ');

          html += `
            <div class="search-result-item" onclick="CustomerWeb.selectSearchResultProduct('${p.id}')">
              <img src="${pImg}" class="search-item-thumb" alt="${escapeFn(p.name)}" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=120&q=80');">
              <div class="search-item-info">
                <div class="search-item-name" title="${escapeFn(p.name)}">${escapeFn(p.name)}</div>
                <div class="search-item-meta">
                  <span class="search-item-price">${priceText}</span>
                  <span class="search-item-sub">• ${escapeFn(p.brand || 'CHÍNH HÃNG')}</span>
                </div>
              </div>
              <span class="search-item-action-tag">Xem →</span>
            </div>
          `;
        });
      }

      dropdown.innerHTML = html;
      dropdown.classList.add('active');
    },

    /**
     * Chọn dịch vụ từ kết quả tìm kiếm để mở modal đặt lịch
     * @param {string|number} serviceId 
     */
    selectSearchResultService(serviceId) {
      const dropdown = document.getElementById('webSearchDropdown');
      if (dropdown) dropdown.classList.remove('active');
      if (window.UICommon && typeof window.UICommon.openBookingModal === 'function') {
        window.UICommon.openBookingModal(serviceId);
      }
    },

    /**
     * Chọn sản phẩm từ kết quả tìm kiếm để mở modal chi tiết sản phẩm
     * @param {string|number} productId 
     */
    selectSearchResultProduct(productId) {
      const dropdown = document.getElementById('webSearchDropdown');
      if (dropdown) dropdown.classList.remove('active');
      if (window.UICommon && typeof window.UICommon.openProductDetailModal === 'function') {
        window.UICommon.openProductDetailModal(productId);
      }
    },

    /**
     * Mở trang / view chi tiết sản phẩm
     * @param {string|number} productId 
     */
    openProductDetail(productId) {
      const dropdown = document.getElementById('webSearchDropdown');
      if (dropdown) dropdown.classList.remove('active');
      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(`/product?id=${productId}`);
      } else {
        const main = document.getElementById('webMainContainer');
        if (main && window.ShopPage && typeof window.ShopPage.renderProductDetail === 'function') {
          window.ShopPage.renderProductDetail(main, productId);
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerLiveSearch = CustomerLiveSearch;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerLiveSearch);
  }

})(typeof window !== 'undefined' ? window : this);

