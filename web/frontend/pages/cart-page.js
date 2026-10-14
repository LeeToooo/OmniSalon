// =========================================================================
// OmniSalon — FULL CART PAGE COMPONENT (4RAU STYLE)
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md
// Route: /cart
// Bố cục 2 cột chuẩn 4RAU Store: Giỏ hàng + Gợi ý sản phẩm chính hãng + Tóm tắt đơn hàng
// =========================================================================

(function (window) {
  'use strict';

  const CartPage = {
    render(container) {
      if (!container) return;

      const cart = (window.store && typeof window.store.getCart === 'function')
        ? window.store.getCart()
        : [];
      const products = (window.store && typeof window.store.getProducts === 'function')
        ? window.store.getProducts()
        : [];

      const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
      const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);

      // Tính toán phí vận chuyển & voucher
      const shippingFee = (subtotal >= 500000 || subtotal === 0) ? 0 : 30000;
      let discountAmount = 0;
      let appliedVoucher = null;

      if (window.UICommon && window.UICommon.cartState) {
        discountAmount = window.UICommon.cartState.discountAmount || 0;
        appliedVoucher = window.UICommon.cartState.appliedVoucher || null;
      }

      const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);

      // Lấy 4 sản phẩm tạo kiểu & chăm sóc tóc nam chính hãng từ cơ sở dữ liệu thật (không mock, không túi đỏ)
      const recommendations = products
        .filter(p => !cart.some(c => c.productId === (p.id || p.MaSanPham)))
        .slice(0, 6);

      container.innerHTML = `
        <div class="cart-page-wrapper page-view page-enter">
          <div class="cart-page-container">
            <!-- Breadcrumb điều hướng -->
            <div class="cart-breadcrumb">
              <a href="/" onclick="event.preventDefault(); if(window.AppRouter) window.AppRouter.navigate('/');">Trang Chủ</a>
              <span class="bc-sep">/</span>
              <a href="/shop" onclick="event.preventDefault(); if(window.AppRouter) window.AppRouter.navigate('/shop');">Cửa Hàng</a>
              <span class="bc-sep">/</span>
              <span class="bc-current">Giỏ Hàng Của Bạn</span>
            </div>

            ${cart.length === 0 ? this._renderEmptyCart(recommendations) : this._renderCartContent(cart, subtotal, shippingFee, discountAmount, appliedVoucher, finalTotal, totalQty, recommendations)}
          </div>
        </div>
      `;

      this._bindEvents();
    },

    _renderEmptyCart(recommendations) {
      return `
        <div class="cart-empty-box">
          <div class="cart-empty-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h2 class="cart-empty-title">Giỏ hàng của bạn đang trống</h2>
          <p class="cart-empty-desc">Hãy khám phá bộ sưu tập Pomade, Clay, Sáp vuốt tóc nam và dầu gội chuyên nghiệp từ các thương hiệu hàng đầu thế giới tại Omni Salon.</p>
          <button type="button" class="cart-primary-action-btn" onclick="if(window.AppRouter) window.AppRouter.navigate('/shop');">
            ← Khám Phá Cửa Hàng Ngay
          </button>
        </div>

        ${recommendations.length > 0 ? `
          <div class="cart-recom-card" style="margin-top: 36px;">
            <div class="cart-card-header">
              <span class="cart-card-icon">💡</span>
              <h3 class="cart-card-title">Có thể bạn cũng thích</h3>
            </div>
            <div class="cart-recom-grid">
              ${recommendations.map(p => this._renderRecomItem(p)).join('')}
            </div>
          </div>
        ` : ''}
      `;
    },

    _renderCartContent(cart, subtotal, shippingFee, discountAmount, appliedVoucher, finalTotal, totalQty, recommendations) {
      return `
        <div class="cart-main-grid">
          <!-- CỘT TRÁI: DANH SÁCH SẢN PHẨM & GỢI Ý CÙNG THÍCH -->
          <div class="cart-left-col">
            <!-- 1. Bảng giỏ hàng -->
            <div class="cart-table-card">
              <div class="cart-card-header">
                <span class="cart-card-icon">🛒</span>
                <h3 class="cart-card-title">Giỏ hàng của bạn</h3>
                <span class="cart-items-count-badge">(${totalQty} sản phẩm)</span>
              </div>

              <div class="cart-table-body">
                ${cart.map(item => {
                  const prod = (window.store && typeof window.store.getProductById === 'function')
                    ? window.store.getProductById(item.productId)
                    : null;
                  const stock = prod?.stock || prod?.SoLuongTon || prod?.TonKho || 51;
                  const variant = prod?.dungTich || prod?.DungTich || prod?.unit || 'CÁI';

                  return `
                    <div class="cart-row-item" data-id="${item.productId}">
                      <!-- Packshot sản phẩm nền trắng chuẩn 4RAU Store -->
                      <div class="cart-row-packshot" onclick="if(window.AppRouter) window.AppRouter.navigate('/product?id=${item.productId}');" style="cursor: pointer;" title="Xem chi tiết ${item.name}">
                        <img src="${SalonUtils.formatImageUrl(item.image)}" 
                             alt="${item.name}" 
                             onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=200&q=80');">
                      </div>

                      <!-- Thông tin sản phẩm -->
                      <div class="cart-row-info">
                        <a href="/product?id=${item.productId}" class="cart-row-title" onclick="event.preventDefault(); if(window.AppRouter) window.AppRouter.navigate('/product?id=${item.productId}');">
                          ${item.name}
                        </a>
                        <div class="cart-row-variant">SIZE: ${variant.toUpperCase()}</div>
                        <div class="cart-row-unit-price">${SalonUtils.formatCurrency(item.price)}</div>
                      </div>

                      <!-- Stepper Số lượng & Tồn kho -->
                      <div class="cart-row-stepper-wrap">
                        <div class="cart-pill-stepper">
                          <button type="button" class="stepper-op-btn" onclick="CartPage.changeQty('${item.productId}', ${item.qty - 1})">-</button>
                          <span class="stepper-val">${item.qty}</span>
                          <button type="button" class="stepper-op-btn" onclick="CartPage.changeQty('${item.productId}', ${item.qty + 1})">+</button>
                        </div>
                        <div class="cart-row-stock">Còn: ${stock}</div>
                      </div>

                      <!-- Thành tiền & Nút Xoá -->
                      <div class="cart-row-total-wrap">
                        <div class="cart-row-line-price">${SalonUtils.formatCurrency(item.price * item.qty)}</div>
                        <button type="button" class="cart-row-delete-btn" onclick="CartPage.removeItem('${item.productId}', event)">
                          Xoá
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 2. Có thể bạn cũng thích (Gợi ý sản phẩm authentic từ database) -->
            ${recommendations.length > 0 ? `
              <div class="cart-recom-card">
                <div class="cart-card-header">
                  <span class="cart-card-icon">💡</span>
                  <h3 class="cart-card-title">Có thể bạn cũng thích</h3>
                </div>
                <div class="cart-recom-grid">
                  ${recommendations.map(p => this._renderRecomItem(p)).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- CỘT PHẢI: MÃ GIẢM GIÁ & TÓM TẮT ĐƠN HÀNG -->
          <div class="cart-right-col">
            <!-- 1. Mã giảm giá -->
            <div class="cart-coupon-card">
              <div class="cart-card-header">
                <span class="cart-card-icon">🎟️</span>
                <h3 class="cart-card-title">Mã giảm giá</h3>
              </div>

              ${appliedVoucher ? `
                <div class="cart-applied-voucher-badge">
                  <div class="voucher-info-left">
                    <span class="voucher-badge-code">[${window.UICommon.cartState.voucherCode}]</span>
                    <span class="voucher-badge-val">-${SalonUtils.formatCurrency(discountAmount)}</span>
                  </div>
                  <button type="button" class="voucher-remove-link" onclick="CartPage.removeVoucher()">Gỡ mã</button>
                </div>
              ` : `
                <div class="cart-coupon-form">
                  <input type="text" id="cartPageCouponInput" class="cart-coupon-input" placeholder="NHẬP MÃ GIẢM GIÁ..." uppercase>
                  <button type="button" class="cart-coupon-apply-btn" onclick="CartPage.applyVoucher()">
                    Áp dụng
                  </button>
                </div>
              `}
            </div>

            <!-- 2. Tóm tắt đơn hàng -->
            <div class="cart-summary-card">
              <h3 class="cart-summary-heading">Tóm tắt đơn hàng</h3>

              <div class="cart-summary-line">
                <span class="summary-label">Tạm tính (${totalQty} sản phẩm)</span>
                <span class="summary-val">${SalonUtils.formatCurrency(subtotal)}</span>
              </div>

              <div class="cart-summary-line">
                <span class="summary-label">Phí vận chuyển</span>
                <span class="summary-val">${shippingFee > 0 ? SalonUtils.formatCurrency(shippingFee) : '<span style="color:#10b981;font-weight:700;">Miễn phí</span>'}</span>
              </div>

              ${discountAmount > 0 ? `
                <div class="cart-summary-line discount-line">
                  <span class="summary-label">Giảm giá voucher</span>
                  <span class="summary-val">-${SalonUtils.formatCurrency(discountAmount)}</span>
                </div>
              ` : ''}

              <div class="cart-summary-divider"></div>

              <div class="cart-summary-line final-line">
                <span class="summary-label">Thành tiền</span>
                <span class="summary-val final-val">${SalonUtils.formatCurrency(finalTotal)}</span>
              </div>

              <!-- Nút tiến hành thanh toán -->
              <button type="button" class="cart-checkout-cta-btn" onclick="CartPage.proceedCheckout()">
                Tiến hành thanh toán →
              </button>

              <!-- Footer Links: Tiếp tục mua sắm & Xoá giỏ hàng -->
              <div class="cart-summary-footer-actions">
                <a href="/shop" class="cart-action-link" onclick="event.preventDefault(); if(window.AppRouter) window.AppRouter.navigate('/shop');">
                  ← Tiếp tục mua sắm
                </a>
                <button type="button" class="cart-action-link clear-cart-link" onclick="CartPage.clearAll()">
                  Xoá giỏ hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    _renderRecomItem(p) {
      const price = p.price || p.GiaBan || p.giaHienTai || 0;
      const img = SalonUtils.formatImageUrl(p.image || p.HinhAnh);
      const name = p.name || p.TenSanPham || 'Sản phẩm';

      return `
        <div class="cart-recom-item" onclick="if(window.AppRouter) window.AppRouter.navigate('/product?id=${p.id || p.MaSanPham}');">
          <div class="cart-recom-packshot">
            <img src="${img}" alt="${name}" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=200&q=80');">
          </div>
          <div class="cart-recom-name" title="${name}">${name}</div>
          <div class="cart-recom-price">${SalonUtils.formatCurrency(price)}</div>
        </div>
      `;
    },

    changeQty(productId, newQty) {
      if (window.UICommon && typeof window.UICommon.changeCartQty === 'function') {
        window.UICommon.changeCartQty(productId, newQty);
      } else if (window.store && typeof window.store.updateCartQty === 'function') {
        window.store.updateCartQty(productId, newQty);
      }
      this.refresh();
    },

    removeItem(productId, event) {
      if (event) event.stopPropagation();
      this.changeQty(productId, 0);
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast('Đã xóa sản phẩm khỏi giỏ hàng!');
      }
    },

    clearAll() {
      if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?')) return;
      if (window.store && typeof window.store.clearCart === 'function') {
        window.store.clearCart();
      }
      if (window.UICommon) {
        window.UICommon.updateCartBadges();
        window.UICommon.showToast('Đã xóa toàn bộ giỏ hàng!');
      }
      this.refresh();
    },

    applyVoucher() {
      const input = document.getElementById('cartPageCouponInput');
      const code = (input ? input.value : '').trim().toUpperCase();
      if (!code) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập mã giảm giá!', 'warning');
        return;
      }
      if (window.UICommon && typeof window.UICommon.applyCartVoucher === 'function') {
        window.UICommon.applyCartVoucher(code);
      }
      this.refresh();
    },

    removeVoucher() {
      if (window.UICommon && typeof window.UICommon.removeCartVoucher === 'function') {
        window.UICommon.removeCartVoucher();
      }
      this.refresh();
    },

    proceedCheckout() {
      const cart = (window.store && typeof window.store.getCart === 'function') ? window.store.getCart() : [];
      if (cart.length === 0) {
        if (window.UICommon) window.UICommon.showToast('Giỏ hàng trống!', 'warning');
        return;
      }
      // Mở Drawer Thanh toán trực quan hoặc quy trình Checkout của OmniSalon
      if (window.UICommon && typeof window.UICommon.openCartDrawer === 'function') {
        window.UICommon.openCartDrawer();
      }
    },

    refresh() {
      const container = document.getElementById('webMainContainer');
      if (container) {
        this.render(container);
      }
    },

    _bindEvents() {
      // Enter key for voucher input
      const input = document.getElementById('cartPageCouponInput');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.applyVoucher();
          }
        });
      }
    }
  };

  window.CartPage = CartPage;
})(window);
