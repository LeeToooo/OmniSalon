// =========================================================================
// OmniSalon: FULL CART PAGE VA QUY TRINH CHECKOUT TUNG BUOC
// Phong cách tạp chí Editorial • Tông màu ấm • Typography Playfair Display
// Route: /cart
// =========================================================================

(function (window) {
  'use strict';

  const CartPage = {
    currentStep: 1, // 1: Gio hang, 2: Giao hang, 3: Thanh toan, 4: Hoan tat
    checkoutData: {
      deliveryType: 'PICKUP_BRANCH',
      pickupBranchId: 'br-dbp',
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      paymentMethod: 'COD',
      notes: '',
      completedOrder: null
    },

    setStep(step) {
      this.currentStep = step;
      this.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

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

      // Tinh phi van chuyen va voucher
      const isDelivery = this.checkoutData.deliveryType === 'DELIVERY';
      const shippingFee = (subtotal >= 500000 || subtotal === 0 || !isDelivery) ? 0 : 30000;
      let discountAmount = 0;
      let appliedVoucher = null;

      if (window.UICommon && window.UICommon.cartState) {
        discountAmount = window.UICommon.cartState.discountAmount || 0;
        appliedVoucher = window.UICommon.cartState.appliedVoucher || null;
      }

      const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);

      const recommendations = products
        .filter(p => !cart.some(c => c.productId === (p.id || p.MaSanPham)))
        .slice(0, 6);

      // Khoi tao du lieu nguoi nhan neu chua co
      const user = (window.store && typeof window.store.getCurrentUser === 'function') ? window.store.getCurrentUser() : null;
      if (user && !this.checkoutData.recipientName) {
        this.checkoutData.recipientName = user.fullName || user.name || '';
        this.checkoutData.recipientPhone = user.phone || '';
      }

      container.innerHTML = `
        <div class="cart-page-wrapper page-view page-enter" style="background-color: var(--bg-primary); padding: 48px 0 88px;">
          <div class="cart-page-container" style="max-width: 1440px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
            <!-- Breadcrumb dieu huong -->
            <div class="cart-breadcrumb" style="margin-bottom: 24px;">
              <a href="/" onclick="event.preventDefault(); if(window.AppRouter) window.AppRouter.navigate('/');">Trang Chủ</a>
              <span class="bc-sep">/</span>
              <a href="/shop" onclick="event.preventDefault(); if(window.AppRouter) window.AppRouter.navigate('/shop');">Mỹ Phẩm</a>
              <span class="bc-sep">/</span>
              <span class="bc-current" style="color: #C59B27; font-weight: 700;">${this._getStepTitle()}</span>
            </div>

            <!-- Thanh tien trinh tung buoc thanh toan -->
            <div class="cart-stepper-flow" style="margin-bottom: 36px;">
              <div class="cart-flow-step ${this.currentStep >= 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}" onclick="CartPage.setStep(1)">
                <span class="step-circle" style="${this.currentStep >= 1 ? 'background: #C59B27; color: #141413; border-color: #C59B27;' : ''}">${this.currentStep > 1 ? '✓' : '1'}</span>
                <span class="step-text" style="${this.currentStep === 1 ? 'color: #C59B27; font-weight: 800;' : ''}">Giỏ Hàng</span>
              </div>
              <div class="step-connector ${this.currentStep > 1 ? 'filled' : ''}" style="${this.currentStep > 1 ? 'background: #C59B27;' : ''}"></div>
              <div class="cart-flow-step ${this.currentStep >= 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}" onclick="${this.currentStep >= 2 ? 'CartPage.setStep(2)' : ''}">
                <span class="step-circle" style="${this.currentStep >= 2 ? 'background: #C59B27; color: #141413; border-color: #C59B27;' : ''}">${this.currentStep > 2 ? '✓' : '2'}</span>
                <span class="step-text" style="${this.currentStep === 2 ? 'color: #C59B27; font-weight: 800;' : ''}">Giao Hàng</span>
              </div>
              <div class="step-connector ${this.currentStep > 2 ? 'filled' : ''}" style="${this.currentStep > 2 ? 'background: #C59B27;' : ''}"></div>
              <div class="cart-flow-step ${this.currentStep >= 3 ? 'active' : ''} ${this.currentStep > 3 ? 'completed' : ''}" onclick="${this.currentStep >= 3 ? 'CartPage.setStep(3)' : ''}">
                <span class="step-circle" style="${this.currentStep >= 3 ? 'background: #C59B27; color: #141413; border-color: #C59B27;' : ''}">${this.currentStep > 3 ? '✓' : '3'}</span>
                <span class="step-text" style="${this.currentStep === 3 ? 'color: #C59B27; font-weight: 800;' : ''}">Thanh Toán</span>
              </div>
              <div class="step-connector ${this.currentStep > 3 ? 'filled' : ''}" style="${this.currentStep > 3 ? 'background: #C59B27;' : ''}"></div>
              <div class="cart-flow-step ${this.currentStep === 4 ? 'active completed' : ''}">
                <span class="step-circle" style="${this.currentStep === 4 ? 'background: #C59B27; color: #141413; border-color: #C59B27;' : ''}">${this.currentStep === 4 ? '✓' : '4'}</span>
                <span class="step-text" style="${this.currentStep === 4 ? 'color: #C59B27; font-weight: 800;' : ''}">Hoàn Tất</span>
              </div>
            </div>

            ${cart.length === 0 && this.currentStep !== 4
          ? this._renderEmptyCart(recommendations)
          : (this.currentStep === 1
            ? this._renderCartContent(cart, subtotal, shippingFee, discountAmount, appliedVoucher, finalTotal, totalQty, recommendations)
            : (this.currentStep === 2
              ? this._renderShippingStep(cart, subtotal, shippingFee, discountAmount, finalTotal, totalQty)
              : (this.currentStep === 3
                ? this._renderPaymentStep(cart, subtotal, shippingFee, discountAmount, finalTotal, totalQty)
                : this._renderOrderSuccessStep())))}
          </div>
        </div>
      `;

      this._bindEvents();
    },

    _getStepTitle() {
      if (this.currentStep === 1) return 'Giỏ Hàng Của Bạn';
      if (this.currentStep === 2) return 'Thông Tin Giao Hàng';
      if (this.currentStep === 3) return 'Phương Thức Thanh Toán';
      return 'Xác Nhận Đơn Hàng Thành Công';
    },

    _renderEmptyCart(recommendations) {
      return `
        <div class="cart-empty-box" style="border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-card); padding: 48px 24px; text-align: center;">
          <div class="cart-empty-icon-wrap" style="color: #C59B27; margin-bottom: 16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h2 class="cart-empty-title font-serif tracking-tight leading-tight" style="font-size: 26px; font-weight: 700; color: var(--text-primary); margin: 0 0 10px;">Giỏ hàng của bạn đang trống</h2>
          <p class="cart-empty-desc" style="font-size: 14.5px; color: var(--text-secondary); max-width: 540px; margin: 0 auto 24px; line-height: 1.6;">Khám phá bộ sưu tập Pomade, Clay, Sáp vuốt tóc và các sản phẩm grooming nam chính hãng tại Omni Salon.</p>
          <button type="button" class="cart-primary-action-btn" onclick="if(window.AppRouter) window.AppRouter.navigate('/shop');"
                  style="border-radius: 6px; background: #141413; border: 1px solid #141413; color: #FAF8F5; font-size: 14px; font-weight: 700; padding: 12px 24px; cursor: pointer;">
            ← Khám Phá Cửa Hàng Ngay
          </button>
        </div>

        ${recommendations.length > 0 ? `
          <div class="cart-recom-card" style="margin-top: 36px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-card);">
            <div class="cart-card-header" style="border-bottom: 1px solid var(--border-color); padding: 16px 20px;">
              <span class="cart-card-icon">💡</span>
              <h3 class="cart-card-title font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0;">Sản phẩm gợi ý cho bạn</h3>
            </div>
            <div class="cart-recom-grid" style="padding: 20px;">
              ${recommendations.map(p => this._renderRecomItem(p)).join('')}
            </div>
          </div>
        ` : ''}
      `;
    },

    // BUOC 1: GIO HANG CHI TIET
    _renderCartContent(cart, subtotal, shippingFee, discountAmount, appliedVoucher, finalTotal, totalQty, recommendations) {
      return `
        <div class="cart-main-grid">
          <!-- Cot trai: Danh sach san pham va goi y -->
          <div class="cart-left-col">
            <div class="cart-table-card">
              <div class="cart-card-header">
                <span class="cart-card-icon">🛒</span>
                <h3 class="cart-card-title font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0;">Giỏ hàng của bạn</h3>
                <span class="cart-items-count-badge" style="background: rgba(197, 155, 39, 0.15); color: #C59B27; border: 1px solid rgba(197, 155, 39, 0.3);">${totalQty} sản phẩm</span>
              </div>

              <div class="cart-table-body">
                ${cart.map(item => {
        const prod = (window.store && typeof window.store.getProductById === 'function')
          ? window.store.getProductById(item.productId)
          : null;
        const stock = prod?.stock || prod?.SoLuongTon || prod?.TonKho || 25;
        const variant = prod?.dungTich || prod?.DungTich || prod?.unit || 'Hộp';

        return `
                    <div class="cart-row-item" data-id="${item.productId}">
                      <div class="cart-row-packshot" onclick="if(window.AppRouter) window.AppRouter.navigate('/product?id=${item.productId}');" style="cursor: pointer;" title="Xem chi tiết ${item.name}">
                        <img src="${SalonUtils.formatImageUrl(item.image)}" 
                             alt="${item.name}" 
                             onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=200&q=80');">
                      </div>

                      <div class="cart-row-info">
                        <a href="/product?id=${item.productId}" class="cart-row-title font-serif tracking-tight leading-tight" style="font-size: 15px; font-weight: 700;" onclick="event.preventDefault(); if(window.AppRouter) window.AppRouter.navigate('/product?id=${item.productId}');">
                          ${item.name}
                        </a>
                        <div class="cart-row-variant">Dung tích: ${variant}</div>
                        <div class="cart-row-unit-price">${SalonUtils.formatCurrency(item.price)}</div>
                      </div>

                      <div class="cart-row-stepper-wrap">
                        <div class="cart-pill-stepper">
                          <button type="button" class="stepper-op-btn" onclick="CartPage.changeQty('${item.productId}', ${item.qty - 1})">-</button>
                          <span class="stepper-val">${item.qty}</span>
                          <button type="button" class="stepper-op-btn" onclick="CartPage.changeQty('${item.productId}', ${item.qty + 1})">+</button>
                        </div>
                        <div class="cart-row-stock">Còn: ${stock}</div>
                      </div>

                      <div class="cart-row-total-wrap">
                        <div class="cart-row-line-price" style="color: #C59B27; font-weight: 800;">${SalonUtils.formatCurrency(item.price * item.qty)}</div>
                        <button type="button" class="cart-row-delete-btn" onclick="CartPage.removeItem('${item.productId}', event)">
                          Xoá
                        </button>
                      </div>
                    </div>
                  `;
      }).join('')}
              </div>
            </div>

            ${recommendations.length > 0 ? `
              <div class="cart-recom-card">
                <div class="cart-card-header">
                  <span class="cart-card-icon">💡</span>
                  <h3 class="cart-card-title font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0;">Có thể bạn cũng thích</h3>
                </div>
                <div class="cart-recom-grid">
                  ${recommendations.map(p => this._renderRecomItem(p)).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Cot phai: Ma giam gia va tom tat don hang -->
          <div class="cart-right-col">
            <div class="cart-coupon-card">
              <div class="cart-card-header">
                <span class="cart-card-icon">🎟️</span>
                <h3 class="cart-card-title font-serif tracking-tight leading-tight" style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0;">Mã giảm giá</h3>
              </div>

              ${appliedVoucher ? `
                <div class="cart-applied-voucher-badge">
                  <div class="voucher-info-left">
                    <span class="voucher-badge-code">${window.UICommon.cartState.voucherCode}</span>
                    <span class="voucher-badge-val">-${SalonUtils.formatCurrency(discountAmount)}</span>
                  </div>
                  <button type="button" class="voucher-remove-link" onclick="CartPage.removeVoucher()">Gỡ mã</button>
                </div>
              ` : `
                <div class="cart-coupon-form">
                  <input type="text" id="cartPageCouponInput" class="cart-coupon-input" placeholder="NHẬP MÃ GIẢM GIÁ...">
                  <button type="button" class="cart-coupon-apply-btn" onclick="CartPage.applyVoucher()">
                    Áp dụng
                  </button>
                </div>
              `}
            </div>

            <div class="cart-summary-card">
              <h3 class="cart-summary-heading font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 16px;">Tóm tắt đơn hàng</h3>

              <div class="cart-summary-line">
                <span class="summary-label">Tạm tính ${totalQty} sản phẩm</span>
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
                <span class="summary-val final-val" style="color: #C59B27; font-weight: 800;">${SalonUtils.formatCurrency(finalTotal)}</span>
              </div>

              <!-- Nut chuyen sang buoc tiep theo: Giao hang -->
              <button type="button" class="cart-checkout-cta-btn" onclick="CartPage.setStep(2)"
                      style="border-radius: 6px; background: #141413; border: 1px solid #141413; color: #FAF8F5; font-size: 14.5px; font-weight: 700; height: 46px; cursor: pointer;">
                Tiến hành thanh toán →
              </button>

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

    // BUOC 2: THONG TIN GIAO HANG
    _renderShippingStep(cart, subtotal, shippingFee, discountAmount, finalTotal, totalQty) {
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];

      return `
        <div class="cart-main-grid">
          <div class="cart-left-col">
            <div class="cart-table-card">
              <div class="cart-card-header">
                <span class="cart-card-icon">📍</span>
                <h3 class="cart-card-title font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0;">Hình thức nhận hàng</h3>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div class="checkout-method-card ${this.checkoutData.deliveryType === 'PICKUP_BRANCH' ? 'selected' : ''}" 
                     onclick="CartPage.setDeliveryType('PICKUP_BRANCH')">
                  <input type="radio" name="delType" class="checkout-method-radio" ${this.checkoutData.deliveryType === 'PICKUP_BRANCH' ? 'checked' : ''}>
                  <div class="checkout-method-info">
                    <div class="checkout-method-name">Nhận tại Salon</div>
                    <div class="checkout-method-desc">Giữ hàng miễn phí trong 48h</div>
                  </div>
                </div>

                <div class="checkout-method-card ${this.checkoutData.deliveryType === 'DELIVERY' ? 'selected' : ''}" 
                     onclick="CartPage.setDeliveryType('DELIVERY')">
                  <input type="radio" name="delType" class="checkout-method-radio" ${this.checkoutData.deliveryType === 'DELIVERY' ? 'checked' : ''}>
                  <div class="checkout-method-info">
                    <div class="checkout-method-name">Giao hàng tận nơi</div>
                    <div class="checkout-method-desc">Ship COD toàn quốc 30k</div>
                  </div>
                </div>
              </div>

              ${this.checkoutData.deliveryType === 'PICKUP_BRANCH' ? `
                <div style="margin-bottom: 16px;">
                  <label class="sub-label">Chọn chi nhánh Omni Salon đến nhận:</label>
                  <select class="form-control-custom" id="stepBranchSelect" onchange="CartPage.checkoutData.pickupBranchId = this.value">
                    ${branches.map(b => `<option value="${b.id}" ${b.id === this.checkoutData.pickupBranchId ? 'selected' : ''}>${b.name} - ${b.address}</option>`).join('')}
                  </select>
                </div>
              ` : `
                <div style="margin-bottom: 16px;">
                  <label class="sub-label">Địa chỉ nhận hàng chi tiết:</label>
                  <input type="text" id="stepAddressInput" class="form-control-custom" 
                         placeholder="Số nhà, tên đường, phường xã, quận huyện, tỉnh thành..." 
                         value="${this.checkoutData.recipientAddress || ''}"
                         oninput="CartPage.checkoutData.recipientAddress = this.value" required>
                </div>
              `}

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
                <div>
                  <label class="sub-label">Họ và tên người nhận:</label>
                  <input type="text" id="stepNameInput" class="form-control-custom" 
                         placeholder="Ví dụ: Nguyễn Văn A" 
                         value="${this.checkoutData.recipientName || ''}"
                         oninput="CartPage.checkoutData.recipientName = this.value" required>
                </div>
                <div>
                  <label class="sub-label">Số điện thoại liên hệ:</label>
                  <input type="tel" id="stepPhoneInput" class="form-control-custom" 
                         placeholder="Ví dụ: 0908123456" 
                         value="${this.checkoutData.recipientPhone || ''}"
                         oninput="CartPage.checkoutData.recipientPhone = this.value" required>
                </div>
              </div>

              <div>
                <label class="sub-label">Ghi chú đơn hàng nếu có:</label>
                <input type="text" id="stepNotesInput" class="form-control-custom" 
                       placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi đến..." 
                       value="${this.checkoutData.notes || ''}"
                       oninput="CartPage.checkoutData.notes = this.value">
              </div>

              <div class="checkout-nav-row">
                <button type="button" class="checkout-back-btn" onclick="CartPage.setStep(1)">
                  ← Quay lại giỏ hàng
                </button>
                <button type="button" class="checkout-next-btn" onclick="CartPage.validateAndProceedToPayment()">
                  Tiếp tục: Chọn thanh toán →
                </button>
              </div>
            </div>
          </div>

          <div class="cart-right-col">
            <div class="cart-summary-card">
              <h3 class="cart-summary-heading">Đơn hàng ${totalQty} món</h3>
              <div class="cart-summary-line">
                <span class="summary-label">Tạm tính</span>
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
            </div>
          </div>
        </div>
      `;
    },

    setDeliveryType(type) {
      this.checkoutData.deliveryType = type;
      this.refresh();
    },

    validateAndProceedToPayment() {
      const name = (this.checkoutData.recipientName || '').trim();
      const phone = (this.checkoutData.recipientPhone || '').trim();
      if (!name) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập họ tên người nhận!', 'warning');
        return;
      }
      if (!phone || phone.length < 9) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập số điện thoại hợp lệ!', 'warning');
        return;
      }
      if (this.checkoutData.deliveryType === 'DELIVERY' && !(this.checkoutData.recipientAddress || '').trim()) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập địa chỉ nhận hàng chi tiết!', 'warning');
        return;
      }
      this.setStep(3);
    },

    // BUOC 3: PHUONG THUC THANH TOAN
    _renderPaymentStep(cart, subtotal, shippingFee, discountAmount, finalTotal, totalQty) {
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const branch = branches.find(b => b.id === this.checkoutData.pickupBranchId) || branches[0];

      return `
        <div class="cart-main-grid">
          <div class="cart-left-col">
            <div class="cart-table-card">
              <div class="cart-card-header">
                <span class="cart-card-icon">💳</span>
                <h3 class="cart-card-title">Chọn phương thức thanh toán</h3>
              </div>

              <!-- Cac phuong thuc thanh toan -->
              <div class="checkout-method-card ${this.checkoutData.paymentMethod === 'COD' ? 'selected' : ''}" 
                   onclick="CartPage.setPaymentMethod('COD')">
                <input type="radio" name="payMethod" class="checkout-method-radio" ${this.checkoutData.paymentMethod === 'COD' ? 'checked' : ''}>
                <div class="checkout-method-icon">💵</div>
                <div class="checkout-method-info">
                  <div class="checkout-method-name">${this.checkoutData.deliveryType === 'PICKUP_BRANCH' ? 'Thanh toán tiền mặt tại quầy' : 'Thanh toán khi nhận hàng COD'}</div>
                  <div class="checkout-method-desc">Kiểm tra sản phẩm và thanh toán trực tiếp khi nhận hàng</div>
                </div>
              </div>

              <div class="checkout-method-card ${this.checkoutData.paymentMethod === 'VIETQR' ? 'selected' : ''}" 
                   onclick="CartPage.setPaymentMethod('VIETQR')">
                <input type="radio" name="payMethod" class="checkout-method-radio" ${this.checkoutData.paymentMethod === 'VIETQR' ? 'checked' : ''}>
                <div class="checkout-method-icon">🏦</div>
                <div class="checkout-method-info">
                  <div class="checkout-method-name">Chuyển khoản VietQR Ngân Hàng</div>
                  <div class="checkout-method-desc">Quét mã QR thanh toán nhanh qua ứng dụng mọi ngân hàng</div>
                </div>
              </div>

              <div class="checkout-method-card ${this.checkoutData.paymentMethod === 'MOMO' ? 'selected' : ''}" 
                   onclick="CartPage.setPaymentMethod('MOMO')">
                <input type="radio" name="payMethod" class="checkout-method-radio" ${this.checkoutData.paymentMethod === 'MOMO' ? 'checked' : ''}>
                <div class="checkout-method-icon">📱</div>
                <div class="checkout-method-info">
                  <div class="checkout-method-name">Ví điện tử MoMo hoặc ZaloPay</div>
                  <div class="checkout-method-desc">Thanh toán qua ví điện tử tiện lợi và an toàn</div>
                </div>
              </div>

              <!-- Thong tin nguoi nhan tong hop -->
              <div style="margin-top: 24px; padding: 16px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.08); font-size: 13.5px; line-height: 1.6;">
                <div style="font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">Thông tin nhận hàng:</div>
                <div><strong style="color: #94A3B8;">Khách hàng:</strong> ${this.escapeHtml(this.checkoutData.recipientName)} - ${this.escapeHtml(this.checkoutData.recipientPhone)}</div>
                <div><strong style="color: #94A3B8;">Hình thức:</strong> ${this.checkoutData.deliveryType === 'PICKUP_BRANCH' ? `Nhận tại salon: ${branch ? branch.name : 'Omni Salon'}` : `Giao tận nơi: ${this.escapeHtml(this.checkoutData.recipientAddress)}`}</div>
                ${this.checkoutData.notes ? `<div><strong style="color: #94A3B8;">Ghi chú:</strong> ${this.escapeHtml(this.checkoutData.notes)}</div>` : ''}
              </div>

              <div class="checkout-nav-row">
                <button type="button" class="checkout-back-btn" onclick="CartPage.setStep(2)">
                  ← Quay lại giao hàng
                </button>
                <button type="button" class="checkout-next-btn" onclick="CartPage.confirmOrder(${finalTotal})">
                  Xác Nhận Đặt Hàng ${SalonUtils.formatCurrency(finalTotal)} →
                </button>
              </div>
            </div>
          </div>

          <div class="cart-right-col">
            <div class="cart-summary-card">
              <h3 class="cart-summary-heading">Chi tiết thanh toán</h3>
              <div class="cart-summary-line">
                <span class="summary-label">Tạm tính ${totalQty} món</span>
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
                <span class="summary-label">Tổng thanh toán</span>
                <span class="summary-val final-val">${SalonUtils.formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    setPaymentMethod(method) {
      this.checkoutData.paymentMethod = method;
      this.refresh();
    },

    confirmOrder(finalTotal) {
      const cart = (window.store && typeof window.store.getCart === 'function') ? window.store.getCart() : [];
      if (cart.length === 0) {
        if (window.UICommon) window.UICommon.showToast('Giỏ hàng trống!', 'warning');
        return;
      }

      const orderData = {
        deliveryType: this.checkoutData.deliveryType,
        branchId: this.checkoutData.pickupBranchId,
        customerName: this.checkoutData.recipientName,
        customerPhone: this.checkoutData.recipientPhone,
        shippingAddress: this.checkoutData.deliveryType === 'PICKUP_BRANCH' ? 'Nhận tại quầy chi nhánh' : this.checkoutData.recipientAddress,
        paymentMethod: this.checkoutData.paymentMethod,
        items: cart,
        totalAmount: finalTotal,
        notes: this.checkoutData.notes
      };

      let newOrder = null;
      if (window.store && typeof window.store.createOrder === 'function') {
        newOrder = window.store.createOrder(orderData);
      }

      if (!newOrder) {
        newOrder = {
          id: 'ORD-' + Date.now().toString(36).toUpperCase(),
          totalAmount: finalTotal,
          items: cart
        };
      }

      this.checkoutData.completedOrder = newOrder;

      // Xoa sach gio hang sau khi dat don
      if (window.store && typeof window.store.clearCart === 'function') {
        window.store.clearCart();
      }
      if (window.UICommon) {
        window.UICommon.updateCartBadges();
      }

      this.setStep(4);
    },

    // BUOC 4: HOAN TAT DON HANG
    _renderOrderSuccessStep() {
      const order = this.checkoutData.completedOrder || {};
      const orderCode = order.id || order.orderCode || 'ORD-OMNI';
      const isVietQr = this.checkoutData.paymentMethod === 'VIETQR';
      const finalAmount = order.totalAmount || 0;
      const vietQrUrl = `https://img.vietqr.io/image/970422-0908123456-compact2.png?amount=${finalAmount}&addInfo=OMNI%20${orderCode}&accountName=OMNI%20SALON%20VIETNAM`;

      return `
        <div style="max-width: 640px; margin: 0 auto; background: var(--surface-card, #13161F); border: 1px solid var(--border-color, rgba(255,255,255,0.08)); border-radius: 16px; padding: 36px 24px; text-align: center;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #10B981; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px;">
            ✓
          </div>

          <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #FFFFFF;">Đặt Hàng Thành Công!</h2>
          <p style="font-size: 13.5px; color: #94A3B8; margin: 0 0 20px;">Cảm ơn quý khách đã tin dùng sản phẩm chăm sóc tóc nam chính hãng tại Omni Salon.</p>

          <div style="background: rgba(255, 255, 255, 0.04); border-radius: 10px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 13.5px; line-height: 1.8;">
            <div><strong style="color: #94A3B8;">Mã đơn hàng:</strong> <span style="color: #F59E0B; font-weight: 800; font-family: monospace;">#${orderCode}</span></div>
            <div><strong style="color: #94A3B8;">Người nhận:</strong> ${this.escapeHtml(this.checkoutData.recipientName)} (${this.escapeHtml(this.checkoutData.recipientPhone)})</div>
            <div><strong style="color: #94A3B8;">Hình thức:</strong> ${this.checkoutData.deliveryType === 'PICKUP_BRANCH' ? 'Nhận hàng tại chi nhánh salon' : `Giao tận nơi: ${this.escapeHtml(this.checkoutData.recipientAddress)}`}</div>
            <div><strong style="color: #94A3B8;">Phương thức:</strong> ${this.checkoutData.paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : (this.checkoutData.paymentMethod === 'MOMO' ? 'Ví MoMo/ZaloPay' : 'Thanh toán khi nhận hàng')}</div>
            <div><strong style="color: #94A3B8;">Tổng thanh toán:</strong> <strong style="color: #F59E0B; font-size: 16px;">${SalonUtils.formatCurrency(finalAmount)}</strong></div>
          </div>

          ${isVietQr ? `
            <!-- Ma QR chuyen khoan truc tiep -->
            <div style="background: #FFFFFF; border-radius: 12px; padding: 18px; margin-bottom: 24px; color: #0F172A; text-align: center;">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Mã VietQR Thanh Toán Ngân Hàng</div>
              <div style="font-size: 12px; color: #64748B; margin-bottom: 12px;">Mở ứng dụng ngân hàng và quét mã để chuyển khoản tự động</div>
              <img src="${vietQrUrl}" alt="Mã VietQR Thanh Toán" style="max-width: 240px; width: 100%; border-radius: 8px; margin: 0 auto 12px; display: block;" onerror="this.style.display='none'">
              <div style="font-size: 12.5px; line-height: 1.6; text-align: left; background: #F8FAFC; padding: 12px; border-radius: 8px;">
                <div><strong>Ngân hàng:</strong> MB Bank</div>
                <div><strong>Số tài khoản:</strong> 0908123456</div>
                <div><strong>Chủ tài khoản:</strong> OMNI SALON VIETNAM</div>
                <div><strong>Nội dung:</strong> OMNI ${orderCode}</div>
              </div>
            </div>
          ` : ''}

          <div style="display: flex; gap: 12px; justify-content: center;">
            <button type="button" class="cart-primary-action-btn" onclick="if(window.AppRouter) window.AppRouter.navigate('/shop');">
              ← Tiếp Tục Mua Sắm
            </button>
            <button type="button" class="checkout-back-btn" style="flex: 0 0 auto; padding: 0 20px;" onclick="if(window.AppRouter) window.AppRouter.navigate('/');">
              Về Trang Chủ
            </button>
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
        window.UICommon.showToast('Đã xóa sản phẩm khỏi giỏ hàng');
      }
    },

    clearAll() {
      if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?')) return;
      if (window.store && typeof window.store.clearCart === 'function') {
        window.store.clearCart();
      }
      if (window.UICommon) {
        window.UICommon.updateCartBadges();
        window.UICommon.showToast('Đã xóa toàn bộ giỏ hàng');
      }
      this.refresh();
    },

    applyVoucher() {
      const input = document.getElementById('cartPageCouponInput');
      const code = (input ? input.value : '').trim().toUpperCase();
      if (!code) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập mã giảm giá', 'warning');
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

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    refresh() {
      const container = document.getElementById('webMainContainer');
      if (container) {
        this.render(container);
      }
    },

    _bindEvents() {
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
