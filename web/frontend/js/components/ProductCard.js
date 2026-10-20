// =========================================================================
// Omni Salon — PRODUCT CARD ATOMIC COMPONENT (Product Design Standard)
// Kiến trúc Clean Architecture: Tách rời UI, Micro-interactions & State
// Loại bỏ AI Prototype Glow / Neon / Pill Bloat — Chuẩn E-Commerce Cao Cấp
// =========================================================================

(function (window) {
  'use strict';

  const ProductCard = {
    // ---------------------------------------------------------------------
    // 1. WISHLIST ENGINE (Lưu trữ danh sách yêu thích cục bộ)
    // ---------------------------------------------------------------------
    getWishlist() {
      try {
        const raw = localStorage.getItem('omni_wishlist');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    isWishlisted(productId) {
      if (!productId) return false;
      const list = this.getWishlist();
      return list.includes(String(productId));
    },

    toggleWishlist(productId, event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (!productId) return false;

      let list = this.getWishlist();
      const idStr = String(productId);
      const isExist = list.includes(idStr);

      if (isExist) {
        list = list.filter(id => id !== idStr);
      } else {
        list.push(idStr);
      }

      try {
        localStorage.setItem('omni_wishlist', JSON.stringify(list));
      } catch (e) {
        console.warn('Lỗi lưu wishlist:', e);
      }

      // Cập nhật DOM của tất cả các nút wishlist của sản phẩm này trên trang
      const buttons = document.querySelectorAll(`[data-wishlist-id="${idStr}"]`);
      buttons.forEach(btn => {
        btn.classList.toggle('active', !isExist);
        btn.setAttribute('aria-pressed', (!isExist).toString());
        btn.title = !isExist ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích';
        const svg = btn.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', !isExist ? '#ef4444' : 'none');
          svg.setAttribute('stroke', !isExist ? '#ef4444' : 'currentColor');
        }
      });

      // Toast thông báo ngắn gọn tinh tế
      if (typeof window.UICommon !== 'undefined' && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(!isExist ? 'Đã thêm vào danh sách yêu thích' : 'Đã xóa khỏi yêu thích', 'info');
      }

      return !isExist;
    },

    // ---------------------------------------------------------------------
    // 2. CHUẨN HOÁ DỮ LIỆU ĐẦU VÀO (Data Normalizer & Schema Safety)
    // ---------------------------------------------------------------------
    normalize(p) {
      if (!p) return null;

      const id = String(p.id || p.MaSanPham || '');
      const name = p.name || p.TenSanPham || 'Sản phẩm Omni Salon';
      const brand = p.brand || (p.TenDanhMuc ? p.TenDanhMuc.split(' - ')[0] : 'CHÍNH HÃNG');
      const actualPrice = Number(p.GiaBanThucTe !== undefined ? p.GiaBanThucTe : (p.price !== undefined ? p.price : 0));
      const originalPrice = Number(p.originalPrice !== undefined ? p.originalPrice : (p.GiaNiemYetGoc !== undefined ? p.GiaNiemYetGoc : (p.GiaBan !== undefined ? p.GiaBan : actualPrice)));

      // Tính chiết khấu
      let discountPercent = Number(p.PhanTramGiam || 0);
      if (!discountPercent && originalPrice > actualPrice && originalPrice > 0) {
        discountPercent = Math.round(((originalPrice - actualPrice) / originalPrice) * 100);
      }

      // Rating & Lượt mua thực tế
      const rating = Number(p.rating !== undefined ? p.rating : 5.0).toFixed(1);
      const reviewCount = Number(p.reviewCount || p.LuotMua || 0);

      // Tồn kho
      const stock = Number(p.stock !== undefined ? p.stock : (p.SoLuongTon !== undefined ? p.SoLuongTon : 0));

      // Hình ảnh
      const rawImg = p.image || p.HinhAnh || '';
      const image = (typeof window.SalonUtils !== 'undefined' && typeof window.SalonUtils.formatImageUrl === 'function')
        ? window.SalonUtils.formatImageUrl(rawImg)
        : (rawImg || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');

      // Mô tả sạch (loại bỏ thông tin nội bộ nhập hàng)
      const cleanDesc = (p.description || p.MoTa || 'Dòng sản phẩm tạo kiểu và dưỡng tóc nam cao cấp, chuẩn Barber chuyên nghiệp.')
        .replace(/\(Lô.*?cận hạn.*?\)/gi, '')
        .replace(/Lô CTPN\d+/gi, '')
        .trim();

      return {
        id,
        name,
        brand,
        actualPrice,
        originalPrice,
        discountPercent,
        rating,
        reviewCount,
        stock,
        image,
        cleanDesc,
        isFlashSale: discountPercent > 0 || p.isNearExpiry === true
      };
    },

    // ---------------------------------------------------------------------
    // 3. RENDER PRODUCT CARD (Clean E-Commerce Card — Radius 8px, No Neon)
    // ---------------------------------------------------------------------
    render(rawProduct, options = {}) {
      const data = this.normalize(rawProduct);
      if (!data) return '';

      const {
        onCardClick = `UICommon && UICommon.openProductDetailModal ? UICommon.openProductDetailModal('${data.id}') : null`,
        showAddToCart = true,
        showBuyNow = true
      } = options;

      const isWish = this.isWishlisted(data.id);
      const formatCurrency = (typeof window.SalonUtils !== 'undefined' && typeof window.SalonUtils.formatCurrency === 'function')
        ? window.SalonUtils.formatCurrency
        : (v => Number(v || 0).toLocaleString('vi-VN') + ' đ');

      const formattedActual = formatCurrency(data.actualPrice);
      const formattedOriginal = formatCurrency(data.originalPrice);

      // Tình trạng kho (Stock Status)
      let stockBadgeHtml = '';
      const isOutOfStock = data.stock <= 0;
      if (isOutOfStock) {
        stockBadgeHtml = `
          <span class="stock-indicator-badge out-of-stock" title="Sản phẩm tạm thời hết hàng">
            <span class="stock-dot"></span>Hết hàng
          </span>
        `;
      } else {
        stockBadgeHtml = `
          <span class="stock-indicator-badge in-stock" title="Hàng sẵn có tại kho">
            <span class="stock-dot"></span>Còn hàng
          </span>
        `;
      }

      // Nhãn giảm giá phẳng (không neon glow)
      const discountBadgeHtml = data.discountPercent > 0 ? `
        <span class="flat-discount-badge" aria-label="Giảm giá ${data.discountPercent}%">
          -${data.discountPercent}%
        </span>
      ` : '';

      // Hiển thị giá (Cố định min-height để các card luôn thẳng hàng tăm tắp)
      const priceDisplayHtml = (data.originalPrice > data.actualPrice && data.discountPercent > 0) ? `
        <div class="product-price-row">
          <span class="product-price-current">${formattedActual}</span>
          <span class="product-price-original">${formattedOriginal}</span>
        </div>
      ` : `
        <div class="product-price-row">
          <span class="product-price-current">${formattedActual}</span>
        </div>
      `;

      return `
        <article class="product-clean-card ${isOutOfStock ? 'is-out-of-stock' : ''}" 
                 id="productCard_${data.id}"
                 data-product-id="${data.id}">
          
          <!-- HÌNH ẢNH SẢN PHẨM SẠCH (KHÔNG BỊ NÚT TRÁI TIM CHE ĐÈ) -->
          <div class="product-media-wrapper" onclick="${onCardClick}">
            <img src="${data.image}" 
                 alt="${data.name}"
                 loading="lazy"
                 draggable="false"
                 class="product-clean-img"
                 onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');">
            
            <!-- Nhãn Giảm Giá Phẳng Tinh Tế Góc Trên -->
            ${discountBadgeHtml}
          </div>

          <!-- NỘI DUNG SẢN PHẨM -->
          <div class="product-body">
            <!-- Thương hiệu & Tình trạng kho -->
            <div class="product-meta-header">
              <span class="product-brand-tag" title="Thương hiệu">${data.brand}</span>
              ${stockBadgeHtml}
            </div>

            <!-- Tên sản phẩm -->
            <h3 class="product-title-clean font-serif tracking-tight leading-tight" 
                title="${data.name}" 
                onclick="${onCardClick}">
              ${data.name}
            </h3>

            <!-- Đánh giá sao & Lượt mua -->
            <div class="product-rating-row" aria-label="Đánh giá ${data.rating} sao trên 5${data.reviewCount > 0 ? `, ${data.reviewCount} lượt mua` : ''}">
              <span class="product-star-badge" style="display: inline-flex; align-items: center; gap: 3px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#C59B27" stroke="none" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>${data.rating}</span>
              </span>
              <span class="product-sales-count">• ${data.reviewCount > 0 ? `${data.reviewCount} đã bán` : 'Chính hãng'}</span>
            </div>

            <!-- Giá sản phẩm (Cố định chiều cao căn thẳng hàng) -->
            ${priceDisplayHtml}
          </div>

          <!-- NÚT HÀNH ĐỘNG CHUẨN BARBER -->
          <div class="product-actions-footer" style="display: flex; gap: 8px; align-items: center; width: 100%;">
            ${showAddToCart ? `
            <button type="button"
                    class="btn-barber-add-cart ${isOutOfStock ? 'disabled' : ''}"
                    style="flex: 1 1 50%; min-width: 0; white-space: nowrap !important;"
                    ${isOutOfStock ? 'disabled' : ''}
                    onclick="if(typeof UICommon !== 'undefined' && UICommon.addToCart){ UICommon.addToCart('${data.id}', 'product'); if(typeof ShopPage !== 'undefined' && ShopPage.updateCartBadge) ShopPage.updateCartBadge(); }">
              ${!isOutOfStock ? `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0;">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                  <line x1="3" x2="21" y1="6" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              ` : ''}
              <span style="white-space: nowrap !important;">${isOutOfStock ? 'Hết Hàng' : 'Thêm Giỏ'}</span>
            </button>
            ` : ''}
            ${!isOutOfStock ? `
            <button type="button"
                    class="btn-barber-buy-now"
                    style="flex: 1 1 ${showAddToCart ? '50%' : '100%'}; width: ${showAddToCart ? '50%' : '100%'}; min-width: 0; white-space: nowrap !important; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 4px;"
                    onclick="if(typeof UICommon !== 'undefined' && UICommon.buyNow){ UICommon.buyNow('${data.id}'); if(typeof ShopPage !== 'undefined' && ShopPage.updateCartBadge) ShopPage.updateCartBadge(); }">
              <span style="white-space: nowrap !important; display: inline-block;">Mua Ngay</span>
              <span style="font-size: 13px;">→</span>
            </button>
            ` : ''}
          </div>

        </article>
      `;
    },

    // ---------------------------------------------------------------------
    // 4. SKELETON LOADING STATE (Khớp 100% layout và kích thước của Card)
    // ---------------------------------------------------------------------
    renderSkeleton(count = 4) {
      const items = Array.from({ length: count });
      return items.map(() => `
        <div class="product-clean-card skeleton-card" aria-hidden="true">
          <div class="product-media-wrapper skeleton-box" style="aspect-ratio: 1; border-radius: 6px;"></div>
          <div class="product-body" style="gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div class="skeleton-box" style="width: 70px; height: 14px; border-radius: 4px;"></div>
              <div class="skeleton-box" style="width: 60px; height: 14px; border-radius: 4px;"></div>
            </div>
            <div class="skeleton-box" style="width: 90%; height: 18px; border-radius: 4px;"></div>
            <div class="skeleton-box" style="width: 65%; height: 18px; border-radius: 4px;"></div>
            <div class="skeleton-box" style="width: 100px; height: 14px; border-radius: 4px;"></div>
            <div class="skeleton-box" style="width: 120px; height: 22px; border-radius: 4px; margin-top: 4px;"></div>
          </div>
          <div class="product-actions-footer">
            <div class="skeleton-box" style="flex: 1; height: 40px; border-radius: 8px;"></div>
            <div class="skeleton-box" style="width: 85px; height: 40px; border-radius: 8px;"></div>
          </div>
        </div>
      `).join('');
    },

    // ---------------------------------------------------------------------
    // 5. EMPTY STATE (Thiết kế phẳng, rõ ràng, không AI bloat)
    // ---------------------------------------------------------------------
    renderEmptyState(options = {}) {
      const {
        title = 'Không tìm thấy sản phẩm phù hợp',
        description = 'Quý khách vui lòng thử tìm kiếm với từ khóa khác hoặc thiết lập lại bộ lọc.',
        onReset = 'ShopPage.resetFilters ? ShopPage.resetFilters() : null'
      } = options;

      return `
        <div class="catalog-empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon-box">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
          <h3 class="empty-state-title">${title}</h3>
          <p class="empty-state-desc">${description}</p>
          <button type="button" class="btn-flat-cta btn-flat-outline" onclick="${onReset}">
            Thiết Lập Lại Bộ Lọc
          </button>
        </div>
      `;
    },

    // ---------------------------------------------------------------------
    // 6. ERROR STATE (Xử lý sự cố mạng / tải dữ liệu lỗi)
    // ---------------------------------------------------------------------
    renderErrorState(options = {}) {
      const {
        message = 'Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.',
        onRetry = 'ShopPage.refreshCatalog ? ShopPage.refreshCatalog() : location.reload()'
      } = options;

      return `
        <div class="catalog-empty-state catalog-error-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon-box error">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 class="empty-state-title">Đã xảy ra sự cố</h3>
          <p class="empty-state-desc">${message}</p>
          <button type="button" class="btn-flat-cta btn-flat-primary" onclick="${onRetry}">
            Thử Lại
          </button>
        </div>
      `;
    }
  };

  // Xuất ra toàn cục
  window.ProductCard = ProductCard;

})(typeof window !== 'undefined' ? window : this);
