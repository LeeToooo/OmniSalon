(function (window) {
  'use strict';

  const CustomerCartPopup = {
    _cartPopupTimer: null,

    /**
     * Render HTML danh sách sản phẩm trong Mini Cart Dropdown ở Header
     */
    renderMiniCartDropdownHTML() {
      const cart = (window.store && typeof window.store.getCart === 'function') ? window.store.getCart() : [];
      const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);

      if (cart.length === 0) {
        return `
          <div class="mini-cart-empty">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-bottom: 8px;">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Giỏ hàng của bạn đang trống</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Hãy chọn các sản phẩm chăm sóc tóc &amp; sáp vuốt cao cấp!</div>
            <button type="button" class="mini-cart-explore-btn" onclick="CustomerWeb.closeCartPopup(); CustomerWeb.switchTab('shop');">
              Khám Phá Cửa Hàng
            </button>
          </div>
        `;
      }

      return `
        <div class="mini-cart-items-list">
          ${cart.map(item => `
            <div class="mini-cart-item" data-product-id="${item.productId}">
              <!-- Packshot nền trắng tinh tế chuẩn Image 2 -->
              <div class="mini-cart-img-wrap" onclick="CustomerWeb.closeCartPopup(); if(window.AppRouter) window.AppRouter.navigate('/product?id=${item.productId}');" style="cursor: pointer;" title="${item.name}">
                <img src="${typeof SalonUtils !== 'undefined' && SalonUtils.formatImageUrl ? SalonUtils.formatImageUrl(item.image) : item.image}" 
                     alt="${item.name}" 
                     class="mini-cart-img"
                     onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=200&q=80');">
                <span class="mini-cart-item-qty-badge" title="Đã có trong giỏ">${item.qty > 1 ? item.qty : '!'}</span>
              </div>
              <div class="mini-cart-item-info">
                <div class="mini-cart-item-name" title="${item.name}" onclick="CustomerWeb.closeCartPopup(); if(window.AppRouter) window.AppRouter.navigate('/product?id=${item.productId}');" style="cursor: pointer;">${item.name}</div>
                <div class="mini-cart-item-meta">${(item.brand || 'OMNI SALON').toUpperCase()}</div>
                <div class="mini-cart-item-price">${typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency ? SalonUtils.formatCurrency(item.price) : (Number(item.price || 0).toLocaleString('vi-VN') + ' đ')}</div>
              </div>
              <button type="button" class="mini-cart-trash-btn" onclick="CustomerWeb.removeMiniCartItem('${item.productId}', event)" title="Xóa khỏi giỏ hàng" aria-label="Xóa">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>

        <div class="mini-cart-divider"></div>

        <div class="mini-cart-summary-row">
          <span class="mini-cart-summary-label">Tổng :</span>
          <span class="mini-cart-summary-total">${typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency ? SalonUtils.formatCurrency(subtotal) : (Number(subtotal || 0).toLocaleString('vi-VN') + ' đ')}</span>
        </div>

        <!-- Nut Xem Gio Hang chuyen thang sang trang gio hang chi tiet -->
        <button type="button" class="mini-cart-cta-btn" onclick="CustomerWeb.closeCartPopup(); if(window.AppRouter) window.AppRouter.navigate('/cart'); else if(window.CustomerWeb) window.CustomerWeb.switchTab('cart');">
          Xem Giỏ Hàng
        </button>
      `;
    },

    /**
     * Điều hướng trực tiếp đến trang giỏ hàng riêng biệt
     * @param {Event} event 
     */
    goToCartPage(event) {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof this.closeCartPopup === 'function') {
        this.closeCartPopup();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.closeCartPopup === 'function') {
        window.CustomerWeb.closeCartPopup();
      }

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate('/cart');
      } else {
        if (typeof this.switchTab === 'function') {
          this.switchTab('cart');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
          window.CustomerWeb.switchTab('cart');
        }
      }
    },

    /**
     * Đóng / mở popup mini cart khi click vào icon giỏ hàng
     * @param {Event} event 
     */
    toggleCartPopup(event) {
      if (event) event.stopPropagation();
      const dropdown = document.getElementById('headerCartDropdown');
      if (dropdown) {
        if (dropdown.classList.contains('open')) {
          if (typeof this.closeCartPopup === 'function') {
            this.closeCartPopup();
          } else if (window.CustomerWeb && typeof window.CustomerWeb.closeCartPopup === 'function') {
            window.CustomerWeb.closeCartPopup();
          }
        } else {
          if (typeof this.openCartPopup === 'function') {
            this.openCartPopup();
          } else if (window.CustomerWeb && typeof window.CustomerWeb.openCartPopup === 'function') {
            window.CustomerWeb.openCartPopup();
          }
        }
      }
    },

    /**
     * Mở popup giỏ hàng
     */
    openCartPopup() {
      const dropdown = document.getElementById('headerCartDropdown');
      const wrapper = document.getElementById('headerCartWrapper');
      if (dropdown) {
        const renderMiniCartFn = (typeof this.renderMiniCartDropdownHTML === 'function')
          ? this.renderMiniCartDropdownHTML.bind(this)
          : (window.CustomerWeb && typeof window.CustomerWeb.renderMiniCartDropdownHTML === 'function'
              ? window.CustomerWeb.renderMiniCartDropdownHTML.bind(window.CustomerWeb)
              : null);
        if (renderMiniCartFn) {
          dropdown.innerHTML = renderMiniCartFn();
        }
        dropdown.classList.add('open');
        if (wrapper) wrapper.classList.add('open');

        if (typeof this.closeUserMenu === 'function') {
          this.closeUserMenu();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.closeUserMenu === 'function') {
          window.CustomerWeb.closeUserMenu();
        }
      }
    },

    /**
     * Đóng popup giỏ hàng
     */
    closeCartPopup() {
      const dropdown = document.getElementById('headerCartDropdown');
      const wrapper = document.getElementById('headerCartWrapper');
      if (dropdown) dropdown.classList.remove('open');
      if (wrapper) wrapper.classList.remove('open');
    },

    /**
     * Xử lý rê chuột vào nút giỏ hàng để hiển thị preview
     */
    handleCartMouseEnter() {
      const currentTab = this.currentTab !== undefined ? this.currentTab : window.CustomerWeb?.currentTab;
      if (currentTab === 'cart' || (typeof window !== 'undefined' && window.location.pathname === '/cart') || (typeof window !== 'undefined' && (window.location.hash || '').includes('cart'))) {
        return;
      }
      clearTimeout(this._cartPopupTimer || window.CustomerWeb?._cartPopupTimer);
      if (typeof this.openCartPopup === 'function') {
        this.openCartPopup();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.openCartPopup === 'function') {
        window.CustomerWeb.openCartPopup();
      }
    },

    /**
     * Xử lý rời chuột khỏi nút giỏ hàng (có delay 300ms)
     */
    handleCartMouseLeave() {
      clearTimeout(this._cartPopupTimer || window.CustomerWeb?._cartPopupTimer);
      this._cartPopupTimer = setTimeout(() => {
        if (typeof this.closeCartPopup === 'function') {
          this.closeCartPopup();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.closeCartPopup === 'function') {
          window.CustomerWeb.closeCartPopup();
        }
      }, 300);
      if (window.CustomerWeb) {
        window.CustomerWeb._cartPopupTimer = this._cartPopupTimer;
      }
    },

    /**
     * Xóa một sản phẩm khỏi giỏ hàng từ mini cart
     * @param {string|number} productId 
     * @param {Event} event 
     */
    removeMiniCartItem(productId, event) {
      if (event) event.stopPropagation();
      if (window.UICommon && typeof window.UICommon.changeCartQty === 'function') {
        window.UICommon.changeCartQty(productId, 0);
      } else if (window.store && typeof window.store.updateCartQty === 'function') {
        window.store.updateCartQty(productId, 0);
        if (typeof this.updateCartBadge === 'function') {
          this.updateCartBadge();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.updateCartBadge === 'function') {
          window.CustomerWeb.updateCartBadge();
        }
      }
      const dropdown = document.getElementById('headerCartDropdown');
      if (dropdown) {
        const renderMiniCartFn = (typeof this.renderMiniCartDropdownHTML === 'function')
          ? this.renderMiniCartDropdownHTML.bind(this)
          : (window.CustomerWeb && typeof window.CustomerWeb.renderMiniCartDropdownHTML === 'function'
              ? window.CustomerWeb.renderMiniCartDropdownHTML.bind(window.CustomerWeb)
              : null);
        if (renderMiniCartFn) {
          dropdown.innerHTML = renderMiniCartFn();
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerCartPopup = CustomerCartPopup;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerCartPopup);
  }

})(typeof window !== 'undefined' ? window : this);

